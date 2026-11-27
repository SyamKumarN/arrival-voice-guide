// matrix.js — scenario tests: every airport × every language style × every scenario.
// Each scenario is a short conversation run through the real dialog code. No keys, no network.

import { handle, initialState } from '../public/js/dialog.js';
import { staffLines, tipList, TIP_LISTS } from '../public/js/phrases.js';
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
  yes: { en: 'yes', hi: 'हाँ', hinglish: 'haan sahi hai', te: 'అవును' },
  no: { en: 'no', hi: 'नहीं', hinglish: 'nahi', te: 'కాదు' },
  exchange: { en: 'I need to change money', hi: 'पैसे बदलने हैं', hinglish: 'paise exchange karne hain', te: 'డబ్బు మార్చాలి' },
  sim: { en: 'I want a SIM', hi: 'मुझे सिम चाहिए', hinglish: 'mujhe sim card chahiye', te: 'సిమ్ కావాలి' },
  taxi: { en: 'taxi to my hotel', hi: 'होटल जाने के लिए टैक्सी', hinglish: 'hotel ke liye taxi chahiye', te: 'హోటల్‌కి టాక్సీ' },
  metro: { en: 'where is the metro', hi: 'मेट्रो कहाँ है', hinglish: 'metro kahan hai', te: 'మెట్రో ఎక్కడ' },
  next: { en: 'next', hi: 'आगे', hinglish: 'aage', te: 'తర్వాత' },
  repeat: { en: 'repeat', hi: 'दोबारा बोलो', hinglish: 'phir se bolo', te: 'మళ్ళీ చెప్పండి' },
  back: { en: 'go back', hi: 'पीछे', hinglish: 'peeche', te: 'వెనక్కి' },
  cantfind: { en: "I can't find it", hi: 'नहीं मिल रहा', hinglish: 'nahi mil raha', te: 'దొరకలేదు' },
  lost: { en: "I'm lost", hi: 'पता नहीं कहाँ हूँ', hinglish: 'pata nahi kahan hoon', te: 'నేను ఎక్కడున్నానో తెలియదు' },
  seeBelts: { en: 'I can see baggage belts', hi: 'बैगेज बेल्ट दिख रहे हैं', hinglish: 'baggage belt dikh rahe hain', te: 'బ్యాగేజ్ బెల్ట్‌లు కనిపిస్తున్నాయి' },
  staff: { en: 'ask staff', hi: 'स्टाफ से पूछना है', hinglish: 'staff se poochna hai', te: 'స్టాఫ్‌ని అడగాలి' },
  unknown: { en: "what's the weather like", hi: 'मौसम कैसा है', hinglish: 'mausam kaisa hai', te: 'వాతావరణం ఎలా ఉంది' },
  toilet: { en: 'where is the toilet', hi: 'टॉयलेट कहाँ है', hinglish: 'washroom kahan hai', te: 'టాయిలెట్ ఎక్కడ' },
  lostbag: { en: "my bag hasn't arrived", hi: 'मेरा सामान नहीं आया', hinglish: 'mera bag kho gaya', te: 'నా బ్యాగ్ రాలేదు' },
  transit: { en: 'I have a connecting flight', hi: 'मेरी कनेक्टिंग फ़्लाइट है', hinglish: 'meri connecting flight hai', te: 'నాకు కనెక్టింగ్ ఫ్లైట్ ఉంది' },
  closed: { en: 'the counter is closed', hi: 'काउंटर बंद है', hinglish: 'counter band hai', te: 'కౌంటర్ మూసి ఉంది' },
  howmuch: { en: 'how much money should I change', hi: 'कितने पैसे बदलूँ', hinglish: 'kitne paise badlu', te: 'ఎంత డబ్బు మార్చాలి' },
  atm: { en: 'where is the ATM', hi: 'एटीएम कहाँ है', hinglish: 'atm kahan hai', te: 'ఏటీఎం ఎక్కడ' },
  forex: { en: 'I have a forex card', hi: 'मेरे पास फॉरेक्स कार्ड है', hinglish: 'mere paas forex card hai', te: 'నా దగ్గర ఫారెక్స్ కార్డ్ ఉంది' },
  credit: { en: 'can I use my credit card', hi: 'क्रेडिट कार्ड चलेगा क्या', hinglish: 'credit card chalega kya', te: 'క్రెడిట్ కార్డ్ వాడొచ్చా' },
  debit: { en: 'I have a debit card', hi: 'मेरे पास डेबिट कार्ड है', hinglish: 'mere paas debit card hai', te: 'నా దగ్గర డెబిట్ కార్డ్ ఉంది' },
  dcc: { en: 'the machine asks rupees or local currency', hi: 'मशीन रुपये या लोकल करेंसी पूछ रही है', hinglish: 'rupaye mein pay karun ya local mein', te: 'రూపాయల్లోనా లోకల్ కరెన్సీలోనా అడుగుతోంది' },
  pickup: { en: 'my driver is picking me up', hi: 'मेरा ड्राइवर लेने आ रहा है', hinglish: 'mera driver pickup karega', te: 'నా డ్రైవర్ పికప్ చేస్తాడు' },
  leftover: { en: 'what do I do with leftover currency', hi: 'बचे हुए पैसे का क्या करूँ', hinglish: 'bacha hua paisa kya karun', te: 'మిగిలిన డబ్బు ఏం చేయాలి' },
  excessbag: { en: 'I have excess baggage', hi: 'अतिरिक्त सामान है', hinglish: 'extra baggage ka paisa dena hai', te: 'అదనపు లగేజీ ఉంది' },
  tips: { en: 'any tips', hi: 'कुछ सलाह दीजिए', hinglish: 'kuch tips do', te: 'చిట్కాలు చెప్పండి' },
  traps: { en: 'traps to avoid', hi: 'धोखे बताइए', hinglish: 'dhokhe batao', te: 'మోసాలు చెప్పండి' },
};
// The capability line must mention SIM in the user's language
const SIM_MARK = { en: 'SIM', hi: 'सिम', hinglish: 'सिम', te: 'సిమ్' };

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
  const lastT = a.terminals[a.terminals.length - 1];
  const tNum = multi ? Number(lastT.slice(1)) : null;
  const ap = AIRPORT_WORDS[code][style];
  const term = multi ? ' ' + terminalPhrase(style, tNum) : '';
  const say = (k) => SAY[k][style];
  const full = (intent) => `${ap}${term} ${say(intent)}`;
  const hasRoute = (dest) => dest === 'exchange' || !!(a[dest] && a[dest].routes);
  const routed = { kind: 'step', mode: 'route', step: 0 };
  const confirm = { kind: 'confirm', expecting: 'confirm', airport: code, terminal: lastT };
  // Start a route: say it, confirm it
  const start = (intent = 'exchange') => [[full(intent), confirm], [say('yes'), { ...routed, dest: intent }]];
  const info = (topic) => ({ kind: 'info', topic });
  const out = [];
  const add = (name, turns) => out.push({ name, turns });

  add('exchange: one sentence → confirm → route', start());
  add('missing terminal → one question → confirm', multi
    ? [[`${ap} ${say('exchange')}`, { kind: 'ask', expecting: 'terminal' }], [terminalAnswer(style, tNum), confirm], [say('yes'), routed]]
    : [[`${ap} ${say('exchange')}`, confirm], [say('yes'), routed]]);
  add('missing airport → one question', [
    [say('exchange'), { kind: 'ask', expecting: 'airport' }],
    [ap, multi ? { kind: 'ask', expecting: 'terminal', airport: code } : confirm],
  ]);
  add('confirm "no" → asks for the airport again', [[full('exchange'), confirm], [say('no'), { kind: 'ask', expecting: 'airport', airport: null }]]);

  for (const dest of ['sim', 'taxi']) {
    add(`${dest}: ${hasRoute(dest) ? 'confirm → step-by-step route' : 'safe short answer + staff card'}`,
      hasRoute(dest) ? start(dest) : [[full(dest), { kind: 'info', mode: 'info', dest, staffIntent: dest }]]);
  }
  add('metro: safe short answer + staff card', [[`${ap} ${say('metro')}`, { kind: 'info', dest: 'metro', staffIntent: 'metro', staffAirport: code }]]);

  add('next / repeat / back / can\'t find', [
    ...start(),
    [say('next'), { kind: 'step', step: 1 }],
    [say('repeat'), { kind: 'step', step: 1 }],
    [say('back'), { kind: 'step', step: 0 }],
    [say('cantfind'), { kind: 'fallback', step: 0 }],
  ]);

  // Walk the whole exchange route: the last step has the receipt line, then 3 money tips once
  const steps = a.routes[lastT].length;
  const receipt = { en: 'receipt', hi: 'रसीद', hinglish: 'रसीद', te: 'రసీదు' }[style];
  add('full route → receipt step → money tips once', [
    ...start(),
    ...Array.from({ length: steps - 1 }, (_, i) => [say('next'), { step: i + 1, ...(i === steps - 2 ? { has: receipt } : {}) }]),
    [say('next'), { kind: 'tips', mode: 'tips', tipsKey: 'money', tipsAt: 0 }],
    [say('next'), { tipsAt: 1 }], [say('next'), { tipsAt: 2 }],
    [say('next'), { kind: 'tips', mode: 'done' }],
  ]);

  const local = a.currency;
  const recv = Math.round(100 * midRate(rates, 'USD', local) * 0.95);
  add(`price check (${local}) mid-route`, [
    ...start(),
    [priceSentence(style, recv, local), { kind: 'price', verdict: 'high', received: local, given: 'USD', mode: 'route' }],
  ]);

  add('lost → airport → terminal → confirm → "what do you see?" → baggage belts', [
    [say('lost'), { kind: 'ask', expecting: 'airport' }],
    ...(multi ? [[ap, { kind: 'ask', expecting: 'terminal' }], [terminalAnswer(style, tNum), confirm]] : [[ap, confirm]]),
    [say('yes'), { kind: 'ask', expecting: 'stage', mode: 'lost' }],
    [say('seeBelts'), { kind: 'step', mode: 'route', step: a.routes[lastT].findIndex((id) => a.steps[id].stage === 'baggage') }],
  ]);

  add(`ask staff card (${a.staffLanguage} + English)`, [...start(),
    [say('staff'), { kind: 'staff', staffIntent: 'exchange', staffAirport: code, staffLang: a.staffLanguage, mode: 'route' }]]);

  add('off-topic (toilet) → polite scope line + staff card in the local language', [...start(),
    [say('toilet'), { kind: 'offtopic', staffIntent: 'toilet', staffAirport: code, staffLang: a.staffLanguage, mode: 'route', has: SIM_MARK[style] }]]);
  add('off-topic (missing bag) is not "I\'m lost"', [[`${ap} ${say('lostbag')}`, { kind: 'offtopic', staffIntent: 'lostbag', mode: 'start' }]]);

  for (const t of ['transit', 'howmuch', 'forex', 'credit', 'debit', 'dcc', 'leftover', 'excessbag']) {
    add(`advice: ${t} (keeps the route)`, [...start(), [say(t), { ...info(t), mode: 'route', step: 0 }]]);
  }
  add('advice: counter closed (keeps the route)', [...start(), [say('next'), { step: 1 }], [say('closed'), { ...info('closed'), mode: 'route', step: 1 }]]);

  for (const [t, key] of [['atm', 'atm'], ['pickup', 'taxi'], ['tips', 'money'], ['traps', 'traps']]) {
    const n = TIP_LISTS[key].en.length;
    add(`${t} → ${key} tips one at a time, then back to the route`, [
      ...start(),
      [say(t), { kind: 'tips', mode: 'tips', tipsKey: key, tipsAt: 0 }],
      [say('repeat'), { tipsAt: 0 }],
      ...Array.from({ length: n - 1 }, (_, i) => [say('next'), { tipsAt: i + 1 }]),
      [say('next'), { kind: 'tips', mode: 'route', step: 0 }],
    ]);
  }

  add('unknown request → what I can do, in the user\'s language', [
    [say('unknown'), { kind: 'unknown', has: SIM_MARK[style] }],
    ...start(),
    [say('unknown'), { kind: 'help', step: 0, has: SIM_MARK[style] }],
  ]);

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
            dest: state.dest, airport: state.airport, terminal: state.terminal, topic: r.reply.topic,
            verdict: r.reply.price && r.reply.price.verdict,
            received: r.reply.price && r.reply.price.received.currency,
            given: r.reply.price && r.reply.price.given.currency,
            staffIntent: staff && staff.intent, staffAirport: staff && staff.airport,
            staffLang: staff && staff.airport && staffLines(staff.intent, data.airports[staff.airport].staffLanguage, lang)[0].lang,
            tipsKey: r.reply.tips && r.reply.tips.key, tipsAt: r.reply.tips && r.reply.tips.i,
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

  // Every tip in the money and traps lists stays under 15 spoken words, in every language;
  // every list has the same number of tips in every language; every staff question exists in every language.
  for (const key of Object.keys(TIP_LISTS)) {
    for (const l of ['en', 'hi', 'te']) {
      const list = tipList(key, l);
      const same = list.length === TIP_LISTS[key].en.length;
      const long = ['money', 'traps'].includes(key) ? list.filter((t) => t.split(/\s+/).length >= 15) : [];
      results.push({ group: 'tip lists', name: `${key} [${l}] ${list.length} tips${['money', 'traps'].includes(key) ? ', each under 15 words' : ''}`,
        ok: same && long.length === 0, detail: long.length ? `too long: ${long.join(' | ')}` : `count ${list.length}` });
    }
  }
  const intents = ['exchange', 'sim', 'taxi', 'metro', 'toilet', 'prayer', 'food', 'shop', 'lounge', 'lostbag'];
  for (const l of ['en', 'ar', 'th', 'hi', 'te']) {
    const missing = intents.filter((i) => !staffLines(i, l === 'en' ? 'en' : l, 'en-IN').every((x) => x.text));
    results.push({ group: 'staff cards', name: `[${l}] question for ${intents.length} topics`, ok: missing.length === 0, detail: `missing: ${missing.join(', ')}` });
  }
  return results;
}
