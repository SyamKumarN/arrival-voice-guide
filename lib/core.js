// core.js — the API logic, shared by the Docker server (server.js) and the
// hosted functions (api/*.js). Keys are read from the environment only.

import { readFileSync } from 'node:fs';

const env = (k, d = '') => process.env[k] || d;

export const SAMPLE_RATES = JSON.parse(
  readFileSync(new URL('../public/data/rates-sample.json', import.meta.url), 'utf8'));
const NEEDED = Object.keys(SAMPLE_RATES.rates);
const RATES_TTL_MS = 30 * 60 * 1000;

/** Which optional upgrades have keys (true/false only, never the keys). */
export function config() {
  return { naturalVoice: !!env('SARVAM_API_KEY'), askAnything: !!env('ANTHROPIC_API_KEY') };
}

// ---------- Rates: live, cached, with silent fallback ----------
let ratesCache = null;            // { at, body }

export async function getRates() {
  if (ratesCache && Date.now() - ratesCache.at < RATES_TTL_MS) return ratesCache.body;
  try {
    const r = await fetch(env('RATES_URL', 'https://open.er-api.com/v6/latest/USD'), { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error('status ' + r.status);
    const j = await r.json();
    const rates = {};
    for (const c of NEEDED) {
      const v = Number(j.rates && j.rates[c]);
      if (!Number.isFinite(v) || v <= 0) throw new Error('missing ' + c);
      rates[c] = v;
    }
    const updated = j.time_last_update_unix ? new Date(j.time_last_update_unix * 1000).toISOString() : new Date().toISOString();
    const body = { source: 'live', base: 'USD', date: updated.slice(0, 10), updated, rates };
    ratesCache = { at: Date.now(), body };
    return body;
  } catch {
    // No network, blocked, or odd data: use the bundled file. Retry live after a minute.
    const body = { ...SAMPLE_RATES, source: 'sample' };
    ratesCache = { at: Date.now() - RATES_TTL_MS + 60 * 1000, body };
    return body;
  }
}

// ---------- Optional upgrade: natural voice (Sarvam text-to-speech) ----------
export async function tts({ text, lang }) {
  const r = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': env('SARVAM_API_KEY') },
    body: JSON.stringify({
      text: String(text || '').slice(0, 1500),
      target_language_code: ['en-IN', 'hi-IN', 'te-IN'].includes(lang) ? lang : 'hi-IN',
      model: env('SARVAM_TTS_MODEL', 'bulbul:v2'),
      speaker: env('SARVAM_SPEAKER', 'anushka'),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error('voice service ' + r.status);
  const j = await r.json();
  const audio = j.audios && j.audios[0];
  if (!audio) throw new Error('no audio');
  return { audio };
}

// ---------- Optional upgrade: free-form questions (Claude) ----------
let anthropic = null;
export async function ask({ question, lang, airport, terminal }) {
  if (!anthropic) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');   // only loaded when a key is set
    anthropic = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') });
  }
  const language = { 'en-IN': 'English', 'hi-IN': 'Hindi (Devanagari script)', 'te-IN': 'Telugu' }[lang] || 'English';
  const res = await anthropic.beta.messages.create({
    model: env('AI_MODEL', 'claude-opus-5-5'),
    max_tokens: 400,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system:
      'You help Indian travellers who have just landed at an airport, mostly about changing money. ' +
      `Reply in ${language}, in two or three short spoken sentences, plain and friendly. ` +
      'No lists, no markdown. If you are not sure about a specific counter or location, say so and suggest asking airport staff. ' +
      'Never give investment advice.' +
      (airport ? ` The traveller is at ${airport}${terminal ? ' ' + terminal : ''}.` : ''),
    messages: [{ role: 'user', content: String(question || '').slice(0, 500) }],
  });
  if (res.stop_reason === 'refusal') return { answer: '' };
  const answer = res.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim();
  return { answer };
}

/**
 * One handler for every /api route, so the Docker server and the hosted
 * functions behave the same. Returns { status, body }.
 */
export async function handleApi(pathname, method, readJson) {
  try {
    if (pathname === '/api/config' && method === 'GET') return { status: 200, body: config() };
    if (pathname === '/api/rates' && method === 'GET') return { status: 200, body: await getRates() };
    if (pathname === '/api/health') return { status: 200, body: { ok: true } };
    if (pathname === '/api/tts' && method === 'POST') {
      if (!env('SARVAM_API_KEY')) return { status: 503, body: { error: 'key not set' } };
      return { status: 200, body: await tts(await readJson()) };
    }
    if (pathname === '/api/ask' && method === 'POST') {
      if (!env('ANTHROPIC_API_KEY')) return { status: 503, body: { error: 'key not set' } };
      return { status: 200, body: await ask(await readJson()) };
    }
    return { status: 404, body: { error: 'not found' } };
  } catch (e) {
    // Don't echo upstream errors (they can contain request details).
    console.error('api failed:', e.message);
    return { status: 502, body: { error: 'upstream failed' } };
  }
}

export const API_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
