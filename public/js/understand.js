// understand.js — the optional AI fallback, kept on a short leash.
//
// When the rules don't understand a sentence (and only if the server has an AI key),
// the server asks an AI model to fill in this fixed form and nothing else:
//   { intent, airport, terminal, amounts, currency }
// The app then turns the form into a plain sentence its own rules understand and
// answers from its own data. The AI never writes the answer and never names a place.
// Shared by the browser (toSentence) and the server (SCHEMA, clean).

export const INTENTS = [
  'next_step', 'step_done', 'jump_to_step', 'list_counters', 'lost_answer', 'how_much',
  'exchange', 'sim', 'taxi', 'metro', 'atm_where', 'atm_tips', 'price_check', 'amount_query',
  'money_tips', 'traps', 'transit', 'counter_closed', 'how_much_to_change', 'card_currency_choice',
  'forex_card', 'credit_card', 'debit_card', 'leftover_currency', 'excess_baggage', 'pickup',
  'ask_staff', 'no_staff', 'app_help', 'lost', 'next', 'repeat', 'back', 'cant_find', 'start_over',
  'yes', 'no', 'toilet', 'food', 'prayer_room', 'lounge', 'shops', 'missing_bag', 'none',
];
export const AIRPORT_CODES = ['DXB', 'BLR', 'DEL', 'SIN', 'BKK'];
export const TERMINALS = ['T1', 'T2', 'T3', 'T4', 'MAIN'];
export const CURRENCY_CODES = ['USD', 'AED', 'INR', 'THB', 'SGD', 'EUR', 'GBP'];
export const STAGES = ['immigration', 'baggage', 'customs', 'arrivals'];

/** JSON schema for the AI's answer (structured output: it can't return anything else). */
export const SCHEMA = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: INTENTS },
    airport: { type: 'string', enum: [...AIRPORT_CODES, 'none'] },
    terminal: { type: 'string', enum: [...TERMINALS, 'none'] },
    amounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { amount: { type: 'number' }, currency: { type: 'string', enum: [...CURRENCY_CODES, 'unknown'] } },
        required: ['amount', 'currency'],
        additionalProperties: false,
      },
    },
    currency: { type: 'string', enum: [...CURRENCY_CODES, 'none'] },
    step: { type: 'integer' },
    stage: { type: 'string', enum: [...STAGES, 'none'] },
  },
  required: ['intent', 'airport', 'terminal', 'amounts', 'currency', 'step', 'stage'],
  additionalProperties: false,
};

/** Check the AI's answer again (never trust it): anything off-list becomes null. */
export function clean(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const one = (v, list) => (list.includes(v) ? v : null);
  const amounts = Array.isArray(raw.amounts) ? raw.amounts.slice(0, 2)
    .filter((a) => a && Number.isFinite(a.amount) && a.amount > 0 && a.amount < 1e9)
    .map((a) => ({ amount: Math.round(a.amount * 100) / 100, currency: one(a.currency, CURRENCY_CODES) })) : [];
  return {
    intent: one(raw.intent, INTENTS) || 'none',
    airport: one(raw.airport, AIRPORT_CODES),
    terminal: one(raw.terminal, TERMINALS),
    amounts,
    currency: one(raw.currency, CURRENCY_CODES),
    step: Number.isInteger(raw.step) && raw.step >= 1 && raw.step <= 12 ? raw.step : 0,
    stage: one(raw.stage, STAGES),
  };
}

/**
 * What the AI is told about the conversation so far: place, current step (and all steps,
 * so "I'm in the hall" can pick one), the last question asked, and amounts said earlier.
 * Only the guide's own English text: nothing personal.
 */
export function buildContext(state, data, lastReply, buildRouteFn) {
  const a = state.airport && data.airports[state.airport];
  let steps = [];
  if (a && state.terminal && buildRouteFn) {
    const r = buildRouteFn(data, state.airport, state.terminal, state.dest || 'exchange');
    if (r) steps = r.steps.map((st, i) => ({ n: i + 1, stage: st.stage, text: String(st.text.en || '').slice(0, 160) }));
  }
  const asked = lastReply && ['ask', 'confirm', 'info', 'step', 'tips'].includes(lastReply.kind) ? String(lastReply.text || '').slice(0, 240) : null;
  return {
    airport: state.airport || null,
    terminal: state.terminal || null,
    intent: state.dest || null,
    mode: state.mode,
    expecting: state.expecting || null,
    step: state.mode === 'route' && steps.length ? { number: state.step + 1, of: steps.length } : null,
    steps,
    lastAppMessage: asked,
    readingList: state.mode === 'tips' && state.tips ? state.tips.key : null,
    amountSaidEarlier: state.lastAmount || null,
  };
}

const TOPIC_OF = {
  atm_where: 'atmwhere', atm_tips: 'atm', money_tips: 'tips', traps: 'traps', transit: 'transit', counter_closed: 'closed',
  how_much_to_change: 'howmuch', card_currency_choice: 'dcc', forex_card: 'forex', credit_card: 'credit', debit_card: 'debit',
  leftover_currency: 'leftover', excess_baggage: 'excessbag', pickup: 'pickup', no_staff: 'nostaff', app_help: 'apphelp',
  list_counters: 'counters',
};
const OFFTOPIC_OF = { toilet: 'toilet', food: 'food', prayer_room: 'prayer', lounge: 'lounge', shops: 'shop', missing_bag: 'lostbag' };
const COMMAND_OF = { next: 'next', next_step: 'next', lost: 'lost', repeat: 'repeat', back: 'back', cant_find: 'cantfind', start_over: 'restart', ask_staff: 'staff' };
const TIP_INTENTS = ['pickup', 'money_tips', 'atm_tips', 'traps', 'ask_staff'];

/**
 * Turn the AI's form into the same shape parse() returns, so the dialog answers it from our data.
 * Returns null (use the rules) when the AI found nothing, or when it would answer a
 * "taken / I'm in the hall" sentence with a tip list or the staff card.
 */
export function formToParsed(form, rules, state = null) {
  const f = clean(form);
  if (!f || f.intent === 'none') return null;
  // The model often repeats the airport/terminal from the context; only a *new* place counts as said
  if (state) {
    if (f.airport && f.airport === state.airport) f.airport = null;
    if (f.terminal && f.terminal === state.terminal && !f.airport) f.terminal = null;
  }
  if (rules && (rules.progress || rules.atPlace) && TIP_INTENTS.includes(f.intent)) return null;
  const p = {
    raw: rules ? rules.raw : '', norm: rules ? rules.norm : '',
    airport: f.airport, terminal: f.terminal, intent: null, command: null, stage: null, topic: null, offtopic: null,
    yesno: null, price: null, amounts: [], numbers: [], amountQuery: null, priceCheck: false,
    progress: false, atPlace: false, offered: false, jumpStep: null,
  };
  const i = f.intent;
  if (['exchange', 'sim', 'taxi', 'metro'].includes(i)) p.intent = i;
  else if (COMMAND_OF[i]) p.command = COMMAND_OF[i];
  else if (TOPIC_OF[i]) p.topic = TOPIC_OF[i];
  else if (OFFTOPIC_OF[i]) p.offtopic = OFFTOPIC_OF[i];
  else if (i === 'yes' || i === 'no') p.yesno = i;
  else if (i === 'step_done') { p.progress = true; p.stage = f.stage; }
  else if (i === 'jump_to_step') { if (f.step) p.jumpStep = f.step - 1; else if (f.stage) { p.stage = f.stage; p.atPlace = true; } else return null; }
  else if (i === 'lost_answer') { if (!f.stage) return null; p.stage = f.stage; p.atPlace = true; }
  else if (i === 'price_check') {
    const [a, b] = f.amounts;
    if (a && b && a.currency && b.currency) p.price = { given: { amount: a.amount, currency: a.currency }, received: { amount: b.amount, currency: b.currency } };
    else if (a) { p.amounts = [{ amount: a.amount, currency: a.currency, given: false }]; p.numbers = [a.amount]; p.offered = true; if (!a.currency) p.amounts = []; }
    else p.priceCheck = true;
  } else if (i === 'amount_query' || i === 'how_much') {
    const a = f.amounts[0];
    if (!a) return null;
    p.amountQuery = { amount: a.amount, from: a.currency, to: f.currency };
  } else return null;
  return p;
}

const AIRPORT_WORD = { DXB: 'dubai', BLR: 'bengaluru', DEL: 'delhi', SIN: 'singapore', BKK: 'bangkok' };
const CURRENCY_WORD = { USD: 'dollars', AED: 'dirhams', INR: 'rupees', THB: 'baht', SGD: 'sgd', EUR: 'euros', GBP: 'pounds' };
const INTENT_WORDS = {
  next_step: 'next', step_done: 'done', list_counters: 'which exchange counters are here',
  exchange: 'change money', sim: 'sim card', taxi: 'taxi', metro: 'metro', atm_where: 'where is the atm',
  atm_tips: 'atm tips', price_check: 'price check', money_tips: 'money tips', traps: 'traps to avoid',
  transit: 'connecting flight', counter_closed: 'the counter is closed', how_much_to_change: 'how much should i change',
  card_currency_choice: 'the card machine asks rupees or local currency', forex_card: 'forex card', credit_card: 'credit card',
  debit_card: 'debit card', leftover_currency: 'leftover currency', excess_baggage: 'excess baggage',
  pickup: 'my driver is picking me up', ask_staff: 'ask staff', no_staff: 'nobody is here', app_help: 'flight mode',
  lost: "i'm lost", next: 'next', repeat: 'repeat', back: 'go back', cant_find: "can't find it", start_over: 'start over',
  yes: 'yes', no: 'no', toilet: 'toilet', food: 'food', prayer_room: 'prayer room', lounge: 'lounge', shops: 'shops',
  missing_bag: "my bag hasn't arrived",
};

/**
 * Turn the cleaned form into an English sentence our rules understand,
 * e.g. { intent: 'amount_query', amounts: [{500, USD}], currency: 'AED' } → "how many dirhams for 500 dollars".
 * Returns '' when there's nothing usable.
 */
export function toSentence(form) {
  const f = clean(form);
  if (!f) return '';
  const where = [f.airport ? AIRPORT_WORD[f.airport] : '', f.terminal && f.terminal !== 'MAIN' ? 'terminal ' + f.terminal.slice(1) : '']
    .filter(Boolean).join(' ');
  const money = (a) => (a.currency ? `${a.amount} ${CURRENCY_WORD[a.currency]}` : String(a.amount));
  let what = '';
  if ((f.intent === 'amount_query' || f.intent === 'how_much') && f.amounts.length) {
    what = `how many ${f.currency ? CURRENCY_WORD[f.currency] : ''} for ${money(f.amounts[0])}`.replace(/\s+/g, ' ');
  } else if (f.intent === 'price_check' && f.amounts.length === 2 && f.amounts.every((a) => a.currency)) {
    // amounts[0] = what they hand over, amounts[1] = what the counter offers
    what = `they give ${money(f.amounts[1])} for ${money(f.amounts[0])}`;
  } else if (f.intent !== 'none') {
    what = INTENT_WORDS[f.intent] || '';
  }
  return [where, what].filter(Boolean).join(' ').trim();
}
