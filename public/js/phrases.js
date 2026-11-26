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
    intro: (r, lang) => `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. Best option: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. I'll take you there step by step.`,
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
    intro: (r, lang) => `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। सबसे अच्छा विकल्प: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}। मैं आपको एक-एक कदम बताऊँगी।`,
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
    intro: (r, lang) => `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. మంచి ఎంపిక: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. ఒక్కో అడుగు చెప్తాను.`,
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
  en: { exchange: 'exchange counter', sim: 'SIM card counter', taxi: 'taxi stand' },
  hi: { exchange: 'एक्सचेंज काउंटर', sim: 'सिम कार्ड काउंटर', taxi: 'टैक्सी स्टैंड' },
  te: { exchange: 'ఎక్స్ఛేంజ్ కౌంటర్', sim: 'సిమ్ కార్డ్ కౌంటర్', taxi: 'టాక్సీ స్టాండ్' },
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
      ? `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. Best option: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. I'll take you there step by step.`
      : `${terminalLabel(r.terminal, lang)}, ${pick(r.name, lang)}. Route to the ${DEST.en[r.dest]}. I'll take you there step by step.`,
    done: (dest) => ({
      exchange: "You're there. Ask for the final amount before you pay. Safe travels!",
      sim: "You're at the SIM counters. Check the price and the data before you pay. Safe travels!",
      taxi: "You're at the taxi stand. Keep your hotel address handy. Safe travels!",
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
      ? `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। सबसे अच्छा विकल्प: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}। मैं आपको एक-एक कदम बताऊँगी।`
      : `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}। ${DEST.hi[r.dest]} का रास्ता। मैं आपको एक-एक कदम बताऊँगी।`,
    done: (dest) => ({
      exchange: 'आप पहुँच गए। पैसे देने से पहले फ़ाइनल अमाउंट पूछिए। शुभ यात्रा!',
      sim: 'आप सिम काउंटर पर पहुँच गए। पैसे देने से पहले दाम और डेटा पूछ लीजिए। शुभ यात्रा!',
      taxi: 'आप टैक्सी स्टैंड पर पहुँच गए। होटल का पता पास रखिए। शुभ यात्रा!',
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
      ? `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. మంచి ఎంపిక: ${pick(r.counter.name, lang)}, ${pick(r.counter.location, lang)}. ఒక్కో అడుగు చెప్తాను.`
      : `${pick(r.name, lang)}, ${terminalLabel(r.terminal, lang)}. ${DEST.te[r.dest]}కి దారి. ఒక్కో అడుగు చెప్తాను.`,
    done: (dest) => ({
      exchange: 'మీరు చేరుకున్నారు. డబ్బు ఇచ్చే ముందు ఫైనల్ మొత్తం అడగండి. శుభ ప్రయాణం!',
      sim: 'మీరు సిమ్ కౌంటర్ దగ్గరికి చేరుకున్నారు. డబ్బు ఇచ్చే ముందు ధర, డేటా అడగండి. శుభ ప్రయాణం!',
      taxi: 'మీరు టాక్సీ స్టాండ్ దగ్గరికి చేరుకున్నారు. హోటల్ అడ్రస్ దగ్గర ఉంచుకోండి. శుభ ప్రయాణం!',
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
    tap: 'Tap to speak', listening: 'Listening…', speaking: 'Speaking… tap to interrupt', thinking: 'One moment…',
    next: 'Next', repeat: 'Repeat', cantFind: 'Can\'t find it', restart: 'Start over',
    typeHere: 'Or type here…', send: 'Send', youSaid: 'You said', steps: 'Your route', tryTitle: 'Try saying',
    priceTitle: 'Price check', offered: 'They offer', fairAmt: 'Fair amount', midRate: 'Mid-market rate',
    noAirport: 'Airport not set', noVoiceIn: 'Voice input needs Chrome. You can type below instead.',
    noVoiceOut: 'This device has no voice for this language. Read the text on screen.',
    ratesLive: 'Live rates', ratesSample: 'Saved sample rates',
    natural: 'Natural voice', askAny: 'Ask anything', keyNotSet: 'key not set', on: 'on',
    handsFree: 'Hands-free', avoid: 'Usually pricier', best: 'Best option',
    tries: ['Dubai terminal 3, I need currency', 'next', 'can\'t find it', 'They give 1700 dirhams for 500 dollars'],
  },
  hi: {
    tap: 'बोलने के लिए दबाइए', listening: 'सुन रही हूँ…', speaking: 'बोल रही हूँ… रोकने के लिए दबाइए', thinking: 'एक पल…',
    next: 'आगे', repeat: 'दोबारा', cantFind: 'नहीं मिल रहा', restart: 'फिर से शुरू',
    typeHere: 'या यहाँ लिखिए…', send: 'भेजें', youSaid: 'आपने कहा', steps: 'आपका रास्ता', tryTitle: 'ऐसे बोलिए',
    priceTitle: 'रेट जाँच', offered: 'वो दे रहे हैं', fairAmt: 'सही रकम', midRate: 'मिड-मार्केट रेट',
    noAirport: 'एयरपोर्ट नहीं चुना', noVoiceIn: 'आवाज़ से बोलने के लिए क्रोम चाहिए। नीचे लिख भी सकते हैं।',
    noVoiceOut: 'इस डिवाइस में इस भाषा की आवाज़ नहीं है। स्क्रीन पर पढ़िए।',
    ratesLive: 'लाइव रेट', ratesSample: 'सेव किए हुए सैंपल रेट',
    natural: 'नैचुरल आवाज़', askAny: 'कुछ भी पूछिए', keyNotSet: 'key not set', on: 'चालू',
    handsFree: 'हैंड्स-फ़्री', avoid: 'अक्सर महँगा', best: 'सबसे अच्छा',
    tries: ['dubai terminal teen, paise badalne hain', 'दुबई टर्मिनल ३ पैसे बदलने हैं', 'aage', 'नहीं मिल रहा', '500 dollar ke satrah sau dirham de rahe hain'],
  },
  te: {
    tap: 'మాట్లాడటానికి నొక్కండి', listening: 'వింటున్నాను…', speaking: 'చెప్తున్నాను… ఆపడానికి నొక్కండి', thinking: 'ఒక్క క్షణం…',
    next: 'నెక్స్ట్', repeat: 'మళ్ళీ', cantFind: 'దొరకలేదు', restart: 'మళ్ళీ మొదలు',
    typeHere: 'లేదా ఇక్కడ టైప్ చేయండి…', send: 'పంపు', youSaid: 'మీరు అన్నది', steps: 'మీ దారి', tryTitle: 'ఇలా చెప్పండి',
    priceTitle: 'రేటు చెక్', offered: 'వాళ్ళు ఇచ్చేది', fairAmt: 'సరైన మొత్తం', midRate: 'మిడ్-మార్కెట్ రేటు',
    noAirport: 'ఎయిర్‌పోర్ట్ ఎంచుకోలేదు', noVoiceIn: 'వాయిస్‌కి క్రోమ్ కావాలి. కింద టైప్ కూడా చేయవచ్చు.',
    noVoiceOut: 'ఈ డివైస్‌లో ఈ భాషకు వాయిస్ లేదు. స్క్రీన్ మీద చదవండి.',
    ratesLive: 'లైవ్ రేట్లు', ratesSample: 'సేవ్ చేసిన శాంపిల్ రేట్లు',
    natural: 'నేచురల్ వాయిస్', askAny: 'ఏదైనా అడగండి', keyNotSet: 'key not set', on: 'ఆన్',
    handsFree: 'హ్యాండ్స్-ఫ్రీ', avoid: 'సాధారణంగా ఖరీదు', best: 'మంచి ఎంపిక',
    tries: ['దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి', 'నెక్స్ట్', 'దొరకలేదు', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు'],
  },
};
// Round 2 labels: ask-staff card, destinations, last-checked date
const UI_EXTRA = {
  en: {
    askStaff: 'Ask staff', staffTitle: 'Please show this to airport staff', close: 'Close', readAloud: 'Read aloud',
    dest: { exchange: 'Money exchange', sim: 'SIM card', taxi: 'Taxi' },
    lastChecked: 'Last checked', pending: 'Details still being checked: ask at the info desk',
    tries: ['Dubai terminal 3, I need currency', 'I want a SIM', 'taxi stand', "I'm lost", 'ask staff', 'They give 1700 dirhams for 500 dollars'],
  },
  hi: {
    askStaff: 'स्टाफ से पूछें', staffTitle: 'यह एयरपोर्ट स्टाफ को दिखाइए', close: 'बंद करें', readAloud: 'सुनाइए',
    dest: { exchange: 'पैसे बदलना', sim: 'सिम कार्ड', taxi: 'टैक्सी' },
    lastChecked: 'आख़िरी जाँच', pending: 'जानकारी अभी जाँची जा रही है: इन्फ़ॉर्मेशन डेस्क पर पूछिए',
    tries: ['dubai terminal teen, paise badalne hain', 'मुझे सिम चाहिए', 'होटल जाने के लिए टैक्सी', 'पता नहीं कहाँ हूँ', 'स्टाफ से पूछना है', '500 dollar ke satrah sau dirham de rahe hain'],
  },
  te: {
    askStaff: 'స్టాఫ్‌ని అడగండి', staffTitle: 'దయచేసి ఇది ఎయిర్‌పోర్ట్ సిబ్బందికి చూపించండి', close: 'మూసివేయి', readAloud: 'వినిపించు',
    dest: { exchange: 'డబ్బు మార్పిడి', sim: 'సిమ్ కార్డ్', taxi: 'టాక్సీ' },
    lastChecked: 'చివరిగా చెక్ చేసింది', pending: 'వివరాలు ఇంకా చెక్ చేస్తున్నాం: ఇన్ఫర్మేషన్ డెస్క్‌లో అడగండి',
    tries: ['దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి', 'సిమ్ కావాలి', 'హోటల్‌కి టాక్సీ', 'నేను ఎక్కడున్నానో తెలియదు', 'స్టాఫ్‌ని అడగాలి', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు'],
  },
};
for (const l of Object.keys(UI_EXTRA)) Object.assign(UI[l], UI_EXTRA[l]);
export const ui = (lang) => UI[short(lang)] || UI.en;
