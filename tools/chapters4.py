"""Примеры, таблицы ошибок и шпаргалки глав модуля 4 — исходник для snippets.py.

Конвейер агрегации — список документов, как фильтр модуля 2. Стадии здесь
описываются один раз литералом Python, а функция agg собирает из них код на
четырёх языках: список словарей Python, массив хешей Ruby, mongo.Pipeline в Go
и mongocxx::pipeline в C++. Готовый текст кладётся под ключ "plain", подсветку
собирает codeedit.highlight — как в модуле 3.

Документы печатает функция show из заготовки модуля (examples.EXTRAS и
TOP_EXTRAS): поля в строку через « | », в конце «документов: N».

Отступ — четыре пробела во всех языках, как в остальных главах книги.
Числа в комментариях — то, что даёт стенд; вывод в книгу подставляет
examples.py apply.
"""

EXAMPLES: dict = {}
ERRORS: dict = {}
CHEATS: dict = {}

# Длиннее — документ переносится по паре на строку. Go и C++ записывают документ
# многословнее, поэтому им отведено больше места.
WIDTH = {"python": 88, "ruby": 88, "go": 100, "cpp": 100}
STEPS = {"python": "    ", "ruby": "  ", "go": "    ", "cpp": "    "}

# Стадии, у которых в mongocxx::pipeline есть свой метод.
CPP_METHOD = {
    "$match": "match", "$sort": "sort", "$limit": "limit", "$skip": "skip",
    "$project": "project", "$group": "group", "$unwind": "unwind", "$count": "count",
    "$addFields": "add_fields", "$sortByCount": "sort_by_count", "$bucket": "bucket",
    "$bucketAuto": "bucket_auto", "$facet": "facet", "$replaceRoot": "replace_root",
    "$redact": "redact", "$lookup": "lookup", "$sample": "sample",
}


# ── литералы без подсветки ────────────────────────────────────────────────

def q(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def scalar(value, lang: str) -> str:
    if isinstance(value, bool):
        return ("True" if value else "False") if lang == "python" else ("true" if value else "false")
    if value is None:
        return {"python": "None", "ruby": "nil", "go": "nil", "cpp": "bsoncxx::types::b_null{}"}[lang]
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return q(value)
    raise TypeError(type(value))


def pair_head(key: str, lang: str) -> tuple[str, str]:
    """Начало и конец записи пары «ключ — значение» на языке драйвера."""
    return {"python": (f"{q(key)}: ", ""), "ruby": (f"{q(key)} => ", ""),
            "go": (f"{{Key: {q(key)}, Value: ", "}"), "cpp": (f"kvp({q(key)}, ", ")")}[lang]


def brackets(value, lang: str) -> tuple[str, str]:
    if isinstance(value, dict):
        return {"python": ("{", "}"), "ruby": ("{ ", " }"), "go": ("bson.D{", "}"),
                "cpp": ("make_document(", ")")}[lang]
    return {"python": ("[", "]"), "ruby": ("[", "]"), "go": ("bson.A{", "}"),
            "cpp": ("make_array(", ")")}[lang]


def flat(value, lang: str) -> str:
    """Значение в одну строку."""
    if isinstance(value, dict):
        open_, close = brackets(value, lang)
        if not value and lang == "ruby":
            return "{}"
        parts = []
        for key, v in value.items():
            head, tail = pair_head(key, lang)
            parts.append(head + flat(v, lang) + tail)
        return open_ + ", ".join(parts) + close
    if isinstance(value, list):
        open_, close = brackets(value, lang)
        return open_ + ", ".join(flat(v, lang) for v in value) + close
    return scalar(value, lang)


def lit(value, lang: str, indent: str, used: int) -> str:
    """Значение, которое начинается в колонке used. Если строка не помещается,
    документ или массив переносится по элементу на строку с отступом на шаг глубже.
    Python и Ruby закрывают скобку на своей строке, а документ из одной пары
    обнимают: {"$match": { … }}. Go и C++ закрывают скобку сразу за последним
    элементом: в списке аргументов C++ висячая запятая не допускается."""
    one = flat(value, lang)
    limit = WIDTH[lang]
    if used + len(one) <= limit or not isinstance(value, (dict, list)) or len(value) == 0:
        return one
    if isinstance(value, list) and not any(isinstance(v, (dict, list)) for v in value) \
            and used + len(one) <= limit + 30:
        return one                          # короткий список значений не дробим
    inner = indent + STEPS[lang]
    open_, close = brackets(value, lang)
    if lang in ("python", "ruby") and isinstance(value, dict) and len(value) == 1:
        (key, v), = value.items()
        if isinstance(v, (dict, list)) and v:
            head, tail = pair_head(key, lang)
            return open_ + head + lit(v, lang, indent, used + len(open_) + len(head)) + tail + close
    if lang == "ruby" and isinstance(value, dict):
        open_, close = "{", "}"
    items = []
    if isinstance(value, dict):
        for key, v in value.items():
            head, tail = pair_head(key, lang)
            items.append(head + lit(v, lang, inner, len(inner) + len(head)) + tail)
    else:
        items = [lit(v, lang, inner, len(inner)) for v in value]
    if lang in ("python", "ruby"):
        return open_ + "\n" + "".join(inner + it + ",\n" for it in items) + indent + close
    return open_ + "\n" + ",\n".join(inner + it for it in items) + close


# ── конвейер ──────────────────────────────────────────────────────────────

def stage_line(stage: dict, lang: str, indent: str) -> str:
    """Стадия в списке стадий Python, Ruby или Go."""
    (op, arg), = stage.items()
    head, tail = pair_head(op, lang)
    if lang == "go":
        start = indent + "{" + head
        return start + lit(arg, lang, indent, len(start)) + tail + "}"
    open_, close = ("{", "}") if lang == "python" else ("{ ", " }")
    start = indent + open_ + head
    return start + lit(arg, lang, indent, len(start)) + close


def cpp_stage(stage: dict, var: str) -> str:
    (op, arg), = stage.items()
    method = CPP_METHOD.get(op)
    if method in ("limit", "skip", "sample") or (method in ("unwind", "count") and isinstance(arg, str)):
        return f"{var}.{method}({flat(arg, 'cpp')});"
    if method:
        start = f"{var}.{method}("
        return start + lit(arg, "cpp", "", len(start)) + ");"
    start = f"{var}.append_stage(make_document(kvp({q(op)}, "
    return start + lit(arg, "cpp", "", len(start)) + ")));"


def pipeline(stages: list, lang: str, var: str = "pipeline") -> str:
    """Объявление конвейера в переменной var."""
    if lang == "cpp":
        return "\n".join([f"mongocxx::pipeline {var};"] + [cpp_stage(st, var) for st in stages])
    head = {"python": f"{var} = [", "ruby": f"{var} = [", "go": f"{var} := mongo.Pipeline{{"}[lang]
    close = "]" if lang in ("python", "ruby") else "}"
    lines = [head] + [stage_line(st, lang, STEPS[lang]) + "," for st in stages] + [close]
    return "\n".join(lines)


def show_call(fields: list[str], lang: str, coll: str = "orders", var: str = "pipeline") -> str:
    names = ", ".join(q(f) for f in fields)
    if lang == "python":
        return f"show({coll}.aggregate({var}), {names})"
    if lang == "ruby":
        return f"show({coll}.aggregate({var}), {names})"
    if lang == "go":
        return f"cursor, _ := {coll}.Aggregate(ctx, {var})\nshow(cursor, {names})"
    return f"show({coll}.aggregate({var}), {{{names}}});"


def agg(stages: list, fields: list[str], coll: str = "orders", var: str = "pipeline") -> dict:
    """Код примера «конвейер → show» на четырёх языках."""
    return {lang: pipeline(stages, lang, var) + "\n\n" + show_call(fields, lang, coll, var)
            for lang in ("python", "ruby", "go", "cpp")}


def example(chapter: str, name: str, caption: str, plain: dict) -> None:
    EXAMPLES.setdefault(chapter, {})[name] = {"caption": caption, "plain": plain}


# ── 4.1 Конвейер агрегации: $match, $sort, $limit ─────────────────────────

FIELDS = ["number", "status", "delivery.city", "total"]

# 13 заказов в пути — тот же результат, что у find
example("4.1", "first", "конвейер из одной стадии", {
    lang: code + "\n" + {
        "python": 'print("find с тем же фильтром:", orders.count_documents({"status": "в пути"}))',
        "ruby": 'puts "find с тем же фильтром: " + orders.count_documents({ "status" => "в пути" }).to_s',
        "go": 'n, _ := orders.CountDocuments(ctx, bson.D{{Key: "status", Value: "в пути"}})\n'
              'fmt.Println("find с тем же фильтром:", n)',
        "cpp": 'std::cout << "find с тем же фильтром: "\n'
               '          << orders.count_documents(make_document(kvp("status", "в пути"))) << std::endl;',
    }[lang]
    for lang, code in agg([{"$match": {"status": "в пути"}}], FIELDS).items()})

# 120 → 69 → 22 → 5: счёт после каждой стадии
CHAIN = [
    {"$match": {"status": "доставлен"}},
    {"$match": {"delivery.city": {"$in": ["Москва", "Санкт-Петербург"]}}},
    {"$match": {"total": {"$gte": 200000}}},
]
example("4.1", "chain", "три стадии и счёт после каждой", {
    "python": pipeline(CHAIN, "python", "stages") + '''

print("на входе:", orders.count_documents({}))
for i in range(1, len(stages) + 1):
    count = len(list(orders.aggregate(stages[:i])))
    print(f"после стадии {i}:", count)

show(orders.aggregate(stages), "number", "status", "delivery.city", "total")''',
    "ruby": pipeline(CHAIN, "ruby", "stages") + '''

puts "на входе: #{orders.count_documents({})}"
(1..stages.size).each do |i|
  count = orders.aggregate(stages.first(i)).to_a.size
  puts "после стадии #{i}: #{count}"
end

show(orders.aggregate(stages), "number", "status", "delivery.city", "total")''',
    "go": pipeline(CHAIN, "go", "stages") + '''

total, _ := orders.CountDocuments(ctx, bson.D{})
fmt.Println("на входе:", total)
for i := 1; i <= len(stages); i++ {
    cursor, _ := orders.Aggregate(ctx, stages[:i])
    var docs []bson.D
    cursor.All(ctx, &docs)
    fmt.Printf("после стадии %d: %d\\n", i, len(docs))
}

cursor, _ := orders.Aggregate(ctx, stages)
show(cursor, "number", "status", "delivery.city", "total")''',
    "cpp": '''std::vector<bsoncxx::document::value> stages;
''' + "\n".join("stages.push_back(" + lit(st, "cpp", "", 17) + ");" for st in CHAIN) + '''

std::cout << "на входе: " << orders.count_documents({}) << std::endl;
for (std::size_t i = 1; i <= stages.size(); ++i) {
    mongocxx::pipeline pipeline;
    for (std::size_t j = 0; j < i; ++j) pipeline.append_stage(stages[j].view());
    auto cursor = orders.aggregate(pipeline);
    std::cout << "после стадии " << i << ": "
              << std::distance(cursor.begin(), cursor.end()) << std::endl;
}

mongocxx::pipeline pipeline;
for (auto& stage : stages) pipeline.append_stage(stage.view());
show(orders.aggregate(pipeline), {"number", "status", "delivery.city", "total"});''',
})

# 6 заказов: язык фильтров модуля 2 внутри $match
example("4.1", "filters", "условия модуля 2 внутри $match", agg([{"$match": {
    "status": {"$in": ["собирается", "в пути"]},
    "payment.method": {"$in": ["карта", "СБП"]},
    "items": {"$elemMatch": {"category": "смартфоны", "qty": {"$gte": 2}}},
}}], ["number", "status", "payment.method", "total"]))

# три самых дорогих заказа в пути
example("4.1", "sortlimit", "стадии $sort и $limit", agg([
    {"$match": {"status": "в пути"}},
    {"$sort": {"total": -1}},
    {"$limit": 3},
], FIELDS))

# порядок стадий: 2 заказа против 5
ORDER_A = [{"$sort": {"created": -1}}, {"$limit": 5}, {"$match": {"status": "доставлен"}}]
ORDER_B = [{"$match": {"status": "доставлен"}}, {"$sort": {"created": -1}}, {"$limit": 5}]
_order = {}
for lang in ("python", "ruby", "go", "cpp"):
    a = pipeline(ORDER_A, lang, "last_first" if lang in ("python", "ruby", "cpp") else "lastFirst")
    b = pipeline(ORDER_B, lang, "match_first" if lang in ("python", "ruby", "cpp") else "matchFirst")
    title = {"python": 'print("── {}")', "ruby": 'puts "── {}"', "go": 'fmt.Println("── {}")',
             "cpp": 'std::cout << "── {}" << std::endl;'}[lang]
    fields = ["number", "created", "status"]
    if lang == "go":
        calls = (title.format("$limit до $match") + "\ncursor, _ := orders.Aggregate(ctx, lastFirst)\n"
                 + 'show(cursor, "number", "created", "status")\n\n'
                 + title.format("$match до $limit") + "\ncursor, _ = orders.Aggregate(ctx, matchFirst)\n"
                 + 'show(cursor, "number", "created", "status")')
    else:
        va, vb = "last_first", "match_first"
        calls = (title.format("$limit до $match") + "\n" + show_call(fields, lang, var=va) + "\n\n"
                 + title.format("$match до $limit") + "\n" + show_call(fields, lang, var=vb))
    _order[lang] = a + "\n\n" + b + "\n\n" + calls
example("4.1", "order", "порядок стадий", _order)

# стадия с двумя операторами — ошибка 40323
example("4.1", "twoops", "два оператора в одной стадии", {
    "python": '''from pymongo.errors import OperationFailure

pipeline = [
    {"$match": {"status": "в пути"}, "$limit": 3},
]
try:
    show(orders.aggregate(pipeline), "number")
except OperationFailure as e:
    print("код", e.code)
    print(e.details["errmsg"])''',
    "ruby": '''pipeline = [
  { "$match" => { "status" => "в пути" }, "$limit" => 3 },
]
begin
  show(orders.aggregate(pipeline), "number")
rescue Mongo::Error::OperationFailure => e
  puts "код #{e.code}"
  puts e.document["errmsg"]
end''',
    "go": '''pipeline := mongo.Pipeline{
    {{Key: "$match", Value: bson.D{{Key: "status", Value: "в пути"}}}, {Key: "$limit", Value: 3}},
}
cursor, err := orders.Aggregate(ctx, pipeline)
var ce mongo.CommandError
if errors.As(err, &ce) {
    fmt.Println("код", ce.Code)
    fmt.Println(ce.Message)
} else {
    show(cursor, "number")
}''',
    "cpp": '''mongocxx::pipeline pipeline;
pipeline.append_stage(make_document(kvp("$match", make_document(kvp("status", "в пути"))),
                                    kvp("$limit", 3)));
try {
    show(orders.aggregate(pipeline), {"number"});
} catch (const mongocxx::operation_exception& e) {
    std::cout << "код " << e.code().value() << std::endl;
    std::cout << e.what() << std::endl;
}''',
})


ERRORS["4.1"] = [
    ({"python": '<code>{"$match": {...}, "$limit": 3}</code>', "ruby": '<code>{ "$match" =&gt; {...}, "$limit" =&gt; 3 }</code>',
      "go": '<code>{{Key: "$match", ...}, {Key: "$limit", Value: 3}}</code>',
      "cpp": '<code>make_document(kvp("$match", …), kvp("$limit", 3))</code>'},
     "Ошибка 40323: в документе стадии должно быть ровно одно поле",
     "Каждый оператор — отдельная стадия, отдельный документ в списке"),
    ({"python": '<code>orders.aggregate({"$match": {...}})</code>', "ruby": '<code>orders.aggregate({ "$match" =&gt; {...} })</code>',
      "go": '<code>orders.Aggregate(ctx, bson.D{{Key: "$match", ...}})</code>',
      "cpp": '<code>orders.aggregate(make_document(…))</code>'},
     {"python": "Метод принимает только список стадий; словарь вместо списка вызывает ошибку TypeError",
      "ruby": "Метод принимает массив стадий; хеш вместо массива вызывает ошибку",
      "go": "bson.D — один документ; метод принимает список стадий и на документ возвращает ошибку",
      "cpp": "Метод aggregate принимает mongocxx::pipeline; документ вместо него не компилируется"},
     {"python": "Стадии всегда в списке: <code>[{\"$match\": {...}}]</code>, даже если стадия одна",
      "ruby": "Стадии всегда в массиве: <code>[{ \"$match\" =&gt; {...} }]</code>",
      "go": "Стадии — в <code>mongo.Pipeline{...}</code>",
      "cpp": "Стадии добавляются в <code>mongocxx::pipeline</code>: <code>pipeline.match(...)</code>"}),
    ("<code>$limit</code> перед <code>$match</code>",
     "Условие проверяется только у документов, которые прошли предел: из пяти последних заказов остаются два доставленных",
     "Сначала <code>$match</code>, затем <code>$sort</code> и <code>$limit</code>: предел берётся из уже отобранных"),
    ("<code>$limit</code> без <code>$sort</code>",
     "Предел берёт первые документы в порядке хранения, порядок по нужному полю не учитывается",
     "Перед <code>$limit</code> ставить <code>$sort</code> по нужному полю"),
    ("<code>{\"$match\": {\"total\": {\"$gt\": \"200000\"}}}</code>",
     "Число сравнивается со строкой: условие не находит ни одного заказа",
     "Тип значения в условии — как в документе: <code>200000</code> без кавычек"),
]

CHEATS["4.1"] = [
    ("Конвейер", {"python": ['pipeline = [', '    {"$match": {"status": "в пути"}},', '    {"$sort": {"total": -1}},', '    {"$limit": 3},', ']'],
                  "ruby": ['pipeline = [', '  { "$match" => { "status" => "в пути" } },', '  { "$sort" => { "total" => -1 } },', '  { "$limit" => 3 },', ']'],
                  "go": ['pipeline := mongo.Pipeline{', '    {{Key: "$match", Value: bson.D{...}}},', '    {{Key: "$sort", Value: bson.D{...}}},', '    {{Key: "$limit", Value: 3}},', '}'],
                  "cpp": ['mongocxx::pipeline pipeline;', 'pipeline.match(make_document(kvp("status", "в пути")));', 'pipeline.sort(make_document(kvp("total", -1)));', 'pipeline.limit(3);']}),
    ("Запуск", {"python": ["for doc in orders.aggregate(pipeline):"],
                "ruby": ["orders.aggregate(pipeline).each { |doc| ... }"],
                "go": ["cursor, err := orders.Aggregate(ctx, pipeline)"],
                "cpp": ["for (auto&& doc : orders.aggregate(pipeline))"]}),
    ("Стадия без своего метода", {"python": ['{"$limit": 3}'], "ruby": ['{ "$limit" => 3 }'],
                                  "go": ['{{Key: "$limit", Value: 3}}'],
                                  "cpp": ['pipeline.append_stage(make_document(kvp("$limit", 3)));']}),
    ("Порядок", {"all": ["$match → $sort → $limit"]}),
]


# ── вывод документов целиком и перехват ошибок сервера ────────────────────

def docs_code(lang: str, coll: str = "orders", var: str = "pipeline", first: bool = True) -> str:
    """Печать каждого документа целиком: в главе о форме ответа видна сама форма."""
    if lang == "python":
        return f"for doc in {coll}.aggregate({var}):\n    print(doc)"
    if lang == "ruby":
        return f"{coll}.aggregate({var}).each {{ |doc| puts doc.inspect }}"
    if lang == "go":
        op = ":=" if first else "="
        return (f"cursor, _ {op} {coll}.Aggregate(ctx, {var})\n"
                "for cursor.Next(ctx) {\n"
                "    var doc bson.D\n"
                "    cursor.Decode(&doc)\n"
                "    out, _ := bson.MarshalExtJSON(doc, false, false)\n"
                "    fmt.Println(string(out))\n"
                "}")
    return (f"for (auto&& doc : {coll}.aggregate({var})) {{\n"
            "    std::cout << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;\n"
            "}")


def try_code(lang: str, coll: str = "orders", var: str = "pipeline", first: bool = True) -> str:
    """Запуск конвейера, который сервер отклоняет: печать кода и текста ошибки."""
    if lang == "python":
        return (f"try:\n    for doc in {coll}.aggregate({var}):\n        print(doc)\n"
                "except OperationFailure as e:\n    print(\"код\", e.code)\n    print(e.details[\"errmsg\"])")
    if lang == "ruby":
        return (f"begin\n  {coll}.aggregate({var}).each {{ |doc| puts doc.inspect }}\n"
                "rescue Mongo::Error::OperationFailure => e\n  puts \"код #{e.code}\"\n  puts e.document[\"errmsg\"]\nend")
    if lang == "go":
        decl = ("_, err := " if first else "_, err = ") + f"{coll}.Aggregate(ctx, {var})"
        ce = "var ce mongo.CommandError\n" if first else ""
        return (decl + "\n" + ce + "if errors.As(err, &ce) {\n"
                "    fmt.Println(\"код\", ce.Code)\n    fmt.Println(ce.Message)\n}")
    return ("try {\n"
            f"    for (auto&& doc : {coll}.aggregate({var})) {{\n"
            "        std::cout << bsoncxx::to_json(doc) << std::endl;\n    }\n"
            "} catch (const mongocxx::operation_exception& e) {\n"
            "    std::cout << \"код \" << e.code().value() << std::endl;\n"
            "    std::cout << e.what() << std::endl;\n}")


LANGS4 = ("python", "ruby", "go", "cpp")
IMPORT_ERR = {"python": "from pymongo.errors import OperationFailure\n\n"}


def title_code(lang: str, text: str) -> str:
    return {"python": f'print("── {text}")', "ruby": f'puts "── {text}"', "go": f'fmt.Println("── {text}")',
            "cpp": f'std::cout << "── {text}" << std::endl;'}[lang]


def agg_docs(stages: list, coll: str = "orders") -> dict:
    return {lang: pipeline(stages, lang) + "\n\n" + docs_code(lang, coll) for lang in LANGS4}


def gvar(name: str, lang: str) -> str:
    """Имя переменной: в Go — с заглавной буквы на стыке слов (matchFirst)."""
    if lang != "go":
        return name
    head, *rest = name.split("_")
    return head + "".join(w.capitalize() for w in rest)


# ── 4.2 $project: форма ответа ────────────────────────────────────────────

TOP3 = [{"$match": {"status": "в пути"}}, {"$sort": {"total": -1}}, {"$limit": 3}]
LAPTOPS = [{"$match": {"category": "ноутбуки"}}, {"$sort": {"price": -1}}]

# _id остаётся сам
example("4.2", "include", "включение полей", agg_docs(TOP3 + [{"$project": {"number": 1, "total": 1}}]))

# вложенное поле остаётся вложенным; порядок полей — как в документе
example("4.2", "nested", "без _id, с вложенным полем",
        agg_docs(TOP3 + [{"$project": {"_id": 0, "number": 1, "delivery.city": 1, "total": 1}}]))

# новые имена и путь к полю
example("4.2", "rename", "новые имена полей",
        agg_docs(TOP3 + [{"$project": {"_id": 0, "order": "$number", "city": "$delivery.city", "sum": "$total"}}]))

# вычисления: цена со скидкой 10 % и размер скидки
example("4.2", "compute", "вычисляемые поля", agg_docs(LAPTOPS + [{"$project": {
    "_id": 0, "title": 1, "price": 1,
    "sale": {"$multiply": ["$price", 0.9]},
    "saving": {"$subtract": ["$price", {"$multiply": ["$price", 0.9]}]},
}}], coll="products"))

# строки: $concat, ошибка на числе и $toString
CONCAT_BAD = TOP3 + [{"$project": {"_id": 0, "line": {"$concat": ["$number", " — ", "$total"]}}}]
CONCAT_OK = TOP3 + [{"$project": {"_id": 0, "line": {"$concat": ["$number", " — ", {"$toString": "$total"}, " ₽"]}}}]
example("4.2", "concat", "склейка строк", {
    lang: IMPORT_ERR.get(lang, "")
    + pipeline(CONCAT_BAD, lang, gvar("with_number", lang)) + "\n\n"
    + pipeline(CONCAT_OK, lang, gvar("with_string", lang)) + "\n\n"
    + title_code(lang, "$concat с числом") + "\n" + try_code(lang, var=gvar("with_number", lang)) + "\n\n"
    + title_code(lang, "$concat с $toString") + "\n" + docs_code(lang, var=gvar("with_string", lang))
    for lang in LANGS4})

# условие: $cond
example("4.2", "cond", "поле по условию", agg_docs([
    {"$match": {"category": {"$in": ["ноутбуки", "смартфоны"]}}},
    {"$sort": {"price": -1}},
    {"$project": {"_id": 0, "title": 1, "price": 1, "segment": {"$cond": {
        "if": {"$gte": ["$price", 50000]}, "then": "дорогой", "else": "доступный"}}}},
], coll="products"))

# смешивать нельзя: включение с исключением, исключение с выражением
MIX_A = TOP3 + [{"$project": {"number": 1, "items": 0}}]
MIX_B = TOP3 + [{"$project": {"items": 0, "sum": "$total"}}]
example("4.2", "mix", "включение вместе с исключением", {
    lang: IMPORT_ERR.get(lang, "")
    + pipeline(MIX_A, lang, gvar("keep_and_drop", lang)) + "\n\n"
    + pipeline(MIX_B, lang, gvar("drop_and_compute", lang)) + "\n\n"
    + title_code(lang, "number: 1 и items: 0") + "\n" + try_code(lang, var=gvar("keep_and_drop", lang)) + "\n\n"
    + title_code(lang, "items: 0 и новое поле") + "\n" + try_code(lang, var=gvar("drop_and_compute", lang), first=False)
    for lang in LANGS4})

# место $project в конвейере
EARLY = [{"$project": {"number": 1, "total": 1}}, {"$match": {"status": "в пути"}}]
LATE = [{"$match": {"status": "в пути"}}, {"$project": {"number": 1, "total": 1}}]
_place = {}
for lang in LANGS4:
    a, b = gvar("project_first", lang), gvar("match_first", lang)
    count = {
        "python": lambda v, t: f'print("{t}:", len(list(orders.aggregate({v}))))',
        "ruby": lambda v, t: f'puts "{t}: #{{orders.aggregate({v}).to_a.size}}"',
        "go": lambda v, t: (f"cursor, _ := orders.Aggregate(ctx, {v})\nvar docs []bson.D\ncursor.All(ctx, &docs)\n"
                            f'fmt.Println("{t}:", len(docs))'),
        "cpp": lambda v, t: (f"auto cursor = orders.aggregate({v});\n"
                             f'std::cout << "{t}: " << std::distance(cursor.begin(), cursor.end()) << std::endl;'),
    }[lang]
    first = count(a, "$project до $match")
    second = count(b, "$match до $project")
    if lang == "go":
        second = second.replace("cursor, _ :=", "cursor, _ =").replace("var docs []bson.D\n", "docs = nil\n")
    if lang == "cpp":
        second = second.replace("auto cursor =", "auto cursor2 =").replace("cursor.begin(), cursor.end()", "cursor2.begin(), cursor2.end()")
    _place[lang] = pipeline(EARLY, lang, a) + "\n\n" + pipeline(LATE, lang, b) + "\n\n" + first + "\n" + second
example("4.2", "place", "$project до и после $match", _place)


ERRORS["4.2"] = [
    ('<code>{"number": 1, "items": 0}</code>',
     "Ошибка 31254: в одной проекции включение и исключение полей",
     "Перечислить только нужные поля; во включающей проекции исключать можно только <code>_id</code>"),
    ('<code>{"items": 0, "sum": "$total"}</code>',
     "Ошибка 31310: новое поле в исключающей проекции",
     "Новые поля — только во включающей проекции: перечислить нужные поля и добавить новое"),
    ('<code>{"city": "delivery.city"}</code>',
     "Без знака <code>$</code> строка — значение: у всех документов <code>city</code> равно тексту «delivery.city»",
     'Путь к полю начинается с <code>$</code>: <code>"$delivery.city"</code>'),
    ('<code>{"$concat": ["$number", " — ", "$total"]}</code>',
     "Ошибка 16702: <code>$concat</code> склеивает только строки, а <code>total</code> — число",
     'Перевести число в строку: <code>{"$toString": "$total"}</code>'),
    ("<code>$project</code> перед <code>$match</code> по убранному полю",
     "Поля <code>status</code> после проекции нет, условию не подходит ни один документ: 0",
     "Сначала <code>$match</code>, затем <code>$project</code>; или оставить в проекции поля, нужные следующим стадиям"),
]

def cheat_lines(value) -> dict:
    """Карточка шпаргалки: один литерал на языке каждого драйвера. Стадию
    в C++ показываем методом конвейера: так она и добавляется в коде."""
    out = {lang: [flat(value, lang)] for lang in LANGS4}
    (key, arg), = value.items()
    if key in CPP_METHOD:
        out["cpp"] = [cpp_stage(value, "pipeline")]
    return out


CHEATS["4.2"] = [
    ("Включить, убрать _id", cheat_lines({"$project": {"_id": 0, "number": 1, "total": 1}})),
    ("Новое имя, поле наверх", cheat_lines({"$project": {"order": "$number", "city": "$delivery.city"}})),
    ("Вычисление", cheat_lines({"sale": {"$multiply": ["$price", 0.9]}})),
    ("Строка из числа", cheat_lines({"line": {"$concat": ["$number", " — ", {"$toString": "$total"}]}})),
    ("Условие", cheat_lines({"$cond": {"if": {"$gte": ["$price", 50000]}, "then": "дорогой", "else": "доступный"}})),
    ("Добавить стадию", {"python": ["pipeline.append({\"$project\": {...}})"], "ruby": ["pipeline.push({ \"$project\" => {...} })"],
                      "go": ['pipeline = append(pipeline, bson.D{{Key: "$project", Value: ...}})'],
                      "cpp": ['pipeline.project(make_document(kvp("number", 1)));']}),
]
