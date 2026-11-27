// listen.js — one tap = one listening session that waits for the person to finish.
//
// Chrome on Android ends a recognition after about a second of silence, often
// fires "no-speech" or "aborted", and in continuous mode can repeat earlier
// words in later results. This module hides all of that:
//   • waits up to FIRST_WORD_MS (8 s) for the first word,
//   • after speech, stops only after SILENCE_MS (2 s) of quiet,
//   • if the engine stops early (or says no-speech / aborted), starts it again,
//   • a second tap finishes now and keeps what was heard,
//   • merges repeated text so "dubai dubai terminal 3" becomes "dubai terminal 3".
// Pure: the recogniser class and the clock are passed in, so it runs in tests.

export const FIRST_WORD_MS = 8000;
export const SILENCE_MS = 2000;
export const MAX_RESTARTS = 6;          // engine restarts after the first word
const MAX_RESTARTS_TOTAL = 30;          // safety cap (the timers end a session anyway)
const MIN_RUN_MS = 300;                 // an engine that ends faster than this is restarted after a short pause
const FINISH_GRACE_MS = 1200;           // after stop(), wait this long for the last result

/** Join two pieces of speech, dropping words the engine repeated. */
export function mergeSpeech(a, b) {
  a = (a || '').trim(); b = (b || '').trim();
  if (!a) return b;
  if (!b) return a;
  const la = a.toLowerCase(), lb = b.toLowerCase();
  if (lb.startsWith(la)) return b;            // Android: later result repeats the earlier text
  if (la.endsWith(lb) || la.includes(lb)) return a;
  return a + ' ' + b;
}

/**
 * createListener({ Recognition, lang, onState, onInterim, onDone, timers })
 *   onState('listening' | 'idle')
 *   onInterim(text)                  — what's been heard so far
 *   onDone(alternatives | null, info) — final guesses (best first), or null if nothing was heard;
 *                                      info.error is 'denied' | 'network' when that's why it ended
 * Returns { start(), finish(), cancel(), get active() }.
 */
export function createListener({ Recognition, lang, onState = () => {}, onInterim = () => {}, onDone = () => {}, timers = globalThis }) {
  let rec = null;
  let active = false, ending = false, settled = false;
  let committed = '';          // text from earlier engine runs in this session
  let current = '';            // text from the running engine
  let lastAlts = [];           // alternatives for the newest phrase
  let heard = false, restarts = 0, error = null;
  let firstWordTimer = null, silenceTimer = null, graceTimer = null;

  const clear = () => {
    timers.clearTimeout(firstWordTimer); timers.clearTimeout(silenceTimer); timers.clearTimeout(graceTimer);
  };
  const text = () => mergeSpeech(committed, current);

  function settle() {
    if (settled) return;
    settled = true; active = false; clear();
    if (rec) { rec.onresult = rec.onerror = rec.onend = null; try { rec.abort(); } catch { /* already stopped */ } rec = null; }
    onState('idle');
    const full = text();
    if (!full) { onDone(null, { error }); return; }
    // Keep the engine's other guesses for the newest phrase, on top of what came before
    const alts = lastAlts.length ? [...lastAlts] : [full];
    if (!alts.includes(full)) alts.unshift(full);
    onDone([...new Set(alts)], { error });
  }

  let startedAt = 0;
  const now = () => (typeof timers.now === 'number' ? timers.now : Date.now());
  function spawn() {
    startedAt = now();
    const r = new Recognition();
    rec = r;
    r.lang = lang;
    r.interimResults = true;
    r.maxAlternatives = 4;
    r.continuous = true;
    r.onresult = (e) => {
      let joined = '';
      for (let i = 0; i < e.results.length; i++) joined = mergeSpeech(joined, e.results[i][0].transcript);
      current = joined;
      const last = e.results[e.results.length - 1];
      let prefix = committed;          // earlier engine runs + earlier phrases of this run
      for (let i = 0; i < e.results.length - 1; i++) prefix = mergeSpeech(prefix, e.results[i][0].transcript);
      lastAlts = Array.from(last).map((alt) => mergeSpeech(prefix, alt.transcript));
      if (text()) {
        heard = true;
        timers.clearTimeout(firstWordTimer);
        onInterim(text());
        if (!ending) { timers.clearTimeout(silenceTimer); silenceTimer = timers.setTimeout(finish, SILENCE_MS); }
      }
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { error = 'denied'; ending = true; }
      else if (e.error === 'network') { error = 'network'; ending = true; }
      // 'no-speech' and 'aborted' just end this engine run; onend restarts it
    };
    r.onend = () => {
      if (rec !== r) return;
      committed = text(); current = '';
      if (ending || !active) { settle(); return; }
      if ((heard && restarts >= MAX_RESTARTS) || restarts >= MAX_RESTARTS_TOTAL) { settle(); return; }
      restarts += 1;
      const ranFor = now() - startedAt;
      const again = () => { if (active && !ending) { try { spawn(); } catch { settle(); } } };
      if (ranFor < MIN_RUN_MS) timers.setTimeout(again, MIN_RUN_MS); else again();
    };
    r.start();
  }

  /** Stop now and keep what was heard (second tap, or the silence timer). */
  function finish() {
    if (!active || ending) return;
    ending = true;
    timers.clearTimeout(silenceTimer); timers.clearTimeout(firstWordTimer);
    graceTimer = timers.setTimeout(settle, FINISH_GRACE_MS);
    try { rec && rec.stop(); } catch { settle(); }
  }

  return {
    start() {
      if (active) return;
      active = true;
      onState('listening');
      firstWordTimer = timers.setTimeout(() => { if (!heard) finish(); }, FIRST_WORD_MS);
      try { spawn(); } catch { error = 'start'; settle(); }
    },
    finish,
    /** Throw away everything (the guide is about to speak). */
    cancel() {
      if (settled) return;
      settled = true; active = false; clear();
      if (rec) { rec.onresult = rec.onerror = rec.onend = null; try { rec.abort(); } catch { /* ignore */ } rec = null; }
      onState('idle');
    },
    get active() { return active; },
    get restarts() { return restarts; },
  };
}
