import { describe, it, expect } from 'vitest';
import { findMixedAlphabetWord } from '../mixedAlphabetRule';
import { getAlphabetType } from '../alphabetUtils';

describe('getAlphabetType', () => {
  it('classifies Cyrillic characters', () => {
    expect(getAlphabetType('а')).toBe('cyrillic');
    expect(getAlphabetType('Я')).toBe('cyrillic');
    expect(getAlphabetType('і')).toBe('cyrillic');
    expect(getAlphabetType('ї')).toBe('cyrillic');
    expect(getAlphabetType('є')).toBe('cyrillic');
  });

  it('classifies Latin characters', () => {
    expect(getAlphabetType('a')).toBe('latin');
    expect(getAlphabetType('Z')).toBe('latin');
    expect(getAlphabetType('o')).toBe('latin');
    expect(getAlphabetType('c')).toBe('latin');
  });

  it('classifies Greek characters', () => {
    expect(getAlphabetType('α')).toBe('greek');
    expect(getAlphabetType('ρ')).toBe('greek');
    expect(getAlphabetType('ε')).toBe('greek');
    expect(getAlphabetType('χ')).toBe('greek');
    expect(getAlphabetType('β')).toBe('greek');
  });

  it('returns null for non-alphabet characters', () => {
    expect(getAlphabetType('1')).toBeNull();
    expect(getAlphabetType(' ')).toBeNull();
    expect(getAlphabetType('$')).toBeNull();
    expect(getAlphabetType('🎉')).toBeNull();
    expect(getAlphabetType('-')).toBeNull();
  });

  it('classifies styled/decorated letters as stylized', () => {
    expect(getAlphabetType('𝔢')).toBe('stylized'); // Mathematical Fraktur small e (U+1D522, astral)
    expect(getAlphabetType('𝔱')).toBe('stylized'); // Mathematical Fraktur small t
    expect(getAlphabetType('ℭ')).toBe('stylized'); // Black-letter capital C (U+212D)
    expect(getAlphabetType('Ｏ')).toBe('stylized'); // Fullwidth capital O
    expect(getAlphabetType('№')).toBe('stylized'); // Letterlike Symbols (U+2116)
  });
});

describe('findMixedAlphabetWord', () => {
  it('catches Latin+Cyrillic mixing with 2+ minority chars', () => {
    expect(findMixedAlphabetWord('беcплатнoε')).toBe('беcплатнoε');
    expect(findMixedAlphabetWord('мoжнocть')).toBe('мoжнocть');
    expect(findMixedAlphabetWord('Oбрaщаться')).toBe('Oбрaщаться');
    expect(findMixedAlphabetWord('Yдалёнкa')).toBe('Yдалёнкa');
  });

  it('catches words where Greek splits Latin from Cyrillic (whitespace split fix)', () => {
    // Words with only 1 Greek char — below 2+ threshold, correctly NOT caught by mixed_rule
    // These would be caught by greek_rule instead in the full pipeline
    expect(findMixedAlphabetWord('доχодом')).toBeNull(); // 1 Greek (χ), 6 Cyrillic
    expect(findMixedAlphabetWord('Отkρыт')).toBeNull(); // 1 Latin (k) + 1 Greek (ρ), each below threshold

    // Words with 2+ minority chars — correctly caught
    expect(findMixedAlphabetWord('мεheджεра')).toBe('мεheджεра'); // 2 Greek + 2 Latin
    expect(findMixedAlphabetWord('пpεβρатить')).toBe('пpεβρатить'); // 3 Greek (ε,β,ρ) + 1 Latin (p)
  });

  it('catches Greek+Cyrillic mixing with 2+ Greek chars', () => {
    expect(findMixedAlphabetWord('Коοрдинαтор')).toBe('Коοрдинαтор'); // 2 Greek (ο,α) + 9 Cyrillic
    // Ставκа-17 has only 1 Greek (κ) — below threshold
    expect(findMixedAlphabetWord('Ставκа-17')).toBeNull();
  });

  it('does not flag pure Cyrillic text', () => {
    expect(findMixedAlphabetWord('Привіт як справи')).toBeNull();
    expect(findMixedAlphabetWord('Дякую за допомогу')).toBeNull();
    expect(findMixedAlphabetWord('Добрий день')).toBeNull();
  });

  it('does not flag pure Latin text', () => {
    expect(findMixedAlphabetWord('Hello world')).toBeNull();
    expect(findMixedAlphabetWord('crypto is great')).toBeNull();
  });

  it('does not flag single minority character (threshold is 2)', () => {
    // Single Latin in Cyrillic word — could be a typo
    expect(findMixedAlphabetWord('тестc')).toBeNull();
  });

  it('does not flag emoji, digits, or punctuation mixed in', () => {
    expect(findMixedAlphabetWord('Добрий день 🎉')).toBeNull();
    expect(findMixedAlphabetWord('Ціна 100$')).toBeNull();
    expect(findMixedAlphabetWord('Ось посилання: https://t.me')).toBeNull();
  });

  it('handles multi-word messages correctly', () => {
    // Each Greek char appears only once per word — below threshold
    expect(findMixedAlphabetWord('скину сейчас κаждому по 500 гρивен, пишите + в лс')).toBeNull();
    expect(findMixedAlphabetWord('Привіт, як справи? Дякую!')).toBeNull();
  });

  it('catches Fraktur ("goth alphabet") letters mixed with Cyrillic', () => {
    // Oct 2026 batch: drone footage promo written in Mathematical Fraktur
    expect(findMixedAlphabetWord('Ищ𝔢𝔪')).toBe('Ищ𝔢𝔪'); // 2 Cyrillic + 2 Fraktur
    expect(findMixedAlphabetWord('Пл𝔞𝔱и𝔪')).toBe('Пл𝔞𝔱и𝔪'); // 3 Cyrillic + 3 Fraktur
    expect(findMixedAlphabetWord('э𝔨𝔠𝔨люзив')).toBe('э𝔨𝔠𝔨люзив'); // 6 Cyrillic + 3 Fraktur
  });

  it('does not flag a single stylized char in a Cyrillic word (threshold is 2)', () => {
    expect(findMixedAlphabetWord('тест𝔣')).toBeNull();
    expect(findMixedAlphabetWord('Номер договору №5')).toBeNull();
  });

  it('catches fullwidth Latin mixed with Cyrillic', () => {
    expect(findMixedAlphabetWord('ＯＯплата')).toBe('ＯＯплата'); // 2 fullwidth + 5 Cyrillic
  });
});
