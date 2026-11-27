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
  // Spoken variants the recogniser returns on phones
  'ఒకట్': 1, 'ఒన్': 1, 'రెండ్': 2, 'మూడ్': 3, 'మూడొ': 3, 'మూడవ': 3, 'నాల్గు': 4, 'నాల్గో': 4,
  'फ़ोर': 4, 'थ्रि': 3, 'तिन': 3, won: 1, to: 2, too: 2, tree: 3,
};
/** "మూడులో", "మూడుకి" → the number. Latin tokens must match exactly. */
function terminalNumber(tok) {
  if (!tok) return null;
  if (TERMINAL_NUMBERS[tok] !== undefined) return TERMINAL_NUMBERS[tok];
  if (/^[a-z0-9]+$/.test(tok)) return null;
  let best = null, len = 0;
  for (const [k, v] of Object.entries(TERMINAL_NUMBERS)) {
    if (!/^[a-z0-9]+$/.test(k) && k.length > len && k.length >= 2 && tok.startsWith(k)) { best = v; len = k.length; }
  }
  return best;
}
// Ordinals said before "terminal": "teesra terminal", "third terminal"
const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4,
  pehla: 1, pahla: 1, pehle: 1, dusra: 2, doosra: 2, dusre: 2, teesra: 3, tisra: 3, teesre: 3, chautha: 4,
  'पहला': 1, 'पहले': 1, 'दूसरा': 2, 'दूसरे': 2, 'तीसरा': 3, 'तीसरे': 3, 'चौथा': 4, 'चौथे': 4,
  'మొదటి': 1, 'రెండో': 2, 'రెండవ': 2, 'మూడో': 3, 'మూడవ': 3, 'నాలుగో': 4, 'నాలుగవ': 4, 'మూడ్': 3, 'ఒకటో': 1, 'ఒకటవ': 1,
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
  // Emergencies first, always
  ['emergency', ['child is lost', 'lost my child', 'my child is missing', 'child missing', 'lost my son', 'lost my daughter', 'my son is missing',
    'my daughter is missing', 'kid is missing', 'medical', 'doctor', 'ambulance', 'chest pain', 'heart attack', 'fainted', 'injured', 'bleeding',
    'robbed', 'stolen', 'pickpocket', 'theft', 'bachcha kho', 'baccha kho', 'beta kho', 'beti kho', 'chori ho', 'doctor chahiye',
    'बच्चा खो', 'बेटा खो', 'बेटी खो', 'डॉक्टर', 'एम्बुलेंस', 'चोरी', 'लूट', 'बेहोश', 'सीने में दर्द',
    'పిల్లవాడు తప్పిపోయాడు', 'పిల్లలు తప్పిపోయారు', 'బాబు కనిపించట్లేదు', 'పాప కనిపించట్లేదు', 'బాబు తప్పిపోయాడు', 'పాప తప్పిపోయింది',
    'డాక్టర్', 'అంబులెన్స్', 'దొంగతనం', 'దోచుకున్నారు', 'దొంగిలించారు', 'స్పృహ తప్పి', 'ఛాతీ నొప్పి']],
  // "What should I do first?": the order of things, not the next step
  ['overview', ['what should i do first', 'what do i do first', 'what to do first', 'where do i start', 'what should i do after landing',
    'what do i do after landing', 'pehle kya karun', 'pehle kya karna', 'पहले क्या करूँ', 'पहले क्या करना', 'सबसे पहले क्या',
    'ముందు ఏం చేయాలి', 'మొదట ఏం చేయాలి', 'ముందుగా ఏం చేయాలి', 'మొదటగా ఏం చేయాలి']],
  // "How much is a taxi?": we have no fares
  ['taxicost', ['how much is a taxi', 'how much is the taxi', 'how much for a taxi', 'how much does a taxi', 'taxi fare', 'taxi cost',
    'taxi price', 'taxi charges', 'cab fare', 'taxi kitne', 'taxi ka kiraya', 'taxi kitna', 'टैक्सी का किराया', 'टैक्सी कितने', 'टैक्सी कितना',
    'టాక్సీ ఎంత', 'టాక్సీ ఛార్జీ', 'టాక్సీకి ఎంత', 'టాక్సీ ఖర్చు', 'taxi ఎంత']],
  // "Translate 'I need help' into Arabic": our verified staff cards
  ['translate', ['translate', 'in arabic', 'in thai', 'into arabic', 'into thai', 'say in arabic', 'arabic mein', 'thai mein', 'अनुवाद',
    'ट्रांसलेट', 'अरबी में', 'थाई में', 'అనువాదం', 'అనువదించు', 'ట్రాన్స్లేట్', 'అరబిక్ లో', 'అరబిక్‌లో', 'థాయ్ లో']],
  // Round 7: confusion at a step and common traveller questions (checked before everything else)
  ['confused', ['dont understand', 'do not understand', 'i am confused', 'im confused', 'confusing', 'two ways', 'many ways', 'left or right',
    'which side', 'samajh nahi', 'samajh nahin', 'rasta samajh', 'do raste', 'समझ नहीं', 'रास्ता समझ', 'दो रास्ते', 'बाएँ या दाएँ', 'कन्फ्यूज़',
    'అర్థం కావట్లేదు', 'అర్థం కావడం లేదు', 'అర్థం కాలేదు', 'అర్ధం కావట్లేదు', 'రెండు మార్గాలు', 'చాలా మార్గాలు', 'రెండు దారులు', 'ఎడమా కుడా', 'కన్ఫ్యూజ్']],
  ['lostitem', ['lost passport', 'lost my passport', 'passport lost', 'passport is lost', 'passport missing', 'passport kho', 'lost wallet', 'lost my wallet',
    'wallet lost', 'wallet kho', 'purse kho', 'lost my phone', 'phone lost', 'phone kho', 'mobile kho', 'पासपोर्ट खो', 'बटुआ खो', 'वॉलेट खो', 'पर्स खो', 'फ़ोन खो', 'फोन खो',
    'పాస్‌పోర్ట్ పోయింది', 'పాస్పోర్ట్ పోయింది', 'passport పోయింది', 'wallet పోయింది', 'phone పోయింది', 'lost passport help', 'పర్స్ పోయింది', 'వాలెట్ పోయింది', 'ఫోన్ పోయింది', 'పాస్‌పోర్ట్ కనిపించట్లేదు']],
  ['carddecline', ['card declined', 'card decline', 'declined', 'card not working', 'card is not working', 'card doesnt work', 'atm not working',
    'card blocked', 'card nahi chal', 'card decline ho', 'कार्ड नहीं चल', 'कार्ड डिक्लाइन', 'कार्ड काम नहीं', 'एटीएम काम नहीं',
    'కార్డు పని చేయట్లేదు', 'కార్డ్ పని చేయట్లేదు', 'కార్డు పనిచేయట్లేదు', 'కార్డ్ పనిచేయట్లేదు', 'డిక్లైన్', 'ఏటీఎం పని చేయట్లేదు']],
  ['missedflight', ['missed my connection', 'missed connection', 'missed my connecting', 'missed the connecting', 'missed connecting', 'missed my flight', 'missed flight', 'flight delayed', 'flight is delayed', 'delayed',
    'flight cancelled', 'flight canceled', 'cancelled', 'flight miss', 'miss ho gayi', 'miss ho gaya', 'flight chhut', 'फ्लाइट छूट', 'फ़्लाइट छूट', 'फ्लाइट लेट', 'फ्लाइट कैंसिल',
    'మిస్ అయింది', 'ఫ్లైట్ మిస్', 'ఫ్లైట్ లేట్', 'ఫ్లైట్ క్యాన్సిల్', 'ఫ్లైట్ రద్దు']],
  ['shortchanged', ['gave less', 'gave me less', 'less money', 'short changed', 'shortchanged', 'wrong amount', 'kam paise', 'paise kam',
    'कम पैसे', 'पैसे कम', 'తక్కువ డబ్బు', 'తక్కువ ఇచ్చారు', 'డబ్బు తక్కువ']],
  ['taxiissue', ['too much', 'overcharg', 'asking too much', 'unofficial', 'cant find my driver', 'cant find my pickup', 'driver not found',
    'driver nahi mil', 'driver nahi aaya', 'pickup nahi', 'zyada maang', 'ड्राइवर नहीं मिल', 'ड्राइवर नहीं आया', 'ज़्यादा माँग', 'ज्यादा मांग',
    'ఎక్కువ అడుగుతున్నాడు', 'ఎక్కువ అడుగుతున్నారు', 'డ్రైవర్ కనిపించట్లేదు', 'డ్రైవర్ రాలేదు', 'పికప్ రాలేదు']],
  ['unsafe', ['unsafe', 'not safe', 'scared', 'afraid', 'danger', 'emergency', 'police', 'help me', 'urgent help', 'help chahiye', 'bachao',
    'डर लग', 'मदद चाहिए', 'खतरा', 'ख़तरा', 'पुलिस', 'बचाओ', 'భయంగా', 'భయం', 'సహాయం కావాలి', 'ప్రమాదం', 'పోలీస్', 'కాపాడండి']],
  ['wheelchair', ['wheelchair', 'wheel chair', 'special assistance', 'elderly', 'old parents', 'disabled', 'व्हीलचेयर', 'व्हील चेयर', 'बुजुर्ग',
    'వీల్‌చైర్', 'వీల్ చైర్', 'వీల్చైర్', 'వృద్ధులు', 'పెద్దవాళ్ళు']],
  ['beforeafter', ['before immigration', 'after immigration', 'before or after', 'immigration ke pehle', 'immigration se pehle', 'pehle ya baad',
    'इमिग्रेशन से पहले', 'इमिग्रेशन के बाद', 'पहले या बाद', 'ఇమ్మిగ్రేషన్ ముందా', 'ముందా తర్వాతా', 'ఇమ్మిగ్రేషన్ ముందు', 'ఇమ్మిగ్రేషన్ తర్వాత']],
  ['visa', ['visa', 'documents', 'what will immigration ask', 'immigration questions', 'kya puchenge', 'kya poochenge', 'वीज़ा', 'वीजा', 'दस्तावेज़',
    'क्या पूछेंगे', 'వీసా', 'డాక్యుమెంట్లు', 'ఏం అడుగుతారు']],
  ['wifi', ['wifi', 'wi fi', 'wi-fi', 'wireless', 'otp', 'वाईफाई', 'वाई फाई', 'वाई-फ़ाई', 'వైఫై', 'వై ఫై']],
  ['nodata', ['no data', 'phone dead', 'phone is dead', 'phone off', 'no signal', 'no network', 'mobile data', 'data nahi', 'data khatam',
    'no internet', 'internet nahi', 'डेटा नहीं', 'नेटवर्क नहीं', 'डेटा ख़त्म', 'डेटा खत्म', 'इंटरनेट नहीं',
    'data లేదు', 'net లేదు', 'డేటా లేదు', 'నెట్‌వర్క్ లేదు', 'నెట్వర్క్ లేదు', 'సిగ్నల్ లేదు', 'ఇంటర్నెట్ లేదు', 'ఫోన్ ఆఫ్']],
  ['battery', ['battery', 'charger', 'charging', 'phone charge', 'low charge', 'charging point', 'बैटरी', 'चार्जर', 'चार्जिंग',
    'బ్యాటరీ', 'ఛార్జింగ్', 'చార్జింగ్', 'ఛార్జర్', 'చార్జర్']],
  ['latenight', ['late night', 'at night', 'midnight', 'night time', 'open at night', 'open now', 'is it open', 'still open', 'raat',
    'counter open', 'anything open', 'is anything open', 'any counter open', 'open 24',
    'khula', 'khula hai', 'रात', 'खुला है', 'खुला होगा', 'ఓపెన్ ఉందా', 'ఓపెనా', 'రాత్రి', 'అర్ధరాత్రి']],
  ['trolley', ['trolley', 'trolleys', 'luggage cart', 'baggage cart', 'ट्रॉली', 'ట్రాలీ']],
  ['nostaff', ['nobody is here', 'nobody here', 'no one is here', 'no one here', 'no staff', 'no one to ask', 'nobody to ask',
    'there is nobody', 'theres nobody', 'koi nahi hai', 'koi nahin hai', 'koi staff nahi', 'yahan koi nahi',
    'कोई नहीं है', 'यहाँ कोई नहीं', 'कोई स्टाफ नहीं', 'स्टाफ नहीं है', 'पूछने के लिए कोई नहीं',
    'ఎవరూ లేరు', 'ఎవ్వరూ లేరు', 'స్టాఫ్ లేరు', 'సిబ్బంది లేరు', 'అడగడానికి ఎవరూ']],
  ['apphelp', ['save for my trip', 'save trip', 'save the app', 'save app', 'save this', 'flight mode', 'airplane mode', 'aeroplane mode',
    'offline', 'without internet', 'home screen', 'install the app', 'install app', 'add to home',
    'bina internet', 'ऑफ़लाइन', 'ऑफलाइन', 'फ़्लाइट मोड', 'फ्लाइट मोड', 'बिना इंटरनेट',
    'होम स्क्रीन', 'सेव', 'ఆఫ్‌లైన్', 'ఆఫ్లైన్', 'ఫ్లైట్ మోడ్', 'ఇంటర్నెట్ లేకుండా',
    'హోమ్ స్క్రీన్', 'సేవ్']],
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
  ['traps', ['traps', 'trap', 'scam', 'scams', 'traps to avoid', 'fraud', 'cheat', 'cheating', 'rip off', 'ripoff',
    'dhokhe', 'dhokha', 'thagi', 'jaal', 'धोख', 'ठग', 'जाल', 'फ्रॉड', 'फ़्रॉड', 'स्कैम', 'ट्रैप',
    'మోస', 'ట్రాప్', 'స్కామ్', 'స్కాం', 'ఫ్రాడ్']],
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
  ['shop', ['shop', 'shops', 'shopping', 'buy', 'purchase', 'kharidna', 'kharidne', 'खरीद', 'ख़रीद', 'కొనాలి', 'కొనడానికి', 'కొనుక్కోవాలి', 'books', 'book', 'bookshop', 'book shop', 'alcohol', 'liquor', 'beer', 'wine', 'whisky',
    'duty free', 'dutyfree', 'perfume', 'chocolate', 'chocolates', 'kitab', 'kitaab', 'sharab', 'daru',
    'शॉपिंग', 'दुकान', 'किताब', 'शराब', 'दारू', 'ड्यूटी फ्री', 'ड्यूटी फ़्री', 'बियर',
    'షాపింగ్', 'షాప్', 'దుకాణ', 'పుస్తక', 'మద్యం', 'డ్యూటీ ఫ్రీ', 'బీర్']],
  ['food', ['food', 'eat', 'hungry', 'restaurant', 'coffee', 'tea', 'snack', 'snacks', 'breakfast', 'lunch', 'dinner', 'water',
    'khana', 'khaana', 'bhook', 'bhookh', 'chai', 'nashta',
    'खाना', 'भूख', 'चाय', 'कॉफी', 'कॉफ़ी', 'रेस्टोरेंट', 'रेस्टोरेंट', 'नाश्ता', 'पानी',
    'tiffin', 'pani', 'paani', 'drinking water', 'cafe',
    'स्नैक', 'टिफ़िन', 'टिफिन', 'पीने का पानी', 'कैफ़े',
    'భోజనం', 'ఆహారం', 'ఆకలి', 'కాఫీ', 'చాయ్', 'రెస్టారెంట్', 'టిఫిన్', 'తినడానికి', 'నీళ్ళు', 'నీళ్లు', 'నీరు',
    'మంచినీళ్ళు', 'మంచినీళ్లు', 'స్నాక్', 'తాగడానికి', 'టీ కావాలి', 'టీ ఎక్కడ', 'టీ తాగ']],
];

// "Where is the ATM?" (a place) vs "ATM tips" (advice)
const ATM_ADVICE = ['tips', 'tip', 'advice', 'safe', 'safely', 'fee', 'fees', 'charges', 'charge', 'withdraw', 'withdrawal',
  'salah', 'सलाह', 'टिप्स', 'फ़ीस', 'फीस', 'चार्ज', 'చిట్కా', 'సలహా', 'ఫీజు', 'ఛార్జ్'];
// "How many dirhams for 500 dollars?"
const HOW_MANY = ['how many', 'how much will i get', 'how much do i get', 'how much would i get', 'how much is', 'how much',
  'ఎంత', 'అంత వస్తాయి', 'ఎంతొస్తాయి',
  'kitne', 'kitna milega', 'kitne milenge', 'कितने', 'कितना मिलेगा', 'कितने मिलेंगे',
  'ఎన్ని', 'ఎంత వస్తుంది', 'ఎంత వస్తాయి', 'ఎంత ఇస్తారు', 'ఎంత వస్తది'];
// "Price check" without numbers
const PRICE_CHECK = ['price check', 'rate check', 'ప్రైస్ చెక్', 'ప్రైజ్ చెక్', 'ధర చూడాలి', 'రేటు చూడాలి',
  'प्राइस चेक', 'दाम चेक', 'check the rate', 'check rate', 'check price', 'check the price', 'good rate',
  'fair rate', 'rate sahi', 'rate theek', 'रेट चेक', 'रेट जाँच', 'रेट जांच', 'रेट सही', 'रेट ठीक',
  'రేటు చెక్', 'రేట్ చెక్', 'ధర చెక్', 'రేటు సరైనదా', 'రేటు బాగుందా', 'రేటు కరెక్టా'];

// ---------- Yes / no (answers to "Is that right?") ----------
const YES_WORDS = ['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'thats right', 'ok', 'okay', 'sure', 'haan', 'han', 'haa', 'ji',
  'haanji', 'sahi', 'theek', 'thik', 'हाँ', 'हां', 'जी', 'सही', 'ठीक', 'अवुनु', 'అవును', 'ఔను', 'సరే', 'కరెక్ట్', 'ఓకే', 'అవునండి'];
const NO_WORDS = ['no', 'nope', 'wrong', 'not right', 'incorrect', 'nahi', 'nahin', 'nai', 'galat', 'नहीं', 'नही', 'गलत', 'ग़लत',
  'కాదు', 'లేదు', 'తప్పు'];

// ---------- "What do you see?" answers, for the I'm-lost flow ----------
const STAGES = {
  immigration: ['passport', 'passports', 'passport counter', 'immigration', 'pasport', 'passport control', 'automated gates', 'e gates',
    'corridor', 'long corridor', 'walkway', 'travelator', 'people walking', 'officer', 'officers', 'escalator', 'escalators', 'duty free',
    'पासपोर्ट', 'इमिग्रेशन', 'पासपोर्ट काउंटर', 'ड्यूटी फ्री', 'ड्यूटी फ़्री', 'गलियारा', 'कॉरिडोर', 'लोग चल रहे', 'अफ़सर', 'अफसर', 'ऑफिसर', 'एस्केलेटर',
    'పాస్పోర్ట్', 'పాస్‌పోర్ట్', 'ఇమ్మిగ్రేషన్', 'డ్యూటీ ఫ్రీ', 'కారిడార్', 'కారిడర్', 'నడుస్తున్నారు', 'ఆఫీసర్', 'అధికారులు', 'ఎస్కలేటర్'],
  baggage: ['baggage', 'bags', 'bag', 'belt', 'belts', 'luggage', 'carousel', 'trolley', 'trolleys', 'suitcase', 'suitcases', 'samaan', 'saman', 'shops',
    'बैगेज', 'सामान', 'बेल्ट', 'लगेज', 'बैग', 'ट्रॉली', 'दुकानें',
    'బ్యాగేజ్', 'బెల్ట్', 'లగేజ్', 'సామాను', 'బ్యాగ', 'ట్రాలీ', 'షాపులు'],
  customs: ['customs', 'custom', 'green channel', 'red channel', 'scanner', 'x ray', 'कस्टम', 'ग्रीन चैनल', 'रेड चैनल', 'కస్టమ్', 'గ్రీన్ చానెల్', 'స్కానర్'],
  arrivals: ['arrivals', 'arrival', 'arrivals hall', 'hall', 'meeting hall', 'exit', 'outside', 'bahar', 'people waiting', 'name boards',
    'अराइवल', 'बाहर', 'एग्ज़िट', 'हॉल', 'अराइवल्स हॉल', 'అరైవల్', 'బయట', 'హాల్', 'ఎగ్జిట్'],
};
// "I'm in / at / I can see …": the sentence says where they are
const PLACE_WORDS = ['im in', 'i am in', 'im at', 'i am at', 'i can see', 'i see', 'there is', 'theres', 'there are', 'im near', 'i am near', 'here',
  'already', 'now in', 'in the', 'at the', 'है', 'हैं',
  'में हूँ', 'में हूं', 'पर हूँ', 'पे हूँ', 'के पास हूँ', 'दिख रहा', 'दिख रही', 'दिख रहे', 'यहाँ', 'main hoon', 'pe hoon', 'dikh raha', 'dikh rahe',
  'ఉన్నాను', 'ఉన్నా', 'ఉంది', 'ఉన్నారు', 'కనిపిస్తుంది', 'కనిపిస్తున్నాయి', 'కనిపిస్తోంది', 'కనిపిస్తున్నారు', 'ఇక్కడ'];
// "Taken / done / reached": the current step is finished
// "Where is the belt?" asks for a place; it doesn't say where they are
const QUESTION_WORDS = ['where', 'which way', 'how do i get', 'kahan', 'kidhar', 'कहाँ', 'कहां', 'किधर', 'ఎక్కడ', 'ఎటు', 'ఎలా వెళ్ళాలి'];
const DONE_WORDS = ['done', 'taken', 'took', 'claimed', 'picked up my', 'got my bags', 'got my bag', 'got the bags', 'got both', 'got all', 'got everything', 'got it', 'collected', 'reached', 'finished', 'completed',
  'cleared', 'passed', 'im through', 'i am through', 'ho gaya', 'ho gayi', 'le liya', 'le liye', 'mil gaya', 'mil gaye', 'pahunch gaya',
  'हो गया', 'हो गई', 'ले लिया', 'ले लिए', 'ले ली', 'मिल गया', 'मिल गए', 'पहुँच गया', 'पहुंच गया', 'पहुँच गई', 'कर लिया', 'पार कर लिया',
  'తీసుకున్నా', 'తీసేసుకున్నా', 'అయిపోయింది', 'అయింది', 'చేరుకున్నా', 'వచ్చేశా', 'దాటాను', 'దాటేశా', 'పూర్తయింది', 'కలెక్ట్ చేశా'];
// "How many / which exchange counters are here?"
const COUNTER_LIST = ['how many counters', 'how many exchange counters', 'which counters', 'which exchange counters', 'list counters',
  'list the counters', 'what counters', 'counters here', 'kitne counter', 'kaun se counter', 'कितने काउंटर', 'कौन से काउंटर', 'कौन कौन से काउंटर',
  'kitne exchange counter', 'कितने एक्सचेंज काउंटर', 'कौन से एक्सचेंज काउंटर', 'काउंटर कितने',
  'ఎన్ని ఎక్స్చేంజ్ కౌంటర్లు', 'ఎన్ని ఎక్స్ఛేంజ్ కౌంటర్లు', 'ఎన్ని కౌంటర్లు', 'ఏ కౌంటర్లు', 'ఏయే కౌంటర్లు', 'కౌంటర్లు ఉన్నాయి'];
// "They're giving 1500": an offer, to compare with the amount said earlier
const OFFER_WORDS = ['giving', 'offering', 'they give', 'they gave', 'offered', 'gave me', 'says', 'saying', 'quoted', 'quoting', 'de rahe', 'de raha', 'dete hain', 'diya',
  'bol raha', 'bol rahe', 'keh raha', 'बोल रहा', 'बोल रहे', 'कह रहा', 'कह रहे', 'చెప్తున్నాడు', 'చెప్తున్నారు', 'అంటున్నాడు', 'అంటున్నారు',
  'दे रहे', 'दे रहा', 'देते हैं', 'दिया', 'ఇస్తున్నారు', 'ఇస్తారంట', 'ఇస్తామన్నారు', 'ఇచ్చారు', 'ఇస్తున్నాడు', 'ఇస్తున్నది'];


// ---------- Commands (checked in this order) ----------
const COMMANDS = [
  ['restart', ['start over', 'start again', 'restart', 'reset', 'new search', 'shuru se', 'phir se shuru',
    'फिर से शुरू', 'शुरू से', 'नए सिरे', 'మొదటి నుంచి', 'మళ్ళీ మొదలు', 'మళ్లీ మొదలు']],
  ['staff', ['ask staff', 'show staff', 'staff card', 'help card', 'show card', 'ask someone', 'staff se',
    'स्टाफ से पूछ', 'स्टाफ़ से पूछ', 'कर्मचारी से पूछ', 'स्टाफ कार्ड', 'स्टाफ़ कार्ड',
    'స్టాఫ్ని అడగ', 'స్టాఫ్ ని అడగ', 'సిబ్బందిని అడగ', 'స్టాఫ్ కార్డ్', 'స్టాఫ్కి చూపించ']],
  ['lost', ['lost', 'i am lost', 'im lost', 'where am i', 'dont know where i am', 'do not know where i am',
    'kho gaya', 'kho gayi', 'pata nahi kahan', 'pata nahin kahan', 'खो गया', 'खो गई', 'खो गयी', 'पता नहीं कहाँ', 'पता नहीं कहां',
    'मैं कहाँ हूँ', 'कहाँ हूँ', 'कहां हूं', 'मैं कहां हूं', 'मै कहाँ हूँ', 'मैं किधर हूँ', 'main kahan hoon', 'main kahan hu', 'mai kahan hu',
    'main kahaan hoon', 'main kidhar hoon', 'kahan hoon main', 'kaha hu', 'समझ नहीं आ रहा कहाँ', 'ఎక్కడున్నానో', 'ఎక్కడ ఉన్నానో అర్థం', 'ఎక్కడున్నానో తెలియదు', 'ఎక్కడ ఉన్నానో తెలియదు', 'తప్పిపోయాను', 'నేను ఎక్కడ ఉన్నాను']],
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
  AED: ['dirham', 'dirhams', 'dirhum', 'dirhem', 'durham', 'aed', 'दिरहम', 'दिरहाम', 'दिर्हम', 'दरहम', 'దిర్హామ్', 'దిర్హమ్', 'దిర్హాం', 'దిర్హం', 'దిర్హాము', 'దిర్హము', 'దిరామ్', 'దిరాము', 'దిరహమ్', 'దిరహాము'],
  INR: ['rupee', 'rupees', 'rupaye', 'rupay', 'rupiya', 'rs', 'inr', '₹', 'रुपये', 'रुपए', 'रुपया', 'रूपए', 'रूपये', 'रुपय', 'రూపాయ', 'రూపాయి', 'రూపాయల'],
  THB: ['baht', 'bhat', 'thb', 'बाट', 'भाट', 'బాట్', 'బాత్'],
  SGD: ['sgd'],
  EUR: ['euro', 'euros', 'eur', '€', 'यूरो', 'యూరో'],
  GBP: ['pound', 'pounds', 'gbp', '£', 'पाउंड', 'పౌండ'],
};
const SGD_PREFIX = ['singapore', 'sing', 'सिंगापुर', 'సింగపూర్'];
const CURRENCY_FILLERS = ['us', 'american', 'uae', 'emirati', 'thai', 'indian', 'अमेरिकी', 'यूएई', 'అమెరికన్'];

/** Which currency a token names, or null. */
// Phone recognisers split or mishear some words. Fix them before reading the sentence.
// (Each is a whole phrase, so ordinary words such as the name "రాములు" alone are untouched.)
const SPEECH_FIXES = [
  [/(^| )ది రా(ము|మ్)/g, '$1దిరా$2'],          // "ది రాములు" → "దిరాములు" (dirhams)
  [/(^| )ది ర్హా/g, '$1దిర్హా'],
  [/(^| )(టర్నల్|టెర్నల్|టర్మినల్|టెర్మినల|టర్మనల్)(?= |$)/g, '$1టెర్మినల్'],
  [/(^| )(टर्नल|टरनल|टर्मिनस)(?= |$)/g, '$1टर्मिनल'],
  [/(^| )(turnal|ternal|terminus|termi nal)(?= |$)/g, '$1terminal'],
];
export function fixSpeech(text) {
  let t = ' ' + text + ' ';
  for (const [re, to] of SPEECH_FIXES) t = t.replace(re, to);
  return t.trim().replace(/\s+/g, ' ');
}

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
  base.tokens = fixSpeech(base.tokens.join(' ')).split(' ').filter(Boolean);
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
    const after = terminalNumber(tokens[i + 1]);
    const before = ORDINALS[tokens[i - 1]];
    // A lone "t" only counts with a digit right after it ("t3"), not "t two".
    if (t === 't') { if (/^[1-4]$/.test(tokens[i + 1] || '')) terminal = 'T' + tokens[i + 1]; continue; }
    if (after) terminal = 'T' + after;
    else if (before) terminal = 'T' + before;
  }
  if (!terminal) {
    // Joined: "terminal3", "టెర్మినల్3"
    const j = p.norm.match(/(?:terminal|टर्मिनल|టెర్మినల్|టర్మినల్)([1-4])(?!\d)/);
    if (j) terminal = 'T' + j[1];
  }
  if (!terminal) {
    // "terminal number teen", "terminal no 3"
    const m = p.norm.match(/(?:terminal|टर्मिनल|టెర్మినల్)\s+(?:number|no|nambar|नंबर|నంబర్)\s+(\S+)/);
    if (m && TERMINAL_NUMBERS[m[1]]) terminal = 'T' + TERMINAL_NUMBERS[m[1]];
  }
  // "Emirates terminal" is Dubai T3; "flydubai" is mostly T2
  if (!terminal && (airport === 'DXB' || ctx.airport === 'DXB' || hasAny(p, ['emirates', 'एमिरेट्स', 'ఎమిరేట్స్']))) {
    if (hasAny(p, ['emirates', 'एमिरेट्स', 'ఎమిరేట్స్'])) { terminal = 'T3'; airport = airport || (ctx.airport ? null : 'DXB'); }
    else if (hasAny(p, ['flydubai', 'fly dubai', 'फ्लाईदुबई', 'फ्लाई दुबई', 'ఫ్లైదుబాయ్', 'ఫ్లై దుబాయ్'])) terminal = 'T2';
  }
  if (!terminal && ctx.expecting === 'terminal') {
    // Answering "Which terminal?" with just "teen" / "3" / "మూడు" / "third"
    for (const t of tokens) {
      const v = (['to', 'too'].includes(t) ? null : terminalNumber(t)) ?? ORDINALS[t];
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
  // A staff word on its own ("staff", "స్టాఫ్") is a request; inside a sentence it's just people ("officers are sitting")
  if (!command && tokens.length <= 2 && hasAny(p, ['staff', 'स्टाफ', 'स्टाफ़', 'కర్మచారి', 'స్టాఫ్', 'సిబ్బంది'])) command = 'staff';

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
  // "Where is the ATM?" is a place; "ATM tips / fees / withdraw" is advice
  if (topic === 'atm' && !hasAny(p, ATM_ADVICE)) topic = 'atmwhere';
  // A plain "card" means card advice, unless it's a SIM card or the staff card.
  if (!topic && command !== 'staff' && !hasAny(p, SIM_WORDS) && hasAny(p, CARD_WORDS)) topic = 'cards';

  // Intent: where they want to go. SIM and taxi words win over generic money words.
  let intent = null;
  const EXIT_WORDS = ['guide me out', 'way out', 'get out', 'out of the airport', 'just guide me', 'just the way out', 'exit route', 'guide me to the exit',
    'bahar kaise', 'bahar jana', 'bahar nikalna', 'बाहर कैसे', 'बाहर जाना', 'बाहर निकल', 'बाहर का रास्ता',
    'బయటికి ఎలా', 'బయటకు ఎలా', 'బయటికి వెళ్ళాలి', 'బయటకు వెళ్ళాలి', 'బయటకు దారి', 'బయటికి దారి', 'బయటికి తీసుకెళ్ళు'];
  if (hasAny(p, EXIT_WORDS)) intent = 'exit';
  else if (hasAny(p, SIM_WORDS)) intent = 'sim';
  else if (hasAny(p, METRO_WORDS)) intent = 'metro';
  else if (hasAny(p, TAXI_WORDS) && topic !== 'pickup') intent = 'taxi';
  else if (hasAny(p, EXCHANGE_WORDS) || (price && price.given)) intent = 'exchange';

  // "I want to change my leftover dirhams" is a request to exchange now, not the leftover tip
  if (topic === 'leftover' && hasAny(p, ['want to change', 'want to exchange', 'need to change', 'convert', 'change to', 'change into',
    'badalna hai', 'badalne hain', 'बदलना है', 'बदलने हैं', 'बदलवाने', 'మార్చాలి', 'మార్చుకోవాలి', 'మార్చేయాలి'])) {
    topic = null; intent = intent || 'exchange';
  }
  // Traveller questions: the question wins over commands and destinations in the same sentence
  if (topic === 'battery' && hasAny(p, ['buy', 'purchase', 'kharid', 'खरीद', 'ख़रीद', 'కొనాలి', 'కొనడానికి', 'కొనుక్కోవాలి'])) topic = null;
  const Q_TOPICS = ['emergency', 'overview', 'taxicost', 'translate', 'confused', 'lostitem', 'carddecline', 'missedflight', 'shortchanged', 'taxiissue', 'unsafe', 'wheelchair', 'beforeafter',
    'visa', 'wifi', 'nodata', 'battery', 'latenight', 'trolley'];
  const qNumbers = findNumbers(tokens, (t) => !!currencyOf(t)).filter((n) => !TERMINAL_WORDS.includes(tokens[n.start - 1]));
  if (topic === 'confused' && command === 'lost') topic = null;                // "don't know where I am" is the lost flow
  if (topic === 'shortchanged' && qNumbers.length) topic = null;              // "giving only 1500" is a price check
  if (topic === 'unsafe' && intent && !hasAny(p, ['unsafe', 'not safe', 'scared', 'afraid', 'danger', 'emergency', 'police',
    'डर लग', 'खतरा', 'ख़तरा', 'पुलिस', 'భయంగా', 'భయం', 'ప్రమాదం', 'పోలీస్'])) topic = null;  // "help with exchange" isn't an emergency
  if (topic === 'trolley' && !hasAny(p, QUESTION_WORDS) && tokens.length > 2) topic = null;   // "I can see trolleys" is a place
  if (topic && Q_TOPICS.includes(topic)) {
    if (command !== 'staff' && command !== 'restart') command = null;
    intent = null;
  }
  // "Can I bring mangoes into Singapore?": a rules question we don't answer (customs / what's allowed)
  if (!topic && !command && hasAny(p, ['can i bring', 'can i carry', 'can i take', 'is it allowed', 'am i allowed', 'allowed to bring', 'import',
    'la sakta', 'le ja sakta', 'ला सकता', 'ला सकती', 'ले जा सकता', 'ले जा सकती', 'తేవచ్చా', 'తీసుకెళ్ళవచ్చా', 'తీసుకురావచ్చా'])) {
    topic = 'outofscope'; intent = null;
  }
  // Greeting on its own
  if (!topic && !intent && !command && !airport && tokens.length <= 4 &&
      hasAny(p, ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'नमस्ते', 'नमस्कार', 'हाय', 'हेलो', 'హాయ్', 'హలో', 'నమస్తే', 'నమస్కారం'])) {
    topic = 'greet';
  }
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

  // Progress, place and counter questions
  const progress = hasAny(p, DONE_WORDS);
  const placeTalk = (hasAny(p, PLACE_WORDS) || hasAny(p, ['going', 'heading', 'walking', 'taking', 'im on', 'i am on', 'on the'])) && !hasAny(p, QUESTION_WORDS);
  const atPlace = !!stage && placeTalk;
  if (hasAny(p, COUNTER_LIST)) { topic = 'counters'; if (intent === 'exchange') intent = null; }
  const offered = hasAny(p, OFFER_WORDS);

  // "How many dirhams for 500 dollars?": one amount and the currency they want.
  // The number after "terminal" is a terminal, not an amount.
  const isTermTok = (t) => TERMINAL_WORDS.includes(t) || /^(टर्मिनल|టెర్మినల్|టర్మినల్)/.test(t);
  const numbers = findNumbers(tokens, (t) => !!currencyOf(t)).filter((n) => !isTermTok(tokens[n.start - 1])).map((n) => n.value);
  let amountQuery = null;
  const pairs = price ? price.pairs : [];
  // "I have 300 dollars" also asks what they'll get
  const HAVE = ['i have', 'i got', 'mere paas', 'mere pas', 'मेरे पास', 'हमारे पास', 'నా దగ్గర', 'నా దగ్గర ఉన్నాయి', 'మా దగ్గర'];
  if ((hasAny(p, HOW_MANY) || (hasAny(p, HAVE) && pairs.length === 1 && !hasAny(p, OFFER_WORDS))) && !(price && price.given) && (pairs.length === 1 || (pairs.length === 0 && numbers.length === 1))) {
    const from = pairs.length ? pairs[0].currency : null;
    const amount = pairs.length ? pairs[0].amount : numbers[0];
    let to = null;
    tokens.forEach((t, k) => {
      let c = currencyOf(t);
      if (c === 'USD' && SGD_PREFIX.includes(tokens[k - 1])) c = 'SGD';
      if (c && c !== from && !to) to = c;
    });
    amountQuery = { amount, from, to };
  }
  const priceCheck = hasAny(p, PRICE_CHECK);
  // Telugu "టీ" on its own is tea, unless it's "T 3"
  if (!offtopic && !intent && !topic && tokens.some((t, k) => t === 'టీ' && !/^[1-4]$/.test(tokens[k + 1] || ''))) offtopic = 'food';

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
    numbers,
    amountQuery,
    priceCheck,
    progress,
    atPlace,
    placeTalk,
    offered,
  };
}

/** How much a parse "understood" — used to choose between speech alternatives. */
export function score(parsed) {
  return (parsed.command ? 3 : 0) + (parsed.stage ? 1 : 0) + (parsed.price ? 4 : 0) + (parsed.airport ? 2 : 0) +
    (parsed.terminal ? 2 : 0) + (parsed.intent ? 1 : 0) + (parsed.topic ? 1 : 0) + (parsed.offtopic ? 1 : 0) + (parsed.amountQuery ? 3 : 0) + (parsed.progress ? 1 : 0) +
    (parsed.yesno ? 2 : 0);
}

export { NUMBER_WORDS, matches };
