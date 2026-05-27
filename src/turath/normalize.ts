const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const PUNCT_OR_SYMBOL = /[^\p{L}\p{N}\s]/gu;

export const normalizeArabic = (input: string): string =>
  input
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(PUNCT_OR_SYMBOL, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const toSafeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
