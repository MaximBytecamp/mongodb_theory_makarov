"""Скелет новой главы: шапка, паспорт, runbox и подвал берутся у готовой главы.

    python3 tools/make_chapter.py 2.9 18-skript-podbor тело.html

Файл с телом начинается с блока метаданных до строки «---»:

    title:    заголовок (первая строка h1 и <title>)
    h1b:      вторая строка h1 после <br>
    lead:     вводный абзац
    related:  связанные темы
    why:      «зачем это знать»
    writes:   да | нет — меняет ли глава данные
    prev:     href|текст
    next:     href|текст
    contents: пункт ;; пункт ;; …

Дальше идёт готовый HTML разделов главы.
"""

import pathlib
import re
import sys

BOOK = pathlib.Path(__file__).resolve().parent.parent
SAMPLE = BOOK / "temy/09-filtr-i-tochechnaya-notaciya/index.html"


def build(num: str, folder: str, body_file: str) -> pathlib.Path:
    raw = pathlib.Path(body_file).read_text()
    meta_text, body = raw.split("\n---\n", 1)
    meta = {}
    for line in meta_text.strip().splitlines():
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()

    src = SAMPLE.read_text()
    head = src[:src.index('<header class="chapter-head">')]
    runbox = src[src.index('<div class="runbox">'):src.index('<nav class="contents">')]
    tail = src[src.index("      </main>"):]

    u = num.replace(".", "_")
    head = head.replace("<title>2.1 Фильтр — это документ. Точечная нотация",
                        f"<title>{num} {meta['title']} {meta['h1b']}")
    head = head.replace('<p class="running__folio">2.1</p>', f'<p class="running__folio">{num}</p>')
    head = head.replace("· модуль 2 · язык фильтров",
                        "· модуль 1 · подключение и первые данные" if num.startswith("1.")
                        else "· модуль 2 · язык фильтров")
    runbox = runbox.replace("2_1", u).replace("glava-2.1", f"glava-{num}")
    runbox = re.sub(r'[ \t]*<div class="runbox__row"><b>Архив</b>.*?</div>\n', "", runbox, flags=re.S)
    if meta.get("writes") == "да":
        runbox = runbox.replace(
            "<span>Глава только читает данные — сбрасывать базы не нужно.</span>",
            '<span>Глава меняет песочницу. Перед началом верните базы в исходное состояние: '
            '<code>docker compose run --rm reset</code> или скрипт из '
            '<a href="../00-uchebnye-bazy/index.html#s6">главы 1.0, §6</a>.</span>')

    items = [x.strip() for x in meta["contents"].split(";;")]
    contents = "\n".join(f'            <li><a href="#s{i}">{t}</a></li>' for i, t in enumerate(items, 1))
    prev_href, prev_text = meta["prev"].split("|")
    next_href, next_text = meta["next"].split("|")

    page = (head + f'''<header class="chapter-head">
          <span class="chapter-num">{num}</span>
          <h1>{meta['title']}<br>{meta['h1b']}</h1>
          <p class="lead">{meta['lead']}</p>
        </header>

        <dl class="passport">
          <div><dt>Категория</dt><dd>{meta.get('kind', 'Язык запросов')}</dd></div>
          <div><dt>Уровень</dt><dd>{meta.get('level', 'Начальный')}</dd></div>
          <div><dt>Связанные темы</dt><dd>{meta['related']}</dd></div>
          <div><dt>Зачем это знать</dt><dd>{meta['why']}</dd></div>
        </dl>

        ''' + runbox + f'''<nav class="contents">
          <b>В этой главе</b>
          <ol>
{contents}
          </ol>
        </nav>

''' + body.strip("\n") + f'''

        <div class="pager"><a href="{prev_href}">{prev_text}</a><a href="{next_href}">{next_text}</a></div>

        <div class="colophon">
          <span>Глава {num} · Справочник по MongoDB</span>
          <span class="author-line">Автор: Макаров Максим Николаевич</span>
        </div>
''' + tail)

    out = BOOK / "temy" / folder / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page)
    return out


if __name__ == "__main__":
    print("записано", build(sys.argv[1], sys.argv[2], sys.argv[3]))
