"""Примеры глав модуля 1: заготовки для студентов и прогон на стенде.

Каждая глава работает по одному правилу: базы в исходном состоянии,
заготовка главы сверху, примеры вставляются по одному и запускаются
по порядку. Этот скрипт делает ровно то же самое на всех четырёх языках —
поэтому выводы в книге совпадают с тем, что увидит студент.

    python3 tools/examples.py starters                 # заготовки в mongodb-practice/lessons
    python3 tools/examples.py run python 1.3 1.7       # прогон выбранных глав
    python3 tools/examples.py run all                  # все главы, все языки
    python3 tools/examples.py report                   # сравнить с выводами в книге

Результаты прогона лежат в tools/examples-results/<язык>.json.
"""

import html
import json
import pathlib
import re
import subprocess
import sys

BOOK = pathlib.Path(__file__).resolve().parent.parent
PRACTICE = pathlib.Path("/Users/makarovmn/mongodb-practice")
RESULTS = BOOK / "tools" / "examples-results"          # по файлу на язык: прогоны идут параллельно
LANGS = ["python", "cpp", "go", "ruby"]
EXT = {"python": "py", "cpp": "cpp", "go": "go", "ruby": "rb"}

CHAPTERS = {
    "1.1": ("01-klient-baza-kollekciya", "Сервер, база, коллекция", False),
    "1.2": ("02-dokument-i-bson", "Документ и BSON", True),
    "1.3": ("03-vstavka", "Вставка: insert_one и insert_many", True),
    "1.4": ("04-find-i-kursor", "Чтение: find, find_one и курсор", False),
    "1.5": ("05-proekciya", "Проекция: какие поля вернуть", False),
    "1.6": ("06-sort-limit-skip", "Порядок и порции: sort, limit, skip", False),
    "1.7": ("07-obnovlenie", "Обновление: $set, $inc, $unset", True),
    "1.8": ("08-udalenie", "Удаление", True),
    "1.9": ("17-skript-otchet", "Скрипт целиком: отчёт по магазину", True),
    "2.1": ("09-filtr-i-tochechnaya-notaciya", "Фильтр — это документ. Точечная нотация", False),
    "2.2": ("10-sravnenie", "Сравнение: $eq $ne $gt $gte $lt $lte", False),
    "2.3": ("11-spiski-in-nin", "Списки значений: $in и $nin", False),
    "2.4": ("12-logika", "Логика: $and $or $not $nor", False),
    "2.5": ("13-exists-type", "Есть ли поле: $exists и $type", True),
    "2.6": ("14-massivy", "Массивы: $all, $elemMatch, $size", False),
    "2.7": ("15-regex", "Текстовые шаблоны: $regex и $options", False),
    "2.8": ("16-expr", "Сравнение полей между собой: $expr", True),
    "2.9": ("18-skript-podbor", "Скрипт целиком: подбор кандидатов", False),
    "3.1": ("19-jsonschema", "Правила на уровне базы: $jsonSchema", True),
    "3.2": ("20-indeksy", "Индексы: одиночные, составные, уникальные", True),
    "3.3": ("21-explain", "Как читать explain: COLLSCAN против IXSCAN", True),
}

# Пример, который продолжает предыдущие: запускается одной программой вместе с ними.
# Сами предыдущие в этом случае отдельно не запускаются, если помечены в MERGED.
CONTINUES = {
    ("1.1", 3): [1],        # осмотр сервера идёт после подключения из §4
    ("1.3", 3): [2],        # разбор результата вставки — сразу под вставкой
}
MERGED = {("1.3", 2)}

# Иллюстрации «так делают / так не делают»: только проверяем, что код собирается.
COMPILE_ONLY = {("1.1", 4), ("1.1", 5)}

# Главы, где пример — целая программа со своим подключением: заготовка не нужна,
# код запускается как есть. Такие главы завершают модуль разбором готового скрипта.
WHOLE = {"1.9", "2.9"}


# ── Заготовки ─────────────────────────────────────────────────────────────

def base(chapter: str, lang: str) -> tuple[str, str, str]:
    """Возвращает (шапка с импортами, код подключения, хвост) для языка."""
    key, title, writes = CHAPTERS[chapter]
    name = f"ch{chapter.replace('.', '_')}"
    state = ("Перед главой верните базы в исходное состояние (глава 1.0, §8)."
             if writes else "Глава только читает данные — сбрасывать базы не нужно.")
    if lang == "python":
        head = f'''"""Глава {chapter} · {title} — заготовка для примеров.

{state}
Пример из главы вставьте под чертой вместо проверочных строк и запустите:

    cd lessons
    python {name}.py          # Windows
    python3 {name}.py         # macOS и Linux

Следующий пример вставляйте вместо предыдущего: каждый пример запускается
один раз и по порядку — именно так получены выводы в справочнике.
"""

import os
from pymongo import MongoClient

client = MongoClient(os.environ.get("MONGO_URI", "mongodb://localhost:27017/"))
{scope(chapter, lang)}
'''
        return head, "", "\n# ── пример из главы ───────────────────────────────────────────\n"
    if lang == "ruby":
        head = f'''# Глава {chapter} · {title} — заготовка для примеров.
#
# {state}
# Пример из главы вставьте под чертой вместо проверочных строк и запустите:
#
#     cd lessons
#     ruby {name}.rb
#
# Следующий пример вставляйте вместо предыдущего: каждый пример запускается
# один раз и по порядку — именно так получены выводы в справочнике.

require "mongo"

Mongo::Logger.logger.level = Logger::WARN

client = Mongo::Client.new(ENV.fetch("MONGO_URI", "mongodb://localhost:27017/"))
{scope(chapter, lang)}
'''
        return head, "", "\n# ── пример из главы ───────────────────────────────────────────\n"
    if lang == "go":
        head = f'''// Глава {chapter} · {title} — заготовка для примеров.
//
// {state}
// Пример из главы вставьте в фигурные скобки в конце main вместо проверочных строк
// и запустите:
//
//	cd lessons
//	go run {name}.go
//
// Если пример начинается с func или type, его место — над main, у отметки.
// Следующий пример вставляйте вместо предыдущего: каждый пример запускается
// один раз и по порядку — именно так получены выводы в справочнике.
package main

import (
@@IMPORTS@@
)

// Импорты нужны разным примерам главы. Строки ниже не дают Go ругаться
// на те, которыми текущий пример не пользуется.
@@BLANKS@@

// ── функции и типы из примеров главы ─────────────────────────────

@@TOP@@
func main() {{
	uri := os.Getenv("MONGO_URI")
	if uri == "" {{
		uri = "mongodb://localhost:27017"
	}}
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {{
		log.Fatal(err)
	}}
	ctx := context.Background()
	defer client.Disconnect(ctx)

{scope(chapter, lang)}
'''
        tail = '''
	{
		// ── пример из главы ──────────────────────────────────────
@@BODY@@
	}
}
'''
        return head, "", tail
    if lang == "cpp":
        head = f'''// Глава {chapter} · {title} — заготовка для примеров.
//
// {state}
// Пример из главы вставьте в фигурные скобки в конце main вместо проверочных строк
// и запустите:
//
//     cd lessons
//     g++ -std=c++17 {name}.cpp -o {name} $(pkg-config --cflags --libs libmongocxx1) && ./{name}   # macOS, Homebrew
//     docker compose run --rm cpp lessons/{name}.cpp       # то же в контейнере
//
// Если пример — целая функция, его место — над main, у отметки.
// Следующий пример вставляйте вместо предыдущего: каждый пример запускается
// один раз и по порядку — именно так получены выводы в справочнике.

#include <chrono>
#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <optional>
#include <sstream>
#include <string>
#include <vector>

#include <bsoncxx/builder/basic/array.hpp>
#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/kvp.hpp>
#include <bsoncxx/json.hpp>
#include <bsoncxx/types.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/exception/bulk_write_exception.hpp>
#include <mongocxx/exception/operation_exception.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/options/find.hpp>
#include <mongocxx/options/insert.hpp>
#include <mongocxx/options/update.hpp>
#include <mongocxx/uri.hpp>

using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::basic::make_array;
using bsoncxx::builder::basic::make_document;

// ── функции из примеров главы ─────────────────────────────────────

@@TOP@@
int main() {{
    mongocxx::instance instance{{}};
    const char* env = std::getenv("MONGO_URI");
    mongocxx::client client{{mongocxx::uri{{env ? env : "mongodb://localhost:27017"}}}};

{scope(chapter, lang)}
'''
        tail = '''
    {
        // ── пример из главы ──────────────────────────────────────
@@BODY@@
    }
}
'''
        return head, "", tail
    raise ValueError(lang)


# С какими коллекциями глава работает. Модуль 1 живёт на shop, модуль 2 — на hh,
# модуль 3 — на shop и журнале logs.
# Песочница box есть в любой главе: в неё пишут, когда пример меняет данные.
SCOPE = {
    "1": {
        "python": 'db = client["shop"]\nproducts = db["products"]\norders = db["orders"]\nbox = client["sandbox"]["products"]        # песочница: здесь можно менять',
        "ruby": 'db = client.use("shop").database\nproducts = db[:products]\norders = db[:orders]\nbox = client.use("sandbox").database[:products]   # песочница: здесь можно менять',
        "go": '\tdb := client.Database("shop")\n\tproducts := db.Collection("products")\n\torders := db.Collection("orders")\n\tbox := client.Database("sandbox").Collection("products") // песочница: здесь можно менять',
        "cpp": '    auto db = client["shop"];\n    auto products = db["products"];\n    auto orders = db["orders"];\n    auto box = client["sandbox"]["products"];   // песочница: здесь можно менять',
    },
    "2": {
        "python": 'db = client["hh"]\nresumes = db["resumes"]\nvacancies = db["vacancies"]\ncompanies = db["companies"]\ninterviews = db["interviews"]\nbox = client["sandbox"]["products"]        # песочница: здесь можно менять',
        "ruby": 'db = client.use("hh").database\nresumes = db[:resumes]\nvacancies = db[:vacancies]\ncompanies = db[:companies]\ninterviews = db[:interviews]\nbox = client.use("sandbox").database[:products]   # песочница: здесь можно менять',
        "go": '\tdb := client.Database("hh")\n\tresumes := db.Collection("resumes")\n\tvacancies := db.Collection("vacancies")\n\tcompanies := db.Collection("companies")\n\tinterviews := db.Collection("interviews")\n\tbox := client.Database("sandbox").Collection("products") // песочница: здесь можно менять',
        "cpp": '    auto db = client["hh"];\n    auto resumes = db["resumes"];\n    auto vacancies = db["vacancies"];\n    auto companies = db["companies"];\n    auto interviews = db["interviews"];\n    auto box = client["sandbox"]["products"];   // песочница: здесь можно менять',
    },
    "3": {
        "python": 'db = client["shop"]\nproducts = db["products"]\norders = db["orders"]\nevents = client["logs"]["events"]\nsandbox = client["sandbox"]\nbox = sandbox["products"]        # песочница: здесь можно менять',
        "ruby": 'db = client.use("shop").database\nproducts = db[:products]\norders = db[:orders]\nevents = client.use("logs").database[:events]\nsandbox = client.use("sandbox").database\nbox = sandbox[:products]   # песочница: здесь можно менять',
        "go": '\tdb := client.Database("shop")\n\tproducts := db.Collection("products")\n\torders := db.Collection("orders")\n\tevents := client.Database("logs").Collection("events")\n\tsandbox := client.Database("sandbox")\n\tbox := sandbox.Collection("products") // песочница: здесь можно менять',
        "cpp": '    auto db = client["shop"];\n    auto products = db["products"];\n    auto orders = db["orders"];\n    auto events = client["logs"]["events"];\n    auto sandbox = client["sandbox"];\n    auto box = sandbox["products"];   // песочница: здесь можно менять',
    },
}


def scope(chapter: str, lang: str) -> str:
    """Строки заготовки, которые открывают коллекции нужной главе."""
    return SCOPE[chapter.split(".")[0]][lang]


# Что глава добавляет к общей заготовке: данные, которых нет в базах курса.
EXTRAS = {
    ("1.6", "python"): '''
# Коллекция на 20 000 документов для замера в §6. Создаётся один раз.
col = client["sandbox"]["bench"]
if col.count_documents({}) == 0:
    col.insert_many({"_id": n} for n in range(20000))
last_seen_id = 19989                        # последний _id предыдущей страницы
''',
    ("1.6", "ruby"): '''
# Коллекция на 20 000 документов для замера в §6. Создаётся один раз.
col = client.use("sandbox").database[:bench]
col.insert_many((0...20000).map { |n| { "_id" => n } }) if col.count_documents({}).zero?
last_seen_id = 19989                        # последний _id предыдущей страницы
''',
    ("1.6", "go"): '''
	// Коллекция на 20 000 документов для замера в §6. Создаётся один раз.
	col := client.Database("sandbox").Collection("bench")
	if n, _ := col.CountDocuments(ctx, bson.D{}); n == 0 {
		docs := make([]any, 0, 20000)
		for i := 0; i < 20000; i++ {
			docs = append(docs, bson.D{{Key: "_id", Value: i}})
		}
		col.InsertMany(ctx, docs)
	}
	lastSeenID := 19989 // последний _id предыдущей страницы
''',
    ("1.6", "cpp"): '''
    // Коллекция на 20 000 документов для замера в §6. Создаётся один раз.
    auto col = client["sandbox"]["bench"];
    if (col.count_documents(make_document()) == 0) {
        std::vector<bsoncxx::document::value> docs;
        for (int n = 0; n < 20000; ++n) docs.push_back(make_document(kvp("_id", n)));
        col.insert_many(docs);
    }
    int last_seen_id = 19989;   // последний _id предыдущей страницы
''',
    ("1.7", "python"): '''
# Товары, которые добавлялись в песочницу в главе 1.3. Если песочницу
# сбрасывали, заготовка добавит их снова — обновлять будет что.
if box.count_documents({"_id": "p-101"}) == 0:
    box.insert_many([
        {"_id": "p-101", "title": "Подставка для ноутбука", "category": "аксессуары", "price": 2490},
        {"_id": "p-102", "title": "Чехол для планшета", "category": "аксессуары", "price": 1890},
        {"sku": "SKU-AC-022", "title": "Коврик для мыши XL", "brand": "OEM",
         "category": "аксессуары", "price": 1290},
    ])

orders_box = client["sandbox"]["orders"]      # копия заказов: их можно менять
if orders_box.count_documents({}) == 0:
    orders_box.insert_many(orders.find())

stats = client["sandbox"]["product_stats"]    # счётчики просмотров для §6
stats.drop()                                  # каждый запуск заготовки считает с нуля
from datetime import date
today = date.today().isoformat()
''',
    ("1.7", "ruby"): '''
# Товары, которые добавлялись в песочницу в главе 1.3. Если песочницу
# сбрасывали, заготовка добавит их снова — обновлять будет что.
if box.count_documents({ "_id" => "p-101" }).zero?
  box.insert_many([
    { "_id" => "p-101", "title" => "Подставка для ноутбука", "category" => "аксессуары", "price" => 2490 },
    { "_id" => "p-102", "title" => "Чехол для планшета", "category" => "аксессуары", "price" => 1890 },
    { "sku" => "SKU-AC-022", "title" => "Коврик для мыши XL", "brand" => "OEM",
      "category" => "аксессуары", "price" => 1290 },
  ])
end

orders_box = client.use("sandbox").database[:orders]   # копия заказов: их можно менять
orders_box.insert_many(orders.find.to_a) if orders_box.count_documents({}).zero?

stats = client.use("sandbox").database[:product_stats] # счётчики просмотров для §6
stats.drop                                             # каждый запуск заготовки считает с нуля
require "date"
today = Date.today.iso8601
''',
    ("1.7", "go"): '''
	// Товары, которые добавлялись в песочницу в главе 1.3. Если песочницу
	// сбрасывали, заготовка добавит их снова — обновлять будет что.
	if n, _ := box.CountDocuments(ctx, bson.D{{Key: "_id", Value: "p-101"}}); n == 0 {
		box.InsertMany(ctx, []any{
			bson.D{{Key: "_id", Value: "p-101"}, {Key: "title", Value: "Подставка для ноутбука"}, {Key: "category", Value: "аксессуары"}, {Key: "price", Value: 2490}},
			bson.D{{Key: "_id", Value: "p-102"}, {Key: "title", Value: "Чехол для планшета"}, {Key: "category", Value: "аксессуары"}, {Key: "price", Value: 1890}},
			bson.D{{Key: "sku", Value: "SKU-AC-022"}, {Key: "title", Value: "Коврик для мыши XL"}, {Key: "brand", Value: "OEM"}, {Key: "category", Value: "аксессуары"}, {Key: "price", Value: 1290}},
		})
	}

	ordersBox := client.Database("sandbox").Collection("orders") // копия заказов: их можно менять
	if n, _ := ordersBox.CountDocuments(ctx, bson.D{}); n == 0 {
		var all []bson.D
		cursor, _ := orders.Find(ctx, bson.D{})
		cursor.All(ctx, &all)
		docs := make([]any, len(all))
		for i := range all {
			docs[i] = all[i]
		}
		ordersBox.InsertMany(ctx, docs)
	}

	stats := client.Database("sandbox").Collection("product_stats") // счётчики просмотров для §6
	stats.Drop(ctx)                                                 // каждый запуск заготовки считает с нуля
	today := time.Now().Format("2006-01-02")
''',
    ("1.7", "cpp"): '''
    // Товары, которые добавлялись в песочницу в главе 1.3. Если песочницу
    // сбрасывали, заготовка добавит их снова — обновлять будет что.
    if (box.count_documents(make_document(kvp("_id", "p-101"))) == 0) {
        std::vector<bsoncxx::document::value> added;
        added.push_back(make_document(kvp("_id", "p-101"), kvp("title", "Подставка для ноутбука"),
                                      kvp("category", "аксессуары"), kvp("price", 2490)));
        added.push_back(make_document(kvp("_id", "p-102"), kvp("title", "Чехол для планшета"),
                                      kvp("category", "аксессуары"), kvp("price", 1890)));
        added.push_back(make_document(kvp("sku", "SKU-AC-022"), kvp("title", "Коврик для мыши XL"),
                                      kvp("brand", "OEM"), kvp("category", "аксессуары"), kvp("price", 1290)));
        box.insert_many(added);
    }

    auto orders_box = client["sandbox"]["orders"];   // копия заказов: их можно менять
    if (orders_box.count_documents(make_document()) == 0) {
        std::vector<bsoncxx::document::value> all;
        for (auto&& doc : orders.find(make_document())) all.emplace_back(doc);
        orders_box.insert_many(all);
    }

    auto stats = client["sandbox"]["product_stats"];   // счётчики просмотров для §6
    stats.drop();                                      // каждый запуск заготовки считает с нуля
    auto now = std::time(nullptr);
    std::ostringstream day;
    day << std::put_time(std::gmtime(&now), "%Y-%m-%d");
    std::string today = day.str();
''',
}

# Глава 3.1: правило товара объявлено в заготовке — его разбирает §2 главы,
# и им пользуются все примеры, начиная с первого.
EXTRAS[("3.1", "python")] = '''
catalog = sandbox["catalog"]                  # коллекция без правила, §1

# Правило товара (§2 главы): обязательные поля и типы значений.
schema = {
    "bsonType": "object",
    "required": ["sku", "title", "category", "price"],
    "properties": {
        "sku": {"bsonType": "string"},
        "title": {"bsonType": "string"},
        "category": {"bsonType": "string"},
        "price": {"bsonType": "number", "minimum": 1},
    },
}
'''
EXTRAS[("3.1", "ruby")] = '''
catalog = sandbox[:catalog]                   # коллекция без правила, §1

# Правило товара (§2 главы): обязательные поля и типы значений.
schema = {
  "bsonType" => "object",
  "required" => ["sku", "title", "category", "price"],
  "properties" => {
    "sku" => { "bsonType" => "string" },
    "title" => { "bsonType" => "string" },
    "category" => { "bsonType" => "string" },
    "price" => { "bsonType" => "number", "minimum" => 1 },
  },
}
'''
EXTRAS[("3.1", "go")] = '''
\tcatalog := sandbox.Collection("catalog") // коллекция без правила, §1

\t// Правило товара (§2 главы): обязательные поля и типы значений.
\tschema := bson.D{
\t\t{Key: "bsonType", Value: "object"},
\t\t{Key: "required", Value: bson.A{"sku", "title", "category", "price"}},
\t\t{Key: "properties", Value: bson.D{
\t\t\t{Key: "sku", Value: bson.D{{Key: "bsonType", Value: "string"}}},
\t\t\t{Key: "title", Value: bson.D{{Key: "bsonType", Value: "string"}}},
\t\t\t{Key: "category", Value: bson.D{{Key: "bsonType", Value: "string"}}},
\t\t\t{Key: "price", Value: bson.D{{Key: "bsonType", Value: "number"}, {Key: "minimum", Value: 1}}},
\t\t}},
\t}
'''
EXTRAS[("3.1", "cpp")] = '''
    auto catalog = sandbox["catalog"];   // коллекция без правила, §1

    // Правило товара (§2 главы): обязательные поля и типы значений.
    auto schema = make_document(
        kvp("bsonType", "object"),
        kvp("required", make_array("sku", "title", "category", "price")),
        kvp("properties", make_document(
            kvp("sku", make_document(kvp("bsonType", "string"))),
            kvp("title", make_document(kvp("bsonType", "string"))),
            kvp("category", make_document(kvp("bsonType", "string"))),
            kvp("price", make_document(kvp("bsonType", "number"), kvp("minimum", 1))))));
'''

# Глава 3.2: индексы строятся на копиях в песочнице — logs и shop остаются
# без новых индексов. Функция plan показывает стадии плана, который выбрал сервер.
EXTRAS[("3.2", "python")] = """
journal = sandbox["events"]       # копия журнала: на ней строятся индексы главы
clients = sandbox["customers"]    # копия покупателей: уникальный индекс, §5–§7


def plan(coll, filtr, sort=None):
    \"\"\"Стадии плана, который выбрал сервер, сверху вниз: FETCH → IXSCAN service_1.\"\"\"
    cursor = coll.find(filtr)
    if sort:
        cursor = cursor.sort(sort)
    stage = cursor.explain()["queryPlanner"]["winningPlan"]
    stage = stage.get("queryPlan", stage)     # MongoDB 7 кладёт план во вложенное поле
    steps = []
    while stage:
        steps.append(stage["stage"] + (" " + stage["indexName"] if "indexName" in stage else ""))
        stage = stage.get("inputStage")
    return " → ".join(steps)
"""
EXTRAS[("3.2", "ruby")] = """
journal = sandbox[:events]        # копия журнала: на ней строятся индексы главы
clients = sandbox[:customers]     # копия покупателей: уникальный индекс, §5–§7

# Стадии плана, который выбрал сервер, сверху вниз: FETCH → IXSCAN service_1.
def plan(coll, filtr, sort = nil)
  view = coll.find(filtr)
  view = view.sort(sort) if sort
  stage = view.explain["queryPlanner"]["winningPlan"]
  stage = stage["queryPlan"] || stage     # MongoDB 7 кладёт план во вложенное поле
  steps = []
  while stage
    steps << stage["stage"] + (stage["indexName"] ? " " + stage["indexName"] : "")
    stage = stage["inputStage"]
  end
  steps.join(" → ")
end
"""
EXTRAS[("3.2", "go")] = """
\tjournal := sandbox.Collection("events")    // копия журнала: на ней строятся индексы главы
\tclients := sandbox.Collection("customers") // копия покупателей: уникальный индекс, §5–§7
"""
EXTRAS[("3.2", "cpp")] = """
    auto journal = sandbox["events"];      // копия журнала: на ней строятся индексы главы
    auto clients = sandbox["customers"];   // копия покупателей: уникальный индекс, §5–§7
"""

# Глава 3.3: копия журнала и функция summary — план и счётчики explain одной строкой.
EXTRAS[("3.3", "python")] = """
journal = sandbox["events"]       # копия журнала: на ней строятся индексы главы


def summary(coll, **find):
    \"\"\"План и счётчики explain одной строкой: стадии | вернул | ключей | документов.\"\"\"
    info = coll.database.command("explain", {"find": coll.name, **find}, verbosity="executionStats")
    stage = info["queryPlanner"]["winningPlan"]
    stage = stage.get("queryPlan", stage)     # MongoDB 7 кладёт план во вложенное поле
    steps = []
    while stage:
        steps.append(stage["stage"] + (" " + stage["indexName"] if "indexName" in stage else ""))
        stage = stage.get("inputStage")
    stats = info["executionStats"]
    return (" → ".join(steps) + f" | вернул {stats['nReturned']}"
            + f" | ключей {stats['totalKeysExamined']} | документов {stats['totalDocsExamined']}")
"""
EXTRAS[("3.3", "ruby")] = """
journal = sandbox[:events]        # копия журнала: на ней строятся индексы главы

# План и счётчики explain одной строкой: стадии | вернул | ключей | документов.
def summary(coll, find)
  info = coll.database.command(explain: { find: coll.name }.merge(find), verbosity: "executionStats").first
  stage = info["queryPlanner"]["winningPlan"]
  stage = stage["queryPlan"] || stage     # MongoDB 7 кладёт план во вложенное поле
  steps = []
  while stage
    steps << stage["stage"] + (stage["indexName"] ? " " + stage["indexName"] : "")
    stage = stage["inputStage"]
  end
  stats = info["executionStats"]
  steps.join(" → ") + " | вернул #{stats["nReturned"]}" +
    " | ключей #{stats["totalKeysExamined"]} | документов #{stats["totalDocsExamined"]}"
end
"""
EXTRAS[("3.3", "go")] = """
\tjournal := sandbox.Collection("events") // копия журнала: на ней строятся индексы главы
"""
EXTRAS[("3.3", "cpp")] = """
    auto journal = sandbox["events"];      // копия журнала: на ней строятся индексы главы
"""

GO_IMPORTS = ["context", "errors", "fmt", "log", "os", "sort", "strings", "time"]
GO_MONGO = {
    "bson": '"go.mongodb.org/mongo-driver/v2/bson"',
    "mongo": '"go.mongodb.org/mongo-driver/v2/mongo"',
    "options": '"go.mongodb.org/mongo-driver/v2/mongo/options"',
}
GO_BLANK = {
    "errors": "var _ = errors.New", "fmt": "var _ = fmt.Sprint", "sort": "var _ = sort.Strings",
    "strings": "var _ = strings.Join", "time": "var _ = time.Now", "bson": "var _ = bson.D{}",
    "mongo": "var _ = mongo.ErrNoDocuments", "options": "var _ = options.Find",
}
TOP_LEVEL = {
    "go": re.compile(r"^(func |type |var \w+ \*?mongo\.|import \()", re.M),
    "cpp": re.compile(r"^(auto \w+\(|\w[\w:<>]* \w+\([^;]*\)\s*\{|#include|struct |mongocxx::instance instance\{\};\s*$)", re.M),
}


def go_imports(snippets: list[str]) -> tuple[str, str]:
    used = set(GO_IMPORTS) & {"context", "log", "os", "fmt"}
    for code in snippets:
        used |= {pkg for pkg in GO_IMPORTS if re.search(r"\b%s\." % pkg, code)}
    used |= {"time"} if any("time." in c for c in snippets) else set()
    std = [f'\t"{p}"' for p in GO_IMPORTS if p in used]
    lines = std + [""] + [f"\t{GO_MONGO[k]}" for k in ("bson", "mongo", "options")]
    blanks = [GO_BLANK[p] for p in sorted(used) if p in GO_BLANK] + [GO_BLANK[k] for k in ("bson", "mongo")]
    return "\n".join(lines), "\n".join(blanks)


GO_PRODUCT = '''// Product — поля товара, которые читают примеры. Тип объявлен в главе 1.4.
type Product struct {
	ID       string `bson:"_id"`
	SKU      string `bson:"sku"`
	Title    string `bson:"title"`
	Category string `bson:"category"`
	Price    int    `bson:"price"`
}
'''
TOP_EXTRAS = {("1.4", "go"): GO_PRODUCT, ("1.5", "go"): GO_PRODUCT, ("1.6", "go"): GO_PRODUCT,
              ("1.7", "go"): GO_PRODUCT, ("1.8", "go"): GO_PRODUCT}

TOP_EXTRAS[("3.3", "go")] = """// summary — план и счётчики explain одной строкой: стадии | вернул | ключей | документов.
func summary(coll *mongo.Collection, find bson.D) string {
\tcmd := append(bson.D{{Key: "find", Value: coll.Name()}}, find...)
\tvar res bson.Raw
\tcoll.Database().RunCommand(context.Background(),
\t\tbson.D{{Key: "explain", Value: cmd}, {Key: "verbosity", Value: "executionStats"}}).Decode(&res)
\tstage := res.Lookup("queryPlanner", "winningPlan").Document()
\tif inner, ok := stage.Lookup("queryPlan").DocumentOK(); ok { // MongoDB 7 кладёт план во вложенное поле
\t\tstage = inner
\t}
\tsteps := []string{}
\tfor {
\t\tstep := stage.Lookup("stage").StringValue()
\t\tif name, ok := stage.Lookup("indexName").StringValueOK(); ok {
\t\t\tstep += " " + name
\t\t}
\t\tsteps = append(steps, step)
\t\tnext, ok := stage.Lookup("inputStage").DocumentOK()
\t\tif !ok {
\t\t\tbreak
\t\t}
\t\tstage = next
\t}
\tstats := res.Lookup("executionStats").Document()
\treturn fmt.Sprintf("%s | вернул %d | ключей %d | документов %d", strings.Join(steps, " → "),
\t\tstats.Lookup("nReturned").AsInt64(), stats.Lookup("totalKeysExamined").AsInt64(),
\t\tstats.Lookup("totalDocsExamined").AsInt64())
}
"""
TOP_EXTRAS[("3.3", "cpp")] = """// summary — план и счётчики explain одной строкой: стадии | вернул | ключей | документов.
std::string summary(mongocxx::database& db, const std::string& coll, bsoncxx::document::view find) {
    bsoncxx::builder::basic::document cmd;
    cmd.append(kvp("find", coll));
    for (auto&& field : find) cmd.append(kvp(field.key(), field.get_value()));
    auto res = db.run_command(make_document(kvp("explain", cmd.view()), kvp("verbosity", "executionStats")));
    auto stage = res.view()["queryPlanner"]["winningPlan"].get_document().value;
    if (stage["queryPlan"]) stage = stage["queryPlan"].get_document().value;   // MongoDB 7 кладёт план во вложенное поле
    std::string steps;
    while (true) {
        steps += std::string{stage["stage"].get_string().value};
        if (stage["indexName"]) steps += " " + std::string{stage["indexName"].get_string().value};
        if (!stage["inputStage"]) break;
        steps += " → ";
        stage = stage["inputStage"].get_document().value;
    }
    auto stats = res.view()["executionStats"].get_document().value;
    auto number = [&](const char* name) {
        auto value = stats[name];
        return std::to_string(value.type() == bsoncxx::type::k_int64 ? value.get_int64().value : value.get_int32().value);
    };
    return steps + " | вернул " + number("nReturned") + " | ключей " + number("totalKeysExamined")
         + " | документов " + number("totalDocsExamined");
}
"""

TOP_EXTRAS[("3.2", "go")] = """// plan — стадии плана, который выбрал сервер, сверху вниз: FETCH → IXSCAN service_1.
func plan(coll *mongo.Collection, filtr bson.D, sort bson.D) string {
\tcmd := bson.D{{Key: "find", Value: coll.Name()}, {Key: "filter", Value: filtr}}
\tif sort != nil {
\t\tcmd = append(cmd, bson.E{Key: "sort", Value: sort})
\t}
\tvar res bson.Raw
\tcoll.Database().RunCommand(context.Background(), bson.D{{Key: "explain", Value: cmd}}).Decode(&res)
\tstage := res.Lookup("queryPlanner", "winningPlan").Document()
\tif inner, ok := stage.Lookup("queryPlan").DocumentOK(); ok { // MongoDB 7 кладёт план во вложенное поле
\t\tstage = inner
\t}
\tsteps := []string{}
\tfor {
\t\tstep := stage.Lookup("stage").StringValue()
\t\tif name, ok := stage.Lookup("indexName").StringValueOK(); ok {
\t\t\tstep += " " + name
\t\t}
\t\tsteps = append(steps, step)
\t\tnext, ok := stage.Lookup("inputStage").DocumentOK()
\t\tif !ok {
\t\t\tbreak
\t\t}
\t\tstage = next
\t}
\treturn strings.Join(steps, " → ")
}
"""
TOP_EXTRAS[("3.2", "cpp")] = """// plan — стадии плана, который выбрал сервер, сверху вниз: FETCH → IXSCAN service_1.
std::string plan(mongocxx::database& db, const std::string& coll, bsoncxx::document::view filtr,
                 bsoncxx::document::view sort = bsoncxx::document::view{}) {
    bsoncxx::builder::basic::document cmd;
    cmd.append(kvp("find", coll), kvp("filter", filtr));
    if (!sort.empty()) cmd.append(kvp("sort", sort));
    auto res = db.run_command(make_document(kvp("explain", cmd.view())));
    auto stage = res.view()["queryPlanner"]["winningPlan"].get_document().value;
    if (stage["queryPlan"]) stage = stage["queryPlan"].get_document().value;   // MongoDB 7 кладёт план во вложенное поле
    std::string steps;
    while (true) {
        steps += std::string{stage["stage"].get_string().value};
        if (stage["indexName"]) steps += " " + std::string{stage["indexName"].get_string().value};
        if (!stage["inputStage"]) break;
        steps += " → ";
        stage = stage["inputStage"].get_document().value;
    }
    return steps;
}
"""


def starter(chapter: str, lang: str, snippets: list[str]) -> str:
    head, _, tail = base(chapter, lang)
    if (chapter, lang) in TOP_EXTRAS:
        head = head.replace("@@TOP@@", TOP_EXTRAS[(chapter, lang)] + "\n@@TOP@@")
    extra = EXTRAS.get((chapter, lang), "")
    if lang == "go":
        imports, blanks = go_imports(snippets + [extra, TOP_EXTRAS.get((chapter, lang), "")])
        head = head.replace("@@IMPORTS@@", imports).replace("@@BLANKS@@", blanks)
        # Гасим «declared and not used» по тем коллекциям, которые открыла заготовка.
        names = re.findall(r"^\t(\w+) :=", scope(chapter, lang), re.M)
        head += "\t" + ", ".join("_" for _ in names) + " = " + ", ".join(names) + "\n"
        used = [v for v in ("col", "lastSeenID", "ordersBox", "stats", "today", "catalog", "schema")
                if re.search(r"\b%s :=" % v, extra)]
        used += [v for v in ("journal", "clients") if re.search(r"\b%s :=" % v, extra)]
        if used:
            extra += "\t" + ", ".join("_" for _ in used) + " = " + ", ".join(used) + "\n"
    if lang == "cpp":
        pass
    return head + extra + tail


def fill(program: str, lang: str, parts: list[str]) -> str:
    """Подставить примеры в заготовку так же, как это сделает студент."""
    if lang in ("python", "ruby"):
        return program + "\n".join(parts) + "\n"
    top, body = [], []
    for code in parts:
        chunks = split_top(code, lang)
        top += chunks[0]
        body += chunks[1]
    indent = "\t\t" if lang == "go" else "        "
    text = "\n".join(body)
    body_text = "\n".join(indent + line if line.strip() else "" for line in text.splitlines())
    top_text = "\n".join(top)
    if lang == "cpp":
        includes = [l for l in top_text.splitlines() if l.startswith("#include")]
        top_text = "\n".join(l for l in top_text.splitlines() if not l.startswith("#include"))
        top_text = "\n".join(includes) + ("\n" if includes else "") + top_text
    if lang == "go":
        top_text = re.sub(r"(?ms)^import \(.*?^\)\n?", "", top_text)
    return program.replace("@@TOP@@", top_text + ("\n" if top_text else "")).replace("@@BODY@@", body_text)


def split_top(code: str, lang: str) -> tuple[list[str], list[str]]:
    """Отделить от примера то, что должно стоять вне main: функции, типы, include,
    глобальные объявления. Остальные строки идут в тело main."""
    starts = {
        "go": re.compile(r"^(func |type |var \w+ |import \()"),
        "cpp": re.compile(r"^(#include|struct |auto \w+\(|[A-Za-z_][\w:<>&*]* [\w&*]+\([^;]*$|[A-Za-z_][\w:<>&*]* [\w&*]+\(.*\)\s*\{\s*$|mongocxx::instance instance\{\};)"),
    }[lang]
    top, body, lines = [], [], code.splitlines()
    # глобальный клиент: коллекции, взятые из него, тоже объявлены вне main
    # глобальными клиент и коллекции бывают, только если и instance объявлен глобально
    global_client = lang == "cpp" and any(l.startswith("mongocxx::instance instance{}") for l in lines)
    i = 0
    while i < len(lines):
        line = lines[i]
        if starts.match(line) or (global_client and re.match(r"^(auto \w+ = client\[|mongocxx::client client\{)", line)):
            chunk = [line]
            # однострочное объявление или блок до закрывающей скобки в первой колонке
            if line.rstrip().endswith(("{", "(")) or (line.startswith("func ") and not line.rstrip().endswith("}")):
                i += 1
                while i < len(lines) and lines[i].rstrip() not in ("}", ")"):
                    chunk.append(lines[i]); i += 1
                if i < len(lines):
                    chunk.append(lines[i])
            # комментарии прямо над объявлением уходят вместе с ним
            while body and body[-1].lstrip().startswith("//"):
                chunk.insert(0, body.pop())
            top.append("\n".join(chunk))
        else:
            body.append(line)
        i += 1
    rest = "\n".join(body).strip("\n")
    return top, [rest] if rest.strip() else []


# ── Разбор глав ───────────────────────────────────────────────────────────

FIG = re.compile(r'<figure class="(code(?: code--out)?)"((?: data-[a-z]+="[^"]*")*)>\s*<figcaption>(.*?)</figcaption>\s*<pre>(.*?)</pre>\s*</figure>', re.S)


def text(fragment: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", fragment))


def blocks(chapter: str) -> list[dict]:
    page = (BOOK / "temy" / CHAPTERS[chapter][0] / "index.html").read_text()
    start = page.index("<main")
    items = []
    for m in FIG.finditer(page, start):
        attrs = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(2)))
        if attrs.get("run") == "no":
            continue            # объявление для чтения, а не пример для запуска
        items.append({"kind": "out" if "out" in m.group(1) else "code", "lang": attrs.get("lang"),
                      "caption": text(m.group(3)), "code": text(m.group(4)), "span": (m.start(4), m.end(4))})
    return items


def snippets(chapter: str, lang: str) -> list[str]:
    return [b["code"] for b in blocks(chapter) if b["kind"] == "code" and b["lang"] == lang]


# ── Прогон ────────────────────────────────────────────────────────────────

# Что стоит в заготовке на месте примера: без него программа молчала бы,
# и было бы непонятно, запустилась ли она вообще. Прогон примеров этих строк не видит.
PING_TEXT = "Заготовка главы @@CH@@ подключилась к серверу. Замените проверочные строки примером из главы."
PING = {
    "python": f'''# Проверочные строки: замените их примером из главы.
client.admin.command("ping")
print("{PING_TEXT}")
''',
    "ruby": f'''# Проверочные строки: замените их примером из главы.
client.database.command(ping: 1)
puts "{PING_TEXT}"
''',
    "go": f'''\t\t// Проверочные строки: замените их примером из главы.
\t\tif err := client.Ping(ctx, nil); err != nil {{
\t\t\tlog.Fatal(err)
\t\t}}
\t\tfmt.Println("{PING_TEXT}")
''',
    "cpp": f'''        // Проверочные строки: замените их примером из главы.
        client["admin"].run_command(make_document(kvp("ping", 1)));
        std::cout << "{PING_TEXT}" << std::endl;
''',
}


def write_starters() -> None:
    lessons = PRACTICE / "lessons"
    lessons.mkdir(exist_ok=True)
    for chapter in CHAPTERS:
        if chapter == "1.1" or chapter in WHOLE:
            continue            # глава 1.1 и главы со скриптами подключаются сами
        for lang in LANGS:
            program = starter(chapter, lang, snippets(chapter, lang)).replace("@@TOP@@", "")
            check = PING[lang].replace("@@CH@@", chapter)
            if lang in ("python", "ruby"):
                program += check
            else:
                program = program.replace("@@BODY@@", check.rstrip("\n"))
            path = lessons / f"ch{chapter.replace('.', '_')}.{EXT[lang]}"
            path.write_text(program)
    print("заготовки записаны в", lessons)


def programs(chapter: str, lang: str) -> list[tuple[int, str, str]]:
    """(номер примера, режим, текст программы) — в порядке главы."""
    codes = snippets(chapter, lang)
    result = []
    for n, code in enumerate(codes, 1):
        if (chapter, n) in MERGED:
            continue
        parts = [codes[i - 1] for i in CONTINUES.get((chapter, n), [])] + [code]
        if chapter in WHOLE:
            result.append((n, "run", code if code.endswith("\n") else code + "\n"))
            continue
        if chapter == "1.1":
            program = bare(lang, instance=not any("mongocxx::instance" in part for part in parts))
        else:
            program = starter(chapter, lang, codes)
        mode = "compile" if (chapter, n) in COMPILE_ONLY else "run"
        result.append((n, mode, fill(program, lang, parts)))
    return result


def bare(lang: str, instance: bool = True) -> str:
    """Глава 1.1 учит создавать клиента сама — заготовка без подключения."""
    if lang == "python":
        return "from pymongo import MongoClient\n\n"
    if lang == "ruby":
        return 'require "mongo"\n\nMongo::Logger.logger.level = Logger::WARN\n\n'
    if lang == "go":
        return "package main\n\n@@TOP@@\nfunc main() {\n\tctx := context.Background()\n\t_ = ctx\n\t{\n@@BODY@@\n\t}\n}\n"
    head, _, _ = base("1.2", "cpp")
    head = head[:head.index("int main()")]
    first = "    mongocxx::instance instance{};\n" if instance else ""
    return head + "int main() {\n" + first + "    {\n@@BODY@@\n    }\n}\n"


def load_results() -> dict:
    merged = {}
    for path in sorted(RESULTS.glob("*.json")):
        for chapter, by_lang in json.loads(path.read_text()).items():
            merged.setdefault(chapter, {}).update(by_lang)
    return merged


GO_BARE_IMPORTS = ("package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"log\"\n\t\"os\"\n\n"
                   "\t\"go.mongodb.org/mongo-driver/v2/bson\"\n\t\"go.mongodb.org/mongo-driver/v2/mongo\"\n"
                   "\t\"go.mongodb.org/mongo-driver/v2/mongo/options\"\n)\n\nvar _ = fmt.Sprint\nvar _ = log.Fatal\n"
                   "var _ = os.Getenv\nvar _ = bson.D{}\nvar _ = mongo.Connect\nvar _ = options.Client\n")


def run(langs: list[str], chapters: list[str]) -> None:
    RESULTS.mkdir(exist_ok=True)
    for chapter in chapters:
        for lang in langs:
            # Папка на той же глубине, что lessons/: пути вида ../stend работают как у студента
            folder = PRACTICE / f"_ex_{chapter.replace('.', '_')}_{lang}"
            subprocess.run(["rm", "-rf", str(folder)])
            folder.mkdir(parents=True)
            if lang == "go":
                for name in ("go.mod", "go.sum"):
                    (folder / name).write_text((PRACTICE / "lessons" / name).read_text())
            plan = programs(chapter, lang)
            for n, mode, program in plan:
                if lang == "go" and chapter == "1.1":
                    program = program.replace("package main\n", GO_BARE_IMPORTS, 1)
                (folder / f"{n:02d}.{EXT[lang]}").write_text(program)
            subprocess.run(["docker", "compose", "run", "--rm", "reset"], cwd=PRACTICE, capture_output=True)
            rel = folder.relative_to(PRACTICE)
            script = (f'for f in {rel}/*.{EXT[lang]}; do '
                      f'echo "@@@ $f"; run "$f" 2>"$f.err"; echo "@@@ exit=$?"; done')
            proc = subprocess.run(["docker", "compose", "run", "--rm", "-T", "--entrypoint", "sh", lang, "-c", script],
                                  cwd=PRACTICE, capture_output=True, text=True, timeout=3600)
            chunks = re.split(r"^@@@ (_ex_\S+)\n", proc.stdout, flags=re.M)[1:]
            got = {}
            for name, body in zip(chunks[0::2], chunks[1::2]):
                n = int(pathlib.Path(name).stem)
                code = int(re.search(r"@@@ exit=(\d+)", body).group(1))
                out = re.sub(r"@@@ exit=\d+\s*$", "", body)
                err = (PRACTICE / (name + ".err")).read_text(errors="replace")
                err = "\n".join(l for l in err.splitlines() if not l.startswith(("go: downloading", "go: finding")))
                mode = next(m for k, m, _ in plan if k == n)
                got[str(n)] = {"exit": code, "stdout": out, "stderr": err if len(err) < 4000 else err[:2000] + "\n…\n" + err[-2000:], "mode": mode}
            path = RESULTS / f"{lang}.json"
            saved = json.loads(path.read_text()) if path.exists() else {}
            saved.setdefault(chapter, {})[lang] = got
            path.write_text(json.dumps(saved, ensure_ascii=False, indent=1))
            ok = sum(1 for v in got.values() if v["exit"] == 0)
            print(f"{chapter} {lang:6s} запусков {len(got):2d}, без ошибок {ok:2d}")
            for n, v in got.items():
                if v["exit"] != 0:
                    tail = (v["stderr"].strip().splitlines() or [v["stdout"].strip()[-120:]])[-1]
                    print(f"      #{int(n):02d} exit={v['exit']} {tail[:170]}")


# ── Сравнение с книгой ────────────────────────────────────────────────────

def normalize(value: str) -> list[str]:
    return [re.sub(r"\s+", " ", line).strip() for line in value.strip().splitlines() if line.strip()]


VOLATILE = [
    (re.compile(r"\b[0-9a-f]{24}\b"), "<id>"),
    (re.compile(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:\+00:00| \+0000 UTC| UTC|Z)?"), "<время>"),
    (re.compile(r"\b1[78]\d{8}\b"), "<время>"),
]


def steady(lines: list[str]) -> list[str]:
    out = []
    for line in lines:
        for pattern, mark in VOLATILE:
            line = pattern.sub(mark, line)
        out.append(line)
    return out


def shown(lang: str, run_: dict) -> str:
    """То, что студент увидит в терминале, в том виде, в каком это показывает книга."""
    text = run_["stdout"].rstrip("\n")
    if not run_["exit"]:
        return text
    err = [l for l in run_["stderr"].splitlines() if l.strip()]
    message = ""
    if lang == "python" and err:
        last = err[-1]
        last = re.sub(r"^[\w.]*\.(\w+(?:Error|Exception|Failure))", r"\1", last)
        message = last.split(", full error:")[0]
    elif lang == "ruby" and err:
        message = re.sub(r"^.*?:in [`'][^']*': ", "", err[0])
    elif lang == "go" and err:
        message = "\n".join(re.sub(r"^\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2} ", "", l) for l in err if not l.startswith(("exit status", "go: ")))
    elif lang == "cpp" and err:
        message = "\n".join(l.strip() for l in err if l.startswith(("terminate called", "  what()")))
    return (text + "\n" + message).strip("\n")


def pairs(chapter: str):
    """(вывод, язык, номер примера) — какой пример какой вывод показывает."""
    items = blocks(chapter)
    counters = {lang: 0 for lang in LANGS}
    last_any = None
    for item in items:
        if item["kind"] == "code":
            if item["lang"] in counters:
                counters[item["lang"]] += 1
            last_any = item
            continue
        if item["lang"] in counters:
            yield item, item["lang"], counters[item["lang"]]
        elif last_any is not None and last_any["lang"] in counters:
            for lang in LANGS:                   # общий вывод под кодом драйверов
                yield item, lang, counters[lang]


def report(dump: str | None = None) -> None:
    results = load_results()
    lines_out = []
    total = {"совпал": 0, "совпал, кроме _id и времени": 0, "ОТЛИЧ": 0, "нет прогона": 0}
    for chapter in CHAPTERS:
        by_lang = results.get(chapter, {})
        for item, lang, n in pairs(chapter):
            run_ = by_lang.get(lang, {}).get(str(n))
            tag = f"{chapter} {lang:6s} #{n:02d}{' (общий)' if item['lang'] is None else ''}"
            if not run_:
                total["нет прогона"] += 1
                lines_out.append(f"{tag} нет прогона")
                continue
            actual = shown(lang, run_)
            book, fact = normalize(item["code"]), normalize(actual)
            if book == fact:
                verdict = "совпал"
            elif steady(book) == steady(fact):
                verdict = "совпал, кроме _id и времени"
            else:
                verdict = "ОТЛИЧ"
            total[verdict] += 1
            lines_out.append(f"{tag} {verdict}")
            if verdict == "ОТЛИЧ" and dump:
                code = snippets(chapter, lang)[n - 1]
                lines_out.append("  ── код ──\n" + "\n".join("  " + l for l in code.splitlines()))
                lines_out.append("  ── книга ──\n" + "\n".join("  " + l for l in item["code"].splitlines()))
                lines_out.append("  ── факт ──\n" + "\n".join("  " + l for l in actual.splitlines()))
    text = "\n".join(lines_out) + "\n\n" + ", ".join(f"{k}: {v}" for k, v in total.items())
    if dump:
        pathlib.Path(dump).write_text(text)
    print(text if not dump else text.split("\n\n")[-1])


def apply(chapters: list[str]) -> None:
    """Записать в книгу настоящие выводы: каждый блок вывода — от своего примера.

    Общий вывод под кодом драйверов разбивается на четыре — по одному на язык:
    у драйверов разное оформление, и общий блок у кого-то обязательно врёт."""
    results = load_results()
    for chapter in chapters:
        path = BOOK / "temy" / CHAPTERS[chapter][0] / "index.html"
        page = path.read_text()
        start = page.index("<main")
        edits = []                       # (начало, конец, новый текст) — применяются с конца
        counters = {lang: 0 for lang in LANGS}
        last_any = None
        for m in FIG.finditer(page, start):
            attrs = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(2)))
            if attrs.get("run") == "no":
                continue
            lang = attrs.get("lang")
            if "out" not in m.group(1):
                if lang in counters:
                    counters[lang] += 1
                last_any = lang or "shell"
                continue
            by_lang = results.get(chapter, {})
            if lang in counters:
                run_ = by_lang.get(lang, {}).get(str(counters[lang]))
                if run_:
                    edits.append((m.start(4), m.end(4), html.escape(shown(lang, run_), quote=False)))
            elif last_any in counters:
                caption = m.group(3)
                figure_start = page.rfind("\n", 0, m.start()) + 1
                figure_end = page.index("</figure>", m.end(4)) + len("</figure>\n")
                parts = []
                for each in LANGS:
                    run_ = by_lang.get(each, {}).get(str(counters[each]))
                    if not run_:
                        continue
                    body = html.escape(shown(each, run_), quote=False)
                    parts.append(f'        <figure class="code code--out" data-lang="{each}">\n'
                                 f'          <figcaption>{caption}</figcaption>\n<pre>{body}</pre>\n        </figure>\n')
                if parts:
                    edits.append((figure_start, figure_end, "".join(parts)))
        for a, b, text_ in sorted(edits, reverse=True):
            page = page[:a] + text_ + page[b:]
        path.write_text(page)
        print(f"{chapter}: обновлено блоков вывода {len(edits)}")


def export(target: pathlib.Path) -> None:
    """Проверочный набор для чужих машин: программы глав и ожидаемые выводы.

    Кладёт в target/_v_<глава>_<язык>/NN.<ext> те же программы, что прогоняет
    run(), и target/_verify/expected.json с выводами прогона на стенде."""
    results = load_results()
    expected = {}
    for chapter in CHAPTERS:
        for lang in LANGS:
            folder = target / f"_v_{chapter.replace('.', '_')}_{lang}"
            subprocess.run(["rm", "-rf", str(folder)])
            folder.mkdir(parents=True)
            if lang == "go":
                for name in ("go.mod", "go.sum"):
                    (folder / name).write_text((PRACTICE / "lessons" / name).read_text())
            for n, mode, program in programs(chapter, lang):
                if lang == "go" and chapter == "1.1":
                    program = program.replace("package main\n", GO_BARE_IMPORTS, 1)
                (folder / f"{n:02d}.{EXT[lang]}").write_text(program)
                run_ = results[chapter][lang][str(n)]
                expected.setdefault(chapter, {}).setdefault(lang, {})[str(n)] = {
                    "exit": run_["exit"], "shown": shown(lang, run_)}
    (target / "_verify").mkdir(exist_ok=True)
    (target / "_verify" / "expected.json").write_text(json.dumps(expected, ensure_ascii=False, indent=1))
    print("проверочный набор записан в", target)


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "report"
    if command == "starters":
        write_starters()
    elif command == "run":
        langs = LANGS if sys.argv[2] == "all" else sys.argv[2].split(",")
        chapters = sys.argv[3:] or list(CHAPTERS)
        run(langs, chapters)
    elif command == "export":
        export(pathlib.Path(sys.argv[2]))
    elif command == "apply":
        apply(sys.argv[2:] or list(CHAPTERS))
    elif command == "report":
        report(sys.argv[2] if len(sys.argv) > 2 else None)
