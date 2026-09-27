/* Тест модуля 2 · справочник по MongoDB. Файл собран скриптом — руками не править.

   Верные ответы здесь только хешами: SHA-256 от "СОЛЬ|вопрос|язык|вариант".
   Это барьер от беглого чтения исходника, а не защита: вариантов мало,
   перебрать их в консоли можно. Разбора ответов в публичных файлах нет. */

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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
   }
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
