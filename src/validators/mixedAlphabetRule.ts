/**
 * Validation rule for detecting mixed alphabet character confusion attacks
 */

import { getAlphabetType } from './alphabetUtils';

/**
 * Check if any word contains 2+ characters from a different alphabet mixed in
 * This detects character confusion attacks (e.g., Latin 'C' mixed with Cyrillic characters)
 * One character could be a typo, but 2+ is intentional obfuscation
 * @param text - Message text to validate
 * @returns true if mixed alphabet attack is detected, false otherwise
 */
export const containsMixedAlphabets = (text: string): boolean => {
  // Split text into words, keeping only letters
  const words = text.match(/[a-zA-Zа-яА-ЯіїєґІЇЄҐ]+/g) || [];

  for (const word of words) {
    // Count occurrences of each alphabet type
    const alphabetCounts: Record<string, number> = {};

    for (const char of word) {
      const type = getAlphabetType(char);
      if (type) {
        alphabetCounts[type] = (alphabetCounts[type] || 0) + 1;
      }
    }

    const alphabets = Object.keys(alphabetCounts);

    // If word has mixed alphabets (2 or more different alphabets)
    if (alphabets.length >= 2) {
      // Find the dominant alphabet (most frequent)
      let dominantAlphabet = alphabets[0];
      let maxCount = alphabetCounts[alphabets[0]];

      for (const alphabet of alphabets) {
        if (alphabetCounts[alphabet] > maxCount) {
          maxCount = alphabetCounts[alphabet];
          dominantAlphabet = alphabet;
        }
      }

      // Check if any non-dominant alphabet appears 2+ times
      for (const alphabet of alphabets) {
        if (alphabet !== dominantAlphabet && alphabetCounts[alphabet] >= 2) {
          // A minority alphabet appears 2+ times - this is intentional obfuscation
          return true;
        }
      }
    }
  }

  return false;
};
