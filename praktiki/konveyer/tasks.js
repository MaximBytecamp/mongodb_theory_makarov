/* Содержание практикума «Аналитик витрины: конвейеры агрегации».
   Магазин, отдел аналитики и его сотрудники придуманы для практикума; данные — база shop
   со стенда курса (data.js).

   Нужный результат каждого задания не хранится списком: он считается исполнителем ag.js
   по эталонному конвейеру (поле answer). Эталоны, конвейеры коллег и ошибочные варианты
   предсказаний сверены с сервером MongoDB 7 скриптом sverka-tasks.js вне репозитория. */
(function () {
  const FROM = 'Ирина Белова, руководитель отдела аналитики интернет-магазина';

  /* Виды ошибок для ревью. Порядок не совпадает с порядком конвейеров;
     два вида (groupmatch, bucket) в конвейерах не встречаются. */
  const ERRORS = [
    ['projectlost', '$project перед стадией, которой нужно отброшенное поле'],
    ['groupmatch', 'Условие на результат группы стоит до $group'],
    ['unwindsum', 'Сумма по полю заказа после $unwind — итог повторён в каждой позиции'],
    ['nodollar', 'Путь к полю записан без знака $'],
    ['bucket', '$bucket без default, хотя есть значения вне границ'],
    ['order', 'Стадии стоят не в том порядке: $limit срабатывает раньше отбора'],
    ['matchbefore', 'Условие на элемент массива проверено до $unwind — проходят заказы целиком'],
    ['nosort', '$first или $last без $sort перед $group'],
  ];

  const LETTERS = [
    {
      subject: 'Добро пожаловать. Начнём с ревью',
      body: [
        'Вы — аналитик отдела, который собирает витрину продаж интернет-магазина: отчёты для руководителей по заказам, товарам и покупателям. Данные лежат в базе shop — та же база, что в модуле 4 справочника.',
        'Перед тем как отчёт уходит руководителю, конвейер проверяет второй аналитик. Ниже — восемь конвейеров коллег: задача, сам конвейер и что коллега написал по результату. Кнопка «Выполнить» запускает конвейер и показывает результат и число документов после каждой стадии.',
        'Решите, верен ли конвейер. Если нет — выберите вид ошибки и напишите, как исправить. Исправленный конвейер можно выполнить в поле ниже.',
        'Оценок по ходу работы не будет. Все решения я разберу в конце и пришлю рецензию.',
      ],
      task: 'Вынесите решение по всем восьми конвейерам и перейдите к письму 2 кнопкой внизу.',
    },
    {
      subject: 'Заявки руководителей: сборка из стадий',
      body: [
        'Пять заявок от руководителей. Стажёр заготовил для каждой набор стадий, но среди них есть лишние и ошибочные.',
        'Соберите конвейер: нажмите на стадию в наборе, чтобы добавить её в конец конвейера. Стрелки меняют порядок стадий, крестик возвращает стадию в набор. Стадии выполняются сверху вниз, поэтому порядок входит в заявку.',
        'Кнопка «Выполнить» показывает результат и сколько документов вышло из каждой стадии. Подходит ли результат под заявку, решаете вы.',
      ],
      task: 'Соберите конвейер для каждой из пяти заявок.',
    },
    {
      subject: 'Предсказание без запуска',
      body: [
        'Перед запуском аналитик сверяет конвейер с заявкой и заранее прикидывает результат. В этом письме конвейеры не запускаются: результат нужно выбрать по карточкам заказов.',
        'Слева — восемь заказов покупателя c-007: все поля, которые нужны конвейерам. Справа — пять конвейеров по этим заказам и для каждого четыре варианта результата. Один вариант — настоящий результат, остальные получаются, если допустить одну из типичных ошибок.',
        'Выберите вариант, который вернёт сервер.',
      ],
      task: 'Выберите результат для всех пяти конвейеров.',
    },
    {
      subject: 'Свои конвейеры',
      body: [
        'Последнее задание — пять конвейеров, которые вы пишете сами, без заготовок. Конвейер записывается списком стадий в синтаксисе mongosh: [ { $match: … }, { $group: … } ]. Можно вставить и вызов целиком: db.orders.aggregate([ … ]).',
        'Имена полей результата и порядок документов указаны в каждой задаче: отчёт читает программа, и она берёт поля по этим именам.',
        'Кнопка «Выполнить» показывает результат и число документов после каждой стадии. После сдачи я сравню ваш результат с нужным.',
      ],
      task: 'Напишите и выполните пять конвейеров, затем сдайте работу.',
    },
  ];

  /* ── Письмо 1: ревью ─────────────────────────────────────────── */
  const REVIEW = [
    { id: 'r1', author: 'Денис, стажёр', coll: 'orders', error: 'unwindsum',
      task: 'Выручка доставленных заказов от ноутбуков.',
      query: '[\n  { $match: { status: "доставлен" } },\n  { $unwind: "$items" },\n  { $match: { "items.category": "ноутбуки" } },\n  { $group: { _id: null, revenue: { $sum: "$total" } } }\n]',
      claim: 'Ноутбуки в доставленных заказах принесли 7 044 680.',
      answer: '[\n  { $match: { status: "доставлен" } },\n  { $unwind: "$items" },\n  { $match: { "items.category": "ноутбуки" } },\n  { $group: { _id: null, revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } }\n]',
      why: 'После $unwind в каждой позиции повторено поле total всего заказа. Сумма total по позициям-ноутбукам складывает итоги заказов целиком, вместе с мышами и наушниками в тех же заказах, и считает заказ с двумя ноутбуками дважды. Выручка позиции — количество, умноженное на цену.' },
    { id: 'r2', author: 'Полина, аналитик', coll: 'orders', error: 'projectlost',
      task: 'Сколько заказов в пути в каждом городе.',
      query: '[\n  { $project: { number: 1, delivery: 1 } },\n  { $match: { status: "в пути" } },\n  { $group: { _id: "$delivery.city", orders: { $sum: 1 } } },\n  { $sort: { _id: 1 } }\n]',
      claim: 'Заказов в пути сейчас нет ни в одном городе.',
      answer: '[\n  { $match: { status: "в пути" } },\n  { $group: { _id: "$delivery.city", orders: { $sum: 1 } } },\n  { $sort: { _id: 1 } }\n]',
      why: '$project оставил только number и delivery, поле status до $match не дошло. Условие не выполнилось ни у одного документа. Отбор ставят до $project или оставляют status в проекции.' },
    { id: 'r3', author: 'Глеб, аналитик', coll: 'orders', error: 'nosort',
      task: 'Номер первого по дате заказа каждого покупателя из трёх: c-007, c-011, c-018.',
      query: '[\n  { $match: { customer_id: { $in: ["c-007", "c-011", "c-018"] } } },\n  { $group: { _id: "$customer_id", first: { $first: "$number" } } },\n  { $sort: { _id: 1 } }\n]',
      claim: 'Первые заказы: 2026-0002, 2026-0006 и 2026-0001.',
      answer: '[\n  { $match: { customer_id: { $in: ["c-007", "c-011", "c-018"] } } },\n  { $sort: { created: 1 } },\n  { $group: { _id: "$customer_id", first: { $first: "$number" } } },\n  { $sort: { _id: 1 } }\n]',
      why: 'Без $sort документы приходят в $group в порядке хранения, по _id, и $first берёт заказ с наименьшим номером. Первый по дате заказ — после $sort по created.' },
    { id: 'r4', author: 'Денис, стажёр', coll: 'orders', error: 'order',
      task: 'Пять самых дорогих доставленных заказов.',
      query: '[\n  { $sort: { total: -1 } },\n  { $limit: 5 },\n  { $match: { status: "доставлен" } },\n  { $project: { _id: 0, number: 1, total: 1 } }\n]',
      claim: 'Доставленных заказов среди самых дорогих — только два, вот они.',
      answer: '[\n  { $match: { status: "доставлен" } },\n  { $sort: { total: -1 } },\n  { $limit: 5 },\n  { $project: { _id: 0, number: 1, total: 1 } }\n]',
      why: '$limit оставил пять самых дорогих заказов любого статуса, и $match нашёл среди них только доставленные. Отбор ставят до $limit, тогда предел берёт пять из доставленных.' },
    { id: 'r5', author: 'Полина, аналитик', coll: 'orders', error: 'nodollar',
      task: 'Выручка доставленных заказов по способам оплаты.',
      query: '[\n  { $match: { status: "доставлен" } },\n  { $group: { _id: "payment.method", revenue: { $sum: "$total" } } }\n]',
      claim: 'Способ оплаты у всех один, выручка 8,5 млн.',
      answer: '[\n  { $match: { status: "доставлен" } },\n  { $group: { _id: "$payment.method", revenue: { $sum: "$total" } } },\n  { $sort: { _id: 1 } }\n]',
      why: 'Без $ строка "payment.method" — один и тот же текст у всех документов, и все заказы попали в одну группу с этим текстом в _id. Путь к полю пишется "$payment.method".' },
    { id: 'r6', author: 'Глеб, аналитик', coll: 'orders', error: 'matchbefore',
      task: 'Сколько штук смартфонов продано в доставленных заказах.',
      query: '[\n  { $match: { status: "доставлен", "items.category": "смартфоны" } },\n  { $unwind: "$items" },\n  { $group: { _id: null, qty: { $sum: "$items.qty" } } }\n]',
      claim: 'Продано 118 смартфонов.',
      answer: '[\n  { $match: { status: "доставлен", "items.category": "смартфоны" } },\n  { $unwind: "$items" },\n  { $match: { "items.category": "смартфоны" } },\n  { $group: { _id: null, qty: { $sum: "$items.qty" } } }\n]',
      why: 'Условие на items.category до $unwind отбирает заказы, в которых есть смартфон, и заказ проходит со всеми позициями. После разворота в сумму попали штуки других товаров тех же заказов. То же условие повторяют после $unwind.' },
    { id: 'r7', author: 'Денис, стажёр', coll: 'orders', error: null,
      task: 'Средний чек доставленных заказов в каждом городе, округлённый до рубля, по убыванию.',
      query: '[\n  { $match: { status: "доставлен" } },\n  { $group: { _id: "$delivery.city", avg: { $avg: "$total" } } },\n  { $project: { avg: { $round: ["$avg", 0] } } },\n  { $sort: { avg: -1 } }\n]',
      claim: 'Самый высокий средний чек — в Новосибирске, 149 226.',
      answer: '[\n  { $match: { status: "доставлен" } },\n  { $group: { _id: "$delivery.city", avg: { $avg: "$total" } } },\n  { $project: { avg: { $round: ["$avg", 0] } } },\n  { $sort: { avg: -1 } }\n]',
      why: 'Конвейер верный: отбор до группировки, среднее по сумме заказа, округление в $project и сортировка по готовому полю.' },
    { id: 'r8', author: 'Полина, аналитик', coll: 'orders', error: null,
      task: 'Три самых продаваемых по штукам товара в доставленных заказах.',
      query: '[\n  { $match: { status: "доставлен" } },\n  { $unwind: "$items" },\n  { $group: { _id: "$items.title", qty: { $sum: "$items.qty" } } },\n  { $sort: { qty: -1, _id: 1 } },\n  { $limit: 3 }\n]',
      claim: 'Лидеры — iPhone 15, MacBook Air 13 и SSD Samsung 980.',
      answer: '[\n  { $match: { status: "доставлен" } },\n  { $unwind: "$items" },\n  { $group: { _id: "$items.title", qty: { $sum: "$items.qty" } } },\n  { $sort: { qty: -1, _id: 1 } },\n  { $limit: 3 }\n]',
      why: 'Конвейер верный: штуки — поле позиции, поэтому сначала $unwind; второй ключ сортировки делает порядок однозначным.' },
  ];

  /* ── Письмо 2: сборка из стадий ──────────────────────────────── */
  const BUILD = [
    { id: 'b1', client: 'коммерческий директор', coll: 'orders',
      request: 'Пять самых дорогих доставленных заказов: только номер и сумма, без _id, от дорогого к дешёвому.',
      blocks: [
        { id: 'a', code: '{ $limit: 5 }' },
        { id: 'b', code: '{ $match: { status: "доставлен" } }' },
        { id: 'c', code: '{ $sort: { total: 1 } }' },
        { id: 'd', code: '{ $project: { _id: 0, number: 1, total: 1 } }' },
        { id: 'e', code: '{ $skip: 5 }' },
        { id: 'f', code: '{ $sort: { total: -1 } }' },
        { id: 'g', code: '{ $match: { status: "в пути" } }' },
      ],
      answer: '[{ $match: { status: "доставлен" } }, { $sort: { total: -1 } }, { $limit: 5 }, { $project: { _id: 0, number: 1, total: 1 } }]',
      why: 'Отбор, затем сортировка по убыванию, затем предел и проекция. Предел до отбора взял бы пять заказов любого статуса, $skip пропустил бы первую пятёрку.' },
    { id: 'b2', client: 'руководитель продаж', coll: 'orders',
      request: 'Выручка доставленных заказов по городам: поле revenue, города по убыванию выручки.',
      blocks: [
        { id: 'a', code: '{ $sort: { revenue: -1 } }' },
        { id: 'b', code: '{ $group: { _id: "$delivery.city", revenue: { $sum: "total" } } }' },
        { id: 'c', code: '{ $match: { status: "доставлен" } }' },
        { id: 'd', code: '{ $group: { _id: "$delivery.city", revenue: { $sum: "$total" } } }' },
        { id: 'e', code: '{ $sort: { _id: 1 } }' },
        { id: 'f', code: '{ $count: "revenue" }' },
      ],
      answer: '[{ $match: { status: "доставлен" } }, { $group: { _id: "$delivery.city", revenue: { $sum: "$total" } } }, { $sort: { revenue: -1 } }]',
      why: 'В блоке с { $sum: "total" } строка без $ — не число, и сумма каждой группы равна нулю. Сортировка по _id упорядочила бы города по алфавиту.' },
    { id: 'b3', client: 'закупки', coll: 'orders',
      request: 'Сколько штук товаров каждой категории продано в доставленных заказах: поле qty, категории по убыванию qty.',
      blocks: [
        { id: 'a', code: '{ $group: { _id: "$items.category", qty: { $sum: "$items.qty" } } }' },
        { id: 'b', code: '{ $unwind: "$items" }' },
        { id: 'c', code: '{ $sort: { qty: -1 } }' },
        { id: 'd', code: '{ $match: { status: "доставлен" } }' },
        { id: 'e', code: '{ $group: { _id: "$category", qty: { $sum: "$qty" } } }' },
        { id: 'f', code: '{ $unwind: "items" }' },
      ],
      answer: '[{ $match: { status: "доставлен" } }, { $unwind: "$items" }, { $group: { _id: "$items.category", qty: { $sum: "$items.qty" } } }, { $sort: { qty: -1 } }]',
      why: 'Категория и количество — поля позиции, поэтому до $group нужен $unwind. После разворота путь к ним по-прежнему начинается с items. Путь в $unwind без $ даёт ошибку 28818.' },
    { id: 'b4', client: 'финансовый отдел', coll: 'orders',
      request: 'Доставленные заказы по суммам чека: корзины до 50 000, от 50 000 до 200 000 и от 200 000 до 500 000, в каждой — число заказов в поле count.',
      blocks: [
        { id: 'a', code: '{ $bucket: { groupBy: "$total", boundaries: [0, 50000, 200000] } }' },
        { id: 'b', code: '{ $match: { status: "доставлен" } }' },
        { id: 'c', code: '{ $sortByCount: "$total" }' },
        { id: 'd', code: '{ $bucket: { groupBy: "$total", boundaries: [0, 50000, 200000, 500000] } }' },
        { id: 'e', code: '{ $count: "count" }' },
      ],
      answer: '[{ $match: { status: "доставлен" } }, { $bucket: { groupBy: "$total", boundaries: [0, 50000, 200000, 500000] } }]',
      why: 'Границ на одну больше, чем корзин: для трёх корзин нужны четыре границы. С границами до 200 000 заказы дороже не находят корзину, и запрос завершается ошибкой 40066.' },
    { id: 'b5', client: 'региональный директор', coll: 'orders',
      request: 'Для каждого города — номер и сумма самого дорогого доставленного заказа (поля number и total), города по убыванию total.',
      blocks: [
        { id: 'a', code: '{ $group: { _id: "$delivery.city", number: { $first: "$number" }, total: { $first: "$total" } } }' },
        { id: 'b', code: '{ $sort: { total: 1 } }' },
        { id: 'c', code: '{ $match: { status: "доставлен" } }' },
        { id: 'd', code: '{ $sort: { total: -1 } }' },
        { id: 'e', code: '{ $group: { _id: "$delivery.city", number: { $max: "$number" }, total: { $max: "$total" } } }' },
        { id: 'f', code: '{ $sort: { total: -1 } }' },
      ],
      answer: '[{ $match: { status: "доставлен" } }, { $sort: { total: -1 } }, { $group: { _id: "$delivery.city", number: { $first: "$number" }, total: { $first: "$total" } } }, { $sort: { total: -1 } }]',
      why: '$sort до $group ставит в каждой группе первым самый дорогой заказ, и оба $first берут поля из него. $max по number вернул бы наибольший номер. Номер самого дорогого заказа так не получить. Сортировка нужна дважды: до группировки и для порядка городов.' },
  ];

  /* ── Письмо 3: предсказание ──────────────────────────────────── */
  const CARDS = { coll: 'orders', filter: { customer_id: 'c-007' } };
  const PREDICT = [
    { id: 'p1', pipeline: '[\n  { $match: { customer_id: "c-007" } },\n  { $group: { _id: "$status", count: { $sum: 1 } } },\n  { $sort: { count: -1, _id: 1 } }\n]',
      wrong: ['[{ $match: { customer_id: "c-007" } }, { $count: "count" }]',
        '[{ $match: { customer_id: "c-007" } }, { $group: { _id: "$status", count: { $sum: "$total" } } }, { $sort: { count: -1, _id: 1 } }]',
        '[{ $match: { customer_id: "c-007", status: "доставлен" } }, { $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]'],
      why: 'Восемь заказов делятся по статусу: «собирается» — 3, «в пути» и «доставлен» — по 2, «отменён» — 1. При равном числе группы упорядочены по _id, то есть по алфавиту.' },
    { id: 'p2', pipeline: '[\n  { $match: { customer_id: "c-007" } },\n  { $sort: { created: -1 } },\n  { $group: { _id: "$customer_id", last: { $first: "$number" } } }\n]',
      wrong: ['[{ $match: { customer_id: "c-007" } }, { $sort: { created: 1 } }, { $group: { _id: "$customer_id", last: { $first: "$number" } } }]',
        '[{ $match: { customer_id: "c-007" } }, { $group: { _id: "$customer_id", last: { $first: "$number" } } }]',
        '[{ $match: { customer_id: "c-007" } }, { $group: { _id: "$customer_id", last: { $max: "$number" } } }]'],
      why: 'Сортировка по created по убыванию ставит первым самый поздний заказ — 2026-0064 от 17 июня. $first берёт номер из него, хотя поле названо last.' },
    { id: 'p3', pipeline: '[\n  { $match: { customer_id: "c-007" } },\n  { $unwind: "$items" },\n  { $count: "lines" }\n]',
      wrong: ['[{ $match: { customer_id: "c-007" } }, { $count: "lines" }]',
        '[{ $match: { customer_id: "c-007" } }, { $unwind: "$items" }, { $group: { _id: "$items.category" } }, { $count: "lines" }]',
        '[{ $match: { customer_id: "c-007" } }, { $unwind: "$items" }, { $group: { _id: null, lines: { $sum: "$items.qty" } } }, { $project: { _id: 0 } }]'],
      why: 'В восьми заказах 15 позиций, после $unwind — 15 документов. 8 — число заказов, 5 — число категорий, 24 — сумма штук.' },
    { id: 'p4', pipeline: '[\n  { $match: { customer_id: "c-007", status: { $ne: "отменён" } } },\n  { $group: { _id: null, revenue: { $sum: "$total" } } }\n]',
      wrong: ['[{ $match: { customer_id: "c-007" } }, { $group: { _id: null, revenue: { $sum: "$total" } } }]',
        '[{ $match: { customer_id: "c-007", status: { $ne: "отменён" } } }, { $unwind: "$items" }, { $group: { _id: null, revenue: { $sum: "$total" } } }]',
        '[{ $match: { customer_id: "c-007", status: "доставлен" } }, { $group: { _id: null, revenue: { $sum: "$total" } } }]'],
      why: 'Без отменённого заказа на 6 790 остаются семь заказов, сумма их total — 926 180. Больший вариант получается, если сложить total после $unwind: итог заказа повторяется в каждой позиции.' },
    { id: 'p5', pipeline: '[\n  { $match: { customer_id: "c-007" } },\n  { $bucket: { groupBy: "$total", boundaries: [0, 10000, 100000, 500000] } }\n]',
      wrong: ['[{ $match: { customer_id: "c-007" } }, { $bucket: { groupBy: "$total", boundaries: [0, 50000, 200000, 500000] } }]',
        '[{ $match: { customer_id: "c-007", status: { $ne: "отменён" } } }, { $bucket: { groupBy: "$total", boundaries: [0, 10000, 100000, 500000] } }]',
        '[{ $match: { customer_id: "c-007" } }, { $bucket: { groupBy: "$total", boundaries: [0, 10000, 200000, 500000] } }]'],
      why: 'Суммы до 10 000: 6 790, 6 790 и 9 490 — три заказа. От 10 000 до 100 000: 79 990 и 86 880 — два. От 100 000: 163 250, 225 320 и 354 460 — три.' },
  ];

  /* ── Письмо 4: свой конвейер ─────────────────────────────────── */
  const WRITE = [
    { id: 'w1', coll: 'orders',
      task: 'Доставленные заказы по способу доставки: _id — способ (delivery.type), orders — число заказов, revenue — выручка. По убыванию revenue.',
      answer: '[{ $match: { status: "доставлен" } }, { $group: { _id: "$delivery.type", orders: { $sum: 1 }, revenue: { $sum: "$total" } } }, { $sort: { revenue: -1 } }]',
      hint: '$match по статусу, $group с двумя аккумуляторами, $sort по готовому полю revenue.' },
    { id: 'w2', coll: 'products',
      task: 'Коллекция products. Средняя цена товаров каждой категории, округлённая до рубля: _id — категория, avg — средняя цена. По возрастанию avg.',
      answer: '[{ $group: { _id: "$category", avg: { $avg: "$price" } } }, { $project: { avg: { $round: ["$avg", 0] } } }, { $sort: { avg: 1 } }]',
      hint: 'Округление — в $project после $group, выражением $round с двумя аргументами.' },
    { id: 'w3', coll: 'orders',
      task: 'Покупатели, у которых сумма доставленных заказов больше 400 000: _id — customer_id, spent — сумма. По убыванию spent.',
      answer: '[{ $match: { status: "доставлен" } }, { $group: { _id: "$customer_id", spent: { $sum: "$total" } } }, { $match: { spent: { $gt: 400000 } } }, { $sort: { spent: -1 } }]',
      hint: 'Условие на сумму проверяется после $group: до группировки поля spent ещё нет.' },
    { id: 'w4', coll: 'orders',
      task: 'Для каждого города — массив номеров отменённых заказов по возрастанию номера: _id — город, numbers — массив. Города по алфавиту.',
      answer: '[{ $match: { status: "отменён" } }, { $sort: { number: 1 } }, { $group: { _id: "$delivery.city", numbers: { $push: "$number" } } }, { $sort: { _id: 1 } }]',
      hint: '$push кладёт значения в порядке прихода документов: отсортируйте заказы по номеру до $group.' },
    { id: 'w5', coll: 'orders',
      task: 'Одним запросом по доставленным заказам: в поле total — массив из одного документа { orders: число заказов }, в поле top — три товара с наибольшим числом штук (_id — название, qty — штуки), по убыванию qty, при равенстве — по названию.',
      answer: '[{ $match: { status: "доставлен" } }, { $facet: { total: [{ $count: "orders" }], top: [{ $unwind: "$items" }, { $group: { _id: "$items.title", qty: { $sum: "$items.qty" } } }, { $sort: { qty: -1, _id: 1 } }, { $limit: 3 }] } }]',
      hint: 'Две ветки одной стадии $facet: в одной $count, в другой $unwind, $group, $sort и $limit.' },
  ];

  window.KV = { FROM, ERRORS, LETTERS, REVIEW, BUILD, CARDS, PREDICT, WRITE };
})();
