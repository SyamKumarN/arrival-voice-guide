// parser.js — the "Understand" layer.
// Rule-based: no network, no model. Turns one heard sentence into
// { airport, terminal, intent, command, stage, numbers, price }.

import { normalise, hasAny, matches } from './text.js';
import { findNumbers, splitJoined, NUMBER_WORDS } from './numbers.js';

// ---------- Airports ----------
const AIRPORTS = {
  DXB: ['dubai', 'dubai airport', 'dxb', 'दुबई', 'दुबाई', 'दुबइ', 'దుబాయ్', 'దుబాయి', 'డుబాయ్'],
  BKK: ['bangkok', 'bkk', 'suvarnabhumi', 'suvarnabhoomi', 'बैंकॉक', 'बैंकाक', 'बैंकोक', 'सुवर्णभूमि', 'బ్యాంకాక్', 'బాంకాక్', 'సువర్ణభూమి'],
  SIN: ['singapore', 'changi', 'sin', 'सिंगापुर', 'सिंगापोर', 'चांगी', 'సింగపూర్', 'చాంగి'],
  BLR: ['bengaluru', 'bangalore', 'bengalooru', 'blr', 'kempegowda', 'बेंगलुरु', 'बेंगलुरू', 'बैंगलोर', 'बंगलौर', 'बेंगलूरु', 'బెంగళూరు', 'బెంగుళూరు', 'బెంగుళూర్', 'బెంగళూర్'],
  DEL: ['delhi', 'new delhi', 'dilli', 'del', 'igi', 'indira gandhi', 'दिल्ली', 'डेल्ही', 'ఢిల్లీ', 'డిల్లీ', 'దిల్లీ'],
};

// ---------- Terminals ----------
const TERMINAL_WORDS = ['terminal', 'terminals', 'termnal', 'tarminal', 't', 'टर्मिनल', 'टरमिनल', 'टर्मिनस', 'టెర్మినల్', 'టర్మినల్'];
// Numbers that can follow "terminal"
const TERMINAL_NUMBERS = {
  1: 1, 2: 2, 3: 3, 4: 4,
  one: 1, two: 2, three: 3, four: 4,
  'वन': 1, 'टू': 2, 'थ्री': 3, 'फोर': 4, 'వన్': 1, 'టూ': 2, 'త్రీ': 3, 'ఫోర్': 4,
  ek: 1, do: 2, teen: 3, tin: 3, char: 4, chaar: 4,
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4,
  'ఒకటి': 1, 'ఒకటో': 1, 'రెండు': 2, 'రెండో': 2, 'మూడు': 3, 'మూడో': 3, 'నాలుగు': 4, 'నాలుగో': 4,
};
// Ordinals said before "terminal": "teesra terminal", "third terminal"
const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4,
  pehla: 1, pahla: 1, pehle: 1, dusra: 2, doosra: 2, dusre: 2, teesra: 3, tisra: 3, teesre: 3, chautha: 4,
  'पहला': 1, 'पहले': 1, 'दूसरा': 2, 'दूसरे': 2, 'तीसरा': 3, 'तीसरे': 3, 'चौथा': 4, 'चौथे': 4,
  'మొదటి': 1, 'రెండో': 2, 'రెండవ': 2, 'మూడో': 3, 'మూడవ': 3, 'నాలుగో': 4, 'నాలుగవ': 4,
};

// ---------- Intent: change money ----------
const EXCHANGE_WORDS = [
  'paise', 'paisa', 'paisay', 'pese', 'paise badalne', 'currency', 'exchange', 'money', 'cash',
  'change money', 'forex', 'convert', 'badalna', 'badalne', 'badlna', 'badalni', 'money changer',
  'पैसे', 'पैसा', 'करेंसी', 'करंसी', 'मुद्रा', 'एक्सचेंज', 'बदलन', 'बदलने', 'कैश', 'नकद',
  'డబ్బు', 'డబ్బులు', 'కరెన్సీ', 'మార్చ', 'ఎక్స్ఛేంజ్', 'ఎక్స్చేంజ్', 'నగదు', 'క్యాష్',
];

// ---------- Intents: SIM card and taxi (checked before exchange) ----------
const SIM_WORDS = [
  'sim', 'sims', 'sim card', 'simcard', 'esim', 'e sim', 'mobile data', 'data card', 'phone card', 'local number',
  'सिम', 'सिमकार्ड', 'सिम कार्ड', 'ई सिम', 'मोबाइल डेटा',
  'సిమ్', 'సిమ్కార్డ్', 'మొబైల్ డేటా',
];
const TAXI_WORDS = [
  'taxi', 'taxis', 'taxi stand', 'cab', 'cabs', 'taksi', 'texi', 'hotel', 'hotels', 'ride to', 'car to',
  'टैक्सी', 'टेक्सी', 'टैकसी', 'कैब', 'होटल',
  'టాక్సీ', 'ట్యాక్సీ', 'టాక్సి', 'క్యాబ్', 'హోటల్',
];

const METRO_WORDS = [
  'metro', 'train', 'rail', 'subway', 'metro station', 'मेट्रो', 'ट्रेन', 'रेल', 'మెట్రో', 'ట్రైన్', 'రైలు',
];

// ---------- Advice topics (order matters: first match wins) ----------
const TOPICS = [
  ['leftover', ['leftover', 'left over', 'leftover currency', 'leftover cash', 'leftover money', 'remaining currency', 'remaining cash',
    'bacha hua paisa', 'bache hue paise', 'bacha paisa', 'bache paise', 'bachi hui currency',
    'बचे हुए पैसे', 'बचा हुआ पैसा', 'बचे पैसे', 'बची हुई करेंसी', 'बचा हुआ कैश',
    'మిగిలిన డబ్బు', 'మిగిలిన కరెన్సీ', 'మిగిలిపోయిన డబ్బు', 'మిగిలిన నగదు']],
  ['excessbag', ['excess baggage', 'extra baggage', 'excess luggage', 'extra luggage', 'overweight bag', 'overweight baggage',
    'overweight luggage', 'baggage fee', 'extra bag', 'zyada saman', 'zyada samaan', 'jyada saman', 'extra saman', 'extra samaan',
    'अतिरिक्त सामान', 'ज़्यादा सामान', 'ज्यादा सामान', 'एक्स्ट्रा सामान', 'एक्स्ट्रा बैगेज', 'अतिरिक्त बैगेज',
    'అదనపు లగేజీ', 'అదనపు లగేజ్', 'అదనపు బ్యాగేజ్', 'ఎక్స్‌ట్రా లగేజ్', 'ఎక్స్ట్రా లగేజ్', 'ఎక్కువ లగేజ్', 'ఎక్కువ లగేజీ']],
  ['transit', ['transit', 'connecting flight', 'connection flight', 'connecting', 'layover', 'transfer flight', 'next flight',
    'agli flight', 'connecting flight hai', 'कनेक्टिंग', 'ट्रांज़िट', 'ट्रांजिट', 'ट्रांसफ़र फ्लाइट', 'अगली फ्लाइट', 'अगली फ़्लाइट',
    'కనెక్టింగ్', 'ట్రాన్సిట్', 'తర్వాతి ఫ్లైట్', 'ఇంకో ఫ్లైట్']],
  ['closed', ['closed', 'is closed', 'shut', 'band hai', 'band he', 'बंद है', 'बंद हैं', 'बंद', 'మూసి', 'మూసేశారు', 'మూసివేశారు', 'మూసేసి']],
  ['howmuch', ['how much should i change', 'how much to change', 'how much money should', 'how much cash', 'how much should i exchange',
    'kitne paise badlu', 'kitne paise badalne', 'kitna badlu', 'kitna change', 'कितने पैसे बदल', 'कितना बदल', 'कितने पैसे',
    'ఎంత మార్చాలి', 'ఎంత డబ్బు మార్చ', 'ఎంత మార్చుకోవాలి']],
  ['dcc', ['rupees or', 'in rupees', 'pay in rupees', 'charge in rupees', 'currency conversion', 'card machine', 'dynamic currency',
    'rupaye ya', 'rupaye mein', 'rupees mein', 'रुपये या', 'रुपये में', 'रुपए में', 'రూపాయల్లోనా', 'రూపాయల్లో']],
  ['forex', ['forex card', 'forex', 'travel card', 'multi currency card', 'फॉरेक्स', 'फ़ॉरेक्स', 'ఫారెక్స్', 'ఫోరెక్స్']],
  ['credit', ['credit card', 'credit', 'क्रेडिट', 'క్రెడిట్']],
  ['debit', ['debit card', 'debit', 'डेबिट', 'డెబిట్']],
  ['atm', ['atm', 'atms', 'cash machine', 'withdraw', 'withdrawal', 'एटीएम', 'ए टी एम', 'ఏటీఎం', 'ఏటిఎం', 'ఏ టి ఎం']],
  ['pickup', ['pickup', 'pick up', 'pick me up', 'picking me up', 'my driver', 'driver', 'chauffeur',
    'पिकअप', 'पिक अप', 'ड्राइवर', 'పికప్', 'పిక్ అప్', 'డ్రైవర్']],
  ['traps', ['traps', 'trap', 'scam', 'scams', 'traps to avoid', 'dhokhe', 'dhokha', 'thagi', 'धोखे', 'धोखा', 'ठगी', 'మోసాలు', 'మోసం']],
  ['tips', ['tips', 'tip', 'advice', 'money tips', 'suggestion', 'salah', 'sujhav', 'सलाह', 'टिप्स', 'टिप', 'सुझाव',
    'చిట్కాలు', 'చిట్కా', 'సలహా', 'సలహాలు', 'టిప్స్']],
];
const CARD_WORDS = ['card', 'cards', 'कार्ड', 'కార్డ్', 'కార్డు'];

// ---------- Outside the guide's scope: politely point to airport staff ----------
const OFFTOPIC = [
  ['lostbag', ['lost baggage', 'lost luggage', 'lost my bag', 'lost my luggage', 'bag is missing', 'bag missing', 'luggage missing',
    'baggage missing', 'bag didnt come', 'bag hasnt arrived', 'bag has not arrived', 'bag did not arrive', 'my bag',
    'samaan nahi aaya', 'saman nahi aaya', 'bag nahi aaya', 'bag kho gaya', 'samaan kho gaya',
    'सामान नहीं आया', 'सामान खो', 'बैग नहीं आया', 'बैग खो', 'बैग गुम', 'सामान गुम',
    'బ్యాగ్ రాలేదు', 'లగేజ్ రాలేదు', 'బ్యాగ్ పోయింది', 'లగేజ్ పోయింది', 'సామాను రాలేదు', 'బ్యాగ్ కనిపించడం లేదు']],
  ['toilet', ['toilet', 'toilets', 'restroom', 'washroom', 'bathroom', 'loo', 'ladies room', 'mens room',
    'टॉयलेट', 'शौचालय', 'बाथरूम', 'वॉशरूम', 'वाशरूम', 'టాయిలెట్', 'బాత్రూమ్', 'వాష్రూమ్', 'వాష్‌రూమ్', 'మరుగుదొడ్డి']],
  ['prayer', ['prayer', 'prayer room', 'pray', 'namaz', 'namaaz', 'mosque', 'temple', 'chapel',
    'नमाज', 'नमाज़', 'प्रार्थना', 'पूजा', 'ప్రార్థన', 'నమాజ్', 'పూజ']],
  ['lounge', ['lounge', 'lounges', 'लाउंज', 'లాంజ్']],
  ['shop', ['shop', 'shops', 'shopping', 'books', 'book', 'bookshop', 'book shop', 'alcohol', 'liquor', 'beer', 'wine', 'whisky',
    'duty free', 'dutyfree', 'perfume', 'chocolate', 'chocolates', 'kitab', 'kitaab', 'sharab', 'daru',
    'शॉपिंग', 'दुकान', 'किताब', 'शराब', 'दारू', 'ड्यूटी फ्री', 'ड्यूटी फ़्री', 'बियर',
    'షాపింగ్', 'షాప్', 'దుకాణ', 'పుస్తక', 'మద్యం', 'డ్యూటీ ఫ్రీ', 'బీర్']],
  ['food', ['food', 'eat', 'hungry', 'restaurant', 'coffee', 'tea', 'snack', 'snacks', 'breakfast', 'lunch', 'dinner', 'water',
    'khana', 'khaana', 'bhook', 'bhookh', 'chai', 'nashta',
    'खाना', 'भूख', 'चाय', 'कॉफी', 'कॉफ़ी', 'रेस्टोरेंट', 'रेस्टोरेंट', 'नाश्ता', 'पानी',
    'భోజనం', 'ఆహారం', 'ఆకలి', 'కాఫీ', 'చాయ్', 'రెస్టారెంట్', 'టిఫిన్', 'తినడానికి', 'నీళ్ళు']],
];

// ---------- Yes / no (answers to "Is that right?") ----------
const YES_WORDS = ['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'thats right', 'ok', 'okay', 'sure', 'haan', 'han', 'haa', 'ji',
  'haanji', 'sahi', 'theek', 'thik', 'हाँ', 'हां', 'जी', 'सही', 'ठीक', 'अवुनु', 'అవును', 'ఔను', 'సరే', 'కరెక్ట్', 'ఓకే', 'అవునండి'];
const NO_WORDS = ['no', 'nope', 'wrong', 'not right', 'incorrect', 'nahi', 'nahin', 'nai', 'galat', 'नहीं', 'नही', 'गलत', 'ग़लत',
  'కాదు', 'లేదు', 'తప్పు'];

// ---------- "What do you see?" answers, for the I'm-lost flow ----------
const STAGES = {
  immigration: ['passport', 'passports', 'passport counter', 'immigration', 'pasport', 'पासपोर्ट', 'इमिग्रेशन', 'पासपोर्ट काउंटर', 'పాస్పోర్ట్', 'పాస్‌పోర్ట్', 'ఇమ్మిగ్రేషన్'],
  baggage: ['baggage', 'bags', 'bag', 'belt', 'belts', 'luggage', 'carousel', 'samaan', 'saman', 'बैगेज', 'सामान', 'बेल्ट', 'लगेज', 'बैग', 'బ్యాగేజ్', 'బెల్ట్', 'లగేజ్', 'సామాను', 'బ్యాగ'],
  customs: ['customs', 'custom', 'कस्टम', 'కస్టమ్'],
  arrivals: ['arrivals', 'arrival', 'arrivals hall', 'exit', 'outside', 'bahar', 'अराइवल', 'बाहर', 'एग्ज़िट', 'అరైవల్', 'బయట'],
};

// ---------- Commands (checked in this order) ----------
const COMMANDS = [
  ['restart', ['start over', 'start again', 'restart', 'reset', 'new search', 'shuru se', 'phir se shuru',
    'फिर से शुरू', 'शुरू से', 'नए सिरे', 'మొదటి నుంచి', 'మళ్ళీ మొదలు', 'మళ్లీ మొదలు']],
  ['staff', ['ask staff', 'staff', 'show staff', 'staff card', 'help card', 'show card', 'ask someone',
    'स्टाफ', 'स्टाफ़', 'कर्मचारी', 'staff se', 'స్టాఫ్', 'సిబ్బంది']],
  ['lost', ['lost', 'i am lost', 'im lost', 'where am i', 'dont know where i am', 'do not know where i am',
    'kho gaya', 'kho gayi', 'pata nahi kahan', 'pata nahin kahan', 'खो गया', 'खो गई', 'खो गयी', 'पता नहीं कहाँ', 'पता नहीं कहां',
    'मैं कहाँ हूँ', 'ఎక్కడున్నానో తెలియదు', 'ఎక్కడ ఉన్నానో తెలియదు', 'తప్పిపోయాను', 'నేను ఎక్కడ ఉన్నాను']],
  ['cantfind', ['cant find', 'cannot find', 'can not find', 'couldnt find', 'not finding', 'dont see',
    'cant see', 'where is it', 'nahi mil raha', 'nahin mil raha', 'nahi mila',
    'nahin mila', 'nahi mil rahi', 'nahi dikh', 'nahin dikh', 'mil nahi raha', 'nhi mil raha',
    'नहीं मिल', 'नही मिल', 'नहीं दिख', 'नही दिख', 'मिल नहीं', 'मिला नहीं',
    'దొరకలేదు', 'దొరకట్లేదు', 'దొరకడం లేదు', 'కనిపించడం లేదు', 'కనిపించలేదు', 'కనబడలేదు', 'కనబడటం లేదు']],
  ['repeat', ['repeat', 'again', 'say again', 'say that again', 'once more', 'pardon', 'dobara', 'dubara',
    'phir se', 'fir se', 'phir bolo', 'फिर से', 'दोबारा', 'दुबारा', 'रिपीट', 'फिर बोलो',
    'మళ్ళీ', 'మళ్లీ', 'మరోసారి', 'రిపీట్', 'ఇంకోసారి']],
  ['back', ['back', 'go back', 'previous', 'peeche', 'pichla', 'pichhla', 'पीछे', 'पिछला', 'वापस',
    'వెనక్కి', 'ముందుది', 'వెనుక']],
  ['next', ['next', 'continue', 'done', 'go on', 'next step', 'aage', 'aagey', 'agla', 'agle',
    'ho gaya', 'hogaya', 'आगे', 'अगला', 'अगले', 'नेक्स्ट', 'हो गया', 'हो गई',
    'తర్వాత', 'తరువాత', 'నెక్స్ట్', 'ముందుకు', 'అయిపోయింది', 'అయింది']],
];
// "ok" / "theek hai" / "సరే" (and "age", Hinglish for "aage") mean next,
// but only when that is nearly all the user said.
const SOFT_NEXT = ['age', 'ok', 'okay', 'theek', 'thik', 'haan', 'yes', 'ठीक', 'हाँ', 'हां', 'సరే', 'ఓకే', 'అవును'];

// ---------- Currencies ----------
// Latin words must match exactly; Hindi/Telugu words match as a prefix
// so endings like "डॉलर्स" or "డాలర్లకు" still count.
const CURRENCIES = {
  USD: ['dollar', 'dollars', 'usd', 'bucks', '$', 'डॉलर', 'डालर', 'डोलर', 'డాలర్', 'డాలర'],
  AED: ['dirham', 'dirhams', 'dirhum', 'dirhem', 'durham', 'aed', 'दिरहम', 'दिरहाम', 'दिर्हम', 'दरहम', 'దిర్హామ్', 'దిర్హమ్', 'దిర్హాం', 'దిర్హం'],
  INR: ['rupee', 'rupees', 'rupaye', 'rupay', 'rupiya', 'rs', 'inr', '₹', 'रुपये', 'रुपए', 'रुपया', 'रूपए', 'रूपये', 'रुपय', 'రూపాయ', 'రూపాయి', 'రూపాయల'],
  THB: ['baht', 'bhat', 'thb', 'बाट', 'भाट', 'బాట్', 'బాత్'],
  SGD: ['sgd'],
  EUR: ['euro', 'euros', 'eur', '€', 'यूरो', 'యూరో'],
  GBP: ['pound', 'pounds', 'gbp', '£', 'पाउंड', 'పౌండ'],
};
const SGD_PREFIX = ['singapore', 'sing', 'सिंगापुर', 'సింగపూర్'];
const CURRENCY_FILLERS = ['us', 'american', 'uae', 'emirati', 'thai', 'indian', 'अमेरिकी', 'यूएई', 'అమెరికన్'];

/** Which currency a token names, or null. */
export function currencyOf(token) {
  if (!token) return null;
  for (const [code, words] of Object.entries(CURRENCIES)) {
    for (const w of words) {
      if (/^[a-z$₹€£]+$/.test(w) ? token === w : token.startsWith(w)) return code;
    }
  }
  return null;
}

// Words that mark the amount you HAND OVER ("for 500 dollars", "500 dollar ke")
const GIVEN_BEFORE = ['for', 'against', 'per', 'prati', 'प्रति', 'har'];
const GIVEN_AFTER = ['ke', 'ka', 'ki', 'के', 'का', 'की', 'badle', 'बदले', 'mein', 'me', 'में', 'se', 'से'];
const TELUGU_GIVEN_ENDINGS = ['కు', 'కి'];

/**
 * Find (amount, currency) pairs and work out which one is given and which received.
 * localCurrency: the airport's currency, used when the sentence doesn't say.
 */
export function findPrice(tokens, localCurrency = null) {
  const isCur = (t) => !!currencyOf(t);
  const numbers = findNumbers(tokens, isCur);
  const used = new Set();
  const pairs = [];

  const curAt = (k) => {
    if (k < 0 || k >= tokens.length || used.has(k)) return null;
    let code = currencyOf(tokens[k]);
    if (code === 'USD' && SGD_PREFIX.includes(tokens[k - 1])) code = 'SGD';
    return code;
  };

  for (const n of numbers) {
    // Currency after the number: "500 dollars", "500 us dollars", "500 singapore dollars"
    let k = n.end + 1;
    if (CURRENCY_FILLERS.includes(tokens[k]) || SGD_PREFIX.includes(tokens[k])) k++;
    let code = curAt(k);
    let curIdx = k;
    // Or before it: "$ 500", "aed 1700"
    if (!code) { code = curAt(n.start - 1); curIdx = n.start - 1; }
    if (!code) continue;
    used.add(curIdx);
    const first = Math.min(n.start, curIdx), last = Math.max(n.end, curIdx);
    const curTok = tokens[curIdx] || '';
    const given =
      GIVEN_BEFORE.includes(tokens[first - 1]) ||
      GIVEN_AFTER.includes(tokens[last + 1]) ||
      (/[ఀ-౿]/.test(curTok) && TELUGU_GIVEN_ENDINGS.some((e) => curTok.endsWith(e)));
    pairs.push({ amount: n.value, currency: code, given, at: first });
  }

  // "3.4 dirham per dollar" -> one dollar given
  for (let k = 0; k < tokens.length; k++) {
    if (used.has(k) || !GIVEN_BEFORE.includes(tokens[k - 1])) continue;
    const code = curAt(k);
    if (code) { used.add(k); pairs.push({ amount: 1, currency: code, given: true, at: k }); }
  }

  if (pairs.length < 2) return pairs.length ? { pairs, given: null, received: null } : null;
  pairs.sort((a, b) => a.at - b.at);

  // Take the first two pairs in different currencies.
  const a = pairs[0];
  const b = pairs.find((p) => p.currency !== a.currency);
  if (!b) return { pairs, given: null, received: null };

  let given, received;
  if (a.given !== b.given) { given = a.given ? a : b; received = a.given ? b : a; }
  else if (localCurrency && (a.currency === localCurrency) !== (b.currency === localCurrency)) {
    received = a.currency === localCurrency ? a : b; given = received === a ? b : a;
  } else { received = a; given = b; }           // "They give 1700 dirhams for 500 dollars"

  return {
    pairs,
    given: { amount: given.amount, currency: given.currency },
    received: { amount: received.amount, currency: received.currency },
  };
}

/**
 * Parse one sentence.
 * ctx.expecting: 'airport' | 'terminal' | null — lets a bare "teen" mean Terminal 3.
 * ctx.airport:   the airport we already know (for the price check's local currency).
 */
export function parse(raw, ctx = {}) {
  const base = normalise(raw);
  const tokens = splitJoined(base.tokens);
  const p = { norm: tokens.join(' '), tokens };

  // Airport (ignore "singapore dollar", which is a currency)
  const forAirport = { ...p };
  forAirport.norm = p.norm.replace(/(singapore|सिंगापुर|సింగపూర్) (dollar|डॉलर|డాలర్)\S*/g, ' ');
  forAirport.tokens = forAirport.norm.split(' ');
  let airport = null;
  for (const [code, words] of Object.entries(AIRPORTS)) {
    if (hasAny(forAirport, words)) { airport = code; break; }
  }

  // Terminal
  let terminal = null;
  for (let i = 0; i < tokens.length && !terminal; i++) {
    const t = tokens[i];
    const isTermWord = TERMINAL_WORDS.includes(t) || /^(टर्मिनल|టెర్మినల్|టర్మినల్)/.test(t);
    if (!isTermWord) continue;
    const after = TERMINAL_NUMBERS[tokens[i + 1]];
    const before = ORDINALS[tokens[i - 1]];
    // A lone "t" only counts with a digit right after it ("t3"), not "t two".
    if (t === 't') { if (/^[1-4]$/.test(tokens[i + 1] || '')) terminal = 'T' + tokens[i + 1]; continue; }
    if (after) terminal = 'T' + after;
    else if (before) terminal = 'T' + before;
  }
  if (!terminal) {
    // "terminal number teen", "terminal no 3"
    const m = p.norm.match(/(?:terminal|टर्मिनल|టెర్మినల్)\s+(?:number|no|nambar|नंबर|నంబర్)\s+(\S+)/);
    if (m && TERMINAL_NUMBERS[m[1]]) terminal = 'T' + TERMINAL_NUMBERS[m[1]];
  }
  if (!terminal && ctx.expecting === 'terminal') {
    // Answering "Which terminal?" with just "teen" / "3" / "మూడు" / "third"
    for (const t of tokens) {
      const v = TERMINAL_NUMBERS[t] ?? ORDINALS[t];
      if (v && t !== 'do') { terminal = 'T' + v; break; }
      if (t === 'do' && tokens.length <= 3) { terminal = 'T2'; break; }
    }
  }

  // Command
  let command = null;
  for (const [name, words] of COMMANDS) {
    if (hasAny(p, words)) { command = name; break; }
  }
  if (!command && tokens.length <= 3 && hasAny(p, SOFT_NEXT)) command = 'next';

  // Where the traveller is, when they answer "What do you see?"
  let stage = null;
  for (const [name, words] of Object.entries(STAGES)) {
    if (hasAny(p, words)) { stage = name; break; }
  }

  // Price check
  const localCurrency = ctx.localCurrency || null;
  const price = findPrice(tokens, localCurrency);

  // Advice topics (tips, cards, ATM, transit …). The first match wins.
  let topic = null;
  for (const [name, words] of TOPICS) {
    if (hasAny(p, words)) { topic = name; break; }
  }
  // A plain "card" means card advice, unless it's a SIM card or the staff card.
  if (!topic && command !== 'staff' && !hasAny(p, SIM_WORDS) && hasAny(p, CARD_WORDS)) topic = 'cards';

  // Intent: where they want to go. SIM and taxi words win over generic money words.
  let intent = null;
  if (hasAny(p, SIM_WORDS)) intent = 'sim';
  else if (hasAny(p, METRO_WORDS)) intent = 'metro';
  else if (hasAny(p, TAXI_WORDS) && topic !== 'pickup') intent = 'taxi';
  else if (hasAny(p, EXCHANGE_WORDS) || (price && price.given)) intent = 'exchange';

  // Outside what the guide does (toilets, food, shops …). "My bag hasn't arrived" isn't "I'm lost".
  let offtopic = null;
  for (const [name, words] of OFFTOPIC) {
    if (hasAny(p, words)) { offtopic = name; break; }
  }
  if (offtopic === 'lostbag') {
    if (command === 'lost' || command === 'cantfind') command = null;
  } else if (offtopic && (intent || topic)) {
    offtopic = null;                     // "book a cab", "coffee money" → the real request wins
  }

  // Yes / no, only when we've just asked "Is that right?"
  let yesno = null;
  if (ctx.expecting === 'confirm') {
    if (hasAny(p, NO_WORDS)) yesno = 'no';
    else if (hasAny(p, YES_WORDS)) yesno = 'yes';
  }

  return {
    raw: String(raw || ''),
    norm: p.norm,
    airport,
    terminal,
    intent,
    command,
    stage,
    topic,
    offtopic,
    yesno,
    price: price && price.given ? { given: price.given, received: price.received } : null,
    amounts: price ? price.pairs : [],
    numbers: findNumbers(tokens, (t) => !!currencyOf(t)).map((n) => n.value),
  };
}

/** How much a parse "understood" — used to choose between speech alternatives. */
export function score(parsed) {
  return (parsed.command ? 3 : 0) + (parsed.stage ? 1 : 0) + (parsed.price ? 4 : 0) + (parsed.airport ? 2 : 0) +
    (parsed.terminal ? 2 : 0) + (parsed.intent ? 1 : 0) + (parsed.topic ? 1 : 0) + (parsed.offtopic ? 1 : 0) +
    (parsed.yesno ? 2 : 0);
}

export { NUMBER_WORDS, matches };
