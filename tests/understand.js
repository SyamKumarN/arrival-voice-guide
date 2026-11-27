// understand.js tests — the optional AI fallback, without any key or network.
// The AI only fills in a fixed form; these check the form → our own answer, and the guards.

import { toSentence, clean, SCHEMA, INTENTS } from '../public/js/understand.js';
import { handle, initialState } from '../public/js/dialog.js';

export async function runUnderstand(data, rates) {
  const out = [];
  const check = (name, ok, detail = '') => out.push({ group: 'ai fallback', name, ok: !!ok, detail });
  const answer = (form, lang = 'en-IN', state = initialState(lang)) => {
    const sentence = toSentence(form);
    return { sentence, r: sentence ? handle(state, sentence, data, rates) : null };
  };
  const F = (o) => ({ intent: 'none', airport: 'none', terminal: 'none', amounts: [], currency: 'none', ...o });

  // Each form becomes one of our own replies
  const cases = [
    ['exchange at Dubai T3 → confirm', F({ intent: 'exchange', airport: 'DXB', terminal: 'T3' }), (r) => r.reply.kind === 'confirm' && r.state.terminal === 'T3'],
    ['ATM at Bengaluru T1 → our ATM data', F({ intent: 'atm_where', airport: 'BLR', terminal: 'T1' }), (r) => r.reply.text.includes('kerbside')],
    ['amount query → fair amount from our rates', F({ intent: 'amount_query', amounts: [{ amount: 500, currency: 'USD' }], currency: 'AED' }), (r) => r.reply.kind === 'amount' && r.reply.text.includes('1,836')],
    ['price check with two amounts → price card', F({ intent: 'price_check', amounts: [{ amount: 500, currency: 'USD' }, { amount: 1700, currency: 'AED' }] }), (r) => r.reply.kind === 'price'],
    ['traps → the traps list', F({ intent: 'traps' }), (r) => r.reply.kind === 'tips' && r.reply.tips.key === 'traps'],
    ['food → staff card', F({ intent: 'food', airport: 'BKK' }), (r) => r.reply.kind === 'offtopic' && r.reply.staff.airport === 'BKK'],
    ['no staff → info desk + card', F({ intent: 'no_staff' }), (r) => r.reply.topic === 'nostaff'],
    ['app help → Save for my trip', F({ intent: 'app_help' }), (r) => r.reply.topic === 'apphelp'],
    ['leftover currency → the tip', F({ intent: 'leftover_currency' }), (r) => r.reply.topic === 'leftover'],
  ];
  for (const [name, form, ok] of cases) {
    const { sentence, r } = answer(form);
    check(name, r && !r.unknown && ok(r), `${sentence} → ${r && r.reply.text}`);
  }
  // Telugu speaker: the answer comes back in Telugu, from our phrases
  {
    const { r } = answer(F({ intent: 'amount_query', amounts: [{ amount: 100, currency: 'USD' }], currency: 'THB' }), 'te-IN');
    check('reply is in the user\'s language (Telugu)', r && /[ఀ-౿]/.test(r.reply.text), r && r.reply.text);
  }
  // Every intent in the list maps to something our rules understand
  for (const intent of INTENTS.filter((i) => !['none', 'amount_query', 'price_check', 'yes', 'no'].includes(i))) {
    const { sentence, r } = answer(F({ intent, airport: 'DXB', terminal: 'T1' }));
    check(`intent "${intent}" is understood by the rules`, r && !r.unknown, sentence);
  }

  // Guards: anything off the list is dropped, never passed on
  const bad = clean({ intent: 'write_answer', airport: 'LHR', terminal: 'T9', amounts: [{ amount: -5, currency: 'XYZ' }, { amount: 1e12, currency: 'USD' }], currency: 'BTC' });
  check('off-list values are dropped (no invented airports, intents or amounts)',
    bad.intent === 'none' && bad.airport === null && bad.terminal === null && bad.amounts.length === 0 && bad.currency === null, JSON.stringify(bad));
  check('garbage gives no sentence', toSentence('not json') === '' && toSentence(null) === '' && toSentence(F({})) === '');
  check('schema allows no extra fields', SCHEMA.additionalProperties === false && SCHEMA.required.length === 5);

  // Server: no key → "key not set", nothing called; config never contains a key
  const saved = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  const core = await import('../lib/core.js');
  const res = await core.handleApi('/api/understand', 'POST', async () => ({ text: 'hello' }), { ip: '1.2.3.4' });
  check('without AI_API_KEY: /api/understand says key not set', res.status === 503 && res.body.error === 'key not set', JSON.stringify(res));
  process.env.AI_API_KEY = 'test-not-a-real-key';
  const cfg = core.config();
  check('config shows on/off only, never the key', cfg.aiUnderstanding === true && !JSON.stringify(cfg).includes('test-not'), JSON.stringify(cfg));
  if (saved === undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY = saved;

  // Rate limit: 12 a minute per visitor, then refused; another visitor still allowed; resets after a minute
  const t0 = 1e12;
  let okCount = 0;
  for (let i = 0; i < 15; i++) if (core.rateLimitOk('9.9.9.9', t0 + i)) okCount++;
  check('rate limit: 12 per minute per visitor', okCount === 12, String(okCount));
  check('rate limit: other visitors unaffected', core.rateLimitOk('8.8.8.8', t0 + 20));
  check('rate limit: resets after a minute', core.rateLimitOk('9.9.9.9', t0 + 61000));
  return out;
}
