/**
 * Validation rule for detecting predefined spam keywords and patterns
 */

import { allSpamRules } from '../spam-rules';

export interface SpamMatch {
  value: string;
}

/**
 * Check if message matches any spam regex pattern
 * Text is NFC-normalized before testing to prevent composed/decomposed mismatches
 * @param text - Message text to validate
 * @returns SpamMatch with the matched regex source, or null
 */
export const findSpamKeyword = (text: string): SpamMatch | null => {
  const normalizedText = text.normalize('NFC');

  for (const regex of allSpamRules) {
    if (regex.test(normalizedText)) {
      return { value: regex.source };
    }
  }

  return null;
};
