// suite.js — test cases for the parser, numbers, price check and the full flow.
// Runs in Node (tests/run-tests.js) and in a browser (import this file and call runSuite).

import { parse } from '../public/js/parser.js';
import { findNumbers, splitJoined } from '../public/js/numbers.js';
import { normalise } from '../public/js/text.js';
import { comparePrice } from '../public/js/price.js';
import { handle, initialState } from '../public/js/dialog.js';

const num = (s) => {
  const n = findNumbers(splitJoined(normalise(s).tokens));
  return n.length ? n[0].value : null;
};

// ---------- 1. Understanding sentences (English, Hindi, Hinglish, Telugu) ----------
export const PARSE_CASES = [
  // [language, sentence, expected fields, context]
  ['en', "I'm at Dubai terminal 3, I need to change currency", { airport: 'DXB', terminal: 'T3', intent: 'exchange' }],
  ['en', 'Dubai T1, where can I exchange money?', { airport: 'DXB', terminal: 'T1', intent: 'exchange' }],
  ['en', 'Bangkok airport money exchange', { airport: 'BKK', intent: 'exchange' }],
  ['en', 'third terminal Dubai', { airport: 'DXB', terminal: 'T3' }],
  ['hi', 'मैं दुबई टर्मिनल ३ पर हूँ, पैसे बदलने हैं', { airport: 'DXB', terminal: 'T3', intent: 'exchange' }],
  ['hi', 'दुबई टर्मिनल दो', { airport: 'DXB', terminal: 'T2' }],
  ['hi', 'दुबई के तीसरे टर्मिनल पर करेंसी एक्सचेंज कहाँ है', { airport: 'DXB', terminal: 'T3', intent: 'exchange' }],
  ['hinglish', 'dubai terminal teen pe hoon paise exchange karne hai', { airport: 'DXB', terminal: 'T3', intent: 'exchange' }],
  ['hinglish', 'Dubai T1 currency exchange kahan hai', { airport: 'DXB', terminal: 'T1', intent: 'exchange' }],
  ['hinglish', 'singapore changi terminal 2 paise badalne hain', { airport: 'SIN', terminal: 'T2', intent: 'exchange' }],
  ['te', 'నేను దుబాయ్ టెర్మినల్ 3 లో ఉన్నాను, డబ్బు మార్చాలి', { airport: 'DXB', terminal: 'T3', intent: 'exchange' }],
  ['te', 'దుబాయ్ టెర్మినల్ మూడు', { airport: 'DXB', terminal: 'T3' }],
  ['te', 'దుబాయ్ మూడో టెర్మినల్‌లో కరెన్సీ ఎక్కడ', { airport: 'DXB', terminal: 'T3', intent: 'exchange' }],
  // Answering "Which terminal?" with one word
  ['hinglish', 'teen', { terminal: 'T3' }, { expecting: 'terminal' }],
  ['hi', 'तीन', { terminal: 'T3' }, { expecting: 'terminal' }],
  ['te', 'మూడు', { terminal: 'T3' }, { expecting: 'terminal' }],
  ['en', 'terminal one', { terminal: 'T1' }],
  // Commands
  ['en', 'next', { command: 'next' }],
  ['en', "I can't find it", { command: 'cantfind' }],
  ['en', 'say that again', { command: 'repeat' }],
  ['en', 'start over', { command: 'restart' }],
  ['hinglish', 'aage', { command: 'next' }],
  ['hinglish', 'phir se bolo', { command: 'repeat' }],
  ['hinglish', 'counter nahi mil raha', { command: 'cantfind' }],
  ['hi', 'अगला', { command: 'next' }],
  ['hi', 'दोबारा बोलो', { command: 'repeat' }],
  ['hi', 'नहीं मिल रहा', { command: 'cantfind' }],
  ['te', 'దొరకలేదు', { command: 'cantfind' }],
  ['te', 'మళ్ళీ చెప్పండి', { command: 'repeat' }],
  ['te', 'తర్వాత', { command: 'next' }],
  // SIM and taxi (the phrases from the phone test)
  ['en', 'I want a SIM', { intent: 'sim' }],
  ['en', 'where can I buy a sim card', { intent: 'sim' }],
  ['en', 'taxi stand', { intent: 'taxi' }],
  ['en', 'I need a cab to my hotel', { intent: 'taxi' }],
  ['hi', 'मुझे सिम चाहिए', { intent: 'sim' }],
  ['hi', 'होटल जाने के लिए टैक्सी', { intent: 'taxi' }],
  ['hi', 'कैब कहाँ मिलेगी', { intent: 'taxi' }],
  ['hinglish', 'mujhe sim card chahiye', { intent: 'sim' }],
  ['hinglish', 'hotel ke liye taxi chahiye', { intent: 'taxi' }],
  ['te', 'సిమ్ కావాలి', { intent: 'sim' }],
  ['te', 'సిమ్ కార్డ్ ఎక్కడ', { intent: 'sim' }],
  ['te', 'హోటల్‌కి టాక్సీ', { intent: 'taxi' }],
  ['te', 'క్యాబ్ కావాలి', { intent: 'taxi' }],
  ['en', 'Dubai T3 sim', { airport: 'DXB', terminal: 'T3', intent: 'sim' }],
  // New airports
  ['en', 'Bengaluru terminal 2, change money', { airport: 'BLR', terminal: 'T2', intent: 'exchange' }],
  ['hi', 'दिल्ली टर्मिनल ३ पैसे बदलने हैं', { airport: 'DEL', terminal: 'T3', intent: 'exchange' }],
  ['te', 'బెంగళూరు టెర్మినల్ 1', { airport: 'BLR', terminal: 'T1' }],
  // Lost, ask staff, and "what do you see?" answers
  ['en', "I'm lost", { command: 'lost' }],
  ['hi', 'पता नहीं कहाँ हूँ', { command: 'lost' }],
  ['te', 'నేను ఎక్కడున్నానో తెలియదు', { command: 'lost' }],
  ['en', 'ask staff', { command: 'staff' }],
  ['hi', 'स्टाफ से पूछना है', { command: 'staff' }],
  ['te', 'స్టాఫ్‌ని అడగాలి', { command: 'staff' }],
  ['en', 'I see passport counters', { stage: 'immigration' }],
  ['hi', 'कस्टम्स दिख रहा है', { stage: 'customs' }],
  ['te', 'అరైవల్స్ హాల్', { stage: 'arrivals' }],
  // Off-topic requests → staff (all three languages)
  ['en', 'where is the toilet', { offtopic: 'toilet', intent: null }],
  ['en', 'I want to buy some books', { offtopic: 'shop' }],
  ['en', 'where can I buy alcohol', { offtopic: 'shop' }],
  ['en', 'I need coffee', { offtopic: 'food' }],
  ['en', 'where is the duty free', { offtopic: 'shop' }],
  ['en', 'which way to the lounge', { offtopic: 'lounge' }],
  ['en', 'is there a prayer room', { offtopic: 'prayer' }],
  ['en', "my bag hasn't arrived", { offtopic: 'lostbag', command: null }],
  ['en', 'I lost my luggage', { offtopic: 'lostbag', command: null }],
  ['hi', 'टॉयलेट कहाँ है', { offtopic: 'toilet' }],
  ['hi', 'मुझे भूख लगी है, खाना कहाँ मिलेगा', { offtopic: 'food' }],
  ['hi', 'नमाज़ के लिए जगह', { offtopic: 'prayer' }],
  ['hi', 'मेरा सामान नहीं आया', { offtopic: 'lostbag', command: null }],
  ['hi', 'ड्यूटी फ्री कहाँ है', { offtopic: 'shop' }],
  ['hinglish', 'washroom kahan hai', { offtopic: 'toilet' }],
  ['hinglish', 'chai kahan milegi', { offtopic: 'food' }],
  ['hinglish', 'mera bag kho gaya', { offtopic: 'lostbag', command: null }],
  ['te', 'టాయిలెట్ ఎక్కడ', { offtopic: 'toilet' }],
  ['te', 'కాఫీ ఎక్కడ దొరుకుతుంది', { offtopic: 'food' }],
  ['te', 'లాంజ్ ఎక్కడ ఉంది', { offtopic: 'lounge' }],
  ['te', 'నా బ్యాగ్ రాలేదు', { offtopic: 'lostbag', command: null }],
  ['en', 'book a cab to my hotel', { intent: 'taxi', offtopic: null }],
  // Metro and advice topics
  ['en', 'where is the metro', { intent: 'metro' }],
  ['hi', 'मेट्रो कहाँ है', { intent: 'metro' }],
  ['te', 'మెట్రో ఎక్కడ', { intent: 'metro' }],
  ['en', 'I have a connecting flight', { topic: 'transit' }],
  ['hi', 'मेरी कनेक्टिंग फ़्लाइट है', { topic: 'transit' }],
  ['te', 'నాకు కనెక్టింగ్ ఫ్లైట్ ఉంది', { topic: 'transit' }],
  ['en', 'the counter is closed', { topic: 'closed' }],
  ['hi', 'काउंटर बंद है', { topic: 'closed' }],
  ['te', 'కౌంటర్ మూసి ఉంది', { topic: 'closed' }],
  ['en', 'how much money should I change', { topic: 'howmuch' }],
  ['hi', 'कितने पैसे बदलूँ', { topic: 'howmuch' }],
  ['te', 'ఎంత డబ్బు మార్చాలి', { topic: 'howmuch' }],
  ['en', 'the card machine asks rupees or dirhams', { topic: 'dcc' }],
  ['hinglish', 'rupaye mein pay karun ya dirham mein', { topic: 'dcc' }],
  ['en', 'where is an ATM', { topic: 'atm' }],
  ['hi', 'एटीएम कहाँ है', { topic: 'atm' }],
  ['te', 'ఏటీఎం ఎక్కడ', { topic: 'atm' }],
  ['en', 'I have a forex card', { topic: 'forex' }],
  ['en', 'can I use my credit card', { topic: 'credit' }],
  ['en', 'what about my debit card', { topic: 'debit' }],
  ['hi', 'मेरे पास फॉरेक्स कार्ड है', { topic: 'forex' }],
  ['hi', 'क्रेडिट कार्ड से पैसे निकालूँ?', { topic: 'credit' }],
  ['te', 'నా దగ్గర డెబిట్ కార్డ్ ఉంది', { topic: 'debit' }],
  ['en', 'I have a card, what should I do', { topic: 'cards' }],
  ['en', 'my driver is picking me up', { topic: 'pickup', intent: null }],
  ['te', 'నా డ్రైవర్ పికప్ చేస్తాడు', { topic: 'pickup' }],
  ['en', 'any tips', { topic: 'tips' }],
  ['hi', 'कुछ सलाह दीजिए', { topic: 'tips' }],
  ['hi', 'टिप्स बताइए', { topic: 'tips' }],
  ['te', 'చిట్కాలు చెప్పండి', { topic: 'tips' }],
  ['en', 'traps to avoid', { topic: 'traps' }],
  ['hi', 'धोखे बताइए', { topic: 'traps' }],
  ['te', 'మోసాలు చెప్పండి', { topic: 'traps' }],
  // Yes / no only count when we've just asked "Is that right?"
  ['en', 'yes', { yesno: 'yes' }, { expecting: 'confirm' }],
  ['hi', 'हाँ सही है', { yesno: 'yes' }, { expecting: 'confirm' }],
  ['te', 'అవును', { yesno: 'yes' }, { expecting: 'confirm' }],
  ['hi', 'नहीं', { yesno: 'no' }, { expecting: 'confirm' }],
  ['te', 'కాదు', { yesno: 'no' }, { expecting: 'confirm' }],
  ['en', 'no', { yesno: null }],
  // Things that must NOT be understood
  ['en', 'hello there', { airport: null, terminal: null, command: null, intent: null }],
  ['en', 'what do I do now', { numbers: [] }],
  ['en', 'I booked a hotel', { command: null }],
];

// ---------- 2. Numbers ----------
export const NUMBER_CASES = [
  ['satrah sau', 1700], ['पाँच सौ', 500], ['पांच सौ', 500], ['सत्रह सौ', 1700],
  ['do hazaar paanch sau', 2500], ['five hundred', 500], ['seventeen hundred', 1700],
  ['one thousand seven hundred', 1700], ['twenty five', 25], ['1,700', 1700], ['१७००', 1700],
  ['ఐదు వందలు', 500], ['ఐదువందలు', 500], ['పదిహేడు వందల', 1700], ['5k', 5000], ['3.6725', 3.6725],
  ['ek lakh', 100000], ['1,00,000', 100000],
];

// ---------- 3. Price check (rates from the bundled sample file) ----------
export const PRICE_CASES = [
  // [lang, sentence, given, received, expected diff % (rounded to 1 dp), verdict, local currency]
  ['en', 'They give 1700 dirhams for 500 dollars', ['USD', 500], ['AED', 1700], -7.4, 'high', 'AED'],
  ['en', 'for 500 dollars they are giving 1800 AED', ['USD', 500], ['AED', 1800], -2.0, 'ok', 'AED'],
  ['en', 'They give 1830 dirhams for $500', ['USD', 500], ['AED', 1830], -0.3, 'fair', 'AED'],
  ['en', 'for 10000 rupees they give 380 dirhams', ['INR', 10000], ['AED', 380], -4.4, 'high', 'AED'],
  ['hinglish', '500 dollar ke satrah sau dirham de rahe hain', ['USD', 500], ['AED', 1700], -7.4, 'high', 'AED'],
  ['hi', 'पाँच सौ डॉलर के सत्रह सौ दिरहम दे रहे हैं', ['USD', 500], ['AED', 1700], -7.4, 'high', 'AED'],
  ['te', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు', ['USD', 500], ['AED', 1700], -7.4, 'high', 'AED'],
  ['te', 'ఐదువందల డాలర్లకు పదిహేడు వందల దిర్హామ్‌లు ఇస్తున్నారు', ['USD', 500], ['AED', 1700], -7.4, 'high', 'AED'],
  ['en', 'they give 15000 baht for 500 dollars', ['USD', 500], ['THB', 15000], -12.0, 'bad', 'THB'],
];

// ---------- 4. Full conversations ----------
export const FLOW_CASES = [
  {
    name: 'English: Dubai T3 → confirm → next / can\'t find / repeat / back / finish → money tips once',
    lang: 'en-IN',
    turns: [
      ['Dubai terminal 3, I need currency', { kind: 'confirm', expecting: 'confirm', has: 'Dubai, Terminal 3. Is that right?' }],
      ['yes', { kind: 'step', mode: 'route', step: 0, has: 'Step 1 of 5' }],
      ['next', { kind: 'step', step: 1, has: 'Travelex' }],
      ["can't find", { kind: 'fallback', step: 1, has: 'information desk' }],
      ['repeat', { kind: 'step', step: 1, has: 'Step 2 of 5' }],
      ['back', { kind: 'step', step: 0 }],
      ['next', { step: 1 }], ['next', { step: 2 }], ['next', { step: 3, has: 'Customs Hall exit' }],
      ['next', { step: 4, has: 'ask for a receipt' }],
      ['next', { kind: 'tips', mode: 'tips', has: 'Tip 1 of 3' }],
      ['next', { kind: 'tips', has: 'Tip 2 of 3' }],
      ['repeat', { kind: 'tips', has: 'Tip 2 of 3' }],
      ['next', { kind: 'tips', has: 'Tip 3 of 3' }],
      ['next', { kind: 'tips', mode: 'done', has: "That's all the tips" }],
      ['repeat', { kind: 'step', mode: 'route', step: 4 }],
      ['next', { kind: 'done', mode: 'done' }],      // tips are offered only once
    ],
  },
  {
    name: 'Hindi: missing terminal → "teen" → confirm "हाँ"',
    lang: 'hi-IN',
    turns: [
      ['दुबई में पैसे बदलने हैं', { kind: 'ask', expecting: 'terminal', has: 'कौन सा टर्मिनल' }],
      ['teen', { kind: 'confirm', has: 'क्या यह सही है' }],
      ['हाँ', { kind: 'step', mode: 'route', step: 0, has: 'कदम 1' }],
      ['आगे', { step: 1, has: 'ट्रैवलेक्स' }],
      ['नहीं मिल रहा', { kind: 'fallback', has: 'इन्फ़ॉर्मेशन डेस्क' }],
      ['500 dollar ke satrah sau dirham de rahe hain', { kind: 'price', has: '7.4 प्रतिशत कम', step: 1 }],
      ['agla', { step: 2 }],
    ],
  },
  {
    name: 'Hinglish: missing airport → asks → "दुबई" → confirm',
    lang: 'hi-IN',
    turns: [
      ['terminal 1 paise exchange', { kind: 'ask', expecting: 'airport' }],
      ['दुबई', { kind: 'confirm', expecting: 'confirm' }],
      ['haan sahi hai', { kind: 'step', mode: 'route', has: 'अल अंसारी' }],
    ],
  },
  {
    name: 'Telugu: Dubai T1 → అవును → route and can\'t find',
    lang: 'te-IN',
    turns: [
      ['దుబాయ్ టెర్మినల్ 1 డబ్బు మార్చాలి', { kind: 'confirm' }],
      ['అవును', { kind: 'step', mode: 'route', has: 'అల్ అన్సారీ' }],
      ['దొరకలేదు', { kind: 'fallback' }],
    ],
  },
  {
    name: 'Confirm: "no" asks for the airport again; "no, terminal 1" corrects the terminal',
    lang: 'en-IN',
    turns: [
      ['Dubai terminal 3', { kind: 'confirm' }],
      ['no, terminal 1', { kind: 'confirm', terminal: 'T1', has: 'Terminal 1' }],
      ['no', { kind: 'ask', expecting: 'airport', airport: null }],
      ['Delhi', { kind: 'ask', expecting: 'terminal' }],
      ['3', { kind: 'confirm', has: 'Delhi, Terminal 3' }],
      ['yes', { kind: 'step', mode: 'route' }],
    ],
  },
  {
    name: 'Wrong terminal number gets one clear question',
    lang: 'en-IN',
    turns: [
      ['Dubai terminal 4', { kind: 'ask', expecting: 'terminal', has: 'terminals 1, 2 or 3' }],
      ['2', { kind: 'confirm' }],
      ['yes', { kind: 'step', mode: 'route', has: 'Central corridor' }],
    ],
  },
  {
    name: 'Bangkok has one terminal, so no terminal question',
    lang: 'en-IN',
    turns: [['Bangkok, need to change money', { kind: 'confirm', has: 'Bangkok Suvarnabhumi. Is that right?' }], ['yes', { kind: 'step', mode: 'route', has: 'Basement' }]],
  },
  {
    name: 'Lost after a Bangkok taxi answer, then corrects the airport to Dubai',
    lang: 'en-IN',
    turns: [
      ['Bangkok, taxi to my hotel', { kind: 'info', mode: 'info', has: 'ignore people offering rides' }],
      ["I'm lost", { kind: 'confirm' }],
      ['Dubai', { kind: 'ask', expecting: 'terminal' }],
      ['1', { kind: 'confirm' }],
      ['yes', { kind: 'ask', expecting: 'stage', mode: 'lost' }],
      ['arrivals hall', { kind: 'step', mode: 'route', step: 3, has: 'arrivals hall' }],
    ],
  },
  {
    name: 'Tips and traps mid-route, then back to the route',
    lang: 'en-IN',
    turns: [
      ['Dubai T2 exchange', { kind: 'confirm' }], ['yes', { mode: 'route', step: 0 }], ['next', { step: 1 }],
      ['traps to avoid', { kind: 'tips', mode: 'tips', has: '5 traps to avoid. Tip 1 of 5' }],
      ['back', { has: 'Tip 1 of 5' }],
      ['next', { has: 'Tip 2 of 5' }], ['next', {}], ['next', {}], ['next', { has: 'Tip 5 of 5' }],
      ['next', { mode: 'route', has: 'Say repeat' }],
      ['repeat', { kind: 'step', step: 1 }],
      ['tips', { kind: 'tips', has: 'Tip 1 of 3' }],
      ['next', { has: 'Tip 2 of 3' }],
      ["can't find", { kind: 'fallback', mode: 'route' }],   // leaving the list mid-way works too
    ],
  },
  {
    name: 'Advice during the confirm question keeps the question open',
    lang: 'en-IN',
    turns: [
      ['Dubai terminal 3', { kind: 'confirm' }],
      ['I have a connecting flight', { kind: 'info', expecting: 'confirm', has: 'Transfer' }],
      ['where is the toilet', { kind: 'offtopic', expecting: 'confirm' }],
      ['yes', { kind: 'step', mode: 'route' }],
    ],
  },
  {
    name: 'Start over',
    lang: 'en-IN',
    turns: [['Dubai T2', { kind: 'confirm' }], ['yes', { mode: 'route' }], ['start over', { kind: 'ask', expecting: 'airport' }]],
  },
  // Website data (hackathon export, last verified October 2026)
  {
    name: 'Dubai, no terminal: the question says which airline uses which terminal',
    lang: 'en-IN',
    turns: [['Dubai change money', { kind: 'ask', expecting: 'terminal', has: 'Emirates uses Terminal 3' }]],
  },
  {
    name: 'Delhi T2 is not listed: asks again, international is T3',
    lang: 'en-IN',
    turns: [
      ['Delhi terminal 2 change money', { kind: 'ask', expecting: 'terminal', has: 'International flights arrive at Terminal 3' }],
      ['3', { kind: 'confirm', terminal: 'T3' }],
      ['yes', { kind: 'step', mode: 'route', has: 'Exchange counter: EbixCash' }],
    ],
  },
  {
    name: 'Bengaluru T1 has no counter: route ends with ATM / Terminal 2 advice',
    lang: 'en-IN',
    turns: [
      ['Bengaluru terminal 1 change money', { kind: 'confirm' }],
      ['yes', { kind: 'step', mode: 'route', step: 0 }],
      ['next', { step: 1 }],
      ['next', { step: 2, has: 'no exchange counter in Terminal 1' }],
    ],
  },
  {
    name: 'Bengaluru T2 (Hindi): Thomas Cook route',
    lang: 'hi-IN',
    turns: [['बेंगलुरु टर्मिनल २ पैसे बदलने हैं', { kind: 'confirm' }], ['हाँ', { kind: 'step', mode: 'route', has: 'थॉमस कुक' }]],
  },
  {
    name: 'Bangkok (Telugu): best counters are in Basement B',
    lang: 'te-IN',
    turns: [['బ్యాంకాక్ డబ్బు మార్చాలి', { kind: 'confirm' }], ['అవును', { kind: 'step', mode: 'route', has: 'సూపర్‌రిచ్' }]],
  },
];

// ---------- Runner ----------
export function runSuite(data, rates) {
  const results = [];
  const check = (group, name, ok, detail) => results.push({ group, name, ok: !!ok, detail });

  for (const [lang, text, want, ctx] of PARSE_CASES) {
    const got = parse(text, ctx || {});
    const bad = Object.entries(want).filter(([k, v]) => JSON.stringify(got[k] ?? null) !== JSON.stringify(v));
    check('parser', `[${lang}] ${text}`, bad.length === 0,
      bad.map(([k, v]) => `${k}: wanted ${JSON.stringify(v)}, got ${JSON.stringify(got[k])}`).join('; '));
  }

  for (const [text, want] of NUMBER_CASES) {
    const got = num(text);
    check('numbers', `${text} → ${want}`, got === want, `got ${got}`);
  }

  for (const [lang, text, given, received, pct, verdict, local] of PRICE_CASES) {
    const p = parse(text, { localCurrency: local });
    if (!p.price) { check('price', `[${lang}] ${text}`, false, 'no price found'); continue; }
    const c = comparePrice(p.price, rates);
    const okDir = p.price.given.currency === given[0] && p.price.given.amount === given[1] &&
      p.price.received.currency === received[0] && p.price.received.amount === received[1];
    const gotPct = Math.round(c.diffPct * 10) / 10;
    const ok = okDir && gotPct === pct && c.verdict === verdict;
    check('price', `[${lang}] ${text}`, ok,
      `given ${p.price.given.amount} ${p.price.given.currency}, received ${p.price.received.amount} ${p.price.received.currency}, ` +
      `fair ${c.fair.toFixed(2)}, diff ${gotPct}%, verdict ${c.verdict}`);
  }

  for (const flow of FLOW_CASES) {
    let state = initialState(flow.lang);
    const problems = [];
    flow.turns.forEach(([text, want], i) => {
      const out = handle(state, text, data, rates);
      state = out.state;
      const got = { kind: out.reply.kind, mode: state.mode, step: state.step, expecting: state.expecting, airport: state.airport, terminal: state.terminal };
      for (const [k, v] of Object.entries(want)) {
        if (k === 'has') { if (!out.reply.text.includes(v)) problems.push(`turn ${i + 1} "${text}": reply missing "${v}" → ${out.reply.text}`); }
        else if (got[k] !== v) problems.push(`turn ${i + 1} "${text}": ${k} wanted ${v}, got ${got[k]}`);
      }
    });
    check('flow', flow.name, problems.length === 0, problems.join(' | '));
  }

  return results;
}
