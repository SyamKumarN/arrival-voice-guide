// main.js — the screen, the microphone ("Hear") and the voice ("Speak back").
// The thinking lives in js/dialog.js; this file only wires it to the page.

import { handle, initialState, currentRoute, stepText } from './js/dialog.js';
import { parse, score } from './js/parser.js';
import { ui, say, terminalLabel, currencyName, staffLines, STAFF_VOICE, STAFF_DIR, speakable } from './js/phrases.js';
import { formatMoney } from './js/price.js';
import { pick, short } from './js/text.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const app = {
  state: initialState(store.get('lang') || 'hi-IN'),
  data: null,
  rates: null,
  config: { naturalVoice: false, askAnything: false },
  lastReply: null,
  lastPrice: null,
  heard: '',
  status: 'idle',           // idle | listening | speaking | thinking
};

// ---------- Loading: data, rates (live with silent fallback), upgrades ----------
async function getJSON(url, ms = 4000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function load() {
  app.data = await getJSON('data/airports.json');
  try {
    const live = await getJSON('/api/rates');
    if (!live || !live.rates || !live.rates.AED) throw new Error('bad rates');
    app.rates = live;
  } catch {
    app.rates = { ...(await getJSON('data/rates-sample.json')), source: 'sample' };
  }
  try { app.config = await getJSON('/api/config', 2500); } catch { /* no server: no upgrades */ }
}

// ---------- Speak back ----------
const synth = window.speechSynthesis;
let voices = [];
function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

/** Best installed voice for "hi-IN": exact match, then same language, prefer Google voices. */
function voiceFor(lang) {
  const l = short(lang);
  const exact = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  const same = voices.filter((v) => v.lang.toLowerCase().startsWith(l));
  const list = exact.length ? exact : same;
  return list.find((v) => /google/i.test(v.name)) || list[0] || null;
}

let audioEl = null;
let speakToken = 0;

function stopSpeaking() {
  speakToken++;
  if (synth) synth.cancel();
  if (audioEl) { audioEl.pause(); audioEl = null; }
}

/** Speak text in the chosen language, a sentence at a time (long utterances get cut off in Chrome). */
async function speak(text, lang) {
  // The mic is always off while the guide talks, so it never hears itself.
  muteMic();
  stopSpeaking();
  const token = ++speakToken;
  setStatus('speaking');
  const done = () => { if (token === speakToken) { setStatus('idle'); afterSpeaking(); } };

  // Optional upgrade: natural voice from the server, if its key is set.
  if (app.config.naturalVoice) {
    try {
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang }) });
      if (r.ok) {
        const { audio } = await r.json();
        if (token !== speakToken) return;
        audioEl = new Audio('data:audio/wav;base64,' + audio);
        audioEl.onended = done; audioEl.onerror = done;
        await audioEl.play();
        return;
      }
    } catch { /* fall back to the browser voice */ }
  }

  // Chrome loads its voice list a moment after the page opens.
  if (synth && !voices.length) { await new Promise((r) => setTimeout(r, 800)); loadVoices(); }
  if (token !== speakToken) return;
  const voice = voiceFor(lang);
  if (!synth || !voice) {
    showNotice(ui(lang).noVoiceOut);
    setStatus('idle');
    return;                         // text is on screen; don't auto-listen without the voice
  }
  showNotice('');
  const parts = text.split(/(?<=[.!?।])\s+/).filter(Boolean);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice.lang; u.voice = voice; u.rate = short(lang) === 'en' ? 1 : 0.95;
    if (i === parts.length - 1) { u.onend = done; u.onerror = done; }
    synth.speak(u);
  });
}

// ---------- Hear ----------
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;

function startListening() {
  if (!Recognition) { showNotice(ui(app.state.lang).noVoiceIn); return; }
  stopSpeaking();                 // a tap on the mic interrupts the guide
  muteMic();
  rec = new Recognition();
  rec.lang = app.state.lang;
  rec.interimResults = true;
  rec.maxAlternatives = 4;
  rec.continuous = false;
  let finalAlts = null;

  rec.onstart = () => setStatus('listening');
  rec.onresult = (e) => {
    if (app.status === 'speaking') return;      // never take in anything heard mid-speech
    const res = e.results[e.results.length - 1];
    showHeard(res[0].transcript, !res.isFinal);
    if (res.isFinal) finalAlts = Array.from(res).map((a) => a.transcript);
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') showNotice(ui(app.state.lang).noVoiceIn);
  };
  rec.onend = () => {
    rec = null;
    if (app.status === 'listening') setStatus('idle');
    if (finalAlts) submit(bestAlternative(finalAlts));
  };
  try { rec.start(); } catch { setStatus('idle'); }
}

/** Stop listening and keep what was heard (the user tapped the mic again). */
function stopListening() { if (rec) { try { rec.stop(); } catch { /* ignore */ } } }

/** Switch the mic off and throw away anything half-heard (used before the guide speaks). */
let relistenTimer = null;
function muteMic() {
  clearTimeout(relistenTimer);
  if (!rec) return;
  const r = rec;
  rec = null;
  r.onresult = null; r.onend = null; r.onerror = null;
  try { r.abort(); } catch { /* already stopped */ }
  if (app.status === 'listening') setStatus('idle');
}

/** The speech engine offers a few guesses; keep the one we understand best. */
function bestAlternative(alts) {
  const ctx = { expecting: app.state.expecting };
  let best = alts[0], bestScore = -1;
  for (const a of alts) {
    const s = score(parse(a, ctx));
    if (s > bestScore) { best = a; bestScore = s; }
  }
  return best;
}

/** Hands-free: after the guide finishes talking, listen for "next / repeat / can't find". */
function afterSpeaking() {
  if (!$('staffCard').hidden) return;      // the card is open: someone is reading it, don't listen
  const waiting = ['route', 'ask', 'lost'].includes(app.state.mode);
  if (!($('handsFree').checked && waiting && Recognition && app.micUsed)) return;
  // Short pause so the speaker's last syllable isn't picked up by the mic.
  clearTimeout(relistenTimer);
  relistenTimer = setTimeout(() => { if (app.status === 'idle' && !rec) startListening(); }, 400);
}

// ---------- One turn: text in → reply out ----------
async function submit(text) {
  text = String(text || '').trim();
  if (!text) return;
  app.heard = text;
  showHeard(text, false);
  const out = handle(app.state, text, app.data, app.rates);
  app.state = out.state;
  app.lastReply = out.reply;
  if (out.reply.kind === 'price') app.lastPrice = out.reply.price;
  if (out.parsed && out.parsed.command === 'restart') app.lastPrice = null;

  // Free-form question and an AI key is set: let the server answer instead.
  if (out.unknown && app.config.askAnything) {
    setStatus('thinking');
    try {
      const r = await fetch('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, lang: app.state.lang, airport: app.state.airport, terminal: app.state.terminal }),
      });
      if (r.ok) { const { answer } = await r.json(); if (answer) app.lastReply = { kind: 'answer', text: answer }; }
    } catch { /* keep the rule-based reply */ }
  }
  render();
  if (app.lastReply.staff) {
    // "ask staff": read the card out. A "not available here" answer: speak it, card opens quietly.
    openStaffCard(app.lastReply.staff, app.lastReply.kind === 'staff');
    if (app.lastReply.kind === 'staff') return;
  }
  speak(app.lastReply.text, app.state.lang);
}

// ---------- Ask-staff card ----------
let staffShown = null;          // { intent, airport }

function openStaffCard(staff, readAloud) {
  staffShown = { ...staff };
  renderStaffCard();
  $('staffCard').hidden = false;
  $('staffClose').focus();
  if (readAloud) speakStaff();
}

function staffCardLines() {
  const airportLang = staffShown.airport ? app.data.airports[staffShown.airport].staffLanguage : null;
  return staffLines(staffShown.intent, airportLang, app.state.lang);
}

function renderStaffCard() {
  if (!staffShown) return;
  const L = ui(app.state.lang);
  const lines = staffCardLines();
  const local = lines.length > 1 ? lines[0] : null;
  const en = lines[lines.length - 1];
  $('staffCardTitle').textContent = L.staffTitle;
  $('staffLocal').hidden = !local;
  if (local) {
    $('staffLocal').textContent = local.text;
    $('staffLocal').lang = local.lang;
    $('staffLocal').dir = STAFF_DIR[local.lang] || 'ltr';
  }
  $('staffEn').textContent = en.text;
  $('staffEn').lang = 'en';
  $('staffSpeak').textContent = L.readAloud;
  $('staffClose').textContent = L.close;
  const tabs = $('staffTabs');
  tabs.innerHTML = '';
  ['exchange', 'sim', 'taxi'].forEach((d) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = L.dest[d];
    b.setAttribute('aria-pressed', String(d === staffShown.intent));
    b.onclick = () => { staffShown.intent = d; renderStaffCard(); speakStaff(); };
    tabs.append(b);
  });
}

/** Read the card in the local language if this device has that voice, else in English. */
function speakStaff() {
  if (!staffShown) return;
  const lines = staffCardLines();
  const withVoice = lines.find((l) => voiceFor(STAFF_VOICE[l.lang])) || lines[lines.length - 1];
  speak(speakable(withVoice.text), STAFF_VOICE[withVoice.lang]);
}

function closeStaffCard() {
  $('staffCard').hidden = true;
  staffShown = null;
  stopSpeaking();
  setStatus('idle');
  $('staffBtn').focus();
}

// ---------- Screen ----------
function setStatus(s) {
  app.status = s;
  const L = ui(app.state.lang);
  const mic = $('micBtn');
  mic.classList.toggle('listening', s === 'listening');
  mic.classList.toggle('speaking', s === 'speaking');
  $('micStatus').textContent = { idle: L.tap, listening: L.listening, speaking: L.speaking, thinking: L.thinking }[s];
  mic.setAttribute('aria-label', $('micStatus').textContent);
}

function showHeard(text, interim) {
  $('heard').hidden = !text;
  $('heardText').textContent = '“' + text + '”' + (interim ? '…' : '');
}

function showNotice(msg) { $('notice').hidden = !msg; $('notice').textContent = msg || ''; }

function render() {
  const { state, data } = app;
  const lang = state.lang;
  const L = ui(lang);
  document.documentElement.lang = short(lang);

  // Language chips
  document.querySelectorAll('#langs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));

  // Static labels
  $('restartBtn').textContent = L.restart;
  $('repeatBtn').textContent = L.repeat;
  $('nextBtn').textContent = L.next;
  $('cantBtn').textContent = L.cantFind;
  $('staffBtn').textContent = L.askStaff;
  // Step buttons only make sense while a route is being read out
  $('nextBtn').disabled = state.mode !== 'route';
  $('cantBtn').disabled = state.mode !== 'route';
  $('repeatBtn').disabled = !['route', 'done'].includes(state.mode);
  $('sendBtn').textContent = L.send;
  $('typeInput').placeholder = L.typeHere;
  $('youSaidLabel').textContent = L.youSaid + ':';
  $('stepsTitle').textContent = L.steps + ' · ' + L.dest[state.dest || 'exchange'];
  $('tryTitle').textContent = L.tryTitle;
  $('priceTitle').textContent = L.priceTitle;
  $('offeredLabel').textContent = L.offered;
  $('fairLabel').textContent = L.fairAmt;
  $('handsFreeLabel').textContent = L.handsFree;
  setStatus(app.status);

  // Where you are
  const place = $('place');
  place.innerHTML = '';
  const pill = (txt, empty) => { const s = document.createElement('span'); s.className = 'pill' + (empty ? ' empty' : ''); s.textContent = txt; place.append(s); };
  if (state.airport) {
    pill(pick(data.airports[state.airport].name, lang) + ' · ' + state.airport);
    if (state.terminal) pill(terminalLabel(state.terminal, lang));
  } else pill(L.noAirport, true);

  // Reply
  $('reply').textContent = app.lastReply ? app.lastReply.text : say(lang, 'hello');

  // Route
  const route = currentRoute(state, data);
  const showRoute = route && (state.mode === 'route' || state.mode === 'done');
  $('stepsCard').hidden = !showRoute;
  if (showRoute) {
    $('best').innerHTML = '';
    $('best').hidden = !route.counter;          // SIM and taxi routes have no counter to rate
    if (route.counter) {
      const b = document.createElement('div');
      b.textContent = L.best + ': ' + pick(route.counter.name, lang);
      const loc = document.createElement('span');
      loc.textContent = pick(route.counter.location, lang);
      b.append(loc);
      $('best').append(b);
    }
    $('checked').textContent = route.pendingData ? L.pending
      : route.lastChecked ? `${L.lastChecked}: ${new Date(route.lastChecked).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}` : '';

    const ol = $('steps');
    ol.innerHTML = '';
    route.steps.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = pick(s.text, lang);
      if (state.mode === 'done' || i < state.step) li.className = 'done';
      else if (i === state.step) { li.className = 'current'; li.setAttribute('aria-current', 'step'); }
      ol.append(li);
    });
    const warn = $('warnings');
    warn.innerHTML = '';
    route.avoid.forEach((c) => {
      const li = document.createElement('li'); li.className = 'avoid';
      li.textContent = `${L.avoid}: ${pick(c.name, lang)} (${pick(c.location, lang)})`;
      warn.append(li);
    });
    route.warnings.forEach((w) => { const li = document.createElement('li'); li.textContent = pick(w, lang); warn.append(li); });
    const cur = ol.querySelector('.current');
    if (cur && app.lastReply && app.lastReply.kind === 'step') cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Price check
  const c = app.lastPrice;
  $('priceCard').hidden = !c;
  if (c) {
    const rc = currencyName(c.received.currency, lang);
    $('offeredVal').textContent = `${formatMoney(c.offered)} ${rc}`;
    $('fairVal').textContent = `${formatMoney(c.fair)} ${rc}`;
    const badge = $('priceBadge');
    badge.className = 'badge ' + c.verdict;
    const sign = c.diffPct < 0 ? '−' : '+';
    badge.textContent = `${sign}${Math.abs(c.diffPct).toFixed(1)}% · ${say(lang, 'verdict')[c.verdict]}`;
    $('priceRate').textContent =
      `${formatMoney(c.given.amount)} ${currencyName(c.given.currency, lang)} → ${L.midRate}: 1 ${c.given.currency} = ${c.marketRate.toFixed(4)} ${c.received.currency}, ` +
      `offer: ${c.offeredRate.toFixed(4)}`;
  }

  // Try saying
  const tries = $('tries');
  tries.innerHTML = '';
  L.tries.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'try'; b.textContent = t;
    b.onclick = () => submit(t);
    tries.append(b);
  });

  // Footer: rates and upgrades
  const r = app.rates;
  const when = r.date || (r.updated ? r.updated.slice(0, 10) : '');
  $('ratesInfo').textContent = `${r.source === 'live' ? L.ratesLive : L.ratesSample} · ${when}`;
  const st = (on) => (on ? L.on : L.keyNotSet);
  $('upgrades').textContent = `${L.natural}: ${st(app.config.naturalVoice)} · ${L.askAny}: ${st(app.config.askAnything)}`;
}

// ---------- Events ----------
function bind() {
  document.querySelectorAll('#langs .chip').forEach((b) => {
    b.onclick = () => {
      app.state = { ...app.state, lang: b.dataset.lang };
      store.set('lang', b.dataset.lang);
      stopSpeaking(); stopListening();
      showNotice('');
      renderStaffCard();
      // Re-say the current step (or the greeting) in the new language
      const route = currentRoute(app.state, app.data);
      if (app.state.mode === 'route' && route) {
        app.lastReply = { kind: 'step', text: stepText(app.state, route) };
        render();
        speak(app.lastReply.text, app.state.lang);
      } else { app.lastReply = null; render(); }
    };
  });

  $('micBtn').onclick = () => {
    app.micUsed = true;
    if (app.status === 'listening') stopListening();
    else startListening();                  // also interrupts speech
  };
  $('nextBtn').onclick = () => submit('next');
  $('repeatBtn').onclick = () => submit('repeat');
  $('cantBtn').onclick = () => submit("can't find");
  $('staffBtn').onclick = () => submit('ask staff');
  $('staffSpeak').onclick = () => speakStaff();
  $('staffClose').onclick = () => closeStaffCard();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('staffCard').hidden) closeStaffCard(); });
  $('restartBtn').onclick = () => { app.lastPrice = null; submit('start over'); };
  $('typeForm').onsubmit = (e) => {
    e.preventDefault();
    const v = $('typeInput').value;
    $('typeInput').value = '';
    submit(v);
  };
  $('handsFree').checked = store.get('handsFree') !== '0';
  $('handsFree').onchange = (e) => store.set('handsFree', e.target.checked ? '1' : '0');
}

// ---------- Start ----------
(async function start() {
  bind();
  try { await load(); } catch (e) {
    $('reply').textContent = 'Could not load the guide data. Please reload.';
    return;
  }
  if (!Recognition) showNotice(ui(app.state.lang).noVoiceIn);
  render();
  // Handy for testing and demos: window.arrival.submit("next")
  window.arrival = { submit, get state() { return app.state; }, get rates() { return app.rates; }, get reply() { return app.lastReply; },
    get status() { return app.status; }, get micOn() { return !!rec; },
    get staff() { return $('staffCard').hidden ? null : { ...staffShown, local: $('staffLocal').hidden ? null : $('staffLocal').textContent, en: $('staffEn').textContent }; } };
})();
