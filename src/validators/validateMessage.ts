/**
 * Main message validator that applies all moderation rules
 */

import { containsGreekSymbols } from './greekSymbolRule';
import { containsMixedAlphabets } from './mixedAlphabetRule';

/**
 * Validation result object
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validate message against all moderation rules
 * @param text - Message text to validate
 * @returns ValidationResult with validity status and reason if invalid
 */
export const validateMessage = (text: string): ValidationResult => {
  if (containsGreekSymbols(text)) {
    return {
      isValid: false,
      reason: 'Message contains Greek alphabet symbols',
    };
  }

  if (containsMixedAlphabets(text)) {
    return {
      isValid: false,
      reason: 'Message contains mixed alphabets in a single word (character confusion attack)',
    };
  }

  return {
    isValid: true,
  };
};
