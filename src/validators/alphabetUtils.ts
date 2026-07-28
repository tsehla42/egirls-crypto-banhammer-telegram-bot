/**
 * Utility functions for alphabet detection
 */

/**
 * Get alphabet type for a character
 * @param char - Single character to check
 * @returns Alphabet type: 'cyrillic', 'latin', 'greek', or null for non-letter
 */
export const getAlphabetType = (char: string): 'cyrillic' | 'latin' | 'greek' | null => {
  const code = char.charCodeAt(0);

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

  return null;
};
