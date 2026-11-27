// main.js — the screen, the microphone ("Hear") and the voice ("Speak back").
// The thinking lives in js/dialog.js; this file only wires it to the page.

import { handle, initialState, currentRoute, stepText, snapshot, restore } from './js/dialog.js';
import { parse, score } from './js/parser.js';
import { ui, say, terminalLabel, currencyName, staffLines, STAFF_VOICE, STAFF_DIR, speakable, LANG_TIP } from './js/phrases.js';
import { formatMoney } from './js/price.js';
import { pick, short } from './js/text.js';
import { createListener } from './js/listen.js';
import { formToParsed, buildContext } from './js/understand.js';
import { buildRoute } from './js/decide.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const app = {
  state: initialState(store.get('lang') || 'hi-IN'),
  data: null,
  rates: null,
  config: { naturalVoice: false, aiUnderstanding: false },
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
    if (live.source === 'live') store.set('rates', JSON.stringify(live));   // newest rates stay on the phone
  } catch {
    // Offline or no server: the last live rates this phone saw, else the bundled sample
    let saved = null;
    try { saved = JSON.parse(store.get('rates') || 'null'); } catch { /* ignore */ }
    app.rates = saved && saved.rates ? { ...saved, source: 'saved' } : { ...(await getJSON('data/rates-sample.json')), source: 'sample' };
  }
  try { app.config = await getJSON('/api/config', 2500); } catch { /* no server: no upgrades */ }
  // Warm the AI route up now, so the first sentence isn't slow (no AI call is made)
  if (app.config.aiUnderstanding && navigator.onLine !== false) {
    fetch('/api/understand', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"warmup":true}' }).catch(() => {});
  }
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
async function speak(text, lang, { keepNotice = false } = {}) {
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
        audioEl.playbackRate = $('slower').checked ? 0.8 : 1;
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
  if (!keepNotice) showNotice('');
  const parts = text.split(/(?<=[.!?।])\s+/).filter(Boolean);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice.lang; u.voice = voice;
    u.rate = (short(lang) === 'en' ? 1 : 0.95) * ($('slower').checked ? 0.75 : 1);   // "Speak slower"
    if (i === parts.length - 1) { u.onend = done; u.onerror = done; }
    synth.speak(u);
  });
}

// ---------- Hear ----------
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;

/** Speech recognition runs online. Without a connection, say so and point to the buttons. */
function voiceOffline() {
  const msg = say(app.state.lang, 'voiceNeedsNet');
  showNotice(msg);
  speak(msg, app.state.lang, { keepNotice: true });
}

function startListening() {
  if (!Recognition) { showNotice(ui(app.state.lang).noVoiceIn); return; }
  if (navigator.onLine === false) { voiceOffline(); return; }
  stopSpeaking();                 // a tap on the mic interrupts the guide
  muteMic();
  showNotice('');
  // One tap = one session: waits up to 8 s for the first word, stops 2 s after the
  // last one, restarts the engine when Android cuts it short. Second tap = done.
  const l = createListener({
    Recognition,
    lang: app.state.lang,
    onState: (st) => { if (st === 'listening') setStatus('listening'); else if (app.status === 'listening') setStatus('idle'); },
    onInterim: (text) => { if (app.status === 'listening') showHeard(text, true); },
    onDone: (alts, info) => {
      if (rec === l) rec = null;
      if (info && info.error === 'denied') showNotice(ui(app.state.lang).noVoiceIn);
      if (info && info.error === 'network') { setTimeout(voiceOffline, 0); return; }
      if (alts) submit(bestAlternative(alts));
    },
  });
  rec = l;
  l.start();
}

/** Second tap: stop now and keep what was heard. */
function stopListening() { if (rec) rec.finish(); }

/** Switch the mic off and throw away anything half-heard (used before the guide speaks). */
let relistenTimer = null;
function muteMic() {
  clearTimeout(relistenTimer);
  if (!rec) return;
  const r = rec;
  rec = null;
  r.cancel();
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
  const waiting = ['route', 'ask', 'lost', 'confirm', 'tips'].includes(app.state.mode);
  if (!($('handsFree').checked && waiting && Recognition && app.micUsed)) return;
  // Short pause so the speaker's last syllable isn't picked up by the mic.
  clearTimeout(relistenTimer);
  relistenTimer = setTimeout(() => { if (app.status === 'idle' && !rec) startListening(); }, 400);
}

// ---------- Keep the trip on the phone, so a refresh carries on (start over clears it) ----------
function rememberTrip() {
  try {
    if (!app.state.airport) store.set('trip', '');
    else store.set('trip', JSON.stringify(snapshot(app.state)));
  } catch { /* private mode: nothing saved */ }
}

// ---------- One turn: text in → reply out ----------
async function submit(text) {
  text = String(text || '').trim();
  if (!text) return;
  app.heard = text;
  showHeard(text, false);
  const before = app.state;
  let out = handle(before, text, app.data, app.rates);       // the rules: always ready, also offline

  // With an AI key: every sentence goes to the AI first, with the conversation so far.
  // It only fills in our fixed form; the answer comes from our own data via the same dialog.
  // No key, offline, or no answer within 4 seconds: the rules' reply stands.
  if (app.config.aiUnderstanding && navigator.onLine !== false) {
    setStatus('thinking');
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch('/api/understand', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ text, lang: before.lang, context: buildContext(before, app.data, app.lastReply, buildRoute) }),
      });
      clearTimeout(timer);
      if (r.ok) {
        const { form } = await r.json();
        const parsed = formToParsed(form, out.parsed, before);
        if (parsed) {
          const ai = handle(before, text, app.data, app.rates, { parsed });
          if (!ai.unknown) out = ai;
        }
      }
    } catch { /* timeout or offline: keep the rules' reply */ }
    if (app.status === 'thinking') setStatus('idle');
  }
  app.state = out.state;
  rememberTrip();
  app.lastReply = out.reply;
  if (out.reply.kind === 'price') app.lastPrice = out.reply.price;
  if (out.parsed && out.parsed.command === 'restart') app.lastPrice = null;

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
  $('staffTip').textContent = L.langTipTitle + ' ' + (LANG_TIP[short(app.state.lang)] || LANG_TIP.en);
  const tabs = $('staffTabs');
  tabs.innerHTML = '';
  // The three main questions, plus whatever else they asked about (toilet, metro, missing bag …)
  const topics = ['exchange', 'sim', 'taxi'];
  if (!topics.includes(staffShown.intent)) topics.push(staffShown.intent);
  topics.forEach((d) => {
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

/** "2026-10" → "October 2026"; "2026-11-27" → "27 Nov 2026", in the app language. */
function checkedDate(value, lang) {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d || 1);
  return date.toLocaleDateString(lang, d ? { day: 'numeric', month: 'short', year: 'numeric' } : { month: 'long', year: 'numeric' });
}

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
  // Step buttons only make sense while a route or a tip list is being read out
  $('nextBtn').disabled = !['route', 'tips'].includes(state.mode);
  $('cantBtn').disabled = state.mode !== 'route';
  $('repeatBtn').disabled = !['route', 'done', 'tips'].includes(state.mode);
  $('tipsBtn').textContent = L.tipsBtn;
  $('trapsBtn').textContent = L.trapsBtn;
  $('saveBtn').textContent = L.saveBtn;
  $('slowerLabel').textContent = L.slower;
  $('langTipTitle').textContent = L.langTipTitle;
  $('langTip').textContent = LANG_TIP[short(lang)] || LANG_TIP.en;
  $('installBtn').textContent = L.install;
  renderSaved();
  renderChoices();
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
      const unmeasured = route.counter.quality === 'unknown';   // rate not compared yet: don't call it "best"
      b.textContent = (unmeasured ? L.counter : L.best) + ': ' + pick(route.counter.name, lang);
      const loc = document.createElement('span');
      loc.textContent = pick(route.counter.location, lang);
      b.append(loc);
      if (unmeasured) { const n = document.createElement('span'); n.textContent = L.notMeasured; b.append(n); }
      $('best').append(b);
    }
    $('checked').textContent = route.pendingData ? L.pending
      : route.lastChecked ? `${L.lastChecked}: ${checkedDate(route.lastChecked, lang)}` : '';

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
  $('ratesInfo').textContent = `${r.source === 'live' ? L.ratesLive : r.source === 'saved' ? L.ratesSaved : L.ratesSample} · ${when}`;
  const st = (on) => (on ? L.on : L.keyNotSet);
  $('upgrades').textContent = `${L.natural}: ${st(app.config.naturalVoice)} · ${L.askAny}: ${st(app.config.aiUnderstanding)}`;
}

/** Big tap targets for the question just asked, so the guide works without voice (or offline). */
function renderChoices() {
  const { state, data } = app;
  const L = ui(state.lang);
  const box = $('choices');
  box.innerHTML = '';
  const add = (label, text, primary) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    if (primary) b.className = 'primary';
    b.onclick = () => submit(text);
    box.append(b);
  };
  if (state.expecting === 'airport') {
    for (const [code, a] of Object.entries(data.airports)) add(pick(a.name, state.lang), a.name.en);
  } else if (state.expecting === 'terminal' && state.airport) {
    for (const t of data.airports[state.airport].terminals) add(terminalLabel(t, state.lang), 'terminal ' + t.slice(1));
  } else if (state.expecting === 'confirm') {
    add(L.yes, 'yes', true);
    add(L.no, 'no');
  } else if (state.mode === 'tips') {
    add(L.next, 'next', true);
    add(L.repeat, 'repeat');
  }
}

// ---------- Save for my trip (offline) ----------
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; renderSaved(); });

function renderSaved() {
  const L = ui(app.state.lang);
  const savedAt = store.get('savedAt');
  const panel = $('savePanel');
  if (app.saveState === 'saving') { panel.hidden = false; $('saveStatus').textContent = L.saving; }
  else if (app.saveState === 'failed') { panel.hidden = false; $('saveStatus').textContent = L.saveFailed; }
  else if (savedAt) {
    panel.hidden = !app.saveOpen;
    const d = new Date(savedAt).toLocaleDateString(app.state.lang, { day: 'numeric', month: 'short' });
    $('saveStatus').textContent = L.saved(d, store.get('savedRatesDate') || (app.rates && app.rates.date) || '');
  } else panel.hidden = true;
  $('installBtn').hidden = !installPrompt;
}

async function saveTrip() {
  app.saveOpen = true;
  app.saveState = 'saving';
  renderSaved();
  try {
    if (!('serviceWorker' in navigator)) throw new Error('no offline support');
    const reg = await navigator.serviceWorker.ready;
    const ok = await new Promise((resolve) => {
      const onMsg = (e) => { if (e.data && e.data.type === 'trip-saved') { navigator.serviceWorker.removeEventListener('message', onMsg); resolve(e.data.ok); } };
      navigator.serviceWorker.addEventListener('message', onMsg);
      reg.active.postMessage({ type: 'save-trip', rates: app.rates });
      setTimeout(() => resolve(false), 15000);
    });
    if (!ok) throw new Error('not saved');
    store.set('savedAt', new Date().toISOString());
    store.set('savedRatesDate', app.rates.date || '');
    if (app.rates) store.set('rates', JSON.stringify(app.rates));
    app.saveState = 'saved';
  } catch {
    app.saveState = 'failed';
  }
  renderSaved();
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
  $('tipsBtn').onclick = () => submit('tips');
  $('trapsBtn').onclick = () => submit('traps');
  $('saveBtn').onclick = () => saveTrip();
  $('installBtn').onclick = async () => { if (installPrompt) { installPrompt.prompt(); installPrompt = null; renderSaved(); } };
  $('slower').checked = store.get('slower') === '1';
  $('slower').onchange = (e) => store.set('slower', e.target.checked ? '1' : '0');
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
  // Offline support: the service worker stores the guide on the phone (see sw.js)
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* still works online */ });
  }
  try { await load(); } catch (e) {
    $('reply').textContent = 'Could not load the guide data. Please reload.';
    return;
  }
  if (!Recognition) showNotice(ui(app.state.lang).noVoiceIn);
  // After a refresh: carry on from the saved airport, terminal and step ("Continuing from step 3")
  let resumed = null;
  try { resumed = restore(JSON.parse(store.get('trip') || 'null'), app.data); } catch { resumed = null; }
  if (resumed) {
    app.state = resumed.state;
    store.set('lang', app.state.lang);
    if (resumed.reply) app.lastReply = resumed.reply;
  }
  render();
  // Handy for testing and demos: window.arrival.submit("next")
  window.arrival = { submit, get state() { return app.state; }, get rates() { return app.rates; }, get reply() { return app.lastReply; },
    get status() { return app.status; }, get micOn() { return !!rec; },
    get staff() { return $('staffCard').hidden ? null : { ...staffShown, local: $('staffLocal').hidden ? null : $('staffLocal').textContent, en: $('staffEn').textContent }; } };
})();
