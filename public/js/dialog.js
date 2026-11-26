// dialog.js — the conversation, as a pure function.
// handle(state, sentence, data, rates) -> { state, reply, parsed, unknown? }
// No DOM and no speech here, so the whole flow can be tested in Node.
//
// state.dest     : where the traveller wants to go — 'exchange' | 'sim' | 'taxi'
// state.mode     : 'start' | 'ask' | 'route' | 'done' | 'lost' | 'info'
// state.expecting: 'airport' | 'terminal' | 'stage' | null  (the one question we just asked)
// state.lost     : true while we're working out where a lost traveller is

import { parse } from './parser.js';
import { buildRoute, terminalsOf, hasRoute, stepForStage } from './decide.js';
import { comparePrice } from './price.js';
import { say, terminalLabel } from './phrases.js';
import { pick } from './text.js';

export function initialState(lang = 'hi-IN') {
  return { lang, airport: null, terminal: null, dest: 'exchange', mode: 'start', step: 0, expecting: null, lost: false };
}

const reply = (kind, text, extra = {}) => ({ kind, text, ...extra });

/** Text for the current step, e.g. "Step 2 of 5. Collect your bags…" */
export function stepText(state, route) {
  const s = route.steps[state.step];
  return say(state.lang, 'step')(state.step + 1, route.steps.length, pick(s.text, state.lang));
}

export function currentRoute(state, data) {
  return state.airport && state.terminal ? buildRoute(data, state.airport, state.terminal, state.dest || 'exchange') : null;
}

/** "I can help with … Try …" plus the step commands. */
function capabilities(lang) {
  return say(lang, 'unknown') + ' ' + say(lang, 'commandsHint');
}

export function handle(prev, sentence, data, rates) {
  const state = { dest: 'exchange', lost: false, ...prev };
  const lang = state.lang;
  const out = (st, r, extra = {}) => ({ state: st, reply: r, parsed: p, ...extra });
  const localCurrency = state.airport ? data.airports[state.airport].currency : null;
  const p = parse(sentence, { expecting: state.expecting, localCurrency });

  // 1. Start over
  if (p.command === 'restart') {
    return out({ ...initialState(lang), mode: 'ask', expecting: 'airport' }, reply('ask', say(lang, 'restart')));
  }

  // 2. Ask-staff card: works at any point
  if (p.command === 'staff') {
    const staff = { intent: p.intent || state.dest || 'exchange', airport: p.airport || state.airport };
    return out(state, reply('staff', say(lang, 'staffIntro'), { staff }));
  }

  // 3. Price check works at any point in the flow
  if (p.price) {
    const c = comparePrice(p.price, rates);
    if (c) return out(state, reply('price', say(lang, 'price')(c, lang), { price: c }));
  } else if (p.amounts.length === 1 && !p.airport && !p.terminal && !p.command) {
    return out(state, reply('ask', say(lang, 'priceNeedTwo')));
  }

  // 4. "I don't know where I am" → find airport, terminal, then ask what they can see
  if (p.command === 'lost') {
    state.lost = true;
    if (p.airport) state.airport = p.airport;
    if (p.terminal) state.terminal = p.terminal;
    if (!hasRoute(data, state.airport, state.dest)) state.dest = 'exchange';
  }
  if (state.expecting === 'stage') {
    if (p.stage) {
      const r = currentRoute(state, data);
      const i = r ? stepForStage(r, p.stage) : -1;
      if (r && i >= 0) {
        Object.assign(state, { mode: 'route', step: i, expecting: null, lost: false });
        return out(state, reply('step', say(lang, 'lostFound')(p.stage) + ' ' + stepText(state, r)));
      }
    }
    if (!p.airport && !p.terminal && !p.intent && p.command !== 'next') {
      return out(state, reply('ask', say(lang, 'lostAsk')), { unknown: !p.command });
    }
    // A new airport or terminal ("actually I'm in Dubai") keeps the lost flow going;
    // a new destination or a command means they've moved on.
    state.expecting = null;
    if (p.intent || p.command) state.lost = false;
  }

  // 5. Step commands while guiding
  const route = currentRoute(state, data);
  const changed = (p.airport && p.airport !== state.airport) || (p.terminal && p.terminal !== state.terminal) ||
    (p.intent && p.intent !== state.dest);
  if (state.mode === 'route' && route && !changed && !state.lost) {
    if (p.command === 'cantfind') {
      return out(state, reply('fallback', say(lang, 'cantFind')(pick(route.fallback, lang))));
    }
    if (p.command === 'repeat') return out(state, reply('step', stepText(state, route)));
    if (p.command === 'back') {
      if (state.step === 0) return out(state, reply('step', say(lang, 'atStart') + ' ' + stepText(state, route)));
      state.step -= 1;
      return out(state, reply('step', stepText(state, route)));
    }
    if (p.command === 'next') {
      if (state.step + 1 >= route.steps.length) {
        state.mode = 'done';
        return out(state, reply('done', say(lang, 'done')(state.dest)));
      }
      state.step += 1;
      return out(state, reply('step', stepText(state, route)));
    }
    if (!p.airport && !p.terminal && !p.intent) {
      return out(state, reply('help', capabilities(lang)), { unknown: true });
    }
  }
  if (state.mode === 'done' && (p.command === 'repeat' || p.command === 'back') && route) {
    state.mode = 'route';
    state.step = route.steps.length - 1;
    return out(state, reply('step', stepText(state, route)));
  }

  // 6. Fill in airport, terminal and destination
  const understood = p.airport || p.terminal || p.intent || state.lost;
  if (!understood) {
    if (state.expecting === 'airport') return out(state, reply('ask', say(lang, 'unknown') + ' ' + say(lang, 'askAirport')), { unknown: true });
    if (state.expecting === 'terminal') {
      const a = data.airports[state.airport];
      return out(state, reply('ask', say(lang, 'askTerminal')(pick(a.name, lang), a.terminals)), { unknown: true });
    }
    return out(state, reply('unknown', capabilities(lang)), { unknown: true });
  }

  if (p.airport && p.airport !== state.airport) {
    // A different airport makes the old terminal meaningless — unless the user
    // gave the terminal first ("terminal 1 paise" … "Dubai").
    if (state.airport) state.terminal = null;
    state.airport = p.airport;
  }
  if (p.terminal) state.terminal = p.terminal;
  if (p.intent) state.dest = p.intent;
  state.step = 0;

  if (!state.airport) {
    Object.assign(state, { mode: 'ask', expecting: 'airport' });
    return out(state, reply('ask', state.lost ? say(lang, 'lostAskAirport') : say(lang, 'askAirport')));
  }
  const airport = data.airports[state.airport];
  const name = pick(airport.name, lang);

  // SIM / taxi where we have no step-by-step route: short safe answer + staff card
  if (!hasRoute(data, state.airport, state.dest)) {
    Object.assign(state, { mode: 'info', expecting: null });
    return out(state, reply('info', say(lang, 'noRouteDest')(state.dest, name), { staff: { intent: state.dest, airport: state.airport } }));
  }

  const terms = terminalsOf(data, state.airport);
  if (terms.length === 1) state.terminal = terms[0];
  if (state.terminal && !terms.includes(state.terminal)) {
    Object.assign(state, { terminal: null, mode: 'ask', expecting: 'terminal' });
    return out(state, reply('ask', say(lang, 'badTerminal')(name, terms)));
  }
  if (!state.terminal) {
    Object.assign(state, { mode: 'ask', expecting: 'terminal' });
    return out(state, reply('ask', say(lang, 'askTerminal')(name, terms)));
  }

  // Lost: airport and terminal known, now one question about what they can see
  if (state.lost) {
    Object.assign(state, { mode: 'lost', expecting: 'stage' });
    return out(state, reply('ask', say(lang, 'lostAsk')));
  }

  // 7. Everything known: build the route and read the first step
  const r = buildRoute(data, state.airport, state.terminal, state.dest);
  if (!r || (state.dest === 'exchange' && !r.counter)) {
    state.mode = 'ask';
    return out(state, reply('ask', say(lang, 'noRoute')));
  }
  Object.assign(state, { mode: 'route', expecting: null });
  const intro = say(lang, 'intro')(r, lang);
  return out(state, reply('step', intro + ' ' + stepText(state, r), { intro }));
}

export { terminalLabel };
