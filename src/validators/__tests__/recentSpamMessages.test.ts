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

/**
 * Oct 22, 2026 batch: 10 samples (9 unique — one drone-pay ad forwarded twice).
 * Covers the new ukraineWar category (drone-cam pay spam, draft-evasion services),
 * the Fraktur-style char confusion caught by mixed_rule, and Joker_money_work job scams.
 */
const oct22_2026Spam: { id: string; text: string; expectedRule: ExpectedRule }[] = [
  { id: 'intimacy-new-toy-76-viewers', text: 'зараз доставляю собі задоволення своєю новою іграшкою, мене дивляться вже 76 осіб^^', expectedRule: 'keyword_rule' },
  { id: 'bpla-fraktur-drone-pilots', text: '🆒 Ищ𝔢𝔪 э𝔨𝔠𝔨люзив: п𝔭илё𝔱ы и п𝔬п𝔞д𝔞ния Г𝔢𝔭𝔞н𝔢й. Пл𝔞𝔱и𝔪 з𝔞 г𝔬дн𝔬𝔢 вид𝔢𝔬 — д𝔬 5000 d ollar o v . П𝔬лн𝔞я 𝔞н𝔬ни𝔪н𝔬𝔠𝔱ь. ℭ𝔨идыв𝔞й в @content_bpla_bot 🆒', expectedRule: 'mixed_rule' },
  { id: 'khalturka-bila-tema-joker-work', text: 'Підкину халтурку на разову роботу на місці! Це біла тема   Ніяких вкладень не потрібно.  Спочатку введу в курс справи... Гроші одразу за фактом! ⁠Тільки для тих, хто не зникає. Напиши мені t.me/Joker_money_work, якщо вийде 🙂', expectedRule: 'keyword_rule' },
  { id: 'prosta-khaltura-zakonni-joker-work', text: 'Потрібна допомога 🙂 на просту халтуру! Тільки законні справи.  Платити ні за що не треба. ⁠Дам чіткі інструкції 📝! ⁠Скину гроші щойно зробиш! ⁠Підійде той, хто не зливається. Напиши t.me/Joker_money_work, якщо вийде ✌️', expectedRule: 'keyword_rule' },
  { id: 'sprava-na-vyizd-joker-work', text: 'Хто готовий взятися за справу? на справу на виїзді. Допомога без скаму та всього нелегального  Купувати нічого не потрібно  ⁠Спочатку введу в курс справи...  Гроші одразу за фактом   Вимога одна: не зникати з радарів. Якщо готовий допомогти — чекаю в @Joker_money_work', expectedRule: 'keyword_rule' },
  { id: 'lezhu-v-lizhku-na-telefon', text: 'лежу в ліжку, знімаю на телефон, як доставляю собі задоволення іграшкою^^ подивитеся?)', expectedRule: 'keyword_rule' },
  { id: 'podruha-kamera-igrashky', text: 'зараз прийшла до подруги, плануємо розважатися на камеру з іграшками^^ хочете подивитися?) не соромтеся', expectedRule: 'keyword_rule' },
  { id: 'bpla-drone-cam-pay-5k', text: 'Пл@чy д0 5ķ д0лар1в zа к@дрN приль0тів дp0н0в @content_bpla_bot', expectedRule: 'keyword_rule' },
  { id: 'bpla-drone-cam-pay-5000', text: 'Пл@чy д0 5OOO д0лл@р1в zа к@дрN приль0тів дp0н0в @content_bpla_bot', expectedRule: 'keyword_rule' },
  { id: 'bpla-drone-pay-no-handle', text: 'Пл@чy д0 5к д0лар1в за к@дрN приль0тів дp0н0в', expectedRule: 'keyword_rule' },
  { id: 'booking-deferment-legal-exit', text: 'Help with booking, deferment and legal exit from Ukraine. DM for details.', expectedRule: 'keyword_rule' },
];

describe('Oct 22 2026 spam batch', () => {
  for (const { id, text, expectedRule } of oct22_2026Spam) {
    it(`${id} triggers ${expectedRule}`, () => {
      const result = validateMessage(text);
      expect(result.isValid).toBe(false);
      expect(result.ruleName).toBe(expectedRule);
    });
  }
});

/**
 * Oct 23, 2026 batch: 10 day-labor ads forwarded from "Август Курушин"
 * ("Сразу после работы — 5 700 на руки"). Amounts vary (5 200–5 700) and
 * phrasing rotates between 4 templates, so every message carries at least
 * 2 independent markers: amount+на руки / расчёт на руки / оплата по
 * завершении / выплата в тот же день / после работы—N / требуются / нужны N человек.
 */
const oct23_2026Spam: { id: string; text: string; expectedRule: ExpectedRule }[] = [
  { id: 'dacha-sbor-musora-5700', text: 'На даче нужно собрать мусор и старые вещи и сложить их возле ворот. Работа на несколько часов. Сразу после работы — 5 700 на руки.', expectedRule: 'keyword_rule' },
  { id: 'razbor-zabora-doski-5200', text: 'После разбора забора нужно убрать оставшиеся доски. Требуются 2 человека. Расчёт на руки сразу после работы — 5 200.', expectedRule: 'keyword_rule' },
  { id: 'posle-remonta-meshki-5200', text: 'После ремонта нужно собрать мусор в мешки. Требуются 2 человека. Оплата по завершении — 5 200 на руки.', expectedRule: 'keyword_rule' },
  { id: 'perenesti-bloki-5200', text: 'На участке нужно перенести строительные блоки. Требуются 3 человека. Сразу после работы — 5 200 на руки.', expectedRule: 'keyword_rule' },
  { id: 'meshki-materialy-stena-5700', text: 'Нужно перенести несколько мешков с материалами и сложить их у стены. Расчёт на руки сразу после работы — 5 700.', expectedRule: 'keyword_rule' },
  { id: 'perestanovka-mebeli-5200', text: 'Сегодня после 18:00 нужны 2 человека для перестановки мебели. Выплата в тот же день — 5 200.', expectedRule: 'keyword_rule' },
  { id: 'kladovka-veshchi-5400', text: 'Вечером нужно разобрать вещи в кладовке. После выполнения — 5 400 на руки.', expectedRule: 'keyword_rule' },
  { id: 'razgruzit-mashinu-5200', text: 'Завтра нужно разгрузить небольшую машину. Требуются 2 человека, работа примерно на 2 часа. Расчёт на руки сразу после работы — 5 200.', expectedRule: 'keyword_rule' },
  { id: 'razobrat-tumbu-5200', text: 'Завтра нужны 2 человека, чтобы разобрать старую тумбу и вынести детали. Выплата в тот же день — 5 200.', expectedRule: 'keyword_rule' },
  { id: 'ubrat-starye-doski-5200', text: 'Завтра нужны 2 человека, чтобы убрать старые доски с площадки. Оплата по завершении — 5 200 на руки.', expectedRule: 'keyword_rule' },
];

describe('Oct 23 2026 day-labor batch', () => {
  for (const { id, text, expectedRule } of oct23_2026Spam) {
    it(`${id} triggers ${expectedRule}`, () => {
      const result = validateMessage(text);
      expect(result.isValid).toBe(false);
      expect(result.ruleName).toBe(expectedRule);
    });
  }
});

/**
 * Oct 23, 2026 (later): USDT bulk-buy lure — dotted obfuscation + volume bait.
 */
const usdtBuySpam: { id: string; text: string; expectedRule: ExpectedRule }[] = [
  { id: 'kuply-usdt-bolshie-obyemy', text: 'Всем привет) Куплю U.S.D.T. Интересуют большие объемы.', expectedRule: 'keyword_rule' },
];

describe('Oct 23 2026 USDT buy batch', () => {
  for (const { id, text, expectedRule } of usdtBuySpam) {
    it(`${id} triggers ${expectedRule}`, () => {
      const result = validateMessage(text);
      expect(result.isValid).toBe(false);
      expect(result.ruleName).toBe(expectedRule);
    });
  }
});

/**
 * Oct 30 – Nov 3 2026 batch: job-spam campaign forwarded from "Deleted Account"
 * (3 text variants of the @VladislavHR lure, @geranpp vacancy digest, and the
 * @LoganJimenez549 price-bait post). All obfuscated copies are caught by
 * mixed_rule in prod (first-hit word logged); the clean variants below are the
 * keyword fallback net in case the spammer drops the obfuscation.
 */
const nov2_2026Spam: { id: string; text: string; expectedRule: ExpectedRule }[] = [
  { id: 'geranpp-vakansii-obfusked', text: '💼 Рабoтa и подpα6oтκα\n🔎 Βακahсии в ра3ηыχ сферaх: дοставка, сkлады, мага3ины и мнοгое другое.\n\n👇 ЖМИ НИЖЕ И HΑЙДИ CBΟЮ PАБОТУ! 🚀\n@geranpp', expectedRule: 'mixed_rule' },
  { id: 'vladislavhr-bystryy-zarabotok-1', text: 'Здраствуйте,нужен быстрый зaрa6отоκ?Могу прeдложить,без οпытa и вложений!\nПиши Сюда➡️@VladislavHR', expectedRule: 'mixed_rule' },
  { id: 'vladislavhr-bystryy-zarabotok-2', text: '3дрaствуйтe,нужεη 6ыcтрый зaρаботoк?Мoгу предложить,бeз опыта и влοжений!\nΠиши Ϲюдa➡️@VladislavHR', expectedRule: 'mixed_rule' },
  { id: 'vladislavhr-bystryy-zarabotok-3', text: '3дρaстβуйте,нyжеh быстрый ȝаработоk?Могy πрεдложить,беȝ οпыта и вложений!\nПиши Сюда➡️@VladislavHR', expectedRule: 'mixed_rule' },
  { id: 'logan-jimenez-tseny-rastut', text: '🥬 Цены ραстут, рαcходы рαстут, а 3арπлата вϲё та жε?\n\nШукаємо bідпоβідалbηиẍ людей для ρоботи.\nОплатa — 1500$ на місяць + бонyси.\nMожhа 6е3 дoϲbідy.\nПишіть у привaтні➡️ @LoganJimenez549\n\nНe о6язательно мириться c этим.\nПомогу найти дополηительhые вοзможности для зαрабοтка\nПиши мне @geranpp', expectedRule: 'mixed_rule' },
  // de-obfuscated variants — keyword fallback
  { id: 'geranpp-vakansii-clean', text: 'Работа и подработка\nВакансии в разных сферах: доставка, склады, магазины и многое другое.\n\n👇 ЖМИ НИЖЕ И НАЙДИ СВОЮ РАБОТУ! 🚀\n@geranpp', expectedRule: 'keyword_rule' },
  { id: 'vladislavhr-clean-spaced', text: 'Здраствуйте,нужен быстрый заработок?Могу предложить,без опыта и вложений!\nПиши Сюда ➡️ @VladislavHR', expectedRule: 'keyword_rule' },
  { id: 'logan-jimenez-clean', text: 'Цены растут, расходы растут, а зарплата всё та же?\n\nШукаємо відповідальних людей для роботи.\nОплата — 1500$ на місяць + бонуси.\nМожна без досвіду.\nПишіть у приватні➡️ @LoganJimenez549\n\nНе обязательно мириться с этим.\nПомогу найти дополнительные возможности для заработка\nПиши мне @geranpp', expectedRule: 'keyword_rule' },
];

describe('Oct 30 – Nov 3 2026 job-spam campaign', () => {
  for (const { id, text, expectedRule } of nov2_2026Spam) {
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
    // Oct 30–Nov 3 2026 rule guards: same words, no spam template
    'Є вакансії в різних містах країни, надішлю деталі',
    'Швидкий заработок — це міф, не ведіться на такі оголошення',
    'Питання без досвіду: напишіть, поясню з чого почати',
    // Oct 23 2026 rule guards: same words, no spam template
    'Отправлю тебе 100 USDT завтра утром',
    'Интересуют большие партии, объём вагонами',
    'Сразу после работы заеду в магазин за хлебом',
    'Расчёт за услуги подрядчика проведём в пятницу',
    'После выполнения работ подрядчик пришлёт акт',
    'Нужно собрать мусор и вынести к утру, помогите?',
    'Дякую за допомогу, все працює',
    'Пиши коли звільнишся, поговоримо',
    'Как дела? Напиши позже',
    'Поговорим пару часов завтра',
    'Отправлю на карту вечером, проверь',
    'Дам четкие инструкции по проекту',
    // Legit war talk must not hit the ukraineWar category
    'Дрони збивають над містом щоночі, тримаймося!',
    'Допомога з виїздом за кордон: бронювання та відстрочка, все легально',
    'Номер договору №5 підписано, надішлю скан',
    'Журналісти опублікували кадри з місця події',
    'Вночі чути було прильоти, дрони летіли на низькій висоті',
    'Плачу за кадри окремо від решти роботи',
    'Оплатимо за кадри з дрона, зйомка з висоти',
  ];

  for (const text of legitimateMessages) {
    it(`passes: "${text}"`, () => {
      expect(validateMessage(text).isValid).toBe(true);
    });
  }
});
