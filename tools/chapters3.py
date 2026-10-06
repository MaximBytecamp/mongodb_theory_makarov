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
