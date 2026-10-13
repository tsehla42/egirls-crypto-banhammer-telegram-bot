/**
 * Spam probe — the default verification tool for spam rule batches.
 *
 * Runs messages through the EXACT pipeline the bot uses at runtime
 * (`validateMessage`: banned_channel → mixed → keyword → greek → korean → chinese)
 * and reports, per message:
 *
 *   - FLAGGED: authoritative first-hit rule + EVERY other rule that also
 *     matches (harvest extra markers from these — rich messages usually
 *     carry 2-4 independent patterns)
 *   - PASSED:  survives the whole pipeline → needs new rules; full text shown
 *
 * Usage:
 *   npm run probe -- messages.json      JSON file: ["text", ...] or [{"id","text"}, ...]
 *   npm run probe -- messages.txt       raw text, messages separated by a line with ---
 *   cat msgs.json | npm run probe -- -  read from stdin (JSON or raw)
 *
 * Input format rule of thumb: use JSON when a message itself contains "---".
 */

import { readFileSync } from 'fs';
import { validateMessage } from '../validators/validateMessage';
import { spamRules } from '../spam-rules';
import { findBannedChannel } from '../validators/bannedChannelsRule';
import { findMixedAlphabetWord } from '../validators/mixedAlphabetRule';
import { findGreek } from '../validators/greekRule';
import { findKorean } from '../validators/koreanRule';
import { findChinese } from '../validators/chineseRule';

interface ProbeMessage {
  id: string;
  text: string;
}

const PREVIEW_LEN = 120;

const parseInput = (raw: string): ProbeMessage[] => {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed: unknown = JSON.parse(trimmed);
    const arr = Array.isArray(parsed)
      ? parsed
      : (parsed as { messages?: unknown[] }).messages;
    if (!Array.isArray(arr)) throw new Error('JSON must be an array (or {"messages": [...]})');
    return arr.map((entry, i) =>
      typeof entry === 'string'
        ? { id: String(i + 1), text: entry }
        : {
            id: String((entry as { id?: unknown }).id ?? i + 1),
            text: String((entry as { text?: unknown }).text ?? ''),
          }
    );
  }
  // Raw format: messages separated by a line containing only ---
  return trimmed
    .split(/^\s*---\s*$/m)
    .map((text, i) => ({ id: String(i + 1), text: text.replace(/^\n+|\n+$/g, '') }))
    .filter((m) => m.text.length > 0);
};

/** Every match in the message — pipeline order, first hit is authoritative. */
const collectMatches = (text: string): string[] => {
  const matches: string[] = [];

  const banned = findBannedChannel(text);
  if (banned) matches.push(`banned_channel: ${banned.channelName}`);

  const mixed = findMixedAlphabetWord(text);
  if (mixed) matches.push(`mixed: ${mixed}`);

  for (const [category, rules] of Object.entries(spamRules)) {
    for (const rule of rules as readonly RegExp[]) {
      if (rule.test(text.normalize('NFC'))) matches.push(`keyword[${category}]: ${rule.source}`);
    }
  }

  const greek = findGreek(text);
  if (greek) matches.push(`greek: ${greek.word}`);

  const korean = findKorean(text);
  if (korean !== null) matches.push(`korean: ${korean}_chars`);

  const chinese = findChinese(text);
  if (chinese !== null) matches.push(`chinese: ${chinese}_chars`);

  return matches;
};

const preview = (text: string): string => {
  const first = text.split('\n')[0].replace(/\s+/g, ' ').trim();
  return first.length > PREVIEW_LEN ? `${first.slice(0, PREVIEW_LEN)}…` : first;
};

const main = (): void => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npm run probe -- <file.json|file.txt|->');
    process.exit(2);
  }

  const raw = arg === '-' ? readFileSync(0, 'utf8') : readFileSync(arg, 'utf8');
  const messages = parseInput(raw);

  const flagged: (ProbeMessage & { ruleName?: string; triggerWord?: string; matches: string[] })[] = [];
  const passed: (ProbeMessage & { matches: string[] })[] = [];

  for (const msg of messages) {
    const result = validateMessage(msg.text);
    const matches = collectMatches(msg.text);
    if (result.isValid) {
      passed.push({ ...msg, matches });
    } else {
      flagged.push({ ...msg, ruleName: result.ruleName, triggerWord: result.triggerWord, matches });
    }
  }

  console.log(`Spam probe — ${messages.length} messages`);
  console.log('Pipeline (same as app): banned_channel → mixed → keyword → greek → korean → chinese');
  console.log('');

  console.log(`=== PASSED (${passed.length}) — survive the pipeline, need new rules ===`);
  for (const m of passed) {
    console.log(`\n[${m.id}] no matches`);
    console.log(m.text.split('\n').map((l) => `    | ${l}`).join('\n'));
  }

  console.log(`\n\n=== FLAGGED (${flagged.length}) — all matches (harvest extra markers) ===`);
  for (const m of flagged) {
    const hit = m.matches[0] ?? `${m.ruleName}: ${m.triggerWord}`;
    console.log(`\n[${m.id}] BANNED by ${m.ruleName} (${m.triggerWord}) — preview: ${preview(m.text)}`);
    console.log(`    authoritative: ${hit}`);
    for (const extra of m.matches.slice(1)) console.log(`    also matches:  ${extra}`);
  }

  console.log(`\n\nSummary: ${flagged.length} flagged, ${passed.length} passed, ${messages.length} total`);
};

main();
