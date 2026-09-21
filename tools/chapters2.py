"""Примеры, таблицы ошибок и шпаргалки глав модуля 2 — исходник для snippets.py.

Фильтры записаны литералами Python: из них snippets.py собирает код на
четырёх языках. Числа в комментариях — то, что даёт стенд; сам вывод в книгу
подставляет examples.py apply.
"""

from datetime import datetime

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
