"""Шпаргалки глав на четырёх языках.

Шпаргалка в конце главы — это тот же код, что и в тексте, только сжатый до
трёх строк. Поэтому она тоже переключается кнопкой языка.

Формат: глава → язык → список карточек (заголовок, строки кода).
Запуск: python3 tools/cheats.py — перебирает главы и заменяет блок .cheat
на четыре варианта подряд.
"""

import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lang import ORDER

BOOK = pathlib.Path(__file__).resolve().parent.parent

CHEATS = {
    "01-klient-baza-kollekciya": {
        "python": [
            ("Подключиться", ["from pymongo import MongoClient", "client = MongoClient(", '  "mongodb://localhost:27017/")']),
            ("Спуститься к коллекции", ['db = client["shop"]', 'col = db["products"]', '# или client["shop"]["products"]']),
            ("Осмотреться", ["client.list_database_names()", "db.list_collection_names()", "col.count_documents({})"]),
            ("То же в оболочке", ["show dbs", "use shop", "show collections"]),
        ],
        "cpp": [
            ("Подключиться", ["#include &lt;mongocxx/client.hpp&gt;", "mongocxx::instance instance{};", "mongocxx::client client{", '  mongocxx::uri{"mongodb://localhost:27017"}};']),
            ("Спуститься к коллекции", ['auto db = client["shop"];', 'auto col = db["products"];', "// или client[\"shop\"][\"products\"]"]),
            ("Осмотреться", ["client.list_database_names()", "db.list_collection_names()", "col.count_documents(make_document())"]),
            ("Собрать", ["g++ -std=c++17 main.cpp \\", "  $(pkg-config --cflags --libs \\", "    libmongocxx1)"]),
        ],
        "go": [
            ("Подключиться", ['import "go.mongodb.org/mongo-driver/v2/mongo"', "client, err := mongo.Connect(", "  options.Client().ApplyURI(", '    "mongodb://localhost:27017"))']),
            ("Спуститься к коллекции", ['db := client.Database("shop")', 'col := db.Collection("products")']),
            ("Осмотреться", ["client.ListDatabaseNames(ctx, bson.D{})", "db.ListCollectionNames(ctx, bson.D{})", "col.CountDocuments(ctx, bson.D{})"]),
            ("Поставить драйвер", ["go get go.mongodb.org/\\", "  mongo-driver/v2/mongo"]),
        ],
        "ruby": [
            ("Подключиться", ['require "mongo"', "client = Mongo::Client.new(", '  "mongodb://localhost:27017/")']),
            ("Спуститься к коллекции", ['db = client.use("shop").database', "col = db[:products]"]),
            ("Осмотреться", ["client.database_names", "db.collection_names", "col.count_documents({})"]),
            ("Поставить драйвер", ["gem install mongo", "# Mongo::Logger.logger.level =", "#   Logger::WARN"]),
        ],
    },
    "02-dokument-i-bson": {
        "python": [
            ("Посмотреть документ", ['col.find_one({"_id": "p-012"})', "# mongosh:", 'db.products.findOne({_id:"p-012"})']),
            ("Размер документа", ["{$project: {size:", '  {$bsonSize: "$$ROOT"}}}', "# предел — 16 МБ"]),
            ("ObjectId из строки", ["from bson import ObjectId", "col.find_one(", '  {"_id": ObjectId(raw)})']),
            ("Время из ObjectId", ["oid.generation_time", "# mongosh:", "_id.getTimestamp()"]),
        ],
        "cpp": [
            ("Посмотреть документ", ['col.find_one(make_document(', '  kvp("_id", "p-012")))', "// поля: doc-&gt;view()[\"title\"]"]),
            ("Размер документа", ["{$project: {size:", '  {$bsonSize: "$$ROOT"}}}', "// предел — 16 МБ"]),
            ("ObjectId из строки", ["#include &lt;bsoncxx/oid.hpp&gt;", "bsoncxx::oid oid{raw};", 'col.find_one(make_document(kvp("_id", oid)));']),
            ("Время из ObjectId", ["oid.get_time_t()", "// секунды от эпохи"]),
        ],
        "go": [
            ("Посмотреть документ", ["var doc bson.M", "col.FindOne(ctx,", '  bson.D{{Key: "_id", Value: "p-012"}}).', "  Decode(&amp;doc)"]),
            ("Размер документа", ["{$project: {size:", '  {$bsonSize: "$$ROOT"}}}', "// предел — 16 МБ"]),
            ("ObjectId из строки", ["oid, err := bson.ObjectIDFromHex(raw)", "col.FindOne(ctx,", '  bson.D{{Key: "_id", Value: oid}})']),
            ("Время из ObjectId", ["oid.Timestamp()", "// возвращает time.Time"]),
        ],
        "ruby": [
            ("Посмотреть документ", ['col.find({ "_id" =&gt; "p-012" }).first', "# mongosh:", 'db.products.findOne({_id:"p-012"})']),
            ("Размер документа", ["{$project: {size:", '  {$bsonSize: "$$ROOT"}}}', "# предел — 16 МБ"]),
            ("ObjectId из строки", ["oid = BSON::ObjectId.from_string(raw)", 'col.find({ "_id" =&gt; oid }).first']),
            ("Время из ObjectId", ["oid.generation_time", "# возвращает Time в UTC"]),
        ],
    },
    "03-vstavka": {
        "python": [
            ("Один документ", ["res = col.insert_one({...})", "res.inserted_id", "# mongosh: insertOne({...})"]),
            ("Пачка", ["res = col.insert_many([...])", "res.inserted_ids", "# insertMany([...])"]),
            ("Не падать на сбойных", ["col.insert_many(", "  docs, ordered=False)", "# ловить BulkWriteError"]),
            ("Перезалить коллекцию", ["col.delete_many({})", "col.insert_many(docs)", "# или mongoimport --drop"]),
        ],
        "cpp": [
            ("Один документ", ["auto res = col.insert_one(", "  make_document(kvp(\"price\", 1290)));", "res-&gt;inserted_id()"]),
            ("Пачка", ["std::vector&lt;bsoncxx::document::value&gt; batch;", "auto many = col.insert_many(batch);", "many-&gt;inserted_count()"]),
            ("Не падать на сбойных", ["mongocxx::options::insert options;", "options.ordered(false);", "// ловить bulk_write_exception"]),
            ("Перезалить коллекцию", ["col.delete_many(make_document());", "col.insert_many(docs);"]),
        ],
        "go": [
            ("Один документ", ["res, err := col.InsertOne(ctx,", "  bson.D{{Key: \"price\", Value: 1290}})", "res.InsertedID"]),
            ("Пачка", ["many, err := col.InsertMany(ctx, docs)", "many.InsertedIDs"]),
            ("Не падать на сбойных", ["col.InsertMany(ctx, docs,", "  options.InsertMany().SetOrdered(false))", "// errors.As(&amp;mongo.BulkWriteException{})"]),
            ("Перезалить коллекцию", ["col.DeleteMany(ctx, bson.D{})", "col.InsertMany(ctx, docs)"]),
        ],
        "ruby": [
            ("Один документ", ["res = col.insert_one({ ... })", "res.inserted_id"]),
            ("Пачка", ["res = col.insert_many([...])", "res.inserted_ids", "res.inserted_count"]),
            ("Не падать на сбойных", ["col.insert_many(docs, ordered: false)", "# rescue Mongo::Error::OperationFailure"]),
            ("Перезалить коллекцию", ["col.delete_many({})", "col.insert_many(docs)"]),
        ],
    },
    "04-find-i-kursor": {
        "python": [
            ("Один документ", ['col.find_one({"_id": "p-003"})', "# вернёт None, если нет"]),
            ("Много документов", ["for d in col.find({...}):", '    print(d["title"])', "items = list(col.find({...}))"]),
            ("Вложенное поле", ['{"delivery.city": "Москва"}', '{"payment.paid": True}']),
            ("Сколько нашлось", ["col.count_documents({})", "col.count_documents(", '  {"category": "ноутбуки"})']),
        ],
        "cpp": [
            ("Один документ", ['auto one = col.find_one(', '  make_document(kvp("_id", "p-003")));', "// пустой optional, если нет"]),
            ("Много документов", ["for (const auto&amp; d : col.find(filter))", '    std::cout &lt;&lt; d["title"].get_string().value;']),
            ("Вложенное поле", ['kvp("delivery.city", "Москва")', 'kvp("payment.paid", true)']),
            ("Сколько нашлось", ["col.count_documents(make_document())", "col.count_documents(", '  make_document(kvp("category", "ноутбуки")))']),
        ],
        "go": [
            ("Один документ", ["err := col.FindOne(ctx, filter).Decode(&amp;one)", "// mongo.ErrNoDocuments, если нет"]),
            ("Много документов", ["cursor, _ := col.Find(ctx, filter)", "var items []Product", "cursor.All(ctx, &amp;items)"]),
            ("Вложенное поле", ['bson.D{{Key: "delivery.city",', '  Value: "Москва"}}']),
            ("Сколько нашлось", ["col.CountDocuments(ctx, bson.D{})", "col.CountDocuments(ctx,", '  bson.D{{Key: "category", Value: "ноутбуки"}})']),
        ],
        "ruby": [
            ("Один документ", ['col.find({ "_id" =&gt; "p-003" }).first', "# вернёт nil, если нет"]),
            ("Много документов", ["col.find({ ... }).each { |d| puts d[\"title\"] }", "items = col.find({ ... }).to_a"]),
            ("Вложенное поле", ['{ "delivery.city" =&gt; "Москва" }', '{ "payment.paid" =&gt; true }']),
            ("Сколько нашлось", ["col.count_documents({})", 'col.count_documents({ "category" =&gt; "ноутбуки" })']),
        ],
    },
    "05-proekciya": {
        "python": [
            ("Только нужные поля", ["col.find({...},", '  {"_id": 0, "title": 1})']),
            ("Всё, кроме тяжёлого", ["col.find({...},", '  {"items": 0})']),
            ("Вложенное поле", ['{"delivery.city": 1}', "# вернётся вложенным"]),
            ("В mongosh", ["db.products.find(", '  {category:"ноутбуки"},', "  {_id:0, title:1, price:1})"]),
        ],
        "cpp": [
            ("Только нужные поля", ["options.projection(make_document(", '  kvp("_id", 0), kvp("title", 1)));', "col.find(filter, options);"]),
            ("Всё, кроме тяжёлого", ["options.projection(", '  make_document(kvp("items", 0)));']),
            ("Вложенное поле", ['kvp("delivery.city", 1)', "// вернётся вложенным"]),
            ("Смешивать нельзя", ["// kvp(\"title\", 1) + kvp(\"stock\", 0)", "// → server error 31254"]),
        ],
        "go": [
            ("Только нужные поля", ["options.Find().SetProjection(bson.D{", '  {Key: "_id", Value: 0},', '  {Key: "title", Value: 1}})']),
            ("Всё, кроме тяжёлого", ["options.Find().SetProjection(", '  bson.D{{Key: "items", Value: 0}})']),
            ("Вложенное поле", ['{Key: "delivery.city", Value: 1}', "// вернётся вложенным"]),
            ("Один документ", ["options.FindOne().SetProjection(...)", "col.FindOne(ctx, filter, opts)"]),
        ],
        "ruby": [
            ("Только нужные поля", ["col.find({ ... },", '  projection: { "_id" =&gt; 0, "title" =&gt; 1 })']),
            ("Всё, кроме тяжёлого", ["col.find({ ... },", '  projection: { "items" =&gt; 0 })']),
            ("Вложенное поле", ['projection: { "delivery.city" =&gt; 1 }', "# вернётся вложенным"]),
            ("Смешивать нельзя", ['# { "title" =&gt; 1, "stock" =&gt; 0 }', "# → Mongo::Error::OperationFailure"]),
        ],
    },
    "06-sort-limit-skip": {
        "python": [
            ("Сортировка", ['.sort("price", -1)', '.sort([("category", 1),', '       ("price", -1)])']),
            ("Топ-N", ["col.find({}).sort(", '  "price", -1).limit(5)']),
            ("Страница", [".skip((page-1)*size)", ".limit(size)"]),
            ("Счёт", ["col.count_documents({})", "col.count_documents(", '  {"status": "доставлен"})']),
        ],
        "cpp": [
            ("Сортировка", ['options.sort(make_document(kvp("price", -1)));', "// два ключа — два kvp подряд"]),
            ("Топ-N", ['options.sort(make_document(kvp("price", -1)));', "options.limit(5);"]),
            ("Страница", ["options.skip((page - 1) * size);", "options.limit(size);"]),
            ("Счёт", ["col.count_documents(make_document())", "col.count_documents(", '  make_document(kvp("status", "доставлен")))']),
        ],
        "go": [
            ("Сортировка", ["options.Find().SetSort(", '  bson.D{{Key: "price", Value: -1}})', "// bson.D хранит порядок ключей"]),
            ("Топ-N", ["options.Find().", '  SetSort(bson.D{{Key: "price", Value: -1}}).', "  SetLimit(5)"]),
            ("Страница", ["options.Find().", "  SetSkip((page - 1) * size).", "  SetLimit(size)"]),
            ("Счёт", ["col.CountDocuments(ctx, bson.D{})", "col.CountDocuments(ctx,", '  bson.D{{Key: "status", Value: "доставлен"}})']),
        ],
        "ruby": [
            ("Сортировка", ['.sort({ "price" =&gt; -1 })', '.sort({ "category" =&gt; 1, "price" =&gt; -1 })']),
            ("Топ-N", ['col.find({}).sort({ "price" =&gt; -1 }).limit(5)']),
            ("Страница", [".skip((page - 1) * size)", ".limit(size)"]),
            ("Счёт", ["col.count_documents({})", 'col.count_documents({ "status" =&gt; "доставлен" })']),
        ],
    },
    "07-obnovlenie": {
        "python": [
            ("Изменить поле", ["col.update_one(", '  {"_id": "p-101"},', '  {"$set": {"price": 2690}})']),
            ("Счётчик и удаление поля", ['{"$inc": {"reviews": 1}}', '{"$unset": {"discount": ""}}']),
            ("Пачкой", ["col.update_many(", '  {"category": "аксессуары"},', '  {"$set": {...}})']),
            ("Обновить или создать", ["col.update_one(query, upd,", "  upsert=True)", "res.upserted_id"]),
        ],
        "cpp": [
            ("Изменить поле", ["col.update_one(", '  make_document(kvp("_id", "p-101")),', '  make_document(kvp("$set",', '    make_document(kvp("price", 2690)))));']),
            ("Счётчик и удаление поля", ['kvp("$inc", make_document(kvp("reviews", 1)))', 'kvp("$unset", make_document(kvp("discount", "")))']),
            ("Пачкой", ["col.update_many(filter, update);", "res-&gt;matched_count()"]),
            ("Обновить или создать", ["mongocxx::options::update options;", "options.upsert(true);", "col.update_one(filter, update, options);"]),
        ],
        "go": [
            ("Изменить поле", ["col.UpdateOne(ctx,", '  bson.D{{Key: "_id", Value: "p-101"}},', '  bson.D{{Key: "$set", Value: bson.D{', '    {Key: "price", Value: 2690}}}})']),
            ("Счётчик и удаление поля", ['{Key: "$inc", Value: bson.D{{Key: "reviews", Value: 1}}}', '{Key: "$unset", Value: bson.D{{Key: "discount", Value: ""}}}']),
            ("Пачкой", ["res, _ := col.UpdateMany(ctx, filter, update)", "res.MatchedCount"]),
            ("Обновить или создать", ["col.UpdateOne(ctx, filter, update,", "  options.UpdateOne().SetUpsert(true))", "res.UpsertedID"]),
        ],
        "ruby": [
            ("Изменить поле", ["col.update_one(", '  { "_id" =&gt; "p-101" },', '  { "$set" =&gt; { "price" =&gt; 2690 } })']),
            ("Счётчик и удаление поля", ['{ "$inc" =&gt; { "reviews" =&gt; 1 } }', '{ "$unset" =&gt; { "discount" =&gt; "" } }']),
            ("Пачкой", ["res = col.update_many(filter, update)", "res.matched_count"]),
            ("Обновить или создать", ["col.update_one(query, upd, upsert: true)", "res.upserted_id"]),
        ],
    },
    "08-udalenie": {
        "python": [
            ("Удалить документ", ['col.delete_one({"_id": "p-020"})', "res.deleted_count"]),
            ("Удалить пачку", ["col.delete_many(", '  {"category": "аксессуары"})', 'col.delete_many({"_id": {"$in": ids}})']),
            ("Удалить и забрать", ["doc = col.find_one_and_delete(", '  {"_id": "p-008"})']),
            ("Очистить / снести", ["col.delete_many({})   # пусто", "col.drop()            # нет коллекции", 'client.drop_database("sandbox")']),
        ],
        "cpp": [
            ("Удалить документ", ["auto res = col.delete_one(", '  make_document(kvp("_id", "p-020")));', "res-&gt;deleted_count()"]),
            ("Удалить пачку", ["col.delete_many(", '  make_document(kvp("category", "аксессуары")));']),
            ("Удалить и забрать", ["auto doc = col.find_one_and_delete(filter);", "// вернётся optional с документом"]),
            ("Очистить / снести", ["col.delete_many(make_document());", "col.drop();", 'client["sandbox"].drop();']),
        ],
        "go": [
            ("Удалить документ", ["res, _ := col.DeleteOne(ctx,", '  bson.D{{Key: "_id", Value: "p-020"}})', "res.DeletedCount"]),
            ("Удалить пачку", ["col.DeleteMany(ctx,", '  bson.D{{Key: "category", Value: "аксессуары"}})']),
            ("Удалить и забрать", ["col.FindOneAndDelete(ctx, filter).", "  Decode(&amp;doc)"]),
            ("Очистить / снести", ["col.DeleteMany(ctx, bson.D{})", "col.Drop(ctx)", 'client.Database("sandbox").Drop(ctx)']),
        ],
        "ruby": [
            ("Удалить документ", ['res = col.delete_one({ "_id" =&gt; "p-020" })', "res.deleted_count"]),
            ("Удалить пачку", ["col.delete_many(", '  { "category" =&gt; "аксессуары" })']),
            ("Удалить и забрать", ["doc = col.find_one_and_delete(filter)"]),
            ("Очистить / снести", ["col.delete_many({})   # пусто", "col.drop              # нет коллекции", 'client.use("sandbox").database.drop']),
        ],
    },
}


def render(cards, lang, indent=8):
    pad = " " * indent
    parts = [f'{pad}<div class="cheat" data-lang="{lang}">']
    for title, lines in cards:
        parts.append(f"{pad}  <div>")
        parts.append(f"{pad}    <b>{title}</b>")
        for line in lines:
            parts.append(f"{pad}    <code>{line}</code>")
        parts.append(f"{pad}  </div>")
    parts.append(f"{pad}</div>")
    return "\n".join(parts)


def main():
    for chapter, by_lang in CHEATS.items():
        path = BOOK / "temy" / chapter / "index.html"
        text = path.read_text()
        # Закрывающий тег ищем строго по отступу блока, иначе шаблон
        # обрывается на первой же карточке внутри шпаргалки.
        match = re.search(r'[ ]{8}<div class="cheat">.*?\n[ ]{8}</div>\n', text, re.S)
        if not match:
            print(f"{chapter}: блок .cheat не найден — пропущен")
            continue
        block = "\n".join(render(by_lang[lang], lang) for lang in ORDER) + "\n"
        path.write_text(text[:match.start()] + block + text[match.end():])
        print(f"{chapter}: шпаргалка переведена на четыре языка")


if __name__ == "__main__":
    main()
