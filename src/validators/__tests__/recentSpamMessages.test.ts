import { describe, it, expect } from 'vitest';
import { validateMessage } from '../validateMessage';

/**
 * Regression tests for spam samples reported after docs/sample.md was written.
 * Pipeline order: mixed_rule → keyword_rule → greek_rule → korean_rule → chinese_rule
 */

const recentSpam = [
  {
    id: 'job-offer-joker-money-rabota',
    date: '2026-09-21',
    text: 'Нужен человек по адресу. Это не колл-центр и не связано с наркотиками ✅. Всё без стартовых расходов. Условия простые и понятные 😊. Договоримся по оплате заранее. Подойдёт тот, кто не пропадает. Если готов помочь — пиши @Joker_money_rabota',
    expectedRule: 'keyword_rule',
  },
  {
    id: 'azeri-ifsa-tiktoker',
    date: '2026-09-25',
    text: 'Tiktoker Miss Ləman, Koti, Əhdi, Chelsea, HQ və digər yalnızz Azəri ifşalar üçün...\n\n🔎 Axtarışa xarabaxanaa yaz, gəl.',
    expectedRule: 'keyword_rule',
  },
];

describe('Recent spam samples (Sept 2026)', () => {
  for (const { id, text, expectedRule } of recentSpam) {
    it(`${id} triggers ${expectedRule}`, () => {
      const result = validateMessage(text);
      expect(result.isValid).toBe(false);
      expect(result.ruleName).toBe(expectedRule);
    });
  }
});

describe('Legitimate messages around new rules should pass', () => {
  const legitimateMessages = [
    'Привіт! Як твої справи?',
    'Дякую за допомогу, все працює',
    'Пиши коли звільнишся, поговоримо',
    'Как дела? Напиши позже',
  ];

  for (const text of legitimateMessages) {
    it(`passes: "${text}"`, () => {
      expect(validateMessage(text).isValid).toBe(true);
    });
  }
});
