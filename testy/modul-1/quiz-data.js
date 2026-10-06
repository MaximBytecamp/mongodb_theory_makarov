/* Тест модуля 1 · справочник по MongoDB. Файл собран скриптом — руками не править.

   Верные ответы здесь дважды: хешами SHA-256 от "СОЛЬ|вопрос|язык|вариант"
   в самих вопросах и вместе с разбором в SECRET — JSON, перемешанный XOR
   с SHA-256 от соли, в base64. Разбор показывается после отправки работы.
   Это барьер от беглого чтения исходника, а не защита: вариантов мало,
   перебрать их в консоли можно. */

const QUIZ = {
 "id": "mdb-test-m1",
 "title": "Модуль 1 · подключение и первые данные",
 "minutes": 30,
 "salt": "mdb-m1-2026-sep",
 "context": "Переменные <code>products</code> и <code>box</code> — как в заготовках глав: <code>shop.products</code> и песочница <code>sandbox.products</code>. Перед каждым фрагментом базы в исходном состоянии: в песочнице 21 товар с ключами <code>p-001</code>…<code>p-021</code>.",
 "grades": [
  {
   "min": 23,
   "mark": 5,
   "label": "отлично"
  },
  {
   "min": 19,
   "mark": 4,
   "label": "хорошо"
  },
  {
   "min": 14,
   "mark": 3,
   "label": "удовлетворительно"
  },
  {
   "min": 0,
   "mark": 2,
   "label": "неудовлетворительно"
  }
 ],
 "chapters": {
  "1.1": {
   "title": "Сервер, база, коллекция",
   "url": "../../temy/01-klient-baza-kollekciya/index.html"
  },
  "1.2": {
   "title": "Документ и BSON",
   "url": "../../temy/02-dokument-i-bson/index.html"
  },
  "1.3": {
   "title": "Вставка: insert_one и insert_many",
   "url": "../../temy/03-vstavka/index.html"
  },
  "1.4": {
   "title": "Чтение: find, find_one и курсор",
   "url": "../../temy/04-find-i-kursor/index.html"
  },
  "1.5": {
   "title": "Проекция: какие поля вернуть",
   "url": "../../temy/05-proekciya/index.html"
  },
  "1.6": {
   "title": "Порядок и порции: sort, limit, skip",
   "url": "../../temy/06-sort-limit-skip/index.html"
  },
  "1.7": {
   "title": "Обновление: $set, $inc, $unset",
   "url": "../../temy/07-obnovlenie/index.html"
  },
  "1.8": {
   "title": "Удаление",
   "url": "../../temy/08-udalenie/index.html"
  }
 },
 "questions": [
  {
   "id": "q01",
   "topic": "1.1 · подключение",
   "type": "single",
   "text": "Сервер стенда курса слушает порт 27017. Программу запустили с опечаткой в порте. Что произойдёт?",
   "options": [
    "Ошибка сразу при создании клиента: порт никто не слушает",
    "Печатает «клиент создан», ошибка возникает на подсчёте",
    "Печатает «клиент создан» и затем «товаров: 0»",
    "Ошибка при выборе коллекции: сервер не нашёл shop"
   ],
   "code": {
    "python": "from pymongo import MongoClient\n\nclient = MongoClient(\"mongodb://localhost:27018/\")\nproducts = client[\"shop\"][\"products\"]\nprint(\"клиент создан\")\nprint(\"товаров:\", products.count_documents({}))",
    "ruby": "require \"mongo\"\n\nclient = Mongo::Client.new(\"mongodb://localhost:27018/\")\nproducts = client.use(\"shop\").database[:products]\nputs \"клиент создан\"\nputs \"товаров: #{products.count_documents({})}\"",
    "go": "client, err := mongo.Connect(options.Client().ApplyURI(\"mongodb://localhost:27018\"))\nif err != nil {\n    log.Fatal(err)\n}\nproducts := client.Database(\"shop\").Collection(\"products\")\nfmt.Println(\"клиент создан\")\nn, err := products.CountDocuments(ctx, bson.D{})\nif err != nil {\n    log.Fatal(err)\n}\nfmt.Println(\"товаров:\", n)",
    "cpp": "mongocxx::instance instance{};\nmongocxx::client client{mongocxx::uri{\"mongodb://localhost:27018\"}};\nauto products = client[\"shop\"][\"products\"];\nstd::cout << \"клиент создан\" << std::endl;\nstd::cout << \"товаров: \" << products.count_documents(make_document()) << std::endl;"
   },
   "key": {
    "python": [
     "0d984a6387af4ebb"
    ],
    "cpp": [
     "4e6152c69abcecde"
    ],
    "go": [
     "b0bb71c5f7e07237"
    ],
    "ruby": [
     "5f5682390f68dafc"
    ]
   },
   "chapters": [
    "1.1"
   ]
  },
  {
   "id": "q02",
   "topic": "1.1 · база и коллекция",
   "type": "single",
   "text": "Скрипт отчёта печатает «товаров: 0», хотя Compass в <code>shop.products</code> показывает 21 документ. Ошибок в выводе нет. Какая причина самая вероятная?",
   "options": [
    "В коде опечатка в имени базы или коллекции скрипта",
    "Compass показывает кэш, а на сервере данных уже нет",
    "Пустой фильтр считает только документы за сегодня",
    "Скрипту не хватило прав, и сервер вернул ноль"
   ],
   "key": {
    "python": [
     "b7098326159a83f9"
    ],
    "cpp": [
     "3a682287d9321eb2"
    ],
    "go": [
     "03a6a1720b81c3f0"
    ],
    "ruby": [
     "8b6b12fcc1d736e8"
    ]
   },
   "chapters": [
    "1.1"
   ]
  },
  {
   "id": "q03",
   "topic": "1.1–1.2 · устройство",
   "type": "multi",
   "text": "Отметьте <b>все</b> верные утверждения.",
   "options": [
    "База появляется на сервере при первой записи в любую её коллекцию",
    "Выбор базы в коде сразу проверяет на сервере, что она существует",
    "Базы admin, config и local сервер заводит сам, без нашего участия",
    "Документы одной коллекции обязаны иметь одинаковый набор полей",
    "Запись shop.products означает коллекцию products в базе shop"
   ],
   "key": {
    "python": [
     "625fd01addf1166d",
     "9761c052d6805df0",
     "cb9119bb2d0a1e90"
    ],
    "cpp": [
     "05c2aeb6de9b13a4",
     "09a1ed63fba615f5",
     "e38c637be982bc14"
    ],
    "go": [
     "0c0318cf781bf90d",
     "5bab55de4e7bb2f8",
     "83b066fec4297a12"
    ],
    "ruby": [
     "589ccdbc90d7ff21",
     "8a92cb7e0a13d76c",
     "ea6fac28a74e7e7d"
    ]
   },
   "chapters": [
    "1.1",
    "1.2"
   ]
  },
  {
   "id": "q04",
   "topic": "1.2 · ObjectId",
   "type": "single",
   "text": "Ключ документа пришёл в программу строкой из адресной строки браузера. Что напечатает фрагмент?",
   "options": [
    "Документ «Проверка ключа»: драйвер сам приведёт строку к ключу",
    "Пустой результат: строка не равна значению типа ObjectId",
    "Ошибку: в фильтре по _id строку передавать нельзя вовсе",
    "Ошибку: такой ключ уже занят только что вставленным документом"
   ],
   "code": {
    "python": "new_id = box.insert_one({\"title\": \"Проверка ключа\"}).inserted_id\nraw = str(new_id)          # так ключ приходит из адресной строки\nprint(box.find_one({\"_id\": raw}))",
    "ruby": "new_id = box.insert_one({ \"title\" => \"Проверка ключа\" }).inserted_id\nraw = new_id.to_s          # так ключ приходит из адресной строки\np box.find({ \"_id\" => raw }).first",
    "go": "res, _ := box.InsertOne(ctx, bson.D{{Key: \"title\", Value: \"Проверка ключа\"}})\nraw := res.InsertedID.(bson.ObjectID).Hex() // так ключ приходит из адресной строки\n\nvar doc bson.M\nerr := box.FindOne(ctx, bson.D{{Key: \"_id\", Value: raw}}).Decode(&doc)\nfmt.Println(doc, err)",
    "cpp": "auto res = box.insert_one(make_document(kvp(\"title\", \"Проверка ключа\")));\n// так ключ приходит из адресной строки\nstd::string raw = res->inserted_id().get_oid().value.to_string();\n\nauto doc = box.find_one(make_document(kvp(\"_id\", raw)));\nstd::cout << (doc ? bsoncxx::to_json(*doc) : \"пусто\") << std::endl;"
   },
   "key": {
    "python": [
     "b8e122d16770ee9b"
    ],
    "cpp": [
     "32de2d150520ceee"
    ],
    "go": [
     "a904dee1c4044eb0"
    ],
    "ruby": [
     "98dbcb25181710f5"
    ]
   },
   "chapters": [
    "1.2"
   ]
  },
  {
   "id": "q05",
   "topic": "1.2 · поле _id",
   "type": "single",
   "text": "Товару решили сменить ключ. Что сделает запрос?",
   "options": [
    "Сменит ключ, а старый p-001 освободится для новых товаров",
    "Вернёт ошибку записи: поле _id у документа неизменяемо",
    "Создаст рядом второй документ с ключом p-201 и теми же полями",
    "Вернёт matched 1 и modified 0: сервер молча пропустит _id"
   ],
   "code": {
    "shell": "db.products.updateOne(\n  { _id: \"p-001\" },\n  { $set: { _id: \"p-201\" } }\n)"
   },
   "key": {
    "python": [
     "6d14b40eafae44ab"
    ],
    "cpp": [
     "e7607c5c6145e62f"
    ],
    "go": [
     "91d1faa4b72f6093"
    ],
    "ruby": [
     "08f9f1619fbc5c4f"
    ]
   },
   "chapters": [
    "1.2"
   ]
  },
  {
   "id": "q06",
   "topic": "1.2 · типы в Compass",
   "type": "multi",
   "text": "На кадре — документ из <code>shop.products</code>. Отметьте <b>все</b> фильтры, которые его найдут.",
   "options": [
    "<code>{ brand: \"Dell\", price: 21990 }</code>",
    "<code>{ title: \"Монитор Dell\" }</code>",
    "<code>{ price: \"21990\" }</code>",
    "<code>{ category: \"Периферия\" }</code>",
    "<code>{ sku: \"SKU-PR-012\", rating: 3.7 }</code>"
   ],
   "img": {
    "src": "img/p-012.png",
    "alt": "Compass: документ p-012 — монитор Dell",
    "caption": "Compass · shop.products"
   },
   "key": {
    "python": [
     "52c487b7b2c8042f",
     "6d71088ba340766c"
    ],
    "cpp": [
     "3dd406331b00a214",
     "b06e6f42729eb2c8"
    ],
    "go": [
     "d095e122ed846fd5",
     "e77ce485038fe549"
    ],
    "ruby": [
     "6381728e7b887045",
     "a2ea40d8c625fbed"
    ]
   },
   "chapters": [
    "1.2"
   ]
  },
  {
   "id": "q07",
   "topic": "1.3 · ordered",
   "type": "single",
   "text": "Вставляем пачку из 50 новых документов одним вызовом <code>insertMany</code> (в драйверах — <code>insert_many</code>, <code>InsertMany</code>) без дополнительных параметров. У двадцатого документа <code>_id</code> совпадает с ключом, который уже есть в коллекции. Сколько документов из пачки окажется в коллекции?",
   "options": [
    "19 — вставка остановилась на повторе",
    "49 — пропущен только документ с повтором",
    "0 — пачка пишется целиком или никак",
    "50 — повтор заменил старый документ"
   ],
   "key": {
    "python": [
     "30a9f2c2ba4a51fb"
    ],
    "cpp": [
     "4e05da1f926843e3"
    ],
    "go": [
     "47dfa13aa103c6bd"
    ],
    "ruby": [
     "25786951d4d423a1"
    ]
   },
   "chapters": [
    "1.3"
   ]
  },
  {
   "id": "q08",
   "topic": "1.3 · ordered=false",
   "type": "single",
   "text": "Что напечатает фрагмент?",
   "options": [
    "ошибок: 1 · всего: 22",
    "ошибок: 2 · всего: 21",
    "ошибок: 1 · всего: 23",
    "ошибок: 2 · всего: 23"
   ],
   "code": {
    "python": "from pymongo.errors import BulkWriteError\n\nbatch = [{\"_id\": \"p-201\"}, {\"_id\": \"p-001\"}, {\"_id\": \"p-202\"}, {\"_id\": \"p-201\"}]\ntry:\n    box.insert_many(batch, ordered=False)\nexcept BulkWriteError as error:\n    print(\"ошибок:\", len(error.details[\"writeErrors\"]))\nprint(\"всего:\", box.count_documents({}))",
    "ruby": "batch = [{ \"_id\" => \"p-201\" }, { \"_id\" => \"p-001\" },\n         { \"_id\" => \"p-202\" }, { \"_id\" => \"p-201\" }]\nbegin\n  box.insert_many(batch, ordered: false)\nrescue Mongo::Error::BulkWriteError => error\n  puts \"ошибок: #{error.result[\"writeErrors\"].size}\"\nend\nputs \"всего: #{box.count_documents({})}\"",
    "go": "batch := []any{\n    bson.D{{Key: \"_id\", Value: \"p-201\"}}, bson.D{{Key: \"_id\", Value: \"p-001\"}},\n    bson.D{{Key: \"_id\", Value: \"p-202\"}}, bson.D{{Key: \"_id\", Value: \"p-201\"}},\n}\n_, err := box.InsertMany(ctx, batch, options.InsertMany().SetOrdered(false))\nvar bulkErr mongo.BulkWriteException\nif errors.As(err, &bulkErr) {\n    fmt.Println(\"ошибок:\", len(bulkErr.WriteErrors))\n}\ntotal, _ := box.CountDocuments(ctx, bson.D{})\nfmt.Println(\"всего:\", total)",
    "cpp": "std::vector<bsoncxx::document::value> batch;\nfor (auto id : {\"p-201\", \"p-001\", \"p-202\", \"p-201\"})\n    batch.push_back(make_document(kvp(\"_id\", id)));\n\nmongocxx::options::insert options;\noptions.ordered(false);\ntry {\n    box.insert_many(batch, options);\n} catch (const mongocxx::bulk_write_exception& error) {\n    auto errors = error.raw_server_error()->view()[\"writeErrors\"].get_array().value;\n    std::cout << \"ошибок: \" << std::distance(errors.begin(), errors.end()) << std::endl;\n}\nstd::cout << \"всего: \" << box.count_documents(make_document()) << std::endl;"
   },
   "key": {
    "python": [
     "e8ac4185ee5480ff"
    ],
    "cpp": [
     "1f5c900fb6284bae"
    ],
    "go": [
     "9603d834dd29a004"
    ],
    "ruby": [
     "8434bae465816224"
    ]
   },
   "chapters": [
    "1.3"
   ]
  },
  {
   "id": "q09",
   "topic": "1.3 · загрузка",
   "type": "single",
   "text": "Скрипт читает файл выгрузки и вставляет все документы одним <code>insertMany</code>. У документов в файле нет поля <code>_id</code>. Скрипт по ошибке запустили дважды. Что получится?",
   "options": [
    "На втором запуске ошибка E11000, данные остались целы",
    "Документов стало вдвое больше, ошибки при этом не было",
    "Второй запуск заменил документы, записанные первым",
    "Второй запуск ничего не записал: такие документы уже есть"
   ],
   "key": {
    "python": [
     "990959465bc24b37"
    ],
    "cpp": [
     "f4ad1e2635d93df8"
    ],
    "go": [
     "e5df9e6e979c77f7"
    ],
    "ruby": [
     "cdf795daa3bbb4e3"
    ]
   },
   "chapters": [
    "1.3"
   ]
  },
  {
   "id": "q10",
   "topic": "1.4 · курсор",
   "type": "single",
   "text": "Ноутбуков в коллекции пять. Что напечатает фрагмент <b>на вашем языке</b>?",
   "options": [
    "найдено: 5 · названий: 5",
    "найдено: 5 · названий: 0",
    "найдено: 0 · названий: 5",
    "найдено: 5, затем ошибка: курсор уже закрыт"
   ],
   "code": {
    "python": "cursor = products.find({\"category\": \"ноутбуки\"})\nprint(\"найдено:\", len(list(cursor)))\n\ntitles = [doc[\"title\"] for doc in cursor]\nprint(\"названий:\", len(titles))",
    "ruby": "view = products.find({ \"category\" => \"ноутбуки\" })\nputs \"найдено: #{view.to_a.size}\"\n\ntitles = view.map { |doc| doc[\"title\"] }\nputs \"названий: #{titles.size}\"",
    "go": "cursor, _ := products.Find(ctx, bson.D{{Key: \"category\", Value: \"ноутбуки\"}})\nvar list []Product\ncursor.All(ctx, &list)\nfmt.Println(\"найдено:\", len(list))\n\ntitles := 0\nfor cursor.Next(ctx) {\n    titles++\n}\nfmt.Println(\"названий:\", titles)",
    "cpp": "auto cursor = products.find(make_document(kvp(\"category\", \"ноутбуки\")));\nstd::cout << \"найдено: \" << std::distance(cursor.begin(), cursor.end()) << std::endl;\n\nint titles = 0;\nfor (const auto& doc : cursor) ++titles;\nstd::cout << \"названий: \" << titles << std::endl;"
   },
   "key": {
    "python": [
     "379d4defdee3c952"
    ],
    "cpp": [
     "1d292337ca3dfdd7"
    ],
    "go": [
     "753a70ca09531b7c"
    ],
    "ruby": [
     "7101cfbd2bb1e4cd"
    ]
   },
   "chapters": [
    "1.4"
   ]
  },
  {
   "id": "q11",
   "topic": "1.4 · вложенные поля",
   "type": "single",
   "text": "В <code>shop.orders</code> 28 заказов с доставкой в Екатеринбург; у каждого в <code>delivery</code> три поля: <code>city</code>, <code>type</code> и <code>days</code>. Сколько документов посчитает запрос?",
   "options": [
    "28 — столько же, сколько с условием на delivery.city",
    "0 — delivery должен совпасть с документом целиком",
    "Ошибка: вложенный документ в фильтре сравнивать нельзя",
    "120 — условие на вложенный документ не учитывается"
   ],
   "code": {
    "shell": "db.orders.countDocuments({\n  delivery: { city: \"Екатеринбург\" }\n})"
   },
   "key": {
    "python": [
     "6955eb4484acba94"
    ],
    "cpp": [
     "2fec4caccdecff59"
    ],
    "go": [
     "8c2e57caae56a9e7"
    ],
    "ruby": [
     "48ad6b38671511f3"
    ]
   },
   "chapters": [
    "1.4"
   ]
  },
  {
   "id": "q12",
   "topic": "1.4 · findOne",
   "type": "single",
   "text": "Смартфонов в коллекции четыре, самый дешёвый из них — Xiaomi за 18 990. Запрос <code>findOne({ category: \"смартфоны\" })</code> вернул именно его. Какой вывод верен?",
   "options": [
    "findOne отдаёт самый дешёвый документ из подходящих",
    "findOne отдаёт документ, вставленный в коллекцию первым",
    "Какой из подходящих вернётся, без сортировки не определено",
    "Совпадение случайно: findOne сортирует документы по _id"
   ],
   "key": {
    "python": [
     "2df8eab6a56f1735"
    ],
    "cpp": [
     "f2435ad51ed14fcb"
    ],
    "go": [
     "b8436024a75aa95f"
    ],
    "ruby": [
     "9bff71d8d3aa5d47"
    ]
   },
   "chapters": [
    "1.4"
   ]
  },
  {
   "id": "q13",
   "topic": "1.5 · проекция",
   "type": "multi",
   "text": "Отметьте <b>все</b> проекции, которые сервер выполнит без ошибки.",
   "options": [
    "<code>{ _id: 0, title: 1, price: 1 }</code>",
    "<code>{ title: 1, stock: 0 }</code>",
    "<code>{ stock: 0, specs: 0, _id: 0 }</code>",
    "<code>{ title: 1, \"delivery.city\": 1 }</code>",
    "<code>{ title: 0, price: 1, _id: 1 }</code>"
   ],
   "key": {
    "python": [
     "1601d50195a8a19d",
     "5c67c5cd877ad516",
     "67784361a73e944a"
    ],
    "cpp": [
     "95c98ae29d67c0fe",
     "a79dcdd1ae2efbab",
     "e422cc5ebc5b5692"
    ],
    "go": [
     "100a5684869c640b",
     "4a7fdbd746e118e0",
     "df6a6c6de8b1c3e3"
    ],
    "ruby": [
     "6a3b42a2be80f180",
     "e44acb99613ea64f",
     "fe9bc6e472d10ebd"
    ]
   },
   "chapters": [
    "1.5"
   ]
  },
  {
   "id": "q14",
   "topic": "1.5 · проекция в Compass",
   "type": "single",
   "text": "На кадре — запрос в Compass и его результат. Какой запрос в оболочке вернёт те же документы?",
   "options": [
    "<code>db.products.find({ category: \"ноутбуки\" }, { title: 1, price: 1 })</code>",
    "<code>db.products.find({ category: \"ноутбуки\", _id: 0 }, { title: 1, price: 1 })</code>",
    "<code>db.products.find({ _id: 0, title: 1, price: 1 }, { category: \"ноутбуки\" })</code>",
    "<code>db.products.find({ category: \"ноутбуки\" }, { _id: 0, title: 1, price: 1 })</code>"
   ],
   "img": {
    "src": "img/projection.png",
    "alt": "Compass: фильтр и проекция к shop.products",
    "caption": "Compass · shop.products · Options раскрыты"
   },
   "key": {
    "python": [
     "7f17a32625913467"
    ],
    "cpp": [
     "6fb087b1e0e04f3f"
    ],
    "go": [
     "f510c0607b0463b7"
    ],
    "ruby": [
     "aeb8201103ea6fc1"
    ]
   },
   "chapters": [
    "1.5"
   ]
  },
  {
   "id": "q15",
   "topic": "1.5 · вложенные поля",
   "type": "single",
   "text": "Заказ <code>2026-0004</code> доставлен в Москву, его сумма — 106 210. Что вернёт запрос?",
   "options": [
    "<code>{ total: 106210, delivery: { city: \"Москва\" } }</code>",
    "<code>{ total: 106210, \"delivery.city\": \"Москва\" }</code>",
    "<code>{ total: 106210, city: \"Москва\" }</code>",
    "<code>{ total: 106210, delivery: \"Москва\" }</code>"
   ],
   "code": {
    "shell": "db.orders.findOne(\n  { number: \"2026-0004\" },\n  { _id: 0, total: 1, \"delivery.city\": 1 }\n)"
   },
   "key": {
    "python": [
     "da84e40b8e76d73d"
    ],
    "cpp": [
     "4d4270572844929b"
    ],
    "go": [
     "817d2d03cbf91b36"
    ],
    "ruby": [
     "8758423b46c1ca94"
    ]
   },
   "chapters": [
    "1.5"
   ]
  },
  {
   "id": "q16",
   "topic": "1.6 · limit в Compass",
   "type": "single",
   "text": "Над списком Compass пишет <b>1 – 5 of 5</b>. Что это число говорит о запросе?",
   "options": [
    "Под пустой фильтр подошло пять товаров из коллекции",
    "Выдачу обрезал Limit, сколько подошло всего — не видно",
    "Показана первая из пяти страниц результата",
    "Дороже остальных в коллекции ровно пять товаров"
   ],
   "img": {
    "src": "img/sort-limit.png",
    "alt": "Compass: проекция, сортировка по цене, Limit 5",
    "caption": "Compass · shop.products · Options раскрыты"
   },
   "key": {
    "python": [
     "29ace59c6d9baad3"
    ],
    "cpp": [
     "10ffc3e06ec340c7"
    ],
    "go": [
     "93379fa41cb4367b"
    ],
    "ruby": [
     "516bd6395bc2dc10"
    ]
   },
   "chapters": [
    "1.6"
   ]
  },
  {
   "id": "q17",
   "topic": "1.6 · порядок методов",
   "type": "single",
   "text": "Что вернёт запрос, в котором предел записан раньше сортировки?",
   "options": [
    "Пять первых попавшихся товаров, упорядоченных по цене",
    "Все 21 товар: limit перед sort не срабатывает",
    "Пять самых дорогих — как при sort перед limit",
    "Ошибку: sort нельзя вызывать после limit"
   ],
   "code": {
    "shell": "db.products.find({}, { _id: 0, title: 1, price: 1 })\n  .limit(5)\n  .sort({ price: -1 })"
   },
   "key": {
    "python": [
     "aef0f2b928ba7344"
    ],
    "cpp": [
     "d94b78afb877aefd"
    ],
    "go": [
     "c292e841d7733ed3"
    ],
    "ruby": [
     "1bbf019a470e01d5"
    ]
   },
   "chapters": [
    "1.6"
   ]
  },
  {
   "id": "q18",
   "topic": "1.6 · страницы",
   "type": "single",
   "text": "Каталог листается запросом <code>.sort({ price: 1 }).skip((page − 1) × 10).limit(10)</code>. Товаров с ценой 1 990 шесть. Пользователь жалуется: один из них виден на двух страницах подряд, а другой не показывается нигде. Как исправить?",
   "options": [
    "Сортировать по убыванию цены, а не по возрастанию",
    "Вызывать limit раньше skip, чтобы сервер не путался",
    "Добавить вторым ключом сортировки уникальное поле _id",
    "Увеличить размер страницы, чтобы повторы влезли в одну"
   ],
   "key": {
    "python": [
     "009f696f881e6790"
    ],
    "cpp": [
     "24da1bb9b2aa90f7"
    ],
    "go": [
     "b6b5c674303a3362"
    ],
    "ruby": [
     "3b551df4144e7c1e"
    ]
   },
   "chapters": [
    "1.6"
   ]
  },
  {
   "id": "q19",
   "topic": "1.6 · типы и сортировка",
   "type": "single",
   "text": "У одного товара цену по ошибке записали строкой <code>\"790\"</code>, у остальных 20 — числа от 2 990 до 114 990. Где он окажется в выдаче <code>.sort({ price: 1 })</code>?",
   "options": [
    "Первым: 790 меньше всех остальных цен",
    "Среди чисел — там, где было бы число 790",
    "Последним: строки идут после всех чисел",
    "Нигде: документ со строкой в сортировку не попадёт"
   ],
   "key": {
    "python": [
     "bff50517b814ecc0"
    ],
    "cpp": [
     "b1581c93d043527c"
    ],
    "go": [
     "5320af33107efc59"
    ],
    "ruby": [
     "6f26dc541ceb51a2"
    ]
   },
   "chapters": [
    "1.6"
   ]
  },
  {
   "id": "q20",
   "topic": "1.7 · операторы",
   "type": "single",
   "text": "До запроса у товара <code>p-003</code> были поля <code>reviews: 31</code> и <code>discount: 10</code>. После одного запроса документ выглядит так, как на кадре. Какое изменение выполнили?",
   "options": [
    "<code>{ $set: { reviews: 32, discount: null } }</code>",
    "<code>{ $inc: { reviews: 1 }, $unset: { discount: \"\" } }</code>",
    "<code>{ $inc: { reviews: 1 }, $set: { discount: 0 } }</code>",
    "<code>{ $set: { reviews: \"32\" }, $unset: { discount: 1 } }</code>"
   ],
   "img": {
    "src": "img/after-update.png",
    "alt": "Compass: документ p-003 после обновления",
    "caption": "Compass · sandbox.products · после запроса"
   },
   "key": {
    "python": [
     "7585ee1839d4346f"
    ],
    "cpp": [
     "92b7e5bbb3a65126"
    ],
    "go": [
     "831c243c1855296c"
    ],
    "ruby": [
     "4e5baae92cc740b5"
    ]
   },
   "chapters": [
    "1.7"
   ]
  },
  {
   "id": "q21",
   "topic": "1.7 · результат обновления",
   "type": "single",
   "text": "Функция сохраняет цену из формы. У <code>p-003</code> цена уже 67 900, товара <code>p-777</code> нет. Что напечатает фрагмент?",
   "options": [
    "сохранено · не найден",
    "не найден · не найден",
    "сохранено · сохранено",
    "ошибка записи · не найден"
   ],
   "code": {
    "python": "def save_price(product_id, price):\n    res = box.update_one({\"_id\": product_id}, {\"$set\": {\"price\": price}})\n    return \"не найден\" if res.modified_count == 0 else \"сохранено\"\n\nprint(save_price(\"p-003\", 67900))\nprint(save_price(\"p-777\", 1000))",
    "ruby": "save_price = lambda do |product_id, price|\n  res = box.update_one({ \"_id\" => product_id }, { \"$set\" => { \"price\" => price } })\n  res.modified_count.zero? ? \"не найден\" : \"сохранено\"\nend\n\nputs save_price.call(\"p-003\", 67900)\nputs save_price.call(\"p-777\", 1000)",
    "go": "savePrice := func(productID string, price int) string {\n    res, _ := box.UpdateOne(ctx, bson.D{{Key: \"_id\", Value: productID}},\n        bson.D{{Key: \"$set\", Value: bson.D{{Key: \"price\", Value: price}}}})\n    if res.ModifiedCount == 0 {\n        return \"не найден\"\n    }\n    return \"сохранено\"\n}\n\nfmt.Println(savePrice(\"p-003\", 67900))\nfmt.Println(savePrice(\"p-777\", 1000))",
    "cpp": "auto save_price = [&](const std::string& product_id, int price) {\n    auto res = box.update_one(make_document(kvp(\"_id\", product_id)),\n        make_document(kvp(\"$set\", make_document(kvp(\"price\", price)))));\n    return res->modified_count() == 0 ? \"не найден\" : \"сохранено\";\n};\n\nstd::cout << save_price(\"p-003\", 67900) << std::endl;\nstd::cout << save_price(\"p-777\", 1000) << std::endl;"
   },
   "key": {
    "python": [
     "461f581e6459ec7f"
    ],
    "cpp": [
     "5ae8790f2dc339d7"
    ],
    "go": [
     "8b18c65cdbbbbb37"
    ],
    "ruby": [
     "7ee3a6c7061fb33c"
    ]
   },
   "chapters": [
    "1.7"
   ]
  },
  {
   "id": "q22",
   "topic": "1.7 · вложенный документ",
   "type": "single",
   "text": "У заказа <code>o-0004</code> поле <code>payment</code> — <code>{ method: \"карта\", paid: true }</code>. Каким станет <code>payment</code> после запроса?",
   "options": [
    "<code>{ method: \"карта\", paid: false }</code>",
    "<code>{ paid: false }</code>",
    "<code>{ method: null, paid: false }</code>",
    "Ошибка записи, без изменений"
   ],
   "code": {
    "shell": "db.orders.updateOne(\n  { _id: \"o-0004\" },\n  { $set: { payment: { paid: false } } }\n)"
   },
   "key": {
    "python": [
     "80be286a0de11615"
    ],
    "cpp": [
     "f6185c0ed19163c6"
    ],
    "go": [
     "dcffb24fc324b90a"
    ],
    "ruby": [
     "d3de624185ef758c"
    ]
   },
   "chapters": [
    "1.7"
   ]
  },
  {
   "id": "q23",
   "topic": "1.7 · upsert",
   "type": "single",
   "text": "Товара с артикулом <code>SKU-X-1</code> в песочнице нет. Что сделает запрос?",
   "options": [
    "Вставит документ с новым ObjectId и одним полем price",
    "Вставит документ с новым ObjectId, полями sku и price",
    "Вернёт ошибку: upsert требует _id в условии поиска",
    "Ничего не вставит: обновлять нечего, matched равен 0"
   ],
   "code": {
    "shell": "db.products.updateOne(\n  { sku: \"SKU-X-1\" },\n  { $set: { price: 100 } },\n  { upsert: true }\n)"
   },
   "key": {
    "python": [
     "aa3c6b229ff383e3"
    ],
    "cpp": [
     "404c5319620607df"
    ],
    "go": [
     "55a7d4853867c8f1"
    ],
    "ruby": [
     "92bc50039454ee83"
    ]
   },
   "chapters": [
    "1.7"
   ]
  },
  {
   "id": "q24",
   "topic": "1.8 · фильтр удаления",
   "type": "single",
   "text": "Функция удаляет товары выбранной категории. Поле категории в форме оставили пустым. Что напечатает фрагмент?",
   "options": [
    "удалено: 0",
    "удалено: 21",
    "удалено: 1",
    "ошибка записи"
   ],
   "code": {
    "python": "def remove_category(category):\n    query = {}\n    if category:\n        query[\"category\"] = category\n    return box.delete_many(query).deleted_count\n\nprint(\"удалено:\", remove_category(\"\"))",
    "ruby": "remove_category = lambda do |category|\n  query = {}\n  query[\"category\"] = category unless category.empty?\n  box.delete_many(query).deleted_count\nend\n\nputs \"удалено: #{remove_category.call(\"\")}\"",
    "go": "removeCategory := func(category string) int64 {\n    query := bson.D{}\n    if category != \"\" {\n        query = append(query, bson.E{Key: \"category\", Value: category})\n    }\n    res, _ := box.DeleteMany(ctx, query)\n    return res.DeletedCount\n}\n\nfmt.Println(\"удалено:\", removeCategory(\"\"))",
    "cpp": "auto remove_category = [&](const std::string& category) {\n    bsoncxx::builder::basic::document query;\n    if (!category.empty()) query.append(kvp(\"category\", category));\n    return box.delete_many(query.extract())->deleted_count();\n};\n\nstd::cout << \"удалено: \" << remove_category(\"\") << std::endl;"
   },
   "key": {
    "python": [
     "4602ea294dd24dc9"
    ],
    "cpp": [
     "3099bf204bbfa350"
    ],
    "go": [
     "0675049aa89bc845"
    ],
    "ruby": [
     "bfb685d06ad270b9"
    ]
   },
   "chapters": [
    "1.8"
   ]
  },
  {
   "id": "q25",
   "topic": "1.8 · очистка и удаление",
   "type": "multi",
   "text": "Отметьте <b>все</b> верные утверждения.",
   "options": [
    "После deleteMany({}) индексы коллекции сохраняются",
    "После drop() коллекции нет в списке коллекций базы",
    "Сервер отклоняет deleteMany({}) как опасный запрос",
    "Удаление через drop() можно отменить, пока не закрыт клиент",
    "Удаление, которое ничего не нашло, возвращает ноль без ошибки"
   ],
   "key": {
    "python": [
     "33f84b5bbfb43c02",
     "6f621685731a8d62",
     "79d18068a45a0f66"
    ],
    "cpp": [
     "2cdc730f013a6a11",
     "4fa5447dbee24006",
     "52f7346587de8174"
    ],
    "go": [
     "477abe284d3117f9",
     "a1d374d0be461fe5",
     "ea23d4ff2bde8507"
    ],
    "ruby": [
     "153595c66781f5c2",
     "7859cb6703f2fce1",
     "d4142c7f7c81d5f6"
    ]
   },
   "chapters": [
    "1.8"
   ]
  }
 ]
};

const SECRET = "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";

let SECRET_CACHE = null;
async function secretData() {
  if (SECRET_CACHE) return SECRET_CACHE;
  const pad = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(QUIZ.salt)));
  const bytes = Uint8Array.from(atob(SECRET), c => c.charCodeAt(0)).map((b, i) => b ^ pad[i % pad.length]);
  SECRET_CACHE = JSON.parse(new TextDecoder().decode(bytes));
  return SECRET_CACHE;
}

async function shortHash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/* Выбранные варианты (номера в исходном порядке) должны точно совпасть с ключом языка. */
async function isCorrect(question, picked, lang) {
  const key = question.key[lang] || [];
  if (!picked || picked.length !== key.length) return false;
  const hashes = await Promise.all(picked.map(i => shortHash(`${QUIZ.salt}|${question.id}|${lang}|${i}`)));
  return hashes.every(h => key.includes(h)) && new Set(hashes).size === hashes.length;
}

function gradeFor(score) {
  return QUIZ.grades.find(g => score >= g.min) || QUIZ.grades[QUIZ.grades.length - 1];
}
