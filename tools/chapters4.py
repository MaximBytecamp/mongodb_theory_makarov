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
    if len(value) != 1:
        return out
    (key, arg), = value.items()
    if key.startswith("$") and key not in ("$cond", "$concat", "$multiply"):
        method = CPP_METHOD.get(key)
        out["cpp"] = [f"pipeline.{method}({flat(arg, 'cpp')});" if method
                      else f"pipeline.append_stage(make_document(kvp({q(key)}, {flat(arg, 'cpp')})));"]
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


# ── 4.3 $addFields, $set, $unset ──────────────────────────────────────────

REGULARS = [{"$match": {"segment": "постоянный"}}, {"$sort": {"name": 1}}, {"$limit": 3}]
CARD = {"$concat": ["$name", ", ", "$city"]}

# все поля остаются, добавляется card
example("4.3", "add", "новое поле при всех старых", agg_docs(REGULARS + [{"$addFields": {"card": CARD}}], coll="customers"))

# то же выражение в $project
example("4.3", "vsproject", "то же поле через $project", agg_docs(REGULARS + [{"$project": {"card": CARD}}], coll="customers"))

# перезапись поля: в потоке цена со скидкой, в коллекции прежняя
_over = agg(LAPTOPS + [{"$addFields": {"price": {"$multiply": ["$price", 0.9]}}}], ["title", "price"], coll="products")
MAC = "Ноутбук Apple MacBook Air 13"
_over["python"] += f'\nprint("в коллекции:", products.find_one({{"title": "{MAC}"}})["price"])'
_over["ruby"] += f'\nputs "в коллекции: #{{products.find({{ "title" => "{MAC}" }}).first["price"]}}"'
_over["go"] += (f'\nvar stored bson.M\nproducts.FindOne(ctx, bson.D{{{{Key: "title", Value: "{MAC}"}}}}).Decode(&stored)\n'
                'fmt.Println("в коллекции:", stored["price"])')
_over["cpp"] += (f'\nauto stored = products.find_one(make_document(kvp("title", "{MAC}")));\n'
                 'std::cout << "в коллекции: " << stored->view()["price"].get_int32().value << std::endl;')
example("4.3", "overwrite", "поле с тем же именем", _over)

# вложенное поле: остальные поля delivery на месте
example("4.3", "nested", "поле внутри вложенного документа", agg(TOP3 + [
    {"$addFields": {"delivery.fast": {"$lte": ["$delivery.days", 2]}}},
], ["number", "delivery.city", "delivery.type", "delivery.days", "delivery.fast"]))

# новое поле в следующих стадиях
SALE_UNDER = [
    {"$addFields": {"sale": {"$multiply": ["$price", 0.9]}}},
    {"$match": {"sale": {"$lt": 30000}}},
    {"$sort": {"sale": -1}},
    {"$limit": 3},
]
example("4.3", "next", "новое поле в $match и $sort", agg(SALE_UNDER, ["title", "price", "sale"], coll="products"))

# $set — второе имя $addFields
SALE_SET = [{"$set": SALE_UNDER[0]["$addFields"]}] + SALE_UNDER[1:]
example("4.3", "set", "тот же конвейер со стадией $set", agg(SALE_SET, ["title", "price", "sale"], coll="products"))

# $unset: убрать поля
example("4.3", "unset", "стадия $unset", agg_docs(REGULARS + [{"$unset": ["phone", "email"]}], coll="customers"))

# 0 в $addFields — значение, а не исключение
example("4.3", "zero", "ноль в $addFields", agg_docs(REGULARS + [{"$addFields": {"phone": 0}}], coll="customers"))


ERRORS["4.3"] = [
    ('<code>{"$addFields": {"phone": 0}}</code>',
     "Поле не удаляется: у каждого документа <code>phone</code> становится равным 0",
     'Убирать поля стадией <code>{"$unset": ["phone"]}</code>'),
    ('<code>{"$addFields": {"price": {"$multiply": ["$price", 0.9]}}}</code>, затем ожидание старой цены',
     "Поле с тем же именем перезаписано: дальше по конвейеру цена уже со скидкой",
     "Новое значение класть в поле с новым именем: <code>sale</code>"),
    ("<code>$match</code> по новому полю перед <code>$addFields</code>",
     "Поля ещё нет, условию не подходит ни один документ",
     "Сначала <code>$addFields</code>, затем <code>$match</code> по новому полю"),
    ("Ожидание, что <code>$addFields</code> изменит коллекцию",
     "Меняются только документы в потоке; в коллекции значения прежние",
     "Для изменения коллекции — <code>update_one</code> и <code>update_many</code> из главы 1.7"),
]

CHEATS["4.3"] = [
    ("Добавить поле", cheat_lines({"$addFields": {"card": {"$concat": ["$name", ", ", "$city"]}}})),
    ("То же — $set", cheat_lines({"$set": {"card": {"$concat": ["$name", ", ", "$city"]}}})),
    ("Поле во вложенном документе", cheat_lines({"$addFields": {"delivery.fast": {"$lte": ["$delivery.days", 2]}}})),
    ("Убрать поля", cheat_lines({"$unset": ["phone", "email"]})),
]


# ── 4.4 $group и аккумуляторы ─────────────────────────────────────────────

DELIVERED = {"$match": {"status": "доставлен"}}
BY_CITY = {"$group": {"_id": "$delivery.city", "orders": {"$sum": 1}, "revenue": {"$sum": "$total"}}}

# выручка по городам
example("4.4", "bycity", "доставленные заказы по городам", agg_docs([DELIVERED, BY_CITY, {"$sort": {"_id": 1}}]))

# одна группа на все документы
example("4.4", "total", "одна группа: _id null", agg_docs([DELIVERED, {"$group": {
    "_id": None, "orders": {"$sum": 1}, "revenue": {"$sum": "$total"}}}]))

# среднее, минимум, максимум; округление среднего
example("4.4", "stats", "$avg, $min и $max", agg_docs([
    DELIVERED,
    {"$group": {"_id": "$delivery.city", "avg": {"$avg": "$total"},
                "min": {"$min": "$total"}, "max": {"$max": "$total"}}},
    {"$project": {"avg": {"$round": ["$avg", 0]}, "min": 1, "max": 1}},
    {"$sort": {"_id": 1}},
]))

# составной ключ
example("4.4", "composite", "ключ из двух полей", agg_docs([
    {"$match": {"status": "доставлен", "delivery.city": {"$in": ["Москва", "Ярославль"]}}},
    {"$group": {"_id": {"city": "$delivery.city", "type": "$delivery.type"},
                "orders": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
    {"$sort": {"_id.city": 1, "_id.type": 1}},
]))

# $match до $group: какие заказы считать
ALL_ORDERS = [{"$group": {"_id": "$delivery.city", "revenue": {"$sum": "$total"}}}, {"$sort": {"_id": 1}}]
ONLY_DELIVERED = [DELIVERED] + ALL_ORDERS
example("4.4", "before", "$match до $group", {
    lang: pipeline(ALL_ORDERS, lang, gvar("all_orders", lang)) + "\n\n"
    + pipeline(ONLY_DELIVERED, lang, gvar("only_delivered", lang)) + "\n\n"
    + title_code(lang, "все заказы") + "\n" + docs_code(lang, var=gvar("all_orders", lang)) + "\n\n"
    + title_code(lang, "только доставленные") + "\n" + docs_code(lang, var=gvar("only_delivered", lang), first=False)
    for lang in LANGS4})

# $match после $group: отбор групп
example("4.4", "after", "$match после $group", agg_docs([
    DELIVERED,
    {"$group": {"_id": "$delivery.city", "revenue": {"$sum": "$total"}}},
    {"$match": {"revenue": {"$gte": 2000000}}},
    {"$sort": {"revenue": -1}},
]))

# аккумулятор по строковому полю
example("4.4", "strings", "$sum и $avg по строкам", agg_docs([{"$group": {
    "_id": None, "sum": {"$sum": "$number"}, "avg": {"$avg": "$number"}}}]))

# ошибки записи $group
NO_ACC = [{"$group": {"_id": "$delivery.city", "city": "$delivery.city"}}]
NO_ID = [{"$group": {"orders": {"$sum": 1}}}]
example("4.4", "errors", "поле без аккумулятора и группа без _id", {
    lang: IMPORT_ERR.get(lang, "")
    + pipeline(NO_ACC, lang, gvar("no_accumulator", lang)) + "\n\n"
    + pipeline(NO_ID, lang, gvar("no_id", lang)) + "\n\n"
    + title_code(lang, "поле без аккумулятора") + "\n" + try_code(lang, var=gvar("no_accumulator", lang)) + "\n\n"
    + title_code(lang, "группа без _id") + "\n" + try_code(lang, var=gvar("no_id", lang), first=False)
    for lang in LANGS4})


ERRORS["4.4"] = [
    ('<code>{"$group": {"_id": "$delivery.city", "city": "$delivery.city"}}</code>',
     "Ошибка 40234: каждое поле группы, кроме <code>_id</code>, должно быть аккумулятором",
     'Значение поля — аккумулятор, например <code>{"$max": "$number"}</code>; поле ключа уже лежит в <code>_id</code>'),
    ('<code>{"$group": {"orders": {"$sum": 1}}}</code>',
     "Ошибка 15955: у стадии <code>$group</code> нет <code>_id</code>",
     'Ключ обязателен; одна группа на все документы — <code>"_id": null</code>'),
    ('<code>{"_id": "delivery.city"}</code>',
     "Без знака <code>$</code> ключ — один и тот же текст у всех документов: получается одна группа",
     'Путь к полю: <code>"_id": "$delivery.city"</code>'),
    ('<code>{"$sum": "$number"}</code> по строковому полю',
     "Ошибки нет: строки пропускаются, сумма 0, а <code>$avg</code> даёт <code>null</code>",
     "Суммировать только числовые поля; при сомнении проверить тип в Compass на вкладке Schema"),
    ("<code>$group</code> по всем заказам вместо доставленных",
     "В выручку попадают отменённые и не доставленные заказы",
     "Отбирать документы стадией <code>$match</code> до <code>$group</code>"),
]

CHEATS["4.4"] = [
    ("Группа и счёт", cheat_lines({"$group": {"_id": "$delivery.city", "orders": {"$sum": 1}}})),
    ("Сумма поля", cheat_lines({"revenue": {"$sum": "$total"}})),
    ("Среднее, минимум, максимум", cheat_lines({"avg": {"$avg": "$total"}, "min": {"$min": "$total"}, "max": {"$max": "$total"}})),
    ("Одна группа на всё", cheat_lines({"$group": {"_id": None, "revenue": {"$sum": "$total"}}})),
    ("Ключ из двух полей", cheat_lines({"_id": {"city": "$delivery.city", "type": "$delivery.type"}})),
]


# ── 4.5 $skip, $count, $sortByCount; память сортировки ───────────────────

IN_TRANSIT_SORTED = [{"$match": {"status": "в пути"}}, {"$sort": {"total": -1}}]

# вторая страница по пять заказов
example("4.5", "page", "вторая страница: $skip и $limit",
        agg(IN_TRANSIT_SORTED + [{"$skip": 5}, {"$limit": 5}], ["number", "total"]))

# порядок $skip и $limit
LIMIT_SKIP = IN_TRANSIT_SORTED + [{"$limit": 10}, {"$skip": 5}]
SKIP_LIMIT = IN_TRANSIT_SORTED + [{"$skip": 5}, {"$limit": 10}]
_ls = {}
for lang in LANGS4:
    a, b = gvar("limit_then_skip", lang), gvar("skip_then_limit", lang)
    body = pipeline(LIMIT_SKIP, lang, a) + "\n\n" + pipeline(SKIP_LIMIT, lang, b) + "\n\n"
    body += title_code(lang, "$limit 10, затем $skip 5") + "\n" + show_call(["number", "total"], lang, var=a) + "\n\n"
    second = show_call(["number", "total"], lang, var=b)
    if lang == "go":
        second = second.replace("cursor, _ :=", "cursor, _ =")
    body += title_code(lang, "$skip 5, затем $limit 10") + "\n" + second
    _ls[lang] = body
example("4.5", "order", "$skip и $limit в двух порядках", _ls)

# $count
example("4.5", "count", "стадия $count", agg_docs([{"$match": {"status": "доставлен"}}, {"$count": "delivered"}]))

# $count после $group: сколько групп
example("4.5", "countgroups", "$count после $group", agg_docs([
    {"$match": {"status": "доставлен"}},
    {"$group": {"_id": "$delivery.city", "revenue": {"$sum": "$total"}}},
    {"$match": {"revenue": {"$gte": 2000000}}},
    {"$count": "cities"},
]))

# $count на пустом потоке
EMPTY = [{"$match": {"status": "возврат"}}, {"$count": "returns"}]
example("4.5", "empty", "$count, когда документов нет", {
    "python": pipeline(EMPTY, "python") + '\n\nresult = list(orders.aggregate(pipeline))\nprint("документов в результате:", len(result))\nprint(result)',
    "ruby": pipeline(EMPTY, "ruby") + '\n\nresult = orders.aggregate(pipeline).to_a\nputs "документов в результате: #{result.size}"\nputs result.inspect',
    "go": pipeline(EMPTY, "go") + '\n\ncursor, _ := orders.Aggregate(ctx, pipeline)\nvar result []bson.D\ncursor.All(ctx, &result)\nfmt.Println("документов в результате:", len(result))',
    "cpp": pipeline(EMPTY, "cpp") + '\n\nauto cursor = orders.aggregate(pipeline);\nstd::cout << "документов в результате: " << std::distance(cursor.begin(), cursor.end()) << std::endl;',
})

# $sortByCount и то же через $group + $sort
BY_COUNT = [{"$sortByCount": "$status"}]
GROUP_SORT = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
example("4.5", "sortbycount", "$sortByCount и $group с $sort", {
    lang: pipeline(BY_COUNT, lang, gvar("by_count", lang)) + "\n\n"
    + pipeline(GROUP_SORT, lang, gvar("group_sort", lang)) + "\n\n"
    + title_code(lang, "$sortByCount") + "\n" + docs_code(lang, var=gvar("by_count", lang)) + "\n\n"
    + title_code(lang, "$group и $sort") + "\n" + docs_code(lang, var=gvar("group_sort", lang), first=False)
    for lang in LANGS4})

# память сортировки: план с $limit и без
example("4.5", "memory", "план сортировки с $limit и без", {
    "python": '''sorted_all = [
    {"$match": {"status": "в пути"}},
    {"$sort": {"total": -1}},
]
top3 = sorted_all + [{"$limit": 3}]

for name, stages in [("без $limit", sorted_all), ("с $limit 3", top3)]:
    info = db.command("explain", {"aggregate": "orders", "pipeline": stages, "cursor": {}},
                      verbosity="queryPlanner")
    plan = info["queryPlanner"]["winningPlan"]
    print(name, "|", plan["stage"], "| memLimit", plan["memLimit"],
          "| limitAmount", plan.get("limitAmount", "—"))''',
    "ruby": '''sorted_all = [
  { "$match" => { "status" => "в пути" } },
  { "$sort" => { "total" => -1 } },
]
top3 = sorted_all + [{ "$limit" => 3 }]

[["без $limit", sorted_all], ["с $limit 3", top3]].each do |name, stages|
  info = db.command(explain: { aggregate: "orders", pipeline: stages, cursor: {} },
                    verbosity: "queryPlanner").first
  plan = info["queryPlanner"]["winningPlan"]
  puts "#{name} | #{plan["stage"]} | memLimit #{plan["memLimit"]} | limitAmount #{plan["limitAmount"] || "—"}"
end''',
    "go": '''sortedAll := mongo.Pipeline{
    {{Key: "$match", Value: bson.D{{Key: "status", Value: "в пути"}}}},
    {{Key: "$sort", Value: bson.D{{Key: "total", Value: -1}}}},
}
top3 := append(append(mongo.Pipeline{}, sortedAll...), bson.D{{Key: "$limit", Value: 3}})

for _, item := range []struct {
    name   string
    stages mongo.Pipeline
}{{"без $limit", sortedAll}, {"с $limit 3", top3}} {
    var info bson.Raw
    db.RunCommand(ctx, bson.D{
        {Key: "explain", Value: bson.D{
            {Key: "aggregate", Value: "orders"},
            {Key: "pipeline", Value: item.stages},
            {Key: "cursor", Value: bson.D{}}}},
        {Key: "verbosity", Value: "queryPlanner"}}).Decode(&info)
    plan := info.Lookup("queryPlanner", "winningPlan").Document()
    limit := "—"
    if v, err := plan.LookupErr("limitAmount"); err == nil {
        limit = fmt.Sprint(v.AsInt64())
    }
    fmt.Println(item.name, "|", plan.Lookup("stage").StringValue(),
        "| memLimit", plan.Lookup("memLimit").AsInt64(), "| limitAmount", limit)
}''',
    "cpp": '''mongocxx::pipeline sorted_all;
sorted_all.match(make_document(kvp("status", "в пути")));
sorted_all.sort(make_document(kvp("total", -1)));
mongocxx::pipeline top3;
top3.match(make_document(kvp("status", "в пути")));
top3.sort(make_document(kvp("total", -1)));
top3.limit(3);

auto number = [](bsoncxx::document::element el) {
    return el.type() == bsoncxx::type::k_int32 ? std::to_string(el.get_int32().value)
                                               : std::to_string(el.get_int64().value);
};
for (auto& [name, stages] : std::vector<std::pair<std::string, mongocxx::pipeline*>>{
         {"без $limit", &sorted_all}, {"с $limit 3", &top3}}) {
    auto info = db.run_command(make_document(
        kvp("explain", make_document(kvp("aggregate", "orders"), kvp("pipeline", stages->view_array()),
                                     kvp("cursor", make_document()))),
        kvp("verbosity", "queryPlanner")));
    auto plan = info.view()["queryPlanner"]["winningPlan"].get_document().view();
    std::string limit = plan["limitAmount"] ? number(plan["limitAmount"]) : "—";
    std::cout << name << " | " << plan["stage"].get_string().value << " | memLimit "
              << number(plan["memLimit"]) << " | limitAmount " << limit << std::endl;
}''',
})


ERRORS["4.5"] = [
    ("<code>$skip</code> без <code>$sort</code>",
     "Страницы собираются из порядка хранения: при изменении коллекции документ может попасть на две страницы или ни на одну",
     "Перед <code>$skip</code> ставить <code>$sort</code> по полю с неповторяющимися значениями или добавить в сортировку <code>_id</code>"),
    ("<code>$limit 10</code>, затем <code>$skip 5</code>",
     "Предел берёт 10 документов, пропуск убирает из них 5: остаётся 5",
     "Для страницы — сначала <code>$skip</code>, затем <code>$limit</code>"),
    ('<code>{"$count": "n"}</code> на пустом потоке',
     "Стадия не выпускает ни одного документа: результат — пустой список, поля <code>n</code> со значением 0 нет",
     "В программе считать пустой результат нулём"),
    ('<code>{"$count": "$status"}</code>',
     "Ошибка 40158: имя поля в <code>$count</code> не может начинаться с <code>$</code>",
     'Параметр — имя нового поля: <code>{"$count": "orders"}</code>'),
    ("Ожидание, что <code>$sortByCount</code> быстрее <code>$group</code> и <code>$sort</code>",
     "Это та же группировка с сортировкой, записанная короче",
     "Выбирать запись по удобству чтения"),
]

CHEATS["4.5"] = [
    ("Страница", {lang: cheat_lines({"$skip": 5})[lang] + cheat_lines({"$limit": 5})[lang] for lang in LANGS4}),
    ("Подсчёт", cheat_lines({"$count": "delivered"})),
    ("Частота значений", cheat_lines({"$sortByCount": "$status"})),
]
