// numbers.js — read amounts said in digits or in words.
// English: "five hundred", "seventeen hundred", "two thousand five hundred"
// Hinglish: "satrah sau", "do hazaar paanch sau"
// Hindi:    "पाँच सौ", "सत्रह सौ"
// Telugu:   "ఐదు వందలు", "ఐదువందలు", "పదిహేడు వందల"

// Words that are always numbers.
export const NUMBER_WORDS = {
  // English
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  // Hinglish (Hindi in Latin letters)
  ek: 1, teen: 3, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, aath: 8,
  gyarah: 11, barah: 12, baarah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16,
  satrah: 17, sattrah: 17, satra: 17, atharah: 18, athara: 18, unnis: 19, bees: 20,
  pachees: 25, pachchis: 25, tees: 30, chalees: 40, chalis: 40, pachaas: 50, pachas: 50,
  sattar: 70, assi: 80, nabbe: 90,
  // Hindi (Devanagari)
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5, 'छह': 6, 'छः': 6, 'छे': 6,
  'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14,
  'पंद्रह': 15, 'पन्द्रह': 15, 'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'पच्चीस': 25, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
  // Telugu
  'ఒకటి': 1, 'ఒక': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'అయిదు': 5, 'ఆరు': 6,
  'ఏడు': 7, 'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10, 'పదిహేను': 15, 'పదహారు': 16,
  'పదిహేడు': 17, 'పద్దెనిమిది': 18, 'ఇరవై': 20, 'ముప్పై': 30, 'నలభై': 40, 'యాభై': 50,
};

// Hinglish words that are also ordinary words ("do", "nau" = now, "das").
// They only count as numbers right before a multiplier or a currency word.
export const AMBIGUOUS_WORDS = { do: 2, saat: 7, nau: 9, das: 10, char: 4, che: 6, saath: 60 };

export const MULTIPLIERS = {
  hundred: 100, sau: 100, so: 100, 'सौ': 100, 'వంద': 100, 'వందలు': 100, 'వందల': 100,
  thousand: 1000, hazaar: 1000, hazar: 1000, hajar: 1000, hajaar: 1000, k: 1000,
  'हज़ार': 1000, 'हजार': 1000, 'వెయ్యి': 1000, 'వేలు': 1000, 'వేల': 1000,
  lakh: 100000, lac: 100000, 'लाख': 100000, 'లక్ష': 100000, 'లక్షల': 100000,
};

// Telugu often joins number and multiplier: "ఐదువందలు" = "ఐదు వందలు".
const JOINED_SUFFIXES = ['వందలు', 'వందల', 'వంద', 'వేలు', 'వేల', 'వెయ్యి'];

/** Split joined Telugu number words so the rest of the code sees two tokens. */
export function splitJoined(tokens) {
  const out = [];
  for (const t of tokens) {
    let done = false;
    if (!(t in NUMBER_WORDS) && !(t in MULTIPLIERS)) {
      for (const suf of JOINED_SUFFIXES) {
        if (t.endsWith(suf) && t.length > suf.length) {
          const head = t.slice(0, -suf.length);
          if (head in NUMBER_WORDS) { out.push(head, suf); done = true; break; }
        }
      }
    }
    if (!done) out.push(t);
  }
  return out;
}

const isDigits = (t) => /^\d+(\.\d+)?$/.test(t);

/** The plain value of a token, or null if it is not a number word/digits. */
function unitValue(tokens, i, isCurrency) {
  const t = tokens[i];
  if (isDigits(t)) return parseFloat(t);
  if (t in NUMBER_WORDS) return NUMBER_WORDS[t];
  if (t in AMBIGUOUS_WORDS) {
    const next = tokens[i + 1];
    if (next && (next in MULTIPLIERS || isCurrency(next))) return AMBIGUOUS_WORDS[t];
  }
  return null;
}

/**
 * Find every number in a token list.
 * Returns [{ value, start, end }] where start/end are token indexes (inclusive).
 * isCurrency(token) helps decide if an ambiguous word like "do" is a number.
 */
export function findNumbers(tokens, isCurrency = () => false) {
  const found = [];
  let i = 0;
  while (i < tokens.length) {
    const first = unitValue(tokens, i, isCurrency);
    const firstIsMult = tokens[i] in MULTIPLIERS && tokens[i] !== 'k' && tokens[i] !== 'so';
    if (first === null && !firstIsMult) { i++; continue; }

    // Read one run of number tokens: "do hazaar paanch sau" -> 2500
    let total = 0, cur = 0, j = i, used = false;
    while (j < tokens.length) {
      const t = tokens[j];
      const v = unitValue(tokens, j, isCurrency);
      if (v !== null) {
        const fits = !used || cur === 0 ||
          (cur % 100 === 0 && v < 100) ||               // "five hundred twenty"
          (cur % 10 === 0 && cur < 100 && v < 10);        // "twenty five"
        if (!fits) break;
        cur += v; used = true; j++;
        continue;
      }
      if (t in MULTIPLIERS && (used || j === i)) {
        // "so"/"k" only count straight after a number ("17 so", "5k")
        if ((t === 'so' || t === 'k') && !used) break;
        const m = MULTIPLIERS[t];
        if (m === 100) cur = (cur || 1) * 100;
        else { total += (cur || 1) * m; cur = 0; }
        used = true; j++;
        continue;
      }
      if ((t === 'and' || t === 'aur' || t === 'और') && used && j + 1 < tokens.length &&
          unitValue(tokens, j + 1, isCurrency) !== null) { j++; continue; }
      break;
    }
    if (used) found.push({ value: total + cur, start: i, end: j - 1 });
    i = Math.max(j, i + 1);
  }
  return found;
}

/** Convenience: the first number in a sentence's tokens, or null. */
export function firstNumber(tokens) {
  const n = findNumbers(splitJoined(tokens));
  return n.length ? n[0].value : null;
}
