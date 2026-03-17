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
  ruleName?: string;
  triggerWord?: string;
  isEdit?: boolean;
  isPattern?: boolean;
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
      ruleName: 'mixed_rule',
      triggerWord: mixedWord,
    };
  }

  const greekMatch = findGreek(text);
  if (greekMatch) {
    return {
      isValid: false,
      ruleName: 'greek_rule',
      triggerWord: greekMatch.word,
    };
  }

  const koreanCount = findKorean(text);
  if (koreanCount !== null) {
    return {
      isValid: false,
      ruleName: 'korean_rule',
      triggerWord: `${koreanCount}_korean_chars`,
    };
  }

  const chineseCount = findChinese(text);
  if (chineseCount !== null) {
    return {
      isValid: false,
      ruleName: 'chinese_rule',
      triggerWord: `${chineseCount}_chinese_chars`,
    };
  }

  const spamKeyword = findSpamKeyword(text);
  if (spamKeyword) {
    return {
      isValid: false,
      ruleName: 'keyword_rule',
      triggerWord: spamKeyword.value,
      isPattern: spamKeyword.isPattern,
    };
  }

  return {
    isValid: true,
  };
};
