/**
 * Main message validator that applies all moderation rules
 */

import { findBannedChannel } from './bannedChannelsRule';
import { findMixedAlphabetWord } from './mixedAlphabetRule';
import { findGreek } from './greekRule';
import { findKorean } from './koreanRule';
import { findChinese } from './chineseRule';
import { findSpamKeyword } from './keywordRule';
import { RULE } from '../strings';

export interface ValidationResult {
  isValid: boolean;
  ruleName?: string;
  triggerWord?: string;
  isEdit?: boolean;
}

/**
 * Validate message against all moderation rules
 * @param text - Message text to validate
 * @param senderId - Telegram user ID of the sender (optional, used for banned channel ID check)
 * @returns ValidationResult with validity status and reason if invalid
 */
export const validateMessage = (text: string, senderId?: number): ValidationResult => {
  const bannedMatch = findBannedChannel(text, senderId);
  if (bannedMatch) {
    return {
      isValid: false,
      ruleName: RULE.BANNED_CHANNEL,
      triggerWord: bannedMatch.channelName,
    };
  }

  const mixedWord = findMixedAlphabetWord(text);
  if (mixedWord) {
    return {
      isValid: false,
      ruleName: RULE.MIXED,
      triggerWord: mixedWord,
    };
  }

  const spamKeyword = findSpamKeyword(text);
  if (spamKeyword) {
    return {
      isValid: false,
      ruleName: RULE.KEYWORD,
      triggerWord: spamKeyword.value,
    };
  }

  const greekMatch = findGreek(text);
  if (greekMatch) {
    return {
      isValid: false,
      ruleName: RULE.GREEK,
      triggerWord: greekMatch.word,
    };
  }

  const koreanCount = findKorean(text);
  if (koreanCount !== null) {
    return {
      isValid: false,
      ruleName: RULE.KOREAN,
      triggerWord: `${koreanCount}_korean_chars`,
    };
  }

  const chineseCount = findChinese(text);
  if (chineseCount !== null) {
    return {
      isValid: false,
      ruleName: RULE.CHINESE,
      triggerWord: `${chineseCount}_chinese_chars`,
    };
  }

  return {
    isValid: true,
  };
};
