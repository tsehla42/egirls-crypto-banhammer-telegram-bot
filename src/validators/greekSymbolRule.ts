/**
 * Validation rule for detecting Greek alphabet characters
 */

/**
 * Check if message contains Greek alphabet characters
 * @param text - Message text to validate
 * @returns true if Greek characters are found, false otherwise
 */
export const containsGreekSymbols = (text: string): boolean => {
  // Greek alphabet Unicode ranges
  // Basic Greek: U+0370–U+03FF
  // Greek Extended: U+1F00–U+1FFF
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/g;
  return greekRegex.test(text);
};
