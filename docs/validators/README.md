# Validators

Moderation rules that detect spam messages. Each rule is a separate module with a finder function that returns match info or `null`.

## Overview

`validateMessage(text)` in `validateMessage.ts` runs all rules in order. First match wins — subsequent rules are not checked.

```
text → mixedAlphabet → keyword → greek → korean → chinese → pass
         ↓ match?        ↓         ↓        ↓         ↓
         return        return    return   return    return
```

## ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;       // true = message passes all rules
  ruleName?: string;      // 'mixed_rule' | 'keyword_rule' | 'greek_rule' | 'korean_rule' | 'chinese_rule'
  triggerWord?: string;   // The word/keyword/character count that triggered the ban
  isEdit?: boolean;       // Set externally when triggered by message edit
  isPattern?: boolean;    // true if keyword match was a regex pattern
}
```

## Rules

### Mixed Alphabet Rule

**File:** `mixedAlphabetRule.ts`

Detects character confusion attacks where attackers substitute look-alike characters from different scripts (e.g., Latin 'C' instead of Cyrillic 'С', Latin 'i' instead of Cyrillic 'і').

**Algorithm:**
1. Split text into words (letters only: `a-zA-Zа-яА-ЯіїєґІЇЄҐ`)
2. For each word, count characters per alphabet (Latin, Cyrillic)
3. Find the dominant alphabet (most frequent)
4. If any non-dominant alphabet appears 2+ times → flag as attack

**Examples:**
- `Складнопідрядний` → all Cyrillic → PASS
- `Cкладнопiдрядний` → Latin C + Cyrillic к + Latin i + Cyrillic і → FAIL (2 Latin in Cyrillic-dominant word)

**Supported alphabets:** Latin, Cyrillic (Russian + Ukrainian extended: іїєґІЇЄҐ)

**Unicode ranges (via `alphabetUtils.ts`):**
- Cyrillic: U+0400–U+04FF
- Latin: U+0041–U+005A (A-Z), U+0061–U+007A (a-z)

---

### Keyword Rule

**File:** `keywordRule.ts`

Matches message text against two data sources:

**1. Spam Keywords** (`references/spam-keywords.json`)
- JSON array of strings
- Case-insensitive substring match
- Example: `["free crypto", "airdrop now", "click here"]`

**2. Spam Patterns** (`references/spam-patterns.json`)
- JSON array of regex pattern strings
- Compiled with `'i'` flag (case-insensitive)
- Example: `["t\\.me/\\+", "bit\\.ly/"]`

**Matching order:** Keywords are checked first (substring), then patterns (regex). First match wins.

**Caching:** Both lists are loaded once from disk and cached in module-level variables. Restart bot after modifying the JSON files.

**Return type:**
```typescript
interface SpamMatch {
  value: string;     // The matched keyword or pattern source string
  isPattern: boolean; // true if matched via regex
}
```

---

### Greek Rule

**File:** `greekRule.ts`

Detects any Greek alphabet character in the message. Used to catch spam that uses Greek characters to evade filters or create misleading messages.

**Unicode ranges:**
- Basic Greek: U+0370–U+03FF
- Greek Extended: U+1F00–U+1FFF

**Threshold:** Any single Greek character triggers a ban.

**Return type:**
```typescript
interface GreekSymbolMatch {
  symbol: string;  // The Greek character found
  word: string;    // The word containing it
}
```

---

### Korean Rule

**File:** `koreanRule.ts`

Counts Korean (Hangul) characters in the message. Bans if count exceeds threshold.

**Threshold:** 15 characters

**Unicode ranges:**
- Hangul Jamo: U+1100–U+11FF
- Hangul Compatibility Jamo: U+3130–U+318F
- Hangul Syllables: U+AC00–U+D7A3
- Hangul Jamo Extended-A: U+A960–U+A97F
- Hangul Jamo Extended-B: U+D7B0–U+D7FF

**Why threshold?** A small number of Korean characters is allowed to avoid false positives (e.g., a single loanword or brand name).

**Return type:** Count of Korean characters if threshold exceeded, `null` otherwise.

---

### Chinese Rule

**File:** `chineseRule.ts`

Counts CJK (Chinese/Han) characters in the message. Bans if count exceeds threshold.

**Threshold:** 4 characters

**Unicode ranges:**
- CJK Unified Ideographs: U+4E00–U+9FFF
- CJK Extension A: U+3400–U+4DBF
- CJK Compatibility Ideographs: U+F900–U+FAFF
- CJK Unified Ideographs Extension B: U+20000–U+2A6DF (surrogate pairs)

**Why threshold?** CJK ranges cover Chinese, Japanese, and Korean Han ideographs. A small number allows brand names or borrowed terms.

**Return type:** Count of CJK characters if threshold exceeded, `null` otherwise.

---

## Adding a New Rule

1. Create `src/validators/yourRule.ts`:
   ```typescript
   export const findYourMatch = (text: string): { word: string } | null => {
     // Your detection logic
     return match ? { word: match } : null;
   };
   ```

2. Export from `src/validators/index.ts`:
   ```typescript
   export { findYourMatch } from './yourRule';
   ```

3. Add check in `src/validators/validateMessage.ts`:
   ```typescript
   const yourMatch = findYourMatch(text);
   if (yourMatch) {
     return {
       isValid: false,
       ruleName: 'your_rule',
       triggerWord: yourMatch.word,
     };
   }
   ```

4. Add ban reason formatting in `src/utils/formatters.utils.ts`:
   ```typescript
   case 'your_rule':
     return `Description of violation ${wrap(triggerWord)}`;
   ```

## Modifying Spam Data

### Keywords

Edit `references/spam-keywords.json`:
```json
["free crypto", "airdrop now", "join my channel"]
```

- Case-insensitive substring match
- Empty strings are skipped
- Restart bot after changes (cached in memory)

### Patterns

Edit `references/spam-patterns.json`:
```json
["t\\.me/\\+", "bit\\.ly/", "https?://.*\\.xyz"]
```

- Standard JavaScript regex syntax
- Compiled with `'i'` flag (case-insensitive)
- Invalid patterns log an error and are skipped
- Restart bot after changes (cached in memory)

## Related

- [Architecture](../architecture/) — Message flow and skip logic
- [Services](../services/) — What happens after a violation is detected
