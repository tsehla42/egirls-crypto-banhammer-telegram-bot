/**
 * Validation rule for detecting Korean (Hangul) characters
 *
 * Spam threshold: ban if more than 15 Korean symbols are present in the message.
 * A small number of Korean characters is allowed to avoid false positives
 * (e.g. a single loanword or brand name embedded in a non-Korean message).
 */

const KOREAN_THRESHOLD = 15;

/**
 * Count the number of Korean (Hangul) characters in a string.
 * Covers:
 *   - Hangul Jamo:                U+1100–U+11FF
 *   - Hangul Compatibility Jamo:  U+3130–U+318F
 *   - Hangul Syllables:           U+AC00–U+D7A3
 *   - Hangul Jamo Extended-A:     U+A960–U+A97F
 *   - Hangul Jamo Extended-B:     U+D7B0–U+D7FF
 */
const countKoreanChars = (text: string): number => {
  const koreanRegex = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]/g;
  return (text.match(koreanRegex) || []).length;
};

/**
 * Check if message contains more than the allowed number of Korean characters.
 * @param text - Message text to validate
 * @returns The count of Korean characters if threshold exceeded, or null if within limit
 */
export const findKorean = (text: string): number | null => {
  const count = countKoreanChars(text);
  return count > KOREAN_THRESHOLD ? count : null;
};
