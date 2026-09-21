"""Код примеров модуля 2 на четырёх языках из одного описания.

Фильтры модуля 2 — это документы, и у каждого драйвера своя запись одного
и того же документа: словарь Python, хеш Ruby, bson.D в Go, make_document
в C++. Набирать каждый фильтр четыре раза руками — значит рано или поздно
получить в одном языке не тот фильтр, что в остальных. Здесь фильтр
описывается один раз, литералом Python, а код и подсветка для всех четырёх
языков собираются из него.

Использование — вставить в index.html главы маркеры и развернуть их:

    <!--EX 2.2 gte-->        пример: div.duo с кодом на четырёх языках
                             и четыре пустых блока вывода (их заполнит apply)
    <!--ERRORS 2.2-->        таблица «Частые ошибки» на четырёх языках
    <!--CHEAT 2.2-->         шпаргалка на четырёх языках

    python3 tools/snippets.py expand 2.2      # маркеры → HTML, один раз

После разворота маркеров в странице не остаётся: дальше текст правится
в index.html как обычно. Описания примеров — в tools/chapters2.py.
"""

import datetime as dt
import html
import pathlib
import re
import sys

BOOK = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BOOK / "tools"))

LANGS = ["python", "cpp", "go", "ruby"]
CAPTION = {"python": "Python · PyMongo", "cpp": "C++ · mongocxx",
           "go": "Go · mongo-driver", "ruby": "Ruby · mongo"}


def E(text: str) -> str:
    return html.escape(text, quote=False)


def s(text: str) -> str:
    return f'<span class="s">{E(text)}</span>'


def n(text) -> str:
    return f'<span class="n">{E(str(text))}</span>'


def k(text: str) -> str:
    return f'<span class="k">{E(text)}</span>'


def f(text: str) -> str:
    return f'<span class="f">{E(text)}</span>'


def c(text: str) -> str:
    return f'<span class="c">{E(text)}</span>'


def q(value: str) -> str:
    """Строковый литерал в двойных кавычках — одинаковый во всех четырёх языках."""
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]


def cpp_date_name(d: dt.datetime) -> str:
    return f"{MONTHS[d.month - 1]}{d.day:02d}"


def millis(d: dt.datetime) -> int:
    return int(d.replace(tzinfo=dt.timezone.utc).timestamp() * 1000)


def dates_in(value) -> list:
    if isinstance(value, dt.datetime):
        return [value]
    if isinstance(value, dict):
        return [d for v in value.values() for d in dates_in(v)]
    if isinstance(value, list):
        return [d for v in value for d in dates_in(v)]
    return []


# ── литералы ───────────────────────────────────────────────────────────────

class Ref(str):
    """Имя переменной, в которой уже лежит документ условия."""

def lit(value, lang: str) -> str:
    """Значение на языке драйвера, с подсветкой."""
    if type(value).__name__ == "Ref":          # класс сравнивается по имени: chapters2 импортирует модуль заново
        return str(value) + (".view()" if lang == "cpp" else "")
    if isinstance(value, bool):
        return k(("True" if value else "False") if lang == "python" else ("true" if value else "false"))
    if value is None:
        return {"python": k("None"), "ruby": k("nil"), "go": k("nil"),
                "cpp": "bsoncxx::types::b_null{}"}[lang]
    if isinstance(value, (int, float)):
        return n(value)
    if isinstance(value, str):
        return s(q(value))
    if isinstance(value, dt.datetime):
        return cpp_date_name(value)             # сама дата объявлена переменной выше фильтра
    if isinstance(value, list):
        items = ", ".join(lit(v, lang) for v in value)
        return {"python": f"[{items}]", "ruby": f"[{items}]",
                "go": f"bson.A{{{items}}}", "cpp": f"{f('make_array')}({items})"}[lang]
    if isinstance(value, dict):
        return doc(value, lang)
    raise TypeError(type(value))


def pair(key: str, value, lang: str) -> str:
    if lang == "python":
        return f"{s(q(key))}: {lit(value, lang)}"
    if lang == "ruby":
        return f"{s(q(key))} =&gt; {lit(value, lang)}"
    if lang == "go":
        return f"{{Key: {s(q(key))}, Value: {lit(value, lang)}}}"
    return f"{f('kvp')}({s(q(key))}, {lit(value, lang)})"


def doc(value: dict, lang: str, indent: str = "", wrap: bool = False) -> str:
    """Документ на языке драйвера. wrap — по паре верхнего уровня на строку."""
    pairs = [pair(key, v, lang) for key, v in value.items()]
    if lang == "python":
        open_, close, sep = "{", "}", ", "
    elif lang == "ruby":
        open_, close, sep = ("{ ", " }", ", ") if pairs else ("{", "}", ", ")
    elif lang == "go":
        open_, close, sep = "bson.D{", "}", ", "
    else:
        open_, close, sep = f"{f('make_document')}(", ")", ", "
    if not wrap or len(pairs) < 2:
        return open_ + sep.join(pairs) + close
    pad = indent + " " * visible_len(open_)
    return open_ + ("," + "\n" + pad).join(pairs) + close


def visible_len(fragment: str) -> int:
    return len(html.unescape(re.sub(r"<[^>]+>", "", fragment)))


def width(fragment: str) -> int:
    return max(visible_len(line) for line in fragment.split("\n"))



def date_lines(dates, lang: str) -> list[str]:
    """Объявления дат: по переменной на дату, имя — месяц и день (sep21)."""
    out = []
    if lang == "python":
        out.append(f"{k('from')} datetime {k('import')} datetime")
        out.append("")
    for d in dates:
        name = cpp_date_name(d)
        y, m, day, H, M = d.year, d.month, d.day, d.hour, d.minute
        args = f"{n(y)}, {n(m)}, {n(day)}" + (f", {n(H)}, {n(M)}" if H or M else "")
        if lang == "python":
            out.append(f"{name} = {f('datetime')}({args})")
        elif lang == "ruby":
            out.append(f"{name} = Time.{f('utc')}({args})")
        elif lang == "go":
            out.append(f"{name} := time.{f('Date')}({n(y)}, {n(m)}, {n(day)}, {n(H)}, {n(M)}, {n(0)}, {n(0)}, time.UTC)")
        else:
            out.append(f"{k('auto')} {name} = bsoncxx::types::b_date{{std::chrono::milliseconds{{{n(millis(d))}}}}};"
                       + "   " + c(f"// {d:%d.%m.%Y %H:%M} UTC"))
    return out


LOGIC = ("$and", "$or", "$nor")


def pretty(value, lang: str, indent: str) -> str:
    """Документ фильтра в несколько строк: пары верхнего уровня — по строке,
    элементы $and/$or/$nor — по строке. Короткие части остаются в одну строку."""
    if not isinstance(value, dict) or visible_len(lit(value, lang)) + len(indent) <= 88:
        return lit(value, lang)
    if lang == "python":
        open_, close = "{", "}"
    elif lang == "ruby":
        open_, close = "{ ", " }"
    elif lang == "go":
        open_, close = "bson.D{", "}"
    else:
        open_, close = f"{f('make_document')}(", ")"
    if lang in ("go", "cpp"):
        return block(value, lang, "")           # отступ Go и C++ — от начала строки, а не от имени переменной
    inner = indent + " " * visible_len(open_)
    parts = []
    for key, v in value.items():
        if key in LOGIC and isinstance(v, list):
            if lang == "python":
                head, arr_open, arr_close = f"{s(q(key))}: ", "[", "]"
            elif lang == "ruby":
                head, arr_open, arr_close = f"{s(q(key))} =&gt; ", "[", "]"
            elif lang == "go":
                head, arr_open, arr_close = f"{{Key: {s(q(key))}, Value: ", "bson.A{", "}}"
            else:
                head, arr_open, arr_close = f"{f('kvp')}({s(q(key))}, ", f"{f('make_array')}(", "))"
            item_indent = inner + " " * (visible_len(head) + visible_len(arr_open))
            items = [pretty(item, lang, item_indent) for item in v]
            parts.append(head + arr_open + ("," + "\n" + item_indent).join(items) + arr_close)
        else:
            parts.append(pair(key, v, lang))
    return open_ + ("," + "\n" + inner).join(parts) + close


def block(value, lang: str, indent: str) -> str:
    """Go и C++: перенос после открытия массива логического оператора,
    отступ — четыре пробела на уровень."""
    step = "    "
    if isinstance(value, dict) and len(value) == 1:
        (key, v), = value.items()
        if key in LOGIC and isinstance(v, list):
            inner = indent + step
            items = [block(item, lang, inner) if visible_len(lit(item, lang)) + len(inner) > 88 else lit(item, lang)
                     for item in v]
            if lang == "go":
                return (f"bson.D{{{{Key: {s(q(key))}, Value: bson.A{{" + "\n" + inner
                        + (",\n" + inner).join(items) + "}}}")
            return (f"{f('make_document')}({f('kvp')}({s(q(key))}, {f('make_array')}(" + "\n" + inner
                    + (",\n" + inner).join(items) + ")))")
    if isinstance(value, dict) and len(value) == 1:
        (key, v), = value.items()
        if isinstance(v, dict) and visible_len(lit(value, lang)) + len(indent) > 88:
            inside = block(v, lang, indent)
            if lang == "go":
                return f"bson.D{{{{Key: {s(q(key))}, Value: " + inside + "}}"
            return f"{f('make_document')}({f('kvp')}({s(q(key))}, " + inside + "))"
    if isinstance(value, dict) and len(value) > 1:
        inner = indent + step
        parts = [pair(k_, v, lang) for k_, v in value.items()]
        if lang == "go":
            return "bson.D{\n" + inner + (",\n" + inner).join(parts) + "}"
        return f"{f('make_document')}(" + "\n" + inner + (",\n" + inner).join(parts) + ")"
    return lit(value, lang)

# ── шаги примера ───────────────────────────────────────────────────────────

def label_pad(rows) -> int:
    return max(len(r["label"]) for r in rows)


def count_lines(rows, lang: str) -> list[str]:
    """Строки «метка: число» — по count_documents на каждый фильтр."""
    width_ = label_pad(rows)
    out = []
    for r in rows:
        label = (r["label"] + ":").ljust(width_ + 1)
        coll, filt = r["coll"], lit(r["filter"], lang)
        if lang == "python":
            out.append(f"{f('print')}({s(q(label))}, {coll}.{f('count_documents')}({filt}))")
        elif lang == "ruby":
            out.append(f"{f('puts')} {s(q(label + ' '))} + {coll}.{f('count_documents')}({filt}).{f('to_s')}")
        elif lang == "go":
            var = r["go"]
            out.append(f"{var}, _ := {coll}.{f('CountDocuments')}(ctx, {filt})")
        else:
            out.append(f"std::cout &lt;&lt; {s(q(label + ' '))} &lt;&lt; {coll}.{f('count_documents')}({filt}) &lt;&lt; std::endl;")
    if lang == "go":
        out.append("")
        for r in rows:
            label = (r["label"] + ":").ljust(width_ + 1)
            out.append(f"fmt.{f('Println')}({s(q(label))}, {r['go']})")
    return out


def proj_doc(fields: list[str]) -> dict:
    return {"_id": 0, **{name: 1 for name in fields}}


def find_lines(step, lang: str) -> list[str]:
    coll, filt = step["coll"], step["filter"]
    proj = proj_doc(step["fields"]) if step.get("fields") else None
    if proj and step.get("keep_id"):
        proj = {name: 1 for name in step["fields"]}     # _id сервер вернёт сам
    sort = step.get("sort")                     # список пар (поле, направление)
    limit = step.get("limit")
    if lang == "python":
        args = lit(filt, lang) + (", " + lit(proj, lang) if proj else "")
        call = f"{coll}.{f('find')}({args})"
        if sort:
            if len(sort) == 1:
                call += f".{f('sort')}({s(q(sort[0][0]))}, {n(sort[0][1])})"
            else:
                call += f".{f('sort')}([" + ", ".join(f"({s(q(a))}, {n(b)})" for a, b in sort) + "])"
        if limit:
            call += f".{f('limit')}({n(limit)})"
        return [f"{k('for')} doc {k('in')} {call}:", f"    {f('print')}(doc)"]
    if lang == "ruby":
        call = f"{coll}.{f('find')}({lit(filt, lang)}" + (f", projection: {lit(proj, lang)})" if proj else ")")
        tail = []
        if sort:
            tail.append(f".{f('sort')}({lit(dict(sort), lang)})")
        if limit:
            tail.append(f".{f('limit')}({n(limit)})")
        tail.append(f".{f('each')} {{ |doc| {f('puts')} doc.inspect }}")
        pad = " " * (len(coll))
        return [call] + [pad + t for t in tail]
    if lang == "go":
        opts = []
        if proj:
            opts.append(f"{f('SetProjection')}({lit(proj, lang)})")
        if sort:
            opts.append(f"{f('SetSort')}({lit(dict(sort), lang)})")
        if limit:
            opts.append(f"{f('SetLimit')}({n(limit)})")
        lines = [f"cursor, _ := {coll}.{f('Find')}(ctx, {step.get('go_filter') or lit(filt, lang)}"
                 + ("," if opts else ")")]
        if len(opts) == 1:
            lines.append(f"    options.{f('Find')}()." + opts[0] + ")")
        elif opts:
            # В Go точка цепочки стоит в конце строки: перед переносом компилятор ставит «;»
            lines.append(f"    options.{f('Find')}().")
            for i, o in enumerate(opts):
                lines.append("        " + o + (")" if i == len(opts) - 1 else "."))
        lines += [f"{k('for')} cursor.{f('Next')}(ctx) {{",
                  f"    {k('var')} doc bson.D",
                  f"    cursor.{f('Decode')}(&amp;doc)",
                  f"    out, _ := bson.{f('MarshalExtJSON')}(doc, {k('false')}, {k('false')})",
                  f"    fmt.{f('Println')}({f('string')}(out))",
                  "}"]
        return lines
    lines = []
    if proj or sort or limit:
        lines.append("mongocxx::options::find options;")
        if proj:
            lines.append(f"options.{f('projection')}({lit(proj, lang)});")
        if sort:
            lines.append(f"options.{f('sort')}({lit(dict(sort), lang)});")
        if limit:
            lines.append(f"options.{f('limit')}({n(limit)});")
        lines.append("")
    arg = step.get("cpp_filter") or lit(filt, lang)
    lines.append(f"{k('for')} ({k('const auto')}&amp; doc : {coll}.{f('find')}({arg}" + (", options" if lines else "") + ")) {")
    lines.append(f"    std::cout &lt;&lt; bsoncxx::{f('to_json')}(doc, bsoncxx::ExtendedJsonMode::k_relaxed) &lt;&lt; std::endl;")
    lines.append("}")
    return lines


def filter_var(step, lang: str) -> list[str]:
    """Длинный фильтр выносится в переменную filtr — по паре верхнего уровня на строку."""
    value = step["filter"]
    plain_head = {"python": "filtr = ", "ruby": "filtr = ", "go": "filtr := ", "cpp": "auto filtr = "}[lang]
    head = f"{k('auto')} filtr = " if lang == "cpp" else plain_head
    body = pretty(value, lang, " " * len(plain_head))
    if body == lit(value, lang):                 # короткий фильтр: по паре на строку, как раньше
        body = doc(value, lang, " " * len(plain_head), wrap=True)
    return [head + body + (";" if lang == "cpp" else "")]


def code(spec, lang: str) -> str:
    """Полный текст примера: даты, счётчики, выборка."""
    if "raw" in spec:
        return spec["raw"][lang].strip("\n")
    steps = spec["steps"]
    lines = []
    values = [st.get("filter") for st in steps if "filter" in st] + \
             [r["filter"] for st in steps for r in st.get("rows", [])] + \
             [v for st in steps for _, v in st.get("define", [])] + \
             [st["doc"] for st in steps if "doc" in st]
    dates = sorted({d for v in values for d in dates_in(v)})
    if dates:
        lines += date_lines(dates, lang) + [""]
    for i, st in enumerate(steps):
        glued = i and any(key in st and key in steps[i - 1] for key in ("open", "insert", "update"))
        if i and lines and lines[-1] != "" and not glued:
            lines.append("")
        if "comment" in st:
            mark = "#" if lang in ("python", "ruby") else "//"
            for text in st["comment"].split("\n"):
                lines.append(c(f"{mark} {text}"))
        if "open" in st:
            var, dbname, coll = st["open"]
            lines.append({"python": f'{var} = client[{s(q(dbname))}][{s(q(coll))}]',
                          "ruby": f'{var} = client.{f("use")}({s(q(dbname))}).database[:{coll}]',
                          "go": f'{var} := client.{f("Database")}({s(q(dbname))}).{f("Collection")}({s(q(coll))})',
                          "cpp": f'{k("auto")} {var} = client[{s(q(dbname))}][{s(q(coll))}];'}[lang])
        elif "insert" in st:
            coll = st["insert"]
            call = {"python": f"{coll}.insert_one(", "ruby": f"{coll}.insert_one(",
                    "go": f"{coll}.InsertOne(ctx, ", "cpp": f"{coll}.insert_one("}[lang]
            value = pretty(st["doc"], lang, " " * len(call))
            lines.append({"python": f"{coll}.{f('insert_one')}({value})",
                          "ruby": f"{coll}.{f('insert_one')}({value})",
                          "go": f"{coll}.{f('InsertOne')}(ctx, {value})",
                          "cpp": f"{coll}.{f('insert_one')}({value});"}[lang])
        elif "update" in st:
            coll = st["update"]
            filt, change = lit(st["filter"], lang), lit({"$set": st["set"]}, lang)
            lines.append({"python": f"{coll}.{f('update_one')}({filt}, {change})",
                          "ruby": f"{coll}.{f('update_one')}({filt}, {change})",
                          "go": f"{coll}.{f('UpdateOne')}(ctx, {filt}, {change})",
                          "cpp": f"{coll}.{f('update_one')}({filt}, {change});"}[lang])
        elif "define" in st:
            for name, value in st["define"]:
                head = {"python": f"{name} = ", "ruby": f"{name} = ", "go": f"{name} := ",
                        "cpp": f"auto {name} = "}[lang]
                shown_head = f"{k('auto')} {name} = " if lang == "cpp" else head
                lines.append(shown_head + pretty(value, lang, " " * len(head)) + (";" if lang == "cpp" else ""))
        elif "rows" in st:
            lines += count_lines(st["rows"], lang)
        elif "filter" in st:
            use_var = st.get("var")
            if use_var:
                lines += filter_var(st, lang)
                lines.append("")
                st = dict(st, go_filter="filtr", cpp_filter="filtr.view()")
                st["filter_name"] = "filtr"
                lines += find_lines_var(st, lang)
            else:
                lines += find_lines(st, lang)
    return "\n".join(lines)


def find_lines_var(step, lang: str) -> list[str]:
    """То же, что find_lines, но фильтр уже лежит в переменной filtr."""
    if lang in ("python", "ruby"):
        out = find_lines(dict(step, filter={}), lang)
        return [line.replace(lit({}, lang), "filtr", 1) for line in out]
    return find_lines(step, lang)


# ── блоки страницы ─────────────────────────────────────────────────────────

def example_html(spec) -> str:
    caption = spec["caption"]
    parts = ['        <div class="duo">']
    for lang in LANGS:
        body = code(spec, lang)
        parts.append(f'          <figure class="code" data-lang="{lang}">\n'
                     f'            <figcaption><span>{CAPTION[lang]}</span><span>{E(caption)}</span></figcaption>\n'
                     f'<pre>{body}</pre>\n          </figure>')
    parts.append("        </div>")
    for lang in LANGS:
        parts.append(f'        <figure class="code code--out" data-lang="{lang}">\n'
                     f'          <figcaption><span>Вывод в терминал</span><span>результат запуска</span></figcaption>\n'
                     f'<pre>…</pre>\n        </figure>')
    return "\n".join(parts)


def plain(value, lang: str) -> str:
    """Фильтр без подсветки — для таблиц и шпаргалок (там <code> без span)."""
    return re.sub(r"<[^>]+>", "", lit(value, lang))


def cell(item, lang: str) -> str:
    """Ячейка таблицы: ('f', фильтр) — код фильтра, строка — текст как есть."""
    if isinstance(item, tuple) and item[0] == "f":
        return f"<code>{plain(item[1], lang)}</code>"
    if isinstance(item, dict):
        return item.get(lang, item.get("all", ""))
    return item


def errors_html(rows) -> str:
    out = []
    for lang in LANGS:
        body = "\n".join(
            f"              <tr><td>{cell(a, lang)}</td><td>{cell(b, lang)}</td><td>{cell(c_, lang)}</td></tr>"
            for a, b, c_ in rows if not (isinstance(a, dict) and lang not in a and "all" not in a))
        out.append(f'        <div class="table-scroll errors-table" data-lang="{lang}">\n'
                   f'          <table>\n'
                   f'            <thead><tr><th>Что написано</th><th>Что происходит</th><th>Как правильно</th></tr></thead>\n'
                   f'            <tbody>\n{body}\n            </tbody>\n'
                   f'          </table>\n        </div>')
    return "\n".join(out)


def cheat_line(item, lang: str) -> list[str]:
    if isinstance(item, tuple) and item[0] == "f":
        return [plain(item[1], lang)]
    if isinstance(item, tuple) and item[0] == "call":
        # ("call", коллекция, фильтр) — вызов find с фильтром
        coll, value = item[1], item[2]
        text = plain(value, lang)
        if lang == "go":
            return [f"{coll}.Find(ctx, {text})"]
        return [f"{coll}.find({text})"]
    if isinstance(item, dict):
        v = item.get(lang, item.get("all"))
        return v if isinstance(v, list) else [v]
    return [item]


def cheat_html(cards) -> str:
    out = []
    for lang in LANGS:
        rows = []
        for title, item in cards:
            lines = cheat_line(item, lang)
            codes = "\n".join(f"            <code>{E(line) if '<' not in line and '&' not in line else line}</code>" for line in lines)
            rows.append(f"          <div>\n            <b>{title}</b>\n{codes}\n          </div>")
        out.append(f'        <div class="cheat" data-lang="{lang}">\n' + "\n".join(rows) + "\n        </div>")
    return "\n".join(out)


def expand(chapter: str) -> None:
    import examples
    from chapters2 import EXAMPLES, ERRORS, CHEATS
    path = BOOK / "temy" / examples.CHAPTERS[chapter][0] / "index.html"
    page = path.read_text()
    count = 0

    def ex(m):
        nonlocal count
        count += 1
        return example_html(EXAMPLES[m.group(1)][m.group(2)])

    page = re.sub(r"[ \t]*<!--EX (\S+) (\S+)-->", ex, page)
    page = re.sub(r"[ \t]*<!--ERRORS (\S+)-->", lambda m: errors_html(ERRORS[m.group(1)]), page)
    page = re.sub(r"[ \t]*<!--CHEAT (\S+)-->", lambda m: cheat_html(CHEATS[m.group(1)]), page)
    path.write_text(page)
    left = re.findall(r"<!--(?:EX|ERRORS|CHEAT) [^>]*-->", page)
    print(f"{chapter}: развёрнуто примеров {count}, осталось маркеров {len(left)}")


def refresh(chapter: str) -> None:
    """Пересобрать код уже развёрнутых примеров: блок находится по подписи
    в figcaption, меняется только текст в <pre>. Текст главы не трогается."""
    import examples
    from chapters2 import EXAMPLES
    path = BOOK / "temy" / examples.CHAPTERS[chapter][0] / "index.html"
    page = path.read_text()
    changed = 0
    for spec in EXAMPLES[chapter].values():
        for lang in LANGS:
            head = (f'<figure class="code" data-lang="{lang}">\n'
                    f'            <figcaption><span>{CAPTION[lang]}</span><span>{E(spec["caption"])}</span></figcaption>\n<pre>')
            at = page.find(head)
            if at < 0:
                continue
            start = at + len(head)
            end = page.index("</pre>", start)
            new = code(spec, lang)
            if page[start:end] != new:
                page = page[:start] + new + page[end:]
                changed += 1
    from chapters2 import ERRORS, CHEATS
    if chapter in ERRORS:
        m = re.search(r'[ \t]*<div class="table-scroll errors-table" data-lang="python">.*?data-lang="ruby">.*?</table>\n\s*</div>', page, re.S)
        if m:
            page = page[:m.start()] + errors_html(ERRORS[chapter]) + page[m.end():]
    if chapter in CHEATS:
        m = re.search(r'[ \t]*<div class="cheat" data-lang="python">.*?<div class="cheat" data-lang="ruby">.*?\n        </div>', page, re.S)
        if m:
            page = page[:m.start()] + cheat_html(CHEATS[chapter]) + page[m.end():]
    path.write_text(page)
    print(f"{chapter}: обновлено блоков кода {changed}, таблица и шпаргалка пересобраны")


if __name__ == "__main__":
    if sys.argv[1] == "expand":
        for ch in sys.argv[2:]:
            expand(ch)
    elif sys.argv[1] == "refresh":
        for ch in sys.argv[2:]:
            refresh(ch)
    elif sys.argv[1] == "show":
        from chapters2 import EXAMPLES
        ch, name = sys.argv[2], sys.argv[3]
        for lang in LANGS:
            print(f"===== {lang}")
            print(html.unescape(re.sub(r"<[^>]+>", "", code(EXAMPLES[ch][name], lang))))
