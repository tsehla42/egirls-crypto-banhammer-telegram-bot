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

/**
 * Oct 2026 batch: 29 spam samples. 28/29 covered (all but the emoji-only
 * "✅✅✅✅✅ 👍👍👍..." message, which has no text for regex rules to match).
 */
type ExpectedRule = 'mixed_rule' | 'keyword_rule' | 'greek_rule' | 'korean_rule' | 'chinese_rule';

const oct2026Spam: { id: string; text: string; expectedRule: ExpectedRule }[] = [
  { id: 'joker-nepostoyannaya-zanyatost', text: 'Есть задачка на непостоянную занятость в городе! ⁠Это не колл-центр и никакой запрещенки ✅  Платить ни за что не надо. ⁠Дам четкие инструкции 📝. Оплата сразу на карту! ⁠Нужно просто быть на связи 📱.  Для связи пишите t.me/Joker_money_rabota', expectedRule: 'keyword_rule' },
  { id: 'paru-chasov-dela-4100', text: 'Пару часов дела, деньги в руки 4100 рублей💳 и маленький бонус в знак благодарности, Только для первых! Условия у меня в личке.💬.', expectedRule: 'keyword_rule' },
  { id: 'bystraya-rabota-posle-smeny', text: '. Быстрая работа с приятным бонусом🎁, платим после смены 3400 рублей 🤑 и добавляем сюрприз. Места ограничены! Пиши. 💬', expectedRule: 'keyword_rule' },
  { id: 'krupnyy-kesh-v-shapku', text: 'Крупный кэш для быстрых парней.Вперёд — в шапку. 💎🔥', expectedRule: 'keyword_rule' },
  { id: 'bot-promo-air-4ak', text: 'Привет 👋\n\nЕсли много работаешь с Telegram, возможно, пригодится один инструмент.\n\nДаю бесплатно протестировать бота с функциями:\n• чаты и ЛС\n• поиск групп\n• автоответчик\n• автovступление\n• парсинг\n• дополнительные инструменты\n\nТест бесплатный → @AIR_4AK', expectedRule: 'mixed_rule' },
  { id: 'khalturka-podarok-sverkhu', text: 'Халтурка для тех, кто не теряет время: быстрые деньги и подарок сверху 💸 Места заканчиваются! Пишите скорее.  💬', expectedRule: 'keyword_rule' },
  { id: 'odno-portuchenie-dalshe-ssylka', text: 'Нужен человек для одного поручения. Оплата сразу. 📦✅Дальше — по ссылке.', expectedRule: 'keyword_rule' },
  { id: 'para-chasov-oplata-malenkaya', text: 'Пара часов работы и получаешь оплату маленькую 🎁подарочек🎁 о которой остальные даже не знают ) Пиши расскажу подробнее. 💬', expectedRule: 'keyword_rule' },
  { id: 'legkaya-khaltura-4200', text: 'Лёгкая халтура на пару часов - деньги в руки 4200 рублей💰 и неожиданный бонус ждёт тебя. Пиши скорее!', expectedRule: 'keyword_rule' },
  { id: 'podgotovka-fishka-zaplatim', text: 'Простая подработка с фишкой, заплатим 3600 рублей💵, а первым достанется кое-что особенное. Подробности в ЛС.💬', expectedRule: 'keyword_rule' },
  { id: 'svetlana-intim-virt', text: 'Светлана твоя мечта))\nПредлагаю свой интим вирт контент 💵💸', expectedRule: 'keyword_rule' },
  { id: 'za-rabotay-20k-ssylka-v-opisanii', text: 'Свободен сегодня? Заработай 20к.Жми на ссылку в описании 🚗💨', expectedRule: 'keyword_rule' },
  { id: 'shabashka-dlya-pervykh', text: 'Шабашка быстро💨, просто и с сюрпризом для первых отписавших. Пиши в ЛС. 💬', expectedRule: 'keyword_rule' },
  { id: 'na-kartu-ot-4700', text: '⚠️ На сейчас 2 человека! На карту от 4.700 за выполнение задания. \nВсе вопросы в личные сообщения +', expectedRule: 'keyword_rule' },
  { id: 'service-tg-reklama', text: '🚀 SЕRVIСЕ ТG — PEKЛAMA B TЕLЕGRAM И МАХ!\n\nДоcтупныe форматы:\n— PACCЫЛKА С OTMЕТКAMИ @\n\n🔹 По вceм вопроcам:\n@ONLINE_SERVICE_TG_BOT', expectedRule: 'mixed_rule' },
  { id: 'pokazhu-sebya-v-ls', text: 'Покажу себя в лс 😘\nИграюсь с подружкой 😍🔥\nОт меня бонусы 🪖🎁', expectedRule: 'keyword_rule' },
  { id: 'poradayu-teleom-v-ls', text: 'Порадую своим красивым телом в лс 😏💦\nВоенных поощряю 🎁🤤', expectedRule: 'keyword_rule' },
  { id: 'ssylka-v-shapke-10k', text: '🤫 Молчишь? Зря. Там 10к за 10 мин. Ssылка в шAпке 🤫', expectedRule: 'mixed_rule' },
  { id: 'gorachiy-videozvonok', text: '➡️ГОРЯЧИЙ ВИДЕОЗВОНОК, ЖАРКАЯ ПЕРЕПИСКА, ФОТО,ВИДЕО НА ЗАКАЗ И АРХИВ. \n➡️БАЛУЮ СВОЕЙ КЛУБНИЧКОЙ⚠️\n\n➡️ВЫЖМУ С ТЕБЯ ВСЕ СОКИ💦\n\n💸💸💸💸💸💸 В ЛС🔞🔞\n\n➡️ДЛЯ ЗСУ ОДНО ВИДЕО БЕСПЛАТНО !💋💋💋\n\n➡️ ЖАРКИЙ ПРЕДПОКАЗ В ПРОФИЛЕ', expectedRule: 'keyword_rule' },
  { id: 'avtoposting-v-chaty', text: '⭕️ АВТОПОСТИНГ В ЧАТЫ TELEGRAM!\n\n✅ Доcтупныe форматы:\n— PACCЫЛKА С OTMЕТKAMИ @\n\n🔴 ЗАКАЗАТЬ: @ONLINE_SERVICE_TG_BOT', expectedRule: 'mixed_rule' },
  { id: 'skunu-kisku', text: 'Скину киску и грудь в лс💋🔞\n\nПорадую своим красивым телом в лс 😏💦\nВоенных поощряю 🎁🤤', expectedRule: 'keyword_rule' },
  { id: 'shoyno-zrobila-pryiemno', text: 'щойно зробила приємно своїй подрузі, а вона мене зняла на телефон і всім показує) хочете подивитися?)', expectedRule: 'keyword_rule' },
  { id: 'dostavlyayu-sobi-zadovolennya', text: 'зараз доставляю собі задоволення своєю новою іграшкою, мене дивляться вже 76 осіб^^', expectedRule: 'keyword_rule' },
  { id: 'rabotenka-joker', text: 'Есть работенка по конкретному адресу. Всё легально 🚫! За гарантии платить не придется. Все покажу и объясню!  Деньги сразу по факту! Ищу адекватного исполнителя! Напиши @Joker_money_rabota, если получится ✌️', expectedRule: 'keyword_rule' },
  { id: 'shukaemo-lyudey-na-robotu', text: 'Всім привіт! Шукаємо людей на роботу або підробіток. Можна поєднувати з навчанням або іншою роботою. Офіційне працевлаштування, від 150 грн/год, виплати щотижня. Графік можна підлаштувати під себе. Після онлайн- або офлайн-співбесіди можна вийти на роботу наступного дня. Кому цікаво — пишіть у приват!', expectedRule: 'keyword_rule' },
  { id: 'vidkrytyy-nabor-hr-zhytlo', text: 'Відкритий набір у команду HR. Формат не віддалений, НЕ ОФІС, вся робота лише в чаті. З 18 до 30 років.Навчання оплачуємо — 40 000 грн, по 10 000 грн щотижнево. Графік 5/2, погодинні перерви та година обіду. Стабільні премії, відпустка 10 днів кожні 4 місяці. Надаємо житло. Лишилось 3 місця, пиши за деталями.', expectedRule: 'keyword_rule' },
  { id: 'khotyat-zarabatyvat-alexa-reiko', text: 'Команда в поиске новых людей которые хотят зарабатывать ,а не работать \nРабота в офисе\nДоход от 2000$+ премии ,а так же еженедельные выплаты и возможность карьерного роста\nБолее подробней пиши — @AlexaReiko', expectedRule: 'keyword_rule' },
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

describe('Oct 2026 spam batch', () => {
  for (const { id, text, expectedRule } of oct2026Spam) {
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
    'Поговорим пару часов завтра',
    'Отправлю на карту вечером, проверь',
    'Дам четкие инструкции по проекту',
  ];

  for (const text of legitimateMessages) {
    it(`passes: "${text}"`, () => {
      expect(validateMessage(text).isValid).toBe(true);
    });
  }
});
