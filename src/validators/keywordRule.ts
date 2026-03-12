/**
 * Validation rule for detecting predefined spam keywords and patterns
 */

import * as fs from 'fs';
import * as path from 'path';

// Cache for spam keywords (plain substring matching)
let cachedKeywords: string[] | null = null;

// Cache for spam patterns (compiled regexes with their source string)
let cachedPatterns: Array<{ regex: RegExp; source: string }> | null = null;

/**
 * Load spam keywords from JSON file
 * Keywords are loaded once and cached for performance
 */
function loadSpamKeywords(): string[] {
  if (cachedKeywords !== null) {
    return cachedKeywords;
  }

  try {
    const keywordsPath = path.join(__dirname, '../../references/spam-keywords.json');
    const content = fs.readFileSync(keywordsPath, 'utf-8');
    const keywords = JSON.parse(content) as string[];
    cachedKeywords = keywords;
    return keywords;
  } catch (error) {
    console.error('Failed to load spam keywords:', error);
    cachedKeywords = [];
    return [];
  }
}

/**
 * Load spam patterns from JSON file and compile to RegExp objects
 * Patterns are loaded once and cached for performance
 */
function loadSpamPatterns(): Array<{ regex: RegExp; source: string }> {
  if (cachedPatterns !== null) {
    return cachedPatterns;
  }

  try {
    const patternsPath = path.join(__dirname, '../../references/spam-patterns.json');
    const content = fs.readFileSync(patternsPath, 'utf-8');
    const patterns = JSON.parse(content) as string[];
    cachedPatterns = patterns.map(p => ({ regex: new RegExp(p, 'i'), source: p }));
    return cachedPatterns;
  } catch (error) {
    console.error('Failed to load spam patterns:', error);
    cachedPatterns = [];
    return [];
  }
}

export interface SpamMatch {
  value: string;
  isPattern: boolean;
}

/**
 * Check if message contains any predefined spam keywords or matches a regex pattern
 * Substring matching is case-insensitive; patterns use the 'i' flag
 * @param text - Message text to validate
 * @returns SpamMatch with the matched value and whether it was a regex pattern, or null
 */
export const findSpamKeyword = (text: string): SpamMatch | null => {
  const keywords = loadSpamKeywords();
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    if (!keyword) continue;
    if (lowerText.includes(keyword.toLowerCase())) {
      return { value: keyword, isPattern: false };
    }
  }

  const patterns = loadSpamPatterns();
  for (const { regex, source } of patterns) {
    if (regex.test(text)) {
      return { value: source, isPattern: true };
    }
  }

  return null;
};
