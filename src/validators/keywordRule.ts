/**
 * Validation rule for detecting predefined spam keywords
 */

import * as fs from 'fs';
import * as path from 'path';

// Cache for spam keywords
let cachedKeywords: string[] | null = null;

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
 * Check if message contains any predefined spam keywords
 * Uses case-insensitive matching
 * @param text - Message text to validate
 * @returns The matched keyword if found, null otherwise
 */
export const findSpamKeyword = (text: string): string | null => {
  const keywords = loadSpamKeywords();
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    if (!keyword) continue;
    
    const lowerKeyword = keyword.toLowerCase();
    
    if (lowerText.includes(lowerKeyword)) {
      return keyword;
    }
  }

  return null;
};
