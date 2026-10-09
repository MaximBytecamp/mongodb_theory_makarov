"""Примеры, таблицы ошибок и шпаргалки глав модуля 3 — исходник для snippets.py.

В модуле 3 примеры процедурные: создать коллекцию с правилом, перехватить
отказ сервера, поменять настройки коллекции, построить индекс. Общий литерал
фильтра, как в chapters2.py, здесь не помогает: у каждого драйвера свой
способ создать коллекцию и свой тип ошибки. Поэтому код записан на каждом
языке целиком (ключ "plain"), а подсветку собирает codeedit.highlight.

Отступы в Go и C++ — четыре пробела, как в остальных главах книги.
Числа в комментариях — то, что даёт стенд; сам вывод в книгу подставляет
examples.py apply.
"""

EXAMPLES: dict = {}
ERRORS: dict = {}
CHEATS: dict = {}

# ── 3.1 Правила на уровне базы: $jsonSchema ───────────────────────────────
#
# Заготовка главы (examples.EXTRAS) объявляет catalog = sandbox.catalog
# и schema — правило товара из §2.

EXAMPLES["3.1"] = {}

# 3 документа, все три приняты
EXAMPLES["3.1"]["accept"] = {"caption": "три товара без правила", "plain": {
    "python": '''
catalog.drop()
catalog.insert_one({"sku": "SKU-AC-030", "title": "Чехол для ноутбука 15 дюймов",
                    "category": "аксессуары", "price": 1990})
catalog.insert_one({"sku": "SKU-AC-031", "title": "Подставка под монитор",
                    "category": "аксессуары", "price": "2 490"})
catalog.insert_one({"sku": "SKU-AC-032", "category": "аксессуары", "price": -350})

print("документов в коллекции:", catalog.count_documents({}))
for doc in catalog.find({}, {"_id": 0}):
    print(doc)
''',
    "ruby": '''
catalog.drop
catalog.insert_one({ "sku" => "SKU-AC-030", "title" => "Чехол для ноутбука 15 дюймов",
                     "category" => "аксессуары", "price" => 1990 })
catalog.insert_one({ "sku" => "SKU-AC-031", "title" => "Подставка под монитор",
                     "category" => "аксессуары", "price" => "2 490" })
catalog.insert_one({ "sku" => "SKU-AC-032", "category" => "аксессуары", "price" => -350 })

puts "документов в коллекции: " + catalog.count_documents({}).to_s
catalog.find({}, projection: { "_id" => 0 }).each { |doc| puts doc.inspect }
''',
    "go": '''
catalog.Drop(ctx)
catalog.InsertOne(ctx, bson.D{
    {Key: "sku", Value: "SKU-AC-030"},
    {Key: "title", Value: "Чехол для ноутбука 15 дюймов"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: 1990}})
catalog.InsertOne(ctx, bson.D{
    {Key: "sku", Value: "SKU-AC-031"},
    {Key: "title", Value: "Подставка под монитор"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: "2 490"}})
catalog.InsertOne(ctx, bson.D{
    {Key: "sku", Value: "SKU-AC-032"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: -350}})

n, _ := catalog.CountDocuments(ctx, bson.D{})
fmt.Println("документов в коллекции:", n)

cursor, _ := catalog.Find(ctx, bson.D{},
    options.Find().SetProjection(bson.D{{Key: "_id", Value: 0}}))
for cursor.Next(ctx) {
    var doc bson.D
    cursor.Decode(&doc)
    out, _ := bson.MarshalExtJSON(doc, false, false)
    fmt.Println(string(out))
}
''',
    "cpp": '''
catalog.drop();
catalog.insert_one(make_document(
    kvp("sku", "SKU-AC-030"),
    kvp("title", "Чехол для ноутбука 15 дюймов"),
    kvp("category", "аксессуары"),
    kvp("price", 1990)));
catalog.insert_one(make_document(
    kvp("sku", "SKU-AC-031"),
    kvp("title", "Подставка под монитор"),
    kvp("category", "аксессуары"),
    kvp("price", "2 490")));
catalog.insert_one(make_document(
    kvp("sku", "SKU-AC-032"),
    kvp("category", "аксессуары"),
    kvp("price", -350)));

std::cout << "документов в коллекции: " << catalog.count_documents(make_document()) << std::endl;

mongocxx::options::find options;
options.projection(make_document(kvp("_id", 0)));
for (const auto& doc : catalog.find(make_document(), options)) {
    std::cout << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;
}
''',
}}

# 21 из 21 в shop.products, 1 из 3 в sandbox.catalog
EXAMPLES["3.1"]["filter"] = {"caption": "правило как условие запроса", "plain": {
    "python": '''
print("shop.products, подходят:  ", products.count_documents({"$jsonSchema": schema}))
print("sandbox.catalog, подходят:", catalog.count_documents({"$jsonSchema": schema}))

for doc in catalog.find({"$nor": [{"$jsonSchema": schema}]}, {"_id": 0, "sku": 1, "title": 1, "price": 1}):
    print("не подходит:", doc)
''',
    "ruby": '''
puts "shop.products, подходят:   " + products.count_documents({ "$jsonSchema" => schema }).to_s
puts "sandbox.catalog, подходят: " + catalog.count_documents({ "$jsonSchema" => schema }).to_s

catalog.find({ "$nor" => [{ "$jsonSchema" => schema }] },
             projection: { "_id" => 0, "sku" => 1, "title" => 1, "price" => 1 })
       .each { |doc| puts "не подходит: " + doc.inspect }
''',
    "go": '''
vMagazine, _ := products.CountDocuments(ctx, bson.D{{Key: "$jsonSchema", Value: schema}})
vKataloge, _ := catalog.CountDocuments(ctx, bson.D{{Key: "$jsonSchema", Value: schema}})
fmt.Println("shop.products, подходят:  ", vMagazine)
fmt.Println("sandbox.catalog, подходят:", vKataloge)

cursor, _ := catalog.Find(ctx, bson.D{{Key: "$nor", Value: bson.A{bson.D{{Key: "$jsonSchema", Value: schema}}}}},
    options.Find().SetProjection(bson.D{{Key: "_id", Value: 0}, {Key: "sku", Value: 1}, {Key: "title", Value: 1}, {Key: "price", Value: 1}}))
for cursor.Next(ctx) {
    var doc bson.D
    cursor.Decode(&doc)
    out, _ := bson.MarshalExtJSON(doc, false, false)
    fmt.Println("не подходит:", string(out))
}
''',
    "cpp": '''
std::cout << "shop.products, подходят:   " << products.count_documents(make_document(kvp("$jsonSchema", schema.view()))) << std::endl;
std::cout << "sandbox.catalog, подходят: " << catalog.count_documents(make_document(kvp("$jsonSchema", schema.view()))) << std::endl;

mongocxx::options::find options;
options.projection(make_document(kvp("_id", 0), kvp("sku", 1), kvp("title", 1), kvp("price", 1)));
for (const auto& doc : catalog.find(make_document(kvp("$nor", make_array(make_document(kvp("$jsonSchema", schema.view()))))), options)) {
    std::cout << "не подходит: " << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;
}
''',
}}

# чехол записан; второй — код 121; в коллекции 1
EXAMPLES["3.1"]["create"] = {"caption": "коллекция с правилом", "plain": {
    "python": '''
from pymongo.errors import WriteError

sandbox.drop_collection("checked")
checked = sandbox.create_collection("checked", validator={"$jsonSchema": schema})

checked.insert_one({"sku": "SKU-AC-030", "title": "Чехол для ноутбука 15 дюймов",
                    "category": "аксессуары", "price": 1990})
print("чехол записан")

try:
    checked.insert_one({"sku": "SKU-AC-032", "category": "аксессуары", "price": -350})
    print("товар без названия записан")
except WriteError as e:
    print("товар без названия отклонён, код ошибки", e.code)

print("документов в коллекции:", checked.count_documents({}))
''',
    "ruby": '''
sandbox[:checked].drop
checked = sandbox[:checked, validator: { "$jsonSchema" => schema }]
checked.create

checked.insert_one({ "sku" => "SKU-AC-030", "title" => "Чехол для ноутбука 15 дюймов",
                     "category" => "аксессуары", "price" => 1990 })
puts "чехол записан"

begin
  checked.insert_one({ "sku" => "SKU-AC-032", "category" => "аксессуары", "price" => -350 })
  puts "товар без названия записан"
rescue Mongo::Error::OperationFailure => e
  puts "товар без названия отклонён, код ошибки #{e.code}"
end

puts "документов в коллекции: " + checked.count_documents({}).to_s
''',
    "go": '''
sandbox.Collection("checked").Drop(ctx)
sandbox.CreateCollection(ctx, "checked",
    options.CreateCollection().SetValidator(bson.D{{Key: "$jsonSchema", Value: schema}}))
checked := sandbox.Collection("checked")

checked.InsertOne(ctx, bson.D{
    {Key: "sku", Value: "SKU-AC-030"},
    {Key: "title", Value: "Чехол для ноутбука 15 дюймов"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: 1990}})
fmt.Println("чехол записан")

_, err := checked.InsertOne(ctx, bson.D{
    {Key: "sku", Value: "SKU-AC-032"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: -350}})
var we mongo.WriteException
if errors.As(err, &we) {
    fmt.Println("товар без названия отклонён, код ошибки", we.WriteErrors[0].Code)
} else {
    fmt.Println("товар без названия записан")
}

n, _ := checked.CountDocuments(ctx, bson.D{})
fmt.Println("документов в коллекции:", n)
''',
    "cpp": '''
sandbox["checked"].drop();
auto checked = sandbox.create_collection("checked",
    make_document(kvp("validator", make_document(kvp("$jsonSchema", schema.view())))));

checked.insert_one(make_document(
    kvp("sku", "SKU-AC-030"),
    kvp("title", "Чехол для ноутбука 15 дюймов"),
    kvp("category", "аксессуары"),
    kvp("price", 1990)));
std::cout << "чехол записан" << std::endl;

try {
    checked.insert_one(make_document(
        kvp("sku", "SKU-AC-032"),
        kvp("category", "аксессуары"),
        kvp("price", -350)));
    std::cout << "товар без названия записан" << std::endl;
} catch (const mongocxx::operation_exception& e) {
    std::cout << "товар без названия отклонён, код ошибки " << e.code().value() << std::endl;
}

std::cout << "документов в коллекции: " << checked.count_documents(make_document()) << std::endl;
''',
}}

# причины: price — bsonType, нет title
EXAMPLES["3.1"]["reasons"] = {"caption": "причины отказа из errInfo", "plain": {
    "python": '''
from pymongo.errors import WriteError

checked = sandbox["checked"]
try:
    checked.insert_one({"sku": "SKU-AC-031", "category": "аксессуары", "price": "2 490"})
except WriteError as e:
    print("подставка отклонена, причины:")
    for rule in e.details["errInfo"]["details"]["schemaRulesNotSatisfied"]:
        if rule["operatorName"] == "required":
            print("  нет обязательных полей:", rule["missingProperties"])
        if rule["operatorName"] == "properties":
            for prop in rule["propertiesNotSatisfied"]:
                for detail in prop["details"]:
                    print("  поле " + prop["propertyName"] + ":", detail["operatorName"], "—", detail["reason"])
''',
    "ruby": '''
checked = sandbox[:checked]
begin
  checked.insert_one({ "sku" => "SKU-AC-031", "category" => "аксессуары", "price" => "2 490" })
rescue Mongo::Error::OperationFailure => e
  puts "подставка отклонена, причины:"
  e.details["details"]["schemaRulesNotSatisfied"].each do |rule|
    if rule["operatorName"] == "required"
      puts "  нет обязательных полей: #{rule["missingProperties"]}"
    end
    if rule["operatorName"] == "properties"
      rule["propertiesNotSatisfied"].each do |prop|
        prop["details"].each do |detail|
          puts "  поле #{prop["propertyName"]}: #{detail["operatorName"]} — #{detail["reason"]}"
        end
      end
    end
  end
end
''',
    "go": '''
// Часть errInfo, которую читает пример: какие правила схемы не выполнены.
type schemaRule struct {
    OperatorName           string   `bson:"operatorName"`
    MissingProperties      []string `bson:"missingProperties"`
    PropertiesNotSatisfied []struct {
        PropertyName string `bson:"propertyName"`
        Details      []struct {
            OperatorName string `bson:"operatorName"`
            Reason       string `bson:"reason"`
        } `bson:"details"`
    } `bson:"propertiesNotSatisfied"`
}

checked := sandbox.Collection("checked")
_, err := checked.InsertOne(ctx, bson.D{
    {Key: "sku", Value: "SKU-AC-031"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: "2 490"}})
var we mongo.WriteException
if errors.As(err, &we) {
    var info struct {
        Details struct {
            Rules []schemaRule `bson:"schemaRulesNotSatisfied"`
        } `bson:"details"`
    }
    bson.Unmarshal(we.WriteErrors[0].Details, &info)
    fmt.Println("подставка отклонена, причины:")
    for _, rule := range info.Details.Rules {
        if rule.OperatorName == "required" {
            fmt.Println("  нет обязательных полей:", rule.MissingProperties)
        }
        if rule.OperatorName == "properties" {
            for _, prop := range rule.PropertiesNotSatisfied {
                for _, detail := range prop.Details {
                    fmt.Println("  поле "+prop.PropertyName+":", detail.OperatorName, "—", detail.Reason)
                }
            }
        }
    }
}
''',
    "cpp": '''
auto checked = sandbox["checked"];
try {
    checked.insert_one(make_document(
        kvp("sku", "SKU-AC-031"),
        kvp("category", "аксессуары"),
        kvp("price", "2 490")));
} catch (const mongocxx::operation_exception& e) {
    std::cout << "подставка отклонена, причины:" << std::endl;
    auto info = e.raw_server_error()->view()["writeErrors"][0]["errInfo"];
    for (auto&& item : info["details"]["schemaRulesNotSatisfied"].get_array().value) {
        auto rule = item.get_document().value;
        std::string name{rule["operatorName"].get_string().value};
        if (name == "required") {
            std::cout << "  нет обязательных полей:";
            for (auto&& field : rule["missingProperties"].get_array().value) {
                std::cout << " " << field.get_string().value;
            }
            std::cout << std::endl;
        }
        if (name == "properties") {
            for (auto&& prop : rule["propertiesNotSatisfied"].get_array().value) {
                for (auto&& detail : prop["details"].get_array().value) {
                    std::cout << "  поле " << prop["propertyName"].get_string().value << ": "
                              << detail["operatorName"].get_string().value << " — "
                              << detail["reason"].get_string().value << std::endl;
                }
            }
        }
    }
}
''',
}}

# Полное правило: шаблон артикула, длина названия, список категорий, склады.
FULL_PY = '''
full = {
    "bsonType": "object",
    "required": ["sku", "title", "category", "price"],
    "properties": {
        "sku": {"bsonType": "string", "pattern": "^SKU-[A-Z]{2}-[0-9]{3}$"},
        "title": {"bsonType": "string", "minLength": 3},
        "category": {"enum": ["ноутбуки", "смартфоны", "периферия", "комплектующие", "аксессуары"]},
        "price": {"bsonType": "number", "minimum": 1},
        "stock": {
            "bsonType": "array",
            "items": {
                "bsonType": "object",
                "required": ["warehouse", "qty"],
                "properties": {"qty": {"bsonType": "number", "minimum": 0}},
            },
        },
    },
}
'''

# принят 1-й и последний, остальные пять отклонены
EXAMPLES["3.1"]["keywords"] = {"caption": "ключевые слова правила", "plain": {
    "python": '''
from pymongo.errors import WriteError
''' + FULL_PY + '''
sandbox.drop_collection("checked")
checked = sandbox.create_collection("checked", validator={"$jsonSchema": full})

cable = {"sku": "SKU-AC-034", "title": "Кабель HDMI 2 м", "category": "аксессуары", "price": 990,
         "stock": [{"warehouse": "Москва-1", "qty": 15}]}
candidates = [
    ("всё по правилу", cable),
    ("категория не из списка", {**cable, "category": "кабели"}),
    ("артикул не по шаблону", {**cable, "sku": "AC-034"}),
    ("название короче трёх знаков", {**cable, "title": "ТВ"}),
    ("на складе нет количества", {**cable, "stock": [{"warehouse": "Москва-1"}]}),
    ("количество меньше нуля", {**cable, "stock": [{"warehouse": "Москва-1", "qty": -2}]}),
    ("поле, которого нет в правиле", {**cable, "color": "чёрный"}),
]
for label, doc in candidates:
    try:
        checked.insert_one(doc)
        print("принят:  ", label)
    except WriteError:
        print("отклонён:", label)
''',
    "ruby": '''
full = {
  "bsonType" => "object",
  "required" => ["sku", "title", "category", "price"],
  "properties" => {
    "sku" => { "bsonType" => "string", "pattern" => "^SKU-[A-Z]{2}-[0-9]{3}$" },
    "title" => { "bsonType" => "string", "minLength" => 3 },
    "category" => { "enum" => ["ноутбуки", "смартфоны", "периферия", "комплектующие", "аксессуары"] },
    "price" => { "bsonType" => "number", "minimum" => 1 },
    "stock" => {
      "bsonType" => "array",
      "items" => {
        "bsonType" => "object",
        "required" => ["warehouse", "qty"],
        "properties" => { "qty" => { "bsonType" => "number", "minimum" => 0 } },
      },
    },
  },
}

sandbox[:checked].drop
checked = sandbox[:checked, validator: { "$jsonSchema" => full }]
checked.create

cable = { "sku" => "SKU-AC-034", "title" => "Кабель HDMI 2 м", "category" => "аксессуары", "price" => 990,
          "stock" => [{ "warehouse" => "Москва-1", "qty" => 15 }] }
candidates = [
  ["всё по правилу", cable],
  ["категория не из списка", cable.merge("category" => "кабели")],
  ["артикул не по шаблону", cable.merge("sku" => "AC-034")],
  ["название короче трёх знаков", cable.merge("title" => "ТВ")],
  ["на складе нет количества", cable.merge("stock" => [{ "warehouse" => "Москва-1" }])],
  ["количество меньше нуля", cable.merge("stock" => [{ "warehouse" => "Москва-1", "qty" => -2 }])],
  ["поле, которого нет в правиле", cable.merge("color" => "чёрный")],
]
candidates.each do |label, doc|
  begin
    checked.insert_one(doc)
    puts "принят:   " + label
  rescue Mongo::Error::OperationFailure
    puts "отклонён: " + label
  end
end
''',
    "go": '''
full := bson.D{
    {Key: "bsonType", Value: "object"},
    {Key: "required", Value: bson.A{"sku", "title", "category", "price"}},
    {Key: "properties", Value: bson.D{
        {Key: "sku", Value: bson.D{{Key: "bsonType", Value: "string"}, {Key: "pattern", Value: "^SKU-[A-Z]{2}-[0-9]{3}$"}}},
        {Key: "title", Value: bson.D{{Key: "bsonType", Value: "string"}, {Key: "minLength", Value: 3}}},
        {Key: "category", Value: bson.D{{Key: "enum", Value: bson.A{"ноутбуки", "смартфоны", "периферия", "комплектующие", "аксессуары"}}}},
        {Key: "price", Value: bson.D{{Key: "bsonType", Value: "number"}, {Key: "minimum", Value: 1}}},
        {Key: "stock", Value: bson.D{
            {Key: "bsonType", Value: "array"},
            {Key: "items", Value: bson.D{
                {Key: "bsonType", Value: "object"},
                {Key: "required", Value: bson.A{"warehouse", "qty"}},
                {Key: "properties", Value: bson.D{
                    {Key: "qty", Value: bson.D{{Key: "bsonType", Value: "number"}, {Key: "minimum", Value: 0}}},
                }},
            }},
        }},
    }},
}

sandbox.Collection("checked").Drop(ctx)
sandbox.CreateCollection(ctx, "checked",
    options.CreateCollection().SetValidator(bson.D{{Key: "$jsonSchema", Value: full}}))
checked := sandbox.Collection("checked")

// base — товар, который проходит правило; with возвращает его копию,
// где одно поле заменено или добавлено
base := func() bson.D {
    return bson.D{
        {Key: "sku", Value: "SKU-AC-034"},
        {Key: "title", Value: "Кабель HDMI 2 м"},
        {Key: "category", Value: "аксессуары"},
        {Key: "price", Value: 990},
        {Key: "stock", Value: bson.A{bson.D{{Key: "warehouse", Value: "Москва-1"}, {Key: "qty", Value: 15}}}}}
}
with := func(key string, value any) bson.D {
    doc := base()
    for i := range doc {
        if doc[i].Key == key {
            doc[i].Value = value
            return doc
        }
    }
    return append(doc, bson.E{Key: key, Value: value})
}
candidates := []struct {
    label string
    doc   bson.D
}{
    {"всё по правилу", base()},
    {"категория не из списка", with("category", "кабели")},
    {"артикул не по шаблону", with("sku", "AC-034")},
    {"название короче трёх знаков", with("title", "ТВ")},
    {"на складе нет количества", with("stock", bson.A{bson.D{{Key: "warehouse", Value: "Москва-1"}}})},
    {"количество меньше нуля", with("stock", bson.A{bson.D{{Key: "warehouse", Value: "Москва-1"}, {Key: "qty", Value: -2}}})},
    {"поле, которого нет в правиле", with("color", "чёрный")},
}
for _, c := range candidates {
    if _, err := checked.InsertOne(ctx, c.doc); err != nil {
        fmt.Println("отклонён:", c.label)
    } else {
        fmt.Println("принят:  ", c.label)
    }
}
''',
    "cpp": '''
auto full = make_document(
    kvp("bsonType", "object"),
    kvp("required", make_array("sku", "title", "category", "price")),
    kvp("properties", make_document(
        kvp("sku", make_document(kvp("bsonType", "string"), kvp("pattern", "^SKU-[A-Z]{2}-[0-9]{3}$"))),
        kvp("title", make_document(kvp("bsonType", "string"), kvp("minLength", 3))),
        kvp("category", make_document(kvp("enum", make_array("ноутбуки", "смартфоны", "периферия", "комплектующие", "аксессуары")))),
        kvp("price", make_document(kvp("bsonType", "number"), kvp("minimum", 1))),
        kvp("stock", make_document(
            kvp("bsonType", "array"),
            kvp("items", make_document(
                kvp("bsonType", "object"),
                kvp("required", make_array("warehouse", "qty")),
                kvp("properties", make_document(kvp("qty", make_document(kvp("bsonType", "number"), kvp("minimum", 0))))))))))));

sandbox["checked"].drop();
auto checked = sandbox.create_collection("checked",
    make_document(kvp("validator", make_document(kvp("$jsonSchema", full.view())))));

// верный товар; остальные кандидаты отличаются от него одним полем
auto stock = [](int qty) { return make_array(make_document(kvp("warehouse", "Москва-1"), kvp("qty", qty))); };
std::vector<std::pair<std::string, bsoncxx::document::value>> candidates;
candidates.emplace_back("всё по правилу", make_document(
    kvp("sku", "SKU-AC-034"), kvp("title", "Кабель HDMI 2 м"), kvp("category", "аксессуары"), kvp("price", 990), kvp("stock", stock(15))));
candidates.emplace_back("категория не из списка", make_document(
    kvp("sku", "SKU-AC-034"), kvp("title", "Кабель HDMI 2 м"), kvp("category", "кабели"), kvp("price", 990), kvp("stock", stock(15))));
candidates.emplace_back("артикул не по шаблону", make_document(
    kvp("sku", "AC-034"), kvp("title", "Кабель HDMI 2 м"), kvp("category", "аксессуары"), kvp("price", 990), kvp("stock", stock(15))));
candidates.emplace_back("название короче трёх знаков", make_document(
    kvp("sku", "SKU-AC-034"), kvp("title", "ТВ"), kvp("category", "аксессуары"), kvp("price", 990), kvp("stock", stock(15))));
candidates.emplace_back("на складе нет количества", make_document(
    kvp("sku", "SKU-AC-034"), kvp("title", "Кабель HDMI 2 м"), kvp("category", "аксессуары"), kvp("price", 990),
    kvp("stock", make_array(make_document(kvp("warehouse", "Москва-1"))))));
candidates.emplace_back("количество меньше нуля", make_document(
    kvp("sku", "SKU-AC-034"), kvp("title", "Кабель HDMI 2 м"), kvp("category", "аксессуары"), kvp("price", 990), kvp("stock", stock(-2))));
candidates.emplace_back("поле, которого нет в правиле", make_document(
    kvp("sku", "SKU-AC-034"), kvp("title", "Кабель HDMI 2 м"), kvp("category", "аксессуары"), kvp("price", 990), kvp("stock", stock(15)),
    kvp("color", "чёрный")));

for (const auto& [label, doc] : candidates) {
    try {
        checked.insert_one(doc.view());
        std::cout << "принят:   " << label << std::endl;
    } catch (const mongocxx::operation_exception&) {
        std::cout << "отклонён: " << label << std::endl;
    }
}
''',
}}

# 22 товара, 1 не подходит; strict — отказ; moderate — сумка обновлена, ноутбук отклонён
EXAMPLES["3.1"]["level"] = {"caption": "правило для коллекции с данными", "plain": {
    "python": '''
from pymongo.errors import WriteError

box.insert_one({"_id": "p-901", "sku": "SKU-AC-040", "title": "Сумка для ноутбука",
                "category": "аксессуары", "price": "1 290"})

sandbox.command("collMod", "products", validator={"$jsonSchema": schema}, validationLevel="strict")
print("товаров в песочнице:    ", box.count_documents({}))
print("не подходят под правило:", box.count_documents({"$nor": [{"$jsonSchema": schema}]}))

try:
    box.update_one({"_id": "p-901"}, {"$set": {"brand": "OEM"}})
    print("strict: бренд сумки записан")
except WriteError as e:
    print("strict: бренд сумки не записан, код ошибки", e.code)

sandbox.command("collMod", "products", validationLevel="moderate")
box.update_one({"_id": "p-901"}, {"$set": {"brand": "OEM"}})
print("moderate: бренд сумки записан")

try:
    box.update_one({"_id": "p-001"}, {"$set": {"price": 0}})
    print("moderate: цена ноутбука 0 записана")
except WriteError as e:
    print("moderate: цена ноутбука 0 не записана, код ошибки", e.code)
''',
    "ruby": '''
box.insert_one({ "_id" => "p-901", "sku" => "SKU-AC-040", "title" => "Сумка для ноутбука",
                 "category" => "аксессуары", "price" => "1 290" })

sandbox.command(collMod: "products", validator: { "$jsonSchema" => schema }, validationLevel: "strict")
puts "товаров в песочнице:     " + box.count_documents({}).to_s
puts "не подходят под правило: " + box.count_documents({ "$nor" => [{ "$jsonSchema" => schema }] }).to_s

begin
  box.update_one({ "_id" => "p-901" }, { "$set" => { "brand" => "OEM" } })
  puts "strict: бренд сумки записан"
rescue Mongo::Error::OperationFailure => e
  puts "strict: бренд сумки не записан, код ошибки #{e.code}"
end

sandbox.command(collMod: "products", validationLevel: "moderate")
box.update_one({ "_id" => "p-901" }, { "$set" => { "brand" => "OEM" } })
puts "moderate: бренд сумки записан"

begin
  box.update_one({ "_id" => "p-001" }, { "$set" => { "price" => 0 } })
  puts "moderate: цена ноутбука 0 записана"
rescue Mongo::Error::OperationFailure => e
  puts "moderate: цена ноутбука 0 не записана, код ошибки #{e.code}"
end
''',
    "go": '''
box.InsertOne(ctx, bson.D{
    {Key: "_id", Value: "p-901"},
    {Key: "sku", Value: "SKU-AC-040"},
    {Key: "title", Value: "Сумка для ноутбука"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: "1 290"}})

sandbox.RunCommand(ctx, bson.D{
    {Key: "collMod", Value: "products"},
    {Key: "validator", Value: bson.D{{Key: "$jsonSchema", Value: schema}}},
    {Key: "validationLevel", Value: "strict"}})
vsego, _ := box.CountDocuments(ctx, bson.D{})
ne, _ := box.CountDocuments(ctx, bson.D{{Key: "$nor", Value: bson.A{bson.D{{Key: "$jsonSchema", Value: schema}}}}})
fmt.Println("товаров в песочнице:    ", vsego)
fmt.Println("не подходят под правило:", ne)

var we mongo.WriteException
_, err := box.UpdateOne(ctx, bson.D{{Key: "_id", Value: "p-901"}},
    bson.D{{Key: "$set", Value: bson.D{{Key: "brand", Value: "OEM"}}}})
if errors.As(err, &we) {
    fmt.Println("strict: бренд сумки не записан, код ошибки", we.WriteErrors[0].Code)
} else {
    fmt.Println("strict: бренд сумки записан")
}

sandbox.RunCommand(ctx, bson.D{
    {Key: "collMod", Value: "products"},
    {Key: "validationLevel", Value: "moderate"}})
box.UpdateOne(ctx, bson.D{{Key: "_id", Value: "p-901"}},
    bson.D{{Key: "$set", Value: bson.D{{Key: "brand", Value: "OEM"}}}})
fmt.Println("moderate: бренд сумки записан")

_, err = box.UpdateOne(ctx, bson.D{{Key: "_id", Value: "p-001"}},
    bson.D{{Key: "$set", Value: bson.D{{Key: "price", Value: 0}}}})
if errors.As(err, &we) {
    fmt.Println("moderate: цена ноутбука 0 не записана, код ошибки", we.WriteErrors[0].Code)
} else {
    fmt.Println("moderate: цена ноутбука 0 записана")
}
''',
    "cpp": '''
box.insert_one(make_document(
    kvp("_id", "p-901"),
    kvp("sku", "SKU-AC-040"),
    kvp("title", "Сумка для ноутбука"),
    kvp("category", "аксессуары"),
    kvp("price", "1 290")));

sandbox.run_command(make_document(
    kvp("collMod", "products"),
    kvp("validator", make_document(kvp("$jsonSchema", schema.view()))),
    kvp("validationLevel", "strict")));
std::cout << "товаров в песочнице:     " << box.count_documents(make_document()) << std::endl;
std::cout << "не подходят под правило: "
          << box.count_documents(make_document(kvp("$nor", make_array(make_document(kvp("$jsonSchema", schema.view()))))))
          << std::endl;

try {
    box.update_one(make_document(kvp("_id", "p-901")),
                   make_document(kvp("$set", make_document(kvp("brand", "OEM")))));
    std::cout << "strict: бренд сумки записан" << std::endl;
} catch (const mongocxx::operation_exception& e) {
    std::cout << "strict: бренд сумки не записан, код ошибки " << e.code().value() << std::endl;
}

sandbox.run_command(make_document(kvp("collMod", "products"), kvp("validationLevel", "moderate")));
box.update_one(make_document(kvp("_id", "p-901")),
               make_document(kvp("$set", make_document(kvp("brand", "OEM")))));
std::cout << "moderate: бренд сумки записан" << std::endl;

try {
    box.update_one(make_document(kvp("_id", "p-001")),
                   make_document(kvp("$set", make_document(kvp("price", 0)))));
    std::cout << "moderate: цена ноутбука 0 записана" << std::endl;
} catch (const mongocxx::operation_exception& e) {
    std::cout << "moderate: цена ноутбука 0 не записана, код ошибки " << e.code().value() << std::endl;
}
''',
}}

# warn: товар с ценой -1 записан, не подходят 2; настройки moderate / warn
EXAMPLES["3.1"]["warn"] = {"caption": "предупреждение вместо отказа", "plain": {
    "python": '''
sandbox.command("collMod", "products", validationAction="warn")

box.insert_one({"_id": "p-902", "sku": "SKU-AC-041", "title": "Сумка-чехол",
                "category": "аксессуары", "price": -1})
print("товар с ценой -1 записан")
print("не подходят под правило:", box.count_documents({"$nor": [{"$jsonSchema": schema}]}))

info = next(sandbox.list_collections(filter={"name": "products"}))
print("validationLevel: ", info["options"]["validationLevel"])
print("validationAction:", info["options"]["validationAction"])
''',
    "ruby": '''
sandbox.command(collMod: "products", validationAction: "warn")

box.insert_one({ "_id" => "p-902", "sku" => "SKU-AC-041", "title" => "Сумка-чехол",
                 "category" => "аксессуары", "price" => -1 })
puts "товар с ценой -1 записан"
puts "не подходят под правило: " + box.count_documents({ "$nor" => [{ "$jsonSchema" => schema }] }).to_s

info = sandbox.list_collections(filter: { name: "products" }).first
puts "validationLevel:  " + info["options"]["validationLevel"]
puts "validationAction: " + info["options"]["validationAction"]
''',
    "go": '''
sandbox.RunCommand(ctx, bson.D{
    {Key: "collMod", Value: "products"},
    {Key: "validationAction", Value: "warn"}})

box.InsertOne(ctx, bson.D{
    {Key: "_id", Value: "p-902"},
    {Key: "sku", Value: "SKU-AC-041"},
    {Key: "title", Value: "Сумка-чехол"},
    {Key: "category", Value: "аксессуары"},
    {Key: "price", Value: -1}})
fmt.Println("товар с ценой -1 записан")
ne, _ := box.CountDocuments(ctx, bson.D{{Key: "$nor", Value: bson.A{bson.D{{Key: "$jsonSchema", Value: schema}}}}})
fmt.Println("не подходят под правило:", ne)

specs, _ := sandbox.ListCollectionSpecifications(ctx, bson.D{{Key: "name", Value: "products"}})
fmt.Println("validationLevel: ", specs[0].Options.Lookup("validationLevel").StringValue())
fmt.Println("validationAction:", specs[0].Options.Lookup("validationAction").StringValue())
''',
    "cpp": '''
sandbox.run_command(make_document(kvp("collMod", "products"), kvp("validationAction", "warn")));

box.insert_one(make_document(
    kvp("_id", "p-902"),
    kvp("sku", "SKU-AC-041"),
    kvp("title", "Сумка-чехол"),
    kvp("category", "аксессуары"),
    kvp("price", -1)));
std::cout << "товар с ценой -1 записан" << std::endl;
std::cout << "не подходят под правило: "
          << box.count_documents(make_document(kvp("$nor", make_array(make_document(kvp("$jsonSchema", schema.view()))))))
          << std::endl;

for (auto&& info : sandbox.list_collections(make_document(kvp("name", "products")))) {
    auto opts = info["options"].get_document().value;
    std::cout << "validationLevel:  " << opts["validationLevel"].get_string().value << std::endl;
    std::cout << "validationAction: " << opts["validationAction"].get_string().value << std::endl;
}
''',
}}

ERRORS["3.1"] = [
    ('<code>"price": {"type": "integer"}</code>',
     "Сервер не создаёт коллекцию: <code>$jsonSchema type 'integer' is not currently supported</code>",
     '<code>"bsonType": "int"</code> или <code>"bsonType": "number"</code>'),
    ('<code>"price": {"bsonType": "int"}</code>',
     {"python": "Цена <code>1990.0</code> и число больше 2 147 483 647 отклоняются: это <code>double</code> и <code>long</code>",
      "ruby": "Цена <code>1990.0</code> и число больше 2 147 483 647 отклоняются: это <code>double</code> и <code>long</code>",
      "go": "Цена <code>1990.0</code> и любое значение типа <code>int64</code> отклоняются: это <code>double</code> и <code>long</code>",
      "cpp": "Цена <code>1990.0</code> и любое значение типа <code>std::int64_t</code> отклоняются: это <code>double</code> и <code>long</code>"},
     '<code>"bsonType": "number"</code> — любой числовой тип'),
    ("Поле описано в <code>properties</code>, но не перечислено в <code>required</code>",
     "Документ без этого поля записывается: правило поля проверяется, только если поле есть",
     "Добавить имя поля в <code>required</code>"),
    ('<code>"additionalProperties": false</code>, а <code>_id</code> в <code>properties</code> нет',
     "Сервер отклоняет каждый документ: <code>_id</code> для правила — лишнее поле",
     '<code>"_id": {}</code> или <code>"_id": {"bsonType": "objectId"}</code> в <code>properties</code>'),
    ({"python": "<code>create_collection</code> для коллекции, которая уже есть",
      "ruby": "<code>create</code> для коллекции, которая уже есть",
      "go": "<code>CreateCollection</code> для коллекции, которая уже есть",
      "cpp": "<code>create_collection</code> для коллекции, которая уже есть"},
     {"python": "Исключение <code>CollectionInvalid</code>, правило не меняется",
      "ruby": "Ошибка <code>NamespaceExists</code> (код 48), если параметры отличаются; правило не меняется",
      "go": "Ошибка <code>NamespaceExists</code> (код 48), если параметры отличаются; правило не меняется",
      "cpp": "Ошибка <code>NamespaceExists</code> (код 48), если параметры отличаются; правило не меняется"},
     "Команда <code>collMod</code> с новым <code>validator</code>"),
    ("Правило включено <code>collMod</code>, и документы коллекции считаются проверенными",
     "Старые документы не перепроверяются; неподходящие остаются в коллекции",
     'Найти их фильтром <code>{"$nor": [{"$jsonSchema": …}]}</code> и исправить'),
    ('<code>"validationAction": "warn"</code> в рабочей коллекции',
     "Ошибочные документы записываются, предупреждения о них есть только в журнале сервера",
     '<code>"warn"</code> — на время проверки нового правила, затем <code>"error"</code>'),
]

CHEATS["3.1"] = [
    ("Правило: обязательные поля и типы", {
        "python": ['{"bsonType": "object",', ' "required": ["title", "price"],', ' "properties": {"price": {"bsonType": "number", "minimum": 1}}}'],
        "ruby": ['{ "bsonType" => "object",', '  "required" => ["title", "price"],', '  "properties" => { "price" => { "bsonType" => "number", "minimum" => 1 } } }'],
        "go": ['bson.D{{Key: "bsonType", Value: "object"},', '  {Key: "required", Value: bson.A{"title", "price"}},', '  {Key: "properties", Value: bson.D{...}}}'],
        "cpp": ['make_document(kvp("bsonType", "object"),', '  kvp("required", make_array("title", "price")),', '  kvp("properties", make_document(...)))']}),
    ("Проверить данные правилом", {
        "python": ['coll.count_documents({"$nor": [{"$jsonSchema": schema}]})'],
        "ruby": ['coll.count_documents({ "$nor" => [{ "$jsonSchema" => schema }] })'],
        "go": ['coll.CountDocuments(ctx, bson.D{{Key: "$nor",', '  Value: bson.A{bson.D{{Key: "$jsonSchema", Value: schema}}}}})'],
        "cpp": ['coll.count_documents(make_document(kvp("$nor",', '  make_array(make_document(kvp("$jsonSchema", schema.view()))))))']}),
    ("Коллекция с правилом", {
        "python": ['db.create_collection("checked",', '    validator={"$jsonSchema": schema})'],
        "ruby": ['db[:checked, validator: { "$jsonSchema" => schema }].create'],
        "go": ['db.CreateCollection(ctx, "checked", options.CreateCollection().', '  SetValidator(bson.D{{Key: "$jsonSchema", Value: schema}}))'],
        "cpp": ['db.create_collection("checked", make_document(kvp("validator",', '  make_document(kvp("$jsonSchema", schema.view())))));']}),
    ("Правило для коллекции с данными", {
        "python": ['db.command("collMod", "products",', '    validator={"$jsonSchema": schema}, validationLevel="moderate")'],
        "ruby": ['db.command(collMod: "products", validator: { "$jsonSchema" => schema },', '           validationLevel: "moderate")'],
        "go": ['db.RunCommand(ctx, bson.D{{Key: "collMod", Value: "products"},', '  {Key: "validator", Value: ...}, {Key: "validationLevel", Value: "moderate"}})'],
        "cpp": ['db.run_command(make_document(kvp("collMod", "products"),', '  kvp("validator", ...), kvp("validationLevel", "moderate")));']}),
    ("Предупреждать вместо отказа", {
        "python": ['db.command("collMod", "products", validationAction="warn")'],
        "ruby": ['db.command(collMod: "products", validationAction: "warn")'],
        "go": ['db.RunCommand(ctx, bson.D{{Key: "collMod", Value: "products"},', '  {Key: "validationAction", Value: "warn"}})'],
        "cpp": ['db.run_command(make_document(kvp("collMod", "products"),', '  kvp("validationAction", "warn")));']}),
    ("Причины отказа", {
        "python": ['except WriteError as e:', '    e.details["errInfo"]["details"]'],
        "ruby": ['rescue Mongo::Error::OperationFailure => e', '  e.details["details"]'],
        "go": ['errors.As(err, &we)', 'bson.Unmarshal(we.WriteErrors[0].Details, &info)'],
        "cpp": ['catch (const mongocxx::operation_exception& e)', '  e.raw_server_error()->view()["writeErrors"][0]["errInfo"]']}),
]

# ── 3.2 Индексы: одиночные, составные, уникальные ─────────────────────────
#
# Заготовка главы (examples.EXTRAS, TOP_EXTRAS) открывает journal = sandbox.events,
# clients = sandbox.customers и объявляет функцию plan — стадии выбранного плана.

EXAMPLES["3.2"] = {}

# 1200 событий; один индекс _id_
EXAMPLES["3.2"]["copy"] = {"caption": "копия журнала и её индексы", "plain": {
    "python": '''
journal.drop()
journal.insert_many(events.find())
print("событий в копии:", journal.count_documents({}))

for ix in journal.list_indexes():
    print("индекс", ix["name"], dict(ix["key"]))
''',
    "ruby": '''
journal.drop
journal.insert_many(events.find.to_a)
puts "событий в копии: " + journal.count_documents({}).to_s

journal.indexes.each { |ix| puts "индекс " + ix["name"] + " " + ix["key"].to_s }
''',
    "go": '''
journal.Drop(ctx)
var all []bson.D
cursor, _ := events.Find(ctx, bson.D{})
cursor.All(ctx, &all)
docs := make([]any, len(all))
for i := range all {
    docs[i] = all[i]
}
journal.InsertMany(ctx, docs)
n, _ := journal.CountDocuments(ctx, bson.D{})
fmt.Println("событий в копии:", n)

list, _ := journal.Indexes().List(ctx)
for list.Next(ctx) {
    key, _ := bson.MarshalExtJSON(list.Current.Lookup("key").Document(), false, false)
    fmt.Println("индекс", list.Current.Lookup("name").StringValue(), string(key))
}
''',
    "cpp": '''
journal.drop();
std::vector<bsoncxx::document::value> all;
for (auto&& doc : events.find(make_document())) all.emplace_back(doc);
journal.insert_many(all);
std::cout << "событий в копии: " << journal.count_documents(make_document()) << std::endl;

for (auto&& ix : journal.list_indexes()) {
    std::cout << "индекс " << ix["name"].get_string().value << " "
              << bsoncxx::to_json(ix["key"].get_document().value, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;
}
''',
}}

# COLLSCAN → service_1 → FETCH → IXSCAN service_1; 232
EXAMPLES["3.2"]["single"] = {"caption": "индекс по одному полю", "plain": {
    "python": '''
print("до индекса:   ", plan(journal, {"service": "payments"}))

name = journal.create_index("service")
print("создан индекс:", name)

print("после индекса:", plan(journal, {"service": "payments"}))
print("событий payments:", journal.count_documents({"service": "payments"}))
''',
    "ruby": '''
puts "до индекса:    " + plan(journal, { "service" => "payments" })

journal.indexes.create_one({ "service" => 1 })
puts "создан индекс: " + journal.indexes.get({ "service" => 1 })["name"]

puts "после индекса: " + plan(journal, { "service" => "payments" })
puts "событий payments: " + journal.count_documents({ "service" => "payments" }).to_s
''',
    "go": '''
fmt.Println("до индекса:   ", plan(journal, bson.D{{Key: "service", Value: "payments"}}, nil))

name, _ := journal.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "service", Value: 1}}})
fmt.Println("создан индекс:", name)

fmt.Println("после индекса:", plan(journal, bson.D{{Key: "service", Value: "payments"}}, nil))
n, _ := journal.CountDocuments(ctx, bson.D{{Key: "service", Value: "payments"}})
fmt.Println("событий payments:", n)
''',
    "cpp": '''
std::cout << "до индекса:    " << plan(sandbox, "events", make_document(kvp("service", "payments"))) << std::endl;

auto created = journal.create_index(make_document(kvp("service", 1)));
std::cout << "создан индекс: " << created.view()["name"].get_string().value << std::endl;

std::cout << "после индекса: " << plan(sandbox, "events", make_document(kvp("service", "payments"))) << std::endl;
std::cout << "событий payments: " << journal.count_documents(make_document(kvp("service", "payments"))) << std::endl;
''',
}}

# service_1_status_1; оба поля — IXSCAN составного; только status — COLLSCAN; сортировка по status без SORT
EXAMPLES["3.2"]["compound"] = {"caption": "составной индекс", "plain": {
    "python": '''
name = journal.create_index([("service", 1), ("status", 1)])
print("создан индекс:", name)

print("service и status:          ", plan(journal, {"service": "payments", "status": {"$gte": 500}}))
print("только status:             ", plan(journal, {"status": 503}))
print("service, порядок по status:", plan(journal, {"service": "payments"}, [("status", 1)]))
''',
    "ruby": '''
journal.indexes.create_one({ "service" => 1, "status" => 1 })
puts "создан индекс: " + journal.indexes.get({ "service" => 1, "status" => 1 })["name"]

puts "service и status:           " + plan(journal, { "service" => "payments", "status" => { "$gte" => 500 } })
puts "только status:              " + plan(journal, { "status" => 503 })
puts "service, порядок по status: " + plan(journal, { "service" => "payments" }, { "status" => 1 })
''',
    "go": '''
name, _ := journal.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys: bson.D{{Key: "service", Value: 1}, {Key: "status", Value: 1}}})
fmt.Println("создан индекс:", name)

fmt.Println("service и status:          ",
    plan(journal, bson.D{{Key: "service", Value: "payments"}, {Key: "status", Value: bson.D{{Key: "$gte", Value: 500}}}}, nil))
fmt.Println("только status:             ", plan(journal, bson.D{{Key: "status", Value: 503}}, nil))
fmt.Println("service, порядок по status:",
    plan(journal, bson.D{{Key: "service", Value: "payments"}}, bson.D{{Key: "status", Value: 1}}))
''',
    "cpp": '''
auto created = journal.create_index(make_document(kvp("service", 1), kvp("status", 1)));
std::cout << "создан индекс: " << created.view()["name"].get_string().value << std::endl;

std::cout << "service и status:           "
          << plan(sandbox, "events", make_document(kvp("service", "payments"), kvp("status", make_document(kvp("$gte", 500)))))
          << std::endl;
std::cout << "только status:              " << plan(sandbox, "events", make_document(kvp("status", 503))) << std::endl;
std::cout << "service, порядок по status: "
          << plan(sandbox, "events", make_document(kvp("service", "payments")), make_document(kvp("status", 1)))
          << std::endl;
''',
}}

# остались _id_ и service_1_status_1; только service — IXSCAN составного; порядок по ts — SORT
EXAMPLES["3.2"]["drop"] = {"caption": "удаление лишнего индекса", "plain": {
    "python": '''
journal.drop_index("service_1")
for ix in journal.list_indexes():
    print("индекс", ix["name"], dict(ix["key"]))

print("только service:        ", plan(journal, {"service": "payments"}))
print("service, порядок по ts:", plan(journal, {"service": "payments"}, [("ts", -1)]))
''',
    "ruby": '''
journal.indexes.drop_one("service_1")
journal.indexes.each { |ix| puts "индекс " + ix["name"] + " " + ix["key"].to_s }

puts "только service:         " + plan(journal, { "service" => "payments" })
puts "service, порядок по ts: " + plan(journal, { "service" => "payments" }, { "ts" => -1 })
''',
    "go": '''
journal.Indexes().DropOne(ctx, "service_1")
list, _ := journal.Indexes().List(ctx)
for list.Next(ctx) {
    key, _ := bson.MarshalExtJSON(list.Current.Lookup("key").Document(), false, false)
    fmt.Println("индекс", list.Current.Lookup("name").StringValue(), string(key))
}

fmt.Println("только service:        ", plan(journal, bson.D{{Key: "service", Value: "payments"}}, nil))
fmt.Println("service, порядок по ts:",
    plan(journal, bson.D{{Key: "service", Value: "payments"}}, bson.D{{Key: "ts", Value: -1}}))
''',
    "cpp": '''
journal.indexes().drop_one("service_1");
for (auto&& ix : journal.list_indexes()) {
    std::cout << "индекс " << ix["name"].get_string().value << " "
              << bsoncxx::to_json(ix["key"].get_document().value, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;
}

std::cout << "только service:         " << plan(sandbox, "events", make_document(kvp("service", "payments"))) << std::endl;
std::cout << "service, порядок по ts: "
          << plan(sandbox, "events", make_document(kvp("service", "payments")), make_document(kvp("ts", -1)))
          << std::endl;
''',
}}

# email_1; дубль отклонён 11000; покупателей 20
EXAMPLES["3.2"]["unique"] = {"caption": "уникальный индекс", "plain": {
    "python": '''
from pymongo.errors import DuplicateKeyError

clients.drop()
clients.insert_many(db["customers"].find())
print("создан индекс:", clients.create_index("email", unique=True))

try:
    clients.insert_one({"_id": "c-101", "name": "Ольга Кравец", "email": "user01@example.com", "city": "Ярославль"})
    print("Ольга Кравец записана")
except DuplicateKeyError as e:
    print("Ольга Кравец отклонена, код", e.code, "— уже есть", e.details["keyValue"])
print("покупателей:", clients.count_documents({}))
''',
    "ruby": '''
clients.drop
clients.insert_many(db[:customers].find.to_a)
clients.indexes.create_one({ "email" => 1 }, unique: true)
puts "создан индекс: " + clients.indexes.get({ "email" => 1 })["name"]

begin
  clients.insert_one({ "_id" => "c-101", "name" => "Ольга Кравец", "email" => "user01@example.com", "city" => "Ярославль" })
  puts "Ольга Кравец записана"
rescue Mongo::Error::OperationFailure => e
  puts "Ольга Кравец отклонена, код #{e.code} — уже есть #{e.document["writeErrors"][0]["keyValue"]}"
end
puts "покупателей: " + clients.count_documents({}).to_s
''',
    "go": '''
clients.Drop(ctx)
var all []bson.D
cursor, _ := db.Collection("customers").Find(ctx, bson.D{})
cursor.All(ctx, &all)
docs := make([]any, len(all))
for i := range all {
    docs[i] = all[i]
}
clients.InsertMany(ctx, docs)
name, _ := clients.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys:    bson.D{{Key: "email", Value: 1}},
    Options: options.Index().SetUnique(true)})
fmt.Println("создан индекс:", name)

_, err := clients.InsertOne(ctx, bson.D{
    {Key: "_id", Value: "c-101"},
    {Key: "name", Value: "Ольга Кравец"},
    {Key: "email", Value: "user01@example.com"},
    {Key: "city", Value: "Ярославль"}})
var we mongo.WriteException
if errors.As(err, &we) {
    fmt.Println("Ольга Кравец отклонена, код", we.WriteErrors[0].Code, "— уже есть", we.WriteErrors[0].Raw.Lookup("keyValue"))
} else {
    fmt.Println("Ольга Кравец записана")
}
n, _ := clients.CountDocuments(ctx, bson.D{})
fmt.Println("покупателей:", n)
''',
    "cpp": '''
clients.drop();
std::vector<bsoncxx::document::value> all;
for (auto&& doc : db["customers"].find(make_document())) all.emplace_back(doc);
clients.insert_many(all);
mongocxx::options::index unique;
unique.unique(true);
auto created = clients.create_index(make_document(kvp("email", 1)), unique);
std::cout << "создан индекс: " << created.view()["name"].get_string().value << std::endl;

try {
    clients.insert_one(make_document(kvp("_id", "c-101"), kvp("name", "Ольга Кравец"),
                                     kvp("email", "user01@example.com"), kvp("city", "Ярославль")));
    std::cout << "Ольга Кравец записана" << std::endl;
} catch (const mongocxx::operation_exception& e) {
    std::cout << "Ольга Кравец отклонена, код " << e.code().value() << " — уже есть "
              << bsoncxx::to_json(e.raw_server_error()->view()["writeErrors"][0]["keyValue"].get_document().value,
                                  bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;
}
std::cout << "покупателей: " << clients.count_documents(make_document()) << std::endl;
''',
}}

# city_1 не создан: 11000; индексы _id_, email_1
EXAMPLES["3.2"]["duplicates"] = {"caption": "уникальный индекс на данных с повторами", "plain": {
    "python": '''
from pymongo.errors import OperationFailure

print("городов:", len(clients.distinct("city")), "на", clients.count_documents({}), "покупателей")
try:
    clients.create_index("city", unique=True)
    print("индекс по city создан")
except OperationFailure as e:
    print("индекс по city не создан, код", e.code)
print("индексы:", [ix["name"] for ix in clients.list_indexes()])
''',
    "ruby": '''
puts "городов: #{clients.distinct("city").size} на #{clients.count_documents({})} покупателей"
begin
  clients.indexes.create_one({ "city" => 1 }, unique: true)
  puts "индекс по city создан"
rescue Mongo::Error::OperationFailure => e
  puts "индекс по city не создан, код #{e.code}"
end
puts "индексы: " + clients.indexes.map { |ix| ix["name"] }.to_s
''',
    "go": '''
cities, _ := clients.Distinct(ctx, "city", bson.D{}).Raw()
values, _ := cities.Values()
n, _ := clients.CountDocuments(ctx, bson.D{})
fmt.Println("городов:", len(values), "на", n, "покупателей")

_, err := clients.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys:    bson.D{{Key: "city", Value: 1}},
    Options: options.Index().SetUnique(true)})
var ce mongo.CommandError
if errors.As(err, &ce) {
    fmt.Println("индекс по city не создан, код", ce.Code)
} else {
    fmt.Println("индекс по city создан")
}

names := []string{}
list, _ := clients.Indexes().List(ctx)
for list.Next(ctx) {
    names = append(names, list.Current.Lookup("name").StringValue())
}
fmt.Println("индексы:", names)
''',
    "cpp": '''
auto cities = clients.distinct("city", make_document());
auto values = (*cities.begin())["values"].get_array().value;
std::cout << "городов: " << std::distance(values.begin(), values.end())
          << " на " << clients.count_documents(make_document()) << " покупателей" << std::endl;

mongocxx::options::index unique;
unique.unique(true);
try {
    clients.create_index(make_document(kvp("city", 1)), unique);
    std::cout << "индекс по city создан" << std::endl;
} catch (const mongocxx::operation_exception& e) {
    std::cout << "индекс по city не создан, код " << e.code().value() << std::endl;
}

std::cout << "индексы:";
for (auto&& ix : clients.list_indexes()) std::cout << " " << ix["name"].get_string().value;
std::cout << std::endl;
''',
}}

# второй без почты отклонён {email: null}; после частичного индекса — записан; дубль почты по-прежнему отклонён
EXAMPLES["3.2"]["partial"] = {"caption": "документ без поля и частичный индекс", "plain": {
    "python": '''
from pymongo.errors import DuplicateKeyError

clients.insert_one({"_id": "c-102", "name": "Андрей Носов", "city": "Казань"})
try:
    clients.insert_one({"_id": "c-103", "name": "Вера Лосева", "city": "Казань"})
    print("второй покупатель без почты записан")
except DuplicateKeyError as e:
    print("второй покупатель без почты отклонён — уже есть", e.details["keyValue"])

clients.drop_index("email_1")
clients.create_index("email", unique=True, partialFilterExpression={"email": {"$exists": True}})

clients.insert_one({"_id": "c-103", "name": "Вера Лосева", "city": "Казань"})
print("покупателей без почты:", clients.count_documents({"email": {"$exists": False}}))
try:
    clients.insert_one({"_id": "c-104", "name": "Ольга Кравец", "email": "user01@example.com"})
except DuplicateKeyError as e:
    print("повтор почты отклонён — уже есть", e.details["keyValue"])
''',
    "ruby": '''
clients.insert_one({ "_id" => "c-102", "name" => "Андрей Носов", "city" => "Казань" })
begin
  clients.insert_one({ "_id" => "c-103", "name" => "Вера Лосева", "city" => "Казань" })
  puts "второй покупатель без почты записан"
rescue Mongo::Error::OperationFailure => e
  puts "второй покупатель без почты отклонён — уже есть #{e.document["writeErrors"][0]["keyValue"]}"
end

clients.indexes.drop_one("email_1")
clients.indexes.create_one({ "email" => 1 }, unique: true,
                           partial_filter_expression: { "email" => { "$exists" => true } })

clients.insert_one({ "_id" => "c-103", "name" => "Вера Лосева", "city" => "Казань" })
puts "покупателей без почты: " + clients.count_documents({ "email" => { "$exists" => false } }).to_s
begin
  clients.insert_one({ "_id" => "c-104", "name" => "Ольга Кравец", "email" => "user01@example.com" })
rescue Mongo::Error::OperationFailure => e
  puts "повтор почты отклонён — уже есть #{e.document["writeErrors"][0]["keyValue"]}"
end
''',
    "go": '''
clients.InsertOne(ctx, bson.D{{Key: "_id", Value: "c-102"}, {Key: "name", Value: "Андрей Носов"}, {Key: "city", Value: "Казань"}})
_, err := clients.InsertOne(ctx, bson.D{{Key: "_id", Value: "c-103"}, {Key: "name", Value: "Вера Лосева"}, {Key: "city", Value: "Казань"}})
var we mongo.WriteException
if errors.As(err, &we) {
    fmt.Println("второй покупатель без почты отклонён — уже есть", we.WriteErrors[0].Raw.Lookup("keyValue"))
} else {
    fmt.Println("второй покупатель без почты записан")
}

clients.Indexes().DropOne(ctx, "email_1")
clients.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys: bson.D{{Key: "email", Value: 1}},
    Options: options.Index().SetUnique(true).
        SetPartialFilterExpression(bson.D{{Key: "email", Value: bson.D{{Key: "$exists", Value: true}}}})})

clients.InsertOne(ctx, bson.D{{Key: "_id", Value: "c-103"}, {Key: "name", Value: "Вера Лосева"}, {Key: "city", Value: "Казань"}})
n, _ := clients.CountDocuments(ctx, bson.D{{Key: "email", Value: bson.D{{Key: "$exists", Value: false}}}})
fmt.Println("покупателей без почты:", n)
_, err = clients.InsertOne(ctx, bson.D{{Key: "_id", Value: "c-104"}, {Key: "name", Value: "Ольга Кравец"}, {Key: "email", Value: "user01@example.com"}})
if errors.As(err, &we) {
    fmt.Println("повтор почты отклонён — уже есть", we.WriteErrors[0].Raw.Lookup("keyValue"))
}
''',
    "cpp": '''
auto key_value = [](const mongocxx::operation_exception& e) {
    return bsoncxx::to_json(e.raw_server_error()->view()["writeErrors"][0]["keyValue"].get_document().value,
                            bsoncxx::ExtendedJsonMode::k_relaxed);
};

clients.insert_one(make_document(kvp("_id", "c-102"), kvp("name", "Андрей Носов"), kvp("city", "Казань")));
try {
    clients.insert_one(make_document(kvp("_id", "c-103"), kvp("name", "Вера Лосева"), kvp("city", "Казань")));
    std::cout << "второй покупатель без почты записан" << std::endl;
} catch (const mongocxx::operation_exception& e) {
    std::cout << "второй покупатель без почты отклонён — уже есть " << key_value(e) << std::endl;
}

clients.indexes().drop_one("email_1");
auto has_email = make_document(kvp("email", make_document(kvp("$exists", true))));
mongocxx::options::index partial;
partial.unique(true);
partial.partial_filter_expression(has_email.view());
clients.create_index(make_document(kvp("email", 1)), partial);

clients.insert_one(make_document(kvp("_id", "c-103"), kvp("name", "Вера Лосева"), kvp("city", "Казань")));
std::cout << "покупателей без почты: "
          << clients.count_documents(make_document(kvp("email", make_document(kvp("$exists", false))))) << std::endl;
try {
    clients.insert_one(make_document(kvp("_id", "c-104"), kvp("name", "Ольга Кравец"), kvp("email", "user01@example.com")));
} catch (const mongocxx::operation_exception& e) {
    std::cout << "повтор почты отклонён — уже есть " << key_value(e) << std::endl;
}
''',
}}

ERRORS["3.2"] = [
    ("Индекс по <code>status</code> и <code>service</code> для запроса только по <code>service</code>",
     "План — <code>COLLSCAN</code>: <code>service</code> не первое поле индекса",
     "Первым в индексе ставить поле, которое есть во всех запросах: <code>service</code>, затем <code>status</code>"),
    ("Индексы по <code>service</code> и по <code>service</code> + <code>status</code> одновременно",
     "Первый лишний: запросы по <code>service</code> обслуживает префикс составного, а запись обновляет оба",
     "Удалить <code>service_1</code>"),
    ("Сортировка по полю, которого нет в индексе запроса",
     "В плане стадия <code>SORT</code>: документы сортируются в памяти после чтения",
     "Добавить поле сортировки в индекс после полей условия"),
    ("Уникальный индекс на коллекции, где значения уже повторяются",
     "Индекс не создаётся: ошибка 11000 при постройке",
     "Найти и устранить повторы, затем создать индекс"),
    ("Уникальный индекс по полю, которого нет в части документов",
     "Второй документ без поля отклонён: в индексе уже есть <code>null</code>",
     'Частичный индекс с <code>partialFilterExpression: {"email": {"$exists": true}}</code>'),
    ("Тот же ключ индекса с другими параметрами, например с <code>unique</code>",
     "Ошибка <code>IndexKeySpecsConflict</code> (код 86): параметры существующего индекса не меняются",
     "Удалить индекс и создать заново с новыми параметрами"),
    ("Удаление индекса <code>_id_</code>",
     "Ошибка <code>cannot drop _id index</code>",
     "Индекс по <code>_id</code> есть у каждой коллекции, удалить его нельзя"),
]

CHEATS["3.2"] = [
    ("Индекс по полю", {
        "python": ['coll.create_index("service")'],
        "ruby": ['coll.indexes.create_one({ "service" => 1 })'],
        "go": ['coll.Indexes().CreateOne(ctx, mongo.IndexModel{', '  Keys: bson.D{{Key: "service", Value: 1}}})'],
        "cpp": ['coll.create_index(make_document(kvp("service", 1)));']}),
    ("Составной индекс", {
        "python": ['coll.create_index([("service", 1), ("status", 1)])'],
        "ruby": ['coll.indexes.create_one({ "service" => 1, "status" => 1 })'],
        "go": ['Keys: bson.D{{Key: "service", Value: 1},', '            {Key: "status", Value: 1}}'],
        "cpp": ['coll.create_index(make_document(kvp("service", 1), kvp("status", 1)));']}),
    ("Уникальный индекс", {
        "python": ['coll.create_index("email", unique=True)'],
        "ruby": ['coll.indexes.create_one({ "email" => 1 }, unique: true)'],
        "go": ['Options: options.Index().SetUnique(true)'],
        "cpp": ['mongocxx::options::index o;', 'o.unique(true);']}),
    ("Частичный индекс", {
        "python": ['coll.create_index("email", unique=True,', '    partialFilterExpression={"email": {"$exists": True}})'],
        "ruby": ['coll.indexes.create_one({ "email" => 1 }, unique: true,', '  partial_filter_expression: { "email" => { "$exists" => true } })'],
        "go": ['options.Index().SetUnique(true).', '  SetPartialFilterExpression(bson.D{...})'],
        "cpp": ['o.partial_filter_expression(has_email.view());']}),
    ("Список и удаление", {
        "python": ['coll.list_indexes()', 'coll.drop_index("service_1")'],
        "ruby": ['coll.indexes.each { |ix| ... }', 'coll.indexes.drop_one("service_1")'],
        "go": ['coll.Indexes().List(ctx)', 'coll.Indexes().DropOne(ctx, "service_1")'],
        "cpp": ['coll.list_indexes()', 'coll.indexes().drop_one("service_1");']}),
    ("Повтор в уникальном индексе", {
        "python": ['except DuplicateKeyError as e:', '    e.code, e.details["keyValue"]'],
        "ruby": ['rescue Mongo::Error::OperationFailure => e', '  e.document["writeErrors"][0]["keyValue"]'],
        "go": ['errors.As(err, &we)', 'we.WriteErrors[0].Raw.Lookup("keyValue")'],
        "cpp": ['catch (const mongocxx::operation_exception& e)', '  e.raw_server_error()->view()["writeErrors"][0]["keyValue"]']}),
]

# ── 3.3 Как читать explain ─────────────────────────────────────────────────
#
# Заготовка главы открывает journal = sandbox.events и объявляет summary —
# стадии выбранного плана и три счётчика executionStats одной строкой.

EXAMPLES["3.3"] = {}

# разделы ответа; COLLSCAN; 42 / 0 / 1200
EXAMPLES["3.3"]["document"] = {"caption": "документ explain", "plain": {
    "python": '''
journal.drop()
journal.insert_many(events.find())

info = journal.find({"service": "payments", "status": {"$gte": 500}}).explain()
print("разделы ответа:", list(info))
print("выбранный план:", info["queryPlanner"]["winningPlan"]["stage"])

stats = info["executionStats"]
print("nReturned:        ", stats["nReturned"])
print("totalKeysExamined:", stats["totalKeysExamined"])
print("totalDocsExamined:", stats["totalDocsExamined"])
''',
    "ruby": '''
journal.drop
journal.insert_many(events.find.to_a)

info = journal.find({ "service" => "payments", "status" => { "$gte" => 500 } }).explain
puts "разделы ответа: " + info.keys.to_s
puts "выбранный план: " + info["queryPlanner"]["winningPlan"]["stage"]

stats = info["executionStats"]
puts "nReturned:         #{stats["nReturned"]}"
puts "totalKeysExamined: #{stats["totalKeysExamined"]}"
puts "totalDocsExamined: #{stats["totalDocsExamined"]}"
''',
    "go": '''
journal.Drop(ctx)
var all []bson.D
cursor, _ := events.Find(ctx, bson.D{})
cursor.All(ctx, &all)
docs := make([]any, len(all))
for i := range all {
    docs[i] = all[i]
}
journal.InsertMany(ctx, docs)

var info bson.Raw
sandbox.RunCommand(ctx, bson.D{
    {Key: "explain", Value: bson.D{
        {Key: "find", Value: "events"},
        {Key: "filter", Value: bson.D{{Key: "service", Value: "payments"}, {Key: "status", Value: bson.D{{Key: "$gte", Value: 500}}}}}}},
    {Key: "verbosity", Value: "executionStats"}}).Decode(&info)

elements, _ := info.Elements()
keys := []string{}
for _, el := range elements {
    keys = append(keys, el.Key())
}
fmt.Println("разделы ответа:", keys)
fmt.Println("выбранный план:", info.Lookup("queryPlanner", "winningPlan", "stage").StringValue())

stats := info.Lookup("executionStats").Document()
fmt.Println("nReturned:        ", stats.Lookup("nReturned").AsInt64())
fmt.Println("totalKeysExamined:", stats.Lookup("totalKeysExamined").AsInt64())
fmt.Println("totalDocsExamined:", stats.Lookup("totalDocsExamined").AsInt64())
''',
    "cpp": '''
journal.drop();
std::vector<bsoncxx::document::value> all;
for (auto&& doc : events.find(make_document())) all.emplace_back(doc);
journal.insert_many(all);

auto info = sandbox.run_command(make_document(
    kvp("explain", make_document(
        kvp("find", "events"),
        kvp("filter", make_document(kvp("service", "payments"), kvp("status", make_document(kvp("$gte", 500))))))),
    kvp("verbosity", "executionStats")));

std::cout << "разделы ответа:";
for (auto&& field : info.view()) std::cout << " " << field.key();
std::cout << std::endl;
std::cout << "выбранный план: " << info.view()["queryPlanner"]["winningPlan"]["stage"].get_string().value << std::endl;

auto stats = info.view()["executionStats"];
std::cout << "nReturned:         " << stats["nReturned"].get_int32().value << std::endl;
std::cout << "totalKeysExamined: " << stats["totalKeysExamined"].get_int32().value << std::endl;
std::cout << "totalDocsExamined: " << stats["totalDocsExamined"].get_int32().value << std::endl;
''',
}}

# два индекса; выбран составной 42/42/42; отклонён service_1
EXAMPLES["3.3"]["planner"] = {"caption": "выбранный и отклонённый планы", "plain": {
    "python": '''
journal.create_index("service")
journal.create_index([("service", 1), ("status", 1)])

filtr = {"service": "payments", "status": {"$gte": 500}}
print("выбран:", summary(journal, filter=filtr))

info = journal.find(filtr).explain()
for rejected in info["queryPlanner"]["rejectedPlans"]:
    stage = rejected.get("queryPlan", rejected)
    while "inputStage" in stage:
        stage = stage["inputStage"]
    print("отклонён план по индексу", stage["indexName"])
''',
    "ruby": '''
journal.indexes.create_one({ "service" => 1 })
journal.indexes.create_one({ "service" => 1, "status" => 1 })

filtr = { "service" => "payments", "status" => { "$gte" => 500 } }
puts "выбран: " + summary(journal, filter: filtr)

info = journal.find(filtr).explain
info["queryPlanner"]["rejectedPlans"].each do |rejected|
  stage = rejected["queryPlan"] || rejected
  stage = stage["inputStage"] while stage["inputStage"]
  puts "отклонён план по индексу " + stage["indexName"]
end
''',
    "go": '''
journal.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "service", Value: 1}}})
journal.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "service", Value: 1}, {Key: "status", Value: 1}}})

filtr := bson.D{{Key: "service", Value: "payments"}, {Key: "status", Value: bson.D{{Key: "$gte", Value: 500}}}}
fmt.Println("выбран:", summary(journal, bson.D{{Key: "filter", Value: filtr}}))

var info bson.Raw
sandbox.RunCommand(ctx, bson.D{
    {Key: "explain", Value: bson.D{{Key: "find", Value: "events"}, {Key: "filter", Value: filtr}}},
    {Key: "verbosity", Value: "executionStats"}}).Decode(&info)
rejected, _ := info.Lookup("queryPlanner", "rejectedPlans").Array().Values()
for _, plan := range rejected {
    stage := plan.Document()
    if inner, ok := stage.Lookup("queryPlan").DocumentOK(); ok {
        stage = inner
    }
    for {
        next, ok := stage.Lookup("inputStage").DocumentOK()
        if !ok {
            break
        }
        stage = next
    }
    fmt.Println("отклонён план по индексу", stage.Lookup("indexName").StringValue())
}
''',
    "cpp": '''
journal.create_index(make_document(kvp("service", 1)));
journal.create_index(make_document(kvp("service", 1), kvp("status", 1)));

auto filtr = make_document(kvp("service", "payments"), kvp("status", make_document(kvp("$gte", 500))));
std::cout << "выбран: " << summary(sandbox, "events", make_document(kvp("filter", filtr.view()))) << std::endl;

auto info = sandbox.run_command(make_document(
    kvp("explain", make_document(kvp("find", "events"), kvp("filter", filtr.view()))),
    kvp("verbosity", "executionStats")));
for (auto&& plan : info.view()["queryPlanner"]["rejectedPlans"].get_array().value) {
    auto stage = plan.get_document().value;
    if (stage["queryPlan"]) stage = stage["queryPlan"].get_document().value;
    while (stage["inputStage"]) stage = stage["inputStage"].get_document().value;
    std::cout << "отклонён план по индексу " << stage["indexName"].get_string().value << std::endl;
}
''',
}}

# hint: составной 42/42/42, service_1 42/232/232, $natural 42/0/1200
EXAMPLES["3.3"]["hint"] = {"caption": "один запрос, три индекса", "plain": {
    "python": '''
filtr = {"service": "payments", "status": {"$gte": 500}}
print("service_1_status_1:", summary(journal, filter=filtr, hint="service_1_status_1"))
print("service_1:         ", summary(journal, filter=filtr, hint="service_1"))
print("без индекса:       ", summary(journal, filter=filtr, hint={"$natural": 1}))
''',
    "ruby": '''
filtr = { "service" => "payments", "status" => { "$gte" => 500 } }
puts "service_1_status_1: " + summary(journal, filter: filtr, hint: "service_1_status_1")
puts "service_1:          " + summary(journal, filter: filtr, hint: "service_1")
puts "без индекса:        " + summary(journal, filter: filtr, hint: { "$natural" => 1 })
''',
    "go": '''
filtr := bson.D{{Key: "service", Value: "payments"}, {Key: "status", Value: bson.D{{Key: "$gte", Value: 500}}}}
fmt.Println("service_1_status_1:", summary(journal, bson.D{{Key: "filter", Value: filtr}, {Key: "hint", Value: "service_1_status_1"}}))
fmt.Println("service_1:         ", summary(journal, bson.D{{Key: "filter", Value: filtr}, {Key: "hint", Value: "service_1"}}))
fmt.Println("без индекса:       ", summary(journal, bson.D{{Key: "filter", Value: filtr}, {Key: "hint", Value: bson.D{{Key: "$natural", Value: 1}}}}))
''',
    "cpp": '''
auto filtr = make_document(kvp("service", "payments"), kvp("status", make_document(kvp("$gte", 500))));
std::cout << "service_1_status_1: "
          << summary(sandbox, "events", make_document(kvp("filter", filtr.view()), kvp("hint", "service_1_status_1"))) << std::endl;
std::cout << "service_1:          "
          << summary(sandbox, "events", make_document(kvp("filter", filtr.view()), kvp("hint", "service_1"))) << std::endl;
std::cout << "без индекса:        "
          << summary(sandbox, "events", make_document(kvp("filter", filtr.view()), kvp("hint", make_document(kvp("$natural", 1))))) << std::endl;
''',
}}

# покрывающий: PROJECTION_COVERED, документов 0
EXAMPLES["3.3"]["covered"] = {"caption": "покрывающий запрос", "plain": {
    "python": '''
filtr = {"service": "payments", "status": {"$gte": 500}}
print("все поля:        ", summary(journal, filter=filtr))
print("service и status:", summary(journal, filter=filtr, projection={"_id": 0, "service": 1, "status": 1}))
print("и ещё ts:        ", summary(journal, filter=filtr, projection={"_id": 0, "service": 1, "status": 1, "ts": 1}))
''',
    "ruby": '''
filtr = { "service" => "payments", "status" => { "$gte" => 500 } }
puts "все поля:         " + summary(journal, filter: filtr)
puts "service и status: " + summary(journal, filter: filtr, projection: { "_id" => 0, "service" => 1, "status" => 1 })
puts "и ещё ts:         " + summary(journal, filter: filtr, projection: { "_id" => 0, "service" => 1, "status" => 1, "ts" => 1 })
''',
    "go": '''
filtr := bson.D{{Key: "service", Value: "payments"}, {Key: "status", Value: bson.D{{Key: "$gte", Value: 500}}}}
fmt.Println("все поля:        ", summary(journal, bson.D{{Key: "filter", Value: filtr}}))
fmt.Println("service и status:", summary(journal, bson.D{{Key: "filter", Value: filtr},
    {Key: "projection", Value: bson.D{{Key: "_id", Value: 0}, {Key: "service", Value: 1}, {Key: "status", Value: 1}}}}))
fmt.Println("и ещё ts:        ", summary(journal, bson.D{{Key: "filter", Value: filtr},
    {Key: "projection", Value: bson.D{{Key: "_id", Value: 0}, {Key: "service", Value: 1}, {Key: "status", Value: 1}, {Key: "ts", Value: 1}}}}))
''',
    "cpp": '''
auto filtr = make_document(kvp("service", "payments"), kvp("status", make_document(kvp("$gte", 500))));
std::cout << "все поля:         " << summary(sandbox, "events", make_document(kvp("filter", filtr.view()))) << std::endl;
std::cout << "service и status: "
          << summary(sandbox, "events", make_document(kvp("filter", filtr.view()),
                     kvp("projection", make_document(kvp("_id", 0), kvp("service", 1), kvp("status", 1))))) << std::endl;
std::cout << "и ещё ts:         "
          << summary(sandbox, "events", make_document(kvp("filter", filtr.view()),
                     kvp("projection", make_document(kvp("_id", 0), kvp("service", 1), kvp("status", 1), kvp("ts", 1))))) << std::endl;
''',
}}

# SORT 10/232/232 → индекс service_1_ts_-1 → LIMIT 10/10/10
EXAMPLES["3.3"]["sort"] = {"caption": "сортировка в памяти и по индексу", "plain": {
    "python": '''
journal.drop_index("service_1")
last = {"filter": {"service": "payments"}, "sort": {"ts": -1}, "limit": 10}
print("до индекса по ts:   ", summary(journal, **last))

print("создан индекс:", journal.create_index([("service", 1), ("ts", -1)]))
print("после индекса по ts:", summary(journal, **last))
''',
    "ruby": '''
journal.indexes.drop_one("service_1")
last = { filter: { "service" => "payments" }, sort: { "ts" => -1 }, limit: 10 }
puts "до индекса по ts:    " + summary(journal, last)

journal.indexes.create_one({ "service" => 1, "ts" => -1 })
puts "создан индекс: " + journal.indexes.get({ "service" => 1, "ts" => -1 })["name"]
puts "после индекса по ts: " + summary(journal, last)
''',
    "go": '''
journal.Indexes().DropOne(ctx, "service_1")
last := bson.D{
    {Key: "filter", Value: bson.D{{Key: "service", Value: "payments"}}},
    {Key: "sort", Value: bson.D{{Key: "ts", Value: -1}}},
    {Key: "limit", Value: 10}}
fmt.Println("до индекса по ts:   ", summary(journal, last))

name, _ := journal.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "service", Value: 1}, {Key: "ts", Value: -1}}})
fmt.Println("создан индекс:", name)
fmt.Println("после индекса по ts:", summary(journal, last))
''',
    "cpp": '''
journal.indexes().drop_one("service_1");
auto last = make_document(
    kvp("filter", make_document(kvp("service", "payments"))),
    kvp("sort", make_document(kvp("ts", -1))),
    kvp("limit", 10));
std::cout << "до индекса по ts:    " << summary(sandbox, "events", last.view()) << std::endl;

auto created = journal.create_index(make_document(kvp("service", 1), kvp("ts", -1)));
std::cout << "создан индекс: " << created.view()["name"].get_string().value << std::endl;
std::cout << "после индекса по ts: " << summary(sandbox, "events", last.view()) << std::endl;
''',
}}

# ESR: составной SORT 5/42/42; service_1_ts_-1 5/18/18; service_1_ts_-1_status_1 5/18/5
EXAMPLES["3.3"]["esr"] = {"caption": "порядок полей: равенство, сортировка, диапазон", "plain": {
    "python": '''
journal.create_index([("service", 1), ("ts", -1), ("status", 1)])
errors_last = {"filter": {"service": "payments", "status": {"$gte": 500}}, "sort": {"ts": -1}, "limit": 5}

for name in ["service_1_status_1", "service_1_ts_-1", "service_1_ts_-1_status_1"]:
    print(name.ljust(24), summary(journal, **errors_last, hint=name))
''',
    "ruby": '''
journal.indexes.create_one({ "service" => 1, "ts" => -1, "status" => 1 })
errors_last = { filter: { "service" => "payments", "status" => { "$gte" => 500 } }, sort: { "ts" => -1 }, limit: 5 }

["service_1_status_1", "service_1_ts_-1", "service_1_ts_-1_status_1"].each do |name|
  puts name.ljust(24) + " " + summary(journal, errors_last.merge(hint: name))
end
''',
    "go": '''
journal.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys: bson.D{{Key: "service", Value: 1}, {Key: "ts", Value: -1}, {Key: "status", Value: 1}}})
errorsLast := bson.D{
    {Key: "filter", Value: bson.D{{Key: "service", Value: "payments"}, {Key: "status", Value: bson.D{{Key: "$gte", Value: 500}}}}},
    {Key: "sort", Value: bson.D{{Key: "ts", Value: -1}}},
    {Key: "limit", Value: 5}}

for _, name := range []string{"service_1_status_1", "service_1_ts_-1", "service_1_ts_-1_status_1"} {
    find := append(bson.D{{Key: "hint", Value: name}}, errorsLast...)
    fmt.Printf("%-24s %s\\n", name, summary(journal, find))
}
''',
    "cpp": '''
journal.create_index(make_document(kvp("service", 1), kvp("ts", -1), kvp("status", 1)));

for (std::string name : {"service_1_status_1", "service_1_ts_-1", "service_1_ts_-1_status_1"}) {
    auto find = make_document(
        kvp("filter", make_document(kvp("service", "payments"), kvp("status", make_document(kvp("$gte", 500))))),
        kvp("sort", make_document(kvp("ts", -1))),
        kvp("limit", 5),
        kvp("hint", name));
    std::cout << name << std::string(25 - name.size(), ' ') << summary(sandbox, "events", find.view()) << std::endl;
}
''',
}}

ERRORS["3.3"] = [
    ("Отчёт снят для фильтра без сортировки и предела, а программа их использует",
     "План другой: в отчёте нет стадии <code>SORT</code>, которая есть в настоящем запросе",
     "Снимать <code>explain</code> с теми же фильтром, сортировкой, проекцией и пределом"),
    ("Запросы сравниваются по <code>executionTimeMillis</code>",
     "Время меняется от запуска к запуску: на копии журнала один запрос показывал 1 и 7 мс",
     "Сравнивать <code>totalKeysExamined</code> и <code>totalDocsExamined</code> с <code>nReturned</code>"),
    ("Счётчики отклонённого плана ищут в <code>executionStats</code>",
     "Там только выбранный план",
     "Задать индекс параметром <code>hint</code> и снять отчёт ещё раз"),
    ("Проекция на поля индекса без <code>\"_id\": 0</code>",
     "Запрос не покрывающий: <code>_id</code> нет в индексе, документы читаются",
     "Исключить <code>_id</code> в проекции"),
    ("Индекс «равенство, диапазон» для запроса с сортировкой",
     "Стадия <code>SORT</code>: подходящие документы сортируются в памяти",
     "Порядок по правилу ESR: равенство, сортировка, диапазон"),
    ("<code>hint</code> оставлен в рабочем запросе после сравнения",
     "Сервер не выберет лучший индекс, если он появится; удаление индекса из <code>hint</code> ломает запрос",
     "Убрать <code>hint</code> после сравнения планов"),
]

CHEATS["3.3"] = [
    ("Отчёт о запросе", {
        "python": ['coll.find(filtr).explain()'],
        "ruby": ['coll.find(filtr).explain'],
        "go": ['db.RunCommand(ctx, bson.D{{Key: "explain", Value: find},', '  {Key: "verbosity", Value: "executionStats"}})'],
        "cpp": ['db.run_command(make_document(kvp("explain", find),', '  kvp("verbosity", "executionStats")));']}),
    ("Где что лежит", {"all": ['queryPlanner.winningPlan — выбранный план', 'queryPlanner.rejectedPlans — отклонённые', 'executionStats.nReturned / totalKeysExamined / totalDocsExamined']}),
    ("Задать индекс", {
        "python": ['coll.find(filtr).hint("service_1_status_1")', 'coll.find(filtr).hint([("$natural", 1)])'],
        "ruby": ['coll.find(filtr).hint("service_1_status_1")'],
        "go": ['options.Find().SetHint("service_1_status_1")'],
        "cpp": ['mongocxx::options::find o;', 'o.hint(mongocxx::hint{"service_1_status_1"});']}),
    ("Стадии плана", {"all": ['COLLSCAN — вся коллекция', 'IXSCAN — индекс, FETCH — документы по ссылкам', 'SORT — сортировка в памяти', 'PROJECTION_COVERED — без чтения документов']}),
    ("Правило ESR", {"all": ['равенство → сортировка → диапазон', '{service: 1, ts: -1, status: 1}']}),
]

# ── 3.4 Текстовый поиск ────────────────────────────────────────────────────
#
# Заготовка главы открывает showcase = sandbox.showcase — копию товаров.

EXAMPLES["3.4"] = {}

# 21 товар; regex 1, с i — 6, «ноутбуки» — 0
EXAMPLES["3.4"]["regex"] = {"caption": "поиск слова шаблоном", "plain": {
    "python": '''
showcase.drop()
showcase.insert_many(products.find())
print("товаров в копии:", showcase.count_documents({}))

print("ноутбук:         ", showcase.count_documents({"title": {"$regex": "ноутбук"}}))
print("ноутбук, без регистра:", showcase.count_documents({"title": {"$regex": "ноутбук", "$options": "i"}}))
print("ноутбуки, без регистра:", showcase.count_documents({"title": {"$regex": "ноутбуки", "$options": "i"}}))
''',
    "ruby": '''
showcase.drop
showcase.insert_many(products.find.to_a)
puts "товаров в копии: " + showcase.count_documents({}).to_s

puts "ноутбук:          " + showcase.count_documents({ "title" => { "$regex" => "ноутбук" } }).to_s
puts "ноутбук, без регистра: " + showcase.count_documents({ "title" => { "$regex" => "ноутбук", "$options" => "i" } }).to_s
puts "ноутбуки, без регистра: " + showcase.count_documents({ "title" => { "$regex" => "ноутбуки", "$options" => "i" } }).to_s
''',
    "go": '''
showcase.Drop(ctx)
var all []bson.D
cursor, _ := products.Find(ctx, bson.D{})
cursor.All(ctx, &all)
docs := make([]any, len(all))
for i := range all {
    docs[i] = all[i]
}
showcase.InsertMany(ctx, docs)
n, _ := showcase.CountDocuments(ctx, bson.D{})
fmt.Println("товаров в копии:", n)

word, _ := showcase.CountDocuments(ctx, bson.D{{Key: "title", Value: bson.D{{Key: "$regex", Value: "ноутбук"}}}})
anyCase, _ := showcase.CountDocuments(ctx, bson.D{{Key: "title", Value: bson.D{{Key: "$regex", Value: "ноутбук"}, {Key: "$options", Value: "i"}}}})
plural, _ := showcase.CountDocuments(ctx, bson.D{{Key: "title", Value: bson.D{{Key: "$regex", Value: "ноутбуки"}, {Key: "$options", Value: "i"}}}})
fmt.Println("ноутбук:         ", word)
fmt.Println("ноутбук, без регистра:", anyCase)
fmt.Println("ноутбуки, без регистра:", plural)
''',
    "cpp": '''
showcase.drop();
std::vector<bsoncxx::document::value> all;
for (auto&& doc : products.find(make_document())) all.emplace_back(doc);
showcase.insert_many(all);
std::cout << "товаров в копии: " << showcase.count_documents(make_document()) << std::endl;

std::cout << "ноутбук:          "
          << showcase.count_documents(make_document(kvp("title", make_document(kvp("$regex", "ноутбук"))))) << std::endl;
std::cout << "ноутбук, без регистра: "
          << showcase.count_documents(make_document(kvp("title", make_document(kvp("$regex", "ноутбук"), kvp("$options", "i"))))) << std::endl;
std::cout << "ноутбуки, без регистра: "
          << showcase.count_documents(make_document(kvp("title", make_document(kvp("$regex", "ноутбуки"), kvp("$options", "i"))))) << std::endl;
''',
}}

# title_text; «ноутбуки» — 6 товаров по названию
EXAMPLES["3.4"]["text"] = {"caption": "текстовый индекс и $text", "plain": {
    "python": '''
name = showcase.create_index([("title", "text")], default_language="russian")
print("создан индекс:", name)

for doc in showcase.find({"$text": {"$search": "ноутбуки"}}, {"_id": 0, "title": 1}).sort("title", 1):
    print(doc["title"])
''',
    "ruby": '''
showcase.indexes.create_one({ "title" => "text" }, default_language: "russian")
# ключ текстового индекса хранится как _fts, поэтому индекс ищется в списке по этому полю
puts "создан индекс: " + showcase.indexes.find { |ix| ix["key"].key?("_fts") }["name"]

showcase.find({ "$text" => { "$search" => "ноутбуки" } }, projection: { "_id" => 0, "title" => 1 })
        .sort({ "title" => 1 })
        .each { |doc| puts doc["title"] }
''',
    "go": '''
name, _ := showcase.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys:    bson.D{{Key: "title", Value: "text"}},
    Options: options.Index().SetDefaultLanguage("russian")})
fmt.Println("создан индекс:", name)

cursor, _ := showcase.Find(ctx, bson.D{{Key: "$text", Value: bson.D{{Key: "$search", Value: "ноутбуки"}}}},
    options.Find().SetSort(bson.D{{Key: "title", Value: 1}}))
for cursor.Next(ctx) {
    fmt.Println(cursor.Current.Lookup("title").StringValue())
}
''',
    "cpp": '''
mongocxx::options::index russian;
russian.default_language("russian");
auto created = showcase.create_index(make_document(kvp("title", "text")), russian);
std::cout << "создан индекс: " << created.view()["name"].get_string().value << std::endl;

mongocxx::options::find by_title;
by_title.sort(make_document(kvp("title", 1)));
for (auto&& doc : showcase.find(make_document(kvp("$text", make_document(kvp("$search", "ноутбуки")))), by_title)) {
    std::cout << doc["title"].get_string().value << std::endl;
}
''',
}}

# несколько слов, фраза, исключение, часть слова, стоп-слово
EXAMPLES["3.4"]["search"] = {"caption": "слова, фраза, исключение", "plain": {
    "python": '''
for search in ["мышь клавиатура", '"для ноутбука"', "ноутбук -рюкзак", "ноут", "для"]:
    found = [doc["title"] for doc in showcase.find({"$text": {"$search": search}}).sort("title", 1)]
    print(search.ljust(16), "→", ", ".join(found) or "ничего")
''',
    "ruby": '''
["мышь клавиатура", '"для ноутбука"', "ноутбук -рюкзак", "ноут", "для"].each do |search|
  found = showcase.find({ "$text" => { "$search" => search } }).sort({ "title" => 1 }).map { |doc| doc["title"] }
  puts search.ljust(16) + " → " + (found.empty? ? "ничего" : found.join(", "))
end
''',
    "go": '''
for _, search := range []string{"мышь клавиатура", "\\"для ноутбука\\"", "ноутбук -рюкзак", "ноут", "для"} {
    cursor, _ := showcase.Find(ctx, bson.D{{Key: "$text", Value: bson.D{{Key: "$search", Value: search}}}},
        options.Find().SetSort(bson.D{{Key: "title", Value: 1}}))
    found := []string{}
    for cursor.Next(ctx) {
        found = append(found, cursor.Current.Lookup("title").StringValue())
    }
    line := strings.Join(found, ", ")
    if line == "" {
        line = "ничего"
    }
    fmt.Printf("%-16s → %s\\n", search, line)
}
''',
    "cpp": '''
mongocxx::options::find by_title;
by_title.sort(make_document(kvp("title", 1)));
for (std::string search : {"мышь клавиатура", "\\"для ноутбука\\"", "ноутбук -рюкзак", "ноут", "для"}) {
    std::string found;
    for (auto&& doc : showcase.find(make_document(kvp("$text", make_document(kvp("$search", search)))), by_title)) {
        if (!found.empty()) found += ", ";
        found += std::string{doc["title"].get_string().value};
    }
    size_t letters = 0;                       // в UTF-8 буква кириллицы занимает два байта
    for (unsigned char c : search) letters += (c & 0xC0) != 0x80;
    std::cout << search << std::string(16 - std::min<size_t>(16, letters), ' ') << " → "
              << (found.empty() ? "ничего" : found) << std::endl;
}
''',
}}

# оценка совпадения для «apple ноутбук»
EXAMPLES["3.4"]["score"] = {"caption": "оценка совпадения", "plain": {
    "python": '''
cursor = showcase.find({"$text": {"$search": "apple ноутбук"}},
                       {"_id": 0, "title": 1, "score": {"$meta": "textScore"}})
for doc in cursor.sort([("score", {"$meta": "textScore"}), ("title", 1)]):
    print(f"{doc['score']:.3f}", doc["title"])
''',
    "ruby": '''
showcase.find({ "$text" => { "$search" => "apple ноутбук" } },
              projection: { "_id" => 0, "title" => 1, "score" => { "$meta" => "textScore" } })
        .sort({ "score" => { "$meta" => "textScore" }, "title" => 1 })
        .each { |doc| puts format("%.3f", doc["score"]) + " " + doc["title"] }
''',
    "go": '''
cursor, _ := showcase.Find(ctx, bson.D{{Key: "$text", Value: bson.D{{Key: "$search", Value: "apple ноутбук"}}}},
    options.Find().
        SetProjection(bson.D{{Key: "_id", Value: 0}, {Key: "title", Value: 1}, {Key: "score", Value: bson.D{{Key: "$meta", Value: "textScore"}}}}).
        SetSort(bson.D{{Key: "score", Value: bson.D{{Key: "$meta", Value: "textScore"}}}, {Key: "title", Value: 1}}))
for cursor.Next(ctx) {
    fmt.Printf("%.3f %s\\n", cursor.Current.Lookup("score").Double(), cursor.Current.Lookup("title").StringValue())
}
''',
    "cpp": '''
mongocxx::options::find by_score;
by_score.projection(make_document(kvp("_id", 0), kvp("title", 1), kvp("score", make_document(kvp("$meta", "textScore")))));
by_score.sort(make_document(kvp("score", make_document(kvp("$meta", "textScore"))), kvp("title", 1)));
for (auto&& doc : showcase.find(make_document(kvp("$text", make_document(kvp("$search", "apple ноутбук")))), by_score)) {
    std::cout << std::fixed << std::setprecision(3) << doc["score"].get_double().value << " "
              << doc["title"].get_string().value << std::endl;
}
''',
}}

# язык индекса и язык запроса: russian 6, none 0 и 6; стоп-слово 0 и 0
EXAMPLES["3.4"]["language"] = {"caption": "язык индекса и язык запроса", "plain": {
    "python": '''
for search, language in [("ноутбуки", "russian"), ("ноутбуки", "none"), ("ноутбук", "none"), ("для", "none")]:
    count = showcase.count_documents({"$text": {"$search": search, "$language": language}})
    print(f"{search} ({language}):", count)
''',
    "ruby": '''
[["ноутбуки", "russian"], ["ноутбуки", "none"], ["ноутбук", "none"], ["для", "none"]].each do |search, language|
  count = showcase.count_documents({ "$text" => { "$search" => search, "$language" => language } })
  puts "#{search} (#{language}): #{count}"
end
''',
    "go": '''
for _, pair := range [][2]string{{"ноутбуки", "russian"}, {"ноутбуки", "none"}, {"ноутбук", "none"}, {"для", "none"}} {
    count, _ := showcase.CountDocuments(ctx, bson.D{{Key: "$text", Value: bson.D{
        {Key: "$search", Value: pair[0]}, {Key: "$language", Value: pair[1]}}}})
    fmt.Printf("%s (%s): %d\\n", pair[0], pair[1], count)
}
''',
    "cpp": '''
std::vector<std::pair<std::string, std::string>> queries{
    {"ноутбуки", "russian"}, {"ноутбуки", "none"}, {"ноутбук", "none"}, {"для", "none"}};
for (const auto& [search, language] : queries) {
    auto count = showcase.count_documents(make_document(kvp("$text", make_document(
        kvp("$search", search), kvp("$language", language)))));
    std::cout << search << " (" << language << "): " << count << std::endl;
}
''',
}}

# индекс по двум полям с весами; «смартфоны» 7.250 / 7.000; второй текстовый — 85
EXAMPLES["3.4"]["weights"] = {"caption": "индекс по двум полям с весами", "plain": {
    "python": '''
from pymongo.errors import OperationFailure

showcase.drop_index("title_text")
showcase.create_index([("title", "text"), ("category", "text")],
                      weights={"title": 10, "category": 1}, default_language="russian", name="poisk")

cursor = showcase.find({"$text": {"$search": "смартфоны"}},
                       {"_id": 0, "title": 1, "score": {"$meta": "textScore"}})
for doc in cursor.sort([("score", {"$meta": "textScore"}), ("title", 1)]):
    print(f"{doc['score']:.3f}", doc["title"])

try:
    showcase.create_index([("brand", "text")])
except OperationFailure as e:
    print("второй текстовый индекс не создан, код", e.code)
''',
    "ruby": '''
showcase.indexes.drop_one("title_text")
showcase.indexes.create_one({ "title" => "text", "category" => "text" },
                            weights: { "title" => 10, "category" => 1 }, default_language: "russian", name: "poisk")

showcase.find({ "$text" => { "$search" => "смартфоны" } },
              projection: { "_id" => 0, "title" => 1, "score" => { "$meta" => "textScore" } })
        .sort({ "score" => { "$meta" => "textScore" }, "title" => 1 })
        .each { |doc| puts format("%.3f", doc["score"]) + " " + doc["title"] }

begin
  showcase.indexes.create_one({ "brand" => "text" })
rescue Mongo::Error::OperationFailure => e
  puts "второй текстовый индекс не создан, код #{e.code}"
end
''',
    "go": '''
showcase.Indexes().DropOne(ctx, "title_text")
showcase.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys: bson.D{{Key: "title", Value: "text"}, {Key: "category", Value: "text"}},
    Options: options.Index().
        SetWeights(bson.D{{Key: "title", Value: 10}, {Key: "category", Value: 1}}).
        SetDefaultLanguage("russian").
        SetName("poisk")})

cursor, _ := showcase.Find(ctx, bson.D{{Key: "$text", Value: bson.D{{Key: "$search", Value: "смартфоны"}}}},
    options.Find().
        SetProjection(bson.D{{Key: "_id", Value: 0}, {Key: "title", Value: 1}, {Key: "score", Value: bson.D{{Key: "$meta", Value: "textScore"}}}}).
        SetSort(bson.D{{Key: "score", Value: bson.D{{Key: "$meta", Value: "textScore"}}}, {Key: "title", Value: 1}}))
for cursor.Next(ctx) {
    fmt.Printf("%.3f %s\\n", cursor.Current.Lookup("score").Double(), cursor.Current.Lookup("title").StringValue())
}

_, err := showcase.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "brand", Value: "text"}}})
var ce mongo.CommandError
if errors.As(err, &ce) {
    fmt.Println("второй текстовый индекс не создан, код", ce.Code)
}
''',
    "cpp": '''
showcase.indexes().drop_one("title_text");
auto weights = make_document(kvp("title", 10), kvp("category", 1));
mongocxx::options::index poisk;
poisk.weights(weights.view());
poisk.default_language("russian");
poisk.name("poisk");
showcase.create_index(make_document(kvp("title", "text"), kvp("category", "text")), poisk);

mongocxx::options::find by_score;
by_score.projection(make_document(kvp("_id", 0), kvp("title", 1), kvp("score", make_document(kvp("$meta", "textScore")))));
by_score.sort(make_document(kvp("score", make_document(kvp("$meta", "textScore"))), kvp("title", 1)));
for (auto&& doc : showcase.find(make_document(kvp("$text", make_document(kvp("$search", "смартфоны")))), by_score)) {
    std::cout << std::fixed << std::setprecision(3) << doc["score"].get_double().value << " "
              << doc["title"].get_string().value << std::endl;
}

try {
    showcase.create_index(make_document(kvp("brand", "text")));
} catch (const mongocxx::operation_exception& e) {
    std::cout << "второй текстовый индекс не создан, код " << e.code().value() << std::endl;
}
''',
}}

ERRORS["3.4"] = [
    ('<code>{"$text": {"$search": "ноутбук"}}</code> на коллекции без текстового индекса',
     "Ошибка 27 <code>IndexNotFound</code>: text index required for $text query",
     "Создать текстовый индекс по нужным полям"),
    ('<code>{"title": {"$text": {"$search": "…"}}}</code>',
     "Ошибка: <code>$text</code> не ставится внутрь поля",
     '<code>$text</code> — на месте имени поля: <code>{"$text": {"$search": "…"}}</code>'),
    ("Второй текстовый индекс на ту же коллекцию",
     "Ошибка 85 <code>IndexOptionsConflict</code>: текстовый индекс у коллекции один",
     "Добавить поле в существующий текстовый индекс"),
    ("Поиск по началу слова: «ноут»",
     "Ничего не найдено: индекс хранит слова целиком",
     "Целое слово в любой форме или <code>$regex</code> с <code>^</code>"),
    ("Индекс построен без <code>default_language</code> по русским названиям",
     "Язык индекса — английский: «ноутбуки» не находит ничего, «ноутбук» — 5 товаров из 6 без «ноутбука», служебное «для» ищется",
     '<code>default_language="russian"</code> при создании индекса'),
    ("Сортировка по оценке без <code>$meta</code> в сортировке",
     "Порядок не по оценке: поле <code>score</code> в проекции само по себе порядок не задаёт",
     '<code>sort({"score": {"$meta": "textScore"}})</code>'),
]

CHEATS["3.4"] = [
    ("Текстовый индекс", {
        "python": ['coll.create_index([("title", "text")],', '    default_language="russian")'],
        "ruby": ['coll.indexes.create_one({ "title" => "text" },', '  default_language: "russian")'],
        "go": ['Keys: bson.D{{Key: "title", Value: "text"}},', 'Options: options.Index().SetDefaultLanguage("russian")'],
        "cpp": ['o.default_language("russian");', 'coll.create_index(make_document(kvp("title", "text")), o);']}),
    ("Поиск", {"all": ['{"$text": {"$search": "ноутбуки"}}']}),
    ("Строка поиска", {"all": ['"мышь клавиатура" — любое слово', '"\\"для ноутбука\\"" — фраза', '"ноутбук -рюкзак" — без слова']}),
    ("Оценка совпадения", {
        "python": ['{"score": {"$meta": "textScore"}}  # проекция и сортировка'],
        "ruby": ['{ "score" => { "$meta" => "textScore" } }'],
        "go": ['bson.D{{Key: "score", Value: bson.D{{Key: "$meta", Value: "textScore"}}}}'],
        "cpp": ['make_document(kvp("score", make_document(kvp("$meta", "textScore"))))']}),
    ("Несколько полей с весами", {
        "python": ['coll.create_index([("title", "text"), ("category", "text")],', '    weights={"title": 10, "category": 1})'],
        "ruby": ['coll.indexes.create_one({ "title" => "text", "category" => "text" },', '  weights: { "title" => 10, "category" => 1 })'],
        "go": ['options.Index().SetWeights(bson.D{', '  {Key: "title", Value: 10}, {Key: "category", Value: 1}})'],
        "cpp": ['o.weights(weights.view());']}),
    ("Язык запроса", {"all": ['{"$text": {"$search": "…", "$language": "none"}}']}),
]
