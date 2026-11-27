// dialog.js — the conversation, as a pure function.
// handle(state, sentence, data, rates) -> { state, reply, parsed, unknown? }
// No DOM and no speech here, so the whole flow can be tested in Node.
//
// state.dest      : where the traveller wants to go — 'exchange' | 'sim' | 'taxi' | 'metro'
// state.mode      : 'start' | 'ask' | 'confirm' | 'route' | 'done' | 'lost' | 'info' | 'tips'
// state.expecting : 'airport' | 'terminal' | 'confirm' | 'stage' | null  (the one question we just asked)
// state.confirmed : airport + terminal confirmed by the traveller ("Is that right?" → yes)
// state.lost      : true while we're working out where a lost traveller is
// state.tips      : { key, i, prev: { mode, expecting } } while reading a tip list
// state.tipsGiven : the money tips were already offered after the exchange route

import { parse } from './parser.js';
import { buildRoute, terminalsOf, hasRoute, stepForStage, rankCounters } from './decide.js';
import { comparePrice, midRate, roundMoney } from './price.js';
import { say, terminalLabel, tipList, currencyName } from './phrases.js';
import { pick } from './text.js';

export function initialState(lang = 'hi-IN') {
  return {
    lang, airport: null, terminal: null, dest: 'exchange', mode: 'start', step: 0, expecting: null,
    confirmed: false, lost: false, tips: null, tipsGiven: false,
    lastAmount: null,           // { amount, currency } said earlier ("I have 1000 dollars")
    asks: null,                 // { key, n }: how often the same question was asked again
  };
}

const reply = (kind, text, extra = {}) => ({ kind, text, ...extra });

/** "Which terminal at Dubai? 1, 2 or 3?" plus a hint that helps people who don't know ("Emirates uses Terminal 3…"). */
function askTerminal(lang, a, bad = false) {
  const q = say(lang, bad ? 'badTerminal' : 'askTerminal')(pick(a.name, lang), a.terminals);
  return a.terminalHint ? `${q} ${pick(a.terminalHint, lang)}` : q;
}

// Spoken list topics → which tip list they read
const LIST_TOPICS = { tips: 'money', traps: 'traps', atm: 'atm', pickup: 'taxi', cards: 'cards' };
// One-off advice topics
const INFO_TOPICS = ['leftover', 'excessbag', 'transit', 'closed', 'howmuch', 'dcc', 'forex', 'credit', 'debit'];

/** The last step is done: closing line, then (once) the money tips. */
function finishRoute(state, route, lang) {
  state.mode = 'done';
  const done = say(lang, 'done')(state.dest === 'exchange' && route.endsAt === 'atm' ? 'atm' : state.dest);
  if (state.dest === 'exchange' && !state.tipsGiven) {
    state.tipsGiven = true;
    return startTips(state, 'money', done);
  }
  return reply('done', done);
}

/** "Tell me both amounts, for example: they give 129 Singapore dollars for 100 US dollars." */
function priceExample(lang, local, rates) {
  if (!local || local === 'USD') return say(lang, 'priceNeedTwo');
  const offered = roundMoney(100 * midRate(rates, 'USD', local) * 0.97);
  return say(lang, 'priceExample')(100, 'USD', offered, local, lang);
}

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

/** "Dubai, Terminal 3. Is that right?" */
function confirmQuestion(state, data) {
  const a = data.airports[state.airport];
  const t = state.terminal === 'MAIN' ? null : terminalLabel(state.terminal, state.lang);
  return say(state.lang, 'confirmAsk')(pick(a.name, state.lang), t);
}

/** Line i of a tip list, with the "Tip 2 of 3." prefix. */
function tipText(state) {
  const list = tipList(state.tips.key, state.lang);
  return say(state.lang, 'tipLine')(state.tips.i + 1, list.length, list[state.tips.i]);
}

/** Start reading a tip list; remember where we were so we can go back. */
function startTips(state, key, lead = '') {
  state.tips = { key, i: 0, prev: { mode: state.mode, expecting: state.expecting } };
  state.mode = 'tips';
  state.expecting = null;
  const head = say(state.lang, 'tipHeader')[key];
  return reply('tips', (lead ? lead + ' ' : '') + head + ' ' + tipText(state) + say(state.lang, 'tipMore'), { tips: { key, i: 0 } });
}

/** Leave the tip list and say how to get back to what they were doing. */
function endTips(state, data) {
  const { prev } = state.tips;
  state.tips = null;
  state.mode = prev.mode;
  state.expecting = prev.expecting;
  let tail = '';
  if (prev.mode === 'route') tail = say(state.lang, 'backToRoute');
  else if (prev.expecting === 'confirm') tail = ' ' + confirmQuestion(state, data);
  else if (prev.expecting === 'airport') tail = ' ' + say(state.lang, 'askAirport');
  else if (prev.expecting === 'terminal') {
    const a = data.airports[state.airport];
    tail = ' ' + askTerminal(state.lang, a);
  }
  return reply('tips', say(state.lang, 'tipsDone') + tail);
}

/**
 * One turn. `opts.parsed` lets the optional AI fill in what was said (same shape as parse());
 * the answer always comes from our data.
 */
export function handle(prev, sentence, data, rates, opts = {}) {
  const state = { ...initialState(prev.lang), ...prev };
  const lang = state.lang;
  const out = (st, r, extra = {}) => ({ state: st, reply: r, parsed: p, ...extra });
  const localCurrency = state.airport ? data.airports[state.airport].currency : null;
  const p = opts.parsed || parse(sentence, { expecting: state.expecting, localCurrency });
  // Never ask the same question a third time: count re-asks, reset on any other turn
  const prevAsks = state.asks;
  state.asks = null;
  const askedAgain = (key) => {
    const n = prevAsks && prevAsks.key === key ? prevAsks.n + 1 : 1;
    state.asks = { key, n };
    return n;                     // 1 = asking a second time, 2+ = would be the third
  };
  const nameHere = () => {
    const a = state.airport ? data.airports[state.airport] : null;
    return a ? pick(a.name, lang) + (state.terminal && state.terminal !== 'MAIN' ? ' ' + terminalLabel(state.terminal, lang) : '') : null;
  };

  // 1. Start over
  if (p.command === 'restart') {
    return out({ ...initialState(lang), mode: 'ask', expecting: 'airport' }, reply('ask', say(lang, 'restart')));
  }

  // 2. Reading a tip list: next / repeat / back move through it; anything else leaves it
  if (state.mode === 'tips' && state.tips && (p.progress || p.atPlace)) {
    const { prev: back } = state.tips;
    if (back.mode === 'route') Object.assign(state, { tips: null, mode: 'route', expecting: null });
    else return out(state, endTips(state, data));
  }
  if (state.mode === 'tips' && state.tips) {
    const n = tipList(state.tips.key, lang).length;
    if (p.command === 'next' || p.yesno === 'yes') {
      if (state.tips.i + 1 >= n) return out(state, endTips(state, data));
      state.tips = { ...state.tips, i: state.tips.i + 1 };
      return out(state, reply('tips', tipText(state), { tips: { key: state.tips.key, i: state.tips.i } }));
    }
    if (p.command === 'repeat') return out(state, reply('tips', tipText(state), { tips: { key: state.tips.key, i: state.tips.i } }));
    if (p.command === 'back') {
      state.tips = { ...state.tips, i: Math.max(0, state.tips.i - 1) };
      return out(state, reply('tips', tipText(state), { tips: { key: state.tips.key, i: state.tips.i } }));
    }
    const { prev: back } = state.tips;          // moved on: drop the list quietly and carry on below
    Object.assign(state, { tips: null, mode: back.mode, expecting: back.expecting });
  }

  // A side question that names an airport or terminal ("Bengaluru T1, where is the ATM?")
  // switches to that place first, so the answer is about where they really are.
  const switchContext = () => {
    let changed = false;
    if (p.airport && p.airport !== state.airport) { state.airport = p.airport; state.terminal = p.terminal || null; changed = true; }
    if (p.terminal && p.terminal !== state.terminal) { state.terminal = p.terminal; changed = true; }
    if (!changed) return;
    const terms = state.airport ? terminalsOf(data, state.airport) : [];
    if (terms.length === 1) state.terminal = terms[0];
    if (state.airport && state.terminal && !terms.includes(state.terminal)) state.terminal = null;
    Object.assign(state, { confirmed: false, step: 0, expecting: null, tips: null, lost: false,
      mode: ['route', 'done', 'tips'].includes(state.mode) ? 'info' : state.mode });
  };
  const sideTopic = p.topic === 'nostaff' || p.topic === 'apphelp' || p.topic === 'atmwhere' || p.topic === 'counters' || !!p.amountQuery ||
    !!p.offtopic || (p.topic && (INFO_TOPICS.includes(p.topic) || LIST_TOPICS[p.topic]));
  if (sideTopic && (p.airport || p.terminal) && !p.intent) switchContext();

  // 3. Nobody to ask: info desk signs plus the card to show anyone in uniform
  if (p.topic === 'nostaff') {
    const staff = { intent: p.offtopic || state.dest || 'exchange', airport: state.airport };
    return out(state, reply('info', say(lang, 'info').nostaff, { topic: 'nostaff', staff }));
  }

  // Ask-staff card: works at any point
  if (p.command === 'staff') {
    const staff = { intent: p.offtopic || p.intent || state.dest || 'exchange', airport: p.airport || state.airport };
    return out(state, reply('staff', say(lang, 'staffIntro'), { staff }));
  }

  // 4. Price check works at any point in the flow
  const local = state.airport ? data.airports[state.airport].currency : null;
  const offerAmount = p.amounts.length === 1 ? p.amounts[0] : (p.amounts.length === 0 && p.numbers.length === 1 ? { amount: p.numbers[0], currency: null } : null);
  if (p.price) {
    const c = comparePrice(p.price, rates);
    state.lastAmount = { ...p.price.given };
    if (c) return out(state, reply('price', say(lang, 'price')(c, lang), { price: c }));
  } else if (p.offered && offerAmount && state.lastAmount && !p.amountQuery) {
    // "They're giving only 1500" → 1500 in the airport's currency for the amount said earlier
    const given = state.lastAmount;
    const cur = offerAmount.currency && offerAmount.currency !== given.currency ? offerAmount.currency
      : (local && local !== given.currency ? local : null);
    if (cur) {
      const c = comparePrice({ given, received: { amount: offerAmount.amount, currency: cur } }, rates);
      if (c) return out(state, reply('price', say(lang, 'price')(c, lang), { price: c }));
    }
    return out(state, reply('ask', say(lang, 'amountNeed')));
  } else if (p.amountQuery) {
    // "How many dirhams for 500 dollars?" → the fair amount at the mid-market rate
    const q = p.amountQuery;
    const to = q.to || (local && local !== q.from ? local : null);
    const from = q.from || (to && to !== 'INR' ? 'INR' : null);
    const rate = from && to && from !== to ? midRate(rates, from, to) : null;
    if (!rate) return out(state, reply('ask', say(lang, 'amountNeed')));
    const fair = roundMoney(q.amount * rate);
    state.lastAmount = { amount: q.amount, currency: from };
    return out(state, reply('amount', say(lang, 'amountFair')(q.amount, from, fair, to, lang), { amount: { amount: q.amount, from, to, fair } }));
  } else if ((p.priceCheck && !p.airport && !p.command) ||
    (p.amounts.length === 1 && !p.airport && !p.terminal && !p.command && !p.topic)) {
    // Ask for what's missing, with an example in this airport's currency
    if (p.amounts.length === 1 && p.amounts[0].given !== false) state.lastAmount = { amount: p.amounts[0].amount, currency: p.amounts[0].currency };
    if (state.lastAmount && local && local !== state.lastAmount.currency) {
      return out(state, reply('ask', say(lang, 'askOffer')(state.lastAmount, local, lang)));
    }
    return out(state, reply('ask', priceExample(lang, local, rates)));
  }

  // 5. Outside our scope: say what we do, and hand the question to staff (never guess a location)
  if (p.offtopic && !(state.expecting === 'stage' && p.stage)) {
    const staff = { intent: p.offtopic, airport: p.airport || state.airport };
    return out(state, reply('offtopic', say(lang, 'offtopic'), { staff }));
  }

  // "How many / which exchange counters are here?" → every counter we list for this terminal
  if (p.topic === 'counters') {
    state.dest = 'exchange';
    if (!state.airport) {
      Object.assign(state, { mode: 'ask', expecting: 'airport' });
      return out(state, reply('ask', say(lang, 'askAirport')));
    }
    const a = data.airports[state.airport];
    const terms = terminalsOf(data, state.airport);
    if (terms.length === 1) state.terminal = terms[0];
    if (!state.terminal) {
      Object.assign(state, { mode: 'ask', expecting: 'terminal' });
      return out(state, reply('ask', askTerminal(lang, a)));
    }
    const list = rankCounters(a, state.terminal);
    const items = list.map((c) => ({ name: pick(c.name, lang), location: pick(c.location, lang), quality: c.quality }));
    if (!items.length) return out(state, reply('info', say(lang, 'countersNone')(nameHere()), { topic: 'counters', counters: [] }));
    let text = say(lang, 'countersList')(nameHere(), items);
    if (state.mode !== 'route') {
      // Offer to guide them to the first one
      Object.assign(state, { mode: 'confirm', expecting: 'confirm', confirmed: false, step: 0 });
      text += ' ' + say(lang, 'countersGuide')(items[0].name);
    }
    return out(state, reply('info', text, { topic: 'counters', counters: items }));
  }

  // 6. "Where is the ATM?": the place, from our data only; otherwise the safe answer and a card
  if (p.topic === 'atmwhere') {
    const a = state.airport ? data.airports[state.airport] : null;
    const here = a && state.terminal && a.atms && a.atms[state.terminal];
    if (here) return out(state, reply('info', say(lang, 'atmHere')(pick(here, lang)), { topic: 'atmwhere' }));
    const name = a ? pick(a.name, lang) + (state.terminal && state.terminal !== 'MAIN' ? ' ' + terminalLabel(state.terminal, lang) : '') : null;
    return out(state, reply('info', say(lang, 'atmUnknown')(name), { topic: 'atmwhere', staff: { intent: 'atm', airport: state.airport } }));
  }
  if (p.topic === 'apphelp') return out(state, reply('info', say(lang, 'info').apphelp, { topic: 'apphelp' }));

  // Advice topics: one-off answers keep the current flow; lists are read one tip at a time
  if (p.topic && INFO_TOPICS.includes(p.topic)) {
    return out(state, reply('info', say(lang, 'info')[p.topic], { topic: p.topic }));
  }
  if (p.topic && LIST_TOPICS[p.topic]) {
    return out(state, startTips(state, LIST_TOPICS[p.topic]));
  }

  // 7. Answer to "Is that right?"
  let confirmedNow = false;
  if (state.expecting === 'confirm' && !p.airport && !p.terminal) {
    if (p.yesno === 'yes' || p.command === 'next') {
      Object.assign(state, { confirmed: true, expecting: null });
      confirmedNow = true;
    } else if (p.yesno === 'no') {
      Object.assign(state, { airport: null, terminal: null, confirmed: false, mode: 'ask', expecting: 'airport' });
      return out(state, reply('ask', say(lang, 'confirmNo')));
    } else if (!p.intent && !p.command && !(p.stage && (p.atPlace || p.progress))) {
      if (askedAgain('confirm') >= 2) return out(state, reply('confirm', say(lang, 'tapButtons').confirm), { unknown: true });
      return out(state, reply('confirm', confirmQuestion(state, data)), { unknown: true });
    } else if (p.stage && (p.atPlace || p.progress)) {
      Object.assign(state, { confirmed: true, expecting: null });   // "I'm already in the hall" answers "is that right?"
    }
  }

  // 8. "I don't know where I am" → find airport, terminal, then ask what they can see
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
      if (askedAgain('stage') >= 2) {
        // Still can't tell: point to the signs and hand over to staff, instead of asking again
        Object.assign(state, { expecting: null, lost: false, mode: 'info' });
        return out(state, reply('info', say(lang, 'lostGiveUp'), { staff: { intent: 'lost', airport: state.airport } }), { unknown: true });
      }
      return out(state, reply('ask', say(lang, 'lostAskAgain')), { unknown: !p.command });
    }
    // A new airport or terminal ("actually I'm in Dubai") keeps the lost flow going;
    // a new destination or a command means they've moved on.
    state.expecting = null;
    if (p.intent || p.command) state.lost = false;
  }

  if (state.mode !== 'route' && state.airport && state.terminal && p.stage && (p.atPlace || p.progress) &&
      !p.intent && !p.airport && state.expecting !== 'airport' && state.expecting !== 'terminal') {
    const r = currentRoute(state, data);
    const i = r ? stepForStage(r, p.stage) : -1;
    if (r && i >= 0) {
      Object.assign(state, { mode: 'route', step: i, expecting: null, lost: false, confirmed: true });
      return out(state, reply('step', say(lang, 'lostFound')(p.stage) + ' ' + stepText(state, r)));
    }
  }

  // 9. Step commands while guiding
  const route = currentRoute(state, data);
  const changed = (p.airport && p.airport !== state.airport) || (p.terminal && p.terminal !== state.terminal) ||
    (p.intent && p.intent !== state.dest);
  if (state.mode === 'route' && route && !changed && !state.lost) {
    if (Number.isInteger(p.jumpStep) && p.jumpStep >= 0 && p.jumpStep < route.steps.length) {
      // The AI matched "I'm past the escalators" to one of our steps
      state.step = p.jumpStep;
      return out(state, reply('step', say(lang, 'doneAck') + ' ' + stepText(state, route)));
    }
    if (p.stage && p.atPlace) {
      // "I'm in the hall", "I can see the belts" → carry on from that step
      const i = stepForStage(route, p.stage);
      if (i >= 0) {
        state.step = i;
        return out(state, reply('step', say(lang, 'lostFound')(p.stage) + ' ' + stepText(state, route)));
      }
    }
    if (p.progress && p.command !== 'back' && p.command !== 'repeat') {
      // "Taken", "done", "బ్యాగ్ తీసుకున్నాను" → that step is done; give the next one
      let next = state.step + 1;
      if (p.stage) {
        const last = route.steps.map((st) => st.stage).lastIndexOf(p.stage);
        if (last >= 0) next = Math.max(next, last + 1);
      }
      if (next >= route.steps.length) return out(state, finishRoute(state, route, lang));
      state.step = next;
      return out(state, reply('step', say(lang, 'doneAck') + ' ' + stepText(state, route)));
    }
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
      if (state.step + 1 >= route.steps.length) return out(state, finishRoute(state, route, lang));
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

  // 10. Fill in airport, terminal and destination
  const understood = p.airport || p.terminal || p.intent || state.lost || confirmedNow;
  if (!understood) {
    if (state.expecting === 'airport') {
      if (askedAgain('airport') >= 2) return out(state, reply('ask', say(lang, 'tapButtons').airport), { unknown: true });
      return out(state, reply('ask', say(lang, 'unknown') + ' ' + say(lang, 'askAirport')), { unknown: true });
    }
    if (state.expecting === 'terminal') {
      const a = data.airports[state.airport];
      if (askedAgain('terminal') >= 2) return out(state, reply('ask', say(lang, 'tapButtons').terminal), { unknown: true });
      return out(state, reply('ask', askTerminal(lang, a)), { unknown: true });
    }
    return out(state, reply('unknown', capabilities(lang)), { unknown: true });
  }

  if (p.airport && p.airport !== state.airport) {
    // A different airport makes the old terminal meaningless — unless the user
    // gave the terminal first ("terminal 1 paise" … "Dubai").
    if (state.airport) state.terminal = null;
    state.airport = p.airport;
    state.confirmed = false;
  }
  if (p.terminal && p.terminal !== state.terminal) { state.terminal = p.terminal; state.confirmed = false; }
  if (p.intent) state.dest = p.intent;
  state.step = 0;

  if (!state.airport) {
    Object.assign(state, { mode: 'ask', expecting: 'airport' });
    return out(state, reply('ask', state.lost ? say(lang, 'lostAskAirport') : say(lang, 'askAirport')));
  }
  const airport = data.airports[state.airport];
  const name = pick(airport.name, lang);

  // SIM / taxi / metro where we have no step-by-step route: short safe answer + staff card
  if (!hasRoute(data, state.airport, state.dest)) {
    Object.assign(state, { mode: 'info', expecting: null });
    return out(state, reply('info', say(lang, 'noRouteDest')(state.dest, name), { staff: { intent: state.dest, airport: state.airport } }));
  }

  const terms = terminalsOf(data, state.airport);
  if (terms.length === 1) state.terminal = terms[0];
  if (state.terminal && !terms.includes(state.terminal)) {
    Object.assign(state, { terminal: null, mode: 'ask', expecting: 'terminal' });
    return out(state, reply('ask', askTerminal(lang, airport, true)));
  }
  if (!state.terminal) {
    Object.assign(state, { mode: 'ask', expecting: 'terminal' });
    return out(state, reply('ask', askTerminal(lang, airport)));
  }

  // Before guiding anyone anywhere: "Dubai, Terminal 3. Is that right?"
  if (!state.confirmed) {
    Object.assign(state, { mode: 'confirm', expecting: 'confirm' });
    return out(state, reply('confirm', confirmQuestion(state, data)));
  }

  // Lost: airport and terminal known, now one question about what they can see
  if (state.lost) {
    Object.assign(state, { mode: 'lost', expecting: 'stage' });
    return out(state, reply('ask', say(lang, 'lostAsk')));
  }

  // 11. Everything known: build the route and read the first step
  const r = buildRoute(data, state.airport, state.terminal, state.dest);
  if (!r) {
    state.mode = 'ask';
    return out(state, reply('ask', say(lang, 'noRoute')));
  }
  Object.assign(state, { mode: 'route', expecting: null });
  // A terminal with no listed counter (Bengaluru T1) still gets its route: ATM or the other terminal
  const intro = say(lang, r.counter || state.dest !== 'exchange' ? 'intro' : 'introPlain')(r, lang);
  return out(state, reply('step', intro + ' ' + stepText(state, r), { intro }));
}

export { terminalLabel };
