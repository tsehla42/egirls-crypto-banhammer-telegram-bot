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

    return {
        isValid: true,
    };
};
