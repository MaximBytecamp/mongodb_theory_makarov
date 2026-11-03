"""Примеры, таблицы ошибок и шпаргалки глав модуля 5 — исходник для snippets.py.

Операторы модуля 5 — выражения: они вычисляют значение поля внутри одного
документа, поток документов не меняется. Поэтому почти каждый пример — конвейер
из $match и $project, а документы печатаются целиком, как в главах 4.2 и 4.9.

Литералы на четырёх языках собирают функции chapters4.py; здесь — только
описания примеров. Числа в комментариях — то, что даёт стенд; вывод в книгу
подставляет examples.py apply.
"""

from chapters4 import (IMPORT_ERR, LANGS4, docs_code, flat, gvar, pipeline,
                       title_code, try_code)

EXAMPLES: dict = {}
ERRORS: dict = {}
CHEATS: dict = {}


def example(chapter: str, name: str, caption: str, plain: dict) -> None:
    EXAMPLES.setdefault(chapter, {})[name] = {"caption": caption, "plain": plain}


def agg_docs(stages: list, coll: str = "orders") -> dict:
    return {lang: pipeline(stages, lang) + "\n\n" + docs_code(lang, coll) for lang in LANGS4}


def tries(chapter: str, name: str, caption: str, variants: list, coll: str = "orders") -> None:
    """Несколько конвейеров, которые сервер отклоняет: у каждого заголовок,
    код ошибки и её текст. variants — список (заголовок, имя переменной, стадии)."""
    def code(lang: str) -> str:
        decl = "\n\n".join(pipeline(st, lang, gvar(var, lang)) for _, var, st in variants)
        runs = "\n\n".join(title_code(lang, title) + "\n" + try_code(lang, coll, gvar(var, lang), first=(i == 0))
                           for i, (title, var, _) in enumerate(variants))
        return IMPORT_ERR.get(lang, "") + decl + "\n\n" + runs
    example(chapter, name, caption, {lang: code(lang) for lang in LANGS4})


def expr_lines(value) -> dict:
    """Карточка шпаргалки: выражение одним литералом на языке каждого драйвера."""
    return {lang: [flat(value, lang)] for lang in LANGS4}


ONE_ORDER = {"$match": {"_id": "o-0002"}}
FIVE_ORDERS = {"$match": {"_id": {"$in": ["o-0001", "o-0002", "o-0003", "o-0004", "o-0005"]}}}


# ── 5.1 $arrayElemAt, $slice, $size ───────────────────────────────────────

# первый и последний элемент
example("5.1", "elem", "$arrayElemAt: первая и последняя позиция", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "number": 1, "titles": "$items.title",
                  "first": {"$arrayElemAt": ["$items.title", 0]},
                  "last": {"$arrayElemAt": ["$items.title", -1]}}},
]))

# элемент — документ; номер в пути выражения не работает
example("5.1", "whole", "элемент-документ и путь с номером", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "first_item": {"$arrayElemAt": ["$items", 0]},
                  "by_path": "$items.0.title"}},
]))

# номер за границей массива
example("5.1", "range", "четвёртая позиция у заказов разной длины", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "fourth": {"$arrayElemAt": ["$items.title", 3]},
                  "fourth_or": {"$ifNull": [{"$arrayElemAt": ["$items.title", 3]}, "нет"]}}},
]))

# длина массива
example("5.1", "size", "$size: число позиций", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "lines": {"$size": "$items"},
                  "last_by_size": {"$arrayElemAt": ["$items.title", {"$subtract": [{"$size": "$items"}, 1]}]}}},
]))

# заказы по числу позиций
example("5.1", "sizes", "заказы по числу позиций", agg_docs([
    {"$group": {"_id": {"$size": "$items"}, "orders": {"$sum": 1}}},
    {"$sort": {"_id": 1}},
]))

# с какой категории начинается заказ
example("5.1", "first_cat", "категория первой позиции", agg_docs([
    {"$group": {"_id": {"$arrayElemAt": ["$items.category", 0]}, "orders": {"$sum": 1}}},
    {"$sort": {"orders": -1, "_id": 1}},
]))

# $first и $last над массивом
example("5.1", "first_last", "$first и $last как выражения", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "first": {"$first": "$items.title"}, "last": {"$last": "$items.title"}}},
]))

# часть массива
example("5.1", "slice", "$slice: часть массива", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "first_two": {"$slice": ["$items.title", 2]},
                  "last_one": {"$slice": ["$items.title", -1]},
                  "from_1": {"$slice": ["$items.title", 1, 2]},
                  "last_elem": {"$arrayElemAt": ["$items.title", -1]}}},
]))

# $slice за границей массива
example("5.1", "slice_range", "$slice за границей массива", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "from_5": {"$slice": ["$items.title", 5, 2]},
                  "last_5": {"$slice": ["$items.title", -5]}}},
]))

# товары: первая характеристика и первые склады
example("5.1", "laptops", "диагональ и склады ноутбуков", agg_docs([
    {"$match": {"category": "ноутбуки"}},
    {"$project": {"_id": 0, "title": 1, "screen": {"$arrayElemAt": ["$specs", 0]},
                  "warehouses": {"$size": "$stock"},
                  "first_two": {"$slice": ["$stock.warehouse", 2]}}},
], coll="products"))

# что сервер не принимает
tries("5.1", "errors", "аргументы, которые сервер не принимает", [
    ("номер 1.5", "half_index", [ONE_ORDER, {"$project": {"x": {"$arrayElemAt": ["$items", 1.5]}}}]),
    ("строка вместо массива", "not_array", [ONE_ORDER, {"$project": {"x": {"$arrayElemAt": ["$promo", 0]}}}]),
    ("$slice с числом 0", "slice_zero", [ONE_ORDER, {"$project": {"x": {"$slice": ["$items", 1, 0]}}}]),
    ("$size от строки", "size_string", [ONE_ORDER, {"$project": {"x": {"$size": "$promo"}}}]),
])

ERRORS["5.1"] = [
    ('<code>{"$arrayElemAt": ["$items.title", 1]}</code> для первой позиции',
     "Возвращается вторая позиция: номера элементов идут с нуля",
     "Первая позиция — номер <code>0</code>, последняя — <code>-1</code>"),
    ('<code>"$items.0.title"</code> в выражении',
     "Пустой массив: в выражении цифра в пути не означает номер элемента, как в фильтре",
     '<code>{"$arrayElemAt": ["$items.title", 0]}</code>'),
    ("Проверка <code>null</code> у элемента за границей массива",
     "За границей массива поля в результате нет; <code>null</code> получается, только когда у документа нет самого массива",
     '<code>{"$ifNull": [{"$arrayElemAt": ["$items.title", 3]}, "нет"]}</code> — подстановка в обоих случаях'),
    ('<code>{"$slice": ["$items.title", -1]}</code> вместо последнего элемента',
     "Возвращается массив из одного элемента, а не сам элемент",
     '<code>{"$arrayElemAt": ["$items.title", -1]}</code> или <code>{"$last": "$items.title"}</code>'),
    ('<code>{"$size": "$promo"}</code>',
     "Ошибка 17124: <code>$size</code> принимает только массив; у строки и у отсутствующего поля — ошибка",
     "Применять к полю-массиву; если поля может не быть — <code>{\"$size\": {\"$ifNull\": [\"$tags\", []]}}</code>"),
]

CHEATS["5.1"] = [
    ("Первый и последний элемент", {lang: expr_lines({"$arrayElemAt": ["$items.title", 0]})[lang] + expr_lines({"$arrayElemAt": ["$items.title", -1]})[lang]
        for lang in LANGS4}),
    ("Короткая запись", {lang: expr_lines({"$first": "$items.title"})[lang] + expr_lines({"$last": "$items.title"})[lang]
                         for lang in LANGS4}),
    ("Элемент или подстановка", expr_lines({"$ifNull": [{"$arrayElemAt": ["$items.title", 3]}, "нет"]})),
    ("Длина массива", expr_lines({"$size": "$items"})),
    ("Часть массива", {lang: expr_lines({"$slice": ["$items.title", 2]})[lang] + expr_lines({"$slice": ["$items.title", 1, 2]})[lang]
                       for lang in LANGS4}),
]


# ── 5.2 $filter ───────────────────────────────────────────────────────────

def several(chapter: str, name: str, caption: str, variants: list, coll: str = "orders") -> None:
    """Несколько конвейеров подряд: у каждого заголовок и документы целиком.
    variants — список (заголовок, имя переменной, стадии)."""
    def code(lang: str) -> str:
        decl = "\n\n".join(pipeline(st, lang, gvar(var, lang)) for _, var, st in variants)
        runs = "\n\n".join(title_code(lang, title) + "\n" + docs_code(lang, coll, gvar(var, lang), first=(i == 0))
                           for i, (title, var, _) in enumerate(variants))
        return decl + "\n\n" + runs
    example(chapter, name, caption, {lang: code(lang) for lang in LANGS4})


O4 = {"$match": {"_id": "o-0004"}}
PERIPHERY = {"$filter": {"input": "$items", "as": "item", "cond": {"$eq": ["$$item.category", "периферия"]}}}
PERIPHERY_THIS = {"$filter": {"input": "$items", "cond": {"$eq": ["$$this.category", "периферия"]}}}

# позиции одной категории
example("5.2", "as", "$filter: позиции периферии", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "number": 1, "periphery": PERIPHERY}},
]))

# имя элемента по умолчанию и длина отобранного
example("5.2", "this", "$$this и $size отобранного", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "lines": {"$size": "$items"},
                  "periphery": PERIPHERY_THIS, "periphery_lines": {"$size": PERIPHERY_THIS}}},
]))

# несколько условий
example("5.2", "and", "$filter с двумя условиями", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "cheap_many": {"$filter": {
        "input": "$items",
        "cond": {"$and": [{"$gte": ["$$this.qty", 2]}, {"$lt": ["$$this.price", 10000]}]},
    }}}},
]))

# не больше одного элемента
example("5.2", "limit", "$filter с limit", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "first_periphery": {"$filter": {
        "input": "$items", "cond": {"$eq": ["$$this.category", "периферия"]}, "limit": 1}}}},
]))

# заказы по числу позиций периферии
example("5.2", "dist", "заказы по числу позиций периферии", agg_docs([
    {"$group": {"_id": {"$size": PERIPHERY_THIS}, "orders": {"$sum": 1}}},
    {"$sort": {"_id": 1}},
]))

# $filter в $match и фильтры главы 2.6
several("5.2", "match", "$filter в $match и фильтр по массиву", [
    ("$expr и $filter: есть периферия", "by_filter",
     [{"$match": {"$expr": {"$gt": [{"$size": PERIPHERY_THIS}, 0]}}}, {"$count": "orders"}]),
    ("фильтр по items.category", "by_path", [{"$match": {"items.category": "периферия"}}, {"$count": "orders"}]),
    ("$expr и $filter: периферия от 2 штук", "by_filter_qty",
     [{"$match": {"$expr": {"$gt": [{"$size": {"$filter": {"input": "$items", "cond": {"$and": [
         {"$eq": ["$$this.category", "периферия"]}, {"$gte": ["$$this.qty", 2]}]}}}}, 0]}}},
      {"$count": "orders"}]),
    ("$elemMatch: периферия от 2 штук", "by_elem",
     [{"$match": {"items": {"$elemMatch": {"category": "периферия", "qty": {"$gte": 2}}}}}, {"$count": "orders"}]),
])

# склады с остатком
IN_STOCK = {"$filter": {"input": "$stock", "cond": {"$gt": ["$$this.qty", 0]}}}
example("5.2", "stock", "склады с ненулевым остатком", agg_docs([
    {"$project": {"_id": 0, "title": 1, "stock": 1, "in_stock": IN_STOCK}},
    {"$match": {"$expr": {"$lt": [{"$size": "$in_stock"}, {"$size": "$stock"}]}}},
], coll="products"))

# одна лишняя или пропущенная буква $
example("5.2", "trap", "$this вместо $$this", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "wrong": {"$filter": {"input": "$items", "cond": {"$eq": ["$this.category", "периферия"]}}},
                  "right": {"$size": PERIPHERY_THIS}}},
]))

# поля нет и поле не массив
example("5.2", "missing", "$filter по полю, которого нет", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "gifts": {"$filter": {"input": "$gifts", "cond": True}},
                  "gifts_or": {"$filter": {"input": {"$ifNull": ["$gifts", []]}, "cond": True}}}},
]))

tries("5.2", "errors", "параметры $filter, которые сервер не принимает", [
    ("input — строка", "string_input", [ONE_ORDER, {"$project": {"x": {"$filter": {"input": "$promo", "cond": True}}}}]),
    ("нет cond", "no_cond", [ONE_ORDER, {"$project": {"x": {"$filter": {"input": "$items"}}}}]),
    ("as задан, в условии $$this", "as_and_this", [ONE_ORDER, {"$project": {"x": {"$filter": {
        "input": "$items", "as": "item", "cond": {"$eq": ["$$this.category", "периферия"]}}}}}]),
])

ERRORS["5.2"] = [
    ('<code>"cond": {"$eq": ["$this.category", "периферия"]}</code>',
     "Пустой массив без ошибки: <code>$this</code> с одним знаком — путь к полю <code>this</code> документа, а такого поля нет",
     'Переменная элемента — с двумя знаками: <code>"$$this.category"</code>'),
    ('<code>"as": "item"</code>, в условии <code>"$$this"</code>',
     "Ошибка 17276: после <code>as</code> переменной <code>this</code> нет, элемент называется <code>item</code>",
     'В условии — то имя, что в <code>as</code>: <code>"$$item.category"</code>'),
    ('<code>{"$filter": {"input": "$promo", …}}</code>',
     "Ошибка 28651: <code>input</code> должен быть массивом, а <code>promo</code> — строка",
     "Применять к полю-массиву; поле, которого может не быть, заменять пустым массивом через <code>$ifNull</code>"),
    ("Ожидание пустого массива у документа без поля",
     "Без поля <code>$filter</code> возвращает <code>null</code>, и <code>$size</code> от результата даёт ошибку 17124",
     '<code>"input": {"$ifNull": ["$gifts", []]}</code>'),
    ('<code>"limit": 0</code>',
     "Ошибка: <code>limit</code> должен быть больше нуля",
     "Не указывать <code>limit</code>, если ограничение не нужно"),
]

CHEATS["5.2"] = [
    ("Отобрать элементы", expr_lines({"$filter": {"input": "$items", "cond": {"$eq": ["$$this.category", "периферия"]}}})),
    ("Своё имя элемента", expr_lines({"$filter": {"input": "$items", "as": "item", "cond": {"$gte": ["$$item.qty", 2]}}})),
    ("Не больше одного", expr_lines({"limit": 1})),
    ("Сколько отобрано", expr_lines({"$size": {"$filter": {"input": "$stock", "cond": {"$gt": ["$$this.qty", 0]}}}})),
    ("Если поля может не быть", expr_lines({"input": {"$ifNull": ["$gifts", []]}})),
]


# ── 5.3 $map ──────────────────────────────────────────────────────────────

LINE_SUMS = {"$map": {"input": "$items", "in": {"$multiply": ["$$this.qty", "$$this.price"]}}}

# сумма каждой позиции
example("5.3", "sums", "$map: сумма каждой позиции", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "number": 1, "total": 1, "sums": LINE_SUMS, "sum_of": {"$sum": LINE_SUMS}}},
]))

# проверка total у всех заказов
example("5.3", "check", "сходится ли total с позициями", agg_docs([
    {"$project": {"matches": {"$eq": ["$total", {"$sum": LINE_SUMS}]}}},
    {"$group": {"_id": "$matches", "orders": {"$sum": 1}}},
]))

# новый документ на каждый элемент
example("5.3", "docs", "$map с as: позиции из двух полей", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "number": 1, "lines": {"$map": {
        "input": "$items", "as": "line",
        "in": {"title": "$$line.title", "sum": {"$multiply": ["$$line.qty", "$$line.price"]}},
    }}}},
]))

# числа массива: наибольшее, наименьшее, среднее
example("5.3", "stats", "$max, $min и $avg над массивом", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "max_line": {"$max": LINE_SUMS}, "min_line": {"$min": LINE_SUMS},
                  "avg_price": {"$avg": "$items.price"}}},
]))

# элементы-строки
example("5.3", "strings", "склады строками", agg_docs([
    {"$match": {"category": "комплектующие"}},
    {"$project": {"_id": 0, "title": 1, "where": {"$map": {
        "input": "$stock", "in": {"$concat": ["$$this.warehouse", ": ", {"$toString": "$$this.qty"}]}}}}},
], coll="products"))

# сначала отобрать, потом преобразовать
example("5.3", "filter_map", "$map над результатом $filter", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "periphery": {"$map": {
        "input": PERIPHERY_THIS,
        "in": {"$concat": ["$$this.title", " × ", {"$toString": "$$this.qty"}]}}}}},
]))

tries("5.3", "errors", "записи $map, которые сервер не принимает", [
    ("нет in", "no_in", [ONE_ORDER, {"$project": {"x": {"$map": {"input": "$items"}}}}]),
    ("input — строка", "string_input", [ONE_ORDER, {"$project": {"x": {"$map": {"input": "$promo", "in": "$$this"}}}}]),
])

ERRORS["5.3"] = [
    ('<code>{"$map": {"input": "$items"}}</code>',
     "Ошибка 16882: без <code>in</code> неизвестно, во что превращать элемент",
     '<code>"in": {"$multiply": ["$$this.qty", "$$this.price"]}</code>'),
    ('<code>{"$map": {"input": "$promo", …}}</code>',
     "Ошибка 16883: <code>input</code> — строка, а не массив",
     "Применять к полю-массиву; поле, которого может не быть, заменять пустым массивом через <code>$ifNull</code>"),
    ("<code>$map</code>, чтобы оставить часть элементов",
     "Длина результата всегда равна длине входного массива: <code>$map</code> преобразует каждый элемент, но не отбрасывает",
     "Сначала <code>$filter</code>, затем <code>$map</code> над его результатом"),
    ('<code>{"$sum": "$items.qty"}</code> в <code>$project</code> и в <code>$group</code>',
     "В <code>$project</code> складываются элементы массива одного документа, в <code>$group</code> — значения из разных документов",
     "Сумма по документу — в <code>$project</code>; сумма по группе документов — в <code>$group</code>"),
]

CHEATS["5.3"] = [
    ("Преобразовать каждый элемент", expr_lines({"$map": {"input": "$items", "in": {"$multiply": ["$$this.qty", "$$this.price"]}}})),
    ("Своё имя элемента", expr_lines({"$map": {"input": "$items", "as": "line", "in": "$$line.title"}})),
    ("Сумма, наибольшее, среднее", {lang: expr_lines({"$sum": "$items.qty"})[lang] + expr_lines({"$max": "$items.price"})[lang]
                                    + expr_lines({"$avg": "$items.price"})[lang] for lang in LANGS4}),
    ("Отобрать, затем преобразовать", expr_lines({"$map": {"input": {"$filter": {"input": "$items", "cond": "…"}}, "in": "$$this.title"}})),
]


# ── 5.4 $reduce ───────────────────────────────────────────────────────────

UNITS = {"$reduce": {"input": "$items", "initialValue": 0, "in": {"$add": ["$$value", "$$this.qty"]}}}
UNIQUE_CATS = {"$reduce": {"input": "$items.category", "initialValue": [], "in": {"$cond": [
    {"$in": ["$$this", "$$value"]}, "$$value", {"$concatArrays": ["$$value", ["$$this"]]}]}}}

# число штук в заказе
example("5.4", "units", "$reduce: штуки в заказе", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "number": 1, "units": UNITS, "units_sum": {"$sum": "$items.qty"}}},
]))

# строка из названий
example("5.4", "join", "$reduce: названия через запятую", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "titles": {"$reduce": {
        "input": "$items.title", "initialValue": "",
        "in": {"$cond": [{"$eq": ["$$value", ""]}, "$$this", {"$concat": ["$$value", ", ", "$$this"]}]},
    }}}},
]))

# категории без повторов
example("5.4", "unique", "$reduce и $concatArrays: категории без повторов", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "categories": "$items.category", "unique": UNIQUE_CATS}},
]))

# самая дорогая позиция целиком
example("5.4", "top", "$reduce: самая дорогая позиция", agg_docs([
    O4,
    {"$project": {"_id": 0, "number": 1, "top": {"$reduce": {
        "input": "$items", "initialValue": {"price": 0},
        "in": {"$cond": [{"$gt": ["$$this.price", "$$value.price"]}, "$$this", "$$value"]},
    }}}},
]))

# заказы по числу разных категорий
example("5.4", "kinds", "заказы по числу разных категорий", agg_docs([
    {"$group": {"_id": {"$size": UNIQUE_CATS}, "orders": {"$sum": 1}}},
    {"$sort": {"_id": 1}},
]))

# один знак $ у $$value
example("5.4", "trap", "$value вместо $$value", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "wrong": {"$reduce": {"input": "$items", "initialValue": 0,
                                                  "in": {"$add": ["$value", "$$this.qty"]}}},
                  "right": UNITS}},
]))

tries("5.4", "errors", "записи $reduce, которые сервер не принимает", [
    ("нет initialValue", "no_initial", [ONE_ORDER, {"$project": {"x": {"$reduce": {
        "input": "$items", "in": {"$add": ["$$value", "$$this.qty"]}}}}}]),
    ("initialValue — строка, in складывает числа", "string_initial", [ONE_ORDER, {"$project": {"x": {"$reduce": {
        "input": "$items", "initialValue": "", "in": {"$add": ["$$value", "$$this.qty"]}}}}}]),
    ("input — строка", "string_input", [ONE_ORDER, {"$project": {"x": {"$reduce": {
        "input": "$promo", "initialValue": 0, "in": "$$value"}}}}]),
])

ERRORS["5.4"] = [
    ('<code>"in": {"$add": ["$value", "$$this.qty"]}</code>',
     "Результат <code>null</code> без ошибки: <code>$value</code> с одним знаком — поле документа, которого нет",
     'Накопленное значение — с двумя знаками: <code>"$$value"</code>'),
    ('<code>$reduce</code> без <code>initialValue</code>',
     "Ошибка 40078: начальное значение обязательно",
     '<code>"initialValue": 0</code> для суммы, <code>""</code> для строки, <code>[]</code> для массива'),
    ('<code>"initialValue": ""</code>, в <code>in</code> — <code>$add</code>',
     "Ошибка 14: на первом шаге <code>$add</code> получает строку",
     "Начальное значение того же типа, что и результат <code>in</code>"),
    ('<code>$reduce</code> для простой суммы',
     "Работает, но длиннее и хуже читается, чем готовое выражение",
     '<code>{"$sum": "$items.qty"}</code>; <code>$reduce</code> — когда готового выражения нет'),
    ('<code>{"$reduce": {"input": "$promo", …}}</code>',
     "Ошибка 40080: <code>input</code> — строка, а не массив",
     "Применять к полю-массиву; без поля <code>$reduce</code> возвращает <code>null</code>"),
]

CHEATS["5.4"] = [
    ("Свернуть массив в число", expr_lines(UNITS)),
    ("Склеить строки", expr_lines({"$reduce": {"input": "$items.title", "initialValue": "", "in": {"$concat": ["$$value", "$$this", "; "]}}})),
    ("Собрать массив", expr_lines({"$concatArrays": ["$$value", ["$$this"]]})),
    ("Есть ли значение в массиве", expr_lines({"$in": ["$$this", "$$value"]})),
]


# ── 5.5 $let ──────────────────────────────────────────────────────────────

PCT = {"$switch": {"branches": [
    {"case": {"$eq": ["$promo", "SPRING10"]}, "then": 10},
    {"case": {"$eq": ["$promo", "LOYAL15"]}, "then": 15},
    {"case": {"$eq": ["$promo", "FIRST5"]}, "then": 5},
], "default": 0}}
DISCOUNT = {"$divide": [{"$multiply": ["$total", "$$pct"]}, 100]}

# переменные одного выражения
example("5.5", "avg", "$let: средняя сумма позиции", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "avg_line": {"$let": {
        "vars": {"sum": {"$sum": LINE_SUMS}, "lines": {"$size": "$items"}},
        "in": {"$divide": ["$$sum", "$$lines"]},
    }}}},
]))

# процент скидки по промокоду
example("5.5", "pct", "$switch: процент скидки по промокоду", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "promo": 1, "pct": PCT}},
]))

# процент нужен дважды
example("5.5", "pay", "$let: скидка и сумма к оплате", agg_docs([
    FIVE_ORDERS,
    {"$project": {"_id": 0, "number": 1, "total": 1, "check": {"$let": {
        "vars": {"pct": PCT},
        "in": {"discount": DISCOUNT, "pay": {"$subtract": ["$total", DISCOUNT]}},
    }}}},
]))

# скидки по промокодам
example("5.5", "promo", "скидки по каждому промокоду", agg_docs([
    {"$match": {"promo": {"$exists": True}}},
    {"$group": {"_id": "$promo", "orders": {"$sum": 1}, "total": {"$sum": "$total"},
                "discount": {"$sum": {"$let": {"vars": {"pct": PCT}, "in": DISCOUNT}}}}},
    {"$sort": {"_id": 1}},
]))

# переменная $let видна внутри $map
example("5.5", "lines", "$let снаружи, $map внутри: скидка по позициям", agg_docs([
    {"$match": {"_id": "o-0003"}},
    {"$project": {"_id": 0, "number": 1, "promo": 1, "lines": {"$let": {
        "vars": {"pct": PCT},
        "in": {"$map": {"input": "$items", "in": {
            "title": "$$this.title",
            "pay": {"$divide": [{"$multiply": ["$$this.qty", "$$this.price", {"$subtract": [100, "$$pct"]}]}, 100]},
        }}},
    }}}},
]))

# переменные одного $let не видят друг друга
NESTED = {"$let": {
    "vars": {"pct": PCT},
    "in": {"$let": {
        "vars": {"discount": DISCOUNT},
        "in": {"discount": "$$discount", "pay": {"$subtract": ["$total", "$$discount"]}},
    }},
}}
example("5.5", "nested", "вложенный $let: переменная из переменной", agg_docs([
    {"$match": {"_id": "o-0004"}},
    {"$project": {"_id": 0, "number": 1, "total": 1, "check": NESTED}},
]))

# имя переменной и имя поля
example("5.5", "names", "переменная total и поле total", agg_docs([
    ONE_ORDER,
    {"$project": {"_id": 0, "both": {"$let": {"vars": {"total": 1}, "in": ["$total", "$$total"]}}}},
]))

tries("5.5", "errors", "переменные, которые сервер не принимает", [
    ("переменная из того же vars", "same_vars", [ONE_ORDER, {"$project": {"x": {"$let": {
        "vars": {"pct": 10, "discount": {"$divide": [{"$multiply": ["$total", "$$pct"]}, 100]}},
        "in": "$$discount"}}}}]),
    ("переменная вне in", "outside", [ONE_ORDER, {"$project": {"x": {"$let": {"vars": {"pct": 10}, "in": "$$pct"}},
                                                                "y": "$$pct"}}]),
    ("имя с заглавной буквы", "capital", [ONE_ORDER, {"$project": {"x": {"$let": {"vars": {"Pct": 10}, "in": "$$Pct"}}}}]),
])

ERRORS["5.5"] = [
    ('<code>"vars": {"pct": …, "discount": {… "$$pct" …}}</code>',
     "Ошибка 17276: переменные одного <code>vars</code> не видят друг друга",
     "Вложить второй <code>$let</code> в <code>in</code> первого: внутренний видит переменные внешнего"),
    ("<code>$$pct</code> в соседнем поле <code>$project</code>",
     "Ошибка 17276: переменная существует только внутри <code>in</code> своего <code>$let</code>",
     "Перенести вычисление в <code>in</code> или сохранить значение в поле стадией <code>$set</code>"),
    ('<code>"vars": {"Pct": 10}</code>',
     "Ошибка 9: имя переменной должно начинаться со строчной буквы",
     '<code>"vars": {"pct": 10}</code>'),
    ('<code>"$pct"</code> в <code>in</code>',
     "Путь к полю <code>pct</code> документа, а не переменная; поля нет — значение отсутствует",
     'Переменная — с двумя знаками: <code>"$$pct"</code>'),
]

CHEATS["5.5"] = [
    ("Переменные выражения", expr_lines({"$let": {"vars": {"sum": {"$sum": "$items.price"}, "lines": {"$size": "$items"}},
                                                   "in": {"$divide": ["$$sum", "$$lines"]}}})),
    ("Выбор по значению", expr_lines({"$switch": {"branches": [{"case": {"$eq": ["$promo", "SPRING10"]}, "then": 10}],
                                                  "default": 0}})),
    ("Переменная из переменной", expr_lines({"$let": {"vars": {"a": 1}, "in": {"$let": {"vars": {"b": {"$add": ["$$a", 1]}}, "in": "$$b"}}}})),
]
