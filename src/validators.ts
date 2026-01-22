/**
 * Validators for moderation rules
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

/**
 * Get alphabet type for a character
 * @param char - Single character to check
 * @returns Alphabet type: 'cyrillic', 'latin', or null for non-letter
 */
const getAlphabetType = (char: string): 'cyrillic' | 'latin' | null => {
    const code = char.charCodeAt(0);

    // Cyrillic: U+0400–U+04FF (Russian, Ukrainian, etc.)
    if (code >= 0x0400 && code <= 0x04ff) {
        return 'cyrillic';
    }

    // Latin: U+0041–U+005A (A-Z), U+0061–U+007A (a-z)
    if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
        return 'latin';
    }

    return null;
};

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
            // Check if any alphabet appears 2+ times
            for (const alphabet of alphabets) {
                if (alphabetCounts[alphabet] >= 2) {
                    // This alphabet appears multiple times while mixed with another
                    // This is a character confusion attack
                    return true;
                }
            }
        }
    }

    return false;
};

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
            reason: "Message contains Greek alphabet symbols",
        };
    }

    if (containsMixedAlphabets(text)) {
        return {
            isValid: false,
            reason: "Message contains mixed alphabets in a single word (character confusion attack)",
        };
    }

    return {
        isValid: true,
    };
};
