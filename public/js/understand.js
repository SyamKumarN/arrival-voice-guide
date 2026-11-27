// understand.js — the optional AI fallback, kept on a short leash.
//
// When the rules don't understand a sentence (and only if the server has an AI key),
// the server asks an AI model to fill in this fixed form and nothing else:
//   { intent, airport, terminal, amounts, currency }
// The app then turns the form into a plain sentence its own rules understand and
// answers from its own data. The AI never writes the answer and never names a place.
// Shared by the browser (toSentence) and the server (SCHEMA, clean).

export const INTENTS = [
  'exchange', 'sim', 'taxi', 'metro', 'atm_where', 'atm_tips', 'price_check', 'amount_query',
  'money_tips', 'traps', 'transit', 'counter_closed', 'how_much_to_change', 'card_currency_choice',
  'forex_card', 'credit_card', 'debit_card', 'leftover_currency', 'excess_baggage', 'pickup',
  'ask_staff', 'no_staff', 'app_help', 'lost', 'next', 'repeat', 'back', 'cant_find', 'start_over',
  'yes', 'no', 'toilet', 'food', 'prayer_room', 'lounge', 'shops', 'missing_bag', 'none',
];
export const AIRPORT_CODES = ['DXB', 'BLR', 'DEL', 'SIN', 'BKK'];
export const TERMINALS = ['T1', 'T2', 'T3', 'T4', 'MAIN'];
export const CURRENCY_CODES = ['USD', 'AED', 'INR', 'THB', 'SGD', 'EUR', 'GBP'];

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
  },
  required: ['intent', 'airport', 'terminal', 'amounts', 'currency'],
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
  };
}

const AIRPORT_WORD = { DXB: 'dubai', BLR: 'bengaluru', DEL: 'delhi', SIN: 'singapore', BKK: 'bangkok' };
const CURRENCY_WORD = { USD: 'dollars', AED: 'dirhams', INR: 'rupees', THB: 'baht', SGD: 'sgd', EUR: 'euros', GBP: 'pounds' };
const INTENT_WORDS = {
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
  if (f.intent === 'amount_query' && f.amounts.length) {
    what = `how many ${f.currency ? CURRENCY_WORD[f.currency] : ''} for ${money(f.amounts[0])}`.replace(/\s+/g, ' ');
  } else if (f.intent === 'price_check' && f.amounts.length === 2 && f.amounts.every((a) => a.currency)) {
    // amounts[0] = what they hand over, amounts[1] = what the counter offers
    what = `they give ${money(f.amounts[1])} for ${money(f.amounts[0])}`;
  } else if (f.intent !== 'none') {
    what = INTENT_WORDS[f.intent] || '';
  }
  return [where, what].filter(Boolean).join(' ').trim();
}
