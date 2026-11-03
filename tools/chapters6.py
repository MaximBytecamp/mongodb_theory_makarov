"""Примеры, таблицы ошибок и шпаргалки глав модуля 6 — исходник для snippets.py.

Модуль 6 соединяет коллекции: заказы с покупателями, компании с вакансиями,
сотрудников с руководителями. Литералы на четырёх языках собирают функции
chapters4.py, вывод документов целиком — docs_code. Глава 6.5 пишет только
в песочницу sandbox: цель $merge и $out всегда задана документом {db, coll}.

Числа в комментариях — то, что даёт стенд; вывод в книгу подставляет
examples.py apply.
"""

from chapters4 import IMPORT_ERR, LANGS4, docs_code, flat, gvar, pipeline, title_code, try_code

EXAMPLES: dict = {}
ERRORS: dict = {}
CHEATS: dict = {}


def example(chapter: str, name: str, caption: str, plain: dict) -> None:
    EXAMPLES.setdefault(chapter, {})[name] = {"caption": caption, "plain": plain}


def agg_docs(stages: list, coll: str = "orders") -> dict:
    return {lang: pipeline(stages, lang) + "\n\n" + docs_code(lang, coll) for lang in LANGS4}


def several(chapter: str, name: str, caption: str, variants: list) -> None:
    """Несколько конвейеров подряд: у каждого заголовок и документы целиком.
    variants — список (заголовок, имя переменной, коллекция, стадии)."""
    def code(lang: str) -> str:
        decl = "\n\n".join(pipeline(st, lang, gvar(var, lang)) for _, var, _, st in variants)
        runs = "\n\n".join(title_code(lang, title) + "\n" + docs_code(lang, coll, gvar(var, lang), first=(i == 0))
                           for i, (title, var, coll, _) in enumerate(variants))
        return decl + "\n\n" + runs
    example(chapter, name, caption, {lang: code(lang) for lang in LANGS4})


def tries(chapter: str, name: str, caption: str, variants: list) -> None:
    """Конвейеры, которые сервер отклоняет. variants — (заголовок, переменная, коллекция, стадии)."""
    def code(lang: str) -> str:
        decl = "\n\n".join(pipeline(st, lang, gvar(var, lang)) for _, var, _, st in variants)
        runs = "\n\n".join(title_code(lang, title) + "\n" + try_code(lang, coll, gvar(var, lang), first=(i == 0))
                           for i, (title, var, coll, _) in enumerate(variants))
        return IMPORT_ERR.get(lang, "") + decl + "\n\n" + runs
    example(chapter, name, caption, {lang: code(lang) for lang in LANGS4})


def expr_lines(value) -> dict:
    return {lang: [flat(value, lang)] for lang in LANGS4}


C3 = {"$match": {"_id": {"$in": ["c-001", "c-007", "c-020"]}}}
ONE_ORDER = {"$match": {"_id": "o-0002"}}
TO_CUSTOMER = {"$lookup": {"from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customer"}}
TO_VACANCIES = {"$lookup": {"from": "vacancies", "localField": "name", "foreignField": "company", "as": "vacancies"}}


# ── 6.1 $lookup ───────────────────────────────────────────────────────────

# заказ и его покупатель
example("6.1", "one", "$lookup: покупатель заказа", agg_docs([
    ONE_ORDER,
    TO_CUSTOMER,
    {"$project": {"_id": 0, "number": 1, "customer_id": 1,
                  "customer.name": 1, "customer.city": 1, "customer.segment": 1}},
]))

# массив из одного элемента становится документом
example("6.1", "segments", "выручка по сегментам покупателей", agg_docs([
    {"$match": {"status": "доставлен"}},
    TO_CUSTOMER,
    {"$unwind": "$customer"},
    {"$group": {"_id": "$customer.segment", "orders": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
    {"$sort": {"revenue": -1}},
]))

# один ко многим
example("6.1", "many", "покупатель и все его заказы", agg_docs([
    C3,
    {"$lookup": {"from": "orders", "localField": "_id", "foreignField": "customer_id", "as": "orders"}},
    {"$project": {"name": 1, "count": {"$size": "$orders"}, "numbers": "$orders.number"}},
], coll="customers"))

# совпадений нет — пустой массив
example("6.1", "empty", "компании и их вакансии", agg_docs([
    TO_VACANCIES,
    {"$project": {"_id": 0, "name": 1, "count": {"$size": "$vacancies"}, "titles": "$vacancies.title"}},
], coll="companies"))

# $unwind после $lookup
several("6.1", "unwind", "$unwind после $lookup: куда деваются компании без вакансий", [
    ("$lookup и $unwind", "plain", "companies", [TO_VACANCIES, {"$unwind": "$vacancies"}, {"$count": "docs"}]),
    ("с preserveNullAndEmptyArrays", "kept", "companies",
     [TO_VACANCIES, {"$unwind": {"path": "$vacancies", "preserveNullAndEmptyArrays": True}}, {"$count": "docs"}]),
])

# localField — массив
example("6.1", "array", "localField — массив: товары позиций заказа", agg_docs([
    ONE_ORDER,
    {"$lookup": {"from": "products", "localField": "items.sku", "foreignField": "sku", "as": "goods"}},
    {"$project": {"_id": 0, "skus": "$items.sku", "goods": {"$map": {
        "input": "$goods", "in": {"sku": "$$this.sku", "rating": "$$this.rating"}}}}},
]))

# ошибка в имени коллекции
example("6.1", "typo", "в from — коллекция, которой нет", agg_docs([
    ONE_ORDER,
    {"$lookup": {"from": "customer", "localField": "customer_id", "foreignField": "_id", "as": "customer"}},
    {"$project": {"_id": 0, "number": 1, "customer": 1}},
]))

# поля localField нет у документа
example("6.1", "missing", "поля из localField нет у документа", agg_docs([
    {"$match": {"_id": "c-001"}},
    {"$lookup": {"from": "orders", "localField": "referrer", "foreignField": "promo", "as": "found"}},
    {"$project": {"_id": 0, "name": 1, "found": {"$size": "$found"}}},
], coll="customers"))

tries("6.1", "errors", "записи $lookup, которые сервер не принимает", [
    ("нет as", "no_as", "orders", [{"$lookup": {"from": "customers", "localField": "customer_id", "foreignField": "_id"}}]),
    ("коллекция другой базы", "other_db", "orders",
     [{"$lookup": {"from": {"db": "org", "coll": "employees"}, "localField": "customer_id", "foreignField": "_id", "as": "x"}}]),
])

ERRORS["6.1"] = [
    ('<code>"from": "customer"</code>',
     "Пустой массив у каждого документа без ошибки: коллекции с таким именем нет, совпадений нет",
     "Проверить имя коллекции: <code>\"customers\"</code>; пустой результат у всех документов — признак опечатки"),
    ("<code>localField</code> — поле, которого нет у документа",
     "Сервер сравнивает отсутствующее значение с <code>foreignField</code> и присоединяет все документы, где этого поля тоже нет",
     "Перед <code>$lookup</code> отобрать документы, у которых поле есть: <code>{\"$match\": {\"поле\": {\"$exists\": true}}}</code>"),
    ('<code>{"$unwind": "$vacancies"}</code> после <code>$lookup</code>',
     "Документы без совпадений исчезают из потока: пустой массив не даёт ни одного документа",
     '<code>{"path": "$vacancies", "preserveNullAndEmptyArrays": true}</code>'),
    ("<code>$lookup</code> без <code>as</code>",
     "Ошибка 9: имя поля для результата обязательно",
     '<code>"as": "customer"</code>'),
    ('<code>"from": {"db": "org", "coll": "employees"}</code>',
     "Ошибка 9: <code>$lookup</code> соединяет коллекции одной базы",
     "Соединять коллекции одной базы; данные другой базы сначала перенести стадией <code>$merge</code>"),
]

CHEATS["6.1"] = [
    ("Соединить по полю", expr_lines({"$lookup": {"from": "customers", "localField": "customer_id",
                                                  "foreignField": "_id", "as": "customer"}})),
    ("Один к одному — документ", expr_lines({"$unwind": "$customer"})),
    ("Сколько найдено", expr_lines({"count": {"$size": "$orders"}})),
    ("Не терять документы без пары", expr_lines({"$unwind": {"path": "$vacancies", "preserveNullAndEmptyArrays": True}})),
]


# ── 6.2 $lookup с конвейером ──────────────────────────────────────────────

ONLY_ID = {"$project": {"_id": 0, "number": 1, "total": 1}}

# let и $expr
example("6.2", "let", "let и pipeline: доставленные заказы покупателя", agg_docs([
    C3,
    {"$lookup": {"from": "orders", "let": {"cid": "$_id"}, "pipeline": [
        {"$match": {"$expr": {"$eq": ["$customer_id", "$$cid"]}, "status": "доставлен"}},
        ONLY_ID,
    ], "as": "delivered"}},
    {"$project": {"name": 1, "delivered": 1}},
], coll="customers"))

# короткая запись: поля связи и конвейер вместе
example("6.2", "short", "localField, foreignField и pipeline вместе", agg_docs([
    C3,
    {"$lookup": {"from": "orders", "localField": "_id", "foreignField": "customer_id", "pipeline": [
        {"$match": {"status": "доставлен"}},
    ], "as": "delivered"}},
    {"$project": {"name": 1, "count": {"$size": "$delivered"}}},
], coll="customers"))

# последние заказы
example("6.2", "last", "два последних заказа покупателя", agg_docs([
    C3,
    {"$lookup": {"from": "orders", "localField": "_id", "foreignField": "customer_id", "pipeline": [
        {"$sort": {"created": -1}},
        {"$limit": 2},
        {"$project": {"_id": 0, "number": 1, "created": 1}},
    ], "as": "last"}},
    {"$project": {"name": 1, "last": 1}},
], coll="customers"))

# группировка внутри конвейера $lookup
example("6.2", "spent", "три покупателя с наибольшей суммой покупок", agg_docs([
    {"$lookup": {"from": "orders", "localField": "_id", "foreignField": "customer_id", "pipeline": [
        {"$match": {"status": "доставлен"}},
        {"$group": {"_id": None, "orders": {"$sum": 1}, "spent": {"$sum": "$total"}}},
    ], "as": "stats"}},
    {"$unwind": "$stats"},
    {"$project": {"_id": 0, "name": 1, "orders": "$stats.orders", "spent": "$stats.spent"}},
    {"$sort": {"spent": -1}},
    {"$limit": 3},
], coll="customers"))

# конвейер без связи с документом
example("6.2", "uncorrelated", "конвейер без связи: средний чек магазина рядом с покупателем", agg_docs([
    C3,
    {"$lookup": {"from": "orders", "pipeline": [
        {"$match": {"status": "доставлен"}},
        {"$group": {"_id": None, "avg": {"$avg": "$total"}}},
        {"$project": {"_id": 0, "avg": {"$round": ["$avg", 0]}}},
    ], "as": "shop"}},
    {"$project": {"name": 1, "shop": 1}},
], coll="customers"))

# связь по двум полям
example("6.2", "two", "резюме и вакансии с той же должностью в том же городе", agg_docs([
    {"$lookup": {"from": "vacancies", "let": {"pos": "$position", "city": "$city"}, "pipeline": [
        {"$match": {"$expr": {"$and": [{"$eq": ["$title", "$$pos"]}, {"$eq": ["$city", "$$city"]}]}}},
        {"$project": {"_id": 0, "company": 1}},
    ], "as": "offers"}},
    {"$project": {"_id": 0, "fio": 1, "position": 1, "city": 1, "offers": "$offers.company"}},
], coll="resumes"))

# переменная без $expr
example("6.2", "trap", "переменная в $match без $expr", agg_docs([
    {"$match": {"_id": "c-001"}},
    {"$lookup": {"from": "orders", "let": {"cid": "$_id"}, "pipeline": [
        {"$match": {"customer_id": "$$cid"}},
    ], "as": "wrong"}},
    {"$lookup": {"from": "orders", "let": {"cid": "$_id"}, "pipeline": [
        {"$match": {"$expr": {"$eq": ["$customer_id", "$$cid"]}}},
    ], "as": "right"}},
    {"$project": {"_id": 0, "name": 1, "wrong": {"$size": "$wrong"}, "right": {"$size": "$right"}}},
], coll="customers"))

ERRORS["6.2"] = [
    ('<code>{"$match": {"customer_id": "$$cid"}}</code> в конвейере <code>$lookup</code>',
     "Пустой результат без ошибки: в обычном фильтре <code>\"$$cid\"</code> — строка из пяти символов, а не переменная",
     'Переменные — только в выражении: <code>{"$match": {"$expr": {"$eq": ["$customer_id", "$$cid"]}}}</code>'),
    ('<code>"$cid"</code> в выражении конвейера',
     "Путь к полю <code>cid</code> документа из <code>from</code>, а не переменная",
     'Переменная <code>let</code> — с двумя знаками: <code>"$$cid"</code>'),
    ('<code>"$name"</code> внутри конвейера, чтобы взять поле покупателя',
     "Внутри конвейера <code>$</code> указывает на поле документа из <code>from</code>; поля внешнего документа там не видны",
     'Передать поле через <code>let</code>: <code>"let": {"cid": "$_id"}</code>'),
    ("Конвейер без связи с документом и без <code>$match</code>",
     "Каждому документу присоединяется вся коллекция <code>from</code>; документ результата ограничен 16 МБ",
     "Сократить результат конвейера: <code>$match</code>, <code>$group</code>, <code>$limit</code>"),
]

CHEATS["6.2"] = [
    ("Поля связи и отбор", expr_lines({"$lookup": {"from": "orders", "localField": "_id", "foreignField": "customer_id",
                                                   "pipeline": [{"$match": {"status": "доставлен"}}], "as": "delivered"}})),
    ("Переменная из документа", expr_lines({"let": {"cid": "$_id"}})),
    ("Условие с переменной", expr_lines({"$match": {"$expr": {"$eq": ["$customer_id", "$$cid"]}}})),
    ("Последние N", expr_lines({"pipeline": [{"$sort": {"created": -1}}, {"$limit": 2}]})),
]


# ── 6.3 $graphLookup ──────────────────────────────────────────────────────

def team(extra: dict | None = None) -> dict:
    spec = {"from": "employees", "startWith": "$_id", "connectFromField": "_id",
            "connectToField": "manager_id", "as": "team"}
    spec.update(extra or {})
    return {"$graphLookup": spec}


BY_NAME = {"$sortArray": {"input": "$team.name", "sortBy": 1}}
PAVEL = {"$match": {"_id": "s-002"}}

# все подчинённые на всех уровнях
example("6.3", "team", "$graphLookup: все подчинённые руководителя", agg_docs([
    PAVEL,
    team(),
    {"$project": {"_id": 0, "name": 1, "count": {"$size": "$team"}, "team": BY_NAME}},
], coll="employees"))

# уровень вложенности
example("6.3", "depth", "depthField: на каком уровне подчинённый", agg_docs([
    PAVEL,
    team({"depthField": "level"}),
    {"$project": {"_id": 0, "name": 1, "team": {"$sortArray": {
        "input": {"$map": {"input": "$team", "in": {"level": "$$this.level", "name": "$$this.name"}}},
        "sortBy": {"level": 1, "name": 1}}}}},
], coll="employees"))

# только прямые подчинённые
several("6.3", "max", "maxDepth: сколько уровней обходить", [
    ("maxDepth 0", "direct", "employees", [PAVEL, team({"maxDepth": 0}), {"$project": {"_id": 0, "team": BY_NAME}}]),
    ("maxDepth 1", "two_levels", "employees", [PAVEL, team({"maxDepth": 1}), {"$project": {"_id": 0, "count": {"$size": "$team"}}}]),
])

# цепочка руководителей вверх
example("6.3", "chain", "цепочка руководителей до директора", agg_docs([
    {"$match": {"_id": "s-013"}},
    {"$graphLookup": {"from": "employees", "startWith": "$manager_id", "connectFromField": "manager_id",
                      "connectToField": "_id", "as": "chain", "depthField": "step"}},
    {"$project": {"_id": 0, "name": 1, "chain": {"$sortArray": {
        "input": {"$map": {"input": "$chain", "in": {"step": "$$this.step", "name": "$$this.name"}}},
        "sortBy": {"step": 1}}}}},
], coll="employees"))

# обход только по своему отделу
several("6.3", "restrict", "restrictSearchWithMatch: обход только по отделу разработки", [
    ("без ограничения", "all_depts", "employees",
     [{"$match": {"_id": "s-001"}}, team(), {"$project": {"_id": 0, "name": 1, "count": {"$size": "$team"}}}]),
    ("только разработка", "dev_only", "employees",
     [{"$match": {"_id": "s-001"}}, team({"restrictSearchWithMatch": {"department": "разработка"}}),
      {"$project": {"_id": 0, "name": 1, "count": {"$size": "$team"}}}]),
])

# размер команды и фонд оплаты у каждого руководителя
example("6.3", "sizes", "размер команды и фонд оплаты каждого руководителя", agg_docs([
    team(),
    {"$project": {"_id": 0, "name": 1, "people": {"$size": "$team"}, "payroll": {"$sum": "$team.salary"}}},
    {"$match": {"people": {"$gt": 0}}},
    {"$sort": {"people": -1, "name": 1}},
], coll="employees"))

# дерево категорий
several("6.3", "categories", "дерево категорий: путь к корню и ветка", [
    ("путь от «Аудио» к корню", "path", "categories",
     [{"$match": {"_id": "cat-audio"}},
      {"$graphLookup": {"from": "categories", "startWith": "$parent_id", "connectFromField": "parent_id",
                        "connectToField": "_id", "as": "path", "depthField": "step"}},
      {"$project": {"_id": 0, "title": 1, "path": {"$sortArray": {
          "input": {"$map": {"input": "$path", "in": {"step": "$$this.step", "title": "$$this.title"}}},
          "sortBy": {"step": 1}}}}}]),
    ("все категории внутри «Компьютеров»", "branch", "categories",
     [{"$match": {"_id": "cat-comp"}},
      {"$graphLookup": {"from": "categories", "startWith": "$_id", "connectFromField": "_id",
                        "connectToField": "parent_id", "as": "branch"}},
      {"$project": {"_id": 0, "title": 1, "branch": {"$sortArray": {"input": "$branch.title", "sortBy": 1}}}}]),
])

# поля связи перепутаны
example("6.3", "swapped", "connectFromField и connectToField перепутаны", agg_docs([
    PAVEL,
    {"$graphLookup": {"from": "employees", "startWith": "$_id", "connectFromField": "manager_id",
                      "connectToField": "_id", "as": "team"}},
    {"$project": {"_id": 0, "name": 1, "team": BY_NAME}},
], coll="employees"))

ERRORS["6.3"] = [
    ("<code>connectFromField</code> и <code>connectToField</code> перепутаны",
     "Обход идёт в другую сторону: вместо подчинённых — сам сотрудник и цепочка руководителей",
     "Вниз по дереву: <code>connectFromField: \"_id\"</code>, <code>connectToField: \"manager_id\"</code>; вверх — наоборот"),
    ("Ожидание порядка документов в <code>as</code>",
     "Порядок найденных документов не задан",
     "Упорядочить результат: <code>{\"$sortArray\": {\"input\": \"$team.name\", \"sortBy\": 1}}</code> или по <code>depthField</code>"),
    ('<code>"maxDepth": 1</code> для прямых подчинённых',
     "Уровни считаются с нуля: 1 — это прямые подчинённые и их подчинённые",
     '<code>"maxDepth": 0</code>'),
    ("<code>restrictSearchWithMatch</code> как фильтр результата",
     "Документ, не прошедший условие, не только пропускается, но и не ведёт дальше: его подчинённые не обходятся",
     "Чтобы убрать документы только из результата, отфильтровать массив <code>$filter</code> после <code>$graphLookup</code>"),
]

CHEATS["6.3"] = [
    ("Вниз по дереву", expr_lines({"$graphLookup": {"from": "employees", "startWith": "$_id", "connectFromField": "_id",
                                                    "connectToField": "manager_id", "as": "team"}})),
    ("Вверх по дереву", expr_lines({"startWith": "$manager_id", "connectFromField": "manager_id", "connectToField": "_id"})),
    ("Уровень и глубина", expr_lines({"depthField": "level", "maxDepth": 0})),
    ("Обход по условию", expr_lines({"restrictSearchWithMatch": {"department": "разработка"}})),
]


# ── 6.4 $unionWith ────────────────────────────────────────────────────────

CITY_KIND_V = {"$project": {"_id": 0, "city": 1, "kind": "вакансия"}}
CITY_KIND_R = {"$project": {"_id": 0, "city": 1, "kind": "резюме"}}

# две коллекции в одном потоке
example("6.4", "basic", "$unionWith: вакансии и резюме одним списком", agg_docs([
    {"$match": {"city": "Москва"}},
    {"$project": {"_id": 0, "title": 1, "city": 1}},
    {"$unionWith": {"coll": "resumes", "pipeline": [
        {"$match": {"city": "Москва"}},
        {"$project": {"_id": 0, "title": "$position", "city": 1}},
    ]}},
], coll="vacancies"))

# группировка общего потока
example("6.4", "cities", "вакансии и резюме по городам", agg_docs([
    CITY_KIND_V,
    {"$unionWith": {"coll": "resumes", "pipeline": [CITY_KIND_R]}},
    {"$group": {"_id": "$city",
                "vacancies": {"$sum": {"$cond": [{"$eq": ["$kind", "вакансия"]}, 1, 0]}},
                "resumes": {"$sum": {"$cond": [{"$eq": ["$kind", "резюме"]}, 1, 0]}}}},
    {"$sort": {"_id": 1}},
], coll="vacancies"))

# стадии до и после $unionWith
several("6.4", "order", "стадия до $unionWith и после", [
    ("$match до $unionWith", "before", "vacancies",
     [{"$match": {"city": "Москва"}}, {"$unionWith": "resumes"}, {"$count": "docs"}]),
    ("$match после $unionWith", "after", "vacancies",
     [{"$unionWith": "resumes"}, {"$match": {"city": "Москва"}}, {"$count": "docs"}]),
])

# одна коллекция дважды
example("6.4", "self", "два самых дорогих и два самых дешёвых заказа", agg_docs([
    {"$sort": {"total": -1, "number": 1}},
    {"$limit": 2},
    {"$project": {"_id": 0, "number": 1, "total": 1}},
    {"$unionWith": {"coll": "orders", "pipeline": [
        {"$sort": {"total": 1, "number": 1}},
        {"$limit": 2},
        {"$project": {"_id": 0, "number": 1, "total": 1}},
    ]}},
]))

# города покупателей и города доставки
example("6.4", "places", "города из двух коллекций магазина", agg_docs([
    {"$project": {"_id": 0, "city": 1, "from": "customers"}},
    {"$unionWith": {"coll": "orders", "pipeline": [{"$project": {"_id": 0, "city": "$delivery.city", "from": "orders"}}]}},
    {"$group": {"_id": "$city", "customers": {"$sum": {"$cond": [{"$eq": ["$from", "customers"]}, 1, 0]}},
                "deliveries": {"$sum": {"$cond": [{"$eq": ["$from", "orders"]}, 1, 0]}}}},
    {"$sort": {"_id": 1}},
], coll="customers"))

# коллекции другой базы $unionWith не видит
several("6.4", "missing", "коллекция, которой нет в базе", [
    ("покупатели", "only_customers", "customers", [{"$count": "docs"}]),
    ("покупатели и employees", "with_employees", "customers", [{"$unionWith": "employees"}, {"$count": "docs"}]),
])

ERRORS["6.4"] = [
    ('<code>{"$unionWith": "employees"}</code> в базе <code>shop</code>',
     "Ошибки нет, документов не прибавилось: коллекции <code>employees</code> в этой базе нет",
     "<code>$unionWith</code> добавляет коллекции той же базы; проверять имя коллекции и счёт документов"),
    ("Стадия до <code>$unionWith</code> и ожидание, что она действует на обе коллекции",
     "Стадии до <code>$unionWith</code> обрабатывают только основную коллекцию",
     "Условие для второй коллекции — в её <code>pipeline</code> или общей стадией после <code>$unionWith</code>"),
    ("Документы двух коллекций с разными именами полей",
     "У части документов поля нет, и группировка по нему даёт ключ <code>null</code>",
     'Привести поля к одним именам: <code>{"$project": {"title": "$position"}}</code> в <code>pipeline</code>'),
    ("Ожидание порядка без <code>$sort</code>",
     "Документы второй коллекции идут после документов первой; общий порядок не задан",
     "Сортировать после <code>$unionWith</code>"),
]

CHEATS["6.4"] = [
    ("Добавить коллекцию", expr_lines({"$unionWith": "resumes"})),
    ("С обработкой", expr_lines({"$unionWith": {"coll": "resumes", "pipeline": [{"$project": {"_id": 0, "title": "$position"}}]}})),
    ("Отметить источник", expr_lines({"$project": {"_id": 0, "city": 1, "kind": "вакансия"}})),
]


# ── 6.5 $merge и $out ─────────────────────────────────────────────────────

BY_CITY = [{"$match": {"status": "доставлен"}},
           {"$group": {"_id": "$delivery.city", "orders": {"$sum": 1}, "revenue": {"$sum": "$total"}}}]
INTO = {"db": "sandbox", "coll": "city_sales"}


def coll_var(lang: str, name: str) -> str:
    return {"python": f'{name} = sandbox["{name}"]', "ruby": f"{name} = sandbox[:{name}]",
            "go": f'{gvar(name, lang)} := sandbox.Collection("{name}")', "cpp": f'auto {name} = sandbox["{name}"];'}[lang]


def drop(lang: str, name: str) -> str:
    v = gvar(name, lang)
    return {"python": f"{v}.drop()", "ruby": f"{v}.drop", "go": f"{v}.Drop(ctx)", "cpp": f"{v}.drop();"}[lang]


def run_code(lang: str, var: str, first: bool) -> str:
    """Запуск конвейера, который ничего не возвращает, а пишет в коллекцию.
    Ruby и C++ выполняют агрегацию при чтении курсора, поэтому курсор читается."""
    v = gvar(var, lang)
    if lang == "python":
        return f"orders.aggregate({v})"
    if lang == "ruby":
        return f"orders.aggregate({v}).to_a"
    if lang == "go":
        return f"orders.Aggregate(ctx, {v})"
    return f"for (auto&& doc : orders.aggregate({v})) {{}}"


def list_code(lang: str, name: str, first: bool) -> str:
    """Все документы коллекции по возрастанию _id."""
    v = gvar(name, lang)
    if lang == "python":
        return f'for doc in {v}.find().sort("_id", 1):\n    print(doc)'
    if lang == "ruby":
        return f"{v}.find.sort(_id: 1).each {{ |doc| puts doc.inspect }}"
    if lang == "go":
        op = ":=" if first else "="
        return (f'cursor, _ {op} {v}.Find(ctx, bson.D{{}}, options.Find().SetSort(bson.D{{{{Key: "_id", Value: 1}}}}))\n'
                "for cursor.Next(ctx) {\n"
                "    var doc bson.D\n"
                "    cursor.Decode(&doc)\n"
                "    out, _ := bson.MarshalExtJSON(doc, false, false)\n"
                "    fmt.Println(string(out))\n"
                "}")
    opts = "opts" if first else "opts"
    head = "mongocxx::options::find opts;\nopts.sort(make_document(kvp(\"_id\", 1)));\n" if first else ""
    return (head + f"for (auto&& doc : {v}.find({{}}, {opts})) {{\n"
            "    std::cout << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;\n"
            "}")


def writes(chapter: str, name: str, caption: str, target: str, steps: list, error: bool = False) -> None:
    """Пример главы 6.5: очистить коллекцию-цель, выполнить конвейеры по порядку
    и показать содержимое цели. steps — список (заголовок, переменная, стадии);
    заголовок None — конвейер без печати."""
    def code(lang: str) -> str:
        parts = [IMPORT_ERR.get(lang, "") + coll_var(lang, target) if error else coll_var(lang, target), drop(lang, target)]
        parts.append("\n\n".join(pipeline(st, lang, gvar(var, lang)) for _, var, st, _ in steps))
        runs = []
        first_cursor = True
        first_err = True
        for title, var, _, mode in steps:
            line = title_code(lang, title) + "\n" if title else ""
            if mode == "try":
                runs.append(line + try_code(lang, "orders", gvar(var, lang), first=first_err))
                first_err = False
            else:
                runs.append(line + run_code(lang, var, True))
            if mode == "show":
                runs.append(list_code(lang, target, first_cursor))
                first_cursor = False
        return "\n".join(parts[:2]) + "\n\n" + parts[2] + "\n\n" + "\n\n".join(runs)
    example(chapter, name, caption, {lang: code(lang) for lang in LANGS4})


# первая запись: коллекции ещё нет
writes("6.5", "first", "$merge: витрина продаж по городам", "city_sales", [
    (None, "showcase", BY_CITY + [{"$merge": {"into": INTO}}], "show"),
])

# повторный запуск с whenMatched
writes("6.5", "matched", "повторный запуск: whenMatched merge и replace", "city_sales", [
    (None, "showcase", BY_CITY + [{"$merge": {"into": INTO}}], "run"),
    ("whenMatched merge: поле в пути добавлено", "add_transit",
     [{"$match": {"status": "в пути"}}, {"$group": {"_id": "$delivery.city", "in_transit": {"$sum": 1}}},
      {"$merge": {"into": INTO, "whenMatched": "merge", "whenNotMatched": "discard"}}], "show"),
    ("whenMatched replace: документы заменены", "replace_transit",
     [{"$match": {"status": "в пути"}}, {"$group": {"_id": "$delivery.city", "in_transit": {"$sum": 1}}},
      {"$merge": {"into": INTO, "whenMatched": "replace", "whenNotMatched": "discard"}}], "show"),
])

# накопление: конвейер в whenMatched
writes("6.5", "accumulate", "whenMatched с конвейером: прибавить новые заказы", "city_sales", [
    (None, "showcase", BY_CITY + [{"$merge": {"into": INTO}}], "run"),
    ("прибавлены заказы, которые собираются", "add_assembling",
     [{"$match": {"status": "собирается"}},
      {"$group": {"_id": "$delivery.city", "orders": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
      {"$merge": {"into": INTO, "whenMatched": [{"$set": {
          "orders": {"$add": ["$orders", "$$new.orders"]},
          "revenue": {"$add": ["$revenue", "$$new.revenue"]}}}]}}], "show"),
])

# поле on и уникальный индекс
CITY_STATS = {"db": "sandbox", "coll": "city_stats"}
BY_CITY_FIELD = [{"$match": {"status": "доставлен"}},
                 {"$group": {"_id": "$delivery.city", "orders": {"$sum": 1}}},
                 {"$project": {"_id": 0, "city": "$_id", "orders": 1}}]


def on_code(lang: str) -> str:
    v = "city_stats"
    index = {"python": f'{v}.create_index("city", unique=True)',
             "ruby": f"{v}.indexes.create_one({{ city: 1 }}, unique: true)",
             "go": f'{gvar(v, lang)}.Indexes().CreateOne(ctx, mongo.IndexModel{{\n'
                   '    Keys:    bson.D{{Key: "city", Value: 1}},\n'
                   '    Options: options.Index().SetUnique(true),\n})',
             "cpp": "mongocxx::options::index unique;\nunique.unique(true);\n"
                    f'{v}.create_index(make_document(kvp("city", 1)), unique);'}[lang]
    head = IMPORT_ERR.get(lang, "") + coll_var(lang, v) + "\n" + drop(lang, v)
    pipe = pipeline(BY_CITY_FIELD + [{"$merge": {"into": CITY_STATS, "on": "city"}}], lang, gvar("by_city_name", lang))
    return (head + "\n\n" + pipe + "\n\n" + title_code(lang, "on: city без индекса") + "\n"
            + try_code(lang, "orders", gvar("by_city_name", lang)) + "\n\n"
            + title_code(lang, "on: city с уникальным индексом") + "\n" + index + "\n"
            + run_code(lang, "by_city_name", True) + "\n" + list_by_city(lang, v))


def list_by_city(lang: str, name: str) -> str:
    """Документы без _id по возрастанию city: _id здесь создаёт сервер, он разный при каждом запуске."""
    v = gvar(name, lang)
    if lang == "python":
        return f'for doc in {v}.find({{}}, {{"_id": 0}}).sort("city", 1):\n    print(doc)'
    if lang == "ruby":
        return f"{v}.find.projection(_id: 0).sort(city: 1).each {{ |doc| puts doc.inspect }}"
    if lang == "go":
        return (f'opts := options.Find().SetProjection(bson.D{{{{Key: "_id", Value: 0}}}}).SetSort(bson.D{{{{Key: "city", Value: 1}}}})\n'
                f"cursor, _ := {v}.Find(ctx, bson.D{{}}, opts)\n"
                "for cursor.Next(ctx) {\n"
                "    var doc bson.D\n"
                "    cursor.Decode(&doc)\n"
                "    out, _ := bson.MarshalExtJSON(doc, false, false)\n"
                "    fmt.Println(string(out))\n"
                "}")
    return ("mongocxx::options::find opts;\n"
            'opts.projection(make_document(kvp("_id", 0)));\n'
            'opts.sort(make_document(kvp("city", 1)));\n'
            f"for (auto&& doc : {v}.find({{}}, opts)) {{\n"
            "    std::cout << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;\n"
            "}")


example("6.5", "on", "поле on: связь по city и уникальный индекс", {lang: on_code(lang) for lang in LANGS4})

# whenMatched fail
writes("6.5", "fail", "whenMatched fail: запись только новых документов", "city_sales", [
    (None, "showcase", BY_CITY + [{"$merge": {"into": INTO}}], "run"),
    ("повторный запуск с fail", "again_fail",
     BY_CITY + [{"$sort": {"_id": 1}}, {"$merge": {"into": INTO, "whenMatched": "fail"}}], "try"),
], error=True)

# $out заменяет коллекцию целиком
writes("6.5", "out", "$out: коллекция заменяется целиком", "city_sales", [
    (None, "showcase", BY_CITY + [{"$merge": {"into": INTO}}], "run"),
    ("после $out: отменённые заказы по городам", "cancelled",
     [{"$match": {"status": "отменён"}}, {"$group": {"_id": "$delivery.city", "cancelled": {"$sum": 1}}},
      {"$out": INTO}], "show"),
])

tries("6.5", "errors", "$merge не последней стадией", [
    ("$merge перед $limit", "not_last", "orders",
     [{"$merge": {"into": {"db": "sandbox", "coll": "tmp"}}}, {"$limit": 1}]),
])

ERRORS["6.5"] = [
    ('<code>{"$merge": "city_sales"}</code> в конвейере по <code>shop.orders</code>',
     "Коллекция создаётся в базе <code>shop</code>, рядом с заказами: имя без базы — коллекция той же базы",
     'Указывать базу явно: <code>{"into": {"db": "sandbox", "coll": "city_sales"}}</code>'),
    ('<code>"on": "city"</code> без индекса',
     "Ошибка 51183: сервер не может проверить, что значение <code>city</code> одно на документ",
     "Создать уникальный индекс по полю <code>on</code> до запуска"),
    ("<code>$merge</code> не последней стадией",
     "Ошибка 40601: после записи стадий быть не может",
     "Ставить <code>$merge</code> и <code>$out</code> в конец конвейера"),
    ("<code>$out</code> для обновления витрины",
     "Коллекция заменяется целиком: документы и поля, которых нет в новом результате, пропадают",
     "<code>$merge</code> с подходящим <code>whenMatched</code>, если нужно обновить часть документов"),
    ('<code>"whenMatched": "fail"</code> при повторном запуске',
     "Ошибка 11000 на первом совпавшем документе; документы, записанные до неё, остаются",
     "<code>fail</code> — для данных, которые точно новые; для повторных запусков — <code>merge</code> или <code>replace</code>"),
]

CHEATS["6.5"] = [
    ("Записать результат", expr_lines({"$merge": {"into": {"db": "sandbox", "coll": "city_sales"}}})),
    ("Что делать с совпавшими", expr_lines({"whenMatched": "merge", "whenNotMatched": "discard"})),
    ("Прибавить к старому", expr_lines({"whenMatched": [{"$set": {"orders": {"$add": ["$orders", "$$new.orders"]}}}]})),
    ("Заменить коллекцию", expr_lines({"$out": {"db": "sandbox", "coll": "city_sales"}})),
]
