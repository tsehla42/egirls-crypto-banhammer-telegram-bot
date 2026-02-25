/**
 * Main message validator that applies all moderation rules
 */

import { findMixedAlphabetWord } from './mixedAlphabetRule';
import { findGreek } from './greekRule';
import { findKorean } from './koreanRule';
import { findChinese } from './chineseRule';
import { findSpamKeyword } from './keywordRule';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  ruleName?: string;
  triggerWord?: string;
}

/**
 * Validate message against all moderation rules
 * @param text - Message text to validate
 * @returns ValidationResult with validity status and reason if invalid
 */
export const validateMessage = (text: string): ValidationResult => {
  const mixedWord = findMixedAlphabetWord(text);
  if (mixedWord) {
    return {
      isValid: false,
      reason: `Message contains mixed alphabets in word \`${mixedWord}\` (character confusion attack)`,
      ruleName: 'mixed_rule',
      triggerWord: mixedWord,
    };
  }

  const greekMatch = findGreek(text);
  if (greekMatch) {
    return {
      isValid: false,
      reason: `Message contains Greek alphabet symbol \`${greekMatch.symbol}\` in a word \`${greekMatch.word}\``,
      ruleName: 'greek_rule',
      triggerWord: greekMatch.word,
    };
  }

  const koreanCount = findKorean(text);
  if (koreanCount !== null) {
    return {
      isValid: false,
      reason: `Message contains ${koreanCount} Korean characters (threshold: 15)`,
      ruleName: 'korean_rule',
      triggerWord: `${koreanCount}_korean_chars`,
    };
  }

  const chineseCount = findChinese(text);
  if (chineseCount !== null) {
    return {
      isValid: false,
      reason: `Message contains ${chineseCount} Chinese characters`,
      ruleName: 'chinese_rule',
      triggerWord: `${chineseCount}_chinese_chars`,
    };
  }

  const spamKeyword = findSpamKeyword(text);
  if (spamKeyword) {
    return {
      isValid: false,
      reason: `Message contains spam keyword \`${spamKeyword}\``,
      ruleName: 'keyword_rule',
      triggerWord: spamKeyword,
    };
  }

  return {
    isValid: true,
  };
};
