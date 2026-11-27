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
  ['en', 'where is an ATM', { topic: 'atmwhere' }],
  ['hi', 'एटीएम कहाँ है', { topic: 'atmwhere' }],
  ['te', 'ఏటీఎం ఎక్కడ', { topic: 'atmwhere' }],
  ['en', 'ATM tips', { topic: 'atm' }],
  ['hi', 'एटीएम की सलाह दीजिए', { topic: 'atm' }],
  ['te', 'ఏటీఎం చిట్కాలు', { topic: 'atm' }],
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
  // Leftover currency and excess baggage tips
  ['en', 'what do I do with leftover currency', { topic: 'leftover' }],
  ['hinglish', 'bacha hua paisa kya karun', { topic: 'leftover' }],
  ['hi', 'बचे हुए पैसे का क्या करूँ', { topic: 'leftover' }],
  ['te', 'మిగిలిన డబ్బు ఏం చేయాలి', { topic: 'leftover' }],
  ['en', 'I have excess baggage', { topic: 'excessbag', offtopic: null }],
  ['hinglish', 'extra baggage ka paisa dena hai', { topic: 'excessbag' }],
  ['hi', 'अतिरिक्त सामान का पैसा देना है', { topic: 'excessbag', offtopic: null }],
  ['te', 'అదనపు లగేజీ ఉంది', { topic: 'excessbag' }],

  // ---- Round 5: Syam's Telugu phone test, with Hindi and English versions ----
  // Terminal number variants
  ['te', 'దుబాయ్ టెర్మినల్ మూడ్', { airport: 'DXB', terminal: 'T3' }],
  ['te', 'దుబాయ్ టెర్మినల్ మూడు', { airport: 'DXB', terminal: 'T3' }],
  ['te', 'దుబాయ్ మూడో టెర్మినల్', { airport: 'DXB', terminal: 'T3' }],
  ['te', 'దుబాయ్ టెర్మినల్ త్రీ', { airport: 'DXB', terminal: 'T3' }],
  ['te', 'దుబాయ్ టెర్మినల్ మూడులో ఉన్నాను', { airport: 'DXB', terminal: 'T3' }],
  ['te', 'బెంగళూరు టెర్మినల్ ఒకటి', { airport: 'BLR', terminal: 'T1' }],
  ['te', 'బెంగళూరు టెర్మినల్ వన్', { airport: 'BLR', terminal: 'T1' }],
  ['te', 'బెంగళూరు టెర్మినల్ రెండు', { airport: 'BLR', terminal: 'T2' }],
  ['te', 'బెంగళూరు టెర్మినల్ టూ', { airport: 'BLR', terminal: 'T2' }],
  ['te', 'మూడ్', { terminal: 'T3' }, { expecting: 'terminal' }],
  ['te', 'త్రీ', { terminal: 'T3' }, { expecting: 'terminal' }],
  ['te', 'వన్', { terminal: 'T1' }, { expecting: 'terminal' }],
  ['hi', 'दुबई टर्मिनल थ्री', { airport: 'DXB', terminal: 'T3' }],
  ['hi', 'दुबई टर्मिनल तीन', { airport: 'DXB', terminal: 'T3' }],
  ['hi', 'बेंगलुरु टर्मिनल वन', { airport: 'BLR', terminal: 'T1' }],
  ['hi', 'बेंगलुरु टर्मिनल टू', { airport: 'BLR', terminal: 'T2' }],
  ['hi', 'दुबई तीसरा टर्मिनल', { airport: 'DXB', terminal: 'T3' }],
  ['hi', 'थ्री', { terminal: 'T3' }, { expecting: 'terminal' }],
  ['en', 'dubai terminal3', { airport: 'DXB', terminal: 'T3' }],
  ['en', 'dubai terminal tree', { airport: 'DXB', terminal: 'T3' }],
  // "Where is the ATM?" vs ATM tips
  ['hinglish', 'atm kahan hai', { topic: 'atmwhere' }],
  ['te', 'బెంగళూరు టెర్మినల్ 1 ఏటీఎం ఎక్కడ', { airport: 'BLR', terminal: 'T1', topic: 'atmwhere' }],
  ['en', 'how do I withdraw from an ATM safely', { topic: 'atm' }],
  // Traps are never tips
  ['te', 'ట్రాప్స్ చెప్పండి', { topic: 'traps' }],
  ['te', 'మోసాల గురించి చెప్పండి', { topic: 'traps' }],
  ['te', 'స్కామ్‌లు ఏంటి', { topic: 'traps' }],
  ['te', 'మోసం', { topic: 'traps' }],
  ['hi', 'जाल बताइए', { topic: 'traps' }],
  ['hi', 'धोखा कैसे होता है', { topic: 'traps' }],
  ['en', 'any scams I should know', { topic: 'traps' }],
  ['en', 'traps', { topic: 'traps' }],
  // Food and drink → staff card
  ['te', 'టీ ఎక్కడ దొరుకుతుంది', { offtopic: 'food' }],
  ['te', 'టీ', { offtopic: 'food' }],
  ['te', 'స్నాక్స్ ఎక్కడ', { offtopic: 'food' }],
  ['te', 'టిఫిన్ ఎక్కడ', { offtopic: 'food' }],
  ['te', 'మంచినీళ్ళు కావాలి', { offtopic: 'food' }],
  ['te', 'కాఫీ ఎక్కడ', { offtopic: 'food' }],
  ['hi', 'चाय कहाँ मिलेगी', { offtopic: 'food', command: null }],
  ['hi', 'नाश्ता कहाँ है', { offtopic: 'food', command: null }],
  ['hi', 'पीने का पानी', { offtopic: 'food' }],
  ['hinglish', 'chai kahan milegi', { offtopic: 'food' }],
  ['en', 'where can I get a snack', { offtopic: 'food' }],
  ['en', 'I need water', { offtopic: 'food' }],
  ['en', 'tiffin', { offtopic: 'food' }],
  // "कहाँ" (where) is not "हाँ" (yes)
  ['hi', 'काउंटर कहाँ है', { command: null }],
  // Nobody here / app help / price check / how many
  ['te', 'ఇక్కడ ఎవరూ లేరు', { topic: 'nostaff' }],
  ['hi', 'यहाँ कोई नहीं है', { topic: 'nostaff' }],
  ['hinglish', 'yahan koi nahi hai', { topic: 'nostaff' }],
  ['en', 'nobody is here', { topic: 'nostaff' }],
  ['te', 'ఆఫ్‌లైన్‌లో ఎలా వాడాలి', { topic: 'apphelp' }],
  ['te', 'ఫ్లైట్ మోడ్‌లో పని చేస్తుందా', { topic: 'apphelp' }],
  ['te', 'హోమ్ స్క్రీన్‌లో ఎలా పెట్టాలి', { topic: 'apphelp' }],
  ['hi', 'ऑफ़लाइन कैसे चलेगा', { topic: 'apphelp' }],
  ['hi', 'फ़्लाइट मोड में चलेगा क्या', { topic: 'apphelp' }],
  ['en', 'does it work in flight mode', { topic: 'apphelp' }],
  ['en', 'how do I save for my trip', { topic: 'apphelp' }],
  ['te', 'రేటు చెక్', { priceCheck: true, price: null }],
  ['hi', 'रेट चेक करना है', { priceCheck: true }],
  ['en', 'price check', { priceCheck: true }],
  ['te', '500 డాలర్లకు ఎన్ని దిర్హామ్‌లు వస్తాయి', { amountQuery: { amount: 500, from: 'USD', to: 'AED' } }],
  ['hi', '500 डॉलर के कितने दिरहम मिलेंगे', { amountQuery: { amount: 500, from: 'USD', to: 'AED' } }],
  ['hinglish', '100 dollar ke kitne baht milenge', { amountQuery: { amount: 100, from: 'USD', to: 'THB' } }],
  ['en', 'how many baht for 100 dollars', { amountQuery: { amount: 100, from: 'USD', to: 'THB' } }],
  ['en', 'how many SGD for 10000 rupees', { amountQuery: { amount: 10000, from: 'INR', to: 'SGD' } }],
  ['en', 'how many dirhams for 500', { amountQuery: { amount: 500, from: null, to: 'AED' } }],
  // ---- Syam's exact sentences from the Telugu phone test (word for word, mishearings included) ----
  ['te', 'నేను టెర్మినల్ మూడ్ లో ఉన్నాను', { terminal: 'T3' }],
  ['te', 'కానీ ఇక్కడ ఎవరూ లేరు', { topic: 'nostaff' }],
  ['te', 'ఇక్కడ ఎవరూ లేరు నేను మాట్లాడతాను', { topic: 'nostaff' }],
  ['te', 'ప్రైస్ చెక్ చేయాలనుకుంటున్నాను', { priceCheck: true, price: null }],
  ['te', 'నాకు 500 డాలర్లకి ఎన్ని ది రాములు వస్తాయి', { amountQuery: { amount: 500, from: 'USD', to: 'AED' } }],
  ['te', 'బెంగళూరు టర్నల్ వన్ లో ఏటీఎం ఎక్కడ ఉంది', { airport: 'BLR', terminal: 'T1', topic: 'atmwhere' }],
  ['te', 'నాకు ఇవన్నీ కావాలి నేను ఫ్లైట్ మోడ్ లో వెళ్తున్న ఇవన్నీ నాకు చూపించాలి', { topic: 'apphelp' }],
  // The mishearing fixes don't touch ordinary words: "రాములు" alone is a name, not dirhams
  ['te', 'రాములు గారు ఎక్కడ', { amountQuery: null, numbers: [] }],
  // ---- Changi T3 test (Telugu, exact), with Hindi and English versions ----
  ['te', 'సింగపూర్ చాంగి టెర్మినల్ 3 లో ఎన్ని ఎక్స్చేంజ్ కౌంటర్లు ఉన్నాయి', { airport: 'SIN', terminal: 'T3', topic: 'counters', amountQuery: null }],
  ['te', 'పొడవైన కారిడార్ ఉంది, జనం నడుస్తున్నారు', { stage: 'immigration', atPlace: true, command: null }],
  ['te', 'నాకు ఇప్పుడు ఒక కౌంటర్ కనిపిస్తుంది అక్కడ ఆఫీసర్స్ కూర్చునే ఉన్నారు', { stage: 'immigration', atPlace: true, command: null }],
  ['te', 'తీసుకున్నాను', { progress: true, topic: null, command: null }],
  ['te', 'బ్యాగ్ తీసుకున్నాను', { progress: true, stage: 'baggage', topic: null }],
  ['te', 'నేనెప్పుడూ హాల్లో ఉన్నాను', { stage: 'arrivals', atPlace: true }],
  ['te', 'నా దగ్గర ఇప్పుడు 1000 డాలర్లు ఉన్నాయి దానికి నాకే అంత వస్తాయి', { amountQuery: { amount: 1000, from: 'USD', to: null } }],
  ['te', 'నాకు కేవలం 1500 ఇస్తున్నారు', { offered: true, numbers: [1500] }],
  ['hi', 'सिंगापुर चांगी टर्मिनल 3 में कितने एक्सचेंज काउंटर हैं', { airport: 'SIN', terminal: 'T3', topic: 'counters', amountQuery: null }],
  ['hi', 'लंबा गलियारा है, लोग चल रहे हैं', { stage: 'immigration', atPlace: true }],
  ['hi', 'मैंने बैग ले लिया', { progress: true, stage: 'baggage' }],
  ['hi', 'मैं हॉल में हूँ', { stage: 'arrivals', atPlace: true }],
  ['hi', 'मेरे पास 1000 डॉलर हैं, कितने मिलेंगे', { amountQuery: { amount: 1000, from: 'USD', to: null } }],
  ['hi', 'वो सिर्फ़ 1500 दे रहे हैं', { offered: true, numbers: [1500] }],
  ['en', 'how many exchange counters are there at Singapore Changi terminal 3', { airport: 'SIN', terminal: 'T3', topic: 'counters', amountQuery: null }],
  ['en', 'there is a long corridor, people are walking', { stage: 'immigration', atPlace: true }],
  ['en', 'I got my bags', { progress: true, stage: 'baggage' }],
  ['en', "I'm in the hall now", { stage: 'arrivals', atPlace: true }],
  ['en', 'I have 1000 dollars, how much will I get', { amountQuery: { amount: 1000, from: 'USD', to: null } }],
  ['en', "they're giving only 1500", { offered: true, numbers: [1500] }],
  // False matches: describing people is not asking for the staff card; "taken" is not a pickup
  ['te', 'మేనేజ్మెంట్ మెంబర్స్ ఉన్నారు', { command: null, topic: null }],
  ['te', 'ఆఫీసర్స్ కూర్చున్నారు', { command: null, topic: null }],
  ['hi', 'मैनेजमेंट के लोग बैठे हैं', { command: null, topic: null }],
  ['en', 'management members are here', { command: null, topic: null }],
  ['en', 'officers are sitting', { command: null, topic: null }],
  ['en', 'the staff are busy', { command: null }],
  ['te', 'స్టాఫ్‌ని అడగాలి', { command: 'staff' }],
  ['en', 'staff', { command: 'staff' }],
  ['te', 'నేను వేచి ఉన్నాను', { command: null, topic: null, offtopic: null, stage: null }],
  ['en', 'where is the baggage belt', { stage: 'baggage', atPlace: false }],
  ['hi', 'बैगेज बेल्ट कहाँ है', { stage: 'baggage', atPlace: false }],
  ['te', 'బ్యాగేజ్ బెల్ట్ ఎక్కడ ఉంది', { stage: 'baggage', atPlace: false }],
  ['hi', 'मैं इंतज़ार कर रहा हूँ', { command: null, topic: null, offtopic: null, stage: null }],
  ['en', 'dubai terminal 3', { amountQuery: null, numbers: [] }],
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
      ['next', { kind: 'tips', mode: 'tips', has: 'Choose the local currency on screen and check the fee before you press OK', hasNot: 'final amount' }],
    ],
  },
  {
    name: 'Bengaluru T1 (Hindi / Telugu): ATM closing line',
    lang: 'hi-IN',
    turns: [['बेंगलुरु टर्मिनल १ पैसे बदलने हैं', { kind: 'confirm' }], ['हाँ', { step: 0 }], ['आगे', { step: 1 }], ['आगे', { step: 2 }],
      ['आगे', { kind: 'tips', has: 'OK दबाने से पहले फ़ीस', hasNot: 'फ़ाइनल' }]],
  },
  {
    name: 'Bengaluru T1 (Telugu): ATM closing line',
    lang: 'te-IN',
    turns: [['బెంగళూరు టెర్మినల్ 1 డబ్బు మార్చాలి', { kind: 'confirm' }], ['అవును', { step: 0 }], ['తర్వాత', { step: 1 }], ['తర్వాత', { step: 2 }],
      ['తర్వాత', { kind: 'tips', has: 'OK నొక్కే ముందు ఫీజు', hasNot: 'ఫైనల్' }]],
  },
  {
    name: 'Bengaluru T2: counter ending keeps "final amount in hand"',
    lang: 'en-IN',
    turns: [['Bengaluru terminal 2 change money', { kind: 'confirm' }], ['yes', { step: 0 }],
      ['next', { step: 1 }], ['next', { step: 2 }], ['next', { step: 3 }], ['next', { step: 4 }],
      ['next', { kind: 'tips', has: 'Ask for the final amount in hand before you pay', hasNot: 'press OK' }]],
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
  // Leftover currency and excess baggage: exact wording, spoken and shown, in each language
  { name: 'Leftover currency (English, exact wording)', lang: 'en-IN',
    turns: [['what do I do with leftover currency', { kind: 'info', has: 'Change leftover cash before you leave the city; airport counters may ask for a minimum amount. Indian residents can keep some foreign currency for the next trip.' }]] },
  { name: 'Leftover currency (Hindi)', lang: 'hi-IN',
    turns: [['बचे हुए पैसे का क्या करूँ', { kind: 'info', has: 'शहर छोड़ने से पहले बचे हुए नकद पैसे बदल लीजिए' }]] },
  { name: 'Leftover currency (Telugu)', lang: 'te-IN',
    turns: [['మిగిలిన డబ్బు ఏం చేయాలి', { kind: 'info', has: 'నగరం విడిచి వెళ్ళే ముందే మిగిలిన నగదు మార్చుకోండి' }]] },
  { name: 'Excess baggage (English, exact wording)', lang: 'en-IN',
    turns: [['I have excess baggage', { kind: 'info', has: 'Airline counters usually accept cards; keep your card handy instead of cash.' }]] },
  { name: 'Excess baggage (Hindi)', lang: 'hi-IN',
    turns: [['अतिरिक्त सामान का पैसा देना है', { kind: 'info', has: 'एयरलाइन काउंटर आमतौर पर कार्ड लेते हैं' }]] },
  { name: 'Excess baggage (Telugu)', lang: 'te-IN',
    turns: [['అదనపు లగేజీ ఉంది', { kind: 'info', has: 'ఎయిర్‌లైన్ కౌంటర్లు సాధారణంగా కార్డులు తీసుకుంటాయి' }]] },
  // ---- Round 5: Syam's Telugu phone test (and Hindi / English versions) ----
  { name: 'Context switch (Telugu): Dubai tips → "Bengaluru T1 ATM ఎక్కడ" → Bengaluru T1 ATM answer', lang: 'te-IN',
    turns: [['దుబాయ్ టెర్మినల్ మూడ్ డబ్బు మార్చాలి', { kind: 'confirm', airport: 'DXB', terminal: 'T3' }], ['అవును', { mode: 'route' }],
      ['చిట్కాలు చెప్పండి', { kind: 'tips', mode: 'tips' }],
      ['బెంగళూరు టెర్మినల్ 1 ఏటీఎం ఎక్కడ', { kind: 'info', airport: 'BLR', terminal: 'T1', mode: 'info', has: 'కర్బ్‌సైడ్' }]] },
  { name: 'Context switch (Hindi): Dubai traps → "Bengaluru T1 ATM kahan hai"', lang: 'hi-IN',
    turns: [['दुबई टर्मिनल ३ पैसे बदलने हैं', { kind: 'confirm' }], ['हाँ', { mode: 'route' }], ['धोखे बताइए', { kind: 'tips' }],
      ['बेंगलुरु टर्मिनल 1 एटीएम कहाँ है', { kind: 'info', airport: 'BLR', terminal: 'T1', has: 'कर्बसाइड' }]] },
  { name: 'Context switch (English): Dubai tips → "Bengaluru T1 where is the ATM"', lang: 'en-IN',
    turns: [['Dubai terminal 3 change money', { kind: 'confirm' }], ['yes', { mode: 'route' }], ['tips', { kind: 'tips' }],
      ['Bengaluru T1 where is the ATM', { kind: 'info', airport: 'BLR', terminal: 'T1', has: 'kerbside' }],
      ['change money', { kind: 'confirm', airport: 'BLR', terminal: 'T1' }]] },
  { name: 'Main intent leaves tips (Telugu): tips → "సిమ్ కావాలి" → SIM route', lang: 'te-IN',
    turns: [['దుబాయ్ టెర్మినల్ 1 డబ్బు మార్చాలి', { kind: 'confirm' }], ['అవును', { mode: 'route' }], ['చిట్కాలు', { kind: 'tips' }],
      ['సిమ్ కావాలి', { kind: 'step', mode: 'route', step: 0, has: 'సిమ్' }]] },
  { name: 'How many (Telugu): fair amount + "counters give a bit less"', lang: 'te-IN',
    turns: [['500 డాలర్లకు ఎన్ని దిర్హామ్‌లు వస్తాయి', { kind: 'amount', has: '1,836' }]] },
  { name: 'How many (Hindi)', lang: 'hi-IN',
    turns: [['500 डॉलर के कितने दिरहम मिलेंगे', { kind: 'amount', has: 'काउंटर थोड़ा कम देते हैं' }]] },
  { name: 'How many (English): fair amount', lang: 'en-IN',
    turns: [['how many dirhams for 500 dollars', { kind: 'amount', has: 'about 1,836 dirhams. Counters give a bit less; ask for the final amount.' }]] },
  { name: 'How many with only the target currency: uses rupees as the amount', lang: 'en-IN',
    turns: [['how many dirhams for 1000', { kind: 'amount', has: 'rupees' }]] },
  { name: 'How many at Bangkok without a currency: uses baht', lang: 'en-IN',
    turns: [['Bangkok', { kind: 'confirm' }], ['how much will I get for 100 dollars', { kind: 'amount', has: 'baht' }]] },
  { name: 'Price check, no numbers (Telugu / Hindi / English): asks for both amounts with an example', lang: 'te-IN',
    turns: [['రేటు చెక్', { kind: 'ask', has: '500 డాలర్లకు 1700' }]] },
  { name: 'Price check, no numbers (Hindi)', lang: 'hi-IN', turns: [['रेट चेक करना है', { kind: 'ask', has: 'दोनों रकम बताइए' }]] },
  { name: 'Price check, no numbers (English)', lang: 'en-IN', turns: [['price check', { kind: 'ask', has: 'for example' }]] },
  { name: 'Nobody here (Telugu): info desk signs + card', lang: 'te-IN', turns: [['ఇక్కడ ఎవరూ లేరు', { kind: 'info', has: 'ఇన్ఫర్మేషన్ డెస్క్' }]] },
  { name: 'Nobody here (Hindi)', lang: 'hi-IN', turns: [['यहाँ कोई नहीं है', { kind: 'info', has: 'इन्फ़ॉर्मेशन डेस्क' }]] },
  { name: 'Nobody here (English)', lang: 'en-IN', turns: [['nobody is here', { kind: 'info', has: "'i' signs" }]] },
  { name: 'App help (Telugu): Save for my trip + home screen', lang: 'te-IN', turns: [['ఆఫ్‌లైన్‌లో ఎలా వాడాలి', { kind: 'info', has: 'Add to home screen' }]] },
  { name: 'App help (Hindi)', lang: 'hi-IN', turns: [['फ़्लाइट मोड में चलेगा क्या', { kind: 'info', has: 'सेव करें' }]] },
  { name: 'App help (English)', lang: 'en-IN', turns: [['does it work in flight mode', { kind: 'info', has: "Save for my trip" }]] },
  { name: 'ATM where, no data (Singapore): safe answer, not tips', lang: 'en-IN',
    turns: [['Singapore terminal 1', { kind: 'confirm' }], ['where is the ATM', { kind: 'info', mode: 'confirm', has: 'follow the ATM signs' }]] },
  { name: 'ATM where, with data (Delhi T3, Telugu)', lang: 'te-IN',
    turns: [['ఢిల్లీ టెర్మినల్ 3 ఏటీఎం ఎక్కడ', { kind: 'info', has: 'ఎబిక్స్‌క్యాష్' }]] },
  { name: 'ATM tips are still a list', lang: 'en-IN', turns: [['ATM tips', { kind: 'tips', mode: 'tips', has: '1 of 4' }]] },
  { name: 'Traps in Telugu while reading money tips: switches to traps', lang: 'te-IN',
    turns: [['చిట్కాలు', { kind: 'tips', has: '3లో 1' }], ['ట్రాప్స్ చెప్పండి', { kind: 'tips', has: '5లో 1' }]] },
  { name: 'Traps (Hindi "जाल") never gives tips', lang: 'hi-IN', turns: [['जाल बताइए', { kind: 'tips', has: '5 में से' }]] },
  { name: 'Chai while reading traps (Hindi): staff card, not "next"', lang: 'hi-IN',
    turns: [['धोखे बताइए', { kind: 'tips' }], ['चाय कहाँ मिलेगी', { kind: 'offtopic' }]] },
  { name: 'Tea (Telugu): staff card', lang: 'te-IN', turns: [['టీ ఎక్కడ దొరుకుతుంది', { kind: 'offtopic' }]] },
  // ---- Syam's exact Telugu phone-test sentences, as one conversation and one by one ----
  { name: 'Syam phone test 1: "నేను టెర్మినల్ మూడ్ లో ఉన్నాను" answers the terminal question', lang: 'te-IN',
    turns: [['దుబాయ్ డబ్బు మార్చాలి', { kind: 'ask', expecting: 'terminal' }],
      ['నేను టెర్మినల్ మూడ్ లో ఉన్నాను', { kind: 'confirm', airport: 'DXB', terminal: 'T3' }]] },
  { name: 'Syam phone test 2: "కానీ ఇక్కడ ఎవరూ లేరు" → info desk + card', lang: 'te-IN',
    turns: [['కానీ ఇక్కడ ఎవరూ లేరు', { kind: 'info', has: 'ఇన్ఫర్మేషన్ డెస్క్' }]] },
  { name: 'Syam phone test 3: "ఇక్కడ ఎవరూ లేరు నేను మాట్లాడతాను" → info desk + card', lang: 'te-IN',
    turns: [['ఇక్కడ ఎవరూ లేరు నేను మాట్లాడతాను', { kind: 'info', has: 'ఇన్ఫర్మేషన్ డెస్క్' }]] },
  { name: 'Syam phone test 4: "ప్రైస్ చెక్ చేయాలనుకుంటున్నాను" → asks for both amounts', lang: 'te-IN',
    turns: [['ప్రైస్ చెక్ చేయాలనుకుంటున్నాను', { kind: 'ask', has: 'రెండు మొత్తాలూ చెప్పండి' }]] },
  { name: 'Syam phone test 5: "…ఎన్ని ది రాములు వస్తాయి" → about 1,836 dirhams', lang: 'te-IN',
    turns: [['నాకు 500 డాలర్లకి ఎన్ని ది రాములు వస్తాయి', { kind: 'amount', has: '1,836' }]] },
  { name: 'Syam phone test 6: "బెంగళూరు టర్నల్ వన్ లో ఏటీఎం ఎక్కడ ఉంది" → Bengaluru T1 ATMs', lang: 'te-IN',
    turns: [['బెంగళూరు టర్నల్ వన్ లో ఏటీఎం ఎక్కడ ఉంది', { kind: 'info', airport: 'BLR', terminal: 'T1', has: 'కర్బ్‌సైడ్' }]] },
  { name: 'Syam phone test 7: "…ఫ్లైట్ మోడ్ లో వెళ్తున్న…" → Save for my trip + home screen', lang: 'te-IN',
    turns: [['నాకు ఇవన్నీ కావాలి నేను ఫ్లైట్ మోడ్ లో వెళ్తున్న ఇవన్నీ నాకు చూపించాలి', { kind: 'info', has: 'Add to home screen' }]] },
  { name: 'Syam phone test, whole session in order (Dubai T3 → tips → each sentence)', lang: 'te-IN',
    turns: [
      ['దుబాయ్ డబ్బు మార్చాలి', { kind: 'ask', expecting: 'terminal' }],
      ['నేను టెర్మినల్ మూడ్ లో ఉన్నాను', { kind: 'confirm', terminal: 'T3' }],
      ['అవును', { kind: 'step', mode: 'route' }],
      ['కానీ ఇక్కడ ఎవరూ లేరు', { kind: 'info', mode: 'route' }],
      ['ఇక్కడ ఎవరూ లేరు నేను మాట్లాడతాను', { kind: 'info', mode: 'route' }],
      ['ప్రైస్ చెక్ చేయాలనుకుంటున్నాను', { kind: 'ask', mode: 'route' }],
      ['నాకు 500 డాలర్లకి ఎన్ని ది రాములు వస్తాయి', { kind: 'amount', has: '1,836' }],
      ['చిట్కాలు చెప్పండి', { kind: 'tips', mode: 'tips' }],
      ['బెంగళూరు టర్నల్ వన్ లో ఏటీఎం ఎక్కడ ఉంది', { kind: 'info', airport: 'BLR', terminal: 'T1', mode: 'info', has: 'కర్బ్‌సైడ్' }],
      ['నాకు ఇవన్నీ కావాలి నేను ఫ్లైట్ మోడ్ లో వెళ్తున్న ఇవన్నీ నాకు చూపించాలి', { kind: 'info', has: 'Add to home screen' }],
    ] },
  // ---- Changi T3: full conversations from landing to the counter (Telugu exact, Hindi, English) ----
  { name: 'Changi T3 (Telugu, exact sentences): counters → guide → corridor → officers → taken → bags → hall → 1000 → 1500', lang: 'te-IN',
    turns: [
      ['సింగపూర్ చాంగి టెర్మినల్ 3 లో ఎన్ని ఎక్స్చేంజ్ కౌంటర్లు ఉన్నాయి', { kind: 'info', airport: 'SIN', terminal: 'T3', expecting: 'confirm', has: 'ట్రావెలెక్స్' }],
      ['అవును', { kind: 'step', mode: 'route', step: 0 }],
      ['పొడవైన కారిడార్ ఉంది, జనం నడుస్తున్నారు', { kind: 'step', mode: 'route', step: 0 }],
      ['నాకు ఇప్పుడు ఒక కౌంటర్ కనిపిస్తుంది అక్కడ ఆఫీసర్స్ కూర్చునే ఉన్నారు', { kind: 'step', step: 0 }],
      ['తీసుకున్నాను', { kind: 'step', step: 1 }],
      ['బ్యాగ్ తీసుకున్నాను', { kind: 'step', step: 2 }],
      ['నేనెప్పుడూ హాల్లో ఉన్నాను', { kind: 'step', step: 3, has: 'ట్రావెలెక్స్' }],
      ['నా దగ్గర ఇప్పుడు 1000 డాలర్లు ఉన్నాయి దానికి నాకే అంత వస్తాయి', { kind: 'amount', mode: 'route', step: 3, has: 'సింగపూర్ డాలర్లు' }],
      ['నాకు కేవలం 1500 ఇస్తున్నారు', { kind: 'price', mode: 'route', has: '1,500 సింగపూర్ డాలర్లు' }],
      ['తర్వాత', { kind: 'step', step: 4, has: 'రసీదు' }],
    ] },
  { name: 'Changi T3 (Hindi): landing to the counter', lang: 'hi-IN',
    turns: [
      ['सिंगापुर चांगी टर्मिनल 3 में कितने एक्सचेंज काउंटर हैं', { kind: 'info', airport: 'SIN', terminal: 'T3', expecting: 'confirm', has: 'ट्रैवलेक्स' }],
      ['हाँ', { kind: 'step', mode: 'route', step: 0 }],
      ['लंबा गलियारा है, लोग चल रहे हैं', { kind: 'step', step: 0 }],
      ['हो गया', { kind: 'step', step: 1 }],
      ['मैंने बैग ले लिया', { kind: 'step', step: 2 }],
      ['मैं हॉल में हूँ', { kind: 'step', step: 3 }],
      ['मेरे पास 1000 डॉलर हैं, कितने मिलेंगे', { kind: 'amount', has: 'सिंगापुर डॉलर' }],
      ['वो सिर्फ़ 1500 दे रहे हैं', { kind: 'price', has: '1,500' }],
    ] },
  { name: 'Changi T3 (English): landing to the counter', lang: 'en-IN',
    turns: [
      ['how many exchange counters are there at Singapore Changi terminal 3', { kind: 'info', airport: 'SIN', terminal: 'T3', expecting: 'confirm', has: 'One exchange counter is listed' }],
      ['yes', { kind: 'step', mode: 'route', step: 0 }],
      ['there is a long corridor, people are walking', { kind: 'step', step: 0 }],
      ['done', { kind: 'step', step: 1 }],
      ['I got my bags', { kind: 'step', step: 2 }],
      ["I'm in the hall now", { kind: 'step', step: 3, has: 'Travelex' }],
      ['I have 1000 dollars, how much will I get', { kind: 'amount', has: 'Singapore dollars' }],
      ["they're giving only 1500", { kind: 'price', has: '1,500 Singapore dollars for 1,000' }],
      ['next', { kind: 'step', step: 4, has: 'receipt' }],
      ['next', { kind: 'tips', mode: 'tips' }],
    ] },
  { name: 'Progress never gives tips: tips mid-route, then "తీసుకున్నాను" → next step', lang: 'te-IN',
    turns: [
      ['సింగపూర్ టెర్మినల్ 3 డబ్బు మార్చాలి', { kind: 'confirm' }],
      ['అవును', { kind: 'step', step: 0 }],
      ['చిట్కాలు చెప్పండి', { kind: 'tips', mode: 'tips' }],
      ['తీసుకున్నాను', { kind: 'step', mode: 'route', step: 1 }],
    ] },
  { name: '"I\'m in the hall" before starting: starts the route there', lang: 'en-IN',
    turns: [
      ['Singapore terminal 3', { kind: 'confirm' }],
      ["I'm already in the hall", { kind: 'step', mode: 'route', step: 3 }],
    ] },
  { name: 'Lost, no loop: two unclear answers → signs + staff card (never a third question)', lang: 'te-IN',
    turns: [
      ['నేను ఎక్కడ ఉన్నానో తెలియదు', { kind: 'ask' }],
      ['సింగపూర్ టెర్మినల్ 3', { kind: 'confirm' }],
      ['అవును', { kind: 'ask', expecting: 'stage' }],
      ['ఏమో తెలియదు', { kind: 'ask', expecting: 'stage', has: 'ఉదాహరణకు' }],
      ['అర్థం కావట్లేదు', { kind: 'info', expecting: null, has: 'Arrivals' }],
    ] },
  { name: 'Lost: free description (escalators) is matched', lang: 'en-IN',
    turns: [
      ["I'm lost", { kind: 'ask' }],
      ['Bangkok', { kind: 'confirm' }],
      ['yes', { kind: 'ask', expecting: 'stage' }],
      ['I can see escalators and a corridor', { kind: 'step', mode: 'route', step: 0 }],
    ] },
  { name: 'Lost: "I can see shops" is a place (baggage), not the shops card', lang: 'en-IN',
    turns: [
      ["I'm lost", { kind: 'ask' }],
      ['Bangkok', { kind: 'confirm' }],
      ['yes', { kind: 'ask', expecting: 'stage' }],
      ['I can see some shops and trolleys', { kind: 'step', mode: 'route', step: 1 }],
    ] },
  { name: 'Confirm, no loop: two unclear answers → "tap Yes or No"', lang: 'en-IN',
    turns: [
      ['Dubai terminal 3', { kind: 'confirm' }],
      ['hmm', { kind: 'confirm', has: 'Is that right' }],
      ['what', { kind: 'confirm', has: 'tap Yes or No' }],
    ] },
  { name: 'Price check example uses the airport currency (SGD at Singapore)', lang: 'en-IN',
    turns: [
      ['Singapore terminal 1', { kind: 'confirm' }],
      ['price check', { kind: 'ask', has: 'Singapore dollars for 100 US dollars' }],
    ] },
  { name: 'Price check example uses baht at Bangkok (Telugu)', lang: 'te-IN',
    turns: [
      ['బ్యాంకాక్', { kind: 'confirm' }],
      ['రేటు చెక్', { kind: 'ask', has: 'బాట్' }],
    ] },
  { name: 'Price check example uses rupees at Delhi (Hindi)', lang: 'hi-IN',
    turns: [
      ['दिल्ली टर्मिनल 3', { kind: 'confirm' }],
      ['रेट चेक', { kind: 'ask', has: 'रुपये' }],
    ] },
  { name: 'Price check after an amount: asks what they are offering for it', lang: 'en-IN',
    turns: [
      ['Dubai terminal 1', { kind: 'confirm' }],
      ['I have 500 dollars, how much will I get', { kind: 'amount', has: 'dirhams' }],
      ['price check', { kind: 'ask', has: 'your 500 US dollars' }],
      ['they are giving 1700', { kind: 'price', has: '1,700 dirhams' }],
    ] },
  { name: 'Counters listed at Delhi T3 (two counters, rates not compared)', lang: 'en-IN',
    turns: [
      ['which exchange counters are at Delhi terminal 3', { kind: 'info', has: 'EbixCash' }],
    ] },
  { name: 'No counter at Bengaluru T1: says so', lang: 'en-IN',
    turns: [
      ['how many exchange counters at Bengaluru terminal 1', { kind: 'info', has: 'No exchange counter is listed' }],
    ] },
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
        else if (k === 'hasNot') { if (out.reply.text.includes(v)) problems.push(`turn ${i + 1} "${text}": reply should not contain "${v}" → ${out.reply.text}`); }
        else if (got[k] !== v) problems.push(`turn ${i + 1} "${text}": ${k} wanted ${v}, got ${got[k]}`);
      }
    });
    check('flow', flow.name, problems.length === 0, problems.join(' | '));
  }

  return results;
}
