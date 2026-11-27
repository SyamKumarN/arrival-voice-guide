// listen.js tests — a fake recogniser that behaves like Chrome on Android:
// it stops after short silences, throws "no-speech" / "aborted", and repeats earlier words.

import { createListener, mergeSpeech, FIRST_WORD_MS, SILENCE_MS } from '../public/js/listen.js';

/** A tiny clock: setTimeout / clearTimeout that we advance by hand. */
function fakeClock() {
  let now = 0, id = 0;
  const jobs = new Map();
  return {
    get now() { return now; },
    setTimeout(fn, ms) { const n = ++id; jobs.set(n, { at: now + ms, fn }); return n; },
    clearTimeout(n) { jobs.delete(n); },
    /** Run everything due up to time t, in order. */
    advanceTo(t) {
      for (;;) {
        let next = null;
        for (const [n, j] of jobs) if (j.at <= t && (!next || j.at < next[1].at)) next = [n, j];
        if (!next) break;
        jobs.delete(next[0]); now = next[1].at; next[1].fn();
      }
      now = t;
    },
  };
}

/** Fake SpeechRecognition. Each new instance plays the next script in `runs`. */
function fakeRecognition(clock, runs) {
  const created = [];
  class FakeRec {
    constructor() { this.n = created.length; created.push(this); this.stopped = false; }
    start() {
      const script = runs[this.n] || [{ at: 1000, end: true }];
      const t0 = clock.now;
      const results = [];
      for (const step of script) {
        clock.setTimeout(() => {
          if (this.stopped && !step.end) return;
          if (step.say) {
            const alts = [step.say, ...(step.alts || [])].map((transcript) => ({ transcript }));
            if (step.cumulative) results.length = 0;   // Android: one growing result
            results.push(Object.assign(alts, { isFinal: !!step.final }));
            this.onresult && this.onresult({ results, resultIndex: results.length - 1 });
          }
          if (step.error) this.onerror && this.onerror({ error: step.error });
          if (step.end) this.end();
        }, step.at);
      }
      this.t0 = t0;
    }
    end() { if (this.ended) return; this.ended = true; this.onend && this.onend(); }
    stop() { this.stopped = true; clock.setTimeout(() => this.end(), 200); }
    abort() { this.stopped = true; this.ended = true; }
  }
  FakeRec.created = created;
  return FakeRec;
}

function run(runs, actions = [], until = 30000) {
  const clock = fakeClock();
  const Rec = fakeRecognition(clock, runs);
  const log = { states: [], done: undefined, doneAt: null, info: null };
  const l = createListener({
    Recognition: Rec, lang: 'te-IN', timers: clock,
    onState: (s) => log.states.push([clock.now, s]),
    onDone: (alts, info) => { log.done = alts; log.doneAt = clock.now; log.info = info; },
  });
  l.start();
  for (const a of actions) clock.setTimeout(() => l[a.do](), a.at);
  clock.advanceTo(until);
  log.engines = Rec.created.length;
  return log;
}

export const LISTEN_CASES = [
  {
    name: 'Android stops after ~1 s of silence mid-sentence: keeps listening and joins both parts',
    runs: [[{ at: 1500, say: 'దుబాయ్', final: true }, { at: 2300, end: true }],
           [{ at: 600, say: 'టెర్మినల్ మూడ్', final: true }, { at: 1200, end: true }]],
    check: (l) => l.done && l.done[0] === 'దుబాయ్ టెర్మినల్ మూడ్' && l.engines >= 2 && l.doneAt >= 2300 + 600 + SILENCE_MS,
  },
  {
    name: 'Waits up to 8 s for the first word, restarting after "no-speech"',
    runs: [[{ at: 5000, error: 'no-speech' }, { at: 5000, end: true }],
           [{ at: 2000, say: 'help', final: true }, { at: 2500, end: true }]],
    check: (l) => l.done && l.done[0] === 'help' && l.doneAt > 7000,
  },
  {
    name: 'Restarts after an "aborted" error',
    runs: [[{ at: 300, error: 'aborted' }, { at: 300, end: true }],
           [{ at: 1000, say: 'next', final: true }]],
    check: (l) => l.done && l.done[0] === 'next' && l.engines >= 2,
  },
  {
    name: 'Nothing said for 8 s: stops with nothing',
    runs: [],
    check: (l) => l.done === null && l.doneAt >= FIRST_WORD_MS && l.doneAt < FIRST_WORD_MS + 2000,
  },
  {
    name: 'Stops 2 s after the last word, not 1 s',
    runs: [[{ at: 1000, say: 'dubai terminal 3', final: true }]],
    check: (l) => l.done && l.done[0] === 'dubai terminal 3' && l.doneAt >= 1000 + SILENCE_MS,
  },
  {
    name: 'A second tap finishes straight away and keeps the words',
    runs: [[{ at: 800, say: 'bangkok' }]],
    actions: [{ at: 1200, do: 'finish' }],
    check: (l) => l.done && l.done[0] === 'bangkok' && l.doneAt < 1200 + SILENCE_MS,
  },
  {
    name: 'Android repeats earlier words in a growing result: no duplicates',
    runs: [[{ at: 700, say: 'dubai', cumulative: true }, { at: 1400, say: 'dubai terminal 3', cumulative: true, final: true }]],
    check: (l) => l.done && l.done[0] === 'dubai terminal 3',
  },
  {
    name: 'Microphone blocked: stops with the reason, no restarts',
    runs: [[{ at: 100, error: 'not-allowed' }, { at: 100, end: true }]],
    check: (l) => l.done === null && l.info.error === 'denied' && l.engines === 1,
  },
  {
    name: 'Shows "listening" until done, then idle',
    runs: [[{ at: 1000, say: 'yes', final: true }]],
    check: (l) => l.states[0][1] === 'listening' && l.states[l.states.length - 1][1] === 'idle' && l.states.length === 2,
  },
  {
    name: 'Other guesses are kept for the newest phrase',
    runs: [[{ at: 1000, say: 'dubai', final: true }, { at: 1500, end: true }],
           [{ at: 500, say: 'terminal tree', alts: ['terminal three'], final: true }]],
    check: (l) => l.done && l.done.includes('dubai terminal three'),
  },
];

export function runListen() {
  const out = [];
  for (const c of LISTEN_CASES) {
    let ok = false, detail = '';
    try { const l = run(c.runs, c.actions); ok = !!c.check(l); detail = JSON.stringify({ done: l.done, at: l.doneAt, engines: l.engines, info: l.info }); }
    catch (e) { detail = e.message; }
    out.push({ group: 'mic', name: c.name, ok, detail });
  }
  const merges = [
    ['dubai', 'dubai terminal 3', 'dubai terminal 3'],
    ['dubai terminal 3', 'terminal 3', 'dubai terminal 3'],
    ['500 dollar', 'ke kitne dirham', '500 dollar ke kitne dirham'],
  ];
  for (const [a, b, want] of merges) {
    const got = mergeSpeech(a, b);
    out.push({ group: 'mic', name: `merge "${a}" + "${b}"`, ok: got === want, detail: got });
  }
  return out;
}
