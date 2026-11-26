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
    metro: 'Excuse me, where is the metro or train?', toilet: 'Excuse me, where is the toilet?',
    prayer: 'Excuse me, where is the prayer room?', food: 'Excuse me, where can I get food or coffee?',
    shop: 'Excuse me, where are the shops and duty free?', lounge: 'Excuse me, where is the lounge?',
    lostbag: "Excuse me, my bag hasn't arrived. Where is the baggage services desk?",
  },
  ar: {
    metro: 'من فضلك، أين المترو أو القطار؟', toilet: 'من فضلك، أين دورة المياه؟',
    prayer: 'من فضلك، أين المصلى؟', food: 'من فضلك، أين يمكنني شراء طعام أو قهوة؟',
    shop: 'من فضلك، أين المحلات والسوق الحرة؟', lounge: 'من فضلك، أين صالة الانتظار؟',
    lostbag: 'من فضلك، حقيبتي لم تصل. أين مكتب خدمات الأمتعة؟',
  },
  th: {
    metro: 'ขอโทษครับ/ค่ะ รถไฟฟ้าอยู่ที่ไหน', toilet: 'ขอโทษครับ/ค่ะ ห้องน้ำอยู่ที่ไหน',
    prayer: 'ขอโทษครับ/ค่ะ ห้องละหมาดอยู่ที่ไหน', food: 'ขอโทษครับ/ค่ะ ร้านอาหารหรือร้านกาแฟอยู่ที่ไหน',
    shop: 'ขอโทษครับ/ค่ะ ร้านค้าและดิวตี้ฟรีอยู่ที่ไหน', lounge: 'ขอโทษครับ/ค่ะ เลานจ์อยู่ที่ไหน',
    lostbag: 'ขอโทษครับ/ค่ะ กระเป๋าของฉันไม่มา ติดต่อแผนกสัมภาระได้ที่ไหน',
  },
  hi: {
    metro: 'कृपया बताइए, मेट्रो या ट्रेन कहाँ है?', toilet: 'कृपया बताइए, शौचालय कहाँ है?',
    prayer: 'कृपया बताइए, प्रार्थना कक्ष कहाँ है?', food: 'कृपया बताइए, खाना या कॉफ़ी कहाँ मिलेगी?',
    shop: 'कृपया बताइए, दुकानें और ड्यूटी फ़्री कहाँ हैं?', lounge: 'कृपया बताइए, लाउंज कहाँ है?',
    lostbag: 'मेरा सामान नहीं आया। बैगेज सर्विस डेस्क कहाँ है?',
  },
  te: {
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

// Round 3 labels: tips, save for my trip, slower speech, tap choices, more staff-card topics
const UI_EXTRA3 = {
  en: {
    tipsBtn: 'Money tips', trapsBtn: 'Traps to avoid', saveBtn: 'Save for my trip', saving: 'Saving…',
    saved: (d, r) => `Saved on this phone (${d}): routes, counters, staff cards and rates from ${r}. The buttons work offline; voice needs internet.`,
    saveFailed: 'Could not save. Try again with internet.', install: 'Add to home screen',
    slower: 'Speak slower', yes: 'Yes', no: 'No', ratesSaved: 'Rates saved on this phone', langTipTitle: 'Language help:',
    dest: { metro: 'Metro / train', toilet: 'Toilet', prayer: 'Prayer room', food: 'Food & coffee', shop: 'Shops & duty free', lounge: 'Lounge', lostbag: 'Missing bag' },
    tries: ['Dubai terminal 3, I need currency', 'I want a SIM', 'taxi stand', "I'm lost", 'I have a connecting flight', 'I have a forex card', 'They give 1700 dirhams for 500 dollars'],
  },
  hi: {
    tipsBtn: 'पैसों की सलाह', trapsBtn: 'धोखों से बचें', saveBtn: 'यात्रा के लिए सेव करें', saving: 'सेव हो रहा है…',
    saved: (d, r) => `इस फ़ोन पर सेव हो गया (${d}): रास्ते, काउंटर, स्टाफ कार्ड और ${r} के रेट। बटन बिना इंटरनेट के चलेंगे; आवाज़ के लिए इंटरनेट चाहिए।`,
    saveFailed: 'सेव नहीं हुआ। इंटरनेट के साथ फिर कोशिश कीजिए।', install: 'होम स्क्रीन पर जोड़ें',
    slower: 'धीरे बोलिए', yes: 'हाँ', no: 'नहीं', ratesSaved: 'इस फ़ोन पर सेव किए रेट', langTipTitle: 'भाषा में मदद:',
    dest: { metro: 'मेट्रो / ट्रेन', toilet: 'शौचालय', prayer: 'प्रार्थना कक्ष', food: 'खाना / कॉफ़ी', shop: 'दुकानें', lounge: 'लाउंज', lostbag: 'सामान नहीं आया' },
    tries: ['dubai terminal teen, paise badalne hain', 'मुझे सिम चाहिए', 'होटल जाने के लिए टैक्सी', 'पता नहीं कहाँ हूँ', 'मेरी कनेक्टिंग फ़्लाइट है', 'मेरे पास फॉरेक्स कार्ड है', '500 dollar ke satrah sau dirham de rahe hain'],
  },
  te: {
    tipsBtn: 'డబ్బు చిట్కాలు', trapsBtn: 'మోసాలు జాగ్రత్త', saveBtn: 'ప్రయాణం కోసం సేవ్ చేయి', saving: 'సేవ్ అవుతోంది…',
    saved: (d, r) => `ఈ ఫోన్‌లో సేవ్ అయింది (${d}): దారులు, కౌంటర్లు, స్టాఫ్ కార్డ్‌లు, ${r} రేట్లు. బటన్లు ఇంటర్నెట్ లేకుండా పనిచేస్తాయి; వాయిస్‌కి ఇంటర్నెట్ కావాలి.`,
    saveFailed: 'సేవ్ కాలేదు. ఇంటర్నెట్‌తో మళ్ళీ ప్రయత్నించండి.', install: 'హోమ్ స్క్రీన్‌కి జోడించు',
    slower: 'నెమ్మదిగా మాట్లాడు', yes: 'అవును', no: 'కాదు', ratesSaved: 'ఈ ఫోన్‌లో సేవ్ చేసిన రేట్లు', langTipTitle: 'భాషా సహాయం:',
    dest: { metro: 'మెట్రో / రైలు', toilet: 'టాయిలెట్', prayer: 'ప్రార్థన గది', food: 'భోజనం / కాఫీ', shop: 'షాపులు', lounge: 'లాంజ్', lostbag: 'బ్యాగ్ రాలేదు' },
    tries: ['దుబాయ్ టెర్మినల్ 3, డబ్బు మార్చాలి', 'సిమ్ కావాలి', 'హోటల్‌కి టాక్సీ', 'నేను ఎక్కడున్నానో తెలియదు', 'నాకు కనెక్టింగ్ ఫ్లైట్ ఉంది', 'నా దగ్గర ఫారెక్స్ కార్డ్ ఉంది', '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు'],
  },
};
for (const l of Object.keys(UI_EXTRA3)) {
  const { dest, ...rest } = UI_EXTRA3[l];
  Object.assign(UI[l], rest);
  UI[l].dest = { ...UI[l].dest, ...dest };
}
export const ui = (lang) => UI[short(lang)] || UI.en;
