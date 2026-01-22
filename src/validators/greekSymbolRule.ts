/**
 * Validation rule for detecting Greek alphabet characters
 */

/**
 * Result of finding a Greek symbol in text
 */
export interface GreekSymbolMatch {
  symbol: string;
  word: string;
}

/**
 * Check if message contains Greek alphabet characters and return the first match with the word
 * @param text - Message text to validate
 * @returns Object with Greek character and the word it was found in, or null if none found
 */
export const findGreekSymbol = (text: string): GreekSymbolMatch | null => {
  // Greek alphabet Unicode ranges
  // Basic Greek: U+0370–U+03FF
  // Greek Extended: U+1F00–U+1FFF
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  const wordRegex = /[a-zA-Zа-яА-ЯіїєґІЇЄҐ\u0370-\u03FF\u1F00-\u1FFF]+/g;
  
  const words = text.match(wordRegex) || [];
  
  for (const word of words) {
    const match = word.match(greekRegex);
    if (match) {
      return {
        symbol: match[0],
        word: word,
      };
    }
  }
  
  return null;
};
