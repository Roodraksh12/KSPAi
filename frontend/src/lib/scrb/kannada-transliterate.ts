/**
 * Kannada Transliteration & Romanized Detection Utility
 *
 * Enables officers to speak or type in Kannada or Kanglish (Romanized Kannada)
 * even when the browser speech recognition or keyboard is set to English.
 */

// Common Kanglish words, stems, and police/legal terms for detection
const KANGLISH_WORD_MAP: Record<string, string> = {
  // Questions
  "hege": "ಹೇಗೆ",
  "haage": "ಹಾಗೆ",
  "heli": "ಹೇಳಿ",
  "keli": "ಕೇಳಿ",
  "yaru": "ಯಾರು",
  "yaaru": "ಯಾರು",
  "enu": "ಏನು",
  "yenu": "ಏನು",
  "yavaga": "ಯಾವಾಗ",
  "yaavaga": "ಯಾವಾಗ",
  "elli": "ಎಲ್ಲಿ",
  "yelli": "ಎಲ್ಲಿ",
  "eshtu": "ಎಷ್ಟು",
  
  // Pronouns
  "naanu": "ನಾನು",
  "nanage": "ನನಗೆ",
  "nanna": "ನನ್ನ",
  "namma": "ನಮ್ಮ",
  "neevu": "ನೀವು",
  "nimma": "ನಿಮ್ಮ",
  "avanu": "ಅವನು",
  "avalu": "ಅವಳು",
  "avaru": "ಅವರು",
  "idu": "ಇದು",
  "adhu": "ಅದು",
  "adu": "ಅದು",
  "ivaru": "ಇವರು",
  
  // Common Verbs & Particles
  "beku": "ಬೇಕು",
  "beda": "ಬೇಡ",
  "aayithu": "ಆಯಿತು",
  "ayithu": "ಆಯಿತು",
  "aagide": "ಆಗಿದೆ",
  "agide": "ಆಗಿದೆ",
  "ide": "ಇದೆ",
  "illa": "ಇಲ್ಲ",
  "maadi": "ಮಾಡಿ",
  "madi": "ಮಾಡಿ",
  "madide": "ಮಾಡಿದೆ",
  "nodide": "ನೋಡಿದೆ",
  "thiliyabeku": "ತಿಳಿಯಬೇಕು",
  "tiliyabeku": "ತಿಳಿಯಬೇಕು",
  "kodi": "ನೀಡಿ",
  "bhoomi": "ಭೂಮಿ",
  "hosa": "ಹೊಸ",
  "dakhalu": "ದಾಖಲು",
  "varadi": "ವರದಿ",
  "shikshe": "ಶಿಕ್ಷೆ",
  "jamenu": "ಜಾಮೀನು",
  "bhandana": "ಬಂಧನ",
  "vicharane": "ವಿಚಾರಣೆ",
  "ghatane": "ಘಟನೆ",
  "mahiti": "ಮಾಹಿತಿ",
  "namaskara": "ನಮಸ್ಕಾರ",
  "hegiddira": "ಹೇಗಿದ್ದೀರಾ",
  "gotilla": "ಗೊತ್ತಿಲ್ಲ",
  "gothilla": "ಗೊತ್ತಿಲ್ಲ",
  "thili": "ತಿಳಿ",
  "kelu": "ಕೇಳು",
  "nodi": "ನೋಡಿ",

  // Police & Legal Terms
  "case": "ಪ್ರಕರಣ (ಕೇಸ್)",
  "cases": "ಪ್ರಕರಣಗಳು",
  "fir": "ಎಫ್‌ಐಆರ್",
  "aropi": "ಆರೋಪಿ",
  "aropigalu": "ಆರೋಪಿಗಳು",
  "durudhara": "ದೂರುದಾರ",
  "duru": "ದೂರು",
  "thane": "ಠಾಣೆ",
  "police": "ಪೊಲೀಸ್",
  "kanunu": "ಕಾನೂನು",
  "kalan": "ಕಲಂ",
  "kalam": "ಕಲಂ",
  "kalangalu": "ಕಲಂಗಳು",
  "sakshi": "ಸಾಕ್ಷಿ",
  "sakshigalu": "ಸಾಕ್ಷಿಗಳು",
  "panchaname": "ಪಂಚನಾಮೆ",
  "mahazar": "ಮಹಜರು",
  "bagge": "ಬಗ್ಗೆ",
  "alli": "ಅಲ್ಲಿ",
  "inda": "ಇಂದ",
  "dalli": "ದಲ್ಲಿ",
  "annu": "ಅನ್ನು",
  "jothe": "ಜೊತೆ",
  "kannada": "ಕನ್ನಡ",
  "kannadadalli": "ಕನ್ನಡದಲ್ಲಿ",
  "bns": "ಬಿಎನ್‌ಎಸ್",
  "ipc": "ಐಪಿಸಿ",
  "crpc": "ಸಿಆರ್‌ಪಿಸಿ",
  "bnss": "ಬಿಎನ್‌ಎಸ್‌ಎಸ್",
  "sho": "ಠಾಣಾಧಿಕಾರಿ (SHO)",
  "sp": "ಎಸ್ಪಿ (SP)",
  "io": "ತನಿಖಾಧಿಕಾರಿ (IO)",
  "diary": "ದಿನಚರಿ",
  "tanikhe": "ತನಿಖೆ",
  "chargesheet": "ದೋಷಾರೋಪಣಾ ಪಟ್ಟಿ",
  "summary": "ಸಾರಾಂಶ",
};

// Vowels (Initial / Standalone)
const VOWELS_INITIAL: Record<string, string> = {
  "aa": "ಆ", "a": "ಅ", "ee": "ಈ", "ii": "ಈ", "i": "ಇ",
  "oo": "ಊ", "uu": "ಊ", "u": "ಉ", "e": "ಎ", "ai": "ಐ",
  "o": "ಒ", "au": "ಔ", "ou": "ಔ",
};

// Vowel Matras (attached to consonants)
const VOWEL_MATRAS: Record<string, string> = {
  "aa": "ಾ", "a": "", "ee": "ೀ", "ii": "ೀ", "i": "ಿ",
  "oo": "ೂ", "uu": "ೂ", "u": "ು", "e": "ೆ", "ai": "ೈ",
  "o": "ೊ", "au": "ೌ", "ou": "ೌ",
};

// Consonant base characters
const CONSONANTS: [string, string][] = [
  ["kh", "ಖ"], ["k", "ಕ"],
  ["gh", "ಘ"], ["g", "ಗ"],
  ["chh", "ಛ"], ["ch", "ಚ"],
  ["jh", "ಝ"], ["j", "ಜ"],
  ["th", "ತ"], ["t", "ಟ"],
  ["dh", "ಧ"], ["d", "ದ"],
  ["ph", "ಫ"], ["p", "ಪ"],
  ["bh", "ಭ"], ["b", "ಬ"],
  ["sh", "ಶ"], ["s", "ಸ"],
  ["h", "ಹ"], ["m", "ಮ"],
  ["y", "ಯ"], ["r", "ರ"],
  ["l", "ಲ"], ["v", "ವ"],
  ["w", "ವ"], ["n", "ನ"],
];

/**
 * Checks if a string in Latin script is likely Romanized Kannada (Kanglish).
 */
export function isRomanizedKannada(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  // If it already has Kannada Unicode characters, no need to detect
  if (/[ಀ-೿]/.test(text)) return false;

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return false;

  let matches = 0;
  for (const word of words) {
    if (KANGLISH_WORD_MAP[word]) {
      matches++;
      continue;
    }
    // Check suffixes like -dalli, -alli, -inda, -annu, -ge
    if (
      word.endsWith("dalli") ||
      word.endsWith("alli") ||
      word.endsWith("inda") ||
      word.endsWith("annu") ||
      word.endsWith("galu")
    ) {
      matches++;
    }
  }

  // If even 1 strong signature word is present in a short sentence, or >= 25% of words match
  return matches >= 1 && (matches >= 2 || words.length <= 4 || matches / words.length >= 0.25);
}

/**
 * Phonetically transliterates a single Romanized word into Kannada script.
 */
function transliterateWord(rawWord: string): string {
  const clean = rawWord.toLowerCase();
  
  // Exact dictionary match
  if (KANGLISH_WORD_MAP[clean]) {
    return KANGLISH_WORD_MAP[clean];
  }

  // Handle common suffixes (e.g. casenalli -> ಕೇಸ್‌ನಲ್ಲಿ)
  const suffixes: [string, string][] = [
    ["dalli", "ದಲ್ಲಿ"],
    ["nalli", "ನಲ್ಲಿ"],
    ["alli", "ನಲ್ಲಿ"],
    ["inda", "ಯಿಂದ"],
    ["annu", "ಅನ್ನು"],
    ["galu", "ಗಳು"],
    ["ge", "ಗೆ"],
  ];

  for (const [suf, kanSuf] of suffixes) {
    if (clean.length > suf.length + 2 && clean.endsWith(suf)) {
      const stem = clean.slice(0, -suf.length);
      const stemKan = KANGLISH_WORD_MAP[stem] || transliteratePhonetic(stem);
      return stemKan + kanSuf;
    }
  }

  return transliteratePhonetic(clean);
}

/**
 * Rule-based phonetic transliteration engine for arbitrary words.
 */
function transliteratePhonetic(input: string): string {
  let result = "";
  let i = 0;
  let isStartOfWord = true;

  while (i < input.length) {
    // Check consonants
    let matchedConsonant: string | null = null;
    let consLen = 0;

    for (const [engCons, kanCons] of CONSONANTS) {
      if (input.startsWith(engCons, i)) {
        matchedConsonant = kanCons;
        consLen = engCons.length;
        break;
      }
    }

    if (matchedConsonant) {
      i += consLen;
      isStartOfWord = false;

      // Check following vowel
      let matchedVowel: string | null = null;
      let vowLen = 0;

      const vowelKeys = ["aa", "ee", "ii", "oo", "uu", "ai", "au", "ou", "a", "i", "u", "e", "o"];
      for (const vKey of vowelKeys) {
        if (input.startsWith(vKey, i)) {
          matchedVowel = VOWEL_MATRAS[vKey];
          vowLen = vKey.length;
          break;
        }
      }

      if (matchedVowel !== null) {
        // Consonant + Vowel
        result += matchedConsonant + matchedVowel;
        i += vowLen;
      } else {
        // Consonant with no vowel = add virama if next is another consonant, else inherent 'a'
        if (i < input.length && /[a-z]/i.test(input[i])) {
          result += matchedConsonant + "್";
        } else {
          result += matchedConsonant;
        }
      }
    } else {
      // Independent Vowel
      let matchedInitialVowel: string | null = null;
      let vowLen = 0;
      const vowelKeys = ["aa", "ee", "ii", "oo", "uu", "ai", "au", "ou", "a", "i", "u", "e", "o"];
      for (const vKey of vowelKeys) {
        if (input.startsWith(vKey, i)) {
          matchedInitialVowel = VOWELS_INITIAL[vKey];
          vowLen = vKey.length;
          break;
        }
      }

      if (matchedInitialVowel) {
        result += matchedInitialVowel;
        i += vowLen;
        isStartOfWord = false;
      } else {
        // Passthrough characters (numbers, symbols, unknown letters)
        result += input[i];
        isStartOfWord = !/[a-z]/i.test(input[i]);
        i++;
      }
    }
  }

  return result;
}

/**
 * Transliterates an entire Kanglish sentence into Kannada script.
 */
export function transliterateKanglishToKannada(text: string): string {
  if (!text || typeof text !== "string") return text;
  // If it already has Kannada Unicode characters, return as is
  if (/[ಀ-೿]/.test(text)) return text;

  // Split keeping whitespace and punctuation
  const tokens = text.split(/(\s+|[.,!?:;"'()[\]{}]+)/);
  return tokens
    .map((token) => {
      if (/^\s+$/.test(token) || /^[.,!?:;"'()[\]{}]+$/.test(token)) {
        return token;
      }
      return transliterateWord(token);
    })
    .join("");
}
