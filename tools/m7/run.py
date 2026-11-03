"""Модуль 7: запросы глав в mongosh и их настоящие выводы.

    python3 tools/m7/run.py            # пересоздать данные, прогнать всё, вписать в главы
    python3 tools/m7/run.py show 7.2   # только напечатать выводы главы

Запрос описан в QUERIES: глава, имя, подпись, код mongosh. В главе стоят маркеры
<!--Q 7.2 имя--> … <!--/Q-->; между ними скрипт ставит блок кода и блок вывода.
Запросы главы выполняются по порядку; перед главой файл данных из SEEDS
пересоздаёт её коллекции в sandbox.
"""
import html
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.join(ROOT, "tools", "m7")

CHAPTERS = {
    "7.2": "71-veterinarnaya-klinika",
    "7.3": "72-katalogi-i-ankety",
    "7.4": "73-potoki-sobytiy",
    "7.5": "74-biznes-processy",
}
# Файлы данных лежат в папке главы (dannye/), студент скачивает их оттуда.
SEEDS = {
    "7.2": "vet.js",
    "7.3": "zoo.js",
    "7.4": "fridge.js",
    "7.5": "repair.js",
}

from queries import QUERIES  # noqa: E402  (tools/m7/queries.py)


def mongosh(code):
    p = subprocess.run(
        ["docker", "exec", "course-mongo", "mongosh", "sandbox", "--quiet", "--eval", code],
        capture_output=True, text=True)
    out = (p.stdout + p.stderr).rstrip()
    # Стек вызовов mongosh при ошибке студенту не показывается: только первая строка ошибки.
    out = re.sub(r"\n\s+at .*", "", out)
    return out


def run_query(code):
    # Команды, разделённые пустой строкой, выполняются по очереди: mongosh --eval
    # печатает только результат последнего выражения, а в книге нужен вывод каждой.
    return "\n\n".join(mongosh(part) for part in code.strip().split("\n\n"))


def seed(ch):
    path = os.path.join(ROOT, "temy", CHAPTERS[ch], "dannye", SEEDS[ch])
    with io.open(path, encoding="utf-8") as fh:
        subprocess.run(["docker", "exec", "-i", "course-mongo", "mongosh", "--quiet"],
                       stdin=fh, capture_output=True, check=True)


TOKEN = re.compile(r'(?P<c>//[^\n]*)|(?P<s>"(?:[^"\\]|\\.)*")|(?P<f>\b[a-zA-Z_][\w]*(?=\())|(?P<n>(?<![\w$.-])-?\d+(?:\.\d+)?\b)')


def light(code):
    out, pos = [], 0
    for m in TOKEN.finditer(code):
        out.append(html.escape(code[pos:m.start()], quote=False))
        kind = m.lastgroup
        out.append('<span class="%s">%s</span>' % (kind, html.escape(m.group(0), quote=False)))
        pos = m.end()
    out.append(html.escape(code[pos:], quote=False))
    return "".join(out)


def block(q, output):
    return (
        '<figure class="code" data-run="no">\n'
        '          <figcaption><span>mongosh · оболочка</span><span>%s</span></figcaption>\n'
        '<pre>%s</pre>\n'
        '        </figure>\n'
        '        <figure class="code code--out" data-run="no">\n'
        '          <figcaption><span>Вывод в терминал</span><span>результат запуска</span></figcaption>\n'
        '<pre>%s</pre>\n'
        '        </figure>\n        ' % (html.escape(q["caption"], quote=False), light(q["code"].strip()),
                                         html.escape(output, quote=False)))


def run(ch):
    seed(ch)
    res = {}
    for q in QUERIES:
        if q["ch"] == ch:
            res[q["name"]] = run_query(q["code"])
    return res


def apply(ch, res):
    path = os.path.join(ROOT, "temy", CHAPTERS[ch], "index.html")
    if not os.path.exists(path):
        return 0
    s = io.open(path, encoding="utf-8").read()
    n = 0
    for q in QUERIES:
        if q["ch"] != ch:
            continue
        pat = re.compile(r"(<!--Q %s %s-->)(.*?)(<!--/Q-->)" % (re.escape(ch), re.escape(q["name"])), re.S)
        s, k = pat.subn(lambda m: m.group(1) + "\n        " + block(q, res[q["name"]]) + m.group(3), s)
        n += k
    io.open(path, "w", encoding="utf-8").write(s)
    return n


def main():
    args = sys.argv[1:]
    if args[:1] == ["show"]:
        for ch in args[1:]:
            for name, out in run(ch).items():
                print("=====", ch, name)
                print(out)
        return
    chs = args or list(CHAPTERS)
    for ch in chs:
        res = run(ch)
        print(ch, "запросов:", len(res), "вписано:", apply(ch, res))
    # После прогона песочница остаётся в состоянии последней главы; клиника — исходной.
    seed("7.2")


if __name__ == "__main__":
    main()
