#!/usr/bin/env tsx
/**
 * Script to extract spam keywords that are NOT caught by Greek or Mixed Alphabet rules
 */

import * as fs from 'fs';
import * as path from 'path';
import { findGreekSymbol } from '../src/validators/greekSymbolRule';
import { getAlphabetType } from '../src/validators/alphabetUtils';

const CLEANED_RESULT_PATH = path.join(__dirname, '../references/cleaned-result.json');
const OUTPUT_PATH = path.join(__dirname, '../references/spam-keywords.json');

interface AnalysisResult {
  total: number;
  greekRule: number;
  mixedRule: number;
  keywordOnly: number;
  keywords: string[];
}

/**
 * Clean the raw message string from cleaned-result.json
 * Removes leading spaces, {ban} markers, quotes, asterisks, and extra symbols
 */
function cleanMessage(raw: string): string {
  let cleaned = raw
    .trim()

  // Remove trailing quotes if present
  if (cleaned.endsWith('"')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  return cleaned;
}

/**
 * Check if text has ANY mixed alphabet characters (even 1 char)
 * More strict than the validator which requires 2+ minority chars
 */
function hasAnyMixedAlphabet(text: string): boolean {
  const words = text.match(/[a-zA-Zа-яА-ЯіїєґІЇЄҐ]+/g) || [];

  for (const word of words) {
    const alphabetCounts: Record<string, number> = {};

    for (const char of word) {
      const type = getAlphabetType(char);
      if (type) {
        alphabetCounts[type] = (alphabetCounts[type] || 0) + 1;
      }
    }

    // If word has 2+ different alphabets, it's mixed
    if (Object.keys(alphabetCounts).length >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains zero-width or invisible characters
 */
function hasInvisibleChars(text: string): boolean {
  // Zero-width chars: U+200B, U+200C, U+200D, U+FEFF, etc.
  const invisibleChars = /[\u200B-\u200D\uFEFF]/;
  return invisibleChars.test(text);
}

/**
 * Analyze spam messages and categorize them by rule type
 */
function analyzeSpamMessages(): AnalysisResult {
  const rawMessages: string[] = JSON.parse(fs.readFileSync(CLEANED_RESULT_PATH, 'utf-8'));

  const result: AnalysisResult = {
    total: rawMessages.length,
    greekRule: 0,
    mixedRule: 0,
    keywordOnly: 0,
    keywords: [],
  };

  const keywordSet = new Set<string>();

  for (const raw of rawMessages) {
    const message = cleanMessage(raw);

    if (!message) continue;

    const hasGreek = findGreekSymbol(message) !== null;
    const hasMixed = hasAnyMixedAlphabet(message);
    const hasInvisible = hasInvisibleChars(message);

    if (hasGreek) {
      result.greekRule++;
    } else if (hasMixed || hasInvisible) {
      result.mixedRule++;
    } else {
      // This message is NOT caught by Greek or Mixed rules
      // It needs keyword-based filtering
      result.keywordOnly++;
      keywordSet.add(message);
    }
  }

  result.keywords = Array.from(keywordSet).sort();

  return result;
}

/**
 * Main execution
 */
function main() {
  console.log('Analyzing spam messages from cleaned-result.json...\n');

  const analysis = analyzeSpamMessages();

  console.log('Analysis Results:');
  console.log(`Total messages: ${analysis.total}`);
  console.log(`Caught by Greek rule: ${analysis.greekRule}`);
  console.log(`Caught by Mixed rule: ${analysis.mixedRule}`);
  console.log(`Require keyword filtering: ${analysis.keywordOnly}`);
  console.log();

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(analysis.keywords, null, 2), 'utf-8');
  console.log(`Saved ${analysis.keywords.length} unique keywords to ${OUTPUT_PATH}`);
  console.log();

  if (analysis.keywords.length > 10) {
    console.log(`   ... and ${analysis.keywords.length - 10} more`);
  }
}

main();
