/**
 * Validation rule for detecting Chinese (CJK) characters
 *
 * Spam threshold: ban if more than 4 Chinese characters are present in the message.
 * A small number of CJK characters is allowed to avoid false positives
 * (e.g. a single brand name or borrowed term using CJK script).
 *
 * Note: The CJK Unicode ranges cover characters shared across Chinese, Japanese,
 * and Korean Han ideographs. In the context of this bot's spam patterns, messages
 * with more than 4 such characters are treated as Chinese-language spam.
 */

const CHINESE_THRESHOLD = 4;

/**
 * Count the number of CJK (Chinese/Han) characters in a string.
 * Covers:
 *   - CJK Unified Ideographs:             U+4E00–U+9FFF
 *   - CJK Extension A:                    U+3400–U+4DBF
 *   - CJK Compatibility Ideographs:       U+F900–U+FAFF
 *   - CJK Unified Ideographs Extension B: U+20000–U+2A6DF (via surrogate pairs, handled by \u{} flag)
 */
const countChineseChars = (text: string): number => {
  const chineseRegex = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u{20000}-\u{2A6DF}]/gu;
  return (text.match(chineseRegex) || []).length;
};

/**
 * Check if message contains more than the allowed number of Chinese/CJK characters.
 * @param text - Message text to validate
 * @returns The count of CJK characters if threshold exceeded, or null if within limit
 */
export const findChinese = (text: string): number | null => {
  const count = countChineseChars(text);
  return count > CHINESE_THRESHOLD ? count : null;
};
