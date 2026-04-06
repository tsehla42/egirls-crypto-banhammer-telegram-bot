---
name: telegram-spam-analysis
description: Use when analyzing new Telegram spam messages for the egirls-crypto-banhammer bot — classifying spam type, deciding keyword vs pattern, and adding entries to spam-keywords.json or spam-patterns.json
---

# Telegram Spam Analysis

## Overview

Classify new Telegram spam and add the minimum effective entries to `references/spam-keywords.json` or `references/spam-patterns.json`. Only add what earlier rules don't already catch.

## Validation Pipeline (What's Already Filtered)

Check in order. If a message is caught at any step, **do not add a keyword for it**.

| Rule | Catches |
|------|---------|
| Mixed Alphabet | Any word with 2+ minority-alphabet chars (Latin+Cyrillic mixing) |
| Greek | Any Greek Unicode chars (U+0370–U+03FF, U+1F00–U+1FFF) |
| Korean | >15 Hangul characters |
| Chinese | >6 CJK characters |
| Keywords/Patterns | `spam-keywords.json` + `spam-patterns.json` |

**Test BEFORE adding:** Does the message slip through all four pre-keyword rules?

## Spam Category Taxonomy

Categories observed in the wild. Use this to orient analysis:

### 1. Crypto / Financial Fraud
Signals: specific token names, exchange names, ".xyz" domains, "claim" verbs, aspirational millionaire framing
Keywords: blockchain platforms (`Solana`, `opensea`), action CTAs (`claim free`, `Купить токен`), educational lures (`курс по крипт`, `материалы по крипте`), domain TLDs (`.xyz`)

### 2. Job / Recruitment Spam
Signals: income promises, housing offers, "flexible schedule", "remote", no-verification claims, Bulgarian-language requirements (niche signal for CIS audience)
Sub-patterns:
- **Income + housing combo** — offering both salary AND housing is near-certain fraud (`житло надаємо`, `помогаем с жиль`, `проживання за наш рахунок`)
- **"Not scam" self-defense** — messages saying `не офис, не скам` are always spam
- **Specific operator names** — recurrent named actors (`Даниил и Сэм`, `vladovaHR`) are worth adding as time-limited signals; note in a comment that they may become stale

### 3. Redirect Spam
Signals: "+" as response indicator, DM/profile redirect CTAs
- DM redirects: `пиши в лс`, `пиши в особист`, `напишет + в лс`, `кому интересно напишите`
- Profile redirects: `в моем профиле`, `Переходи в мой профиль`
- Direct-message notation: `ставь + в директ` (the "+" is the response token)

Note: prefer the 2-3 word phrase over single words like `лс` alone.

### 4. Casino / Betting
Signals: gambling platform names, free-spin offers, sports analysis framing (cover for tipster scams)
Keywords: `беттинг`, `букмекера`, `ФРИСПИНЫ`, `casinoua`, `победу подряд`, `футбольных аналитиков`

### 5. Adult Content
Signals: Ukrainian/Russian explicit terms
Keywords: `інтимні`, `гарячі відео`

### 6. Currency Symbol Spam (standalone)
`₽` (Russian ruble symbol) alone is highly effective — appears in spam targeting Ukrainian audience offering Russian-currency income, almost never in legitimate conversation.

## Keyword vs Pattern Decision

```
Is the core identifier fixed text?
├── YES → keyword (plain string in spam-keywords.json)
└── NO (variable number, multiple word forms) → pattern (regex in spam-patterns.json)
```

**Use a pattern when:**
- Amount varies: `250$ в неделю` / `1000$ в неделю` → `(?:\$\d+|\d+\$)\s*в\s+неделю`
- Word form varies across inflections and you can't stem the last word alone

**Use a keyword when:**
- Phrase is fixed and distinctive enough as-is
- 2-4 word phrases are ideal; single words only if extremely distinctive (`беттинг`, `букмекера`)

## Slavic Language Stemming Rules

Ukrainian and Russian decline nouns. Strip the inflectional suffix **of the last word only**.

```
✅ "набираем люд"     → catches людей / людям / людьми
✅ "удалённая работ"  → catches работа / работу / работе / работой
✅ "работы с трафик"  → last word stemmed, first word kept exact

❌ "работ с трафиком" → BROKEN: "работ" ≠ "работы" so "работы с трафиком" won't match
```

**Rule:** Only stem the last word. All preceding words must be the exact inflected form that appears in spam.

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

## Quick Reference: Before Submitting

- [ ] Message passes Mixed Alphabet check? (no word mixes 2+ minority-alphabet chars)
- [ ] Message passes Greek check? (no Greek characters)
- [ ] Message passes Korean/Chinese thresholds?
- [ ] Not already matched by existing keyword or pattern?
- [ ] Phrase is 2–4 words (or single word that's a very distinctive spam term)?
- [ ] Last word only is stemmed (if Slavic inflected phrase)?
- [ ] Not a false positive in normal Ukrainian/Russian conversation?
- [ ] Pattern uses `\\d+`, `\\s*`, and `\\$` escaping (if regex)?
