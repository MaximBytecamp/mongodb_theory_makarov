"""Листинг скрипта из репозитория практик в HTML главы.

Главы 1.9 и 2.9 разбирают готовые скрипты из `mongodb-practice/scripts`.
Код в книге должен совпадать с файлом, который запускает студент, поэтому
он не набирается заново, а берётся из файла и размечается подсветкой
книги (`s` строка, `n` число, `k` ключевое слово, `f` вызов, `c` комментарий).

    python3 tools/listing.py shop_report.py            # весь файл
    python3 tools/listing.py shop_report.py 1 8        # части 1 и 8

Часть — это блок между строками-разделителями вида «── 8. Запись …».
"""

import html
import pathlib
import re
import sys

SCRIPTS = pathlib.Path("/Users/makarovmn/mongodb-practice/scripts")

KEYWORDS = {
    "py": {"import", "from", "for", "in", "if", "not", "and", "or", "None", "True", "False",
           "def", "return", "as", "with", "else", "elif", "while", "break", "continue"},
    "rb": {"require", "def", "end", "do", "each", "if", "unless", "else", "true", "false", "nil",
           "puts", "return", "freeze"},
    "go": {"package", "import", "func", "var", "for", "range", "if", "else", "return", "type",
           "struct", "string", "int", "bool", "true", "false", "nil", "defer", "make", "append"},
    "cpp": {"include", "auto", "const", "for", "if", "else", "return", "int", "bool", "true",
            "false", "void", "std", "using", "namespace", "struct", "class"},
}
COMMENT = {"py": "#", "rb": "#", "go": "//", "cpp": "//"}
LANG = {"py": "python", "rb": "ruby", "go": "go", "cpp": "cpp"}


def highlight(code: str, ext: str) -> str:
    """Подсветка по правилам книги: один проход по коду, чтобы разметка
    одного правила не попадала под следующее."""
    mark = re.escape(COMMENT[ext])
    token = re.compile(
        rf'(?P<comment>{mark}[^\n]*)'
        r'|(?P<dstring>"(?:[^"\\\n]|\\.)*")'
        r"|(?P<sstring>'(?:[^'\\\n]|\\.)*')"
        r"|(?P<number>\b\d[\d_]*(?:\.\d+)?\b)"
        r"|(?P<word>[A-Za-z_]\w*)")
    words = KEYWORDS[ext]
    out, last = [], 0
    for m in token.finditer(code):
        out.append(html.escape(code[last:m.start()], quote=False))
        text = html.escape(m.group(0), quote=False)
        kind = m.lastgroup
        if kind == "comment":
            out.append(f'<span class="c">{text}</span>')
        elif kind in ("dstring", "sstring"):
            out.append(f'<span class="s">{text}</span>')
        elif kind == "number":
            out.append(f'<span class="n">{text}</span>')
        elif m.group(0) in words:
            out.append(f'<span class="k">{text}</span>')
        elif code[m.end():m.end() + 1] == "(" and code[m.start() - 1:m.start()] != ".":
            out.append(f'<span class="f">{text}</span>')
        elif code[m.end():m.end() + 1] == "(":
            out.append(f'<span class="f">{text}</span>')
        else:
            out.append(text)
        last = m.end()
    out.append(html.escape(code[last:], quote=False))
    return "".join(out)


def part(code: str, number: str) -> str:
    """Блок скрипта между разделителями «── N. …»; «head» — всё до первого."""
    blocks = re.split(r"(?m)^(?=[ \t]*(?:#|//) ── \d+\.)", code)
    if number == "head":
        shapka = blocks[0]
        shapka = re.sub(r'(?s)\A\s*""".*?"""\n', "", shapka, count=1)      # docstring Python
        shapka = re.sub(r"(?m)\A(?:[ \t]*(?:#|//)[^\n]*\n)+", "", shapka)    # шапка из комментариев
        return shapka.strip("\n")
    for block in blocks:
        if re.match(rf"[ \t]*(?:#|//) ── {number}\.", block):
            return block.rstrip("\n")
    raise ValueError(f"нет части {number}")


def figure(name: str, caption: str, code: str, ext: str, run: bool) -> str:
    attrs = f' data-lang="{LANG[ext]}"' + ("" if run else ' data-run="no"')
    return (f'          <figure class="code"{attrs}>\n'
            f'            <figcaption><span>{CAPTION[LANG[ext]]}</span><span>{caption}</span></figcaption>\n'
            f'<pre>{highlight(code, ext)}</pre>\n          </figure>')


CAPTION = {"python": "Python · PyMongo", "cpp": "C++ · mongocxx",
           "go": "Go · mongo-driver", "ruby": "Ruby · mongo"}
EXTS = ["py", "cpp", "go", "rb"]


def duo(stem: str, caption: str, numbers: list[str] | None = None, run: bool = False) -> str:
    """Блок div.duo с одним и тем же фрагментом на четырёх языках."""
    out = ['        <div class="duo">']
    for ext in EXTS:
        code = (SCRIPTS / f"{stem}.{ext}").read_text()
        if numbers:
            code = "\n\n".join(part(code, number) for number in numbers)
        out.append(figure(stem, caption, code, ext, run))
    out.append("        </div>")
    if run:                       # блоки вывода заполнит examples.py apply
        for ext in EXTS:
            out.append(f'        <figure class="code code--out" data-lang="{LANG[ext]}">\n'
                       f'          <figcaption><span>Вывод в терминал</span>'
                       f'<span>результат запуска</span></figcaption>\n'
                       f'<pre>…</pre>\n        </figure>')
    return "\n".join(out)


def expand(path: str) -> None:
    """Заменить в странице главы маркеры листингов на HTML.

        <!--LIST shop_report head · подключение-->   фрагмент, не запускается
        <!--FULL shop_report · весь скрипт-->        листинг целиком, запускается
    """
    page = pathlib.Path(path)
    text = page.read_text()

    def one(m):
        kind, body = m.group(1), m.group(2)
        head, _, caption = body.partition(" · ")
        stem, *numbers = head.split()
        return duo(stem, caption or "скрипт", numbers or None, run=(kind == "FULL"))

    text, count = re.subn(r"[ \t]*<!--(LIST|FULL) ([^>]+?)-->", one, text)
    page.write_text(text)
    print(f"{path}: развёрнуто листингов {count}")


if __name__ == "__main__":
    if sys.argv[1] == "expand":
        expand(sys.argv[2])
    else:
        stem, numbers = sys.argv[1], sys.argv[2:]
        print(duo(stem, "фрагмент", numbers or None))
