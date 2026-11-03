/**
 * Validation rule for detecting Azerbaijani/Turkish (Turkic-Latin) text
 *
 * Spam threshold: ban if more than 1 distinctive Latin-Turkic character is
 * present (i.e. 2+ anywhere in the message). Ukrainian/Russian legit text
 * never uses these letters, so two of them is a reliable language
 * fingerprint — same idea as the Greek rule, just for Latin script.
 *
 * A single character is allowed to avoid false positives: a lone Turkic
 * proper noun embedded in an otherwise Cyrillic message (e.g. "Süleyman")
 * keeps passing. Short all-plain-transliteration spam ("Axtarisa ifsaoldbaku
 * yaz") has zero distinctive chars and is covered by keyword rules instead.
 */

const TURKIC_THRESHOLD = 1; // ban when count > 1, i.e. 2+ chars

/**
 * Count distinctive Latin-Turkic characters in a string.
 * Letters: ə (Azerbaijani schwa — absent from Turkish), ı ğ ş ö ç ü
 * (shared by Azerbaijani and Turkish). The `i` flag folds the uppercase
 * pairs (Ə Ğ Ş Ö Ç Ü); JS does NOT fold ı onto plain i, so English/Latin
 * "i" never counts.
 */
const countTurkicChars = (text: string): number => {
  const turkicRegex = /[əıığşöçü]/gi;
  return (text.match(turkicRegex) || []).length;
};

/**
 * Check if message contains more than the allowed number of Turkic-Latin characters.
 * @param text - Message text to validate
 * @returns The count of Turkic characters if threshold exceeded, or null if within limit
 */
export const findTurkic = (text: string): number | null => {
  const count = countTurkicChars(text);
  return count > TURKIC_THRESHOLD ? count : null;
};
