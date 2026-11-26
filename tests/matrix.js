// matrix.js — scenario tests: every airport × every language style × every scenario.
// Each scenario is a short conversation run through the real dialog code.

import { handle, initialState } from '../public/js/dialog.js';
import { staffLines } from '../public/js/phrases.js';
import { midRate } from '../public/js/price.js';

const STYLES = {
  en: { lang: 'en-IN' },
  hi: { lang: 'hi-IN' },          // Hindi in Devanagari
  hinglish: { lang: 'hi-IN' },    // Hindi in Latin letters
  te: { lang: 'te-IN' },
};

const AIRPORT_WORDS = {
  DXB: { en: 'Dubai', hi: 'दुबई', hinglish: 'dubai', te: 'దుబాయ్' },
  BLR: { en: 'Bengaluru', hi: 'बेंगलुरु', hinglish: 'bangalore', te: 'బెంగళూరు' },
  DEL: { en: 'Delhi', hi: 'दिल्ली', hinglish: 'delhi', te: 'ఢిల్లీ' },
  SIN: { en: 'Singapore', hi: 'सिंगापुर', hinglish: 'singapore', te: 'సింగపూర్' },
  BKK: { en: 'Bangkok', hi: 'बैंकॉक', hinglish: 'bangkok', te: 'బ్యాంకాక్' },
};

const NUM_WORD = {
  en: { 1: 'one', 2: 'two', 3: 'three', 4: 'four' },
  hi: { 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार' },
  hinglish: { 1: 'ek', 2: 'do', 3: 'teen', 4: 'char' },
  te: { 1: 'ఒకటి', 2: 'రెండు', 3: 'మూడు', 4: 'నాలుగు' },
};
const DEV_DIGITS = '०१२३४५६७८९';
const terminalPhrase = (style, n) => ({
  en: `terminal ${n}`,
  hi: `टर्मिनल ${DEV_DIGITS[n]}`,
  hinglish: `terminal ${NUM_WORD.hinglish[n]}`,
  te: `టెర్మినల్ ${n}`,
})[style];
const terminalAnswer = (style, n) => (style === 'en' ? String(n) : NUM_WORD[style][n]);

const SAY = {
  exchange: { en: 'I need to change money', hi: 'पैसे बदलने हैं', hinglish: 'paise exchange karne hain', te: 'డబ్బు మార్చాలి' },
  sim: { en: 'I want a SIM', hi: 'मुझे सिम चाहिए', hinglish: 'mujhe sim card chahiye', te: 'సిమ్ కావాలి' },
  taxi: { en: 'taxi to my hotel', hi: 'होटल जाने के लिए टैक्सी', hinglish: 'hotel ke liye taxi chahiye', te: 'హోటల్‌కి టాక్సీ' },
  next: { en: 'next', hi: 'आगे', hinglish: 'aage', te: 'తర్వాత' },
  repeat: { en: 'repeat', hi: 'दोबारा बोलो', hinglish: 'phir se bolo', te: 'మళ్ళీ చెప్పండి' },
  back: { en: 'go back', hi: 'पीछे', hinglish: 'peeche', te: 'వెనక్కి' },
  cantfind: { en: "I can't find it", hi: 'नहीं मिल रहा', hinglish: 'nahi mil raha', te: 'దొరకలేదు' },
  lost: { en: "I'm lost", hi: 'पता नहीं कहाँ हूँ', hinglish: 'pata nahi kahan hoon', te: 'నేను ఎక్కడున్నానో తెలియదు' },
  seeBelts: { en: 'I can see baggage belts', hi: 'बैगेज बेल्ट दिख रहे हैं', hinglish: 'baggage belt dikh rahe hain', te: 'బ్యాగేజ్ బెల్ట్‌లు కనిపిస్తున్నాయి' },
  staff: { en: 'ask staff', hi: 'स्टाफ से पूछना है', hinglish: 'staff se poochna hai', te: 'స్టాఫ్‌ని అడగాలి' },
  unknown: { en: "what's the weather like", hi: 'मौसम कैसा है', hinglish: 'mausam kaisa hai', te: 'వాతావరణం ఎలా ఉంది' },
};
// The capability line must mention SIM in the user's language
const CAPABILITY_MARK = { en: 'SIM', hi: 'सिम', hinglish: 'सिम', te: 'సిమ్' };

const CURRENCY_WORD = {
  AED: { en: 'dirhams', hi: 'दिरहम', hinglish: 'dirham', te: 'దిర్హామ్‌లు' },
  INR: { en: 'rupees', hi: 'रुपये', hinglish: 'rupaye', te: 'రూపాయలు' },
  SGD: { en: 'Singapore dollars', hi: 'सिंगापुर डॉलर', hinglish: 'singapore dollar', te: 'సింగపూర్ డాలర్లు' },
  THB: { en: 'baht', hi: 'बाट', hinglish: 'baht', te: 'బాట్' },
};
const priceSentence = (style, recv, cur) => ({
  en: `They give ${recv} ${CURRENCY_WORD[cur].en} for 100 dollars`,
  hi: `100 डॉलर के ${recv} ${CURRENCY_WORD[cur].hi} दे रहे हैं`,
  hinglish: `100 dollar ke ${recv} ${CURRENCY_WORD[cur].hinglish} de rahe hain`,
  te: `100 డాలర్లకు ${recv} ${CURRENCY_WORD[cur].te} ఇస్తున్నారు`,
})[style];

/** Build every scenario for one airport + style. Each: { name, turns: [[sentence, expect]] }. */
function scenarios(code, style, data, rates) {
  const a = data.airports[code];
  const multi = a.terminals.length > 1;
  const tNum = multi ? Number(a.terminals[a.terminals.length - 1].slice(1)) : null;
  const ap = AIRPORT_WORDS[code][style];
  const term = multi ? ' ' + terminalPhrase(style, tNum) : '';
  const say = (k) => SAY[k][style];
  const full = (intent) => `${ap}${term} ${say(intent)}`;
  const hasRoute = (dest) => dest === 'exchange' || !!(a[dest] && a[dest].routes);
  const routed = { kind: 'step', mode: 'route', step: 0 };
  const out = [];

  out.push({ name: 'exchange, airport + terminal in one go', turns: [[full('exchange'), { ...routed, dest: 'exchange' }]] });

  out.push({
    name: 'missing terminal → one question',
    turns: multi
      ? [[`${ap} ${say('exchange')}`, { kind: 'ask', expecting: 'terminal' }], [terminalAnswer(style, tNum), { ...routed, terminal: a.terminals[a.terminals.length - 1] }]]
      : [[`${ap} ${say('exchange')}`, { ...routed, terminal: 'MAIN' }]],
  });

  out.push({
    name: 'missing airport → one question',
    turns: [
      [say('exchange'), { kind: 'ask', expecting: 'airport' }],
      [ap, multi ? { kind: 'ask', expecting: 'terminal', airport: code } : { ...routed, airport: code }],
    ],
  });

  for (const dest of ['sim', 'taxi']) {
    out.push({
      name: `${dest}: ${hasRoute(dest) ? 'step-by-step route' : 'safe short answer + staff card'}`,
      turns: [[full(dest), hasRoute(dest)
        ? { ...routed, dest }
        : { kind: 'info', mode: 'info', dest, staffIntent: dest }]],
    });
  }

  out.push({
    name: 'next / repeat / back / can\'t find',
    turns: [
      [full('exchange'), routed],
      [say('next'), { kind: 'step', step: 1 }],
      [say('repeat'), { kind: 'step', step: 1 }],
      [say('back'), { kind: 'step', step: 0 }],
      [say('cantfind'), { kind: 'fallback', step: 0 }],
    ],
  });

  const local = a.currency;
  const recv = Math.round(100 * midRate(rates, 'USD', local) * 0.95);
  out.push({
    name: `price check (${local})`,
    turns: [
      [full('exchange'), routed],
      [priceSentence(style, recv, local), { kind: 'price', verdict: 'high', received: local, given: 'USD', mode: 'route' }],
    ],
  });

  out.push({
    name: 'lost → airport → terminal → "what do you see?" → baggage belts',
    turns: [
      [say('lost'), { kind: 'ask', expecting: 'airport' }],
      ...(multi
        ? [[ap, { kind: 'ask', expecting: 'terminal' }], [terminalAnswer(style, tNum), { kind: 'ask', expecting: 'stage', mode: 'lost' }]]
        : [[ap, { kind: 'ask', expecting: 'stage', mode: 'lost' }]]),
      [say('seeBelts'), { kind: 'step', mode: 'route', step: 1 }],
    ],
  });

  out.push({
    name: `ask staff card (${a.staffLanguage} + English)`,
    turns: [[full('exchange'), routed], [say('staff'), { kind: 'staff', staffIntent: 'exchange', staffAirport: code, staffLang: a.staffLanguage, mode: 'route' }]],
  });

  out.push({
    name: 'unknown request → what I can do, in the user\'s language',
    turns: [
      [say('unknown'), { kind: 'unknown', has: CAPABILITY_MARK[style] }],
      [full('exchange'), routed],
      [say('unknown'), { kind: 'help', step: 0, has: CAPABILITY_MARK[style] }],
    ],
  });

  return out;
}

export function runMatrix(data, rates) {
  const results = [];
  for (const code of Object.keys(data.airports)) {
    for (const [style, { lang }] of Object.entries(STYLES)) {
      for (const sc of scenarios(code, style, data, rates)) {
        let state = initialState(lang);
        const problems = [];
        sc.turns.forEach(([text, want], i) => {
          const r = handle(state, text, data, rates);
          state = r.state;
          const staff = r.reply.staff;
          const got = {
            kind: r.reply.kind, mode: state.mode, step: state.step, expecting: state.expecting,
            dest: state.dest, airport: state.airport, terminal: state.terminal,
            verdict: r.reply.price && r.reply.price.verdict,
            received: r.reply.price && r.reply.price.received.currency,
            given: r.reply.price && r.reply.price.given.currency,
            staffIntent: staff && staff.intent, staffAirport: staff && staff.airport,
            staffLang: staff && staffLines(staff.intent, data.airports[staff.airport].staffLanguage, lang)[0].lang,
          };
          for (const [k, v] of Object.entries(want)) {
            if (k === 'has') { if (!r.reply.text.includes(v)) problems.push(`turn ${i + 1} "${text}": reply lacks "${v}": ${r.reply.text}`); }
            else if (got[k] !== v) problems.push(`turn ${i + 1} "${text}": ${k} wanted ${v}, got ${got[k]} (reply: ${r.reply.text.slice(0, 90)})`);
          }
        });
        results.push({ group: `matrix ${code}`, name: `[${style}] ${sc.name}`, ok: problems.length === 0, detail: problems.join(' | ') });
      }
    }
  }
  return results;
}
