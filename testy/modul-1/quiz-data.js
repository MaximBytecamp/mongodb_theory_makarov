/* Тест модуля 1 · справочник по MongoDB. Файл собран скриптом — руками не править.

   Верные ответы здесь только хешами: SHA-256 от "СОЛЬ|вопрос|язык|вариант".
   Это барьер от беглого чтения исходника, а не защита: вариантов мало,
   перебрать их в консоли можно. Разбора ответов в публичных файлах нет. */

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
 "questions": [
  {
   "id": "q01",
   "topic": "1.1 · подключение",
   "type": "single",
   "text": "Сервер учебного стенда слушает порт 27017. Программу запустили с опечаткой в порте. Что произойдёт?",
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
  }
 ]
};

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
