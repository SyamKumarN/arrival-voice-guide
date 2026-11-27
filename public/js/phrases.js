// phrases.js — everything the guide says or shows, in English, Hindi and Telugu.
// Hindi replies are written in Devanagari so a Hindi voice reads them naturally.

import { short, pick } from './text.js';
import { formatMoney } from './price.js';

const CURRENCY_NAMES = {
  USD: { en: 'US dollars', hi: 'डॉलर', te: 'డాలర్లు' },
  AED: { en: 'dirhams', hi: 'दिरहम', te: 'దిర్హామ్‌లు' },
  INR: { en: 'rupees', hi: 'रुपये', te: 'రూపాయలు' },
  THB: { en: 'baht', hi: 'बाट', te: 'బాట్' },
  SGD: { en: 'Singapore dollars', hi: 'सिंगापुर डॉलर', te: 'సింగపూర్ డాలర్లు' },
  EUR: { en: 'euros', hi: 'यूरो', te: 'యూరోలు' },
  GBP: { en: 'pounds', hi: 'पाउंड', te: 'పౌండ్లు' },
};
export const currencyName = (code, lang) => pick(CURRENCY_NAMES[code], lang) || code;

function terminalLabel(t, lang) {
  if (t === 'MAIN') return { en: 'the main terminal', hi: 'मेन टर्मिनल', te: 'మెయిన్ టెర్మినల్' }[short(lang)];
  const n = t.replace('T', '');
  return { en: `Terminal ${n}`, hi: `टर्मिनल ${n}`, te: `టెర్మినల్ ${n}` }[short(lang)];
}
export { terminalLabel };

function listNumbers(terms, lang) {
  const nums = terms.map((t) => t.replace('T', ''));
  const and = { en: 'or', hi: 'या', te: 'లేదా' }[short(lang)];
  return nums.length > 1 ? nums.slice(0, -1).join(', ') + ` ${and} ` + nums[nums.length - 1] : nums[0];
}

const T = {
  en: {
    hello: 'Hi! Tell me your airport and terminal, and I will guide you to a fair exchange counter.',
    askAirport: 'Which airport are you at? Dubai, Bangkok or Singapore?',
    askTerminal: (name, terms) => `Which terminal at ${name}? ${listNumbers(terms, 'en')}?`,
    badTerminal: (name, terms) => `${name} has terminals ${listNumbers(terms, 'en')}. Which one are you at?`,
    intro: (r, lang) => `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. ${r.counter.quality === 'unknown' ? 'Exchange counter' : 'Best option'}: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. I'll take you there step by step.`,
    introPlain: (r, lang) => `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. I'll take you step by step.`,
    step: (i, n, text) => `Step ${i} of ${n}. ${text}`,
    stepHint: 'Say next, repeat, or can\'t find.',
    done: 'You\'re there. Ask for the final amount before you pay. Safe travels!',
    atStart: 'This is the first step.',
    cantFind: (fb) => `No problem. ${fb} Say repeat to hear the step again, or next to carry on.`,
    unknown: 'Sorry, I didn\'t catch that. Try saying: Dubai terminal 3, I need currency.',
    routeHelp: 'Say next, repeat, or can\'t find.',
    restart: 'Okay, starting again. Which airport are you at?',
    noRoute: 'Sorry, I don\'t have a route for that terminal yet.',
    price: (c, lang) => `They're offering ${formatMoney(c.offered)} ${currencyName(c.received.currency, lang)} for ${formatMoney(c.given.amount)} ${currencyName(c.given.currency, lang)}. At the mid-market rate you'd get about ${formatMoney(c.fair)} ${currencyName(c.received.currency, lang)}. ${pctText(c, 'en')} ${verdictText(c.verdict, 'en')} Ask for the final amount before you pay.`,
    priceNeedTwo: 'Tell me both amounts, for example: they give 1700 dirhams for 500 dollars.',
    pctLess: (p) => `That's ${p} percent less.`,
    pctMore: (p) => `That's ${p} percent more.`,
    verdict: {
      fair: 'That\'s a fair deal.',
      ok: 'That\'s a normal airport margin.',
      high: 'That\'s pricey. Check another counter if you can.',
      bad: 'That\'s a poor rate. Try another counter.',
      check: 'That\'s more than the market rate, so check the numbers and any fees.',
    },
  },
  hi: {
    hello: 'नमस्ते! अपना एयरपोर्ट और टर्मिनल बताइए, मैं आपको सही एक्सचेंज काउंटर तक ले चलूँगी।',
    askAirport: 'आप किस एयरपोर्ट पर हैं? दुबई, बैंकॉक या सिंगापुर?',
    askTerminal: (name, terms) => `${name} में कौन सा टर्मिनल? ${listNumbers(terms, 'hi')}?`,
    badTerminal: (name, terms) => `${name} में टर्मिनल ${listNumbers(terms, 'hi')} हैं। आप किस पर हैं?`,
    intro: (r, lang) => `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। ${r.counter.quality === 'unknown' ? 'एक्सचेंज काउंटर' : 'सबसे अच्छा विकल्प'}: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}। मैं आपको एक-एक कदम बताऊँगी।`,
    introPlain: (r, lang) => `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। मैं आपको एक-एक कदम बताऊँगी।`,
    step: (i, n, text) => `${n} में से कदम ${i}। ${text}`,
    stepHint: 'आगे, दोबारा, या नहीं मिल रहा बोलिए।',
    done: 'आप पहुँच गए। पैसे देने से पहले फ़ाइनल अमाउंट पूछिए। शुभ यात्रा!',
    atStart: 'यह पहला कदम है।',
    cantFind: (fb) => `कोई बात नहीं। ${fb} कदम फिर से सुनने के लिए दोबारा बोलिए, या आगे बोलिए।`,
    unknown: 'माफ़ कीजिए, समझ नहीं आया। ऐसे बोलिए: दुबई टर्मिनल तीन, पैसे बदलने हैं।',
    routeHelp: 'आगे, दोबारा, या नहीं मिल रहा बोलिए।',
    restart: 'ठीक है, फिर से शुरू करते हैं। आप किस एयरपोर्ट पर हैं?',
    noRoute: 'माफ़ कीजिए, इस टर्मिनल का रास्ता अभी मेरे पास नहीं है।',
    price: (c, lang) => `वो ${formatMoney(c.given.amount)} ${currencyName(c.given.currency, lang)} के बदले ${formatMoney(c.offered)} ${currencyName(c.received.currency, lang)} दे रहे हैं। मिड-मार्केट रेट पर आपको करीब ${formatMoney(c.fair)} ${currencyName(c.received.currency, lang)} मिलने चाहिए। ${pctText(c, 'hi')} ${verdictText(c.verdict, 'hi')} पैसे देने से पहले फ़ाइनल अमाउंट पूछिए।`,
    priceNeedTwo: 'दोनों रकम बताइए, जैसे: पाँच सौ डॉलर के सत्रह सौ दिरहम दे रहे हैं।',
    pctLess: (p) => `यानी ${p} प्रतिशत कम।`,
    pctMore: (p) => `यानी ${p} प्रतिशत ज़्यादा।`,
    verdict: {
      fair: 'यह सही रेट है।',
      ok: 'एयरपोर्ट पर इतना मार्जिन आम है।',
      high: 'यह महँगा है। हो सके तो दूसरा काउंटर देखिए।',
      bad: 'यह खराब रेट है। दूसरा काउंटर देखिए।',
      check: 'यह मार्केट रेट से ज़्यादा है, रकम और फ़ीस दोबारा जाँच लीजिए।',
    },
  },
  te: {
    hello: 'నమస్తే! మీ ఎయిర్‌పోర్ట్, టెర్మినల్ చెప్పండి. మంచి ఎక్స్ఛేంజ్ కౌంటర్ దగ్గరికి తీసుకెళ్తాను.',
    askAirport: 'మీరు ఏ ఎయిర్‌పోర్ట్‌లో ఉన్నారు? దుబాయ్, బ్యాంకాక్, లేదా సింగపూర్?',
    askTerminal: (name, terms) => `${name}లో ఏ టెర్మినల్? ${listNumbers(terms, 'te')}?`,
    badTerminal: (name, terms) => `${name}లో టెర్మినల్స్ ${listNumbers(terms, 'te')} ఉన్నాయి. మీరు దేనిలో ఉన్నారు?`,
    intro: (r, lang) => `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. ${r.counter.quality === 'unknown' ? 'ఎక్స్ఛేంజ్ కౌంటర్' : 'మంచి ఎంపిక'}: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. ఒక్కో అడుగు చెప్తాను.`,
    introPlain: (r, lang) => `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. ఒక్కో అడుగు చెప్తాను.`,
    step: (i, n, text) => `${n}లో ${i}వ అడుగు. ${text}`,
    stepHint: 'నెక్స్ట్, మళ్ళీ, లేదా దొరకలేదు అని చెప్పండి.',
    done: 'మీరు చేరుకున్నారు. డబ్బు ఇచ్చే ముందు ఫైనల్ మొత్తం అడగండి. శుభ ప్రయాణం!',
    atStart: 'ఇది మొదటి అడుగు.',
    cantFind: (fb) => `పర్వాలేదు. ${fb} అడుగు మళ్ళీ వినడానికి మళ్ళీ అని, ముందుకు వెళ్ళడానికి నెక్స్ట్ అని చెప్పండి.`,
    unknown: 'క్షమించండి, అర్థం కాలేదు. ఇలా చెప్పండి: దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి.',
    routeHelp: 'నెక్స్ట్, మళ్ళీ, లేదా దొరకలేదు అని చెప్పండి.',
    restart: 'సరే, మళ్ళీ మొదలుపెడదాం. మీరు ఏ ఎయిర్‌పోర్ట్‌లో ఉన్నారు?',
    noRoute: 'క్షమించండి, ఈ టెర్మినల్ దారి ఇంకా నా దగ్గర లేదు.',
    price: (c, lang) => `${formatMoney(c.given.amount)} ${currencyName(c.given.currency, lang)}కి వాళ్ళు ${formatMoney(c.offered)} ${currencyName(c.received.currency, lang)} ఇస్తున్నారు. మిడ్-మార్కెట్ రేటు ప్రకారం సుమారు ${formatMoney(c.fair)} ${currencyName(c.received.currency, lang)} రావాలి. ${pctText(c, 'te')} ${verdictText(c.verdict, 'te')} డబ్బు ఇచ్చే ముందు ఫైనల్ మొత్తం అడగండి.`,
    priceNeedTwo: 'రెండు మొత్తాలూ చెప్పండి, ఉదాహరణకు: 500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు.',
    pctLess: (p) => `అంటే ${p} శాతం తక్కువ.`,
    pctMore: (p) => `అంటే ${p} శాతం ఎక్కువ.`,
    verdict: {
      fair: 'ఇది సరైన రేటు.',
      ok: 'ఎయిర్‌పోర్ట్‌లో ఇంత మార్జిన్ మామూలే.',
      high: 'ఇది ఖరీదు. వీలైతే ఇంకో కౌంటర్ చూడండి.',
      bad: 'ఇది చెడ్డ రేటు. ఇంకో కౌంటర్ చూడండి.',
      check: 'ఇది మార్కెట్ రేటు కంటే ఎక్కువ. మొత్తం, ఫీజు మళ్ళీ చూసుకోండి.',
    },
  },
};

// ---------- SIM, taxi, lost, ask-staff (added in round 2; these override the keys above) ----------
const DEST = {
  en: { exchange: 'exchange counter', sim: 'SIM card counter', taxi: 'taxi stand', exit: 'way out' },
  hi: { exchange: 'एक्सचेंज काउंटर', sim: 'सिम कार्ड काउंटर', taxi: 'टैक्सी स्टैंड', exit: 'बाहर के रास्ते' },
  te: { exchange: 'ఎక్స్ఛేంజ్ కౌంటర్', sim: 'సిమ్ కార్డ్ కౌంటర్', taxi: 'టాక్సీ స్టాండ్', exit: 'బయటకు దారి' },
};
const STAGE_NAMES = {
  en: { immigration: 'passport counters', baggage: 'baggage belts', customs: 'customs', arrivals: 'arrivals hall' },
  hi: { immigration: 'पासपोर्ट काउंटर', baggage: 'बैगेज बेल्ट', customs: 'कस्टम्स', arrivals: 'अराइवल्स हॉल' },
  te: { immigration: 'పాస్‌పోర్ట్ కౌంటర్ల', baggage: 'బ్యాగేజ్ బెల్ట్‌ల', customs: 'కస్టమ్స్', arrivals: 'అరైవల్స్ హాల్' },
};
const AIRPORT_LIST = {
  en: 'Dubai, Bengaluru, Delhi, Singapore or Bangkok?',
  hi: 'दुबई, बेंगलुरु, दिल्ली, सिंगापुर या बैंकॉक?',
  te: 'దుబాయ్, బెంగళూరు, ఢిల్లీ, సింగపూర్, లేదా బ్యాంకాక్?',
};
const EXTRA = {
  en: {
    hello: 'Hi! Tell me your airport and terminal. I can guide you to a fair exchange counter, a SIM counter or the taxi stand.',
    askAirport: `Which airport are you at? ${AIRPORT_LIST.en}`,
    unknown: "I can guide you to a fair exchange counter, a SIM counter or the taxi stand, and check a rate. Try: 'exchange money', 'SIM', 'taxi'.",
    commandsHint: "While I guide you, say next, repeat or can't find. Say 'ask staff' for a card to show airport staff.",
    intro: (r, lang) => r.dest === 'exchange'
      ? `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. ${r.counter.quality === 'unknown' ? 'Exchange counter' : 'Best option'}: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. I'll take you there step by step.`
      : `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. Route to the ${DEST.en[r.dest]}. I'll take you there step by step.`,
    done: (dest) => ({
      exchange: "You're there. Ask for the final amount in hand before you pay. Safe travels!",
      atm: "You're there. Choose the local currency on screen and check the fee before you press OK. Safe travels!",
      sim: "You're at the SIM counters. Check the price and the data before you pay. Safe travels!",
      taxi: "You're at the taxi stand. Keep your hotel address handy. Safe travels!",
      exit: "You're out. Money exchange, SIM and taxis are signposted from the arrivals hall. Tell me if you need one. Safe travels!",
    })[dest || 'exchange'],
    noRouteDest: (dest, name) => (dest === 'sim'
      ? `I don't have step-by-step directions to the SIM counters at ${name} yet. SIM counters are usually in the arrivals hall after customs. Follow the signs or ask at the info desk.`
      : `I don't have step-by-step directions to the taxi stand at ${name} yet. The taxi stand is usually reached from the arrivals hall after customs. Follow the signs or ask at the info desk.`) +
      " I've opened a card you can show to staff. Say 'exchange money' if you'd like directions to an exchange counter.",
    lostAskAirport: `No problem, let's work out where you are. First, which airport are you at? ${AIRPORT_LIST.en}`,
    lostAsk: 'What do you see around you: passport counters, baggage belts, customs, or the arrivals hall?',
    lostFound: (stage) => `Okay, you're ${({ immigration: 'near the passport counters', baggage: 'at the baggage belts', customs: 'at customs', arrivals: 'in the arrivals hall' })[stage]}. I'll carry on from there.`,
    staffIntro: "Here's a card you can show to airport staff. I'll read it out.",
  },
  hi: {
    hello: 'नमस्ते! अपना एयरपोर्ट और टर्मिनल बताइए। मैं आपको सही एक्सचेंज काउंटर, सिम काउंटर या टैक्सी स्टैंड तक ले चल सकती हूँ।',
    askAirport: `आप किस एयरपोर्ट पर हैं? ${AIRPORT_LIST.hi}`,
    unknown: "मैं आपको सही एक्सचेंज काउंटर, सिम काउंटर या टैक्सी स्टैंड तक ले जा सकती हूँ, और रेट जाँच सकती हूँ। ऐसे बोलिए: 'पैसे बदलने हैं', 'सिम', 'टैक्सी'।",
    commandsHint: "रास्ते में आगे, दोबारा या नहीं मिल रहा बोलिए। स्टाफ को दिखाने के लिए कार्ड चाहिए तो 'स्टाफ से पूछना है' बोलिए।",
    intro: (r, lang) => r.dest === 'exchange'
      ? `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। ${r.counter.quality === 'unknown' ? 'एक्सचेंज काउंटर' : 'सबसे अच्छा विकल्प'}: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}। मैं आपको एक-एक कदम बताऊँगी।`
      : `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। ${DEST.hi[r.dest]} का रास्ता। मैं आपको एक-एक कदम बताऊँगी।`,
    done: (dest) => ({
      exchange: 'आप पहुँच गए। पैसे देने से पहले पूछिए कि हाथ में फ़ाइनल कितनी रकम मिलेगी। शुभ यात्रा!',
      atm: 'आप पहुँच गए। स्क्रीन पर लोकल करेंसी चुनिए और OK दबाने से पहले फ़ीस देख लीजिए। शुभ यात्रा!',
      sim: 'आप सिम काउंटर पर पहुँच गए। पैसे देने से पहले दाम और डेटा पूछ लीजिए। शुभ यात्रा!',
      taxi: 'आप टैक्सी स्टैंड पर पहुँच गए। होटल का पता पास रखिए। शुभ यात्रा!',
      exit: 'आप बाहर आ गए। एक्सचेंज, सिम और टैक्सी के बोर्ड अराइवल्स हॉल में हैं। इनमें से कुछ चाहिए तो बताइए। शुभ यात्रा!',
    })[dest || 'exchange'],
    noRouteDest: (dest, name) => (dest === 'sim'
      ? `${name} में सिम काउंटर तक का पूरा रास्ता अभी मेरे पास नहीं है। सिम काउंटर आमतौर पर कस्टम्स के बाद अराइवल्स हॉल में होते हैं। बोर्ड देखिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए।`
      : `${name} में टैक्सी स्टैंड तक का पूरा रास्ता अभी मेरे पास नहीं है। टैक्सी स्टैंड आमतौर पर कस्टम्स के बाद अराइवल्स हॉल से होकर मिलता है। बोर्ड देखिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए।`) +
      " स्टाफ को दिखाने के लिए मैंने एक कार्ड खोल दिया है। एक्सचेंज काउंटर का रास्ता चाहिए तो 'पैसे बदलने हैं' बोलिए।",
    lostAskAirport: `कोई बात नहीं, पता करते हैं आप कहाँ हैं। पहले बताइए, आप किस एयरपोर्ट पर हैं? ${AIRPORT_LIST.hi}`,
    lostAsk: 'आपके आसपास क्या दिख रहा है: पासपोर्ट काउंटर, बैगेज बेल्ट, कस्टम्स, या अराइवल्स हॉल?',
    lostFound: (stage) => `ठीक है, आप ${STAGE_NAMES.hi[stage]} के पास हैं। यहीं से आगे बताती हूँ।`,
    staffIntro: 'यह कार्ड एयरपोर्ट स्टाफ को दिखाइए। मैं इसे पढ़कर सुनाती हूँ।',
  },
  te: {
    hello: 'నమస్తే! మీ ఎయిర్‌పోర్ట్, టెర్మినల్ చెప్పండి. మంచి ఎక్స్ఛేంజ్ కౌంటర్, సిమ్ కౌంటర్ లేదా టాక్సీ స్టాండ్‌కి దారి చూపిస్తాను.',
    askAirport: `మీరు ఏ ఎయిర్‌పోర్ట్‌లో ఉన్నారు? ${AIRPORT_LIST.te}`,
    unknown: "మంచి ఎక్స్ఛేంజ్ కౌంటర్, సిమ్ కౌంటర్ లేదా టాక్సీ స్టాండ్‌కి దారి చూపించగలను, రేటు కూడా చెక్ చేయగలను. ఇలా చెప్పండి: 'డబ్బు మార్చాలి', 'సిమ్', 'టాక్సీ'.",
    commandsHint: "దారిలో నెక్స్ట్, మళ్ళీ, లేదా దొరకలేదు అని చెప్పండి. సిబ్బందికి చూపించే కార్డ్ కావాలంటే 'స్టాఫ్‌ని అడగాలి' అని చెప్పండి.",
    intro: (r, lang) => r.dest === 'exchange'
      ? `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. ${r.counter.quality === 'unknown' ? 'ఎక్స్ఛేంజ్ కౌంటర్' : 'మంచి ఎంపిక'}: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. ఒక్కో అడుగు చెప్తాను.`
      : `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. ${DEST.te[r.dest]}కి దారి. ఒక్కో అడుగు చెప్తాను.`,
    done: (dest) => ({
      exchange: 'మీరు చేరుకున్నారు. డబ్బు ఇచ్చే ముందు, చేతికి ఫైనల్‌గా ఎంత వస్తుందో అడగండి. శుభ ప్రయాణం!',
      atm: 'మీరు చేరుకున్నారు. స్క్రీన్‌పై లోకల్ కరెన్సీ ఎంచుకోండి, OK నొక్కే ముందు ఫీజు చూసుకోండి. శుభ ప్రయాణం!',
      sim: 'మీరు సిమ్ కౌంటర్ దగ్గరికి చేరుకున్నారు. డబ్బు ఇచ్చే ముందు ధర, డేటా అడగండి. శుభ ప్రయాణం!',
      taxi: 'మీరు టాక్సీ స్టాండ్ దగ్గరికి చేరుకున్నారు. హోటల్ అడ్రస్ దగ్గర ఉంచుకోండి. శుభ ప్రయాణం!',
      exit: 'మీరు బయటకు వచ్చేశారు. ఎక్స్ఛేంజ్, సిమ్, టాక్సీ బోర్డులు అరైవల్స్ హాల్‌లో ఉంటాయి. వీటిలో ఏదైనా కావాలంటే చెప్పండి. శుభ ప్రయాణం!',
    })[dest || 'exchange'],
    noRouteDest: (dest, name) => (dest === 'sim'
      ? `${name}లో సిమ్ కౌంటర్‌కి పూర్తి దారి ఇంకా నా దగ్గర లేదు. సిమ్ కౌంటర్లు సాధారణంగా కస్టమ్స్ తర్వాత అరైవల్స్ హాల్‌లో ఉంటాయి. బోర్డులు చూడండి లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి.`
      : `${name}లో టాక్సీ స్టాండ్‌కి పూర్తి దారి ఇంకా నా దగ్గర లేదు. టాక్సీ స్టాండ్ సాధారణంగా కస్టమ్స్ తర్వాత అరైవల్స్ హాల్ నుంచి వెళ్తే వస్తుంది. బోర్డులు చూడండి లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి.`) +
      " సిబ్బందికి చూపించడానికి ఒక కార్డ్ తెరిచాను. ఎక్స్ఛేంజ్ కౌంటర్ దారి కావాలంటే 'డబ్బు మార్చాలి' అని చెప్పండి.",
    lostAskAirport: `పర్వాలేదు, మీరు ఎక్కడ ఉన్నారో కనుక్కుందాం. ముందు, మీరు ఏ ఎయిర్‌పోర్ట్‌లో ఉన్నారు? ${AIRPORT_LIST.te}`,
    lostAsk: 'మీ చుట్టూ ఏం కనిపిస్తోంది: పాస్‌పోర్ట్ కౌంటర్లు, బ్యాగేజ్ బెల్ట్‌లు, కస్టమ్స్, లేదా అరైవల్స్ హాల్?',
    lostFound: (stage) => `సరే, మీరు ${STAGE_NAMES.te[stage]} దగ్గర ఉన్నారు. అక్కడి నుంచి చెప్తాను.`,
    staffIntro: 'ఈ కార్డ్‌ని ఎయిర్‌పోర్ట్ సిబ్బందికి చూపించండి. నేను చదివి వినిపిస్తాను.',
  },
};
for (const l of Object.keys(EXTRA)) Object.assign(T[l], EXTRA[l]);

// ---------- Round 3: confirm, advice topics, off-topic, metro, tips ----------
const AIRPORT_Q = { en: EXTRA.en.askAirport, hi: EXTRA.hi.askAirport, te: EXTRA.te.askAirport };
const SAFE_EXIT = {
  en: " I've opened a card you can show to staff. Say 'exchange money' if you'd like directions to an exchange counter.",
  hi: " स्टाफ को दिखाने के लिए मैंने एक कार्ड खोल दिया है। एक्सचेंज काउंटर का रास्ता चाहिए तो 'पैसे बदलने हैं' बोलिए।",
  te: " సిబ్బందికి చూపించడానికి ఒక కార్డ్ తెరిచాను. ఎక్స్ఛేంజ్ కౌంటర్ దారి కావాలంటే 'డబ్బు మార్చాలి' అని చెప్పండి.",
};
const NO_ROUTE = {
  en: {
    sim: (n) => `I don't have step-by-step directions to the SIM counters at ${n} yet. SIM counters are usually in the arrivals hall after customs. Follow the signs or ask at the info desk.`,
    taxi: (n) => `I don't have step-by-step directions to the taxi stand at ${n} yet. The taxi stand is usually reached from the arrivals hall after customs. Follow the signs or ask at the info desk. Use only the official taxi stand, and ignore people offering rides in the hall.`,
    metro: (n) => `If ${n} has a metro or train link, it's signposted from the arrivals hall. Follow the signs or ask at the info desk.`,
  },
  hi: {
    sim: (n) => `${n} में सिम काउंटर तक का पूरा रास्ता अभी मेरे पास नहीं है। सिम काउंटर आमतौर पर कस्टम्स के बाद अराइवल्स हॉल में होते हैं। बोर्ड देखिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए।`,
    taxi: (n) => `${n} में टैक्सी स्टैंड तक का पूरा रास्ता अभी मेरे पास नहीं है। टैक्सी स्टैंड आमतौर पर कस्टम्स के बाद अराइवल्स हॉल से होकर मिलता है। बोर्ड देखिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए। सिर्फ़ आधिकारिक टैक्सी स्टैंड इस्तेमाल कीजिए, और हॉल में राइड ऑफ़र करने वालों को नज़रअंदाज़ कीजिए।`,
    metro: (n) => `अगर ${n} में मेट्रो या ट्रेन है, तो उसके बोर्ड अराइवल्स हॉल से लगे होते हैं। बोर्ड देखिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए।`,
  },
  te: {
    sim: (n) => `${n}లో సిమ్ కౌంటర్‌కి పూర్తి దారి ఇంకా నా దగ్గర లేదు. సిమ్ కౌంటర్లు సాధారణంగా కస్టమ్స్ తర్వాత అరైవల్స్ హాల్‌లో ఉంటాయి. బోర్డులు చూడండి లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి.`,
    taxi: (n) => `${n}లో టాక్సీ స్టాండ్‌కి పూర్తి దారి ఇంకా నా దగ్గర లేదు. టాక్సీ స్టాండ్ సాధారణంగా కస్టమ్స్ తర్వాత అరైవల్స్ హాల్ నుంచి వెళ్తే వస్తుంది. బోర్డులు చూడండి లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి. అధికారిక టాక్సీ స్టాండ్ మాత్రమే వాడండి, హాల్‌లో రైడ్ ఆఫర్ చేసేవాళ్ళను పట్టించుకోకండి.`,
    metro: (n) => `${n}లో మెట్రో లేదా రైలు ఉంటే, అరైవల్స్ హాల్ నుంచి బోర్డులు ఉంటాయి. బోర్డులు చూడండి లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి.`,
  },
};

// Spoken one at a time. Money tips and traps stay under 15 words each.
export const TIP_LISTS = {
  money: {
    en: ['Change only enough at the airport for a taxi, SIM and snack.',
      'Use your forex card or a city ATM. Always choose local currency.',
      "Avoid cash withdrawals on a credit card. They're usually expensive."],
    hi: ['एयरपोर्ट पर सिर्फ़ टैक्सी, सिम और नाश्ते जितने पैसे बदलिए।',
      'बाकी के लिए फॉरेक्स कार्ड या शहर का एटीएम; हमेशा लोकल करेंसी चुनिए।',
      'क्रेडिट कार्ड से कैश मत निकालिए, यह आमतौर पर महँगा पड़ता है।'],
    te: ['ఎయిర్‌పోర్ట్‌లో టాక్సీ, సిమ్, స్నాక్‌కి సరిపడా మాత్రమే మార్చండి.',
      'మిగతాదానికి ఫారెక్స్ కార్డ్ లేదా నగర ఏటీఎం వాడండి; లోకల్ కరెన్సీ ఎంచుకోండి.',
      'క్రెడిట్ కార్డ్‌తో క్యాష్ తీయకండి, సాధారణంగా ఖరీదు.'],
  },
  traps: {
    en: ['Airport counters often give poor rates. Change only a little here.',
      '"Zero commission" can hide a weak rate. Compare the final amount.',
      'Asked rupees or local currency? Always pick the local currency.',
      'Credit card cash withdrawals are expensive. Avoid them.',
      'Ignore ride offers in the hall. Meet drivers only at official pickup points.'],
    hi: ['एयरपोर्ट काउंटर अक्सर कम रेट देते हैं। यहाँ थोड़ा ही बदलिए।',
      '"ज़ीरो कमीशन" के पीछे कमज़ोर रेट हो सकता है। फ़ाइनल रकम देखिए।',
      'रुपये या लोकल करेंसी पूछें, तो हमेशा लोकल करेंसी चुनिए।',
      'क्रेडिट कार्ड से कैश निकालना महँगा है। इससे बचिए।',
      'हॉल में राइड ऑफ़र अनदेखा कीजिए; ड्राइवर से सिर्फ़ आधिकारिक पिकअप पॉइंट पर मिलिए।'],
    te: ['ఎయిర్‌పోర్ట్ కౌంటర్లు తరచూ తక్కువ రేటు ఇస్తాయి. ఇక్కడ కొంచెమే మార్చండి.',
      '"జీరో కమిషన్" వెనుక తక్కువ రేటు ఉండొచ్చు. ఫైనల్ మొత్తం చూడండి.',
      'రూపాయలా, లోకల్ కరెన్సీనా అని అడిగితే, లోకల్ కరెన్సీనే ఎంచుకోండి.',
      'క్రెడిట్ కార్డ్‌తో క్యాష్ తీయడం ఖరీదు. దాన్ని మానుకోండి.',
      'హాల్‌లో రైడ్ ఆఫర్లు పట్టించుకోకండి; డ్రైవర్‌ని అధికారిక పికప్ పాయింట్‌లోనే కలవండి.'],
  },
  atm: {
    en: ['If the ATM offers rupees or local currency, choose local currency.',
      'Use ATMs inside the airport or a bank branch. Cover your PIN.',
      'Read the fee shown on screen before you press OK.',
      'Keep a backup card separate from your wallet.'],
    hi: ['एटीएम रुपये या लोकल करेंसी पूछे, तो लोकल करेंसी चुनिए।',
      'एयरपोर्ट के अंदर या बैंक शाखा का एटीएम इस्तेमाल कीजिए। पिन ढककर डालिए।',
      'OK दबाने से पहले स्क्रीन पर दिखी फ़ीस पढ़िए।',
      'एक बैकअप कार्ड बटुए से अलग रखिए।'],
    te: ['ఏటీఎం రూపాయలా, లోకల్ కరెన్సీనా అని అడిగితే లోకల్ కరెన్సీ ఎంచుకోండి.',
      'ఎయిర్‌పోర్ట్ లోపల లేదా బ్యాంక్ బ్రాంచ్ ఏటీఎం వాడండి. పిన్ కనిపించకుండా కొట్టండి.',
      'OK నొక్కే ముందు స్క్రీన్ మీద చూపించే ఫీజు చదవండి.',
      'ఒక బ్యాకప్ కార్డ్ పర్సు నుంచి వేరుగా ఉంచండి.'],
  },
  taxi: {
    en: ['Use only the official taxi stand or ride apps. Ignore people offering rides.',
      "Check the meter is on, or agree the fare first if there's no meter.",
      'Meet your driver only at the official pickup point. Check car number and name.',
      'Never share OTPs with strangers. Hand luggage only to your confirmed driver.',
      'Keep some small local cash for your first ride.'],
    hi: ['सिर्फ़ आधिकारिक टैक्सी स्टैंड या राइड ऐप इस्तेमाल कीजिए। राइड ऑफ़र करने वालों को अनदेखा कीजिए।',
      'मीटर चालू है, देखिए; मीटर न हो तो किराया पहले तय कीजिए।',
      'ड्राइवर से सिर्फ़ आधिकारिक पिकअप पॉइंट पर मिलिए। गाड़ी नंबर और नाम जाँचिए।',
      'किसी अनजान को OTP मत बताइए। सामान सिर्फ़ अपने कन्फ़र्म ड्राइवर को दीजिए।',
      'पहली राइड के लिए थोड़े लोकल छुट्टे पैसे रखिए।'],
    te: ['అధికారిక టాక్సీ స్టాండ్ లేదా రైడ్ యాప్‌లే వాడండి. రైడ్ ఆఫర్ చేసేవాళ్ళని పట్టించుకోకండి.',
      'మీటర్ ఆన్‌లో ఉందో చూడండి; మీటర్ లేకపోతే ముందే ఛార్జీ మాట్లాడుకోండి.',
      'డ్రైవర్‌ని అధికారిక పికప్ పాయింట్‌లోనే కలవండి. కార్ నంబర్, పేరు చెక్ చేయండి.',
      'తెలియనివాళ్ళకు OTP చెప్పకండి. లగేజ్ మీ కన్ఫర్మ్ అయిన డ్రైవర్‌కే ఇవ్వండి.',
      'మొదటి రైడ్ కోసం కొంచెం లోకల్ చిల్లర ఉంచుకోండి.'],
  },
};
const CARD_TIPS = {
  forex: {
    en: "Your forex card already holds the currency. Use it for card payments, and withdraw cash at an ATM only if you need it. Check your card's ATM fee before withdrawing.",
    hi: 'आपके फॉरेक्स कार्ड में करेंसी पहले से है। कार्ड से भुगतान कीजिए, और ज़रूरत हो तभी एटीएम से कैश निकालिए। निकालने से पहले अपने कार्ड की एटीएम फ़ीस जाँच लीजिए।',
    te: 'మీ ఫారెక్స్ కార్డ్‌లో కరెన్సీ ముందే ఉంటుంది. కార్డ్‌తో చెల్లించండి, అవసరమైతేనే ఏటీఎంలో క్యాష్ తీసుకోండి. తీసుకునే ముందు మీ కార్డ్ ఏటీఎం ఫీజు చెక్ చేసుకోండి.',
  },
  credit: {
    en: 'A credit card is good for card payments, but cash withdrawals from it are usually expensive, with fees and interest from day one. Avoid taking cash with it.',
    hi: 'क्रेडिट कार्ड भुगतान के लिए अच्छा है, पर इससे कैश निकालना आमतौर पर महँगा होता है: फ़ीस और पहले दिन से ब्याज। इससे कैश मत निकालिए।',
    te: 'క్రెడిట్ కార్డ్ చెల్లింపులకు మంచిది, కానీ దానితో క్యాష్ తీయడం సాధారణంగా ఖరీదు: ఫీజు, మొదటి రోజు నుంచే వడ్డీ. దానితో క్యాష్ తీయకండి.',
  },
  debit: {
    en: 'A debit card works at ATMs, but your bank may charge a foreign withdrawal fee and a currency markup. Withdraw fewer times, in larger amounts. Check with your bank.',
    hi: 'डेबिट कार्ड एटीएम पर चलता है, पर आपका बैंक विदेशी निकासी फ़ीस और करेंसी मार्कअप ले सकता है। कम बार, ज़्यादा रकम निकालिए। अपने बैंक से पूछ लीजिए।',
    te: 'డెబిట్ కార్డ్ ఏటీఎంలో పనిచేస్తుంది, కానీ మీ బ్యాంక్ విదేశీ విత్‌డ్రాయల్ ఫీజు, కరెన్సీ మార్కప్ వసూలు చేయవచ్చు. తక్కువ సార్లు, ఎక్కువ మొత్తం తీయండి. మీ బ్యాంక్‌ని అడగండి.',
  },
};
TIP_LISTS.cards = Object.fromEntries(['en', 'hi', 'te'].map((l) => [l, ['forex', 'credit', 'debit'].map((k) => CARD_TIPS[k][l])]));

/** Language help (shown on the staff card and in "Save for my trip"; tips only). */
export const LANG_TIP = {
  en: 'Before you fly, download the offline language pack in a translator app (e.g. Google Translate) for the local language. At the airport, use its conversation mode or camera to read signs. Show the Ask-staff card to staff or a taxi driver.',
  hi: 'उड़ान से पहले किसी ट्रांसलेटर ऐप (जैसे Google Translate) में वहाँ की भाषा का ऑफ़लाइन पैक डाउनलोड कर लीजिए। एयरपोर्ट पर उसका बातचीत मोड या कैमरा इस्तेमाल करके बोर्ड पढ़िए। स्टाफ या टैक्सी ड्राइवर को "स्टाफ से पूछें" कार्ड दिखाइए।',
  te: 'ప్రయాణానికి ముందే ఏదైనా ట్రాన్స్‌లేటర్ యాప్‌లో (ఉదా. Google Translate) అక్కడి భాష ఆఫ్‌లైన్ ప్యాక్ డౌన్‌లోడ్ చేసుకోండి. ఎయిర్‌పోర్ట్‌లో దాని సంభాషణ మోడ్ లేదా కెమెరాతో బోర్డులు చదవండి. సిబ్బందికి లేదా టాక్సీ డ్రైవర్‌కి "స్టాఫ్‌ని అడగండి" కార్డ్ చూపించండి.',
};

const EXTRA3 = {
  en: {
    noRouteDest: (dest, name) => NO_ROUTE.en[dest](name) + SAFE_EXIT.en,
    confirmAsk: (name, t) => `${name}${t ? ', ' + t : ''}. Is that right? Say yes or no.`,
    confirmNo: "Okay, let's fix that. " + AIRPORT_Q.en,
    tipHeader: { money: 'Here are 3 quick money tips.', traps: '5 traps to avoid.', atm: 'ATM tips.', taxi: 'Taxi and pickup tips.', cards: 'Card tips.' },
    tipLine: (i, n, text) => `Tip ${i} of ${n}. ${text}`,
    tipMore: ' Say next for more.',
    tipsDone: "That's all the tips.",
    backToRoute: ' Say repeat to hear your current step.',
    info: {
      leftover: 'Change leftover cash before you leave the city; airport counters may ask for a minimum amount. Indian residents can keep some foreign currency for the next trip.',
      excessbag: 'Airline counters usually accept cards; keep your card handy instead of cash.',
      transit: "Connecting flight? Don't go through immigration or exit the airport. Follow the Transfer or Flight Connections signs, and ask airline staff if you're unsure.",
      closed: 'If this counter is closed, try the next exchange counter in the arrivals hall, or use an airport ATM and choose the local currency.',
      howmuch: 'Change only what you need for the first day: a taxi, a SIM and a meal. Use your card or a city ATM for the rest.',
      dcc: 'Always choose the local currency, not rupees. Paying in rupees usually means a worse rate.',
      forex: CARD_TIPS.forex.en, credit: CARD_TIPS.credit.en, debit: CARD_TIPS.debit.en,
    },
    offtopic: "I'm your airport arrival guide. I can help with currency exchange, SIM, taxi and metro, and checking an exchange rate. For this, please ask the airport staff. I've opened a card with your question to show them.",
    voiceNeedsNet: 'Voice needs internet. Connect to airport Wi-Fi or use the buttons.',
  },
  hi: {
    noRouteDest: (dest, name) => NO_ROUTE.hi[dest](name) + SAFE_EXIT.hi,
    confirmAsk: (name, t) => `${name}${t ? ', ' + t : ''}। क्या यह सही है? हाँ या नहीं बोलिए।`,
    confirmNo: 'ठीक है, सही करते हैं। ' + AIRPORT_Q.hi,
    tipHeader: { money: 'पैसों की 3 छोटी सलाह।', traps: '5 धोखे, जिनसे बचना है।', atm: 'एटीएम की सलाह।', taxi: 'टैक्सी और पिकअप की सलाह।', cards: 'कार्ड की सलाह।' },
    tipLine: (i, n, text) => `${n} में से टिप ${i}। ${text}`,
    tipMore: ' अगली के लिए आगे बोलिए।',
    tipsDone: 'बस, इतनी ही सलाह।',
    backToRoute: ' अपना मौजूदा कदम सुनने के लिए दोबारा बोलिए।',
    info: {
      leftover: 'शहर छोड़ने से पहले बचे हुए नकद पैसे बदल लीजिए; एयरपोर्ट काउंटर कम से कम रकम की शर्त रख सकते हैं। भारतीय निवासी अगली यात्रा के लिए कुछ विदेशी करेंसी रख सकते हैं।',
      excessbag: 'एयरलाइन काउंटर आमतौर पर कार्ड लेते हैं; नकद की जगह अपना कार्ड पास रखिए।',
      transit: 'कनेक्टिंग फ़्लाइट है? इमिग्रेशन से होकर बाहर मत जाइए। ट्रांसफ़र या फ़्लाइट कनेक्शन के बोर्ड देखिए, और शक हो तो एयरलाइन स्टाफ से पूछिए।',
      closed: 'यह काउंटर बंद हो तो अराइवल्स हॉल में अगला एक्सचेंज काउंटर देखिए, या एयरपोर्ट के एटीएम से पैसे निकालिए और लोकल करेंसी चुनिए।',
      howmuch: 'सिर्फ़ पहले दिन की ज़रूरत जितने पैसे बदलिए: टैक्सी, सिम और एक बार का खाना। बाकी के लिए कार्ड या शहर का एटीएम इस्तेमाल कीजिए।',
      dcc: 'हमेशा लोकल करेंसी चुनिए, रुपये नहीं। रुपये में भुगतान पर अक्सर रेट खराब मिलता है।',
      forex: CARD_TIPS.forex.hi, credit: CARD_TIPS.credit.hi, debit: CARD_TIPS.debit.hi,
    },
    offtopic: 'मैं आपकी एयरपोर्ट अराइवल गाइड हूँ। मैं करेंसी एक्सचेंज, सिम, टैक्सी, मेट्रो और रेट जाँचने में मदद कर सकती हूँ। इसके लिए कृपया एयरपोर्ट स्टाफ से पूछिए। उन्हें दिखाने के लिए आपके सवाल वाला कार्ड खोल दिया है।',
    voiceNeedsNet: 'आवाज़ के लिए इंटरनेट चाहिए। एयरपोर्ट वाई-फ़ाई से जुड़िए या बटन इस्तेमाल कीजिए।',
  },
  te: {
    noRouteDest: (dest, name) => NO_ROUTE.te[dest](name) + SAFE_EXIT.te,
    confirmAsk: (name, t) => `${name}${t ? ', ' + t : ''}. ఇది సరైనదేనా? అవును లేదా కాదు అని చెప్పండి.`,
    confirmNo: 'సరే, సరిచేద్దాం. ' + AIRPORT_Q.te,
    tipHeader: { money: '3 చిన్న డబ్బు చిట్కాలు.', traps: 'జాగ్రత్తపడాల్సిన 5 మోసాలు.', atm: 'ఏటీఎం చిట్కాలు.', taxi: 'టాక్సీ, పికప్ చిట్కాలు.', cards: 'కార్డ్ చిట్కాలు.' },
    tipLine: (i, n, text) => `${n}లో ${i}వ చిట్కా. ${text}`,
    tipMore: ' ఇంకా వినడానికి నెక్స్ట్ అని చెప్పండి.',
    tipsDone: 'చిట్కాలు అయిపోయాయి.',
    backToRoute: ' మీ ప్రస్తుత అడుగు వినడానికి మళ్ళీ అని చెప్పండి.',
    info: {
      leftover: 'నగరం విడిచి వెళ్ళే ముందే మిగిలిన నగదు మార్చుకోండి; ఎయిర్‌పోర్ట్ కౌంటర్లు కనీస మొత్తం అడగవచ్చు. భారతీయులు తర్వాతి ప్రయాణం కోసం కొంత విదేశీ కరెన్సీ ఉంచుకోవచ్చు.',
      excessbag: 'ఎయిర్‌లైన్ కౌంటర్లు సాధారణంగా కార్డులు తీసుకుంటాయి; నగదుకు బదులు మీ కార్డ్ దగ్గర ఉంచుకోండి.',
      transit: 'కనెక్టింగ్ ఫ్లైట్ ఉందా? ఇమ్మిగ్రేషన్ దాటి బయటకు వెళ్ళకండి. ట్రాన్స్‌ఫర్ లేదా ఫ్లైట్ కనెక్షన్స్ బోర్డులు చూడండి, సందేహం ఉంటే ఎయిర్‌లైన్ సిబ్బందిని అడగండి.',
      closed: 'ఈ కౌంటర్ మూసి ఉంటే, అరైవల్స్ హాల్‌లో తర్వాతి ఎక్స్ఛేంజ్ కౌంటర్ చూడండి, లేదా ఎయిర్‌పోర్ట్ ఏటీఎం వాడి లోకల్ కరెన్సీ ఎంచుకోండి.',
      howmuch: 'మొదటి రోజుకి కావాల్సినంత మాత్రమే మార్చండి: టాక్సీ, సిమ్, ఒక భోజనం. మిగతాదానికి కార్డ్ లేదా నగరంలోని ఏటీఎం వాడండి.',
      dcc: 'ఎప్పుడూ లోకల్ కరెన్సీనే ఎంచుకోండి, రూపాయలు కాదు. రూపాయల్లో చెల్లిస్తే సాధారణంగా రేటు తక్కువగా వస్తుంది.',
      forex: CARD_TIPS.forex.te, credit: CARD_TIPS.credit.te, debit: CARD_TIPS.debit.te,
    },
    offtopic: 'నేను మీ ఎయిర్‌పోర్ట్ అరైవల్ గైడ్‌ని. కరెన్సీ ఎక్స్ఛేంజ్, సిమ్, టాక్సీ, మెట్రో, రేటు చెక్ చేయడంలో సహాయం చేయగలను. దీని కోసం దయచేసి ఎయిర్‌పోర్ట్ సిబ్బందిని అడగండి. వాళ్ళకు చూపించడానికి మీ ప్రశ్నతో కార్డ్ తెరిచాను.',
    voiceNeedsNet: 'వాయిస్‌కి ఇంటర్నెట్ కావాలి. ఎయిర్‌పోర్ట్ వై-ఫైకి కనెక్ట్ అవ్వండి లేదా బటన్లు వాడండి.',
  },
};
for (const l of Object.keys(EXTRA3)) Object.assign(T[l], EXTRA3[l]);

// Round 5: phone-test fixes (amounts, price check, nobody here, app help, ATM locations)
const EXTRA4 = {
  en: {
    amountFair: (amount, from, fair, to, lang) => `For ${formatMoney(amount)} ${currencyName(from, lang)}, the fair amount at the mid-market rate is about ${formatMoney(fair)} ${currencyName(to, lang)}. Counters give a bit less; ask for the final amount.`,
    amountNeed: 'Tell me the amount and the currency you want, for example: how many dirhams for 500 dollars?',
    atmHere: (where) => `${where} Choose the local currency on screen and check the fee before you press OK.`,
    atmUnknown: (name) => `I don't have exact ATM locations for ${name || 'this airport'}. ATMs are usually in the arrivals hall after Customs: follow the ATM signs or ask at the info desk. I've opened a card you can show staff.`,
    info: {
      nostaff: "If nobody is around, follow the Information or 'i' signs to the info desk. You can also show this card to any airport staff or security officer.",
      apphelp: "Before you fly, open this app on Wi-Fi and tap 'Save for my trip'. Routes, staff cards and the latest rates are then kept on your phone and work in flight mode with the buttons. To add it to your home screen, open Chrome's menu and tap 'Add to home screen'. Voice still needs internet.",
    },
  },
  hi: {
    amountFair: (amount, from, fair, to, lang) => `${formatMoney(amount)} ${currencyName(from, lang)} के लिए मिड-मार्केट रेट पर सही रकम करीब ${formatMoney(fair)} ${currencyName(to, lang)} है। काउंटर थोड़ा कम देते हैं; फ़ाइनल अमाउंट पूछिए।`,
    amountNeed: 'रकम और जो करेंसी चाहिए वो बताइए, जैसे: 500 डॉलर के कितने दिरहम मिलेंगे?',
    atmHere: (where) => `${where} स्क्रीन पर लोकल करेंसी चुनिए और OK दबाने से पहले फ़ीस देख लीजिए।`,
    atmUnknown: (name) => `${name || 'इस एयरपोर्ट'} के एटीएम की सही जगह मेरे पास नहीं है। एटीएम आमतौर पर कस्टम्स के बाद अराइवल्स हॉल में होते हैं: एटीएम के बोर्ड देखिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए। स्टाफ़ को दिखाने के लिए कार्ड खोल दिया है।`,
    info: {
      nostaff: "आस-पास कोई नहीं है तो Information या 'i' के बोर्ड देखते हुए इन्फ़ॉर्मेशन डेस्क तक जाइए। यह कार्ड किसी भी एयरपोर्ट स्टाफ़ या सिक्योरिटी वाले को दिखा सकते हैं।",
      apphelp: "यात्रा से पहले वाई-फ़ाई पर यह ऐप खोलिए और 'ट्रिप के लिए सेव करें' दबाइए। फिर रास्ते, स्टाफ़ कार्ड और ताज़ा रेट आपके फ़ोन में रहेंगे और फ़्लाइट मोड में बटन से चलेंगे। होम स्क्रीन पर लगाने के लिए क्रोम का मेन्यू खोलिए और 'Add to home screen' दबाइए। आवाज़ के लिए इंटरनेट फिर भी चाहिए।",
    },
  },
  te: {
    amountFair: (amount, from, fair, to, lang) => `${formatMoney(amount)} ${currencyName(from, lang)} మారిస్తే, మిడ్-మార్కెట్ రేటు ప్రకారం సరైన మొత్తం సుమారు ${formatMoney(fair)} ${currencyName(to, lang)}. కౌంటర్లు కొంచెం తక్కువ ఇస్తాయి; ఫైనల్ మొత్తం అడగండి.`,
    amountNeed: 'మొత్తం, మీకు కావాల్సిన కరెన్సీ చెప్పండి, ఉదాహరణకు: 500 డాలర్లకు ఎన్ని దిర్హామ్‌లు వస్తాయి?',
    atmHere: (where) => `${where} స్క్రీన్‌పై లోకల్ కరెన్సీ ఎంచుకోండి, OK నొక్కే ముందు ఫీజు చూసుకోండి.`,
    atmUnknown: (name) => `${name || 'ఈ ఎయిర్‌పోర్ట్'}లో ఏటీఎంలు సరిగ్గా ఎక్కడో నా దగ్గర సమాచారం లేదు. ఏటీఎంలు సాధారణంగా కస్టమ్స్ తర్వాత అరైవల్స్ హాల్‌లో ఉంటాయి: ఏటీఎం బోర్డులు చూడండి లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి. సిబ్బందికి చూపించడానికి కార్డ్ తెరిచాను.`,
    info: {
      nostaff: "దగ్గర్లో ఎవరూ లేకపోతే, Information లేదా 'i' బోర్డులు చూస్తూ ఇన్ఫర్మేషన్ డెస్క్‌కి వెళ్ళండి. ఈ కార్డ్‌ను ఏ ఎయిర్‌పోర్ట్ సిబ్బందికైనా లేదా సెక్యూరిటీ వాళ్ళకైనా చూపించవచ్చు.",
      apphelp: "ప్రయాణానికి ముందు వై-ఫైలో ఈ యాప్ తెరిచి 'ట్రిప్ కోసం సేవ్ చేయి' నొక్కండి. అప్పుడు దారులు, స్టాఫ్ కార్డులు, తాజా రేట్లు మీ ఫోన్‌లోనే ఉంటాయి, ఫ్లైట్ మోడ్‌లో బటన్లతో పని చేస్తాయి. హోమ్ స్క్రీన్‌పై పెట్టడానికి క్రోమ్ మెనూ తెరిచి 'Add to home screen' నొక్కండి. వాయిస్‌కి మాత్రం ఇంటర్నెట్ కావాలి.",
    },
  },
};
for (const l of Object.keys(EXTRA4)) {
  const { info, ...rest } = EXTRA4[l];
  Object.assign(T[l], rest);
  Object.assign(T[l].info, info);
}

// Round 6: Changi T3 test (progress, counters, remembered amounts, no loops)
const QUALITY_NOTE = {
  en: { good: 'usually the best rate here', fair: 'a middle rate', pricey: 'usually pricier', unknown: 'rate not compared yet' },
  hi: { good: 'यहाँ आमतौर पर सबसे अच्छा रेट', fair: 'बीच का रेट', pricey: 'अक्सर महँगा', unknown: 'रेट की तुलना अभी नहीं हुई' },
  te: { good: 'ఇక్కడ సాధారణంగా మంచి రేటు', fair: 'మధ్యస్థ రేటు', pricey: 'సాధారణంగా ఖరీదు', unknown: 'రేటు ఇంకా పోల్చలేదు' },
};
const counterLines = (items, l) => items.map((c, i) => `${i + 1}. ${c.name}, ${c.location} (${QUALITY_NOTE[l][c.quality] || ''})`).join(' ');
const EXTRA5 = {
  en: {
    doneAck: 'Good.',
    countersList: (name, items) => `${items.length === 1 ? 'One exchange counter is' : items.length + ' exchange counters are'} listed at ${name}: ${counterLines(items, 'en')}.`,
    countersNone: (name) => `No exchange counter is listed at ${name}. Use an ATM, or ask at the info desk.`,
    countersGuide: (first) => `Shall I guide you to ${first} step by step? Say yes.`,
    priceExample: (given, from, offered, to, lang) => `Tell me both amounts, for example: they give ${formatMoney(offered)} ${currencyName(to, lang)} for ${formatMoney(given)} ${currencyName(from, lang)}.`,
    askOffer: (amt, local, lang) => `How many ${currencyName(local, lang)} are they giving for your ${formatMoney(amt.amount)} ${currencyName(amt.currency, lang)}? For example: they're giving 1,250.`,
    tapButtons: { confirm: 'Please tap Yes or No below.', airport: 'Please tap your airport below.', terminal: 'Please tap your terminal below.', need: 'Please tap what you need below.' },
    lostAskAgain: 'Tell me one thing you can see, for example: passport desks, baggage belts, customs, or a big hall with people waiting.',
    lostGiveUp: 'Follow the signs for Arrivals or Baggage Claim, or show this card to any staff member.',
  },
  hi: {
    doneAck: 'बढ़िया।',
    countersList: (name, items) => `${name} में ${items.length} एक्सचेंज काउंटर ${items.length === 1 ? 'है' : 'हैं'}: ${counterLines(items, 'hi')}।`,
    countersNone: (name) => `${name} में कोई एक्सचेंज काउंटर नहीं है। एटीएम इस्तेमाल कीजिए या इन्फ़ॉर्मेशन डेस्क पर पूछिए।`,
    countersGuide: (first) => `क्या मैं आपको ${first} तक एक-एक कदम ले चलूँ? हाँ बोलिए।`,
    priceExample: (given, from, offered, to, lang) => `दोनों रकम बताइए, जैसे: ${formatMoney(given)} ${currencyName(from, lang)} के ${formatMoney(offered)} ${currencyName(to, lang)} दे रहे हैं।`,
    askOffer: (amt, local, lang) => `आपके ${formatMoney(amt.amount)} ${currencyName(amt.currency, lang)} के वो कितने ${currencyName(local, lang)} दे रहे हैं? जैसे: 1,250 दे रहे हैं।`,
    tapButtons: { confirm: 'कृपया नीचे हाँ या नहीं दबाइए।', airport: 'कृपया नीचे अपना एयरपोर्ट दबाइए।', terminal: 'कृपया नीचे अपना टर्मिनल दबाइए।', need: 'कृपया नीचे दबाइए कि क्या चाहिए।' },
    lostAskAgain: 'कोई एक चीज़ बताइए जो दिख रही हो, जैसे: पासपोर्ट डेस्क, बैगेज बेल्ट, कस्टम्स, या लोगों से भरा बड़ा हॉल।',
    lostGiveUp: 'Arrivals या Baggage Claim के बोर्ड देखते हुए चलिए, या यह कार्ड किसी भी स्टाफ़ को दिखाइए।',
  },
  te: {
    doneAck: 'బాగుంది.',
    countersList: (name, items) => `${name}లో ${items.length === 1 ? 'ఒక ఎక్స్ఛేంజ్ కౌంటర్ ఉంది' : items.length + ' ఎక్స్ఛేంజ్ కౌంటర్లు ఉన్నాయి'}: ${counterLines(items, 'te')}.`,
    countersNone: (name) => `${name}లో ఎక్స్ఛేంజ్ కౌంటర్ లేదు. ఏటీఎం వాడండి, లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి.`,
    countersGuide: (first) => `${first} దగ్గరికి ఒక్కో అడుగు తీసుకెళ్ళనా? అవును అని చెప్పండి.`,
    priceExample: (given, from, offered, to, lang) => `రెండు మొత్తాలూ చెప్పండి, ఉదాహరణకు: ${formatMoney(given)} ${currencyName(from, lang)}కి ${formatMoney(offered)} ${currencyName(to, lang)} ఇస్తున్నారు.`,
    askOffer: (amt, local, lang) => `మీ ${formatMoney(amt.amount)} ${currencyName(amt.currency, lang)}కి వాళ్ళు ఎన్ని ${currencyName(local, lang)} ఇస్తున్నారు? ఉదాహరణకు: 1,250 ఇస్తున్నారు.`,
    tapButtons: { confirm: 'దయచేసి కింద అవును లేదా కాదు నొక్కండి.', airport: 'దయచేసి కింద మీ ఎయిర్‌పోర్ట్ నొక్కండి.', terminal: 'దయచేసి కింద మీ టెర్మినల్ నొక్కండి.', need: 'దయచేసి కింద మీకు ఏం కావాలో నొక్కండి.' },
    lostAskAgain: 'మీకు కనిపిస్తున్న ఒక్క దాని గురించి చెప్పండి, ఉదాహరణకు: పాస్‌పోర్ట్ డెస్క్‌లు, బ్యాగేజ్ బెల్ట్‌లు, కస్టమ్స్, లేదా జనం వేచి ఉన్న పెద్ద హాల్.',
    lostGiveUp: 'Arrivals లేదా Baggage Claim బోర్డులు చూస్తూ వెళ్ళండి, లేదా ఈ కార్డ్‌ను ఏ సిబ్బందికైనా చూపించండి.',
  },
};
for (const l of Object.keys(EXTRA5)) Object.assign(T[l], EXTRA5[l]);

// Round 7: greetings, confusion, traveller questions, resuming after a refresh (spoken replies under ~25 words)
const SIDE_TEXT = {
  en: { airside: 'after immigration, before customs (baggage hall)', landside: 'after customs, in the public area', unknown: 'not confirmed; ask the info desk' },
  hi: { airside: 'इमिग्रेशन के बाद, कस्टम्स से पहले (बैगेज हॉल)', landside: 'कस्टम्स के बाद, बाहर पब्लिक एरिया में', unknown: 'पक्का नहीं; इन्फ़ॉर्मेशन डेस्क पर पूछिए' },
  te: { airside: 'ఇమ్మిగ్రేషన్ తర్వాత, కస్టమ్స్ ముందు (బ్యాగేజ్ హాల్)', landside: 'కస్టమ్స్ తర్వాత, బయటి పబ్లిక్ ఏరియాలో', unknown: 'ఖచ్చితంగా తెలియదు; ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి' },
};
const sideLines = (items, l) => items.map((c) => `${c.name}: ${SIDE_TEXT[l][c.side] || SIDE_TEXT[l].unknown}`).join('; ');
const EXTRA6 = {
  en: {
    greet: "Hello! I'm your airport arrival guide. Which airport did you land at?",
    greetBack: 'Hello again!',
    confused: (step, sign) => `No problem, we'll stay on this step. ${step} Look for the "${sign}" signs; if there are two ways, take the one with that sign. Say "ask staff" for a card.`,
    confusedNoRoute: 'No problem. Tell me your airport, and whether you need money exchange, a SIM or a taxi.',
    latenight24: (names) => `${names}: listed as open 24 hours. Others may close at night; use a bank ATM if needed.`,
    beforeAfter: (items) => `${sideLines(items, 'en')}.`,
    beforeAfterNoTerm: "Tell me your airport and terminal, and I'll check where the counters are.",
    resumeLead: (n) => `You were on step ${n}.`,
    info: {
      wifi: 'Use the official airport Wi-Fi. If it asks for an OTP, ask the info desk for a code. Your saved trip works offline.',
      battery: 'Look for charging points near seats, or ask the info desk. Use your own charger in a wall socket. Screenshot your route now.',
      nodata: 'Use your saved trip offline with the buttons. Show the staff card, and ask the info desk for directions.',
      carddecline: "Try another bank's ATM. Check your PIN and that international use is on; choose local currency. Still failing? Call the number on your card.",
      lostitem: 'Go to the information desk or airport police now. For a passport, contact the Indian embassy or consulate. Block lost cards with your bank.',
      missedflight: "Go to your airline's transfer or service desk. Keep your boarding pass and receipts.",
      shortchanged: 'Count again at the counter, ask for the receipt, and speak to the supervisor before you leave.',
      taxiissue: 'Use only the official taxi stand or app; check the meter or agree the fare first. Meet your driver at the official pickup point.',
      latenight: 'Some counters may be closed at night. Use a bank ATM and ask the info desk.',
      unsafe: 'Go to the nearest staff member, information desk or airport police. In an emergency, call the local emergency number.',
      wheelchair: "Ask your airline or the information desk for special assistance. It's best booked before you fly.",
      trolley: 'Trolleys are usually near the baggage belts and the arrivals exits.',
      visa: 'Rules depend on your passport and trip. Check the embassy or official government website before you fly. I guide you after immigration.',
    },
  },
  hi: {
    greet: 'नमस्ते! मैं आपकी एयरपोर्ट अराइवल गाइड हूँ। आप किस एयरपोर्ट पर उतरे हैं?',
    greetBack: 'नमस्ते!',
    confused: (step, sign) => `कोई बात नहीं, हम इसी कदम पर हैं। ${step} "${sign}" वाले बोर्ड देखिए; दो रास्ते हों तो उसी बोर्ड वाला लीजिए। कार्ड के लिए "स्टाफ से पूछना है" बोलिए।`,
    confusedNoRoute: 'कोई बात नहीं। अपना एयरपोर्ट बताइए, और बताइए कि पैसे बदलने हैं, सिम चाहिए या टैक्सी।',
    latenight24: (names) => `${names}: 24 घंटे खुला बताया गया है। बाकी रात में बंद हो सकते हैं; ज़रूरत हो तो बैंक का एटीएम इस्तेमाल कीजिए।`,
    beforeAfter: (items) => `${sideLines(items, 'hi')}।`,
    beforeAfterNoTerm: 'अपना एयरपोर्ट और टर्मिनल बताइए, मैं देखती हूँ काउंटर कहाँ हैं।',
    resumeLead: (n) => `आप कदम ${n} पर थे।`,
    info: {
      wifi: 'एयरपोर्ट का आधिकारिक वाई-फ़ाई इस्तेमाल कीजिए। OTP माँगे तो इन्फ़ॉर्मेशन डेस्क से कोड लीजिए। सेव की हुई ट्रिप बिना इंटरनेट चलती है।',
      battery: 'बैठने की जगह के पास चार्जिंग पॉइंट देखिए, या इन्फ़ॉर्मेशन डेस्क पर पूछिए। दीवार के सॉकेट में अपना चार्जर लगाइए। अभी रास्ते का स्क्रीनशॉट ले लीजिए।',
      nodata: 'सेव की हुई ट्रिप बटन से बिना इंटरनेट इस्तेमाल कीजिए। स्टाफ़ कार्ड दिखाइए, और इन्फ़ॉर्मेशन डेस्क से रास्ता पूछिए।',
      carddecline: 'दूसरे बैंक का एटीएम आज़माइए। पिन और इंटरनेशनल इस्तेमाल चालू है, यह देखिए; लोकल करेंसी चुनिए। फिर भी न चले तो कार्ड के पीछे वाले नंबर पर कॉल कीजिए।',
      lostitem: 'अभी इन्फ़ॉर्मेशन डेस्क या एयरपोर्ट पुलिस के पास जाइए। पासपोर्ट के लिए भारतीय दूतावास या कॉन्सुलेट से संपर्क कीजिए। खोए कार्ड बैंक से ब्लॉक कराइए।',
      missedflight: 'अपनी एयरलाइन के ट्रांसफ़र या सर्विस डेस्क पर जाइए। बोर्डिंग पास और रसीदें संभाल कर रखिए।',
      shortchanged: 'काउंटर पर ही दोबारा गिनिए, रसीद माँगिए, और जाने से पहले सुपरवाइज़र से बात कीजिए।',
      taxiissue: 'सिर्फ़ आधिकारिक टैक्सी स्टैंड या ऐप इस्तेमाल कीजिए; मीटर देखिए या किराया पहले तय कीजिए। ड्राइवर से आधिकारिक पिकअप पॉइंट पर ही मिलिए।',
      latenight: 'रात में कुछ काउंटर बंद हो सकते हैं। बैंक का एटीएम इस्तेमाल कीजिए और इन्फ़ॉर्मेशन डेस्क पर पूछिए।',
      unsafe: 'सबसे पास के स्टाफ़, इन्फ़ॉर्मेशन डेस्क या एयरपोर्ट पुलिस के पास जाइए। इमरजेंसी में स्थानीय इमरजेंसी नंबर पर कॉल कीजिए।',
      wheelchair: 'स्पेशल असिस्टेंस के लिए अपनी एयरलाइन या इन्फ़ॉर्मेशन डेस्क से कहिए। यह यात्रा से पहले बुक करना सबसे अच्छा है।',
      trolley: 'ट्रॉली आमतौर पर बैगेज बेल्ट और अराइवल्स के एग्ज़िट के पास होती हैं।',
      visa: 'नियम आपके पासपोर्ट और यात्रा पर निर्भर हैं। यात्रा से पहले दूतावास या सरकारी वेबसाइट देखिए। मैं इमिग्रेशन के बाद रास्ता बताती हूँ।',
    },
  },
  te: {
    greet: 'నమస్తే! నేను మీ ఎయిర్‌పోర్ట్ అరైవల్ గైడ్‌ని. మీరు ఏ ఎయిర్‌పోర్ట్‌లో దిగారు?',
    greetBack: 'నమస్తే!',
    confused: (step, sign) => `పర్వాలేదు, ఇదే అడుగులో ఉన్నాం. ${step} "${sign}" బోర్డులు చూడండి; రెండు దారులు ఉంటే ఆ బోర్డు ఉన్న దారిలో వెళ్ళండి. కార్డ్ కోసం "స్టాఫ్‌ని అడగాలి" అని చెప్పండి.`,
    confusedNoRoute: 'పర్వాలేదు. మీ ఎయిర్‌పోర్ట్ చెప్పండి, డబ్బు మార్చాలా, సిమ్ కావాలా, టాక్సీ కావాలా చెప్పండి.',
    latenight24: (names) => `${names}: 24 గంటలు తెరిచి ఉంటుందని ఉంది. మిగతావి రాత్రి మూసి ఉండొచ్చు; అవసరమైతే బ్యాంక్ ఏటీఎం వాడండి.`,
    beforeAfter: (items) => `${sideLines(items, 'te')}.`,
    beforeAfterNoTerm: 'మీ ఎయిర్‌పోర్ట్, టెర్మినల్ చెప్పండి, కౌంటర్లు ఎక్కడ ఉన్నాయో చూస్తాను.',
    resumeLead: (n) => `మీరు ${n}వ అడుగులో ఉన్నారు.`,
    info: {
      wifi: 'ఎయిర్‌పోర్ట్ అధికారిక వై-ఫై వాడండి. OTP అడిగితే ఇన్ఫర్మేషన్ డెస్క్‌లో కోడ్ అడగండి. సేవ్ చేసిన ట్రిప్ ఇంటర్నెట్ లేకుండా పని చేస్తుంది.',
      battery: 'కూర్చునే చోట దగ్గర ఛార్జింగ్ పాయింట్లు చూడండి, లేదా ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి. గోడ సాకెట్‌లో మీ సొంత ఛార్జర్ వాడండి. ఇప్పుడే దారి స్క్రీన్‌షాట్ తీసుకోండి.',
      nodata: 'సేవ్ చేసిన ట్రిప్‌ను బటన్లతో ఇంటర్నెట్ లేకుండా వాడండి. స్టాఫ్ కార్డ్ చూపించండి, ఇన్ఫర్మేషన్ డెస్క్‌లో దారి అడగండి.',
      carddecline: 'వేరే బ్యాంక్ ఏటీఎం ప్రయత్నించండి. పిన్, ఇంటర్నేషనల్ వాడకం ఆన్‌లో ఉందో చూడండి; లోకల్ కరెన్సీ ఎంచుకోండి. అయినా పని చేయకపోతే కార్డ్ వెనక ఉన్న నంబర్‌కి కాల్ చేయండి.',
      lostitem: 'వెంటనే ఇన్ఫర్మేషన్ డెస్క్ లేదా ఎయిర్‌పోర్ట్ పోలీస్ దగ్గరికి వెళ్ళండి. పాస్‌పోర్ట్ కోసం భారత రాయబార కార్యాలయం లేదా కాన్సులేట్‌ను సంప్రదించండి. పోయిన కార్డులను బ్యాంక్‌తో బ్లాక్ చేయించండి.',
      missedflight: 'మీ ఎయిర్‌లైన్ ట్రాన్స్‌ఫర్ లేదా సర్వీస్ డెస్క్‌కి వెళ్ళండి. బోర్డింగ్ పాస్, రసీదులు జాగ్రత్తగా ఉంచుకోండి.',
      shortchanged: 'కౌంటర్ దగ్గరే మళ్ళీ లెక్కపెట్టండి, రసీదు అడగండి, వెళ్ళే ముందు సూపర్‌వైజర్‌తో మాట్లాడండి.',
      taxiissue: 'అధికారిక టాక్సీ స్టాండ్ లేదా యాప్ మాత్రమే వాడండి; మీటర్ చూడండి లేదా ముందే ఛార్జీ మాట్లాడుకోండి. డ్రైవర్‌ని అధికారిక పికప్ పాయింట్‌లోనే కలవండి.',
      latenight: 'రాత్రి కొన్ని కౌంటర్లు మూసి ఉండొచ్చు. బ్యాంక్ ఏటీఎం వాడండి, ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి.',
      unsafe: 'దగ్గర్లోని సిబ్బంది, ఇన్ఫర్మేషన్ డెస్క్ లేదా ఎయిర్‌పోర్ట్ పోలీస్ దగ్గరికి వెళ్ళండి. అత్యవసరమైతే స్థానిక ఎమర్జెన్సీ నంబర్‌కి కాల్ చేయండి.',
      wheelchair: 'ప్రత్యేక సహాయం కోసం మీ ఎయిర్‌లైన్‌ను లేదా ఇన్ఫర్మేషన్ డెస్క్‌ను అడగండి. ప్రయాణానికి ముందే బుక్ చేయడం మంచిది.',
      trolley: 'ట్రాలీలు సాధారణంగా బ్యాగేజ్ బెల్ట్‌లు, అరైవల్స్ ఎగ్జిట్ దగ్గర ఉంటాయి.',
      visa: 'నియమాలు మీ పాస్‌పోర్ట్, ప్రయాణం మీద ఆధారపడతాయి. ప్రయాణానికి ముందే ఎంబసీ లేదా అధికారిక ప్రభుత్వ వెబ్‌సైట్ చూడండి. నేను ఇమ్మిగ్రేషన్ తర్వాత దారి చూపిస్తాను.',
    },
  },
};
for (const l of Object.keys(EXTRA6)) {
  const { info, ...rest } = EXTRA6[l];
  Object.assign(T[l], rest);
  Object.assign(T[l].info, info);
}

// Round 8: what do you need first, overview, emergencies, taxi fares, translations, out-of-scope
const EXTRA7 = {
  en: {
    askNeed: (place) => `${place}. What do you need first: change money, a SIM card, a taxi, or just the way out?`,
    askNeedShort: 'What do you need first: change money, a SIM card, a taxi, or just the way out?',
    overview: 'First: 1. Immigration. 2. Collect your bags. 3. Customs. 4. Change a small amount, get a SIM, then a taxi. What do you need first?',
    emergency: 'Go to the nearest staff member, information desk or airport police now. In an emergency, call the local emergency number. Show them this card.',
    taxicost: 'Fares vary by distance and time. Use the official taxi stand, check the meter is on, or ask the fare before you get in.',
    translate: "Here's our checked card to show staff. The app has cards for money exchange, SIM, taxi and help.",
    scopeLine: "I'm your arrival guide for money, SIM, taxi and directions; for this, ask staff or check the official source.",
    outOfScope: "I can't help with that one. I'm your arrival guide for money, SIM, taxi and directions; for this, ask staff or check the official source.",
    resumeAll: 'Continuing where you left off.',
  },
  hi: {
    askNeed: (place) => `${place}। पहले क्या चाहिए: पैसे बदलना, सिम कार्ड, टैक्सी, या बस बाहर का रास्ता?`,
    askNeedShort: 'पहले क्या चाहिए: पैसे बदलना, सिम कार्ड, टैक्सी, या बस बाहर का रास्ता?',
    overview: 'पहले: 1. इमिग्रेशन। 2. सामान लीजिए। 3. कस्टम्स। 4. थोड़े पैसे बदलिए, सिम लीजिए, फिर टैक्सी। पहले क्या चाहिए?',
    emergency: 'अभी सबसे पास के स्टाफ़, इन्फ़ॉर्मेशन डेस्क या एयरपोर्ट पुलिस के पास जाइए। इमरजेंसी में स्थानीय इमरजेंसी नंबर पर कॉल कीजिए। उन्हें यह कार्ड दिखाइए।',
    taxicost: 'किराया दूरी और समय पर निर्भर है। आधिकारिक टैक्सी स्टैंड इस्तेमाल कीजिए, मीटर चालू है यह देखिए, या बैठने से पहले किराया पूछिए।',
    translate: 'स्टाफ़ को दिखाने के लिए हमारा जाँचा हुआ कार्ड यह रहा। ऐप में पैसे बदलने, सिम, टैक्सी और मदद के कार्ड हैं।',
    scopeLine: 'मैं पैसे, सिम, टैक्सी और रास्ते के लिए आपकी अराइवल गाइड हूँ; इसके लिए स्टाफ़ से पूछिए या आधिकारिक स्रोत देखिए।',
    outOfScope: 'इसमें मैं मदद नहीं कर सकती। मैं पैसे, सिम, टैक्सी और रास्ते के लिए आपकी अराइवल गाइड हूँ; इसके लिए स्टाफ़ से पूछिए या आधिकारिक स्रोत देखिए।',
    resumeAll: 'जहाँ छोड़ा था, वहीं से आगे बढ़ते हैं।',
  },
  te: {
    askNeed: (place) => `${place}. ముందు ఏం కావాలి: డబ్బు మార్చాలా, సిమ్ కార్డా, టాక్సీనా, లేక బయటకు దారి మాత్రమేనా?`,
    askNeedShort: 'ముందు ఏం కావాలి: డబ్బు మార్చాలా, సిమ్ కార్డా, టాక్సీనా, లేక బయటకు దారి మాత్రమేనా?',
    overview: 'ముందు: 1. ఇమ్మిగ్రేషన్. 2. బ్యాగులు తీసుకోండి. 3. కస్టమ్స్. 4. కొంచెం డబ్బు మార్చండి, సిమ్ తీసుకోండి, తర్వాత టాక్సీ. ముందు ఏం కావాలి?',
    emergency: 'వెంటనే దగ్గర్లోని సిబ్బంది, ఇన్ఫర్మేషన్ డెస్క్ లేదా ఎయిర్‌పోర్ట్ పోలీస్ దగ్గరికి వెళ్ళండి. అత్యవసరమైతే స్థానిక ఎమర్జెన్సీ నంబర్‌కి కాల్ చేయండి. ఈ కార్డ్ చూపించండి.',
    taxicost: 'ఛార్జీ దూరం, సమయం మీద ఆధారపడుతుంది. అధికారిక టాక్సీ స్టాండ్ వాడండి, మీటర్ ఆన్‌లో ఉందో చూడండి, లేదా ఎక్కే ముందే ఛార్జీ అడగండి.',
    translate: 'సిబ్బందికి చూపించడానికి మేము చెక్ చేసిన కార్డ్ ఇదిగో. యాప్‌లో డబ్బు మార్పిడి, సిమ్, టాక్సీ, సహాయం కార్డులు ఉన్నాయి.',
    scopeLine: 'నేను డబ్బు, సిమ్, టాక్సీ, దారి కోసం మీ అరైవల్ గైడ్‌ని; దీని కోసం సిబ్బందిని అడగండి లేదా అధికారిక సమాచారం చూడండి.',
    outOfScope: 'దీనిలో నేను సహాయం చేయలేను. నేను డబ్బు, సిమ్, టాక్సీ, దారి కోసం మీ అరైవల్ గైడ్‌ని; దీని కోసం సిబ్బందిని అడగండి లేదా అధికారిక సమాచారం చూడండి.',
    resumeAll: 'మీరు ఆపిన చోటు నుంచి కొనసాగిస్తున్నాం.',
  },
};
for (const l of Object.keys(EXTRA7)) Object.assign(T[l], EXTRA7[l]);

// Round 9: price follow-up, hotels, onward travel, single words
const EXTRA8 = {
  en: {
    verdictLine: (c) => `${pctText(c, 'en')} ${verdictText(c.verdict, 'en')} Compare another counter if you can, and ask for the final amount.`,
    hotelbook: "I can't book hotels; use your booking app or ask the info desk.",
    hotelask: 'Do you need a taxi to your hotel, or directions to the exit?',
    onward: (place) => `From the airport you can take the official taxi or a bus; for buses to ${place}, ask the information desk. Say "taxi" for the taxi stand route.`,
    onwardPlace: { pattaya: 'Pattaya', city: 'the city' },
    taxiSafety: 'Use only the official taxi stand, and ignore ride offers in the hall.',
  },
  hi: {
    verdictLine: (c) => `${pctText(c, 'hi')} ${verdictText(c.verdict, 'hi')} हो सके तो दूसरा काउंटर देखिए, और फ़ाइनल अमाउंट पूछिए।`,
    hotelbook: 'मैं होटल बुक नहीं कर सकती; अपने बुकिंग ऐप या इन्फ़ॉर्मेशन डेस्क से पूछिए।',
    hotelask: 'होटल के लिए टैक्सी चाहिए, या बाहर जाने का रास्ता?',
    onward: (place) => `एयरपोर्ट से आधिकारिक टैक्सी या बस ले सकते हैं; ${place} की बस के लिए इन्फ़ॉर्मेशन डेस्क पर पूछिए। टैक्सी स्टैंड के रास्ते के लिए "टैक्सी" बोलिए।`,
    onwardPlace: { pattaya: 'पटाया', city: 'शहर' },
    taxiSafety: 'सिर्फ़ आधिकारिक टैक्सी स्टैंड इस्तेमाल कीजिए, और हॉल में राइड ऑफ़र करने वालों को नज़रअंदाज़ कीजिए।',
  },
  te: {
    verdictLine: (c) => `${pctText(c, 'te')} ${verdictText(c.verdict, 'te')} వీలైతే వేరే కౌంటర్ చూడండి, ఫైనల్ మొత్తం అడగండి.`,
    hotelbook: 'నేను హోటల్స్ బుక్ చేయలేను; మీ బుకింగ్ యాప్‌ని లేదా ఇన్ఫర్మేషన్ డెస్క్‌ని అడగండి.',
    hotelask: 'హోటల్‌కి టాక్సీ కావాలా, లేక బయటకు దారి కావాలా?',
    onward: (place) => `ఎయిర్‌పోర్ట్ నుంచి అధికారిక టాక్సీ లేదా బస్ తీసుకోవచ్చు; ${place}కి బస్సుల కోసం ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి. టాక్సీ స్టాండ్ దారి కోసం "టాక్సీ" అని చెప్పండి.`,
    onwardPlace: { pattaya: 'పట్టాయా', city: 'సిటీ' },
    taxiSafety: 'అధికారిక టాక్సీ స్టాండ్ మాత్రమే వాడండి, హాల్‌లో రైడ్ ఆఫర్ చేసేవాళ్ళను పట్టించుకోకండి.',
  },
};
for (const l of Object.keys(EXTRA8)) Object.assign(T[l], EXTRA8[l]);
export const tipList = (key, lang) => (TIP_LISTS[key] && (TIP_LISTS[key][short(lang)] || TIP_LISTS[key].en)) || [];

// ---------- Ask-staff card ----------
// Short, polite questions. Arabic for Dubai, Thai for Bangkok, English for Singapore,
// Hindi + English for Bengaluru and Delhi. Telugu is used only when the airport isn't known.
export const STAFF = {
  en: { exchange: 'Excuse me, where is the currency exchange counter?', sim: 'Excuse me, where can I buy a SIM card?', taxi: 'Excuse me, where is the taxi stand?' },
  ar: { exchange: 'من فضلك، أين مكتب صرافة العملات؟', sim: 'من فضلك، أين يمكنني شراء شريحة هاتف؟', taxi: 'من فضلك، أين موقف سيارات الأجرة؟' },
  th: { exchange: 'ขอโทษครับ/ค่ะ ที่แลกเงินอยู่ที่ไหน', sim: 'ขอโทษครับ/ค่ะ ซื้อซิมการ์ดได้ที่ไหน', taxi: 'ขอโทษครับ/ค่ะ จุดขึ้นรถแท็กซี่อยู่ที่ไหน' },
  hi: { exchange: 'कृपया बताइए, करेंसी एक्सचेंज काउंटर कहाँ है?', sim: 'कृपया बताइए, सिम कार्ड कहाँ मिलेगा?', taxi: 'कृपया बताइए, टैक्सी स्टैंड कहाँ है?' },
  te: { exchange: 'దయచేసి చెప్పండి, కరెన్సీ ఎక్స్ఛేంజ్ కౌంటర్ ఎక్కడ ఉంది?', sim: 'దయచేసి చెప్పండి, సిమ్ కార్డ్ ఎక్కడ దొరుకుతుంది?', taxi: 'దయచేసి చెప్పండి, టాక్సీ స్టాండ్ ఎక్కడ ఉంది?' },
};
// Metro and the off-topic questions the guide hands over to staff
const STAFF_MORE = {
  en: {
    bus: 'Excuse me, where can I get a bus or an official taxi to the city?',
    help: 'Excuse me, I need help. Where is the information desk or airport police?',
    lost: "Excuse me, I'm lost. How do I get to baggage claim and the arrivals hall?",
    atm: 'Excuse me, where is the nearest ATM?',
    metro: 'Excuse me, where is the metro or train?', toilet: 'Excuse me, where is the toilet?',
    prayer: 'Excuse me, where is the prayer room?', food: 'Excuse me, where can I get food or coffee?',
    shop: 'Excuse me, where are the shops and duty free?', lounge: 'Excuse me, where is the lounge?',
    lostbag: "Excuse me, my bag hasn't arrived. Where is the baggage services desk?",
  },
  ar: {
    bus: 'من فضلك، أين يمكنني ركوب حافلة أو سيارة أجرة رسمية إلى المدينة؟',
    help: 'من فضلك، أحتاج إلى مساعدة. أين مكتب الاستعلامات أو شرطة المطار؟',
    lost: 'من فضلك، أنا تائه. كيف أصل إلى استلام الأمتعة وصالة الوصول؟',
    atm: 'من فضلك، أين أقرب صراف آلي؟',
    metro: 'من فضلك، أين المترو أو القطار؟', toilet: 'من فضلك، أين دورة المياه؟',
    prayer: 'من فضلك، أين المصلى؟', food: 'من فضلك، أين يمكنني شراء طعام أو قهوة؟',
    shop: 'من فضلك، أين المحلات والسوق الحرة؟', lounge: 'من فضلك، أين صالة الانتظار؟',
    lostbag: 'من فضلك، حقيبتي لم تصل. أين مكتب خدمات الأمتعة؟',
  },
  th: {
    bus: 'ขอโทษครับ/ค่ะ ขึ้นรถบัสหรือแท็กซี่ทางการเข้าเมืองได้ที่ไหน',
    help: 'ขอโทษครับ/ค่ะ ฉันต้องการความช่วยเหลือ เคาน์เตอร์ประชาสัมพันธ์หรือตำรวจสนามบินอยู่ที่ไหน',
    lost: 'ขอโทษครับ/ค่ะ ฉันหลงทาง ไปที่รับกระเป๋าและโถงผู้โดยสารขาเข้าทางไหน',
    atm: 'ขอโทษครับ/ค่ะ ตู้เอทีเอ็มที่ใกล้ที่สุดอยู่ที่ไหน',
    metro: 'ขอโทษครับ/ค่ะ รถไฟฟ้าอยู่ที่ไหน', toilet: 'ขอโทษครับ/ค่ะ ห้องน้ำอยู่ที่ไหน',
    prayer: 'ขอโทษครับ/ค่ะ ห้องละหมาดอยู่ที่ไหน', food: 'ขอโทษครับ/ค่ะ ร้านอาหารหรือร้านกาแฟอยู่ที่ไหน',
    shop: 'ขอโทษครับ/ค่ะ ร้านค้าและดิวตี้ฟรีอยู่ที่ไหน', lounge: 'ขอโทษครับ/ค่ะ เลานจ์อยู่ที่ไหน',
    lostbag: 'ขอโทษครับ/ค่ะ กระเป๋าของฉันไม่มา ติดต่อแผนกสัมภาระได้ที่ไหน',
  },
  hi: {
    bus: 'माफ़ कीजिए, शहर के लिए बस या आधिकारिक टैक्सी कहाँ मिलेगी?',
    help: 'माफ़ कीजिए, मुझे मदद चाहिए। इन्फ़ॉर्मेशन डेस्क या एयरपोर्ट पुलिस कहाँ है?',
    lost: 'माफ़ कीजिए, मैं रास्ता भूल गया हूँ। बैगेज क्लेम और अराइवल हॉल कैसे जाऊँ?',
    atm: 'कृपया बताइए, सबसे पास का एटीएम कहाँ है?',
    metro: 'कृपया बताइए, मेट्रो या ट्रेन कहाँ है?', toilet: 'कृपया बताइए, शौचालय कहाँ है?',
    prayer: 'कृपया बताइए, प्रार्थना कक्ष कहाँ है?', food: 'कृपया बताइए, खाना या कॉफ़ी कहाँ मिलेगी?',
    shop: 'कृपया बताइए, दुकानें और ड्यूटी फ़्री कहाँ हैं?', lounge: 'कृपया बताइए, लाउंज कहाँ है?',
    lostbag: 'मेरा सामान नहीं आया। बैगेज सर्विस डेस्क कहाँ है?',
  },
  te: {
    bus: 'క్షమించండి, సిటీకి బస్ లేదా అధికారిక టాక్సీ ఎక్కడ దొరుకుతుంది?',
    help: 'క్షమించండి, నాకు సహాయం కావాలి. ఇన్ఫర్మేషన్ డెస్క్ లేదా ఎయిర్‌పోర్ట్ పోలీస్ ఎక్కడ ఉంది?',
    lost: 'క్షమించండి, నేను దారి తప్పాను. బ్యాగేజ్ క్లెయిమ్, అరైవల్స్ హాల్‌కి ఎలా వెళ్ళాలి?',
    atm: 'దయచేసి చెప్పండి, దగ్గర్లో ఏటీఎం ఎక్కడ ఉంది?',
    metro: 'దయచేసి చెప్పండి, మెట్రో లేదా రైలు ఎక్కడ ఉంది?', toilet: 'దయచేసి చెప్పండి, టాయిలెట్ ఎక్కడ ఉంది?',
    prayer: 'దయచేసి చెప్పండి, ప్రార్థన గది ఎక్కడ ఉంది?', food: 'దయచేసి చెప్పండి, భోజనం లేదా కాఫీ ఎక్కడ దొరుకుతుంది?',
    shop: 'దయచేసి చెప్పండి, షాపులు, డ్యూటీ ఫ్రీ ఎక్కడ ఉన్నాయి?', lounge: 'దయచేసి చెప్పండి, లాంజ్ ఎక్కడ ఉంది?',
    lostbag: 'నా బ్యాగ్ రాలేదు. బ్యాగేజ్ సర్వీస్ డెస్క్ ఎక్కడ ఉంది?',
  },
};
for (const l of Object.keys(STAFF_MORE)) Object.assign(STAFF[l], STAFF_MORE[l]);
export const STAFF_VOICE = { en: 'en-IN', ar: 'ar-AE', th: 'th-TH', hi: 'hi-IN', te: 'te-IN' };
export const STAFF_DIR = { ar: 'rtl' };

/**
 * Lines for the card: the local language first (big), then English.
 * airportLang: from airports.json (ar / th / en / hi); userLang: the chosen app language.
 */
export function staffLines(intent, airportLang, userLang) {
  const local = airportLang || (short(userLang) === 'en' ? null : short(userLang));
  const lines = [];
  if (local && local !== 'en') lines.push({ lang: local, text: STAFF[local][intent] });
  lines.push({ lang: 'en', text: STAFF.en[intent] });
  return lines;
}
/** What to say aloud: drop the Thai "male/female" particle choice, which reads oddly. */
export const speakable = (text) => text.replace('ครับ/ค่ะ ', '');

function pctText(c, l) {
  const p = Math.abs(c.diffPct).toFixed(1);
  return c.diffPct < 0 ? T[l].pctLess(p) : T[l].pctMore(p);
}
function verdictText(v, l) { return T[l].verdict[v]; }

/** Get a phrase (string or function) for a language. */
export function say(lang, key) {
  const l = short(lang);
  return (T[l] && T[l][key] !== undefined ? T[l][key] : T.en[key]);
}

// ---------- On-screen labels ----------
export const UI = {
  en: {
    tap: 'Tap to speak', listening: "Listening… tap when you're done", speaking: 'Speaking… tap to interrupt', thinking: 'One moment…',
    next: 'Next', repeat: 'Repeat', cantFind: 'Can\'t find it', restart: 'Start over',
    typeHere: 'Or type here…', send: 'Send', youSaid: 'You said', steps: 'Your route', tryTitle: 'Try saying',
    priceTitle: 'Price check', offered: 'They offer', fairAmt: 'Fair amount', midRate: 'Mid-market rate',
    noAirport: 'Airport not set', noVoiceIn: 'Voice input needs Chrome. You can type below instead.',
    noVoiceOut: 'This device has no voice for this language. Read the text on screen.',
    ratesLive: 'Live rates', ratesSample: 'Saved sample rates',
    natural: 'Natural voice', askAny: 'AI understanding', keyNotSet: 'key not set', on: 'on',
    handsFree: 'Hands-free', avoid: 'Usually pricier', best: 'Best option',
    tries: ['Dubai terminal 3, I need currency', 'next', 'can\'t find it', 'They give 1700 dirhams for 500 dollars'],
  },
  hi: {
    tap: 'बोलने के लिए दबाइए', listening: 'सुन रही हूँ… बोल लें तो दबाइए', speaking: 'बोल रही हूँ… रोकने के लिए दबाइए', thinking: 'एक पल…',
    next: 'आगे', repeat: 'दोबारा', cantFind: 'नहीं मिल रहा', restart: 'फिर से शुरू',
    typeHere: 'या यहाँ लिखिए…', send: 'भेजें', youSaid: 'आपने कहा', steps: 'आपका रास्ता', tryTitle: 'ऐसे बोलिए',
    priceTitle: 'रेट जाँच', offered: 'वो दे रहे हैं', fairAmt: 'सही रकम', midRate: 'मिड-मार्केट रेट',
    noAirport: 'एयरपोर्ट नहीं चुना', noVoiceIn: 'आवाज़ से बोलने के लिए क्रोम चाहिए। नीचे लिख भी सकते हैं।',
    noVoiceOut: 'इस डिवाइस में इस भाषा की आवाज़ नहीं है। स्क्रीन पर पढ़िए।',
    ratesLive: 'लाइव रेट', ratesSample: 'सेव किए हुए सैंपल रेट',
    natural: 'नैचुरल आवाज़', askAny: 'AI से समझना', keyNotSet: 'key not set', on: 'चालू',
    handsFree: 'हैंड्स-फ़्री', avoid: 'अक्सर महँगा', best: 'सबसे अच्छा',
    tries: ['dubai terminal teen, paise badalne hain', 'दुबई टर्मिनल ३ पैसे बदलने हैं', 'aage', 'नहीं मिल रहा', '500 dollar ke satrah sau dirham de rahe hain'],
  },
  te: {
    tap: 'మాట్లాడటానికి నొక్కండి', listening: 'వింటున్నాను… అయిపోతే నొక్కండి', speaking: 'చెప్తున్నాను… ఆపడానికి నొక్కండి', thinking: 'ఒక్క క్షణం…',
    next: 'నెక్స్ట్', repeat: 'మళ్ళీ', cantFind: 'దొరకలేదు', restart: 'మళ్ళీ మొదలు',
    typeHere: 'లేదా ఇక్కడ టైప్ చేయండి…', send: 'పంపు', youSaid: 'మీరు అన్నది', steps: 'మీ దారి', tryTitle: 'ఇలా చెప్పండి',
    priceTitle: 'రేటు చెక్', offered: 'వాళ్ళు ఇచ్చేది', fairAmt: 'సరైన మొత్తం', midRate: 'మిడ్-మార్కెట్ రేటు',
    noAirport: 'ఎయిర్‌పోర్ట్ ఎంచుకోలేదు', noVoiceIn: 'వాయిస్‌కి క్రోమ్ కావాలి. కింద టైప్ కూడా చేయవచ్చు.',
    noVoiceOut: 'ఈ డివైస్‌లో ఈ భాషకు వాయిస్ లేదు. స్క్రీన్ మీద చదవండి.',
    ratesLive: 'లైవ్ రేట్లు', ratesSample: 'సేవ్ చేసిన శాంపిల్ రేట్లు',
    natural: 'నేచురల్ వాయిస్', askAny: 'AI అర్థం చేసుకోవడం', keyNotSet: 'key not set', on: 'ఆన్',
    handsFree: 'హ్యాండ్స్-ఫ్రీ', avoid: 'సాధారణంగా ఖరీదు', best: 'మంచి ఎంపిక',
    tries: ['దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి', 'నెక్స్ట్', 'దొరకలేదు', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు'],
  },
};
// Round 2 labels: ask-staff card, destinations, last-checked date
const UI_EXTRA = {
  en: {
    askStaff: 'Ask staff', staffTitle: 'Please show this to airport staff', close: 'Close', readAloud: 'Read aloud',
    dest: { exchange: 'Money exchange', sim: 'SIM card', taxi: 'Taxi', exit: 'Just the way out' }, historyTitle: 'Earlier in this conversation',
    lastChecked: 'Last checked', counter: 'Exchange counter', notMeasured: "Rates here haven't been compared yet. Check the board and ask for the final amount.", pending: 'Details still being checked: ask at the info desk',
    tries: ['Dubai terminal 3, I need currency', 'I want a SIM', 'taxi stand', "I'm lost", 'ask staff', 'They give 1700 dirhams for 500 dollars'],
  },
  hi: {
    askStaff: 'स्टाफ से पूछें', staffTitle: 'यह एयरपोर्ट स्टाफ को दिखाइए', close: 'बंद करें', readAloud: 'सुनाइए',
    dest: { exchange: 'पैसे बदलना', sim: 'सिम कार्ड', taxi: 'टैक्सी', exit: 'बस बाहर का रास्ता' }, historyTitle: 'इस बातचीत में पहले',
    lastChecked: 'आख़िरी जाँच', counter: 'एक्सचेंज काउंटर', notMeasured: 'यहाँ के रेट की तुलना अभी नहीं हुई है। बोर्ड देखिए और फ़ाइनल अमाउंट पूछिए।', pending: 'जानकारी अभी जाँची जा रही है: इन्फ़ॉर्मेशन डेस्क पर पूछिए',
    tries: ['dubai terminal teen, paise badalne hain', 'मुझे सिम चाहिए', 'होटल जाने के लिए टैक्सी', 'पता नहीं कहाँ हूँ', 'स्टाफ से पूछना है', '500 dollar ke satrah sau dirham de rahe hain'],
  },
  te: {
    askStaff: 'స్టాఫ్‌ని అడగండి', staffTitle: 'దయచేసి ఇది ఎయిర్‌పోర్ట్ సిబ్బందికి చూపించండి', close: 'మూసివేయి', readAloud: 'వినిపించు',
    dest: { exchange: 'డబ్బు మార్పిడి', sim: 'సిమ్ కార్డ్', taxi: 'టాక్సీ' , exit: 'బయటకు దారి మాత్రమే' }, historyTitle: 'ఈ సంభాషణలో ఇంతకుముందు',
    lastChecked: 'చివరిగా చెక్ చేసింది', counter: 'ఎక్స్ఛేంజ్ కౌంటర్', notMeasured: 'ఇక్కడి రేట్లు ఇంకా పోల్చి చూడలేదు. బోర్డు చూసి, ఫైనల్ మొత్తం అడగండి.', pending: 'వివరాలు ఇంకా చెక్ చేస్తున్నాం: ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి',
    tries: ['దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి', 'సిమ్ కావాలి', 'హోటల్‌కి టాక్సీ', 'నేను ఎక్కడున్నానో తెలియదు', 'స్టాఫ్‌ని అడగాలి', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు'],
  },
};
for (const l of Object.keys(UI_EXTRA)) Object.assign(UI[l], UI_EXTRA[l]);

// Round 3 labels: tips, save for my trip, slower speech, tap choices, more staff-card topics
const UI_EXTRA3 = {
  en: {
    tipsBtn: 'Money tips', trapsBtn: 'Traps to avoid', saveBtn: 'Save for my trip', saving: 'Saving…',
    saved: (d, r) => `Saved on this phone (${d}): routes, counters, staff cards and rates from ${r}. The buttons work offline; voice needs internet.`,
    saveFailed: 'Could not save. Try again with internet.', install: 'Add to home screen',
    slower: 'Speak slower', yes: 'Yes', no: 'No', ratesSaved: 'Rates saved on this phone', langTipTitle: 'Language help:',
    dest: { metro: 'Metro / train', toilet: 'Toilet', prayer: 'Prayer room', food: 'Food & coffee', shop: 'Shops & duty free', lounge: 'Lounge', lostbag: 'Missing bag', atm: 'ATM', lost: 'Lost', help: 'Help', bus: 'Bus or taxi' },
    tries: ['Dubai terminal 3, I need currency', 'I want a SIM', 'taxi stand', "I'm lost", 'I have a connecting flight', 'I have a forex card', 'They give 1700 dirhams for 500 dollars'],
  },
  hi: {
    tipsBtn: 'पैसों की सलाह', trapsBtn: 'धोखों से बचें', saveBtn: 'यात्रा के लिए सेव करें', saving: 'सेव हो रहा है…',
    saved: (d, r) => `इस फ़ोन पर सेव हो गया (${d}): रास्ते, काउंटर, स्टाफ कार्ड और ${r} के रेट। बटन बिना इंटरनेट के चलेंगे; आवाज़ के लिए इंटरनेट चाहिए।`,
    saveFailed: 'सेव नहीं हुआ। इंटरनेट के साथ फिर कोशिश कीजिए।', install: 'होम स्क्रीन पर जोड़ें',
    slower: 'धीरे बोलिए', yes: 'हाँ', no: 'नहीं', ratesSaved: 'इस फ़ोन पर सेव किए रेट', langTipTitle: 'भाषा में मदद:',
    dest: { metro: 'मेट्रो / ट्रेन', toilet: 'शौचालय', prayer: 'प्रार्थना कक्ष', food: 'खाना / कॉफ़ी', shop: 'दुकानें', lounge: 'लाउंज', lostbag: 'सामान नहीं आया', atm: 'एटीएम', lost: 'रास्ता भूल गए', help: 'मदद', bus: 'बस या टैक्सी' },
    tries: ['dubai terminal teen, paise badalne hain', 'मुझे सिम चाहिए', 'होटल जाने के लिए टैक्सी', 'पता नहीं कहाँ हूँ', 'मेरी कनेक्टिंग फ़्लाइट है', 'मेरे पास फॉरेक्स कार्ड है', '500 dollar ke satrah sau dirham de rahe hain'],
  },
  te: {
    tipsBtn: 'డబ్బు చిట్కాలు', trapsBtn: 'మోసాలు జాగ్రత్త', saveBtn: 'ప్రయాణం కోసం సేవ్ చేయి', saving: 'సేవ్ అవుతోంది…',
    saved: (d, r) => `ఈ ఫోన్‌లో సేవ్ అయింది (${d}): దారులు, కౌంటర్లు, స్టాఫ్ కార్డ్‌లు, ${r} రేట్లు. బటన్లు ఇంటర్నెట్ లేకుండా పనిచేస్తాయి; వాయిస్‌కి ఇంటర్నెట్ కావాలి.`,
    saveFailed: 'సేవ్ కాలేదు. ఇంటర్నెట్‌తో మళ్ళీ ప్రయత్నించండి.', install: 'హోమ్ స్క్రీన్‌కి జోడించు',
    slower: 'నెమ్మదిగా మాట్లాడు', yes: 'అవును', no: 'కాదు', ratesSaved: 'ఈ ఫోన్‌లో సేవ్ చేసిన రేట్లు', langTipTitle: 'భాషా సహాయం:',
    dest: { metro: 'మెట్రో / రైలు', toilet: 'టాయిలెట్', prayer: 'ప్రార్థన గది', food: 'భోజనం / కాఫీ', shop: 'షాపులు', lounge: 'లాంజ్', lostbag: 'బ్యాగ్ రాలేదు', atm: 'ఏటీఎం', lost: 'దారి తప్పాను', help: 'సహాయం', bus: 'బస్ లేదా టాక్సీ' },
    tries: ['దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి', 'సిమ్ కావాలి', 'హోటల్‌కి టాక్సీ', 'నేను ఎక్కడున్నానో తెలియదు', 'నాకు కనెక్టింగ్ ఫ్లైట్ ఉంది', 'నా దగ్గర ఫారెక్స్ కార్డ్ ఉంది', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు'],
  },
};
for (const l of Object.keys(UI_EXTRA3)) {
  const { dest, ...rest } = UI_EXTRA3[l];
  Object.assign(UI[l], rest);
  UI[l].dest = { ...UI[l].dest, ...dest };
}
export const ui = (lang) => UI[short(lang)] || UI.en;
