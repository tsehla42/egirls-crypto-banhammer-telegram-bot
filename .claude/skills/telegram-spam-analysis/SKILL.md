---
name: telegram-spam-analysis
description: Use when analyzing new Telegram spam messages for the egirls-crypto-banhammer bot — classifying spam type and adding regex entries to src/spam-rules.ts
---

# Telegram Spam Analysis

## Overview

Classify new Telegram spam and add the minimum effective regex entries to `src/spam-rules.ts`. Only add what earlier rules don't already catch.

## Validation Pipeline (What's Already Filtered)

Check in order. If a message is caught at any step, **do not add a rule for it**.

| Rule | Catches |
|------|---------|
| Mixed Alphabet | Any word with 2+ minority-alphabet chars (Latin+Cyrillic mixing) |
| Greek | Any Greek Unicode chars (U+0370–U+03FF, U+1F00–U+1FFF) |
| Korean | >15 Hangul characters |
| Chinese | >6 CJK characters |
| Spam Rules | `src/spam-rules.ts` — categorized regex patterns |

**Test BEFORE adding:** Does the message slip through all four pre-keyword rules?

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
- Use `// From spam-patterns.json` or similar comments for provenance when consolidating existing entries
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
1. Increment `version` in `package.json` by 0.0.1
2. Run `npm install` to update the lockfile

## Quick Reference: Before Submitting

- [ ] Message passes Mixed Alphabet check? (no word mixes 2+ minority-alphabet chars)
- [ ] Message passes Greek check? (no Greek characters)
- [ ] Message passes Korean/Chinese thresholds?
- [ ] Not already matched by existing rules in `src/spam-rules.ts`?
- [ ] Phrase is 2–4 words (or single word that's a very distinctive spam term)?
- [ ] Last word only is stemmed (if Slavic inflected phrase)?
- [ ] Not a false positive in normal Ukrainian/Russian conversation?
- [ ] Regex has the `i` flag?
- [ ] Added to the correct category in `spamRules`?
