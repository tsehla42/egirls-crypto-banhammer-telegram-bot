/**
 * Utility functions for alphabet detection
 */

/**
 * Get alphabet type for a character
 * @param char - Single character to check
 * @returns Alphabet type: 'cyrillic', 'latin', or null for non-letter
 */
export const getAlphabetType = (char: string): 'cyrillic' | 'latin' | null => {
  const code = char.charCodeAt(0);

  // Cyrillic: U+0400–U+04FF (Russian, Ukrainian, etc.)
  if (code >= 0x0400 && code <= 0x04ff) {
    return 'cyrillic';
  }

  // Latin: U+0041–U+005A (A-Z), U+0061–U+007A (a-z)
  if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
    return 'latin';
  }

  return null;
};
