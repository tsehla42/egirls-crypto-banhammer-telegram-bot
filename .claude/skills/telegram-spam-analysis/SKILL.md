---
name: telegram-spam-analysis
description: Use when analyzing new Telegram spam messages for the egirls-crypto-banhammer bot — classifying spam type and adding regex entries to src/spam-rules.ts
---

# Telegram Spam Analysis

## Overview

Classify new Telegram spam and add regex entries to `src/spam-rules.ts`.

Modern spam messages are rich — a single message usually carries 2–4 independent keyword patterns. Analyze **every** match of every message, not just the first:

- **PASSED** messages — mine all distinctive signals into candidate rules
- **FLAGGED** messages — still harvest extra markers from the probe's `also matches` lines: if the spammer fixes one trigger, another pattern should still ban the variant

## Validation Pipeline (What's Already Filtered)

Check in order. If a message is caught at any step, **do not add a rule for it**.

| Rule | Catches |
|------|---------|
| Mixed Alphabet | Any word with 2+ minority-alphabet chars (Latin+Cyrillic mixing) |
| Greek | Any Greek Unicode chars (U+0370–U+03FF, U+1F00–U+1FFF) |
| Korean | >15 Hangul characters |
| Chinese | >6 CJK characters |
| Spam Rules | `src/spam-rules.ts` — categorized regex patterns |

### Step 0: Probe the batch (default verification tool)

```bash
npm run probe -- messages.json       # JSON array of strings or {"id","text"} objects
npm run probe -- messages.txt        # raw text, messages separated by a --- line
cat msgs.json | npm run probe -- -   # stdin (JSON or raw)
```

The probe runs `validateMessage` — the app's real pipeline, same rule order — and reports per message:

- **PASSED** — survives everything → needs new rules; full message text is printed for analysis
- **FLAGGED** — banned; prints the authoritative first hit **plus every other matching rule** (`also matches:` lines) for marker harvesting

Never eyeball a batch by hand — the probe is ground truth. Re-run it after adding rules: the whole batch must come back FLAGGED.

## Spam Category Taxonomy

Categories observed in the wild. Use this to orient analysis:

### 1. Crypto / Financial Fraud
Signals: specific token names, exchange names, ".xyz" domains, "claim" verbs, aspirational millionaire framing
Rules: blockchain platforms (`Solana`, `opensea`), action CTAs (`claim (?:free|here|it)`, `купить токен`), educational lures (`курс по крипт`, `материалы по крипте`), domain TLDs (`.xyz`)

### 2. Job / Recruitment Spam
Signals: income promises, housing offers, "flexible schedule", "remote", no-verification claims, Bulgarian-language requirements (niche signal for CIS audience)
Sub-patterns:
- **Income + housing combo** — offering both salary AND housing is near-certain fraud (`житло надаємо`, `помощь с жиль`, `проживання за наш рахунок`)
- **"Not scam" self-defense** — messages saying `не офис, не скам` are always spam
- **Specific operator names** — recurrent named actors (`Даниил и Сэм`, `vladovaHR`) are worth adding as time-limited signals; note in a comment that they may become stale

### 3. Redirect Spam
Signals: "+" as response indicator, DM/profile redirect CTAs
- DM redirects: `пиши в лс`, `пиши в особист`, `напишет + в лс`, `кому интересно напишите`
- Profile redirects: `в моем профиле`, `переходи в мой профиль`
- Direct-message notation: `ставь + в директ` (the "+" is the response token)

Note: prefer the 2-3 word phrase over single words like `лс` alone.

### 4. Casino / Betting
Signals: gambling platform names, free-spin offers, sports analysis framing (cover for tipster scams)
Rules: `беттинг`, `букмекер`, `фриспины`, `casinoua`, `победу подряд`, `футбольных аналитиков`

### 5. Adult Content
Signals: Ukrainian/Russian explicit terms
Rules: `гарячі відео`

### 6. Currency Symbol Spam (standalone)
`₽` (Russian ruble symbol) alone is highly effective — appears in spam targeting Ukrainian audience offering Russian-currency income, almost never in legitimate conversation.

## Adding Rules

All rules are now regex in `src/spam-rules.ts`. No more keyword vs pattern distinction.

### Step 1: Choose the right category

| Category | Use for |
|----------|---------|
| `earnings` | Salary, income, payment frequency |
| `housing` | Accommodation offers |
| `crypto` | Token claims, crypto courses, wallet schemes |
| `contactRequests` | DM/profile redirects |
| `jobScam` | Job offers, recruitment, "not scam" claims |
| `gambling` | Betting, casino, free spins |
| `genericSpam` | everything else |

### Step 2: Write the regex

**Use building blocks when matching currency amounts:**
```typescript
const CURRENCY = '(?:грн|[$€₽₴])';
const AMOUNT = `(?:${CURRENCY}\\s*\\d+|\\d+[\\s\\d]*\\s*${CURRENCY})`;

// In earnings category:
new RegExp(`${AMOUNT}\\s*(?:в\\s+неделю|/неделя)`, 'i'),
```

**For plain text phrases, use inline regex:**
```typescript
/pомощь с жиль/i,
/чат менеджер/i,
```

**For variable word forms, use alternation:**
```typescript
/claim (?:free|here|it)/i,
/даниил(а)? и сэм(а)?/i,
```

**TRAIL convention (sexualSpam style):**
- **Closed phrase** — ends on a complete word: `new RegExp(\`full phrase${TRAIL}\`, 'i')`
- **Open stem** — truncated last word (`перепис`, `подружк`, `задоволенн`): plain `/…stem/i`

`${TRAIL}` extends the match to the end of the message. It is wrapped `(?:…)?` inside the constant, so appending it can never cause a miss.

### Step 3: Stemming (Slavic languages)

Ukrainian and Russian decline nouns. Strip the inflectional suffix **of the last word only**.

```
✅ "набираем люд"     → catches людей / людям / людьми
✅ "удалённая работ"  → catches работа / работу / работе / работой
✅ "работы с трафик"  → last word stemmed, first word kept exact

❌ "работ с трафиком" → BROKEN: "работ" ≠ "работы" so "работы с трафиком" won't match
```

**Rule:** Only stem the last word. All preceding words must be the exact inflected form that appears in spam.

### Step 4: Add to the file

```typescript
export const spamRules = {
  earnings: [
    // ... existing rules ...
    /your new pattern/i,  // ← add here
  ],
  // ...
} as const;
```

**Rules:**
- Every entry MUST have the `i` flag
- Use comments for provenance when consolidating or porting entries from older rule sets
- Restart bot after changes (rules are imported at startup)

## False Positive Guards

| DO add | DO NOT add |
|--------|-----------|
| `стабільний заробіт` (2-word, specific) | `заробіток` (common word) |
| `команду чат-підтримки` (distinctive combo) | `команда` (too generic) |
| `беттинг` (loanword, no normal use) | `ставка` (normal word: rate, bet, stake) |
| `₽` (foreign currency in UA/RU crypto context) | `$` or `€` (used normally) |
| Named operators (`Даниил і Сэм`) | First names alone |
| `.xyz` (TLD with no legit usage in these chats) | `.com`, `.org` |

Do **not** add:
- `робота`, `команда`, `дохід`, `тиждень`, `пиши` — common speech
- `онлайн` alone — too generic
- Any word already caught by Mixed Alphabet, Greek, Korean, or Chinese rules

## Post-Add Steps

After adding rules, always:
1. Re-run `npm run probe` — every message in the batch must be FLAGGED
2. Promote the batch to `src/validators/__tests__/recentSpamMessages.test.ts`: per-message `{id, text, expectedRule}` entries, plus legitimate messages as guard cases that must keep passing
3. Run `npm test` — all green
4. Increment `version` in `package.json` by 0.0.1
5. Run `npm install` to update the lockfile

## Quick Reference: Before Submitting

- [ ] Ran `npm run probe` — PASSED analyzed in full, FLAGGED mined for extra `also matches` markers?
- [ ] Re-probed after adding rules — batch fully FLAGGED?
- [ ] Batch promoted to `recentSpamMessages.test.ts` and `npm test` green?
- [ ] Phrase is 2–4 words (or single word that's a very distinctive spam term)?
- [ ] Last word only is stemmed (if Slavic inflected phrase)?
- [ ] Not a false positive in normal Ukrainian/Russian conversation?
- [ ] Regex has the `i` flag?
- [ ] Added to the correct category in `spamRules`?
