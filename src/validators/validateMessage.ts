/**
 * Main message validator that applies all moderation rules
 */

import { findGreekSymbol } from './greekSymbolRule';
import { findMixedAlphabetWord } from './mixedAlphabetRule';

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
  const greekMatch = findGreekSymbol(text);
  if (greekMatch) {
    return {
      isValid: false,
      reason: `Message contains Greek alphabet symbol \`${greekMatch.symbol}\` in a word \`${greekMatch.word}\``,
      ruleName: 'greek_rule',
      triggerWord: greekMatch.word,
    };
  }

  const mixedWord = findMixedAlphabetWord(text);
  if (mixedWord) {
    return {
      isValid: false,
      reason: `Message contains mixed alphabets in word \`${mixedWord}\` (character confusion attack)`,
      ruleName: 'mixed_rule',
      triggerWord: mixedWord,
    };
  }

  return {
    isValid: true,
  };
};
