"""Таблицы «Частые ошибки» на четырёх языках.

Ошибки у драйверов разные: где Python бросает исключение, Go возвращает
error, C++ — пустой optional, а Ruby молча отдаёт nil. Поэтому таблица
переключается вместе с кодом.

Все сообщения в таблицах получены запуском на стенде, а не выдуманы.

Запуск: python3 tools/errors.py
"""

import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lang import ORDER

BOOK = pathlib.Path(__file__).resolve().parent.parent

# Заголовки колонок у глав различаются.
HEADERS = {
    "01-klient-baza-kollekciya": ("Что происходит", "Что видно", "В чём дело"),
}
DEFAULT_HEADER = ("Что написано", "Что происходит", "Как правильно")

TABLES = {
"01-klient-baza-kollekciya": {
 "python": [
  ("Сервер не запущен", "<code>ServerSelectionTimeoutError: localhost:27017: [Errno 61] Connection refused</code>", "Адрес верный, но по нему никто не отвечает. Проверять надо сервер, а не строку подключения"),
  ("Опечатка в имени хоста", "<code>ServerSelectionTimeoutError</code> после 30 секунд ожидания", "Имя не разрешилось в адрес. Отличается от предыдущего тем, что ответа нет вовсе, а не «отказ»"),
  ("Опечатка в имени коллекции", "Ошибки нет, результат пустой", "Коллекция создаётся при первой записи, поэтому обращение к несуществующей — законная операция"),
  ("<code>col.count()</code>", "<code>AttributeError: 'Collection' object has no attribute 'count'</code>", "Метод убран из драйвера. Считает <code>count_documents({})</code>, и фильтр обязателен"),
  ("Клиент создан внутри цикла", "Программа работает, но с каждым шагом медленнее", "На каждой итерации поднимается новый пул соединений. Клиент создаётся один раз"),
 ],
 "cpp": [
  ("Сервер не запущен", "<code>No suitable servers found: [connection refused calling hello]</code>", "Адрес верный, но по нему никто не отвечает. Проверять надо сервер, а не строку подключения"),
  ("<code>mongocxx::instance</code> не создан", "Программа падает при первом обращении к драйверу", "Экземпляр создаётся ровно один раз за время жизни программы и раньше любого клиента"),
  ("Два <code>mongocxx::instance</code>", "<code>cannot create a mongocxx::instance object if one has already been created</code>", "Экземпляр в программе один; клиентов при этом может быть сколько угодно"),
  ("Опечатка в имени коллекции", "Ошибки нет, результат пустой", "Коллекция создаётся при первой записи, поэтому обращение к несуществующей — законная операция"),
  ("Клиент создан внутри функции", "Работает, но каждый вызов поднимает новый пул соединений", "Клиент живёт рядом с приложением; для многопоточности берут <code>mongocxx::pool</code>"),
 ],
 "go": [
  ("Сервер не запущен", "<code>server selection error: context deadline exceeded, current topology: { Type: Unknown …</code>", "<code>Connect</code> ошибки не вернёт: соединение ленивое. Проверять надо сервер"),
  ("Ошибка <code>Connect</code> не проверена", "Программа идёт дальше с нерабочим клиентом", "В Go ошибка — возвращаемое значение, а не исключение: её проверяют сразу"),
  ("Забыт <code>defer client.Disconnect(ctx)</code>", "Соединения остаются открытыми до конца процесса", "Клиент закрывают там же, где создали"),
  ("Опечатка в имени коллекции", "Ошибки нет, результат пустой", "Коллекция создаётся при первой записи, поэтому обращение к несуществующей — законная операция"),
  ("<code>mongo.Connect</code> в каждом обработчике", "Работает, но с каждым запросом медленнее", "Клиент создаётся один раз при старте и живёт всё время работы сервиса"),
 ],
 "ruby": [
  ("Сервер не запущен", "<code>Mongo::Error::NoServerAvailable</code>: No primary_preferred server is available in cluster", "Адрес верный, но по нему никто не отвечает. Проверять надо сервер, а не строку подключения"),
  ("Константа названа <code>URI</code>", "<code>TypeError</code>: «mongodb://…» is not a class/module", "<code>URI</code> — модуль стандартной библиотеки. Константу называют иначе, например <code>SERVER</code>"),
  ("Опечатка в имени коллекции", "Ошибки нет, результат пустой", "Коллекция создаётся при первой записи, поэтому обращение к несуществующей — законная операция"),
  ("Логи драйвера в консоли", "Каждая операция печатает строку <code>D, [timestamp] DEBUG</code>", "<code>Mongo::Logger.logger.level = Logger::WARN</code> в начале программы"),
  ("Клиент создан внутри метода", "Работает, но каждый вызов поднимает новый пул соединений", "Клиент создаётся один раз; закрывают его <code>client.close</code> в конце программы"),
 ],
},
"02-dokument-i-bson": {
 "python": [
  ("<code>{\"price\": \"21990\"}</code>", "Записано строкой. Сравнения и суммы по этому полю работать перестанут", "Приводить к числу до записи: <code>int(value)</code>"),
  ("<code>{\"_id\": \"6aa08c…\"}</code> для ObjectId", "Пустой результат: строка не равна ObjectId", "<code>{\"_id\": ObjectId(\"6aa08c…\")}</code>"),
  ("Попытка изменить <code>_id</code>", "<code>WriteError</code>: would modify the immutable field '_id'", "Удалить документ и вставить заново с новым ключом"),
  ("Дата записана строкой <code>\"2026-04-19\"</code>", "Сортировка сработает случайно, а сравнение по датам — нет", "Писать <code>datetime</code>, база сохранит его типом <code>date</code>"),
  ("Массив на десятки тысяч элементов в документе", "Приближение к пределу 16 МБ и медленное чтение целиком", "Выносить растущий список в отдельную коллекцию"),
 ],
 "cpp": [
  ("<code>kvp(\"price\", \"21990\")</code>", "Записано строкой: <code>kvp</code> выводит тип из аргумента", "Передавать число: <code>kvp(\"price\", 21990)</code>"),
  ("<code>get_string()</code> на числовом поле", "<code>bsoncxx::exception</code>: requested type does not match the underlying type: expected element type k_string", "Смотреть <code>element.type()</code> или брать <code>get_int32()</code>"),
  ("Чтение поля, которого нет", "<code>cannot get int32 from an uninitialized element: view is invalid</code>", "Сначала проверить: <code>if (doc[\"discount\"]) …</code>"),
  ("<code>string_view</code> пережил документ", "Мусор в строке: view ссылается на освобождённую память", "Копировать в <code>std::string</code>, если значение нужно дольше документа"),
  ("Массив на десятки тысяч элементов в документе", "Приближение к пределу 16 МБ и медленное чтение целиком", "Выносить растущий список в отдельную коллекцию"),
 ],
 "go": [
  ("<code>Price string</code> при <code>int32</code> в базе", "<code>error decoding key price: cannot decode 32-bit integer into a string type</code>", "Тип поля структуры должен совпадать с типом в BSON"),
  ("Поле структуры со строчной буквы", "Поле молча не заполняется и не записывается", "Экспортируемые имена с большой буквы плюс тег <code>bson:\"price\"</code>"),
  ("<code>bson.M</code> там, где важен порядок", "<code>multi-key map passed in for ordered parameter</code>", "<code>bson.D</code> хранит порядок ключей; <code>bson.M</code> — обычная карта"),
  ("Строка вместо <code>bson.ObjectID</code>", "Пустой результат: строка не равна ObjectID", "<code>bson.ObjectIDFromHex(raw)</code> и фильтр по полученному значению"),
  ("Массив на десятки тысяч элементов в документе", "Приближение к пределу 16 МБ и медленное чтение целиком", "Выносить растущий список в отдельную коллекцию"),
 ],
 "ruby": [
  ("<code>{ \"price\" =&gt; \"21990\" }</code>", "Записано строкой. Сравнения и суммы по этому полю работать перестанут", "Приводить к числу до записи: <code>value.to_i</code>"),
  ("Строка вместо <code>BSON::ObjectId</code>", "Пустой результат: строка не равна ObjectId", "<code>BSON::ObjectId.from_string(raw)</code>"),
  ("Символ вместо строки в фильтре", "<code>{ sku: \"…\" }</code> и <code>{ \"sku\" =&gt; \"…\" }</code> — разные ключи для драйвера", "В фильтрах и документах ключи пишут строками"),
  ("Чтение поля, которого нет", "Возвращается <code>nil</code>, ошибки нет", "Проверять на <code>nil</code> до арифметики, иначе <code>NoMethodError</code> вылезет дальше по коду"),
  ("Массив на десятки тысяч элементов в документе", "Приближение к пределу 16 МБ и медленное чтение целиком", "Выносить растущий список в отдельную коллекцию"),
 ],
},
"03-vstavka": {
 "python": [
  ("<code>insert_one([...])</code> со списком", "<code>TypeError: document must be an instance of dict</code>", "Список — это <code>insert_many</code>"),
  ("<code>doc = insert_one({...})</code>", "В переменной результат операции, а не документ", "Читать обратно: <code>find_one({\"_id\": result.inserted_id})</code>"),
  ("Повторный запуск загрузчика", "Документов вдвое больше, числа в отчётах не сходятся", "Очищать коллекцию или задавать свой <code>_id</code>, чтобы повтор упёрся в <code>E11000</code>"),
  ("<code>insert_one</code> в цикле на тысячу документов", "Работает, но медленно: каждый вызов — обращение к серверу", "Собрать список и вставить одним <code>insert_many</code>"),
  ("Тот же словарь вставлен дважды", "<code>DuplicateKeyError</code>: драйвер дописал <code>_id</code> в исходный словарь", "Копировать словарь или создавать новый для каждой записи"),
 ],
 "cpp": [
  ("<code>insert_one</code> с уже использованным <code>document::value</code>", "Компилируется, но документ уходит в перемещённом состоянии", "Собирать документ заново или передавать <code>view()</code>"),
  ("Результат не проверен на пустоту", "Разыменование пустого <code>optional</code> — неопределённое поведение", "<code>if (result) result-&gt;inserted_id()</code>"),
  ("Повторный запуск загрузчика", "Документов вдвое больше, числа в отчётах не сходятся", "Очищать коллекцию или задавать свой <code>_id</code>, чтобы повтор упёрся в <code>E11000</code>"),
  ("<code>insert_one</code> в цикле на тысячу документов", "Работает, но медленно: каждый вызов — обращение к серверу", "Собрать <code>std::vector&lt;document::value&gt;</code> и вставить <code>insert_many</code>"),
  ("Исключение не поймано", "Программа падает на первом дубликате ключа", "<code>catch (const mongocxx::bulk_write_exception&amp;)</code> и разбор <code>code().value()</code>"),
 ],
 "go": [
  ("<code>InsertMany</code> с одним документом вместо среза", "<code>invalid documents: must provide a non-empty slice</code>", "Первым аргументом идёт срез, даже если документ один"),
  ("Ошибка вставки не проверена", "Документ не записан, программа идёт дальше", "<code>if err != nil</code> сразу после вызова"),
  ("Повторный запуск загрузчика", "Документов вдвое больше, числа в отчётах не сходятся", "Очищать коллекцию или задавать свой <code>_id</code>, чтобы повтор упёрся в <code>E11000</code>"),
  ("<code>InsertOne</code> в цикле на тысячу документов", "Работает, но медленно: каждый вызов — обращение к серверу", "Собрать срез и вставить одним <code>InsertMany</code>"),
  ("<code>err != nil</code> считается полным провалом", "При <code>ordered=false</code> часть документов уже записана", "Разобрать <code>mongo.BulkWriteException</code> и посмотреть <code>WriteErrors</code>"),
 ],
 "ruby": [
  ("<code>insert_one([...])</code> со списком", "Список записывается как один документ или вызывает ошибку драйвера", "Список — это <code>insert_many</code>"),
  ("<code>doc = insert_one({...})</code>", "В переменной результат операции, а не документ", "Читать обратно: <code>col.find({ \"_id\" =&gt; result.inserted_id }).first</code>"),
  ("Повторный запуск загрузчика", "Документов вдвое больше, числа в отчётах не сходятся", "Очищать коллекцию или задавать свой <code>_id</code>, чтобы повтор упёрся в <code>E11000</code>"),
  ("<code>rescue Mongo::Error::OperationFailure</code> на пачке", "Исключение проходит мимо: частичный отказ — это <code>BulkWriteError</code>", "<code>rescue Mongo::Error::BulkWriteError</code>, список неудач в <code>error.result[\"writeErrors\"]</code>"),
  ("<code>insert_one</code> в цикле на тысячу документов", "Работает, но медленно: каждый вызов — обращение к серверу", "Собрать массив и вставить одним <code>insert_many</code>"),
 ],
},
"04-find-i-kursor": {
 "python": [
  ("<code>find(...)[0]</code>", "<code>TypeError</code>: курсор не индексируется как список", "<code>find_one(...)</code> или <code>list(find(...))[0]</code>"),
  ("<code>len(cursor)</code>", "<code>TypeError: object of type 'Cursor' has no len()</code>", "<code>count_documents(filter)</code>"),
  ("Перебор курсора дважды", "Второй раз ноль строк, ошибки нет", "Сохранить в список: <code>items = list(...)</code>"),
  ("<code>find_one(...)[\"title\"]</code> без проверки", "<code>TypeError: 'NoneType' object is not subscriptable</code>", "Проверить на <code>None</code> до обращения к полям"),
  ("Опора на порядок без <code>sort</code>", "Работает, пока однажды не переставится", "Всегда указывать сортировку, если порядок важен"),
 ],
 "cpp": [
  ("Разыменование результата <code>find_one</code>", "Пустой <code>optional</code>: неопределённое поведение вместо понятной ошибки", "<code>if (one) one-&gt;view()[\"title\"]</code>"),
  ("Повторный обход курсора", "Второй <code>for</code> не даёт ни одного документа", "Сложить документы в <code>std::vector</code>, если нужны дважды"),
  ("<code>cursor.begin()</code> вызван дважды", "Второй вызов возвращает конец: курсор уже прочитан", "Обходить один раз или собирать результат"),
  ("<code>get_string()</code> без проверки типа", "<code>requested type does not match the underlying type</code>", "Сверяться с <code>element.type()</code>"),
  ("Опора на порядок без <code>sort</code>", "Работает, пока однажды не переставится", "Всегда указывать сортировку, если порядок важен"),
 ],
 "go": [
  ("Ошибка <code>Decode</code> не проверена", "В структуре нули, программа считает это данными", "Сравнить с <code>mongo.ErrNoDocuments</code>: это «не нашлось», а не сбой"),
  ("Повторный <code>All</code> по курсору", "Пустой срез и <code>nil</code> вместо ошибки — молчаливая потеря данных", "Читать курсор один раз, результат держать в срезе"),
  ("<code>cursor.Err()</code> не проверен после цикла", "Обрыв соединения выглядит как конец данных", "После <code>for cursor.Next(ctx)</code> проверять <code>cursor.Err()</code>"),
  ("Забыт <code>defer cursor.Close(ctx)</code>", "Курсор остаётся открытым на сервере", "Закрывать курсор или использовать <code>All</code>"),
  ("Опора на порядок без <code>SetSort</code>", "Работает, пока однажды не переставится", "Всегда указывать сортировку, если порядок важен"),
 ],
 "ruby": [
  ("<code>find(...).first[\"title\"]</code> без проверки", "<code>NoMethodError: undefined method '[]' for nil:NilClass</code>", "Проверить на <code>nil</code> до обращения к полям"),
  ("<code>view.count</code> вместо счёта на сервере", "Документы приезжают на клиент ради одного числа", "<code>count_documents(filter)</code>"),
  ("Обход <code>view</code> в цикле", "Каждый обход — новый запрос к серверу", "<code>to_a</code> один раз, если данные нужны несколько раз"),
  ("Символьные ключи в фильтре", "<code>{ category: \"…\" }</code> не совпадает со строковым ключом в документе", "Ключи фильтра пишут строками"),
  ("Опора на порядок без <code>sort</code>", "Работает, пока однажды не переставится", "Всегда указывать сортировку, если порядок важен"),
 ],
},
"05-proekciya": {
 "python": [
  ("<code>find({}, [\"title\", \"price\"])</code>", "Список вместо документа: драйвер примет, но это менее очевидная форма", "Писать документом: <code>{\"title\": 1, \"price\": 1}</code>"),
  ("<code>{\"title\": 1, \"stock\": 0}</code>", "<code>OperationFailure: Cannot do exclusion on field stock in inclusion projection</code>", "Выбрать одно: либо белый список, либо чёрный"),
  ("Ожидание, что <code>_id</code> исчезнет сам", "<code>_id</code> приезжает всегда", "Указать <code>\"_id\": 0</code> явно"),
  ("<code>{\"delivery.city\": 1}</code> и ожидание строки", "Вернётся <code>{'delivery': {'city': ...}}</code> — структура сохраняется", "Разворачивать в коде или использовать <code>$project</code> в агрегации"),
  ("Проекция вместо фильтра: <code>find({\"title\": 1})</code>", "Ищет документы, где <code>title</code> равен числу 1. Результат пуст", "Фильтр — первый аргумент, проекция — в options"),
 ],
 "cpp": [
  ("Проекция передана как фильтр", "Пустой результат: документ ушёл первым аргументом <code>find</code>", "Проекция задаётся через <code>mongocxx::options::find</code>"),
  ("<code>kvp(\"title\", 1), kvp(\"stock\", 0)</code>", "<code>Cannot do exclusion on field stock in inclusion projection: server error code 31254</code>", "Выбрать одно: либо белый список, либо чёрный"),
  ("Ожидание, что <code>_id</code> исчезнет сам", "<code>_id</code> приезжает всегда", "Добавить <code>kvp(\"_id\", 0)</code>"),
  ("Чтение поля, отсечённого проекцией", "<code>cannot get … from an uninitialized element: view is invalid</code>", "Проверять <code>if (doc[\"stock\"])</code> или не отсекать нужное поле"),
  ("<code>options</code> переиспользованы между запросами", "Проекция и сортировка «прилипают» к следующему <code>find</code>", "Заводить <code>options</code> на каждый запрос"),
 ],
 "go": [
  ("Проекция передана вторым аргументом <code>Find</code>", "Компилятор не пропустит: вторым идёт <code>*options.FindOptionsBuilder</code>", "<code>options.Find().SetProjection(...)</code>"),
  ("<code>SetProjection(bson.D{{\"title\",1},{\"stock\",0}})</code>", "<code>(Location31254) Cannot do exclusion on field stock in inclusion projection</code>", "Выбрать одно: либо белый список, либо чёрный"),
  ("Поле есть в проекции, но нет в структуре", "Значение молча теряется при декодировании", "Добавить поле в структуру с тегом <code>bson</code> или декодировать в <code>bson.M</code>"),
  ("<code>options.Find()</code> вместо <code>options.FindOne()</code>", "Компилятор не пропустит: у <code>FindOne</code> свой тип настроек", "Для одного документа — <code>options.FindOne().SetProjection(...)</code>"),
  ("Ожидание, что <code>_id</code> исчезнет сам", "<code>_id</code> приезжает всегда", "<code>{Key: \"_id\", Value: 0}</code> в проекции"),
 ],
 "ruby": [
  ("Проекция вторым позиционным аргументом", "Драйвер ждёт именованный параметр и молча его не применит", "<code>find(filter, projection: { … })</code>"),
  ("<code>projection: { \"title\" =&gt; 1, \"stock\" =&gt; 0 }</code>", "<code>[31254:Location31254]: Cannot do exclusion on field stock in inclusion projection</code>", "Выбрать одно: либо белый список, либо чёрный"),
  ("Ожидание, что <code>_id</code> исчезнет сам", "<code>_id</code> приезжает всегда", "Указать <code>\"_id\" =&gt; 0</code> явно"),
  ("<code>projection: { \"delivery.city\" =&gt; 1 }</code> и ожидание строки", "Вернётся <code>{\"delivery\"=&gt;{\"city\"=&gt;…}}</code> — структура сохраняется", "Разворачивать в коде или использовать <code>$project</code> в агрегации"),
  ("Символьные ключи в проекции", "Ключ не совпадает с именем поля в документе", "Имена полей пишут строками"),
 ],
},
"06-sort-limit-skip": {
 "python": [
  ("<code>.sort(\"price\")</code> без направления", "Сортирует по возрастанию; в <code>mongosh</code> такая запись — ошибка", "Указывать направление явно: <code>.sort(\"price\", -1)</code>"),
  ("<code>.sort(\"category\", 1)</code> для постраничного вывода", "Порядок внутри категории не определён — документы «прыгают» между страницами", "Добавить уникальный ключ: <code>[(\"category\", 1), (\"_id\", 1)]</code>"),
  ("<code>count_documents()</code> без аргумента", "<code>TypeError: missing 1 required positional argument: 'filter'</code>", "<code>count_documents({})</code>"),
  ("Сортировка по полю без индекса на большой коллекции", "<code>Sort exceeded memory limit</code>", "Построить индекс по полю сортировки — глава 3.2"),
  ("<code>skip</code> на глубоких страницах ленты", "Чем дальше страница, тем медленнее ответ", "Листать якорем: <code>{\"_id\": {\"$gt\": последний}}</code>"),
 ],
 "cpp": [
  ("Сортировка задана в фильтре", "Пустой результат: <code>{price: -1}</code> ушло как условие", "Сортировка — в <code>options.sort(...)</code>"),
  ("Сортировка только по цене для страниц", "Товары с одинаковой ценой прыгают между страницами", "Второй ключ: <code>kvp(\"price\", -1), kvp(\"_id\", 1)</code>"),
  ("<code>limit</code> и <code>skip</code> типа <code>int</code>", "Сужение до 32 бит на больших коллекциях", "Оба принимают <code>std::int64_t</code>"),
  ("Сортировка по полю без индекса на большой коллекции", "<code>Sort exceeded memory limit</code>", "Построить индекс по полю сортировки — глава 3.2"),
  ("<code>skip</code> на глубоких страницах ленты", "Чем дальше страница, тем медленнее ответ", "Листать якорем: <code>$gt</code> по последнему <code>_id</code>"),
 ],
 "go": [
  ("<code>SetSort(bson.M{...})</code> с двумя ключами", "<code>multi-key map passed in for ordered parameter sort</code>", "<code>bson.D</code>: только он хранит порядок ключей"),
  ("Сортировка только по цене для страниц", "Товары с одинаковой ценой прыгают между страницами", "Второй ключ: <code>{\"price\", -1}, {\"_id\", 1}</code>"),
  ("<code>SetSkip(int(...))</code>", "Не компилируется: параметр типа <code>int64</code>", "Приводить к <code>int64</code> явно"),
  ("Сортировка по полю без индекса на большой коллекции", "<code>Sort exceeded memory limit</code>", "Построить индекс по полю сортировки — глава 3.2"),
  ("<code>SetSkip</code> на глубоких страницах ленты", "Чем дальше страница, тем медленнее ответ", "Листать якорем: <code>$gt</code> по последнему <code>_id</code>"),
 ],
 "ruby": [
  ("<code>.sort(\"price\")</code> строкой", "Драйвер ждёт документ, а не имя поля", "<code>.sort({ \"price\" =&gt; -1 })</code>"),
  ("<code>.sort({ \"category\" =&gt; 1 })</code> для страниц", "Порядок внутри категории не определён — документы «прыгают»", "Добавить уникальный ключ: <code>{ \"category\" =&gt; 1, \"_id\" =&gt; 1 }</code>"),
  ("<code>.count</code> вместо <code>count_documents</code>", "Считает на клиенте, вытянув документы", "<code>count_documents(filter)</code>"),
  ("Сортировка по полю без индекса на большой коллекции", "<code>Sort exceeded memory limit</code>", "Построить индекс по полю сортировки — глава 3.2"),
  ("<code>skip</code> на глубоких страницах ленты", "Чем дальше страница, тем медленнее ответ", "Листать якорем: <code>{ \"_id\" =&gt; { \"$gt\" =&gt; последний } }</code>"),
 ],
},
"07-obnovlenie": {
 "python": [
  ("<code>update_one({...}, {\"price\": 100})</code>", "<code>ValueError: update only works with $ operators</code>", "<code>{\"$set\": {\"price\": 100}}</code>"),
  ("<code>{\"$set\": {\"payment\": {\"paid\": True}}}</code>", "Вложенный документ заменён целиком, остальные его поля потеряны", "<code>{\"$set\": {\"payment.paid\": True}}</code>"),
  ("Проверка результата по <code>modified_count</code>", "«Не найдено» при сохранении без изменений", "Проверять <code>matched_count</code>"),
  ("<code>update_many({}, {...})</code>", "Изменены все документы коллекции", "Пустой фильтр — только осознанно; сначала <code>count_documents</code>"),
  ("Прочитать, прибавить в коде, записать", "При одновременной работе изменения теряются", "<code>$inc</code> — сервер выполнит это неделимо"),
 ],
 "cpp": [
  ("Обновление без оператора", "<code>Invalid key 'price': update only works with $ operators and pipelines</code>", "Оборачивать в <code>kvp(\"$set\", …)</code>"),
  ("<code>kvp(\"$set\", make_document(kvp(\"payment\", …)))</code>", "Вложенный документ заменён целиком, остальные его поля потеряны", "Путь через точку: <code>kvp(\"payment.paid\", true)</code>"),
  ("Проверка результата по <code>modified_count()</code>", "«Не найдено» при сохранении без изменений", "Проверять <code>matched_count()</code>"),
  ("<code>update_many(make_document(), …)</code>", "Изменены все документы коллекции", "Пустой фильтр — только осознанно; сначала <code>count_documents</code>"),
  ("Прочитать, прибавить в коде, записать", "При одновременной работе изменения теряются", "<code>$inc</code> — сервер выполнит это неделимо"),
 ],
 "go": [
  ("<code>UpdateOne(ctx, filter, bson.D{{\"price\", 100}})</code>", "<code>update document must contain key beginning with '$'</code>", "<code>bson.D{{\"$set\", bson.D{{\"price\", 100}}}}</code>"),
  ("<code>$set</code> со вложенным документом целиком", "Вложенный документ заменён, остальные его поля потеряны", "Путь через точку: <code>{Key: \"payment.paid\", Value: true}</code>"),
  ("Проверка результата по <code>ModifiedCount</code>", "«Не найдено» при сохранении без изменений", "Проверять <code>MatchedCount</code>"),
  ("<code>UpdateMany(ctx, bson.D{}, …)</code>", "Изменены все документы коллекции", "Пустой фильтр — только осознанно; сначала <code>CountDocuments</code>"),
  ("Прочитать, прибавить в коде, записать", "При одновременной работе изменения теряются", "<code>$inc</code> — сервер выполнит это неделимо"),
 ],
 "ruby": [
  ("<code>update_one(filter, { \"price\" =&gt; 100 })</code>", "<code>WARN: Invalid update document provided. Updates documents must contain only atomic modifiers</code>", "<code>{ \"$set\" =&gt; { \"price\" =&gt; 100 } }</code>"),
  ("<code>$set</code> со вложенным документом целиком", "Вложенный документ заменён, остальные его поля потеряны", "Путь через точку: <code>\"payment.paid\" =&gt; true</code>"),
  ("Проверка результата по <code>modified_count</code>", "«Не найдено» при сохранении без изменений", "Проверять <code>matched_count</code>"),
  ("<code>update_many({}, …)</code>", "Изменены все документы коллекции", "Пустой фильтр — только осознанно; сначала <code>count_documents</code>"),
  ("Прочитать, прибавить в коде, записать", "При одновременной работе изменения теряются", "<code>$inc</code> — сервер выполнит это неделимо"),
 ],
},
"08-udalenie": {
 "python": [
  ("<code>delete_many({})</code> вместо <code>delete_one</code>", "Коллекция пуста. Отменить нельзя", "Пустой фильтр — только осознанно, при перезаливке"),
  ("<code>delete_one(query)</code> в цикле по списку", "Медленно: обращение к серверу на каждый документ", "Один <code>delete_many({\"_id\": {\"$in\": ids}})</code>"),
  ("Результат не проверяется", "Пользователю сказано «удалено», хотя <code>deleted_count</code> равен нулю", "Проверять <code>deleted_count</code> и отвечать честно"),
  ("Прочитать, потом удалить двумя запросами", "Между запросами документ мог измениться — в архив уедет не то", "<code>find_one_and_delete</code>"),
  ("<code>drop()</code> на коллекции с индексами", "Индексы и правила проверки исчезли вместе с коллекцией", "<code>delete_many({})</code>, если нужно сохранить настройки"),
 ],
 "cpp": [
  ("<code>delete_many(make_document())</code> вместо <code>delete_one</code>", "Коллекция пуста. Отменить нельзя", "Пустой фильтр — только осознанно, при перезаливке"),
  ("<code>delete_one</code> в цикле по списку", "Медленно: обращение к серверу на каждый документ", "Один <code>delete_many</code> с <code>$in</code>"),
  ("Результат не проверен на пустоту", "Разыменование пустого <code>optional</code> вместо честного ответа", "<code>if (res) res-&gt;deleted_count()</code>"),
  ("Прочитать, потом удалить двумя запросами", "Между запросами документ мог измениться — в архив уедет не то", "<code>find_one_and_delete</code>"),
  ("<code>drop()</code> на коллекции с индексами", "Индексы и правила проверки исчезли вместе с коллекцией", "<code>delete_many(make_document())</code>, если нужно сохранить настройки"),
 ],
 "go": [
  ("<code>DeleteMany(ctx, bson.D{})</code> вместо <code>DeleteOne</code>", "Коллекция пуста. Отменить нельзя", "Пустой фильтр — только осознанно, при перезаливке"),
  ("<code>DeleteOne</code> в цикле по срезу", "Медленно: обращение к серверу на каждый документ", "Один <code>DeleteMany</code> с <code>$in</code>"),
  ("<code>DeletedCount</code> не проверен", "Пользователю сказано «удалено», хотя не удалилось ничего", "Проверять <code>res.DeletedCount</code> и отвечать честно"),
  ("<code>FindOneAndDelete</code> без проверки <code>ErrNoDocuments</code>", "Пустая структура принимается за удалённый документ", "Сравнить ошибку с <code>mongo.ErrNoDocuments</code>"),
  ("<code>Drop(ctx)</code> на коллекции с индексами", "Индексы и правила проверки исчезли вместе с коллекцией", "<code>DeleteMany(ctx, bson.D{})</code>, если нужно сохранить настройки"),
 ],
 "ruby": [
  ("<code>delete_many({})</code> вместо <code>delete_one</code>", "Коллекция пуста. Отменить нельзя", "Пустой фильтр — только осознанно, при перезаливке"),
  ("<code>delete_one</code> в цикле по массиву", "Медленно: обращение к серверу на каждый документ", "Один <code>delete_many({ \"_id\" =&gt; { \"$in\" =&gt; ids } })</code>"),
  ("Результат не проверяется", "Пользователю сказано «удалено», хотя <code>deleted_count</code> равен нулю", "Проверять <code>deleted_count</code> и отвечать честно"),
  ("<code>find_one_and_delete</code> без проверки на <code>nil</code>", "<code>NoMethodError</code> при обращении к полям", "Проверять результат до чтения полей"),
  ("<code>drop</code> на коллекции с индексами", "Индексы и правила проверки исчезли вместе с коллекцией", "<code>delete_many({})</code>, если нужно сохранить настройки"),
 ],
},
}


def render(chapter, rows, lang, indent=8):
    pad = " " * indent
    head = HEADERS.get(chapter, DEFAULT_HEADER)
    out = [f'{pad}<div class="table-scroll errors-table" data-lang="{lang}">',
           f'{pad}  <table>',
           f'{pad}    <thead><tr><th>{head[0]}</th><th>{head[1]}</th><th>{head[2]}</th></tr></thead>',
           f'{pad}    <tbody>']
    for first, second, third in rows:
        out.append(f'{pad}      <tr><td>{first}</td><td>{second}</td><td>{third}</td></tr>')
    out += [f'{pad}    </tbody>', f'{pad}  </table>', f'{pad}</div>']
    return "\n".join(out)


def main():
    for chapter, by_lang in TABLES.items():
        path = BOOK / "temy" / chapter / "index.html"
        text = path.read_text()
        match = re.search(r'[ ]{8}<div class="table-scroll errors-table">.*?\n[ ]{8}</div>\n', text, re.S)
        if not match:
            print(f"{chapter}: таблица ошибок не найдена — пропущена")
            continue
        block = "\n".join(render(chapter, by_lang[lang], lang) for lang in ORDER) + "\n"
        path.write_text(text[:match.start()] + block + text[match.end():])
        print(f"{chapter}: таблица ошибок переведена на четыре языка")


if __name__ == "__main__":
    main()
