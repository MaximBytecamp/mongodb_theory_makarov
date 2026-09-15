"""Архивы примеров для скачивания: по одному на главу и язык.

В архиве всё, чтобы запустить примеры главы без репозитория mongodb-practice:
каждый пример — готовая программа, стенд в Docker, учебные данные и README.md
с запуском в Docker или на установленном сервере с Compass и ожидаемыми выводами.

    python3 tools/archives.py build             # архивы в temy/<глава>/primery/ и ссылки в главах
    python3 tools/archives.py verify python 1.4 # распаковать и прогнать архивы на стенде
    python3 tools/archives.py verify all        # все главы, все языки

Программы и выводы берутся из tools/examples.py: сначала там `run` и `report`,
потом здесь `build`.
"""

import html
import io
import json
import pathlib
import re
import shutil
import subprocess
import sys
import zipfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import examples as ex                                   # noqa: E402

BOOK = ex.BOOK
PRACTICE = ex.PRACTICE
LANGS = ["python", "ruby", "go", "cpp"]
TITLE = {"python": "Python", "ruby": "Ruby", "go": "Go", "cpp": "C++"}
DRIVER = {"python": "PyMongo", "ruby": "gem mongo 2.21", "go": "mongo-driver v2", "cpp": "mongocxx 4.5"}
STAMP = (2026, 9, 1, 0, 0, 0)                           # одна дата у всех файлов: архив не меняется без причины
SCRATCH = pathlib.Path("/private/tmp/mongodb-archives-verify")


def archive_name(chapter: str, lang: str) -> str:
    return f"mongodb-glava-{chapter}-{lang}"


# ── Примеры главы ─────────────────────────────────────────────────────────

H2 = re.compile(r'<h2 id="s\d+"><span class="sec">(§\d+)</span>(.*?)</h2>', re.S)


def captions(chapter: str, lang: str) -> list[dict]:
    """Для каждого примера языка: параграф и подпись к коду — в порядке главы."""
    page = (BOOK / "temy" / ex.CHAPTERS[chapter][0] / "index.html").read_text()
    start = page.index("<main")
    heads = [(m.start(), m.group(1), ex.text(m.group(2)).strip()) for m in H2.finditer(page, start)]
    items = []
    for m in ex.FIG.finditer(page, start):
        attrs = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(2)))
        if attrs.get("run") == "no" or "out" in m.group(1) or attrs.get("lang") != lang:
            continue
        spans = re.findall(r"<span>(.*?)</span>", m.group(3), re.S)
        caption = ex.text(spans[-1]).strip() if len(spans) > 1 else ""
        sec = [h for h in heads if h[0] < m.start()]
        items.append({"sec": sec[-1][1] if sec else "", "section": sec[-1][2] if sec else "", "caption": caption})
    return items


def strip_head(program: str, lang: str) -> str:
    """Убрать шапку заготовки: она объясняет, куда вставлять пример, а здесь он уже вставлен."""
    if lang == "python":
        return re.sub(r'\A""".*?"""\n+', "", program, count=1, flags=re.S)
    mark = "#" if lang == "ruby" else "//"
    lines = program.splitlines(keepends=True)
    i = 0
    while i < len(lines) and lines[i].startswith(mark):
        i += 1
    if i:
        while i < len(lines) and not lines[i].strip():
            i += 1
    return "".join(lines[i:])


def direct_run(lang: str, name: str) -> list[str]:
    if lang == "python":
        return [f"cd primery, затем python {name} (Windows) или python3 {name} (macOS, Linux)"]
    if lang == "ruby":
        return [f"cd primery, затем ruby {name}"]
    if lang == "go":
        return [f"cd primery, затем go run {name}"]
    return [f"cd primery, затем g++ -std=c++17 {name} -o prog $(pkg-config --cflags --libs libmongocxx1) && ./prog",
            "(так — на macOS с драйвером из Homebrew; на Windows и Linux — только в Docker)"]


def examples_of(chapter: str, lang: str) -> list[dict]:
    """Примеры главы готовыми программами, с подписями и ожидаемым выводом."""
    title = ex.CHAPTERS[chapter][1]
    caps = captions(chapter, lang)
    results = ex.load_results()[chapter][lang]
    plan = ex.programs(chapter, lang)
    out = []
    for index, (n, mode, program) in enumerate(plan, 1):
        if lang == "go" and chapter == "1.1":
            program = program.replace("package main\n", ex.GO_BARE_IMPORTS, 1)
        program = strip_head(program, lang)
        name = f"{index:02d}.{ex.EXT[lang]}"
        cap = caps[n - 1]
        joined = [caps[i - 1]["caption"] for i in ex.CONTINUES.get((chapter, n), [])]
        run_ = results[str(n)]
        note = [f"Глава {chapter} · {title}",
                f"Пример {index} из {len(plan)} · {cap['sec']} {cap['section']} · {cap['caption']}"]
        if joined:
            note.append(f"В начале — код из блока «{joined[0]}»: в главе он стоит прямо перед этим примером.")
        note += ["", "Запуск из папки архива:",
                 f"  docker compose run --rm {lang} primery/{name}",
                 *["  " + line for line in direct_run(lang, name)],
                 "Что должно получиться — в README.md, раздел «Примеры и выводы»."]
        mark = "# " if lang in ("python", "ruby") else "// "
        head = "\n".join((mark + line).rstrip() for line in note) + "\n\n"
        if lang == "go":
            # Каждый файл — отдельная программа со своим main. Метка ignore не даёт
            # редактору склеивать их в один пакет; go run 01.go она не мешает.
            head = "//go:build ignore\n\n" + head
        out.append({"index": index, "name": name, "code": head + program, "mode": mode,
                    "exit": run_["exit"], "shown": ex.shown(lang, run_), "joined": joined, **cap})
    return out


# ── Файлы стенда ──────────────────────────────────────────────────────────

def compose(chapter: str, lang: str) -> str:
    src = (PRACTICE / "compose.yaml").read_text()
    seed = src[src.index("x-seed: &seed"):src.index("x-runner: &runner")].rstrip() + "\n"
    extra_volume = "\n      - go-modules:/go/pkg/mod" if lang == "go" else ""
    volumes = "volumes:\n  mongo-data:\n" + ("  go-modules:\n" if lang == "go" else "")
    first = "первая сборка образа идёт несколько минут: драйвер C++ собирается из исходников" if lang == "cpp" \
        else "при первом запуске Docker соберёт образ с драйвером — это пара минут"
    return f'''# Стенд для примеров главы {chapter} на {TITLE[lang]}: сервер MongoDB 7, учебные базы,
# mongo-express и контейнер с драйвером. Подробно — в README.md.
#
# Команды одинаковые в PowerShell, cmd и терминале macOS/Linux. Запускать из этой папки.
#
#   {"docker compose up -d":<48} сервер + учебные базы + mongo-express
#   {f"docker compose run --rm {lang} primery/01.{ex.EXT[lang]}":<48} один пример
#   {f"docker compose run --rm {lang} primery":<48} все примеры по порядку
#   {"docker compose run --rm reset":<48} вернуть базы в исходное состояние
#   {"docker compose down":<48} остановить (данные остаются)
#
# Если порт 27017 или 8081 уже занят: MONGO_PORT=27018 или EXPRESS_PORT=8082
# в файле .env рядом с этим файлом.

# Имя общее у архивов всех глав: сервер и данные одни, какую главу ни открыть.
name: mongodb-primery

{seed}
services:
  mongo:
    image: mongo:7
    ports:
      - "${{MONGO_PORT:-27017}}:27017"
      # mongo-express работает в сети этого контейнера, поэтому его порт публикуется здесь
      - "127.0.0.1:${{EXPRESS_PORT:-8081}}:8081"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 5s
      timeout: 5s
      retries: 12

  # Заливает учебные базы, если сервер пустой, и завершается.
  seed:
    <<: *seed

  # То же, но перезаписывает базы всегда.
  reset:
    <<: *seed
    profiles: ["tools"]
    environment:
      FORCE: "1"

  # Данные в браузере вместо Compass: http://localhost:8081, логин student, пароль student.
  mongo-express:
    image: mongo-express:1.0.2
    depends_on:
      mongo:
        condition: service_healthy
    network_mode: "service:mongo"
    restart: unless-stopped
    environment:
      # 127.0.0.1, а не localhost: Node.js 18 сначала пробует IPv6 ::1, а сервер слушает IPv4
      ME_CONFIG_MONGODB_URL: mongodb://127.0.0.1:27017/
      ME_CONFIG_BASICAUTH_ENABLED: "true"
      ME_CONFIG_BASICAUTH_USERNAME: student
      ME_CONFIG_BASICAUTH_PASSWORD: student

  # Запуск примеров; {first}.
  # Контейнер подключён к сети сервера: MongoDB в нём доступна по mongodb://localhost:27017.
  {lang}:
    profiles: ["tools"]
    build: {{ context: ., dockerfile: docker/{lang}.Dockerfile }}
    image: mongodb-practice/{lang}
    depends_on:
      seed:
        condition: service_completed_successfully
    network_mode: "service:mongo"
    volumes:
      - .:/work{extra_volume}
    working_dir: /work
    entrypoint: ["sh", "/work/docker/run.sh"]

{volumes}'''


RUN_SH = r'''#!/bin/sh
# Запускает пример из его папки. Чем запускать, решает расширение.
#
#   run primery/03.py        один пример
#   run primery              все примеры папки по порядку
#   run primery\03.go        обратные слэши из PowerShell тоже годятся

set -e

if [ $# -eq 0 ]; then
  echo "Укажите файл, например: docker compose run --rm python primery/01.py" >&2
  exit 2
fi

target=$(printf '%s' "$1" | tr '\\' '/' | sed 's#^\./##; s#/$##')
shift

if [ -d "/work/$target" ]; then
  found=0
  for file in "/work/$target"/*.py "/work/$target"/*.rb "/work/$target"/*.go "/work/$target"/*.cpp; do
    [ -f "$file" ] || continue
    found=1
    name=${file#/work/}
    printf '\n── %s ──\n' "$name"
    code=0
    sh /work/docker/run.sh "$name" || code=$?
    [ "$code" -eq 0 ] || printf '(программа завершилась с ошибкой, код %s)\n' "$code"
  done
  [ "$found" -eq 1 ] || { echo "В папке $target нет программ" >&2; exit 2; }
  exit 0
fi

if [ ! -f "/work/$target" ]; then
  echo "Файл не найден: $target (путь считается от папки архива)" >&2
  exit 2
fi

cd "/work/$(dirname "$target")"
file=$(basename "$target")

case "$file" in
  *.py)
    exec python "$file" "$@" ;;
  *.rb)
    exec ruby "$file" "$@" ;;
  *.go)
    exec go run "$file" "$@" ;;
  *.cpp)
    binary="/tmp/${file%.cpp}"
    driver=$(pkg-config --list-all | awk '/^libmongocxx/ { print $1; exit }')
    # shellcheck disable=SC2046
    g++ -std=c++17 "$file" -o "$binary" $(pkg-config --cflags --libs "$driver")
    exec "$binary" "$@" ;;
  *)
    echo "Не знаю, чем запускать $file: нужен .py, .rb, .go или .cpp" >&2
    exit 2 ;;
esac
'''


# ── README ────────────────────────────────────────────────────────────────

def readme(chapter: str, lang: str, items: list[dict]) -> str:
    slug, title, writes = ex.CHAPTERS[chapter]
    ext = ex.EXT[lang]
    name = archive_name(chapter, lang)
    url = f"https://maximbytecamp.github.io/mongodb_theory_makarov/temy/{slug}/index.html"
    L = TITLE[lang]

    state = ("Глава **меняет песочницу** — базу `sandbox`. Перед первым примером верните базы "
             "в исходное состояние, иначе числа в выводах разойдутся с книгой. Команда сброса — "
             "в описании способа, которым вы пользуетесь."
             if writes else
             "Глава **только читает** данные — сбрасывать базы не нужно.")

    if lang == "python":
        driver_files = "requirements.txt  драйвер PyMongo для pip и для образа Docker\n"
    elif lang == "go":
        driver_files = ""
    else:
        driver_files = ""
    go_files = "    go.mod, go.sum  модуль Go: версия драйвера\n" if lang == "go" else ""

    tree = (f"{name}/\n"
            f"  README.md         эта инструкция\n"
            f"  primery/          примеры главы — по программе на пример\n"
            f"    01.{ext} … {len(items):02d}.{ext}\n"
            f"{go_files}"
            f"  compose.yaml      стенд в Docker: сервер, базы, mongo-express, {L}\n"
            f"  docker/           образ с драйвером {L} и скрипт запуска run.sh\n"
            f"  stend/seed/       учебные данные: 12 файлов JSON\n"
            f"  stend/load.ps1    загрузка данных на установленный сервер — Windows\n"
            f"  stend/load.sh     то же — macOS и Linux\n"
            f"{driver_files}")

    table = "\n".join(f"| `{it['name']}` | {it['sec']} {it['section']} | {it['caption']} |" for it in items)

    reset_docker = ("\n2. Вернуть базы в исходное состояние — глава меняет песочницу:\n\n"
                    "   ```bash\n   docker compose run --rm reset\n   ```\n" if writes else "")
    n = 3 if writes else 2

    # ── Способ 2: драйвер и запуск на своём компьютере
    if lang == "python":
        install = """Python 3.10 или новее — с [python.org](https://www.python.org/downloads/). На Windows в установщике
отметьте **Add python.exe to PATH**.

Windows, PowerShell, из папки архива:

```powershell
python -m pip install -r requirements.txt
cd primery
python 01.py
```

macOS и Linux — драйвер ставится в виртуальное окружение: системный Python не даёт ставить пакеты напрямую.

```bash
python3 -m venv .venv
source .venv/bin/activate          # в каждом новом терминале снова
pip install -r requirements.txt
cd primery
python3 01.py
```

Если `venv` не найден на Linux: `sudo apt install python3-venv`."""
    elif lang == "ruby":
        install = """Ruby 3.3. На Windows — с [rubyinstaller.org](https://rubyinstaller.org/downloads/), сборка
**with Devkit**: драйверу нужен компилятор для расширения `bson`. На последнем экране установщика оставьте
галочку **Run 'ridk install'** и в окне MSYS2 выберите пункт 3.

Windows, PowerShell:

```powershell
gem install mongo -v 2.21.0
cd primery
ruby 01.rb
```

macOS и Linux (на Linux сначала `sudo apt install ruby-full build-essential`):

```bash
gem install --user-install mongo -v 2.21.0
cd primery
ruby 01.rb
```"""
    elif lang == "go":
        install = """Go 1.25 или новее — с [go.dev/dl](https://go.dev/dl/). Отдельно драйвер ставить не нужно:
в папке `primery` лежит `go.mod`, и Go скачает драйвер сам при первом запуске.

Команды одинаковые во всех системах:

```bash
cd primery
go mod download
go run 01.go
```

Каждый файл — отдельная программа со своей функцией `main`, поэтому запускается по имени файла: `go run 01.go`.
Команда `go run .` здесь не подходит. Первая строка файлов `//go:build ignore` нужна, чтобы редактор
не считал все файлы одной программой, — запуску она не мешает."""
    else:
        install = """Драйвер C++ на Windows и Linux собирается из исходников долго и с зависимостями, поэтому
там примеры запускаются **только в Docker** — способ 1. Если сервер MongoDB уже установлен и занимает порт
27017, остановите службу MongoDB или перед `docker compose up -d` создайте файл `.env` (см. «Частые ошибки»).

На macOS драйвер ставится из Homebrew:

```bash
brew install mongo-cxx-driver
cd primery
g++ -std=c++17 01.cpp -o prog $(pkg-config --cflags --libs libmongocxx1) && ./prog
```"""

    load = """Windows, PowerShell, из папки архива — нужен `mongoimport` из MongoDB Command Line Database Tools:

```powershell
powershell -ExecutionPolicy Bypass -File stend\\load.ps1
```

macOS и Linux (`mongoimport`: `brew tap mongodb/brew && brew install mongodb-database-tools`):

```bash
bash stend/load.sh
```

Скрипт пересоздаёт коллекции целиком, поэтому он же сбрасывает базы: повторный запуск ничего не двоит.

**Без `mongoimport` — через Compass.** Подключитесь к `mongodb://localhost:27017`, нажмите **Create database**,
затем в коллекции **Add data → Import JSON or CSV file** и выберите файл из `stend/seed`. Имя файла
подсказывает, куда класть: `shop.orders.json` — база `shop`, коллекция `orders`. Так загружаются все
12 файлов; пошагово с кадрами — [глава 1.0, §7](https://maximbytecamp.github.io/mongodb_theory_makarov/temy/00-uchebnye-bazy/index.html#s7)."""
    if writes:
        load += """

**Сброс в Compass.** Главы меняют только песочницу, поэтому достаточно пересоздать её: у базы `sandbox`
в левой панели нажмите **⋯ → Drop database**, затем создайте базу `sandbox` заново и импортируйте в неё
`sandbox.products.json` (коллекция `products`) и `sandbox.warehouse.json` (коллекция `warehouse`).
Импорт в непустую коллекцию документы не заменяет — поэтому сначала удаление."""

    outputs = []
    for it in items:
        lines = [f"### {it['name']} · {it['sec']} {it['section']}", "", f"{it['caption'][:1].upper()}{it['caption'][1:]}."]
        if it["joined"]:
            lines.append(f"В начале программы — код из блока «{it['joined'][0]}»: в главе он стоит прямо перед этим примером.")
        if it["mode"] == "compile":
            lines.append("Программа ничего не печатает: пример показывает, как устроить код, и только объявляет функцию.")
        elif it["exit"]:
            lines.append("Пример заканчивается ошибкой — так и задумано: глава разбирает, как она выглядит. "
                         "Ниже — вывод и последняя строка сообщения об ошибке.")
        body = it["shown"].strip("\n")
        if body:
            lines += ["", "```text", body, "```"]
        elif it["mode"] != "compile":
            lines.append("Вывода нет.")
        outputs.append("\n".join(lines))

    return f"""# Глава {chapter} · {title} — примеры на {L}

Архив к «Справочнику по MongoDB»: все примеры главы готовыми программами, учебные базы и стенд в Docker.
Глава: {url}

Язык: **{L}** · драйвер {DRIVER[lang]} · сервер MongoDB 7.

## Что в архиве

```text
{tree}```

## Порядок работы

1. **Базы.** {state}
2. **Примеры — по порядку, каждый один раз.** Пример в главе рассчитан на данные, которые оставил
   предыдущий. Если запустить пример дважды или пропустить, числа разойдутся с книгой — тогда
   сбросьте базы и начните с `01.{ext}`.
3. **Сверка.** Что должна напечатать каждая программа — в разделе «Примеры и выводы» ниже.
   Отличаться могут только `_id`, которые выдаёт сервер, текущие дата и время и порядок
   в списке коллекций: сервер отдаёт их имена в произвольном порядке. У документа, который
   создан обновлением с `upsert`, поля тоже могут идти в другом порядке — значения при этом те же.

Подойдёт любой из двух способов. Адрес сервера в обоих — `mongodb://localhost:27017`, код примеров
одинаковый.

| Способ | Что нужно | Когда подходит |
|---|---|---|
| **1. Docker** | Docker Desktop | Compass и сервер не установились или не подключаются; ничего, кроме Docker, ставить не нужно |
| **2. Сервер и Compass** | MongoDB Server, Compass, {L} с драйвером | сервер и Compass уже стоят и подключаются |

## Способ 1. Docker

Docker Desktop — с [docker.com](https://www.docker.com/products/docker-desktop/); на Linux — Docker Engine.
Перед командами Docker Desktop должен быть запущен. Команды одинаковые в PowerShell, cmd и терминале
macOS/Linux; выполняйте их **из папки архива** — там, где лежит `compose.yaml`.

1. Поднять сервер и загрузить учебные базы:

   ```bash
   docker compose up -d
   ```
{reset_docker}
{n}. Запустить пример — путь к файлу пишется от папки архива:

   ```bash
   docker compose run --rm {lang} primery/01.{ext}
   ```

   При первом запуске Docker соберёт образ с драйвером {L}{" — это несколько минут: драйвер C++ собирается из исходников" if lang == "cpp" else " — это пара минут"}.
   Дальше запуск идёт за секунды.

{n + 1}. Все примеры главы подряд, по порядку, одной командой:

   ```bash
   docker compose run --rm {lang} primery
   ```

   Перед каждой программой печатается её имя: `── primery/01.{ext} ──`.

**Смотреть данные.** Compass не нужен: в браузере откройте http://localhost:8081, логин `student`,
пароль `student` — это mongo-express, в нём видны базы, коллекции и документы. Если Compass
установлен, он подключается к этому же серверу по адресу `mongodb://localhost:27017`.

**Консоль сервера:** `docker compose exec mongo mongosh`.

**Остановить и удалить:**

```bash
docker compose stop        # остановить; данные останутся
docker compose down        # удалить контейнеры; данные останутся
docker compose down -v     # удалить всё вместе с данными
```

Архивы всех глав пользуются одним и тем же сервером и данными: после этой главы можно распаковать
архив следующей и работать там, не удаляя стенд.

## Способ 2. Установленный сервер MongoDB и Compass

Нужны MongoDB Server 7 или 8 и MongoDB Compass — установка по шагам в
[главе 1.0а](https://maximbytecamp.github.io/mongodb_theory_makarov/temy/00a-windows-10-mongodb-7/index.html).
Проверка: Compass подключается к `mongodb://localhost:27017`.

### Шаг 1. Загрузить учебные базы

{load}

После загрузки в Compass нажмите **Refresh**: в списке должны быть базы `shop`, `hh`, `logs`, `org`
и `sandbox`. В `shop.products` — 21 документ, в `shop.orders` — 120.

### Шаг 2. Драйвер {L} и запуск

{install}

Остальные примеры запускаются так же: `02.{ext}`, `03.{ext}` и далее. Если сервер слушает другой адрес,
задайте его переменной `MONGO_URI` — программы глав 1.2–1.8 читают её при подключении.

## Примеры и выводы

| Файл | Параграф главы | Что делает |
|---|---|---|
{table}

{chr(10).join(chr(10) + o for o in outputs).lstrip(chr(10))}

## Частые ошибки

| Что видно | Причина | Что сделать |
|---|---|---|
| `port is already allocated`, `address already in use` на `docker compose up -d` | порт 27017 занят: уже работает установленный MongoDB или стенд `mongodb-practice` | остановите тот сервер или создайте рядом с `compose.yaml` файл `.env` со строкой `MONGO_PORT=27018`: в PowerShell — `Set-Content .env "MONGO_PORT=27018"`, в bash — `echo "MONGO_PORT=27018" > .env`. Программы в Docker это не затрагивает, Compass подключайте к `localhost:27018` |
| `Cannot connect to the Docker daemon`, `error during connect` | Docker Desktop не запущен | запустите Docker Desktop и дождитесь зелёного статуса Engine running |
| `ServerSelectionTimeoutError`, `Connection refused`, `No server available` | сервер не запущен | Docker: `docker compose up -d`; способ 2 — запустите службу MongoDB |
| `Файл не найден: …` | путь написан не от папки архива или команда выполнена в другой папке | перейдите в папку, где лежит `compose.yaml`, и пишите путь `primery/01.{ext}` |
| числа в выводе не совпадают с README | пример запускали дважды, пропустили или базы не сброшены | сбросьте базы и запустите примеры с первого по порядку |

В PowerShell не используйте `echo … > .env`: Windows PowerShell 5 пишет такой файл в UTF-16, и Docker
Compose его не прочитает.
"""


# ── Сборка ────────────────────────────────────────────────────────────────

def files_for(chapter: str, lang: str) -> dict[str, bytes]:
    items = examples_of(chapter, lang)
    files: dict[str, bytes] = {}
    for it in items:
        files[f"primery/{it['name']}"] = it["code"].encode()
    if lang == "go":
        for name in ("go.mod", "go.sum"):
            files[f"primery/{name}"] = (PRACTICE / "lessons" / name).read_bytes()
    if lang == "python":
        files["requirements.txt"] = (PRACTICE / "requirements.txt").read_bytes()
    files["compose.yaml"] = compose(chapter, lang).encode()
    files[f"docker/{lang}.Dockerfile"] = (PRACTICE / "docker" / f"{lang}.Dockerfile").read_bytes()
    files["docker/run.sh"] = RUN_SH.encode()
    for path in sorted((PRACTICE / "stend" / "seed").glob("*.json")):
        files[f"stend/seed/{path.name}"] = path.read_bytes()
    load_sh = (PRACTICE / "stend" / "load.sh").read_text().replace(
        "course-mongo|hh-mongo", "mongodb-primery-mongo-1|course-mongo|hh-mongo")
    files["stend/load.sh"] = load_sh.encode()
    files["stend/load.ps1"] = (PRACTICE / "stend" / "load.ps1").read_bytes()
    files["README.md"] = readme(chapter, lang, items).encode()
    return files


def pack(chapter: str, lang: str) -> bytes:
    root = archive_name(chapter, lang)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path, data in sorted(files_for(chapter, lang).items()):
            info = zipfile.ZipInfo(f"{root}/{path}", date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o755 if path.endswith(".sh") else 0o644) << 16
            archive.writestr(info, data)
    return buffer.getvalue()


ROW = re.compile(r'\n *<div class="runbox__row"><b>Архив</b>.*?</div>')


def link_row(chapter: str, sizes: dict[str, int]) -> str:
    links = "".join(
        f'<span data-lang="{lang}"><a href="primery/{archive_name(chapter, lang)}.zip" download>'
        f'<code>{archive_name(chapter, lang)}.zip</code></a>, {max(1, round(sizes[lang] / 1024))} КБ</span>'
        for lang in LANGS)
    return (f'          <div class="runbox__row"><b>Архив</b><span>{links} — все примеры главы готовыми '
            f'программами, учебные базы и стенд в Docker. В <code>README.md</code> — запуск в Docker, '
            f'если Compass нет или он не подключается, и на установленном сервере с Compass, '
            f'а также что должна напечатать каждая программа.</span></div>')


def build(chapters: list[str]) -> None:
    for chapter in chapters:
        slug = ex.CHAPTERS[chapter][0]
        folder = BOOK / "temy" / slug / "primery"
        folder.mkdir(exist_ok=True)
        sizes = {}
        for lang in LANGS:
            data = pack(chapter, lang)
            (folder / f"{archive_name(chapter, lang)}.zip").write_bytes(data)
            sizes[lang] = len(data)
        page_path = BOOK / "temy" / slug / "index.html"
        page = ROW.sub("", page_path.read_text())
        anchor = re.search(r'\n *<div class="runbox__row"><b>Базы</b>.*?</div>', page)
        page = page[:anchor.end()] + "\n" + link_row(chapter, sizes) + page[anchor.end():]
        page_path.write_text(page)
        print(f"{chapter}: " + ", ".join(f"{lang} {sizes[lang] // 1024} КБ" for lang in LANGS))


# ── Проверка ──────────────────────────────────────────────────────────────

def verify(langs: list[str], chapters: list[str]) -> None:
    """Распаковать архив как студент и прогнать его программы стендом из самого архива."""
    SCRATCH.mkdir(parents=True, exist_ok=True)
    total_bad = 0
    for lang in langs:
        for chapter in chapters:
            name = archive_name(chapter, lang)
            zip_path = BOOK / "temy" / ex.CHAPTERS[chapter][0] / "primery" / f"{name}.zip"
            shutil.rmtree(SCRATCH / name, ignore_errors=True)
            with zipfile.ZipFile(zip_path) as archive:
                archive.extractall(SCRATCH)
            where = SCRATCH / name
            subprocess.run(["docker", "compose", "up", "-d", "--wait", "mongo"], cwd=where, capture_output=True)
            subprocess.run(["docker", "compose", "run", "--rm", "reset"], cwd=where, capture_output=True)
            ext = ex.EXT[lang]
            script = f'for f in primery/*.{ext}; do echo "@@@ $f"; sh docker/run.sh "$f" 2>"$f.err"; echo "@@@ exit=$?"; done'
            proc = subprocess.run(["docker", "compose", "run", "--rm", "-T", "--entrypoint", "sh", lang, "-c", script],
                                  cwd=where, capture_output=True, text=True, timeout=3600)
            chunks = re.split(r"^@@@ (primery/\S+)\n", proc.stdout, flags=re.M)[1:]
            got = {}
            for file, body in zip(chunks[0::2], chunks[1::2]):
                code = int(re.search(r"@@@ exit=(\d+)", body).group(1))
                err = (where / (file + ".err")).read_text(errors="replace")
                err = "\n".join(l for l in err.splitlines() if not l.startswith(("go: downloading", "go: finding")))
                got[pathlib.Path(file).name] = ex.shown(lang, {"exit": code, "stdout": re.sub(r"@@@ exit=\d+\s*$", "", body), "stderr": err})
            bad = []
            for it in examples_of(chapter, lang):
                fact = got.get(it["name"])
                if fact is None or ex.steady(ex.normalize(fact)) != ex.steady(ex.normalize(it["shown"])):
                    bad.append((it["name"], it["shown"], fact))
            total_bad += len(bad)
            print(f"{chapter} {lang:6s} программ {len(got):2d}, расхождений {len(bad)}", flush=True)
            for file, want, fact in bad:
                print(f"   {file}\n   ── README ──\n{want}\n   ── факт ──\n{fact}\n   ── stderr ──\n{proc.stderr[-800:]}")
    print("всего расхождений:", total_bad)


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "build"
    if command == "build":
        build(sys.argv[2:] or list(ex.CHAPTERS))
    elif command == "verify":
        langs = LANGS if len(sys.argv) < 3 or sys.argv[2] == "all" else sys.argv[2].split(",")
        verify(langs, sys.argv[3:] or list(ex.CHAPTERS))
    else:
        print(__doc__)
