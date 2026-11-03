# Модуль 6 · Связи между коллекциями — рабочий план

Пять глав по PLAN.md. Базы — `shop`, `hh`, `org` (только чтение); глава 6.5
пишет только в `sandbox`. Как пишется глава — [AUTHORING.md](AUTHORING.md),
генератор — `tools/chapters6.py` поверх функций `chapters4.py`.

Источник — `11_reduce_slice_lookup.md` (часть о `$lookup`) и
`12_graphlookup_unionwith_merge.md`. Примеры исходника на users, posts,
departments в книгу не переносятся.

## Связи стенда

| Откуда | Куда | Поле связи | Что получается |
|---|---|---|---|
| `shop.orders` | `shop.customers` | `customer_id` → `_id` | у каждого заказа один покупатель |
| `shop.customers` | `shop.orders` | `_id` → `customer_id` | у каждого покупателя 2–6 заказов |
| `shop.orders` | `shop.products` | `items.sku` → `sku` | массив в `localField` |
| `hh.companies` | `hh.vacancies` | `name` → `company` | у Яндекса и ИП Сорокин вакансий нет |
| `hh.resumes` | `hh.vacancies` | должность и город | 3 резюме из 9 находят вакансию |
| `org.employees` | сами себя | `manager_id` → `_id` | дерево из 15 человек, 4 уровня |
| `org.categories` | сами себя | `parent_id` → `_id` | дерево из 10 категорий |

## Что сервер делает иначе, чем пишет исходник или ожидает читатель

- `from` с опечаткой — пустой массив у всех документов, без ошибки;
- `localField` отсутствует — сравнивается как `null` и присоединяет все документы
  без `foreignField` (у c-001 по `referrer` → `promo` найдено 80 заказов);
- `from: {db, coll}` для другой базы — ошибка 9; `$lookup` и `$unionWith` работают
  в пределах одной базы, `$unionWith` с несуществующей коллекцией молча ничего не добавляет;
- переменная `let` в обычном фильтре конвейера — строка `"$$cid"`, результат пустой;
- порядок документов `$lookup` с массивом в `localField` — порядок коллекции `from`, не массива;
- порядок результата `$graphLookup` не задан — в книге упорядочен `$sortArray`;
- `$merge` с `on` без уникального индекса — ошибка 51183; `$merge` не в конце — 40601;
  `whenMatched: "fail"` — ошибка 11000.

## Главы

- 6.1 `$lookup` — `temy/41-lookup`
- 6.2 `$lookup` с конвейером — `temy/42-lookup-pipeline`
- 6.3 `$graphLookup` — `temy/43-graphlookup`
- 6.4 `$unionWith` — `temy/44-unionwith`
- 6.5 `$merge` и `$out` — `temy/45-merge` (пишет в `sandbox`)

Дальше: ПР-06 «Оргструктура и витрина заказов» и итоговая КТ «Аналитический контур».
