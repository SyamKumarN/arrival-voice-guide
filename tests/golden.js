// golden.js — 30 traveller questions × English, Hindi, Telugu, end to end.
// Each case: a short setup conversation, then the question; the check is on behaviour
// (category, language of the reply, safety rules), not on exact wording.
// Run with the rules in `npm test`; scripts can run the same cases through the live AI.

const DUBAI_ROUTE = { en: ['Dubai terminal 3 change money', 'yes'], hi: ['दुबई टर्मिनल 3 पैसे बदलने हैं', 'हाँ'], te: ['దుబాయ్ టెర్మినల్ 3 డబ్బు మార్చాలి', 'అవును'] };
const SIN_PLACE = { en: ['Singapore terminal 3'], hi: ['सिंगापुर टर्मिनल 3'], te: ['సింగపూర్ టెర్మినల్ 3'] };
const DUBAI_PLACE = { en: ['Dubai terminal 1'], hi: ['दुबई टर्मिनल 1'], te: ['దుబాయ్ టెర్మినల్ 1'] };

const isRoute = (s) => s.mode === 'route';
const noRoute = (s) => s.mode !== 'route';
const staff = (r, intent) => r.staff && (!intent || r.staff.intent === intent);

export const GOLDEN = [
  { id: 1, about: 'Landed, airport only: ask the terminal, no route', setup: {},
    q: { en: 'I landed in Dubai', hi: 'मैं दुबई में उतरा हूँ', te: 'నేను దుబాయ్‌లో దిగాను' },
    ok: (r, s) => r.kind === 'ask' && s.expecting === 'terminal' && noRoute(s) && !s.dest },
  { id: 2, about: 'Greeting', setup: {}, q: { en: 'hi', hi: 'नमस्ते', te: 'హాయ్' }, ok: (r, s) => r.kind === 'ask' && s.expecting === 'airport' },
  { id: 3, about: '"Dubai, T3, yes": ask what they need, never assume exchange', setup: { en: ['Dubai'], hi: ['दुबई'], te: ['దుబాయ్'] },
    q: { en: 'T3, yes', hi: 'T3, हाँ', te: 'T3, అవును' }, ok: (r, s) => s.expecting === 'need' && noRoute(s) && !s.dest },
  { id: 4, about: 'What should I do first? → overview', setup: SIN_PLACE,
    q: { en: 'What should I do first?', hi: 'पहले क्या करूँ?', te: 'ముందు ఏం చేయాలి?' }, ok: (r, s) => r.topic === 'overview' && noRoute(s) },
  { id: 5, about: 'Chooses exchange after the need question → route', setup: SIN_PLACE,
    q: { en: 'I need to change money', hi: 'पैसे बदलने हैं', te: 'డబ్బు మార్చాలి' }, ok: (r, s) => isRoute(s) && s.dest === 'exchange' },
  { id: 6, about: 'Chooses SIM (Dubai has a SIM route)', setup: DUBAI_PLACE,
    q: { en: 'I want a SIM card', hi: 'मुझे सिम चाहिए', te: 'సిమ్ కావాలి' }, ok: (r, s) => isRoute(s) && s.dest === 'sim' },
  { id: 7, about: 'Taxi cost → no fares, how to pay fairly, never a route', setup: SIN_PLACE,
    q: { en: 'How much is a taxi?', hi: 'टैक्सी का किराया कितना है?', te: 'టాక్సీ ఎంత అవుతుంది?' }, ok: (r, s) => r.topic === 'taxicost' && noRoute(s) },
  { id: 8, about: 'Just guide me out → the way-out route', setup: SIN_PLACE,
    q: { en: 'Just guide me out of the airport', hi: 'बस बाहर का रास्ता बताइए', te: 'బయటకు దారి చూపించండి' }, ok: (r, s) => isRoute(s) && s.dest === 'exit' },
  { id: 9, about: 'Lost child → emergency first, help card, no airport question', setup: {},
    q: { en: 'My child is lost', hi: 'मेरा बच्चा खो गया', te: 'మా పాప కనిపించట్లేదు' }, ok: (r) => r.topic === 'emergency' && staff(r, 'help') },
  { id: 10, about: 'Feels unsafe mid-route → safety reply + card, route kept', setup: DUBAI_ROUTE,
    q: { en: 'I feel unsafe', hi: 'मुझे डर लग रहा है', te: 'నాకు భయంగా ఉంది' }, ok: (r, s) => r.topic === 'unsafe' && staff(r, 'help') && isRoute(s) },
  { id: 11, about: 'Medical help → emergency', setup: SIN_PLACE,
    q: { en: 'I need a doctor', hi: 'मुझे डॉक्टर चाहिए', te: 'నాకు డాక్టర్ కావాలి' }, ok: (r) => r.topic === 'emergency' && staff(r, 'help') },
  { id: 12, about: 'Robbed → emergency', setup: {},
    q: { en: 'My bag was stolen', hi: 'मेरा बैग चोरी हो गया', te: 'నా బ్యాగ్ దొంగిలించారు' }, ok: (r) => r.topic === 'emergency' && staff(r, 'help') },
  { id: 13, about: 'Buy a charger → shops card (rules) or short guarded answer (AI), never a location', setup: DUBAI_PLACE,
    q: { en: 'Where can I buy a phone charger?', hi: 'फ़ोन चार्जर कहाँ से खरीदूँ?', te: 'ఫోన్ ఛార్జర్ ఎక్కడ కొనాలి?' },
    ok: (r) => (r.kind === 'offtopic' || r.topic === 'outofscope') && !/\d/.test(r.text) },
  { id: 14, about: 'Bringing mangoes → no customs rule stated; staff or official source', setup: SIN_PLACE,
    q: { en: 'Can I bring mangoes into Singapore?', hi: 'क्या मैं सिंगापुर में आम ला सकता हूँ?', te: 'సింగపూర్‌కి మామిడి పండ్లు తేవచ్చా?' },
    ok: (r) => (r.kind === 'unknown' || r.topic === 'outofscope' || r.kind === 'offtopic' || r.kind === 'help') && !/\ballowed\b|\bnot allowed\b|\d/.test(r.text) },
  { id: 15, about: 'Translate "I need help" into Arabic → our checked help card', setup: {},
    q: { en: "Translate 'I need help' into Arabic", hi: "'मुझे मदद चाहिए' अरबी में अनुवाद करो", te: "'నాకు సహాయం కావాలి' అరబిక్‌లో అనువాదం చేయండి" },
    ok: (r) => r.topic === 'translate' && staff(r) && r.staff.airport === 'DXB' },
  { id: 16, about: 'How many dirhams for 500 dollars → fair amount', setup: DUBAI_PLACE,
    q: { en: 'How many dirhams for 500 dollars?', hi: '500 डॉलर के कितने दिरहम मिलेंगे?', te: '500 డాలర్లకు ఎన్ని దిర్హామ్‌లు వస్తాయి?' }, ok: (r) => r.kind === 'amount' },
  { id: 17, about: 'Price check with both amounts', setup: DUBAI_PLACE,
    q: { en: 'They give 1700 dirhams for 500 dollars', hi: '500 डॉलर के 1700 दिरहम दे रहे हैं', te: '500 డాలర్లకు 1700 దిర్హామ్‌లు ఇస్తున్నారు' }, ok: (r) => r.kind === 'price' },
  { id: 18, about: 'Claimed my bags → past the baggage step', setup: DUBAI_ROUTE,
    q: { en: "I've claimed my bags", hi: 'मैंने बैग ले लिया', te: 'బ్యాగ్ తీసుకున్నాను' }, ok: (r, s) => isRoute(s) && s.step === 2 },
  { id: 19, about: 'Two routes after the bags → the customs / Exit sign, not immigration',
    setup: { en: [...DUBAI_ROUTE.en, "I've claimed my bags"], hi: [...DUBAI_ROUTE.hi, 'मैंने बैग ले लिया'], te: [...DUBAI_ROUTE.te, 'బ్యాగ్ తీసుకున్నాను'] },
    q: { en: "There are two routes, I'm confused", hi: 'दो रास्ते हैं, समझ नहीं आ रहा', te: 'రెండు మార్గాలు ఉన్నాయి, అర్థం కావట్లేదు' },
    ok: (r, s) => s.step === 2 && r.text.includes('"Exit"') && !r.text.includes('Immigration"') },
  { id: 20, about: "I'm in the arrival hall → jump to that step", setup: DUBAI_ROUTE,
    q: { en: "I'm in the arrival hall", hi: 'मैं अराइवल हॉल में हूँ', te: 'నేను అరైవల్ హాల్‌లో ఉన్నాను' }, ok: (r, s) => isRoute(s) && s.step === 3 },
  { id: 21, about: 'Where is the ATM → place answer (data or safe), not tips', setup: DUBAI_ROUTE,
    q: { en: 'Where is the ATM?', hi: 'एटीएम कहाँ है?', te: 'ఏటీఎం ఎక్కడ?' }, ok: (r) => r.topic === 'atmwhere' },
  { id: 22, about: 'Wi-Fi not working', setup: DUBAI_ROUTE, q: { en: 'Wi-Fi is not working', hi: 'वाईफाई नहीं चल रहा', te: 'Wi-Fi పనిచేయట్లేదు' }, ok: (r) => r.topic === 'wifi' },
  { id: 23, about: 'Card declined', setup: DUBAI_ROUTE, q: { en: 'My card was declined', hi: 'कार्ड नहीं चल रहा', te: 'కార్డు పని చేయట్లేదు' }, ok: (r) => r.topic === 'carddecline' },
  { id: 24, about: 'Lost passport', setup: {}, q: { en: 'I lost my passport', hi: 'मेरा पासपोर्ट खो गया', te: 'నా పాస్‌పోర్ట్ పోయింది' }, ok: (r) => r.topic === 'lostitem' },
  { id: 25, about: 'Where am I → lost flow', setup: {}, q: { en: 'Where am I?', hi: 'मैं कहाँ हूँ?', te: 'నేను ఎక్కడ ఉన్నాను?' }, ok: (r, s) => r.kind === 'ask' && s.lost },
  { id: 26, about: 'Which exchange counters are here', setup: SIN_PLACE,
    q: { en: 'Which exchange counters are here?', hi: 'यहाँ कौन से एक्सचेंज काउंटर हैं?', te: 'ఇక్కడ ఏ కౌంటర్లు ఉన్నాయి?' }, ok: (r) => r.topic === 'counters' },
  { id: 27, about: 'Open at night (Dubai T1: Al Ansari listed 24 hours)', setup: DUBAI_PLACE,
    q: { en: 'Is any counter open at night?', hi: 'रात में काउंटर खुला है क्या?', te: 'రాత్రి కౌంటర్ ఓపెన్ ఉందా?' }, ok: (r) => r.topic === 'latenight' },
  { id: 28, about: 'Visa → no rules stated, official source', setup: {}, q: { en: 'Do I need a visa?', hi: 'क्या मुझे वीज़ा चाहिए?', te: 'వీసా కావాలా?' }, ok: (r) => r.topic === 'visa' },
  { id: 29, about: 'Toilet → staff card, no invented place', setup: DUBAI_ROUTE,
    q: { en: 'Where is the toilet?', hi: 'टॉयलेट कहाँ है?', te: 'టాయిలెట్ ఎక్కడ?' }, ok: (r, s) => r.kind === 'offtopic' && staff(r, 'toilet') && isRoute(s) },
  { id: 30, about: 'Switch language mid-route: reply in the new language, same airport and step', setup: DUBAI_ROUTE, switchLang: true,
    q: { en: 'ఏటీఎం ఎక్కడ?', hi: 'where is the ATM?', te: 'एटीएम कहाँ है?' },
    ok: (r, s, lang) => r.topic === 'atmwhere' && s.airport === 'DXB' && isRoute(s) && s.lang === ({ en: 'te-IN', hi: 'en-IN', te: 'hi-IN' })[lang] },
  // ---- Added after the 30: out-of-scope, mid-route changes, remembered amounts, Hinglish ----
  { id: 31, about: 'Lounge to sleep in → staff card or short checked answer; no place, hours or price', setup: DUBAI_PLACE,
    q: { en: 'Is there a lounge I can sleep in?', hi: 'क्या कोई लाउंज है जहाँ मैं सो सकूँ?', te: 'నేను నిద్రపోవడానికి లాంజ్ ఉందా?' },
    ok: (r, s) => (r.kind === 'offtopic' || r.topic === 'outofscope') && !/\d/.test(r.text) && noRoute(s) },
  { id: 32, about: 'Weather in Bangkok → out of scope, not a place answer or a route', setup: {},
    q: { en: "What's the weather in Bangkok?", hi: 'बैंकॉक में मौसम कैसा है?', te: 'బ్యాంకాక్‌లో వాతావరణం ఎలా ఉంది?' },
    ok: (r, s) => (r.topic === 'outofscope' || r.kind === 'unknown' || r.kind === 'help') && s.expecting !== 'need' && noRoute(s) && !/\d/.test(r.text) },
  { id: 33, about: 'Book a hotel → out of scope (no booking), nothing invented', setup: DUBAI_PLACE,
    q: { en: 'Book me a hotel near the airport', hi: 'एयरपोर्ट के पास होटल बुक कर दो', te: 'ఎయిర్‌పోర్ట్ దగ్గర హోటల్ బుక్ చేయండి' },
    ok: (r, s) => (r.topic === 'hotelbook' || r.topic === 'outofscope') && noRoute(s) && !/\d/.test(r.text) },
  { id: 34, about: 'Best restaurant in Dubai → food card or short checked answer; no names or numbers', setup: {},
    q: { en: 'Which is the best restaurant in Dubai?', hi: 'दुबई में सबसे अच्छा रेस्टोरेंट कौन सा है?', te: 'దుబాయ్‌లో బెస్ట్ రెస్టారెంట్ ఏది?' },
    ok: (r, s) => (r.kind === 'offtopic' || r.topic === 'outofscope') && noRoute(s) && !/\d/.test(r.text) },
  { id: 35, about: 'Pattaya from Bangkok airport → no invented route or fare', setup: {},
    q: { en: 'How do I get to Pattaya from Bangkok airport?', hi: 'बैंकॉक एयरपोर्ट से पटाया कैसे जाऊँ?', te: 'బ్యాంకాక్ ఎయిర్‌పోర్ట్ నుంచి పట్టాయాకి ఎలా వెళ్ళాలి?' },
    ok: (r, s) => noRoute(s) && s.expecting !== 'need' && !/\d/.test(r.text) && (r.topic === 'onward' || r.topic === 'outofscope') && !s.airport },
  { id: 36, about: 'Visa fee for Thailand → no fee stated, official source', setup: {},
    q: { en: "What's the visa fee for Thailand?", hi: 'थाईलैंड का वीज़ा फ़ीस कितना है?', te: 'థాయ్‌లాండ్ వీసా ఫీజు ఎంత?' },
    ok: (r) => (r.topic === 'visa' || r.topic === 'outofscope') && !/\d/.test(r.text) },
  { id: 37, about: 'Mid exchange route: "Wait, I want a SIM first" → SIM route', setup: DUBAI_ROUTE,
    q: { en: 'Wait, I want a SIM first', hi: 'रुको, पहले मुझे सिम चाहिए', te: 'ఆగండి, ముందు సిమ్ కావాలి' },
    ok: (r, s) => isRoute(s) && s.dest === 'sim' && s.airport === 'DXB' },
  { id: 38, about: '…then "back to exchange" → exchange route again, same place',
    setup: { en: [...DUBAI_ROUTE.en, 'Wait, I want a SIM first'], hi: [...DUBAI_ROUTE.hi, 'रुको, पहले मुझे सिम चाहिए'], te: [...DUBAI_ROUTE.te, 'ఆగండి, ముందు సిమ్ కావాలి'] },
    q: { en: 'back to exchange', hi: 'वापस पैसे बदलने पर चलो', te: 'మళ్ళీ డబ్బు మార్పిడికి వెళ్దాం' },
    ok: (r, s) => isRoute(s) && s.dest === 'exchange' && s.airport === 'DXB' && s.terminal === 'T3' },
  { id: 39, about: '"500 dollars" → "they\'re giving 1,750" → "is that okay?" → a verdict on 1,750 for 500',
    setup: { en: [...DUBAI_PLACE.en, '500 dollars', "they're giving 1,750"], hi: [...DUBAI_PLACE.hi, '500 डॉलर', 'वो 1,750 दे रहे हैं'], te: [...DUBAI_PLACE.te, '500 డాలర్లు', 'వాళ్ళు 1,750 ఇస్తున్నారు'] },
    q: { en: 'is that okay?', hi: 'क्या यह ठीक है?', te: 'అది సరైనదేనా?' },
    ok: (r) => r.kind === 'price' || (r.text.includes('1,750') && r.text.includes('500')) },
  { id: 40, about: 'Hinglish "Bhai Dubai T3 mein paise kahan change karun, jaldi batao" → Dubai T3 exchange', setup: {},
    q: { en: 'Bro, where do I change money at Dubai T3? Quick', hi: 'Bhai Dubai T3 mein paise kahan change karun, jaldi batao', te: 'అన్నా దుబాయ్ T3 లో డబ్బు ఎక్కడ మార్చాలి, తొందరగా చెప్పు' },
    ok: (r, s) => s.airport === 'DXB' && s.terminal === 'T3' && s.dest === 'exchange' && (r.kind === 'confirm' || isRoute(s)) },
  { id: 41, about: '"taxi to hotel how much" → no fares, never a route', setup: DUBAI_PLACE,
    q: { en: 'taxi to hotel how much', hi: 'hotel tak taxi kitne ka', te: 'హోటల్‌కి టాక్సీ ఎంత' },
    ok: (r, s) => r.topic === 'taxicost' && noRoute(s) },
  // ---- Broken grammar and short phrases (treated like full questions) ----
  { id: 42, about: 'Onward: "I want go Pattaya" at Bangkok → taxi or bus, ask info desk; no route, Bangkok not re-set', setup: { en: ['Bangkok'], hi: ['बैंकॉक'], te: ['బ్యాంకాక్'] },
    q: { en: 'I want go Pattaya', hi: 'Pattaya jaana hai', te: 'పట్టాయా వెళ్ళాలి' }, ok: (r, s) => r.topic === 'onward' && noRoute(s) && staff(r, 'bus') && !/\d/.test(r.text) },
  { id: 43, about: 'Onward: "Pattaya going how" with no place → no airport set', setup: {},
    q: { en: 'Pattaya going how', hi: 'पटाया कैसे जाऊँ', te: 'పట్టాయాకి ఎలా వెళ్ళాలి' }, ok: (r, s) => r.topic === 'onward' && !s.airport },
  { id: 44, about: 'Onward: "need go city"', setup: DUBAI_PLACE, q: { en: 'need go city', hi: 'shahar jaana hai', te: 'సిటీకి వెళ్ళాలి' }, ok: (r, s) => r.topic === 'onward' && noRoute(s) },
  { id: 45, about: '"hotel going" → taxi (hotel + going) or onward; never a guess route elsewhere', setup: DUBAI_PLACE,
    q: { en: 'hotel going', hi: 'hotel jaana hai', te: 'హోటల్‌కి వెళ్ళాలి' }, ok: (r, s) => (s.dest === 'taxi' && isRoute(s)) || r.topic === 'onward' },
  { id: 46, about: '"need taxi hotel" → taxi route + safety line', setup: DUBAI_PLACE,
    q: { en: 'need taxi hotel', hi: 'hotel ke liye taxi', te: 'హోటల్ కి టాక్సీ కావాలి' }, ok: (r, s) => isRoute(s) && s.dest === 'taxi' },
  { id: 47, about: '"hotel taxi please" → taxi route', setup: DUBAI_PLACE,
    q: { en: 'hotel taxi please', hi: 'hotel taxi chahiye', te: 'హోటల్ టాక్సీ ప్లీజ్' }, ok: (r, s) => isRoute(s) && s.dest === 'taxi' },
  { id: 48, about: '"money change where" → exchange', setup: DUBAI_PLACE,
    q: { en: 'money change where', hi: 'paisa badalna', te: 'డబ్బు మార్చాలి ఎక్కడ' }, ok: (r, s) => s.dest === 'exchange' && (isRoute(s) || r.kind === 'confirm') },
  { id: 49, about: '"change dollar" → exchange', setup: DUBAI_PLACE,
    q: { en: 'change dollar', hi: 'dollar change karna', te: 'డాలర్ మార్చాలి' }, ok: (r, s) => s.dest === 'exchange' && (isRoute(s) || r.kind === 'confirm') },
  { id: 50, about: '"sim where" → SIM route', setup: DUBAI_PLACE, q: { en: 'sim where', hi: 'sim kahan', te: 'సిమ్ ఎక్కడ' }, ok: (r, s) => s.dest === 'sim' && isRoute(s) },
  { id: 51, about: '"internet card" → SIM route', setup: DUBAI_PLACE,
    q: { en: 'need internet card', hi: 'internet card chahiye', te: 'ఇంటర్నెట్ కార్డ్ కావాలి' }, ok: (r, s) => s.dest === 'sim' && isRoute(s) },
  { id: 52, about: '"where me" → lost flow', setup: {}, q: { en: 'where me', hi: 'rasta nahi pata', te: 'దారి తెలియట్లేదు' }, ok: (r, s) => r.kind === 'ask' && s.lost },
  { id: 53, about: '"no understand where" → lost flow', setup: {},
    q: { en: 'no understand where', hi: 'मुझे रास्ता नहीं पता', te: 'నేను ఎక్కడ ఉన్నానో తెలియట్లేదు' }, ok: (r, s) => r.kind === 'ask' && s.lost },
  { id: 54, about: '"500 dollar how much dirham" → fair amount', setup: DUBAI_PLACE,
    q: { en: '500 dollar how much dirham', hi: '500 dollar ka kitna dirham', te: '500 డాలర్ ఎన్ని దిర్హామ్' }, ok: (r) => r.kind === 'amount' },
  { id: 55, about: '"500 dollars" → "1700 ok?" → verdict on 1700 for 500', setup: { en: [...DUBAI_PLACE.en, '500 dollars'], hi: [...DUBAI_PLACE.hi, '500 डॉलर'], te: [...DUBAI_PLACE.te, '500 డాలర్లు'] },
    q: { en: '1700 ok?', hi: '1700 theek hai?', te: '1700 సరిపోతుందా?' }, ok: (r) => r.kind === 'price' && r.price.offered === 1700 },
  { id: 56, about: '"this rate good?" with no numbers → asks for the amounts', setup: DUBAI_PLACE,
    q: { en: 'this rate good?', hi: 'ye rate theek hai?', te: 'ఈ రేటు బాగుందా?' }, ok: (r) => r.kind === 'ask' && /[0-9]/.test(r.text) && !r.text.includes('SIM') && !r.text.includes('सिम') && !r.text.includes('సిమ్') },
  { id: 57, about: 'Single word "taxi" → taxi route', setup: DUBAI_PLACE, q: { en: 'taxi', hi: 'टैक्सी', te: 'టాక్సీ' }, ok: (r, s) => s.dest === 'taxi' && isRoute(s) },
  { id: 58, about: 'Single word "SIM" → SIM route', setup: DUBAI_PLACE, q: { en: 'SIM', hi: 'सिम', te: 'సిమ్' }, ok: (r, s) => s.dest === 'sim' && isRoute(s) },
  { id: 59, about: 'Single word "ATM" → where the ATM is', setup: DUBAI_PLACE, q: { en: 'ATM', hi: 'एटीएम', te: 'ఏటీఎం' }, ok: (r) => r.topic === 'atmwhere' },
  { id: 60, about: 'Single word "money" → exchange', setup: DUBAI_PLACE, q: { en: 'money', hi: 'पैसे', te: 'డబ్బు' }, ok: (r, s) => s.dest === 'exchange' && isRoute(s) },
  { id: 61, about: 'Single word "help" → what the guide does + help card', setup: DUBAI_PLACE, q: { en: 'help', hi: 'मदद', te: 'సహాయం' }, ok: (r) => staff(r, 'help') && r.topic !== 'emergency' },
  { id: 62, about: 'Single word "exit" → the way-out route', setup: DUBAI_PLACE, q: { en: 'exit', hi: 'बाहर', te: 'బయటకు' }, ok: (r, s) => s.dest === 'exit' && isRoute(s) },
  { id: 63, about: 'Single word "toilet" → staff card', setup: DUBAI_PLACE, q: { en: 'toilet', hi: 'टॉयलेट', te: 'టాయిలెట్' }, ok: (r) => r.kind === 'offtopic' && staff(r, 'toilet') },
  { id: 64, about: 'Unsure: "hotel" alone → one short question (taxi or exit), no guess', setup: DUBAI_PLACE,
    q: { en: 'hotel', hi: 'होटल', te: 'హోటల్' }, ok: (r, s) => r.topic === 'hotelask' && s.expecting === 'need' && noRoute(s) },
];

export const LANGS = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
/** Does the reply's script match the language? (switch case: the new language) */
export function scriptOk(text, langCode) {
  if (langCode === 'te-IN') return /[ఀ-౿]/.test(text);
  if (langCode === 'hi-IN') return /[ऀ-ॿ]/.test(text);
  return !/[ऀ-ॿఀ-౿]/.test(text);
}

/** Run every case through `turn(state, text)` → { out }. Returns rows for a table. */
export async function runGolden(turn, initialState) {
  const rows = [];
  for (const c of GOLDEN) {
    for (const [short, code] of Object.entries(LANGS)) {
      let st = initialState(code), last = null, out = null;
      for (const t of (c.setup[short] || [])) { out = await turn(st, t, last); st = out.state; last = out.reply; }
      out = await turn(st, c.q[short], last);
      const r = out.reply, s = out.state;
      const expectLang = c.switchLang ? s.lang : code;
      let pass = false, why = '';
      try { pass = !!c.ok(r, s, short); } catch (e) { why = e.message; }
      const langOk = scriptOk(r.text, expectLang);
      rows.push({ id: c.id, about: c.about, lang: short, pass: pass && langOk, langOk, kind: r.kind, topic: r.topic || '', step: s.step, mode: s.mode, src: out.src || 'rules', reply: r.text.slice(0, 90), why });
    }
  }
  return rows;
}
