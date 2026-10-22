/**
 * Utility functions for alphabet detection
 */

/**
 * Get alphabet type for a character
 * @param char - Single character to check (may be an astral-plane code point)
 * @returns Alphabet type: 'cyrillic', 'latin', 'greek', 'stylized', or null for non-letter
 */
export const getAlphabetType = (
  char: string,
): 'cyrillic' | 'latin' | 'greek' | 'stylized' | null => {
  // codePointAt is required: styled letters (Fraktur etc.) live beyond the BMP,
  // where charCodeAt would return only the high surrogate and match no range
  const code = char.codePointAt(0) ?? 0;

  // Cyrillic: U+0400–U+04FF (Russian, Ukrainian, etc.)
  if (code >= 0x0400 && code <= 0x04ff) {
    return 'cyrillic';
  }

  // Latin: U+0041–U+005A (A-Z), U+0061–U+007A (a-z)
  if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
    return 'latin';
  }

  // Greek: U+0370–U+03FF (Basic Greek), U+1F00–U+1FFF (Greek Extended)
  if ((code >= 0x0370 && code <= 0x03ff) || (code >= 0x1f00 && code <= 0x1fff)) {
    return 'greek';
  }

  // Stylized letters: decoratively rendered Latin used for character confusion.
  // Includes the "goth alphabet" (Mathematical Fraktur, U+1D504–U+1D537) and every
  // other mathematical style, plus Letterlike Symbols and Fullwidth Latin.
  if (
    // Mathematical Alphanumeric Symbols: Fraktur, bold, italic, script,
    // double-struck, sans-serif, monospace (U+1D400–U+1D7FF)
    (code >= 0x1d400 && code <= 0x1d7ff) ||
    // Letterlike Symbols: ℓ ℊ ℌ ℑ ℜ ℨ ™ № … (U+2100–U+214F)
    (code >= 0x2100 && code <= 0x214f) ||
    // Fullwidth Latin: Ａ–Ｚ, ａ–ｚ (U+FF21–U+FF3A, U+FF41–U+FF5E)
    (code >= 0xff21 && code <= 0xff3a) ||
    (code >= 0xff41 && code <= 0xff5e)
  ) {
    return 'stylized';
  }

  return null;
};
