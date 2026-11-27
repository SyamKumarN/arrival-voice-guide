// text.js — shared helpers to clean up what the speech engine heard.
// Works the same in the browser and in Node (plain ES module, no DOM).

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const TELUGU_DIGITS = '౦౧౨౩౪౫౬౭౮౯';

/** Turn Hindi and Telugu digits into 0-9. */
export function asciiDigits(s) {
  let out = '';
  for (const ch of s) {
    const d = DEVANAGARI_DIGITS.indexOf(ch);
    const t = TELUGU_DIGITS.indexOf(ch);
    out += d >= 0 ? String(d) : t >= 0 ? String(t) : ch;
  }
  return out;
}

/**
 * Normalise a sentence and split it into tokens.
 *  - lower case, Indian-script digits -> 0-9
 *  - "1,700" -> "1700", but "3.67" keeps its decimal point
 *  - "t3" -> "t 3", "500usd" -> "500 usd", "$500" -> "$ 500"
 *  - punctuation and the Hindi full stop (।) become spaces
 *  - zero-width joiners (common in Telugu, e.g. "హాల్‌లో") are removed
 */
export function normalise(raw) {
  let s = String(raw || '').normalize('NFC').toLowerCase();
  s = asciiDigits(s);
  s = s.replace(/[​-‍﻿]/g, '');
  s = s.replace(/[’‘`]/g, "'");
  s = s.replace(/(\d),(?=\d{2,3}\b)/g, '$1');      // thousand / lakh separators
  s = s.replace(/([$₹€£])/g, ' $1 ');
  s = s.replace(/[।॥|]/g, ' ');
  s = s.replace(/[^\p{L}\p{M}\p{N}\s.$₹€£']/gu, ' ');
  s = s.replace(/(?<!\d)\.|\.(?!\d)/g, ' ');        // dots that are not decimals
  s = s.replace(/'/g, '');                            // can't -> cant
  s = s.replace(/(\d)([\p{L}])/gu, '$1 $2');
  s = s.replace(/([\p{L}\p{M}])(\d)/gu, '$1 $2');
  s = s.replace(/\s+/g, ' ').trim();
  const tokens = s ? s.split(' ') : [];
  return { norm: s, tokens };
}

const LATIN = /^[a-z0-9 .$]+$/;

/**
 * True if the sentence contains any of the phrases.
 * Latin single words must match a whole token (so "ok" doesn't match "book").
 * Latin phrases must match whole words. Hindi/Telugu phrases match anywhere,
 * because those languages attach endings to words ("दुबई", "దుబాయ్‌లో").
 */
export function hasAny(parsed, phrases) {
  return phrases.some((p) => matches(parsed, p));
}

export function matches({ norm, tokens }, phrase) {
  if (LATIN.test(phrase)) {
    if (!phrase.includes(' ')) return tokens.includes(phrase);
    return (' ' + norm + ' ').includes(' ' + phrase + ' ');
  }
  // Hindi / Telugu: a single word matches at the start of a word, so endings still
  // match ("మోసాలు" → "మోస") but "हाँ" (yes) doesn't match inside "कहाँ" (where).
  if (!phrase.includes(' ')) return tokens.some((t) => t.startsWith(phrase));
  return norm.includes(phrase);
}

/** Short language code from a speech locale: "hi-IN" -> "hi". */
export function short(lang) {
  return String(lang || 'en').slice(0, 2);
}

/** Pick the right language from a {en, hi, te} object, falling back to English. */
export function pick(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[short(lang)] || obj.en || '';
}
