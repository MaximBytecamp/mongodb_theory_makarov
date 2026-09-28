/* Тест модуля 2 · справочник по MongoDB. Файл собран скриптом — руками не править.

   Верные ответы здесь дважды: хешами SHA-256 от "СОЛЬ|вопрос|язык|вариант"
   в самих вопросах и вместе с разбором в SECRET — JSON, перемешанный XOR
   с SHA-256 от соли, в base64. Разбор показывается после отправки работы.
   Это барьер от беглого чтения исходника, а не защита: вариантов мало,
   перебрать их в консоли можно. */

const QUIZ = {
 "id": "mdb-test-m2-r2",
 "title": "Модуль 2 · язык фильтров",
 "minutes": 40,
 "salt": "mdb-m2-2026-sep",
 "context": "Переменные <code>resumes</code>, <code>vacancies</code>, <code>companies</code> и <code>interviews</code> — коллекции базы <code>hh</code>, <code>box</code> — песочница <code>sandbox.products</code>, как в заготовках глав модуля 2. Перед каждым фрагментом базы в исходном состоянии. Во вкладках «Документы в базе» показаны документы, с которыми работает фрагмент, — только поля, нужные для ответа. Вывод в вариантах записан без выравнивающих пробелов.",
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
  "1.2": {
   "title": "Документ и BSON",
   "url": "../../temy/02-dokument-i-bson/index.html"
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
  },
  "2.1": {
   "title": "Фильтр — это документ. Точечная нотация",
   "url": "../../temy/09-filtr-i-tochechnaya-notaciya/index.html"
  },
  "2.2": {
   "title": "Сравнение: $eq $ne $gt $gte $lt $lte",
   "url": "../../temy/10-sravnenie/index.html"
  },
  "2.3": {
   "title": "Списки значений: $in и $nin",
   "url": "../../temy/11-spiski-in-nin/index.html"
  },
  "2.4": {
   "title": "Логика: $and $or $not $nor",
   "url": "../../temy/12-logika/index.html"
  },
  "2.5": {
   "title": "Есть ли поле: $exists и $type",
   "url": "../../temy/13-exists-type/index.html"
  },
  "2.6": {
   "title": "Массивы: $all, $elemMatch, $size",
   "url": "../../temy/14-massivy/index.html"
  },
  "2.7": {
   "title": "Текстовые шаблоны: $regex и $options",
   "url": "../../temy/15-regex/index.html"
  },
  "2.8": {
   "title": "Сравнение полей между собой: $expr",
   "url": "../../temy/16-expr/index.html"
  }
 },
 "questions": [
  {
   "id": "q01",
   "topic": "2.1 · вложенный документ",
   "type": "single",
   "text": "Фрагмент ищет вакансию по вилке зарплаты, записанной целым документом. Два фильтра отличаются только порядком полей внутри <code>salary</code>. Что напечатает фрагмент?",
   "options": [
    "<code>from, затем to: 1</code><br><code>to, затем from: 1</code>",
    "<code>from, затем to: 1</code><br><code>to, затем from: 0</code>",
    "<code>from, затем to: 0</code><br><code>to, затем from: 0</code>",
    "<code>from, затем to: 0</code><br><code>to, затем from: 1</code>"
   ],
   "code": {
    "python": "print(\"from, затем to:\", vacancies.count_documents({\"salary\": {\"from\": 60000, \"to\": 90000}}))\nprint(\"to, затем from:\", vacancies.count_documents({\"salary\": {\"to\": 90000, \"from\": 60000}}))",
    "cpp": "std::cout << \"from, затем to: \" << vacancies.count_documents(make_document(kvp(\"salary\", make_document(kvp(\"from\", 60000), kvp(\"to\", 90000))))) << std::endl;\nstd::cout << \"to, затем from: \" << vacancies.count_documents(make_document(kvp(\"salary\", make_document(kvp(\"to\", 90000), kvp(\"from\", 60000))))) << std::endl;",
    "go": "pryamo, _ := vacancies.CountDocuments(ctx, bson.D{{Key: \"salary\", Value: bson.D{{Key: \"from\", Value: 60000}, {Key: \"to\", Value: 90000}}}})\nnaoborot, _ := vacancies.CountDocuments(ctx, bson.D{{Key: \"salary\", Value: bson.D{{Key: \"to\", Value: 90000}, {Key: \"from\", Value: 60000}}}})\n\nfmt.Println(\"from, затем to:\", pryamo)\nfmt.Println(\"to, затем from:\", naoborot)",
    "ruby": "puts \"from, затем to: \" + vacancies.count_documents({ \"salary\" => { \"from\" => 60000, \"to\" => 90000 } }).to_s\nputs \"to, затем from: \" + vacancies.count_documents({ \"salary\" => { \"to\" => 90000, \"from\" => 60000 } }).to_s"
   },
   "docs": [
    {
     "title": "hh.vacancies",
     "note": "hh.vacancies: все 8 вакансий; показаны поля title, salary, _id",
     "text": "{ _id: 'v-001', title: 'Junior Python-разработчик', salary: { from: 60000, to: 90000 } }\n{ _id: 'v-004', title: 'Тестировщик', salary: { from: 70000, to: 95000 } }\n{ _id: 'v-005', title: 'Backend-разработчик .NET', salary: { from: 100000, to: 150000 } }\n{ _id: 'v-006', title: 'Frontend-разработчик', salary: { from: 90000, to: 140000 } }\n{ _id: 'v-002', title: 'Инженер сопровождения БД', salary: { from: 80000, to: 120000 } }\n{ _id: 'v-007', title: 'Администратор баз данных', salary: { from: 110000, to: 160000 } }\n{ _id: 'v-003', title: 'Аналитик данных', salary: { from: 120000, to: 180000 } }\n{ _id: 'v-008', title: 'Data-инженер', salary: { from: 140000, to: 200000 } }"
    }
   ],
   "key": {
    "python": [
     "509556e130e5afae"
    ],
    "cpp": [
     "bc47e39d5be156bc"
    ],
    "go": [
     "a7b8f746d97a4ac1"
    ],
    "ruby": [
     "aed649c5b2541368"
    ]
   },
   "chapters": [
    "2.1"
   ]
  },
  {
   "id": "q02",
   "topic": "2.1 · фильтр и документ",
   "type": "multi",
   "text": "На кадре — одно резюме из <code>hh.resumes</code>. Отметьте <b>все</b> фильтры, под которые оно подходит.",
   "options": [
    "<code>{ \"education.level\": \"СПО\", city: \"Ярославль\" }</code>",
    "<code>{ education: { level: \"СПО\" } }</code>",
    "<code>{ skills: \"SQL\" }</code>",
    "<code>{ \"experience.stack\": \"PostgreSQL\" }</code>",
    "<code>{ salary: \"70000\", city: \"Ярославль\" }</code>",
    "<code>{ \"experience.months\": { $gte: 6 } }</code>"
   ],
   "img": {
    "src": "img/resume-kovalev.png",
    "alt": "Compass: резюме Петра Ковалёва целиком",
    "caption": "Compass · hh.resumes"
   },
   "key": {
    "python": [
     "5c8e11970d340b10",
     "9cac8905fa49287f",
     "b102db9f77041141",
     "db2280e3da40e7d8"
    ],
    "cpp": [
     "822b7882b357e794",
     "92728c0d2c7a7f91",
     "d17b34393b2a5ab9",
     "f6b042a273d0faf6"
    ],
    "go": [
     "367ad625bf3a4834",
     "5ec900bd988c73d5",
     "bd5d13ca3f37c830",
     "f40cca9d0caf81d6"
    ],
    "ruby": [
     "37ccfc2cad9641dc",
     "9d6c371be61db03b",
     "c75d5022435ea0fd",
     "fd9c6b9eccb1b5a3"
    ]
   },
   "chapters": [
    "2.1"
   ]
  },
  {
   "id": "q03",
   "topic": "2.1 · точка и массив документов",
   "type": "single",
   "text": "Фрагмент считает резюме, где встречается SQL: сначала в навыках <code>skills</code>, затем в стеке мест работы <code>experience.stack</code>. Что напечатает фрагмент?",
   "options": [
    "<code>skills: 4</code><br><code>experience.stack: 3</code>",
    "<code>skills: 4</code><br><code>experience.stack: 0</code>",
    "<code>skills: 4</code><br><code>experience.stack: 4</code>",
    "<code>skills: 0</code><br><code>experience.stack: 3</code>"
   ],
   "code": {
    "python": "print(\"skills:          \", resumes.count_documents({\"skills\": \"SQL\"}))\nprint(\"experience.stack:\", resumes.count_documents({\"experience.stack\": \"SQL\"}))",
    "cpp": "std::cout << \"skills:           \" << resumes.count_documents(make_document(kvp(\"skills\", \"SQL\"))) << std::endl;\nstd::cout << \"experience.stack: \" << resumes.count_documents(make_document(kvp(\"experience.stack\", \"SQL\"))) << std::endl;",
    "go": "navyki, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"skills\", Value: \"SQL\"}})\nstek, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"experience.stack\", Value: \"SQL\"}})\n\nfmt.Println(\"skills:          \", navyki)\nfmt.Println(\"experience.stack:\", stek)",
    "ruby": "puts \"skills:           \" + resumes.count_documents({ \"skills\" => \"SQL\" }).to_s\nputs \"experience.stack: \" + resumes.count_documents({ \"experience.stack\" => \"SQL\" }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, skills, experience.stack",
     "text": "{ fio: 'Анна Белова', skills: [ 'Python', 'Git' ] }\n{\n  fio: 'Пётр Ковалёв',\n  skills: [ 'Python', 'SQL', 'Git', 'Docker' ],\n  experience: [ { stack: [ 'Python', 'PostgreSQL' ] } ]\n}\n{\n  fio: 'Алина Дроздова',\n  skills: [ 'SQL', 'Python', 'ClickHouse', 'Power BI', 'Excel' ],\n  experience: [ { stack: [ 'ClickHouse', 'Python' ] }, { stack: [ 'SQL' ] } ]\n}\n{\n  fio: 'Игорь Самойлов',\n  skills: [ 'C#', '.NET', 'PostgreSQL', 'RabbitMQ', 'Docker' ],\n  experience: [ { stack: [ 'C#', 'PostgreSQL', 'RabbitMQ' ] } ]\n}\n{ fio: 'Дарья Нечаева', skills: [ 'JavaScript', 'React', 'HTML', 'CSS' ], experience: [] }\n{\n  fio: 'Тимур Валиев',\n  skills: [ 'PostgreSQL', 'MongoDB', 'Bash', 'Zabbix' ],\n  experience: [ { stack: [ 'PostgreSQL', 'MongoDB' ] }, { stack: [ 'Bash' ] } ]\n}\n{\n  fio: 'Ксения Лапина',\n  skills: [ 'Postman', 'SQL', 'Selenium', 'Python' ],\n  experience: [ { stack: [ 'Postman', 'SQL' ] } ]\n}\n{\n  fio: 'Марк Ефремов',\n  skills: [ 'Python', 'FastAPI', 'MongoDB', 'Git' ],\n  experience: [ { stack: [ 'Python', 'MongoDB' ] } ]\n}\n{\n  fio: 'Ольга Пирогова',\n  skills: [ 'SQL', 'Excel', 'Python', 'ClickHouse' ],\n  experience: [ { stack: [ 'SQL', 'Python' ] } ]\n}"
    }
   ],
   "key": {
    "python": [
     "980a60d1c2254cae"
    ],
    "cpp": [
     "3c029c2aa9928366"
    ],
    "go": [
     "147757448faa09ef"
    ],
    "ruby": [
     "51aa2fbae4228714"
    ]
   },
   "chapters": [
    "2.1"
   ]
  },
  {
   "id": "q04",
   "topic": "2.2 · даты и период",
   "type": "single",
   "text": "Фрагмент двумя способами считает собеседования за 27 сентября. Что он напечатает?",
   "options": [
    "<code>$gte 27.09, $lte 27.09: 4</code><br><code>$gte 27.09, $lt 28.09: 4</code>",
    "<code>$gte 27.09, $lte 27.09: 0</code><br><code>$gte 27.09, $lt 28.09: 4</code>",
    "<code>$gte 27.09, $lte 27.09: 4</code><br><code>$gte 27.09, $lt 28.09: 0</code>",
    "<code>$gte 27.09, $lte 27.09: 1</code><br><code>$gte 27.09, $lt 28.09: 4</code>"
   ],
   "code": {
    "python": "from datetime import datetime\n\nsep27 = datetime(2026, 9, 27)\nsep28 = datetime(2026, 9, 28)\n\nprint(\"$gte 27.09, $lte 27.09:\", interviews.count_documents({\"when\": {\"$gte\": sep27, \"$lte\": sep27}}))\nprint(\"$gte 27.09, $lt 28.09: \", interviews.count_documents({\"when\": {\"$gte\": sep27, \"$lt\": sep28}}))",
    "cpp": "auto sep27 = bsoncxx::types::b_date{std::chrono::milliseconds{1790467200000}};   // 27.09.2026 00:00 UTC\nauto sep28 = bsoncxx::types::b_date{std::chrono::milliseconds{1790553600000}};   // 28.09.2026 00:00 UTC\n\nstd::cout << \"$gte 27.09, $lte 27.09: \" << interviews.count_documents(make_document(kvp(\"when\", make_document(kvp(\"$gte\", sep27), kvp(\"$lte\", sep27))))) << std::endl;\nstd::cout << \"$gte 27.09, $lt 28.09:  \" << interviews.count_documents(make_document(kvp(\"when\", make_document(kvp(\"$gte\", sep27), kvp(\"$lt\", sep28))))) << std::endl;",
    "go": "sep27 := time.Date(2026, 9, 27, 0, 0, 0, 0, time.UTC)\nsep28 := time.Date(2026, 9, 28, 0, 0, 0, 0, time.UTC)\n\notrezok, _ := interviews.CountDocuments(ctx, bson.D{{Key: \"when\", Value: bson.D{{Key: \"$gte\", Value: sep27}, {Key: \"$lte\", Value: sep27}}}})\npoluinterval, _ := interviews.CountDocuments(ctx, bson.D{{Key: \"when\", Value: bson.D{{Key: \"$gte\", Value: sep27}, {Key: \"$lt\", Value: sep28}}}})\n\nfmt.Println(\"$gte 27.09, $lte 27.09:\", otrezok)\nfmt.Println(\"$gte 27.09, $lt 28.09: \", poluinterval)",
    "ruby": "sep27 = Time.utc(2026, 9, 27)\nsep28 = Time.utc(2026, 9, 28)\n\nputs \"$gte 27.09, $lte 27.09: \" + interviews.count_documents({ \"when\" => { \"$gte\" => sep27, \"$lte\" => sep27 } }).to_s\nputs \"$gte 27.09, $lt 28.09:  \" + interviews.count_documents({ \"when\" => { \"$gte\" => sep27, \"$lt\" => sep28 } }).to_s"
   },
   "docs": [
    {
     "title": "hh.interviews",
     "note": "hh.interviews: собеседования с 26 по 28 сентября, по времени (всего в коллекции 60); показаны поля candidate, when. Время — по UTC",
     "text": "{ candidate: 'Елена Нечаева', when: ISODate('2026-09-26T10:00:00.000Z') }\n{ candidate: 'Софья Белова', when: ISODate('2026-09-26T12:00:00.000Z') }\n{ candidate: 'Елена Гончарова', when: ISODate('2026-09-26T12:00:00.000Z') }\n{ candidate: 'Марк Мельник', when: ISODate('2026-09-26T15:00:00.000Z') }\n{ candidate: 'Дарья Лапина', when: ISODate('2026-09-26T17:00:00.000Z') }\n{ candidate: 'Ольга Дроздова', when: ISODate('2026-09-27T10:00:00.000Z') }\n{ candidate: 'Юлия Крылова', when: ISODate('2026-09-27T12:00:00.000Z') }\n{ candidate: 'Пётр Мельник', when: ISODate('2026-09-27T14:00:00.000Z') }\n{ candidate: 'Тимур Ковалёв', when: ISODate('2026-09-27T16:00:00.000Z') }\n{ candidate: 'Никита Логинов', when: ISODate('2026-09-28T09:00:00.000Z') }\n{ candidate: 'Игорь Строев', when: ISODate('2026-09-28T09:00:00.000Z') }\n{ candidate: 'Вера Белова', when: ISODate('2026-09-28T10:00:00.000Z') }\n{ candidate: 'Ольга Пирогова', when: ISODate('2026-09-28T15:00:00.000Z') }"
    }
   ],
   "key": {
    "python": [
     "19a984fc539acc30"
    ],
    "cpp": [
     "9534de2031efe0a1"
    ],
    "go": [
     "2a094f9b6157f700"
    ],
    "ruby": [
     "0e51b57a7241e2c7"
    ]
   },
   "chapters": [
    "2.2"
   ]
  },
  {
   "id": "q05",
   "topic": "2.2 · $eq и значение из формы",
   "type": "single",
   "text": "Программа ищет резюме по ФИО и подставляет в фильтр значение из формы поиска. Вместо строки с ФИО форма прислала документ <code>{ \"$gt\": \"\" }</code>. Что напечатает фрагмент?",
   "options": [
    "<code>как есть: 9</code><br><code>через $eq: 0</code>",
    "<code>как есть: 0</code><br><code>через $eq: 0</code>",
    "<code>как есть: 9</code><br><code>через $eq: 9</code>",
    "<code>как есть: 0</code><br><code>через $eq: 9</code>"
   ],
   "code": {
    "python": "# так значение пришло из формы поиска\npoisk = {\"$gt\": \"\"}\n\nprint(\"как есть: \", resumes.count_documents({\"fio\": poisk}))\nprint(\"через $eq:\", resumes.count_documents({\"fio\": {\"$eq\": poisk}}))",
    "cpp": "// так значение пришло из формы поиска\nauto poisk = make_document(kvp(\"$gt\", \"\"));\n\nstd::cout << \"как есть:  \" << resumes.count_documents(make_document(kvp(\"fio\", poisk.view()))) << std::endl;\nstd::cout << \"через $eq: \" << resumes.count_documents(make_document(kvp(\"fio\", make_document(kvp(\"$eq\", poisk.view()))))) << std::endl;",
    "go": "// так значение пришло из формы поиска\npoisk := bson.D{{Key: \"$gt\", Value: \"\"}}\n\nkakEst, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"fio\", Value: poisk}})\ncherezEq, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"fio\", Value: bson.D{{Key: \"$eq\", Value: poisk}}}})\n\nfmt.Println(\"как есть: \", kakEst)\nfmt.Println(\"через $eq:\", cherezEq)",
    "ruby": "# так значение пришло из формы поиска\npoisk = { \"$gt\" => \"\" }\n\nputs \"как есть:  \" + resumes.count_documents({ \"fio\" => poisk }).to_s\nputs \"через $eq: \" + resumes.count_documents({ \"fio\" => { \"$eq\" => poisk } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio",
     "text": "{ fio: 'Анна Белова' }\n{ fio: 'Пётр Ковалёв' }\n{ fio: 'Алина Дроздова' }\n{ fio: 'Игорь Самойлов' }\n{ fio: 'Дарья Нечаева' }\n{ fio: 'Тимур Валиев' }\n{ fio: 'Ксения Лапина' }\n{ fio: 'Марк Ефремов' }\n{ fio: 'Ольга Пирогова' }"
    }
   ],
   "key": {
    "python": [
     "00dff5a4aacbbcc3"
    ],
    "cpp": [
     "6e0002bde32cdf27"
    ],
    "go": [
     "19722168652342c0"
    ],
    "ruby": [
     "a471c49111f22b45"
    ]
   },
   "chapters": [
    "2.2"
   ]
  },
  {
   "id": "q06",
   "topic": "2.3 · $nin",
   "type": "single",
   "text": "Фрагмент считает резюме с уровнем образования «СПО» и резюме, где уровень не «Высшее». Что он напечатает?",
   "options": [
    "<code>равно СПО: 4</code><br><code>$nin [Высшее]: 4</code>",
    "<code>равно СПО: 4</code><br><code>$nin [Высшее]: 5</code>",
    "<code>равно СПО: 5</code><br><code>$nin [Высшее]: 4</code>",
    "<code>равно СПО: 4</code><br><code>$nin [Высшее]: 3</code>"
   ],
   "code": {
    "python": "print(\"равно СПО:    \", resumes.count_documents({\"education.level\": \"СПО\"}))\nprint(\"$nin [Высшее]:\", resumes.count_documents({\"education.level\": {\"$nin\": [\"Высшее\"]}}))",
    "cpp": "std::cout << \"равно СПО:     \" << resumes.count_documents(make_document(kvp(\"education.level\", \"СПО\"))) << std::endl;\nstd::cout << \"$nin [Высшее]: \" << resumes.count_documents(make_document(kvp(\"education.level\", make_document(kvp(\"$nin\", make_array(\"Высшее\")))))) << std::endl;",
    "go": "spo, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"education.level\", Value: \"СПО\"}})\nneVysshee, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"education.level\", Value: bson.D{{Key: \"$nin\", Value: bson.A{\"Высшее\"}}}}})\n\nfmt.Println(\"равно СПО:    \", spo)\nfmt.Println(\"$nin [Высшее]:\", neVysshee)",
    "ruby": "puts \"равно СПО:     \" + resumes.count_documents({ \"education.level\" => \"СПО\" }).to_s\nputs \"$nin [Высшее]: \" + resumes.count_documents({ \"education.level\" => { \"$nin\" => [\"Высшее\"] } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, education.level",
     "text": "{ fio: 'Анна Белова' }\n{ fio: 'Пётр Ковалёв', education: { level: 'СПО' } }\n{ fio: 'Алина Дроздова', education: { level: 'Высшее' } }\n{ fio: 'Игорь Самойлов', education: { level: 'Высшее' } }\n{ fio: 'Дарья Нечаева', education: { level: 'СПО' } }\n{ fio: 'Тимур Валиев', education: { level: 'Высшее' } }\n{ fio: 'Ксения Лапина', education: { level: 'СПО' } }\n{ fio: 'Марк Ефремов', education: { level: 'СПО' } }\n{ fio: 'Ольга Пирогова', education: { level: 'Высшее' } }"
    }
   ],
   "key": {
    "python": [
     "bdd7951856f14dac"
    ],
    "cpp": [
     "c1638f5fda35718d"
    ],
    "go": [
     "d2ab37455e296716"
    ],
    "ruby": [
     "abcd597558bb773b"
    ]
   },
   "chapters": [
    "2.3"
   ]
  },
  {
   "id": "q07",
   "topic": "2.3 · пустой список",
   "type": "single",
   "text": "Список городов для фильтра собирается из формы поиска. Пользователь не отметил ни одного города, и список оказался пустым. Что напечатает фрагмент?",
   "options": [
    "<code>$in пустой: 0</code><br><code>$nin пустой: 8</code>",
    "<code>$in пустой: 8</code><br><code>$nin пустой: 8</code>",
    "<code>$in пустой: 8</code><br><code>$nin пустой: 0</code>",
    "<code>$in пустой: 0</code><br><code>$nin пустой: 0</code>"
   ],
   "code": {
    "python": "# города, отмеченные в форме: ни одного\ngoroda = []\n\nprint(\"$in пустой: \", vacancies.count_documents({\"city\": {\"$in\": goroda}}))\nprint(\"$nin пустой:\", vacancies.count_documents({\"city\": {\"$nin\": goroda}}))",
    "cpp": "// города, отмеченные в форме: ни одного\nauto goroda = make_array();\n\nstd::cout << \"$in пустой:  \" << vacancies.count_documents(make_document(kvp(\"city\", make_document(kvp(\"$in\", goroda.view()))))) << std::endl;\nstd::cout << \"$nin пустой: \" << vacancies.count_documents(make_document(kvp(\"city\", make_document(kvp(\"$nin\", goroda.view()))))) << std::endl;",
    "go": "// города, отмеченные в форме: ни одного\ngoroda := bson.A{}\n\nvSpiske, _ := vacancies.CountDocuments(ctx, bson.D{{Key: \"city\", Value: bson.D{{Key: \"$in\", Value: goroda}}}})\nneVSpiske, _ := vacancies.CountDocuments(ctx, bson.D{{Key: \"city\", Value: bson.D{{Key: \"$nin\", Value: goroda}}}})\n\nfmt.Println(\"$in пустой: \", vSpiske)\nfmt.Println(\"$nin пустой:\", neVSpiske)",
    "ruby": "# города, отмеченные в форме: ни одного\ngoroda = []\n\nputs \"$in пустой:  \" + vacancies.count_documents({ \"city\" => { \"$in\" => goroda } }).to_s\nputs \"$nin пустой: \" + vacancies.count_documents({ \"city\" => { \"$nin\" => goroda } }).to_s"
   },
   "docs": [
    {
     "title": "hh.vacancies",
     "note": "hh.vacancies: все 8 вакансий; показаны поля title, city, _id",
     "text": "{ _id: 'v-001', title: 'Junior Python-разработчик', city: 'Ярославль' }\n{ _id: 'v-004', title: 'Тестировщик', city: 'Казань' }\n{ _id: 'v-005', title: 'Backend-разработчик .NET', city: 'Ярославль' }\n{ _id: 'v-006', title: 'Frontend-разработчик', city: 'Санкт-Петербург' }\n{ _id: 'v-002', title: 'Инженер сопровождения БД', city: 'Ярославль' }\n{ _id: 'v-007', title: 'Администратор баз данных', city: 'Москва' }\n{ _id: 'v-003', title: 'Аналитик данных', city: 'Москва' }\n{ _id: 'v-008', title: 'Data-инженер', city: 'Москва' }"
    }
   ],
   "key": {
    "python": [
     "7e0803dcc6c5dcd9"
    ],
    "cpp": [
     "89eddd659801c7fb"
    ],
    "go": [
     "e11f141bf0aba185"
    ],
    "ruby": [
     "726aa360cff34590"
    ]
   },
   "chapters": [
    "2.3"
   ]
  },
  {
   "id": "q08",
   "topic": "1.2 + 2.3 · ключ в $in",
   "type": "single",
   "text": "Фрагмент читает резюме Петра Ковалёва и ищет его по ключу дважды: самим значением <code>_id</code> и тем же ключом, превращённым в строку. Что он напечатает?",
   "options": [
    "<code>ключом: 1</code><br><code>строкой: 1</code>",
    "<code>ключом: 1</code><br><code>строкой: 0</code>",
    "<code>ключом: 0</code><br><code>строкой: 1</code>",
    "<code>ключом: 0</code><br><code>строкой: 0</code>"
   ],
   "code": {
    "python": "doc = resumes.find_one({\"fio\": \"Пётр Ковалёв\"})\nprint(\"ключом:\", resumes.count_documents({\"_id\": {\"$in\": [doc[\"_id\"]]}}))\nprint(\"строкой:\", resumes.count_documents({\"_id\": {\"$in\": [str(doc[\"_id\"])]}}))",
    "ruby": "doc = resumes.find({ \"fio\" => \"Пётр Ковалёв\" }).first\nputs \"ключом: \" + resumes.count_documents({ \"_id\" => { \"$in\" => [doc[\"_id\"]] } }).to_s\nputs \"строкой: \" + resumes.count_documents({ \"_id\" => { \"$in\" => [doc[\"_id\"].to_s] } }).to_s",
    "go": "var doc bson.M\nresumes.FindOne(ctx, bson.D{{Key: \"fio\", Value: \"Пётр Ковалёв\"}}).Decode(&doc)\nid := doc[\"_id\"].(bson.ObjectID)\n\nkluchom, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"_id\", Value: bson.D{{Key: \"$in\", Value: bson.A{id}}}}})\nstrokoy, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"_id\", Value: bson.D{{Key: \"$in\", Value: bson.A{id.Hex()}}}}})\nfmt.Println(\"ключом:\", kluchom)\nfmt.Println(\"строкой:\", strokoy)",
    "cpp": "auto doc = resumes.find_one(make_document(kvp(\"fio\", \"Пётр Ковалёв\")));\nauto id = doc->view()[\"_id\"].get_oid().value;\n\nstd::cout << \"ключом: \" << resumes.count_documents(make_document(kvp(\"_id\", make_document(kvp(\"$in\", make_array(id)))))) << std::endl;\nstd::cout << \"строкой: \" << resumes.count_documents(make_document(kvp(\"_id\", make_document(kvp(\"$in\", make_array(id.to_string())))))) << std::endl;"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: резюме Петра Ковалёва; показаны поля _id, fio",
     "text": "{ _id: ObjectId('6a9e46fe2be8a88bb5e50f30'), fio: 'Пётр Ковалёв' }"
    }
   ],
   "key": {
    "python": [
     "a15fb0312536b7f6"
    ],
    "cpp": [
     "46d7e8a9a6a2b4bc"
    ],
    "go": [
     "a0ebff897ea86415"
    ],
    "ruby": [
     "9c29c1974b362254"
    ]
   },
   "chapters": [
    "1.2",
    "2.3"
   ]
  },
  {
   "id": "q09",
   "topic": "2.4 · два «или» в одном фильтре",
   "type": "single",
   "text": "Нужны соискатели, которые (из Ярославля <b>или</b> готовы к переезду) <b>и</b> (с высшим образованием <b>или</b> опытом на одном из мест от 10 месяцев). Фильтр записан двумя парами <code>$or</code> в одном документе. Что напечатает фрагмент <b>на вашем языке</b>?",
   "options": [
    "<code>подошло: 4</code>",
    "<code>подошло: 5</code>",
    "<code>подошло: 8</code>",
    "<code>подошло: 9</code>"
   ],
   "code": {
    "python": "filtr = {\"$or\": [{\"city\": \"Ярославль\"}, {\"ready_to_move\": True}],\n         \"$or\": [{\"education.level\": \"Высшее\"},\n                 {\"experience.months\": {\"$gte\": 10}}]}\nprint(\"подошло:\", resumes.count_documents(filtr))",
    "ruby": "filtr = { \"$or\" => [{ \"city\" => \"Ярославль\" }, { \"ready_to_move\" => true }],\n          \"$or\" => [{ \"education.level\" => \"Высшее\" },\n                    { \"experience.months\" => { \"$gte\" => 10 } }] }\nputs \"подошло: #{resumes.count_documents(filtr)}\"",
    "go": "filtr := bson.D{\n    {Key: \"$or\", Value: bson.A{bson.D{{Key: \"city\", Value: \"Ярославль\"}},\n        bson.D{{Key: \"ready_to_move\", Value: true}}}},\n    {Key: \"$or\", Value: bson.A{bson.D{{Key: \"education.level\", Value: \"Высшее\"}},\n        bson.D{{Key: \"experience.months\", Value: bson.D{{Key: \"$gte\", Value: 10}}}}}},\n}\nn, err := resumes.CountDocuments(ctx, filtr)\nif err != nil {\n    log.Fatal(err)\n}\nfmt.Println(\"подошло:\", n)",
    "cpp": "auto filtr = make_document(\n    kvp(\"$or\", make_array(make_document(kvp(\"city\", \"Ярославль\")),\n                          make_document(kvp(\"ready_to_move\", true)))),\n    kvp(\"$or\", make_array(make_document(kvp(\"education.level\", \"Высшее\")),\n                          make_document(kvp(\"experience.months\", make_document(kvp(\"$gte\", 10)))))));\nstd::cout << \"подошло: \" << resumes.count_documents(filtr.view()) << std::endl;"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, city, ready_to_move, education.level, experience.months",
     "text": "{ fio: 'Анна Белова', city: 'Ярославль' }\n{\n  fio: 'Пётр Ковалёв',\n  city: 'Ярославль',\n  ready_to_move: false,\n  education: { level: 'СПО' },\n  experience: [ { months: 6 } ]\n}\n{\n  fio: 'Алина Дроздова',\n  city: 'Москва',\n  ready_to_move: true,\n  education: { level: 'Высшее' },\n  experience: [ { months: 14 }, { months: 5 } ]\n}\n{\n  fio: 'Игорь Самойлов',\n  city: 'Ярославль',\n  ready_to_move: false,\n  education: { level: 'Высшее' },\n  experience: [ { months: 38 } ]\n}\n{\n  fio: 'Дарья Нечаева',\n  city: 'Санкт-Петербург',\n  ready_to_move: true,\n  education: { level: 'СПО' },\n  experience: []\n}\n{\n  fio: 'Тимур Валиев',\n  city: 'Казань',\n  ready_to_move: false,\n  education: { level: 'Высшее' },\n  experience: [ { months: 52 }, { months: 18 } ]\n}\n{\n  fio: 'Ксения Лапина',\n  city: 'Ярославль',\n  ready_to_move: true,\n  education: { level: 'СПО' },\n  experience: [ { months: 4 } ]\n}\n{\n  fio: 'Марк Ефремов',\n  city: 'Новосибирск',\n  ready_to_move: true,\n  education: { level: 'СПО' },\n  experience: [ { months: 11 } ]\n}\n{\n  fio: 'Ольга Пирогова',\n  city: 'Ярославль',\n  ready_to_move: false,\n  education: { level: 'Высшее' },\n  experience: [ { months: 26 } ]\n}"
    }
   ],
   "key": {
    "python": [
     "3ec6a1b092d84d28"
    ],
    "cpp": [
     "aca4206bbd7a8c9b"
    ],
    "go": [
     "47dba80125c8ecfc"
    ],
    "ruby": [
     "241f1e823e17764c"
    ]
   },
   "chapters": [
    "2.4"
   ]
  },
  {
   "id": "q10",
   "topic": "2.4 · $not",
   "type": "single",
   "text": "Фрагмент двумя способами считает резюме, обновлённые с 1 сентября: через отрицание условия «раньше 1 сентября» и прямым условием. Что он напечатает?",
   "options": [
    "<code>$not $lt 01.09: 5</code><br><code>$gte 01.09: 5</code>",
    "<code>$not $lt 01.09: 6</code><br><code>$gte 01.09: 5</code>",
    "<code>$not $lt 01.09: 5</code><br><code>$gte 01.09: 6</code>",
    "<code>$not $lt 01.09: 4</code><br><code>$gte 01.09: 5</code>"
   ],
   "code": {
    "python": "from datetime import datetime\n\nsep01 = datetime(2026, 9, 1)\n\nprint(\"$not $lt 01.09:\", resumes.count_documents({\"updated\": {\"$not\": {\"$lt\": sep01}}}))\nprint(\"$gte 01.09:    \", resumes.count_documents({\"updated\": {\"$gte\": sep01}}))",
    "cpp": "auto sep01 = bsoncxx::types::b_date{std::chrono::milliseconds{1788220800000}};   // 01.09.2026 00:00 UTC\n\nstd::cout << \"$not $lt 01.09: \" << resumes.count_documents(make_document(kvp(\"updated\", make_document(kvp(\"$not\", make_document(kvp(\"$lt\", sep01))))))) << std::endl;\nstd::cout << \"$gte 01.09:     \" << resumes.count_documents(make_document(kvp(\"updated\", make_document(kvp(\"$gte\", sep01))))) << std::endl;",
    "go": "sep01 := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)\n\nneRanshe, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"updated\", Value: bson.D{{Key: \"$not\", Value: bson.D{{Key: \"$lt\", Value: sep01}}}}}})\nneRanshePryamo, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"updated\", Value: bson.D{{Key: \"$gte\", Value: sep01}}}})\n\nfmt.Println(\"$not $lt 01.09:\", neRanshe)\nfmt.Println(\"$gte 01.09:    \", neRanshePryamo)",
    "ruby": "sep01 = Time.utc(2026, 9, 1)\n\nputs \"$not $lt 01.09: \" + resumes.count_documents({ \"updated\" => { \"$not\" => { \"$lt\" => sep01 } } }).to_s\nputs \"$gte 01.09:     \" + resumes.count_documents({ \"updated\" => { \"$gte\" => sep01 } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, updated",
     "text": "{ fio: 'Анна Белова' }\n{ fio: 'Пётр Ковалёв', updated: ISODate('2026-09-01T09:12:00.000Z') }\n{ fio: 'Алина Дроздова', updated: ISODate('2026-09-03T14:40:00.000Z') }\n{ fio: 'Игорь Самойлов', updated: ISODate('2026-08-28T07:05:00.000Z') }\n{ fio: 'Дарья Нечаева', updated: ISODate('2026-09-04T18:22:00.000Z') }\n{ fio: 'Тимур Валиев', updated: ISODate('2026-07-19T11:30:00.000Z') }\n{ fio: 'Ксения Лапина', updated: ISODate('2026-09-02T08:47:00.000Z') }\n{ fio: 'Марк Ефремов', updated: ISODate('2026-08-15T16:03:00.000Z') }\n{ fio: 'Ольга Пирогова', updated: ISODate('2026-09-05T12:15:00.000Z') }"
    }
   ],
   "key": {
    "python": [
     "256c6a4ea927a599"
    ],
    "cpp": [
     "0937dd769e9c5dc4"
    ],
    "go": [
     "8512ca39980a6adc"
    ],
    "ruby": [
     "9d5b55011fb69efb"
    ]
   },
   "chapters": [
    "2.4"
   ]
  },
  {
   "id": "q11",
   "topic": "2.3–2.6 · ошибки сервера",
   "type": "multi",
   "text": "Каждый фильтр передают в <code>count_documents</code> по коллекции резюме. Отметьте <b>все</b> фильтры, на которые сервер ответит ошибкой. Остальные выполнятся и вернут число, пусть даже 0.",
   "options": [
    "<code>{ city: { $not: \"Москва\" } }</code>",
    "<code>{ city: { $in: [] } }</code>",
    "<code>{ salary: { $type: \"integer\" } }</code>",
    "<code>{ skills: { $size: 4 } }</code>",
    "<code>{ salary: { $gt: \"100000\" } }</code>",
    "<code>{ $nor: [{ city: \"Москва\" }] }</code>"
   ],
   "key": {
    "python": [
     "1c57a6a2961421c3",
     "290371c1256ef5d6"
    ],
    "cpp": [
     "15e94e238c13718c",
     "ac6fb08ce20d71ae"
    ],
    "go": [
     "652c617ddb9da5f1",
     "6ff8266c5b896cff"
    ],
    "ruby": [
     "1ad55c89435d8c5d",
     "d55caeebdfa82445"
    ]
   },
   "chapters": [
    "2.3",
    "2.6"
   ]
  },
  {
   "id": "q12",
   "topic": "2.5 · null, $exists и $type",
   "type": "single",
   "text": "Фрагмент заводит в песочнице три контакта: у Анны телефон записан как null, у Петра поля <code>phone</code> нет, у Олега телефон указан. Что напечатает фрагмент?",
   "options": [
    "<code>phone null: 2</code><br><code>phone $exists false: 1</code><br><code>phone $type null: 1</code>",
    "<code>phone null: 1</code><br><code>phone $exists false: 1</code><br><code>phone $type null: 1</code>",
    "<code>phone null: 2</code><br><code>phone $exists false: 1</code><br><code>phone $type null: 2</code>",
    "<code>phone null: 1</code><br><code>phone $exists false: 2</code><br><code>phone $type null: 1</code>"
   ],
   "code": {
    "python": "# коллекция создаётся заново при каждом запуске\nkontakty = client[\"sandbox\"][\"contacts\"]\nkontakty.drop()\nkontakty.insert_one({\"_id\": 1, \"name\": \"Анна\", \"phone\": None})\nkontakty.insert_one({\"_id\": 2, \"name\": \"Пётр\"})\nkontakty.insert_one({\"_id\": 3, \"name\": \"Олег\", \"phone\": \"+7 900 100-20-30\"})\n\nprint(\"phone null:         \", kontakty.count_documents({\"phone\": None}))\nprint(\"phone $exists false:\", kontakty.count_documents({\"phone\": {\"$exists\": False}}))\nprint(\"phone $type null:   \", kontakty.count_documents({\"phone\": {\"$type\": \"null\"}}))",
    "cpp": "// коллекция создаётся заново при каждом запуске\nauto kontakty = client[\"sandbox\"][\"contacts\"];\nkontakty.drop();\nkontakty.insert_one(make_document(\n    kvp(\"_id\", 1),\n    kvp(\"name\", \"Анна\"),\n    kvp(\"phone\", bsoncxx::types::b_null{})));\nkontakty.insert_one(make_document(kvp(\"_id\", 2), kvp(\"name\", \"Пётр\")));\nkontakty.insert_one(make_document(\n    kvp(\"_id\", 3),\n    kvp(\"name\", \"Олег\"),\n    kvp(\"phone\", \"+7 900 100-20-30\")));\n\nstd::cout << \"phone null:          \" << kontakty.count_documents(make_document(kvp(\"phone\", bsoncxx::types::b_null{}))) << std::endl;\nstd::cout << \"phone $exists false: \" << kontakty.count_documents(make_document(kvp(\"phone\", make_document(kvp(\"$exists\", false))))) << std::endl;\nstd::cout << \"phone $type null:    \" << kontakty.count_documents(make_document(kvp(\"phone\", make_document(kvp(\"$type\", \"null\"))))) << std::endl;",
    "go": "// коллекция создаётся заново при каждом запуске\nkontakty := client.Database(\"sandbox\").Collection(\"contacts\")\nkontakty.Drop(ctx)\nkontakty.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: 1},\n    {Key: \"name\", Value: \"Анна\"},\n    {Key: \"phone\", Value: nil}})\nkontakty.InsertOne(ctx, bson.D{{Key: \"_id\", Value: 2}, {Key: \"name\", Value: \"Пётр\"}})\nkontakty.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: 3},\n    {Key: \"name\", Value: \"Олег\"},\n    {Key: \"phone\", Value: \"+7 900 100-20-30\"}})\n\npusto, _ := kontakty.CountDocuments(ctx, bson.D{{Key: \"phone\", Value: nil}})\nnet, _ := kontakty.CountDocuments(ctx, bson.D{{Key: \"phone\", Value: bson.D{{Key: \"$exists\", Value: false}}}})\nnulevoe, _ := kontakty.CountDocuments(ctx, bson.D{{Key: \"phone\", Value: bson.D{{Key: \"$type\", Value: \"null\"}}}})\n\nfmt.Println(\"phone null:         \", pusto)\nfmt.Println(\"phone $exists false:\", net)\nfmt.Println(\"phone $type null:   \", nulevoe)",
    "ruby": "# коллекция создаётся заново при каждом запуске\nkontakty = client.use(\"sandbox\").database[:contacts]\nkontakty.drop\nkontakty.insert_one({ \"_id\" => 1, \"name\" => \"Анна\", \"phone\" => nil })\nkontakty.insert_one({ \"_id\" => 2, \"name\" => \"Пётр\" })\nkontakty.insert_one({ \"_id\" => 3, \"name\" => \"Олег\", \"phone\" => \"+7 900 100-20-30\" })\n\nputs \"phone null:          \" + kontakty.count_documents({ \"phone\" => nil }).to_s\nputs \"phone $exists false: \" + kontakty.count_documents({ \"phone\" => { \"$exists\" => false } }).to_s\nputs \"phone $type null:    \" + kontakty.count_documents({ \"phone\" => { \"$type\" => \"null\" } }).to_s"
   },
   "key": {
    "python": [
     "645b3c8e7c89e16c"
    ],
    "cpp": [
     "713d7a20f340a08e"
    ],
    "go": [
     "9a85f63bc9a18922"
    ],
    "ruby": [
     "3d51f108e69b7a0a"
    ]
   },
   "chapters": [
    "2.5"
   ]
  },
  {
   "id": "q13",
   "topic": "2.5 · $exists и вложенные поля",
   "type": "single",
   "text": "Перед рассылкой фрагмент проверяет, у кого из соискателей заполнена почта в <code>contacts.email</code>. Что он напечатает?",
   "options": [
    "<code>есть email: 7</code><br><code>нет email: 2</code><br><code>нет contacts: 1</code>",
    "<code>есть email: 7</code><br><code>нет email: 1</code><br><code>нет contacts: 1</code>",
    "<code>есть email: 8</code><br><code>нет email: 1</code><br><code>нет contacts: 1</code>",
    "<code>есть email: 7</code><br><code>нет email: 2</code><br><code>нет contacts: 0</code>"
   ],
   "code": {
    "python": "print(\"есть email:  \", resumes.count_documents({\"contacts.email\": {\"$exists\": True}}))\nprint(\"нет email:   \", resumes.count_documents({\"contacts.email\": {\"$exists\": False}}))\nprint(\"нет contacts:\", resumes.count_documents({\"contacts\": {\"$exists\": False}}))",
    "cpp": "std::cout << \"есть email:   \" << resumes.count_documents(make_document(kvp(\"contacts.email\", make_document(kvp(\"$exists\", true))))) << std::endl;\nstd::cout << \"нет email:    \" << resumes.count_documents(make_document(kvp(\"contacts.email\", make_document(kvp(\"$exists\", false))))) << std::endl;\nstd::cout << \"нет contacts: \" << resumes.count_documents(make_document(kvp(\"contacts\", make_document(kvp(\"$exists\", false))))) << std::endl;",
    "go": "estEmail, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"contacts.email\", Value: bson.D{{Key: \"$exists\", Value: true}}}})\nnetEmail, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"contacts.email\", Value: bson.D{{Key: \"$exists\", Value: false}}}})\nnetKontaktov, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"contacts\", Value: bson.D{{Key: \"$exists\", Value: false}}}})\n\nfmt.Println(\"есть email:  \", estEmail)\nfmt.Println(\"нет email:   \", netEmail)\nfmt.Println(\"нет contacts:\", netKontaktov)",
    "ruby": "puts \"есть email:   \" + resumes.count_documents({ \"contacts.email\" => { \"$exists\" => true } }).to_s\nputs \"нет email:    \" + resumes.count_documents({ \"contacts.email\" => { \"$exists\" => false } }).to_s\nputs \"нет contacts: \" + resumes.count_documents({ \"contacts\" => { \"$exists\" => false } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, contacts",
     "text": "{ fio: 'Анна Белова' }\n{ fio: 'Пётр Ковалёв', contacts: { email: 'kovalev.p@example.ru', tg: '@kovalev_p' } }\n{ fio: 'Алина Дроздова', contacts: { email: 'a.drozdova@example.ru', tg: '@drozdova' } }\n{ fio: 'Игорь Самойлов', contacts: { email: 'samoylov@example.ru' } }\n{ fio: 'Дарья Нечаева', contacts: { email: 'nechaeva.d@example.ru', tg: '@nech_dar' } }\n{ fio: 'Тимур Валиев', contacts: { email: 'valiev.t@example.ru', tg: '@valiev_db' } }\n{ fio: 'Ксения Лапина', contacts: { email: 'lapina.k@example.ru', tg: '@lapina_qa' } }\n{ fio: 'Марк Ефремов', contacts: { tg: '@efremov_dev' } }\n{ fio: 'Ольга Пирогова', contacts: { email: 'pirogova.o@example.ru', tg: '@pirogova' } }"
    }
   ],
   "key": {
    "python": [
     "31b2bcd0428d453e"
    ],
    "cpp": [
     "ea0ffa45cd640614"
    ],
    "go": [
     "2f122dd87883f4d7"
    ],
    "ruby": [
     "759552cada0cdde7"
    ]
   },
   "chapters": [
    "2.5"
   ]
  },
  {
   "id": "q14",
   "topic": "2.5 · значение для $exists",
   "type": "single",
   "text": "Отчёт должен посчитать резюме без портфолио. Значение для <code>$exists</code> пришло из файла настроек строкой <code>\"false\"</code>. Что напечатает фрагмент?",
   "options": [
    "<code>без портфолио: 7</code>",
    "<code>без портфолио: 2</code>",
    "<code>без портфолио: 9</code>",
    "<code>без портфолио: 0</code>"
   ],
   "code": {
    "python": "print(\"без портфолио:\", resumes.count_documents({\"portfolio\": {\"$exists\": \"false\"}}))",
    "cpp": "std::cout << \"без портфолио: \" << resumes.count_documents(make_document(kvp(\"portfolio\", make_document(kvp(\"$exists\", \"false\"))))) << std::endl;",
    "go": "bezPortfolio, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"portfolio\", Value: bson.D{{Key: \"$exists\", Value: \"false\"}}}})\n\nfmt.Println(\"без портфолио:\", bezPortfolio)",
    "ruby": "puts \"без портфолио: \" + resumes.count_documents({ \"portfolio\" => { \"$exists\" => \"false\" } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, portfolio",
     "text": "{ fio: 'Анна Белова' }\n{ fio: 'Пётр Ковалёв' }\n{ fio: 'Алина Дроздова', portfolio: 'https://github.com/example/drozdova' }\n{ fio: 'Игорь Самойлов' }\n{ fio: 'Дарья Нечаева' }\n{ fio: 'Тимур Валиев' }\n{ fio: 'Ксения Лапина' }\n{ fio: 'Марк Ефремов', portfolio: 'https://github.com/example/efremov' }\n{ fio: 'Ольга Пирогова' }"
    }
   ],
   "key": {
    "python": [
     "d902429900668fa6"
    ],
    "cpp": [
     "478f770b525727fb"
    ],
    "go": [
     "85bc85ddf4e3c640"
    ],
    "ruby": [
     "a641a71fdc3ec256"
    ]
   },
   "chapters": [
    "2.5"
   ]
  },
  {
   "id": "q15",
   "topic": "2.6 · $elemMatch",
   "type": "single",
   "text": "Нужны соискатели, которые <b>на одном и том же месте работы</b> использовали SQL не меньше 12 месяцев. Фрагмент записывает условие двумя способами. Что он напечатает?",
   "options": [
    "<code>через точку: 2</code><br><code>$elemMatch: 2</code>",
    "<code>через точку: 2</code><br><code>$elemMatch: 1</code>",
    "<code>через точку: 1</code><br><code>$elemMatch: 1</code>",
    "<code>через точку: 1</code><br><code>$elemMatch: 2</code>"
   ],
   "code": {
    "python": "print(\"через точку:\", resumes.count_documents({\"experience.stack\": \"SQL\", \"experience.months\": {\"$gte\": 12}}))\nprint(\"$elemMatch: \", resumes.count_documents({\"experience\": {\"$elemMatch\": {\"stack\": \"SQL\", \"months\": {\"$gte\": 12}}}}))",
    "cpp": "std::cout << \"через точку: \" << resumes.count_documents(make_document(kvp(\"experience.stack\", \"SQL\"), kvp(\"experience.months\", make_document(kvp(\"$gte\", 12))))) << std::endl;\nstd::cout << \"$elemMatch:  \" << resumes.count_documents(make_document(kvp(\"experience\", make_document(kvp(\"$elemMatch\", make_document(kvp(\"stack\", \"SQL\"), kvp(\"months\", make_document(kvp(\"$gte\", 12))))))))) << std::endl;",
    "go": "tochka, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"experience.stack\", Value: \"SQL\"}, {Key: \"experience.months\", Value: bson.D{{Key: \"$gte\", Value: 12}}}})\nodinElement, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"experience\", Value: bson.D{{Key: \"$elemMatch\", Value: bson.D{{Key: \"stack\", Value: \"SQL\"}, {Key: \"months\", Value: bson.D{{Key: \"$gte\", Value: 12}}}}}}}})\n\nfmt.Println(\"через точку:\", tochka)\nfmt.Println(\"$elemMatch: \", odinElement)",
    "ruby": "puts \"через точку: \" + resumes.count_documents({ \"experience.stack\" => \"SQL\", \"experience.months\" => { \"$gte\" => 12 } }).to_s\nputs \"$elemMatch:  \" + resumes.count_documents({ \"experience\" => { \"$elemMatch\" => { \"stack\" => \"SQL\", \"months\" => { \"$gte\" => 12 } } } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, experience",
     "text": "{ fio: 'Анна Белова' }\n{\n  fio: 'Пётр Ковалёв',\n  experience: [\n    { company: 'ИП Сорокин', role: 'стажёр', months: 6, stack: [ 'Python', 'PostgreSQL' ] }\n  ]\n}\n{\n  fio: 'Алина Дроздова',\n  experience: [\n    {\n      company: 'Ozon',\n      role: 'младший аналитик',\n      months: 14,\n      stack: [ 'ClickHouse', 'Python' ]\n    },\n    { company: 'Retail Lab', role: 'стажёр', months: 5, stack: [ 'SQL' ] }\n  ]\n}\n{\n  fio: 'Игорь Самойлов',\n  experience: [\n    {\n      company: 'Тензор',\n      role: 'разработчик',\n      months: 38,\n      stack: [ 'C#', 'PostgreSQL', 'RabbitMQ' ]\n    }\n  ]\n}\n{ fio: 'Дарья Нечаева', experience: [] }\n{\n  fio: 'Тимур Валиев',\n  experience: [\n    { company: 'Ак Барс Банк', role: 'DBA', months: 52, stack: [ 'PostgreSQL', 'MongoDB' ] },\n    { company: 'БарсТех', role: 'инженер сопровождения', months: 18, stack: [ 'Bash' ] }\n  ]\n}\n{\n  fio: 'Ксения Лапина',\n  experience: [\n    {\n      company: 'Первый Бит',\n      role: 'стажёр-тестировщик',\n      months: 4,\n      stack: [ 'Postman', 'SQL' ]\n    }\n  ]\n}\n{\n  fio: 'Марк Ефремов',\n  experience: [\n    {\n      company: 'Фриланс',\n      role: 'разработчик ботов',\n      months: 11,\n      stack: [ 'Python', 'MongoDB' ]\n    }\n  ]\n}\n{\n  fio: 'Ольга Пирогова',\n  experience: [ { company: 'Р-Фарм', role: 'аналитик', months: 26, stack: [ 'SQL', 'Python' ] } ]\n}"
    }
   ],
   "key": {
    "python": [
     "edd8a1212dd130fd"
    ],
    "cpp": [
     "9a1707ca90726464"
    ],
    "go": [
     "9d08be61893af7d7"
    ],
    "ruby": [
     "d0184a7bcc5b6044"
    ]
   },
   "chapters": [
    "2.6"
   ]
  },
  {
   "id": "q16",
   "topic": "2.6 · длина массива",
   "type": "single",
   "text": "Фрагмент считает резюме по числу навыков: через элемент массива по номеру и через <code>$size</code>. Что он напечатает?",
   "options": [
    "<code>skills.3 есть: 8</code><br><code>$size 4: 6</code><br><code>skills.4 есть: 2</code>",
    "<code>skills.3 есть: 6</code><br><code>$size 4: 6</code><br><code>skills.4 есть: 2</code>",
    "<code>skills.3 есть: 8</code><br><code>$size 4: 6</code><br><code>skills.4 есть: 0</code>",
    "<code>skills.3 есть: 6</code><br><code>$size 4: 8</code><br><code>skills.4 есть: 2</code>"
   ],
   "code": {
    "python": "print(\"skills.3 есть:\", resumes.count_documents({\"skills.3\": {\"$exists\": True}}))\nprint(\"$size 4:      \", resumes.count_documents({\"skills\": {\"$size\": 4}}))\nprint(\"skills.4 есть:\", resumes.count_documents({\"skills.4\": {\"$exists\": True}}))",
    "cpp": "std::cout << \"skills.3 есть: \" << resumes.count_documents(make_document(kvp(\"skills.3\", make_document(kvp(\"$exists\", true))))) << std::endl;\nstd::cout << \"$size 4:       \" << resumes.count_documents(make_document(kvp(\"skills\", make_document(kvp(\"$size\", 4))))) << std::endl;\nstd::cout << \"skills.4 есть: \" << resumes.count_documents(make_document(kvp(\"skills.4\", make_document(kvp(\"$exists\", true))))) << std::endl;",
    "go": "neMenshe4, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"skills.3\", Value: bson.D{{Key: \"$exists\", Value: true}}}})\nrovno4, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"skills\", Value: bson.D{{Key: \"$size\", Value: 4}}}})\nneMenshe5, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"skills.4\", Value: bson.D{{Key: \"$exists\", Value: true}}}})\n\nfmt.Println(\"skills.3 есть:\", neMenshe4)\nfmt.Println(\"$size 4:      \", rovno4)\nfmt.Println(\"skills.4 есть:\", neMenshe5)",
    "ruby": "puts \"skills.3 есть: \" + resumes.count_documents({ \"skills.3\" => { \"$exists\" => true } }).to_s\nputs \"$size 4:       \" + resumes.count_documents({ \"skills\" => { \"$size\" => 4 } }).to_s\nputs \"skills.4 есть: \" + resumes.count_documents({ \"skills.4\" => { \"$exists\" => true } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, skills",
     "text": "{ fio: 'Анна Белова', skills: [ 'Python', 'Git' ] }\n{ fio: 'Пётр Ковалёв', skills: [ 'Python', 'SQL', 'Git', 'Docker' ] }\n{ fio: 'Алина Дроздова', skills: [ 'SQL', 'Python', 'ClickHouse', 'Power BI', 'Excel' ] }\n{ fio: 'Игорь Самойлов', skills: [ 'C#', '.NET', 'PostgreSQL', 'RabbitMQ', 'Docker' ] }\n{ fio: 'Дарья Нечаева', skills: [ 'JavaScript', 'React', 'HTML', 'CSS' ] }\n{ fio: 'Тимур Валиев', skills: [ 'PostgreSQL', 'MongoDB', 'Bash', 'Zabbix' ] }\n{ fio: 'Ксения Лапина', skills: [ 'Postman', 'SQL', 'Selenium', 'Python' ] }\n{ fio: 'Марк Ефремов', skills: [ 'Python', 'FastAPI', 'MongoDB', 'Git' ] }\n{ fio: 'Ольга Пирогова', skills: [ 'SQL', 'Excel', 'Python', 'ClickHouse' ] }"
    }
   ],
   "key": {
    "python": [
     "3ff8854ba8d548e2"
    ],
    "cpp": [
     "5b545c936a0e4119"
    ],
    "go": [
     "5a85c8f7127b6873"
    ],
    "ruby": [
     "dd3cfdbad14154f1"
    ]
   },
   "chapters": [
    "2.6"
   ]
  },
  {
   "id": "q17",
   "topic": "2.6 · пустой массив",
   "type": "single",
   "text": "Фрагмент ищет резюме без опыта работы двумя условиями. Что он напечатает?",
   "options": [
    "<code>$size 0: 1</code><br><code>experience.0 нет: 1</code>",
    "<code>$size 0: 2</code><br><code>experience.0 нет: 2</code>",
    "<code>$size 0: 1</code><br><code>experience.0 нет: 2</code>",
    "<code>$size 0: 2</code><br><code>experience.0 нет: 1</code>"
   ],
   "code": {
    "python": "print(\"$size 0:         \", resumes.count_documents({\"experience\": {\"$size\": 0}}))\nprint(\"experience.0 нет:\", resumes.count_documents({\"experience.0\": {\"$exists\": False}}))",
    "cpp": "std::cout << \"$size 0:          \" << resumes.count_documents(make_document(kvp(\"experience\", make_document(kvp(\"$size\", 0))))) << std::endl;\nstd::cout << \"experience.0 нет: \" << resumes.count_documents(make_document(kvp(\"experience.0\", make_document(kvp(\"$exists\", false))))) << std::endl;",
    "go": "pustoy, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"experience\", Value: bson.D{{Key: \"$size\", Value: 0}}}})\nnetPervogo, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"experience.0\", Value: bson.D{{Key: \"$exists\", Value: false}}}})\n\nfmt.Println(\"$size 0:         \", pustoy)\nfmt.Println(\"experience.0 нет:\", netPervogo)",
    "ruby": "puts \"$size 0:          \" + resumes.count_documents({ \"experience\" => { \"$size\" => 0 } }).to_s\nputs \"experience.0 нет: \" + resumes.count_documents({ \"experience.0\" => { \"$exists\" => false } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, experience",
     "text": "{ fio: 'Анна Белова' }\n{\n  fio: 'Пётр Ковалёв',\n  experience: [\n    { company: 'ИП Сорокин', role: 'стажёр', months: 6, stack: [ 'Python', 'PostgreSQL' ] }\n  ]\n}\n{\n  fio: 'Алина Дроздова',\n  experience: [\n    {\n      company: 'Ozon',\n      role: 'младший аналитик',\n      months: 14,\n      stack: [ 'ClickHouse', 'Python' ]\n    },\n    { company: 'Retail Lab', role: 'стажёр', months: 5, stack: [ 'SQL' ] }\n  ]\n}\n{\n  fio: 'Игорь Самойлов',\n  experience: [\n    {\n      company: 'Тензор',\n      role: 'разработчик',\n      months: 38,\n      stack: [ 'C#', 'PostgreSQL', 'RabbitMQ' ]\n    }\n  ]\n}\n{ fio: 'Дарья Нечаева', experience: [] }\n{\n  fio: 'Тимур Валиев',\n  experience: [\n    { company: 'Ак Барс Банк', role: 'DBA', months: 52, stack: [ 'PostgreSQL', 'MongoDB' ] },\n    { company: 'БарсТех', role: 'инженер сопровождения', months: 18, stack: [ 'Bash' ] }\n  ]\n}\n{\n  fio: 'Ксения Лапина',\n  experience: [\n    {\n      company: 'Первый Бит',\n      role: 'стажёр-тестировщик',\n      months: 4,\n      stack: [ 'Postman', 'SQL' ]\n    }\n  ]\n}\n{\n  fio: 'Марк Ефремов',\n  experience: [\n    {\n      company: 'Фриланс',\n      role: 'разработчик ботов',\n      months: 11,\n      stack: [ 'Python', 'MongoDB' ]\n    }\n  ]\n}\n{\n  fio: 'Ольга Пирогова',\n  experience: [ { company: 'Р-Фарм', role: 'аналитик', months: 26, stack: [ 'SQL', 'Python' ] } ]\n}"
    }
   ],
   "key": {
    "python": [
     "44605f3966e7a360"
    ],
    "cpp": [
     "2a1f8e1f68f14ba3"
    ],
    "go": [
     "5040ea5370364ab5"
    ],
    "ruby": [
     "fa369d2f3b2685f7"
    ]
   },
   "chapters": [
    "2.6"
   ]
  },
  {
   "id": "q18",
   "topic": "2.7 · точка в шаблоне",
   "type": "single",
   "text": "Нужны резюме со знанием C#. Фрагмент ищет навык двумя шаблонами. Что он напечатает?",
   "options": [
    "<code>шаблон ^C.: 1</code><br><code>шаблон ^C#$: 1</code>",
    "<code>шаблон ^C.: 4</code><br><code>шаблон ^C#$: 1</code>",
    "<code>шаблон ^C.: 2</code><br><code>шаблон ^C#$: 1</code>",
    "<code>шаблон ^C.: 4</code><br><code>шаблон ^C#$: 0</code>"
   ],
   "code": {
    "python": "print(\"шаблон ^C.: \", resumes.count_documents({\"skills\": {\"$regex\": \"^C.\"}}))\nprint(\"шаблон ^C#$:\", resumes.count_documents({\"skills\": {\"$regex\": \"^C#$\"}}))",
    "cpp": "std::cout << \"шаблон ^C.:  \" << resumes.count_documents(make_document(kvp(\"skills\", make_document(kvp(\"$regex\", \"^C.\"))))) << std::endl;\nstd::cout << \"шаблон ^C#$: \" << resumes.count_documents(make_document(kvp(\"skills\", make_document(kvp(\"$regex\", \"^C#$\"))))) << std::endl;",
    "go": "cTochka, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"skills\", Value: bson.D{{Key: \"$regex\", Value: \"^C.\"}}}})\ncSharp, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"skills\", Value: bson.D{{Key: \"$regex\", Value: \"^C#$\"}}}})\n\nfmt.Println(\"шаблон ^C.: \", cTochka)\nfmt.Println(\"шаблон ^C#$:\", cSharp)",
    "ruby": "puts \"шаблон ^C.:  \" + resumes.count_documents({ \"skills\" => { \"$regex\" => \"^C.\" } }).to_s\nputs 'шаблон ^C#$: ' + resumes.count_documents({ \"skills\" => { \"$regex\" => '^C#$' } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, skills",
     "text": "{ fio: 'Анна Белова', skills: [ 'Python', 'Git' ] }\n{ fio: 'Пётр Ковалёв', skills: [ 'Python', 'SQL', 'Git', 'Docker' ] }\n{ fio: 'Алина Дроздова', skills: [ 'SQL', 'Python', 'ClickHouse', 'Power BI', 'Excel' ] }\n{ fio: 'Игорь Самойлов', skills: [ 'C#', '.NET', 'PostgreSQL', 'RabbitMQ', 'Docker' ] }\n{ fio: 'Дарья Нечаева', skills: [ 'JavaScript', 'React', 'HTML', 'CSS' ] }\n{ fio: 'Тимур Валиев', skills: [ 'PostgreSQL', 'MongoDB', 'Bash', 'Zabbix' ] }\n{ fio: 'Ксения Лапина', skills: [ 'Postman', 'SQL', 'Selenium', 'Python' ] }\n{ fio: 'Марк Ефремов', skills: [ 'Python', 'FastAPI', 'MongoDB', 'Git' ] }\n{ fio: 'Ольга Пирогова', skills: [ 'SQL', 'Excel', 'Python', 'ClickHouse' ] }"
    }
   ],
   "key": {
    "python": [
     "e872fa59b00ecb41"
    ],
    "cpp": [
     "5de87bc2324461d2"
    ],
    "go": [
     "ac7051286677f91c"
    ],
    "ruby": [
     "4ed1087784bbf662"
    ]
   },
   "chapters": [
    "2.7"
   ]
  },
  {
   "id": "q19",
   "topic": "2.7 · якоря и регистр",
   "type": "single",
   "text": "Фрагмент ищет должности по трём шаблонам. Что он напечатает?",
   "options": [
    "<code>^junior, i: 4</code><br><code>разработчик$: 4</code><br><code>^Python: 0</code>",
    "<code>^junior, i: 4</code><br><code>разработчик$: 5</code><br><code>^Python: 0</code>",
    "<code>^junior, i: 0</code><br><code>разработчик$: 4</code><br><code>^Python: 3</code>",
    "<code>^junior, i: 4</code><br><code>разработчик$: 4</code><br><code>^Python: 3</code>"
   ],
   "code": {
    "python": "print(\"^junior, i:  \", resumes.count_documents({\"position\": {\"$regex\": \"^junior\", \"$options\": \"i\"}}))\nprint(\"разработчик$:\", resumes.count_documents({\"position\": {\"$regex\": \"разработчик$\"}}))\nprint(\"^Python:     \", resumes.count_documents({\"position\": {\"$regex\": \"^Python\"}}))",
    "cpp": "std::cout << \"^junior, i:   \" << resumes.count_documents(make_document(kvp(\"position\", make_document(kvp(\"$regex\", \"^junior\"), kvp(\"$options\", \"i\"))))) << std::endl;\nstd::cout << \"разработчик$: \" << resumes.count_documents(make_document(kvp(\"position\", make_document(kvp(\"$regex\", \"разработчик$\"))))) << std::endl;\nstd::cout << \"^Python:      \" << resumes.count_documents(make_document(kvp(\"position\", make_document(kvp(\"$regex\", \"^Python\"))))) << std::endl;",
    "go": "junior, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"position\", Value: bson.D{{Key: \"$regex\", Value: \"^junior\"}, {Key: \"$options\", Value: \"i\"}}}})\nrazrabotchik, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"position\", Value: bson.D{{Key: \"$regex\", Value: \"разработчик$\"}}}})\npython, _ := resumes.CountDocuments(ctx, bson.D{{Key: \"position\", Value: bson.D{{Key: \"$regex\", Value: \"^Python\"}}}})\n\nfmt.Println(\"^junior, i:  \", junior)\nfmt.Println(\"разработчик$:\", razrabotchik)\nfmt.Println(\"^Python:     \", python)",
    "ruby": "puts \"^junior, i:   \" + resumes.count_documents({ \"position\" => { \"$regex\" => \"^junior\", \"$options\" => \"i\" } }).to_s\nputs \"разработчик$: \" + resumes.count_documents({ \"position\" => { \"$regex\" => \"разработчик$\" } }).to_s\nputs \"^Python:      \" + resumes.count_documents({ \"position\" => { \"$regex\" => \"^Python\" } }).to_s"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, position",
     "text": "{ fio: 'Анна Белова', position: 'Junior Python-разработчик' }\n{ fio: 'Пётр Ковалёв', position: 'Junior Python-разработчик' }\n{ fio: 'Алина Дроздова', position: 'Аналитик данных' }\n{ fio: 'Игорь Самойлов', position: 'Backend-разработчик C#' }\n{ fio: 'Дарья Нечаева', position: 'Junior Frontend-разработчик' }\n{ fio: 'Тимур Валиев', position: 'Администратор баз данных' }\n{ fio: 'Ксения Лапина', position: 'Тестировщик' }\n{ fio: 'Марк Ефремов', position: 'Junior Python-разработчик' }\n{ fio: 'Ольга Пирогова', position: 'Аналитик данных' }"
    }
   ],
   "key": {
    "python": [
     "fa19f0bf62c44921"
    ],
    "cpp": [
     "37220f3a2dba95c4"
    ],
    "go": [
     "d839ab849e777bfc"
    ],
    "ruby": [
     "348ac326535dfb7e"
    ]
   },
   "chapters": [
    "2.7"
   ]
  },
  {
   "id": "q20",
   "topic": "2.7 · шаблон и индекс",
   "type": "single",
   "text": "В коллекции миллион вакансий, по полю <code>title</code> построен индекс. Для какого условия сервер может взять из индекса только часть строк, а не просматривать все значения?",
   "options": [
    "<code>{ title: { $regex: \"^Junior\" } }</code>",
    "<code>{ title: { $regex: \"Junior\" } }</code>",
    "<code>{ title: { $regex: \"^junior\", $options: \"i\" } }</code>",
    "<code>{ title: { $not: { $regex: \"^Junior\" } } }</code>"
   ],
   "key": {
    "python": [
     "5f2ca4711cbef415"
    ],
    "cpp": [
     "9d0209d55e4846e5"
    ],
    "go": [
     "12324aea884d23ea"
    ],
    "ruby": [
     "367ac3e0a2804f44"
    ]
   },
   "chapters": [
    "2.7"
   ]
  },
  {
   "id": "q21",
   "topic": "2.8 · ссылка на поле",
   "type": "single",
   "text": "Фрагмент заводит два черновика вакансий, у второго нижняя граница вилки больше верхней. Проверка ищет такие черновики двумя фильтрами. Что она напечатает?",
   "options": [
    "<code>со знаком $: 1</code><br><code>без знака $: 1</code>",
    "<code>со знаком $: 1</code><br><code>без знака $: 0</code>",
    "<code>со знаком $: 0</code><br><code>без знака $: 0</code>",
    "<code>со знаком $: 0</code><br><code>без знака $: 1</code>"
   ],
   "code": {
    "python": "# черновики: коллекция создаётся заново при каждом запуске\ndrafts = client[\"sandbox\"][\"vacancy_drafts\"]\ndrafts.drop()\ndrafts.insert_one({\"_id\": \"v-901\",\n                   \"title\": \"Стажёр-аналитик\",\n                   \"salary\": {\"from\": 50000, \"to\": 70000}})\ndrafts.insert_one({\"_id\": \"v-902\",\n                   \"title\": \"Тестировщик\",\n                   \"salary\": {\"from\": 90000, \"to\": 60000}})\n\nprint(\"со знаком $:\", drafts.count_documents({\"$expr\": {\"$gt\": [\"$salary.from\", \"$salary.to\"]}}))\nprint(\"без знака $:\", drafts.count_documents({\"$expr\": {\"$gt\": [\"salary.from\", \"salary.to\"]}}))",
    "cpp": "// черновики: коллекция создаётся заново при каждом запуске\nauto drafts = client[\"sandbox\"][\"vacancy_drafts\"];\ndrafts.drop();\ndrafts.insert_one(make_document(\n    kvp(\"_id\", \"v-901\"),\n    kvp(\"title\", \"Стажёр-аналитик\"),\n    kvp(\"salary\", make_document(kvp(\"from\", 50000), kvp(\"to\", 70000)))));\ndrafts.insert_one(make_document(\n    kvp(\"_id\", \"v-902\"),\n    kvp(\"title\", \"Тестировщик\"),\n    kvp(\"salary\", make_document(kvp(\"from\", 90000), kvp(\"to\", 60000)))));\n\nstd::cout << \"со знаком $: \" << drafts.count_documents(make_document(kvp(\"$expr\", make_document(kvp(\"$gt\", make_array(\"$salary.from\", \"$salary.to\")))))) << std::endl;\nstd::cout << \"без знака $: \" << drafts.count_documents(make_document(kvp(\"$expr\", make_document(kvp(\"$gt\", make_array(\"salary.from\", \"salary.to\")))))) << std::endl;",
    "go": "// черновики: коллекция создаётся заново при каждом запуске\ndrafts := client.Database(\"sandbox\").Collection(\"vacancy_drafts\")\ndrafts.Drop(ctx)\ndrafts.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: \"v-901\"},\n    {Key: \"title\", Value: \"Стажёр-аналитик\"},\n    {Key: \"salary\", Value: bson.D{{Key: \"from\", Value: 50000}, {Key: \"to\", Value: 70000}}}})\ndrafts.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: \"v-902\"},\n    {Key: \"title\", Value: \"Тестировщик\"},\n    {Key: \"salary\", Value: bson.D{{Key: \"from\", Value: 90000}, {Key: \"to\", Value: 60000}}}})\n\nsoZnakom, _ := drafts.CountDocuments(ctx, bson.D{{Key: \"$expr\", Value: bson.D{{Key: \"$gt\", Value: bson.A{\"$salary.from\", \"$salary.to\"}}}}})\nbezZnaka, _ := drafts.CountDocuments(ctx, bson.D{{Key: \"$expr\", Value: bson.D{{Key: \"$gt\", Value: bson.A{\"salary.from\", \"salary.to\"}}}}})\n\nfmt.Println(\"со знаком $:\", soZnakom)\nfmt.Println(\"без знака $:\", bezZnaka)",
    "ruby": "# черновики: коллекция создаётся заново при каждом запуске\ndrafts = client.use(\"sandbox\").database[:vacancy_drafts]\ndrafts.drop\ndrafts.insert_one({ \"_id\" => \"v-901\",\n                    \"title\" => \"Стажёр-аналитик\",\n                    \"salary\" => { \"from\" => 50000, \"to\" => 70000 } })\ndrafts.insert_one({ \"_id\" => \"v-902\",\n                    \"title\" => \"Тестировщик\",\n                    \"salary\" => { \"from\" => 90000, \"to\" => 60000 } })\n\nputs \"со знаком $: \" + drafts.count_documents({ \"$expr\" => { \"$gt\" => [\"$salary.from\", \"$salary.to\"] } }).to_s\nputs \"без знака $: \" + drafts.count_documents({ \"$expr\" => { \"$gt\" => [\"salary.from\", \"salary.to\"] } }).to_s"
   },
   "key": {
    "python": [
     "1f5889940ce7cb75"
    ],
    "cpp": [
     "ccdb4fe014544b30"
    ],
    "go": [
     "013f71842ed52884"
    ],
    "ruby": [
     "a179e56c84e05094"
    ]
   },
   "chapters": [
    "2.8"
   ]
  },
  {
   "id": "q22",
   "topic": "2.8 · вычисление в $expr",
   "type": "single",
   "text": "Фрагмент считает вакансии, где разница между верхней и нижней границей вилки не больше 40 000. Что он напечатает?",
   "options": [
    "<code>вилка не шире 40 000: 3</code>",
    "<code>вилка не шире 40 000: 2</code>",
    "<code>вилка не шире 40 000: 5</code>",
    "<code>вилка не шире 40 000: 0</code>"
   ],
   "code": {
    "python": "print(\"вилка не шире 40 000:\", vacancies.count_documents({\"$expr\": {\"$lte\": [{\"$subtract\": [\"$salary.to\", \"$salary.from\"]}, 40000]}}))",
    "cpp": "std::cout << \"вилка не шире 40 000: \" << vacancies.count_documents(make_document(kvp(\"$expr\", make_document(kvp(\"$lte\", make_array(make_document(kvp(\"$subtract\", make_array(\"$salary.to\", \"$salary.from\"))), 40000)))))) << std::endl;",
    "go": "uzkie, _ := vacancies.CountDocuments(ctx, bson.D{{Key: \"$expr\", Value: bson.D{{Key: \"$lte\", Value: bson.A{bson.D{{Key: \"$subtract\", Value: bson.A{\"$salary.to\", \"$salary.from\"}}}, 40000}}}}})\n\nfmt.Println(\"вилка не шире 40 000:\", uzkie)",
    "ruby": "puts \"вилка не шире 40 000: \" + vacancies.count_documents({ \"$expr\" => { \"$lte\" => [{ \"$subtract\" => [\"$salary.to\", \"$salary.from\"] }, 40000] } }).to_s"
   },
   "docs": [
    {
     "title": "hh.vacancies",
     "note": "hh.vacancies: все 8 вакансий; показаны поля title, salary, _id",
     "text": "{ _id: 'v-001', title: 'Junior Python-разработчик', salary: { from: 60000, to: 90000 } }\n{ _id: 'v-004', title: 'Тестировщик', salary: { from: 70000, to: 95000 } }\n{ _id: 'v-005', title: 'Backend-разработчик .NET', salary: { from: 100000, to: 150000 } }\n{ _id: 'v-006', title: 'Frontend-разработчик', salary: { from: 90000, to: 140000 } }\n{ _id: 'v-002', title: 'Инженер сопровождения БД', salary: { from: 80000, to: 120000 } }\n{ _id: 'v-007', title: 'Администратор баз данных', salary: { from: 110000, to: 160000 } }\n{ _id: 'v-003', title: 'Аналитик данных', salary: { from: 120000, to: 180000 } }\n{ _id: 'v-008', title: 'Data-инженер', salary: { from: 140000, to: 200000 } }"
    }
   ],
   "key": {
    "python": [
     "f3868dc3b9ae9f81"
    ],
    "cpp": [
     "f034c987f8bc4dad"
    ],
    "go": [
     "b6b4baae07ffe816"
    ],
    "ruby": [
     "a54029ee5196c6e8"
    ]
   },
   "chapters": [
    "2.8"
   ]
  },
  {
   "id": "q23",
   "topic": "1.6 + 2.3 · порядок и порции",
   "type": "single",
   "text": "Фрагмент выбирает соискателей из Ярославля и Казани, сортирует по зарплате от большей к меньшей, пропускает первого и берёт двоих. Кого он напечатает?",
   "options": [
    "Тимур Валиев, затем Ольга Пирогова",
    "Игорь Самойлов, затем Тимур Валиев",
    "Ольга Пирогова, затем Ксения Лапина",
    "Тимур Валиев, затем Ксения Лапина"
   ],
   "code": {
    "python": "for doc in resumes.find({\"city\": {\"$in\": [\"Ярославль\", \"Казань\"]}}, {\"_id\": 0, \"fio\": 1, \"salary\": 1}) \\\n                 .sort(\"salary\", -1).skip(1).limit(2):\n    print(doc)",
    "ruby": "resumes.find({ \"city\" => { \"$in\" => [\"Ярославль\", \"Казань\"] } }, projection: { \"_id\" => 0, \"fio\" => 1, \"salary\" => 1 })\n       .sort({ \"salary\" => -1 }).skip(1).limit(2)\n       .each { |doc| puts doc.inspect }",
    "go": "cursor, _ := resumes.Find(ctx, bson.D{{Key: \"city\", Value: bson.D{{Key: \"$in\", Value: bson.A{\"Ярославль\", \"Казань\"}}}}},\n    options.Find().\n        SetProjection(bson.D{{Key: \"_id\", Value: 0}, {Key: \"fio\", Value: 1}, {Key: \"salary\", Value: 1}}).\n        SetSort(bson.D{{Key: \"salary\", Value: -1}}).\n        SetSkip(1).\n        SetLimit(2))\nfor cursor.Next(ctx) {\n    var doc bson.D\n    cursor.Decode(&doc)\n    out, _ := bson.MarshalExtJSON(doc, false, false)\n    fmt.Println(string(out))\n}",
    "cpp": "mongocxx::options::find options;\noptions.projection(make_document(kvp(\"_id\", 0), kvp(\"fio\", 1), kvp(\"salary\", 1)));\noptions.sort(make_document(kvp(\"salary\", -1)));\noptions.skip(1);\noptions.limit(2);\n\nauto filtr = make_document(kvp(\"city\", make_document(kvp(\"$in\", make_array(\"Ярославль\", \"Казань\")))));\nfor (const auto& doc : resumes.find(filtr.view(), options)) {\n    std::cout << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;\n}"
   },
   "docs": [
    {
     "title": "hh.resumes",
     "note": "hh.resumes: все 9 резюме; показаны поля fio, city, salary",
     "text": "{ fio: 'Анна Белова', city: 'Ярославль', salary: 65000 }\n{ fio: 'Пётр Ковалёв', city: 'Ярославль', salary: 70000 }\n{ fio: 'Алина Дроздова', city: 'Москва', salary: 120000 }\n{ fio: 'Игорь Самойлов', city: 'Ярославль', salary: 150000 }\n{ fio: 'Дарья Нечаева', city: 'Санкт-Петербург', salary: 80000 }\n{ fio: 'Тимур Валиев', city: 'Казань', salary: 140000 }\n{ fio: 'Ксения Лапина', city: 'Ярославль', salary: 90000 }\n{ fio: 'Марк Ефремов', city: 'Новосибирск', salary: 75000 }\n{ fio: 'Ольга Пирогова', city: 'Ярославль', salary: 110000 }"
    }
   ],
   "key": {
    "python": [
     "f7e1da11fb1b7118"
    ],
    "cpp": [
     "8a7a32dc633f9a22"
    ],
    "go": [
     "c6892508e41bc4aa"
    ],
    "ruby": [
     "6b7ff1716b1ca150"
    ]
   },
   "chapters": [
    "1.6",
    "2.3"
   ]
  },
  {
   "id": "q24",
   "topic": "1.7 + 2.5 · исправление типа",
   "type": "single",
   "text": "В песочнице 21 товар, у всех цена — число больше 500. Фрагмент добавляет два товара, у которых цена пришла из веб-формы строкой, и исправляет цену одним вызовом <code>update_one</code>. Что он напечатает?",
   "options": [
    "<code>цена строкой: 1</code><br><code>дороже 500: 22</code>",
    "<code>цена строкой: 0</code><br><code>дороже 500: 23</code>",
    "<code>цена строкой: 1</code><br><code>дороже 500: 23</code>",
    "<code>цена строкой: 0</code><br><code>дороже 500: 22</code>"
   ],
   "code": {
    "python": "# два товара из веб-формы: цена пришла текстом\nbox.insert_one({\"_id\": \"p-201\",\n                \"title\": \"Кабель USB-C 2 м\",\n                \"category\": \"аксессуары\",\n                \"price\": \"790\"})\nbox.insert_one({\"_id\": \"p-202\",\n                \"title\": \"Адаптер HDMI\",\n                \"category\": \"аксессуары\",\n                \"price\": \"1290\"})\nbox.update_one({\"price\": {\"$type\": \"string\"}}, {\"$set\": {\"price\": 790}})\n\nprint(\"цена строкой:\", box.count_documents({\"price\": {\"$type\": \"string\"}}))\nprint(\"дороже 500:  \", box.count_documents({\"price\": {\"$gt\": 500}}))",
    "cpp": "// два товара из веб-формы: цена пришла текстом\nbox.insert_one(make_document(\n    kvp(\"_id\", \"p-201\"),\n    kvp(\"title\", \"Кабель USB-C 2 м\"),\n    kvp(\"category\", \"аксессуары\"),\n    kvp(\"price\", \"790\")));\nbox.insert_one(make_document(\n    kvp(\"_id\", \"p-202\"),\n    kvp(\"title\", \"Адаптер HDMI\"),\n    kvp(\"category\", \"аксессуары\"),\n    kvp(\"price\", \"1290\")));\nbox.update_one(make_document(kvp(\"price\", make_document(kvp(\"$type\", \"string\")))), make_document(kvp(\"$set\", make_document(kvp(\"price\", 790)))));\n\nstd::cout << \"цена строкой: \" << box.count_documents(make_document(kvp(\"price\", make_document(kvp(\"$type\", \"string\"))))) << std::endl;\nstd::cout << \"дороже 500:   \" << box.count_documents(make_document(kvp(\"price\", make_document(kvp(\"$gt\", 500))))) << std::endl;",
    "go": "// два товара из веб-формы: цена пришла текстом\nbox.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: \"p-201\"},\n    {Key: \"title\", Value: \"Кабель USB-C 2 м\"},\n    {Key: \"category\", Value: \"аксессуары\"},\n    {Key: \"price\", Value: \"790\"}})\nbox.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: \"p-202\"},\n    {Key: \"title\", Value: \"Адаптер HDMI\"},\n    {Key: \"category\", Value: \"аксессуары\"},\n    {Key: \"price\", Value: \"1290\"}})\nbox.UpdateOne(ctx, bson.D{{Key: \"price\", Value: bson.D{{Key: \"$type\", Value: \"string\"}}}}, bson.D{{Key: \"$set\", Value: bson.D{{Key: \"price\", Value: 790}}}})\n\nstrokoy, _ := box.CountDocuments(ctx, bson.D{{Key: \"price\", Value: bson.D{{Key: \"$type\", Value: \"string\"}}}})\ndorozhe, _ := box.CountDocuments(ctx, bson.D{{Key: \"price\", Value: bson.D{{Key: \"$gt\", Value: 500}}}})\n\nfmt.Println(\"цена строкой:\", strokoy)\nfmt.Println(\"дороже 500:  \", dorozhe)",
    "ruby": "# два товара из веб-формы: цена пришла текстом\nbox.insert_one({ \"_id\" => \"p-201\",\n                 \"title\" => \"Кабель USB-C 2 м\",\n                 \"category\" => \"аксессуары\",\n                 \"price\" => \"790\" })\nbox.insert_one({ \"_id\" => \"p-202\",\n                 \"title\" => \"Адаптер HDMI\",\n                 \"category\" => \"аксессуары\",\n                 \"price\" => \"1290\" })\nbox.update_one({ \"price\" => { \"$type\" => \"string\" } }, { \"$set\" => { \"price\" => 790 } })\n\nputs \"цена строкой: \" + box.count_documents({ \"price\" => { \"$type\" => \"string\" } }).to_s\nputs \"дороже 500:   \" + box.count_documents({ \"price\" => { \"$gt\" => 500 } }).to_s"
   },
   "key": {
    "python": [
     "fe84bb166bab68e2"
    ],
    "cpp": [
     "ed221b56eddbc1d5"
    ],
    "go": [
     "f65e2927908d0c07"
    ],
    "ruby": [
     "8403ec73c816a2e5"
    ]
   },
   "chapters": [
    "1.7",
    "2.5"
   ]
  },
  {
   "id": "q25",
   "topic": "1.8 + 2.5 · фильтр удаления",
   "type": "single",
   "text": "У всех 21 товара песочницы бренд заполнен строкой. Фрагмент добавляет два черновика: у первого бренд записан как null, у второго поля <code>brand</code> нет. Затем удаляет товары с условием <code>brand</code> равно null. Что он напечатает?",
   "options": [
    "<code>осталось товаров: 22</code>",
    "<code>осталось товаров: 21</code>",
    "<code>осталось товаров: 23</code>",
    "<code>осталось товаров: 0</code>"
   ],
   "code": {
    "python": "# черновики карточек\nbox.insert_one({\"_id\": \"p-201\",\n                \"title\": \"Кабель USB-C 2 м\",\n                \"brand\": None,\n                \"price\": 790})\nbox.insert_one({\"_id\": \"p-202\", \"title\": \"Адаптер HDMI\", \"price\": 1290})\n\nbox.delete_many({\"brand\": None})\n\nprint(\"осталось товаров:\", box.count_documents({}))",
    "cpp": "// черновики карточек\nbox.insert_one(make_document(\n    kvp(\"_id\", \"p-201\"),\n    kvp(\"title\", \"Кабель USB-C 2 м\"),\n    kvp(\"brand\", bsoncxx::types::b_null{}),\n    kvp(\"price\", 790)));\nbox.insert_one(make_document(\n    kvp(\"_id\", \"p-202\"),\n    kvp(\"title\", \"Адаптер HDMI\"),\n    kvp(\"price\", 1290)));\n\nbox.delete_many(make_document(kvp(\"brand\", bsoncxx::types::b_null{})));\n\nstd::cout << \"осталось товаров: \" << box.count_documents(make_document()) << std::endl;",
    "go": "// черновики карточек\nbox.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: \"p-201\"},\n    {Key: \"title\", Value: \"Кабель USB-C 2 м\"},\n    {Key: \"brand\", Value: nil},\n    {Key: \"price\", Value: 790}})\nbox.InsertOne(ctx, bson.D{\n    {Key: \"_id\", Value: \"p-202\"},\n    {Key: \"title\", Value: \"Адаптер HDMI\"},\n    {Key: \"price\", Value: 1290}})\n\nbox.DeleteMany(ctx, bson.D{{Key: \"brand\", Value: nil}})\n\nostalos, _ := box.CountDocuments(ctx, bson.D{})\n\nfmt.Println(\"осталось товаров:\", ostalos)",
    "ruby": "# черновики карточек\nbox.insert_one({ \"_id\" => \"p-201\",\n                 \"title\" => \"Кабель USB-C 2 м\",\n                 \"brand\" => nil,\n                 \"price\" => 790 })\nbox.insert_one({ \"_id\" => \"p-202\", \"title\" => \"Адаптер HDMI\", \"price\" => 1290 })\n\nbox.delete_many({ \"brand\" => nil })\n\nputs \"осталось товаров: \" + box.count_documents({}).to_s"
   },
   "key": {
    "python": [
     "9864f9e64f7fc7fd"
    ],
    "cpp": [
     "fbebeb0986e21d87"
    ],
    "go": [
     "a84aa26264691774"
    ],
    "ruby": [
     "017f07095ed1fead"
    ]
   },
   "chapters": [
    "1.8",
    "2.5"
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
