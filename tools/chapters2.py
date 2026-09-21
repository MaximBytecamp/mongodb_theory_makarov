"""Примеры, таблицы ошибок и шпаргалки глав модуля 2 — исходник для snippets.py.

Фильтры записаны литералами Python: из них snippets.py собирает код на
четырёх языках. Числа в комментариях — то, что даёт стенд; сам вывод в книгу
подставляет examples.py apply.
"""

from datetime import datetime

from snippets import Ref

EXAMPLES: dict = {}
ERRORS: dict = {}
CHEATS: dict = {}

# ── 2.2 Сравнение ──────────────────────────────────────────────────────────

EXAMPLES["2.2"] = {
    # 4 компании: Мосэнергосвязь, Яндекс, Тензор, Ozon Tech
    "gte": {"caption": "компании от 500 сотрудников", "steps": [
        {"coll": "companies", "filter": {"employees": {"$gte": 500}}, "fields": ["name", "employees"]},
    ]},
    # 1 1 9 0
    "eq": {"caption": "явное и неявное равенство", "steps": [
        {"rows": [
            {"label": "город Москва", "coll": "resumes", "filter": {"city": "Москва"}, "go": "neyavno"},
            {"label": "город $eq Москва", "coll": "resumes", "filter": {"city": {"$eq": "Москва"}}, "go": "yavno"},
            {"label": "fio {$ne: null}", "coll": "resumes", "filter": {"fio": {"$ne": None}}, "go": "operator"},
            {"label": "fio $eq {$ne: null}", "coll": "resumes", "filter": {"fio": {"$eq": {"$ne": None}}}, "go": "bukvalno"},
        ]},
    ]},
    # 4 и 3; четыре резюме по возрастанию зарплаты
    "range": {"caption": "зарплата от 70 до 100 тысяч", "steps": [
        {"rows": [
            {"label": "$gte 70000 и $lte 100000", "coll": "resumes",
             "filter": {"salary": {"$gte": 70000, "$lte": 100000}}, "go": "vklyuchaya"},
            {"label": "$gt 70000 и $lte 100000", "coll": "resumes",
             "filter": {"salary": {"$gt": 70000, "$lte": 100000}}, "go": "bez"},
        ]},
        {"coll": "resumes", "filter": {"salary": {"$gte": 70000, "$lte": 100000}},
         "fields": ["fio", "salary"], "sort": [("salary", 1)]},
    ]},
    # 5 вакансий: v-005, v-006, v-002, v-007, v-003
    "nested": {"caption": "вилка, в которую попадает 120 000", "steps": [
        {"coll": "vacancies", "var": True,
         "filter": {"salary.from": {"$lte": 120000}, "salary.to": {"$gte": 120000}},
         "fields": ["title", "salary"]},
    ]},
    # 5 и 0
    "dates": {"caption": "дата и строка с датой", "steps": [
        {"rows": [
            {"label": "updated $gte дата", "coll": "resumes",
             "filter": {"updated": {"$gte": datetime(2026, 9, 1)}}, "go": "datoy"},
            {"label": "updated $gte строка", "coll": "resumes",
             "filter": {"updated": {"$gte": "2026-09-01"}}, "go": "strokoy"},
        ]},
    ]},
    # 22 и 18
    "week": {"caption": "собеседования за неделю", "steps": [
        {"rows": [
            {"label": "с 21.09 до 28.09 ($lt)", "coll": "interviews",
             "filter": {"when": {"$gte": datetime(2026, 9, 21), "$lt": datetime(2026, 9, 28)}}, "go": "poluinterval"},
            {"label": "с 21.09 по 27.09 ($lte)", "coll": "interviews",
             "filter": {"when": {"$gte": datetime(2026, 9, 21), "$lte": datetime(2026, 9, 27)}}, "go": "otrezok"},
        ]},
    ]},
    # Retail Lab, Ozon Tech
    "strings": {"caption": "названия раньше кириллической «А»", "steps": [
        {"coll": "companies", "filter": {"name": {"$lt": "А"}}, "fields": ["name"]},
    ]},
    # 5, 4, 4; пять резюме, у Анны Беловой поля нет
    "ne": {"caption": "не равно и отсутствующее поле", "steps": [
        {"rows": [
            {"label": "ready_to_move $ne true", "coll": "resumes",
             "filter": {"ready_to_move": {"$ne": True}}, "go": "neRavno"},
            {"label": "ready_to_move false", "coll": "resumes",
             "filter": {"ready_to_move": False}, "go": "lozh"},
            {"label": "ready_to_move $lt true", "coll": "resumes",
             "filter": {"ready_to_move": {"$lt": True}}, "go": "menshe"},
        ]},
        {"coll": "resumes", "filter": {"ready_to_move": {"$ne": True}}, "fields": ["fio", "ready_to_move"]},
    ]},
}

ERRORS["2.2"] = [
    (("f", {"salary": {"$gt": "100000"}}), "Пусто: строка сравнивается только со строками, а в базе числа",
     ("f", {"$gt": 100000})),
    (("f", {"updated": {"$gte": "2026-09-01"}}), "Пусто: в базе дата, а в фильтре строка",
     {"python": "<code>datetime(2026, 9, 1)</code> вместо строки",
      "cpp": "<code>bsoncxx::types::b_date</code> вместо строки",
      "go": "<code>time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)</code> вместо строки",
      "ruby": "<code>Time.utc(2026, 9, 1)</code> вместо строки"}),
    (("f", {"salary": {"gte": 70000}}), "Пусто: без знака <code>$</code> это вложенный документ, и сравнивается он целиком",
     ("f", {"$gte": 70000})),
    ({"python": '<code>{"salary": {"$gte": 70000}, "salary": {"$lte": 100000}}</code>',
      "ruby": '<code>{ "salary" =&gt; { "$gte" =&gt; 70000 }, "salary" =&gt; { "$lte" =&gt; 100000 } }</code>'},
     {"python": "Работает только второе условие: в словаре остаётся последняя пара",
      "ruby": "Работает только второе условие: в хеше остаётся последняя пара, Ruby предупреждает о повторе"},
     ("f", {"$gte": 70000, "$lte": 100000})),
    ("Конец периода задан <code>$lte</code> с датой без времени",
     "Теряются события последнего дня: дата без времени — это полночь",
     "<code>$lt</code> с началом следующего дня"),
    (("f", {"ready_to_move": {"$ne": True}}), "Кроме <code>false</code> находит документы, где поля нет",
     "Если нужны только <code>false</code> — равенство <code>false</code>; отсутствующее поле — глава 2.5"),
]

CHEATS["2.2"] = [
    ("Больше или равно", ("f", {"employees": {"$gte": 500}})),
    ("Диапазон", ("f", {"salary": {"$gte": 70000, "$lte": 100000}})),
    ("Вложенное поле", ("f", {"salary.from": {"$gte": 100000}})),
    ("Период дат", {"python": ['{"when": {"$gte": datetime(2026, 9, 21),', '          "$lt": datetime(2026, 9, 28)}}'],
                    "cpp": ['kvp("when", make_document(', '  kvp("$gte", sep21), kvp("$lt", sep28)))'],
                    "go": ['{Key: "when", Value: bson.D{', '  {Key: "$gte", Value: sep21},', '  {Key: "$lt", Value: sep28}}}'],
                    "ruby": ['{ "when" => { "$gte" => Time.utc(2026, 9, 21),', '             "$lt" => Time.utc(2026, 9, 28) } }']}),
    ("Не равно", ("f", {"ready_to_move": {"$ne": True}})),
    ("Значение как есть", ("f", {"fio": {"$eq": "Анна Белова"}})),
]

# ── 2.3 Списки значений ────────────────────────────────────────────────────

EXAMPLES["2.3"] = {
    # 4: v-004 Казань, v-007, v-003, v-008 Москва
    "in": {"caption": "вакансии в Москве или Казани", "steps": [
        {"coll": "vacancies", "filter": {"city": {"$in": ["Москва", "Казань"]}}, "fields": ["title", "city"]},
    ]},
    # v-001, затем v-008 — порядок коллекции, а не списка
    "order": {"caption": "вакансии по списку ключей", "steps": [
        {"coll": "vacancies", "filter": {"_id": {"$in": ["v-008", "v-001"]}}, "fields": ["title"], "keep_id": True},
    ]},
    # 4: Дроздова, Валиев, Ефремов, Пирогова
    "array": {"caption": "хотя бы один навык из списка", "steps": [
        {"coll": "resumes", "filter": {"skills": {"$in": ["MongoDB", "ClickHouse"]}}, "fields": ["fio", "skills"]},
    ]},
    # 2; Самойлов, Нечаева, Валиев
    "nin": {"caption": "ни одного значения из списка", "steps": [
        {"rows": [
            {"label": "вакансии не в Москве и не в Ярославле", "coll": "vacancies",
             "filter": {"city": {"$nin": ["Москва", "Ярославль"]}}, "go": "gorod"},
        ]},
        {"coll": "resumes", "filter": {"skills": {"$nin": ["Python", "SQL"]}}, "fields": ["fio", "skills"]},
    ]},
    # 5 и 4; у Анны Беловой нет education
    "missing": {"caption": "$nin и отсутствующее поле", "steps": [
        {"rows": [
            {"label": "education.level $nin [СПО]", "coll": "resumes",
             "filter": {"education.level": {"$nin": ["СПО"]}}, "go": "neSpo"},
            {"label": "education.level Высшее", "coll": "resumes",
             "filter": {"education.level": "Высшее"}, "go": "vysshee"},
        ]},
        {"coll": "resumes", "filter": {"education.level": {"$nin": ["СПО"]}}, "fields": ["fio", "education.level"]},
    ]},
    # 1 и 5
    "null": {"caption": "null в списке значений", "steps": [
        {"rows": [
            {"label": "ready_to_move null", "coll": "resumes", "filter": {"ready_to_move": None}, "go": "pusto"},
            {"label": "ready_to_move $in [false, null]", "coll": "resumes",
             "filter": {"ready_to_move": {"$in": [False, None]}}, "go": "netIliPusto"},
        ]},
    ]},
    # 0 и 8
    "empty": {"caption": "пустой список", "steps": [
        {"rows": [
            {"label": "$in []", "coll": "vacancies", "filter": {"city": {"$in": []}}, "go": "vSpiske"},
            {"label": "$nin []", "coll": "vacancies", "filter": {"city": {"$nin": []}}, "go": "neVSpiske"},
        ]},
    ]},
}

ERRORS["2.3"] = [
    (("f", {"city": {"$in": "Москва"}}), "Ошибка сервера: <code>$in needs an array</code>",
     ("f", {"$in": ["Москва"]})),
    (("f", {"skills": ["Python", "SQL"]}), "Пусто: массив в фильтре сравнивается с полем целиком, вместе с порядком элементов",
     ("f", {"$in": ["Python", "SQL"]})),
    (("f", {"education.level": {"$nin": ["СПО"]}}), "Кроме «Высшее» находит документ, в котором поля нет",
     "Равенство <code>\"Высшее\"</code>; отсутствующее поле — глава 2.5"),
    ("Результат ожидается в порядке списка <code>$in</code>", "Документы идут в порядке коллекции",
     "<code>sort</code> или упорядочить в программе"),
    ("Список для <code>$in</code> собран из формы, и пользователь ничего не выбрал",
     "<code>$in</code> с пустым списком не находит ничего, <code>$nin</code> — находит всё",
     "Проверить пустой выбор до запроса и не добавлять условие"),
]

CHEATS["2.3"] = [
    ("Одно из значений", ("f", {"city": {"$in": ["Москва", "Казань"]}})),
    ("По списку ключей", ("f", {"_id": {"$in": ["v-001", "v-008"]}})),
    ("Хотя бы один элемент массива", ("f", {"skills": {"$in": ["MongoDB", "ClickHouse"]}})),
    ("Ни одно из значений", ("f", {"city": {"$nin": ["Москва", "Ярославль"]}})),
    ("Значение или нет поля", ("f", {"ready_to_move": {"$in": [False, None]}})),
]

# ── 2.4 Логика ─────────────────────────────────────────────────────────────

YAR_OR_MOVE = {"$or": [{"city": "Ярославль"}, {"ready_to_move": True}]}
SKILLED = {"$or": [{"education.level": "Высшее"}, {"experience.months": {"$gte": 10}}]}

EXAMPLES["2.4"] = {
    # 5, 4, 8; Лапина подходит по обоим условиям и входит один раз
    "or": {"caption": "из Ярославля или готов к переезду", "steps": [
        {"rows": [
            {"label": "из Ярославля", "coll": "resumes", "filter": {"city": "Ярославль"}, "go": "yar"},
            {"label": "готов к переезду", "coll": "resumes", "filter": {"ready_to_move": True}, "go": "pereezd"},
            {"label": "одно из двух ($or)", "coll": "resumes", "filter": YAR_OR_MOVE, "go": "ili"},
        ]},
        {"coll": "resumes", "filter": YAR_OR_MOVE, "fields": ["fio", "city", "ready_to_move"]},
    ]},
    # 4 и 4
    "or_in": {"caption": "$or на одном поле и $in", "steps": [
        {"rows": [
            {"label": "$or", "coll": "vacancies",
             "filter": {"$or": [{"city": "Москва"}, {"city": "Казань"}]}, "go": "cherezOr"},
            {"label": "$in", "coll": "vacancies", "filter": {"city": {"$in": ["Москва", "Казань"]}}, "go": "cherezIn"},
        ]},
    ]},
    # 5: Белова, Ковалёв, Нечаева, Лапина, Ефремов
    "and_or": {"caption": "условие на зарплату и «или»", "steps": [
        {"coll": "resumes", "var": True,
         "filter": {"salary": {"$lte": 90000}, **YAR_OR_MOVE},
         "fields": ["fio", "salary", "city", "ready_to_move"]},
    ]},
    # 8, 5, 4: Дроздова, Самойлов, Ефремов, Пирогова
    "two_or": {"caption": "два условия «или» сразу", "steps": [
        {"define": [("dostupen", YAR_OR_MOVE), ("kvalif", SKILLED)]},
        {"rows": [
            {"label": "доступен для Ярославля", "coll": "resumes", "filter": Ref("dostupen"), "go": "nDostupen"},
            {"label": "есть квалификация", "coll": "resumes", "filter": Ref("kvalif"), "go": "nKvalif"},
        ]},
        {"coll": "resumes", "filter": {"$and": [Ref("dostupen"), Ref("kvalif")]}, "fields": ["fio"]},
    ]},
    # 4 и 3; у Анны Беловой нет updated
    "not": {"caption": "отрицание условия", "steps": [
        {"rows": [
            {"label": "$not $gte 01.09", "coll": "resumes",
             "filter": {"updated": {"$not": {"$gte": datetime(2026, 9, 1)}}}, "go": "neSentyabr"},
            {"label": "$lt 01.09", "coll": "resumes",
             "filter": {"updated": {"$lt": datetime(2026, 9, 1)}}, "go": "doSentyabrya"},
        ]},
        {"coll": "resumes", "filter": {"updated": {"$not": {"$gte": datetime(2026, 9, 1)}}}, "fields": ["fio", "updated"]},
    ]},
    # 5: Белова, Ковалёв, Самойлов, Валиев, Пирогова
    "nor": {"caption": "ни одно из условий", "steps": [
        {"coll": "resumes", "var": True,
         "filter": {"$nor": [{"city": "Москва"}, {"ready_to_move": True}]},
         "fields": ["fio", "city", "ready_to_move"]},
    ]},
}

ERRORS["2.4"] = [
    ({"python": '<code>{"$or": [...], "$or": [...]}</code>', "ruby": '<code>{ "$or" =&gt; [...], "$or" =&gt; [...] }</code>'},
     {"python": "Работает только второе «или»: в словаре остаётся последняя пара",
      "ruby": "Работает только второе «или»: в хеше остаётся последняя пара"},
     {"python": '<code>{"$and": [{"$or": [...]}, {"$or": [...]}]}</code>',
      "ruby": '<code>{ "$and" =&gt; [{ "$or" =&gt; [...] }, { "$or" =&gt; [...] }] }</code>'}),
    (("f", {"city": {"$not": "Москва"}}), "Ошибка сервера: <code>$not needs a regex or a document</code>",
     ("f", {"$ne": "Москва"})),
    (("f", {"$or": {"city": "Москва"}}), "Ошибка сервера: <code>$or must be an array</code>",
     ("f", {"$or": [{"city": "Москва"}]})),
    ("Список для <code>$or</code> собран из формы и оказался пустым",
     "Ошибка сервера: <code>$and/$or/$nor must be a nonempty array</code>",
     "Проверить пустой список до запроса и не добавлять условие"),
    (("f", {"$or": [{"city": "Москва"}, {"city": "Казань"}]}), "Работает, но условие на одно поле длиннее, чем нужно",
     ("f", {"city": {"$in": ["Москва", "Казань"]}})),
    (("f", {"updated": {"$not": {"$gte": datetime(2026, 9, 1)}}}), "Кроме более ранних дат находит документы без поля",
     "Если нужны только ранние даты — <code>$lt</code>"),
]

CHEATS["2.4"] = [
    ("Хотя бы одно условие", ("f", YAR_OR_MOVE)),
    ("«И» вместе с «или»", ("f", {"salary": {"$lte": 90000}, "$or": [{"city": "Ярославль"}, {"city": "Казань"}]})),
    ("Два «или» сразу", {"python": ['{"$and": [{"$or": [...]},', '          {"$or": [...]}]}'],
                         "ruby": ['{ "$and" => [{ "$or" => [...] },', '              { "$or" => [...] }] }'],
                         "go": ['bson.D{{Key: "$and", Value: bson.A{', '  bson.D{{Key: "$or", Value: ...}},', '  bson.D{{Key: "$or", Value: ...}}}}}'],
                         "cpp": ['make_document(kvp("$and", make_array(', '  make_document(kvp("$or", ...)),', '  make_document(kvp("$or", ...)))))']}),
    ("Отрицание условия", ("f", {"salary": {"$not": {"$gte": 100000}}})),
    ("Ни одно из условий", ("f", {"$nor": [{"city": "Москва"}, {"ready_to_move": True}]})),
]
