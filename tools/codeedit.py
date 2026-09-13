"""Правка блоков кода в главах: замена кода с подсветкой и вставка новых блоков.

Подсветка та же, что в книге: .k ключевые слова, .s строки, .c комментарии,
.f вызовы, .n числа. Используется из tools/examples.py и разовых правок.
"""

import html
import pathlib
import re

BOOK = pathlib.Path(__file__).resolve().parent.parent

KEYWORDS = {
    "python": "from import def return if else elif for in while try except as with raise True False None and or not lambda class pass",
    "go": "package import func return if else for range var const type struct map chan go defer break continue switch case default nil true false string int int64 float64 bool any error",
    "cpp": "auto const for if else return throw try catch struct class void int bool true false nullptr using namespace include std::string",
    "ruby": "require def end if unless else elsif do begin rescue ensure return true false nil puts class module then",
    "shell": "cd",
}

TOKEN = re.compile(r'''(?P<comment>//[^\n]*|\#(?!include)[^\n]*)
                     |(?P<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`)
                     |(?P<call>\b[A-Za-z_]\w*(?=\())
                     |(?P<number>\b\d+(?:\.\d+)?\b)
                     |(?P<word>\#include|\b[A-Za-z_]\w*\b)''', re.X)


def highlight(code: str, lang: str) -> str:
    words = set(KEYWORDS.get(lang, "").split())
    out, pos = [], 0
    for m in TOKEN.finditer(code):
        out.append(html.escape(code[pos:m.start()], quote=False))
        text = html.escape(m.group(0), quote=False)
        kind = m.lastgroup
        if kind == "comment" and (lang != "python" and lang != "ruby") and m.group(0).startswith("#"):
            out.append(text)
        elif kind == "comment" and lang in ("python", "ruby") and m.group(0).startswith("//"):
            out.append(text)
        elif kind == "comment":
            out.append(f'<span class="c">{text}</span>')
        elif kind == "string":
            out.append(f'<span class="s">{text}</span>')
        elif kind == "call":
            cls = "k" if m.group(0) in words else "f"
            out.append(f'<span class="{cls}">{text}</span>')
        elif kind == "number":
            out.append(f'<span class="n">{text}</span>')
        elif m.group(0) in words:
            out.append(f'<span class="k">{text}</span>')
        else:
            out.append(text)
        pos = m.end()
    out.append(html.escape(code[pos:], quote=False))
    return "".join(out)


FIG = re.compile(r'<figure class="(code(?: code--out)?)"((?: data-[a-z]+="[^"]*")*)>(\s*<figcaption>.*?</figcaption>\s*<pre>)(.*?)(</pre>\s*</figure>)', re.S)


def page_path(chapter_dir: str) -> pathlib.Path:
    return BOOK / "temy" / chapter_dir / "index.html"


def code_figures(page: str, lang: str, kind: str = "code") -> list[re.Match]:
    start = page.index("<main")
    result = []
    for m in FIG.finditer(page, start):
        attrs = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(2)))
        if attrs.get("run") == "no":
            continue
        is_out = "out" in m.group(1)
        if attrs.get("lang") == lang and (is_out == (kind == "out")):
            result.append(m)
    return result


def set_code(chapter_dir: str, lang: str, n: int, code: str) -> None:
    """Заменить код n-го блока языка в главе (нумерация как в examples.py)."""
    path = page_path(chapter_dir)
    page = path.read_text()
    m = code_figures(page, lang)[n - 1]
    page = page[:m.start(4)] + highlight(code.strip("\n"), lang) + page[m.end(4):]
    path.write_text(page)


def insert_before_code(chapter_dir: str, lang: str, n: int, figure_html: str) -> None:
    path = page_path(chapter_dir)
    page = path.read_text()
    m = code_figures(page, lang)[n - 1]
    line_start = page.rfind("\n", 0, m.start()) + 1
    page = page[:line_start] + figure_html + page[line_start:]
    path.write_text(page)


def figure(lang: str, left: str, right: str, code: str, out: bool = False) -> str:
    cls = "code code--out" if out else "code"
    body = html.escape(code, quote=False) if out else highlight(code.strip("\n"), lang)
    return (f'        <figure class="{cls}" data-lang="{lang}">\n'
            f'          <figcaption><span>{left}</span><span>{right}</span></figcaption>\n'
            f'<pre>{body}</pre>\n        </figure>\n')
