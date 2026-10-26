"""Схемы механизма стадий модуля 4: ящики (группировка) и лента (поток документов).

Схема строится на настоящих документах стенда: генератор выполняет конвейер
в mongosh и раскладывает результат по ящикам или столбцам. Готовый HTML
вставляется в главу сразу после вывода примера между метками
<!--VIS 4.N имя--> … <!--/VIS-->; повторный запуск заменяет схему.

    python3 tools/vis4.py 4.4          # схемы одной главы
    python3 tools/vis4.py all          # все главы модуля

Нужен запущенный контейнер course-mongo.
"""

import html
import io
import json
import re
import subprocess
import sys

BOOK = "/Users/makarovmn/mongodb_theory_makarov"
FOLDER = {"4.1": "25-konveyer-match", "4.2": "26-project", "4.3": "27-addfields-set-unset",
          "4.4": "28-group", "4.5": "29-skip-count", "4.6": "30-unwind",
          "4.7": "31-push-first-last", "4.8": "32-bucket-facet", "4.9": "33-replace-redact",
          "4.10": "34-skript-vitrina"}
VIS: dict = {}          # (глава, подпись примера) → функция, возвращающая HTML


# ── данные ────────────────────────────────────────────────────────────────

def agg(pipeline_js: str, coll: str = "orders", db: str = "shop") -> list:
    """Результат конвейера: pipeline_js — массив стадий в записи mongosh."""
    script = (f'print(EJSON.stringify(db.getSiblingDB("{db}").{coll}'
              f'.aggregate({pipeline_js}).toArray(), {{relaxed: true}}))')
    out = subprocess.run(["docker", "exec", "course-mongo", "mongosh", "--quiet", "--eval", script],
                         capture_output=True, text=True, check=True).stdout
    return plain(json.loads(out.strip().splitlines()[-1]))


def plain(value):
    """Даты EJSON {"$date": "…"} → строка ISO, чтобы брать месяц и день срезом."""
    if isinstance(value, dict):
        if set(value) == {"$date"}:
            return value["$date"]
        return {k: plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [plain(v) for v in value]
    return value


def num(n) -> str:
    """Число с разделением тысяч узким пробелом: 2 536 840."""
    if isinstance(n, float) and n != int(n):
        return f"{n:.1f}".replace(".", ",")
    return f"{int(n):,}".replace(",", " ")


def esc(text) -> str:
    return html.escape(str(text), quote=False)


# ── разметка ──────────────────────────────────────────────────────────────

def chip(label, sub=None, k=None, n=None, cls=""):
    classes = " ".join(c for c in ([f"k{k}"] if k is not None else []) + ([cls] if cls else []))
    attr = f' class="{classes}"' if classes else ""
    style = f' style="--n:{n}"' if n is not None else ""
    small = f"<small>{esc(sub)}</small>" if sub is not None else ""
    return f"<i{attr}{style}>{esc(label)}{small}</i>"


def chips(items) -> str:
    return '<div class="chips">' + "".join(items) + "</div>"


def binbox(key, items, acc_lines, k=None, cls=""):
    top = f' style="border-top-color: var(--ink)"' if k is None else ""
    color = f" k{k}" if k is not None else ""
    return (f'<div class="bin{(" " + cls) if cls else ""}"{top}>'
            f'<b class="bin__key{color}">{key}</b>{chips(items)}'
            f'<div class="bin__acc">{"<br>".join(acc_lines)}</div></div>')


def sorter(input_caption, input_chips, arrow, bins):
    return (f'<b class="cap">{input_caption}</b>{chips(input_chips)}'
            f'<div class="sorter__arrow">{arrow}</div><div class="bins">{"".join(bins)}</div>')


def lane(columns):
    """columns — список: ('col', заголовок, [(текст, состояние)], подпись) или ('op', текст)."""
    out = ['<div class="lane">']
    for col in columns:
        if col[0] == "op":
            out.append(f'<div class="lane__op">{col[1]}</div>')
            continue
        _, head, rows, foot = col
        lis = "".join(f'<li{(" class=" + chr(34) + st + chr(34)) if st else ""} style="--n:{i}">{esc(t)}</li>'
                      for i, (t, st) in enumerate(rows))
        out.append(f'<div class="lane__col"><b class="cap">{head}</b><ol>{lis}</ol>'
                   + (f"<em>{foot}</em>" if foot else "") + "</div>")
    out.append("</div>")
    return "".join(out)


def block(key, title, right, lead, body, note, play=True):
    return (f"<!--VIS {key}-->\n"
            f"        <p>{lead}</p>\n"
            f'        <div class="vis" data-vis="{key}"{" data-play" if play else ""}>\n'
            f'          <div class="doc__bar"><span>{title}</span><span>{right}</span></div>\n'
            f'          <div class="vis__body">{body}</div>\n'
            f'          <p class="vis__note">{note}</p>\n'
            f"        </div>\n<!--/VIS-->")


# ── вставка в главу ───────────────────────────────────────────────────────

def insert(chapter: str, caption: str, html_block: str) -> None:
    path = f"{BOOK}/temy/{FOLDER[chapter]}/index.html"
    page = io.open(path, encoding="utf-8").read()
    key = re.search(r"<!--VIS ([^>]+)-->", html_block).group(1)
    page = re.sub(rf"\n?<!--VIS {re.escape(key)}-->.*?<!--/VIS-->", "", page, flags=re.S)
    mark = f"<figcaption><span>Python · PyMongo</span><span>{caption}</span></figcaption>"
    start = page.index(mark)
    pos = page.index('<figure class="code code--out"', start)
    while True:                                  # конец блока выводов четырёх языков
        end = page.index("</figure>", pos) + len("</figure>")
        rest = page[end:]
        if rest.lstrip().startswith('<figure class="code code--out"'):
            pos = end + rest.index('<figure class="code code--out"')
            continue
        break
    page = page[:end] + "\n" + html_block + page[end:]
    io.open(path, "w", encoding="utf-8").write(page)
    print(f"  {chapter} · {caption}")


def vis(chapter: str, caption: str):
    def wrap(fn):
        VIS[(chapter, caption)] = fn
        return fn
    return wrap


# ── 4.4 $group ────────────────────────────────────────────────────────────

CITIES = ["Екатеринбург", "Москва", "Новосибирск", "Санкт-Петербург", "Ярославль"]
DELIVERED = '{$match: {status: "доставлен"}}'


def city_k(city):
    return CITIES.index(city)


def short(number):
    return number[-4:]


@vis("4.4", "доставленные заказы по городам")
def group_bycity():
    docs = agg(f'[{DELIVERED}, {{$project: {{number: 1, total: 1, city: "$delivery.city"}}}}]')
    inp = [chip(short(d["number"]), num(d["total"]), city_k(d["city"]), i) for i, d in enumerate(docs)]
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        items = [chip(short(d["number"]), num(d["total"]), k, i) for i, d in enumerate(mine)]
        bins.append(binbox(esc(city), items, [f"orders: $sum 1 → <b>{len(mine)}</b>",
                                              f"revenue: $sum $total → <b>{num(sum(d['total'] for d in mine))}</b>"], k))
    body = sorter("вход $group: 69 доставленных заказов в порядке хранения", inp,
                  '$group: _id "$delivery.city" — каждый заказ кладётся в ящик своего города ↓', bins)
    return block("4.4 bycity", "Как $group раскладывает заказы по ящикам", "69 заказов → 5 групп",
                 "На схеме — как стадия <code>$group</code> обработала 69 доставленных заказов. Каждый заказ — фишка с последними цифрами номера и суммой; цвет фишки — город доставки.",
                 body, "Сервер читает заказы по одному и кладёт каждый в ящик с ключом <code>_id</code> — городом заказа. Ящика с таким ключом ещё нет — сервер его заводит. Когда заказы кончились, каждый ящик сворачивается в один документ: аккумуляторы под ящиком считают число фишек и сумму их <code>total</code>. Кнопка «по шагам» показывает раскладку по порядку.")


@vis("4.4", "одна группа: _id null")
def group_null():
    docs = agg(f'[{DELIVERED}, {{$project: {{number: 1, total: 1, city: "$delivery.city"}}}}]')
    items = [chip(short(d["number"]), num(d["total"]), city_k(d["city"]), i) for i, d in enumerate(docs)]
    bins = [binbox("_id: null", items, [f"orders: $sum 1 → <b>{len(docs)}</b>",
                                        f"revenue: $sum $total → <b>{num(sum(d['total'] for d in docs))}</b>"])]
    body = f'<div class="sorter__arrow">$group: _id null — у всех заказов ключ один, ящик один ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.4 total", "Один ящик на все документы", "69 заказов → 1 группа",
                 "На схеме — те же 69 фишек, что в §1, но ключ группы — <code>null</code>, одинаковый у всех заказов.",
                 body, "Цвет фишек оставлен по городу, чтобы было видно: заказы всех пяти городов легли в один ящик. Аккумуляторы считают по всему ящику — получается итог по всем доставленным заказам.")


@vis("4.4", "$avg, $min и $max")
def group_stats():
    docs = agg(f'[{DELIVERED}, {{$project: {{number: 1, total: 1, city: "$delivery.city"}}}}, {{$sort: {{total: 1, number: 1}}}}]')
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        lo, hi = mine[0], mine[-1]
        items = [chip(short(d["number"]), num(d["total"]), k, i, "hl" if d in (lo, hi) else "") for i, d in enumerate(mine)]
        avg = round(sum(d["total"] for d in mine) / len(mine))
        bins.append(binbox(esc(city), items, [f"$min → <b>{num(lo['total'])}</b>", f"$max → <b>{num(hi['total'])}</b>",
                                              f"$avg → {num(sum(d['total'] for d in mine))} ÷ {len(mine)} ≈ <b>{num(avg)}</b>"], k))
    body = f'<div class="sorter__arrow">$group по городу: в каждом ящике фишки упорядочены по сумме ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.4 stats", "Минимум, максимум и среднее в ящике", "5 групп",
                 "На схеме — те же ящики городов. Внутри ящика фишки расставлены по возрастанию суммы, чтобы было видно, откуда берутся минимум и максимум.",
                 body, "Обведены две фишки ящика: первая даёт <code>$min</code>, последняя — <code>$max</code>. <code>$avg</code> делит сумму всех фишек на их число; в выводе примера оно округлено стадией <code>$project</code>. Сервер порядок внутри ящика не хранит — он здесь только для наглядности.")


@vis("4.4", "ключ из двух полей")
def group_composite():
    docs = agg('[{$match: {status: "доставлен", "delivery.city": {$in: ["Москва", "Ярославль"]}}}, '
               '{$project: {number: 1, total: 1, city: "$delivery.city", type: "$delivery.type"}}]')
    keys = sorted({(d["city"], d["type"]) for d in docs})
    inp = [chip(short(d["number"]), d["type"], keys.index((d["city"], d["type"])), i) for i, d in enumerate(docs)]
    bins = []
    for k, (city, typ) in enumerate(keys):
        mine = [d for d in docs if (d["city"], d["type"]) == (city, typ)]
        bins.append(binbox(f"{esc(city)}<br>{esc(typ)}", [chip(short(d["number"]), num(d["total"]), k, i) for i, d in enumerate(mine)],
                           [f"orders → <b>{len(mine)}</b>", f"revenue → <b>{num(sum(d['total'] for d in mine))}</b>"], k))
    body = sorter(f"вход: {len(docs)} доставленных заказов Москвы и Ярославля", inp,
                  "$group: _id {city, type} — ящик на каждую пару значений ↓", bins)
    return block("4.4 composite", "Ящики для ключа из двух полей", f"{len(docs)} заказов → {len(keys)} групп",
                 "На схеме — раскладка по ключу из двух полей. Под номером фишки — способ доставки.",
                 body, "Ключ ящика — пара «город, способ доставки». Заказы одного города, но с разным способом доставки, попадают в разные ящики. Пары, которых нет в данных, ящика не получают.")


@vis("4.4", "$match до $group")
def group_before():
    docs = agg('[{$project: {number: 1, total: 1, status: 1, city: "$delivery.city"}}]')
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        items = [chip(short(d["number"]), num(d["total"]), k if d["status"] == "доставлен" else None, i,
                      "" if d["status"] == "доставлен" else "out") for i, d in enumerate(mine)]
        good = [d for d in mine if d["status"] == "доставлен"]
        bins.append(binbox(esc(city), items, [f"все заказы → {num(sum(d['total'] for d in mine))}",
                                              f"только доставленные → <b>{num(sum(d['total'] for d in good))}</b>"], k))
    body = f'<div class="sorter__arrow">$group по городу без $match и после $match по статусу ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.4 before", "Какие заказы попадают в ящики", "120 заказов",
                 "На схеме — все 120 заказов в ящиках городов. Цветные фишки — доставленные заказы, зачёркнутые — остальные.",
                 body, "Без <code>$match</code> в ящики попадают все фишки, и сумма включает отменённые и недоставленные заказы. С <code>$match</code> до <code>$group</code> зачёркнутые фишки до ящиков не доходят, и сумма считается только по цветным.")


@vis("4.4", "$match после $group")
def group_after():
    docs = agg(f'[{DELIVERED}, {{$project: {{number: 1, total: 1, city: "$delivery.city"}}}}]')
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        s = sum(d["total"] for d in mine)
        bins.append(binbox(esc(city), [chip(short(d["number"]), None, k, i) for i, d in enumerate(mine)],
                           [f"revenue → <b>{num(s)}</b>", "проходит $match" if s >= 2000000 else "отброшен $match: меньше 2 000 000"],
                           k, "" if s >= 2000000 else "drop"))
    body = f'<div class="sorter__arrow">$group по городу, затем $match {{revenue: {{$gte: 2 000 000}}}} — отбор ящиков ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.4 after", "$match после $group отбирает ящики", "5 групп → 2",
                 "На схеме — ящики городов после <code>$group</code>. Стадия <code>$match</code> после группировки проверяет ящики-группы целиком.",
                 body, "Условие проверяется по полю <code>revenue</code> группы — его посчитал аккумулятор. Бледные ящики не прошли условие. Фишки внутри ящиков нарисованы для наглядности: после <code>$group</code> в потоке пять документов-групп, отдельных заказов в нём нет.")


@vis("4.4", "$sum и $avg по строкам")
def group_strings():
    docs = agg('[{$project: {number: 1}}, {$limit: 12}]')
    items = [chip(d["number"], "строка", None, i) for i, d in enumerate(docs)]
    bins = [binbox("_id: null", items + [chip("…", "ещё 108")], ["sum: $sum $number → <b>0</b> — строки пропущены",
                                                                  "avg: $avg $number → <b>null</b> — чисел нет"])]
    body = f'<div class="sorter__arrow">$group: _id null, $sum и $avg по полю number ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.4 strings", "Аккумулятор по строковому полю", "120 заказов → 1 группа",
                 "На схеме — один ящик со всеми заказами. В поле <code>number</code> у каждого — строка, например «2026-0001».",
                 body, "<code>$sum</code> складывает только числа: строковые значения он пропускает, и сумма остаётся нулём. <code>$avg</code> без единого числа возвращает <code>null</code>. Ошибки сервер не выдаёт.")


# ── общие куски для остальных глав ────────────────────────────────────────

def all_orders(project='number: 1, total: 1, status: 1, created: 1, city: "$delivery.city"'):
    return agg(f'[{{$sort: {{_id: 1}}}}, {{$project: {{{project}}}}}]')


def ids(pipeline_js, coll="orders"):
    return {d["_id"] for d in agg(pipeline_js[:-1] + ', {$project: {_id: 1}}]', coll)}


def sieve(caption, docs, passed):
    cells = "".join(f'<i class="{"on" if d["_id"] in passed else "out"}" title="{esc(d.get("number", d["_id"]))}"></i>' for d in docs)
    return f'<div><span class="sieve__cap">{caption} · <em>{len(passed)}</em></span><div class="grid120">{cells}</div></div>'


def row(d, *fields):
    return " · ".join(num(d[f]) if isinstance(d[f], (int, float)) else str(d[f]) for f in fields)


# ── 4.1 конвейер: $match, $sort, $limit ───────────────────────────────────

@vis("4.1", "конвейер из одной стадии")
def m_first():
    docs = all_orders()
    passed = ids('[{$match: {status: "в пути"}}]')
    body = f'<div class="sieves">{sieve("$match status «в пути»", docs, passed)}</div>'
    return block("4.1 first", "Стадия $match как сито", "120 заказов → 13",
                 "На схеме — все 120 заказов коллекции квадратами, в порядке хранения: по 20 в ряду. Зелёные квадраты прошли стадию <code>$match</code>.",
                 body, "Стадия проверяет условие у каждого документа по очереди. Подходящий документ передаётся дальше, остальные отбрасываются. На выход прошли 13 заказов в пути, 107 остались позади.", play=False)


@vis("4.1", "три стадии и счёт после каждой")
def m_chain():
    docs = all_orders()
    s1 = ids('[{$match: {status: "доставлен"}}]')
    s2 = ids('[{$match: {status: "доставлен", "delivery.city": {$in: ["Москва", "Санкт-Петербург"]}}}]')
    s3 = ids('[{$match: {status: "доставлен", "delivery.city": {$in: ["Москва", "Санкт-Петербург"]}, total: {$gte: 200000}}}]')
    body = '<div class="sieves">' + sieve("после стадии 1: доставлен", docs, s1) + sieve("после стадии 2: Москва, Санкт-Петербург", docs, s2) + sieve("после стадии 3: total ≥ 200 000", docs, s3) + "</div>"
    return block("4.1 chain", "Три сита подряд", "120 → 69 → 22 → 5",
                 "На схеме — те же 120 заказов после каждой из трёх стадий. Зелёный квадрат — заказ ещё в потоке.",
                 body, "Каждая следующая стадия получает только то, что пропустила предыдущая: зелёных квадратов становится меньше, новые не появляются. Третья стадия проверяет сумму лишь у 22 заказов, которые до неё дошли.", play=False)


@vis("4.1", "условия модуля 2 внутри $match")
def m_filters():
    docs = all_orders()
    a = ids('[{$match: {status: {$in: ["собирается", "в пути"]}}}]')
    b = ids('[{$match: {"payment.method": {$in: ["карта", "СБП"]}}}]')
    c = ids('[{$match: {items: {$elemMatch: {category: "смартфоны", qty: {$gte: 2}}}}}]')
    body = ('<div class="sieves">' + sieve("status $in", docs, a) + sieve("payment.method $in", docs, b)
            + sieve("items $elemMatch", docs, c) + sieve("все три условия", docs, a & b & c) + "</div>")
    return block("4.1 filters", "Три условия одной стадии", "120 → 6",
                 "На схеме — какие заказы подходят под каждое условие стадии по отдельности и под все три вместе.",
                 body, "Условия одного документа <code>$match</code> соединяются по «и»: проходит заказ, который зелёный во всех трёх верхних сетках. Таких шесть — последняя сетка.", play=False)


@vis("4.1", "стадии $sort и $limit")
def m_sortlimit():
    docs = agg('[{$match: {status: "в пути"}}, {$project: {number: 1, total: 1}}]')
    srt = sorted(docs, key=lambda d: -d["total"])
    cols = [("col", "вход · 13, порядок хранения", [(row(d, "number", "total"), "") for d in docs], None),
            ("op", "$sort<br>total −1"),
            ("col", "после $sort · 13", [(row(d, "number", "total"), "on" if i < 3 else "") for i, d in enumerate(srt)], None),
            ("op", "$limit 3"),
            ("col", "после $limit · 3", [(row(d, "number", "total"), "on") for d in srt[:3]] + [(row(d, "number", "total"), "cut") for d in srt[3:]], "заштрихованы — отброшены пределом")]
    return block("4.1 sortlimit", "Заказы в пути на ленте $sort → $limit", "13 → 13 → 3",
                 "На схеме — 13 заказов в пути по столбцам: как они пришли, как их переставил <code>$sort</code> и что оставил <code>$limit</code>.",
                 lane(cols), "<code>$sort</code> ничего не отбрасывает, он только переставляет документы по убыванию суммы. <code>$limit</code> берёт первые три документа потока и останавливается.")


@vis("4.1", "порядок стадий")
def m_order():
    a = agg('[{$sort: {created: -1}}, {$limit: 5}, {$project: {number: 1, status: 1}}]')
    b = agg('[{$match: {status: "доставлен"}}, {$sort: {created: -1}}, {$limit: 8}, {$project: {number: 1, status: 1}}]')
    first = [("col", "$sort, $limit 5 · 5 последних заказов", [(row(d, "number", "status"), "on" if d["status"] == "доставлен" else "out") for d in a], "зачёркнуты — не прошли $match"),
             ("op", "$match<br>доставлен"),
             ("col", "выход · 2", [(row(d, "number", "status"), "on") for d in a if d["status"] == "доставлен"], None)]
    second = [("col", "$match, $sort · доставленные, новые первыми", [(row(d, "number", "status"), "on" if i < 5 else "cut") for i, d in enumerate(b)] + [("… ещё 61", "cut")], None),
              ("op", "$limit 5"),
              ("col", "выход · 5", [(row(d, "number", "status"), "on") for d in b[:5]], None)]
    body = '<b class="cap">$limit до $match</b>' + lane(first) + '<b class="cap" style="margin-top:14px">$match до $limit</b>' + lane(second)
    return block("4.1 order", "Те же стадии в двух порядках", "2 и 5 документов",
                 "На схеме — два конвейера из тех же стадий. Сверху предел срабатывает раньше отбора, снизу — позже.",
                 body, "Сверху <code>$limit</code> оставил пять самых новых заказов любого статуса, и <code>$match</code> нашёл среди них два доставленных. Снизу сначала отобраны доставленные, и предел берёт пять из них.")


# ── 4.2 и 4.3: поле в следующей стадии ────────────────────────────────────

@vis("4.2", "$project до и после $match")
def p_place():
    docs = agg('[{$match: {status: "в пути"}}, {$sort: {_id: 1}}, {$limit: 5}, {$project: {number: 1, total: 1, status: 1}}]')
    first = agg('[{$sort: {_id: 1}}, {$limit: 5}, {$project: {number: 1, total: 1}}]')
    a = [("col", "после $project · 120", [(f'{d["number"]} · {num(d["total"])}', "") for d in first] + [("… ещё 115", "skip")], "поля status больше нет"),
         ("op", "$match<br>status «в пути»"),
         ("col", "выход · 0", [("ни один документ", "out")], "status отсутствует у всех")]
    b = [("col", "после $match · 13", [(f'{d["number"]} · {d["status"]} · {num(d["total"])}', "on") for d in docs] + [("… ещё 8", "skip")], None),
         ("op", "$project<br>number, total"),
         ("col", "выход · 13", [(f'{d["number"]} · {num(d["total"])}', "on") for d in docs] + [("… ещё 8", "skip")], None)]
    body = '<b class="cap">$project до $match</b>' + lane(a) + '<b class="cap" style="margin-top:14px">$match до $project</b>' + lane(b)
    return block("4.2 place", "Какие поля видит следующая стадия", "0 и 13 документов",
                 "На схеме — два конвейера из одних и тех же стадий. В каждом столбце показаны первые пять документов потока. Отличаются поля, которые остались у документа к моменту <code>$match</code>.",
                 body, "<code>$project</code> оставил только <code>number</code> и <code>total</code>. Следующий <code>$match</code> ищет поле <code>status</code> и не находит его ни у одного документа. Во втором конвейере отбор идёт раньше, пока поле ещё есть.")


@vis("4.3", "новое поле в $match и $sort")
def a_next():
    docs = agg('[{$addFields: {sale: {$multiply: ["$price", 0.9]}}}, {$project: {title: 1, sale: 1}}]', "products")
    ok = sorted([d for d in docs if d["sale"] < 30000], key=lambda d: -d["sale"])
    cols = [("col", "после $addFields · 21", [(f'{d["title"][:26]} · {num(round(d["sale"]))}', "on" if d["sale"] < 30000 else "out") for d in docs], "зачёркнуты — sale ≥ 30 000"),
            ("op", "$match<br>sale < 30 000<br>$sort sale −1"),
            ("col", f"после $sort · {len(ok)}", [(f'{d["title"][:26]} · {num(round(d["sale"]))}', "on" if i < 3 else "cut") for i, d in enumerate(ok)], None),
            ("op", "$limit 3"),
            ("col", "выход · 3", [(f'{d["title"][:26]} · {num(round(d["sale"]))}', "on") for d in ok[:3]], None)]
    return block("4.3 next", "Поле sale на ленте конвейера", f"21 → {len(ok)} → 3",
                 "На схеме — 21 товар на ленте конвейера. Поле <code>sale</code> появилось на первой стадии, дальше по нему отбирают и сортируют.",
                 lane(cols), "Цена со скидкой округлена для схемы. <code>$match</code> и <code>$sort</code> работают с полем <code>sale</code> так же, как с полями коллекции: для них это обычное поле документа потока.")


# ── 4.5 $skip, $count, $sortByCount ───────────────────────────────────────

IN_TRANSIT = agg if False else None


@vis("4.5", "вторая страница: $skip и $limit")
def s_page():
    docs = agg('[{$match: {status: "в пути"}}, {$sort: {total: -1}}, {$project: {number: 1, total: 1}}]')
    cols = [("col", "после $sort · 13", [(row(d, "number", "total"), "") for d in docs], None),
            ("op", "$skip 5"),
            ("col", "после $skip · 8", [(row(d, "number", "total"), "skip" if i < 5 else "on" if i < 10 else "") for i, d in enumerate(docs)], "серые — пропущены"),
            ("op", "$limit 5"),
            ("col", "выход · 5", [(row(d, "number", "total"), "on") for d in docs[5:10]], None)]
    return block("4.5 page", "Страница на ленте: $skip, затем $limit", "13 → 8 → 5",
                 "На схеме — 13 заказов в пути после сортировки и что с ними делают <code>$skip</code> и <code>$limit</code>.",
                 lane(cols), "<code>$skip</code> пропускает первые пять документов — первую страницу. Из оставшихся восьми <code>$limit</code> берёт пять — вторую страницу.")


@vis("4.5", "$skip и $limit в двух порядках")
def s_order():
    docs = agg('[{$match: {status: "в пути"}}, {$sort: {total: -1}}, {$project: {number: 1, total: 1}}]')
    a = [("col", "после $sort · 13", [(row(d, "number", "total"), "on" if i < 10 else "cut") for i, d in enumerate(docs)], None), ("op", "$limit 10"),
         ("col", "после $limit · 10", [(row(d, "number", "total"), "skip" if i < 5 else "on") for i, d in enumerate(docs[:10])], None), ("op", "$skip 5"),
         ("col", "выход · 5", [(row(d, "number", "total"), "on") for d in docs[5:10]], None)]
    b = [("col", "после $sort · 13", [(row(d, "number", "total"), "skip" if i < 5 else "on") for i, d in enumerate(docs)], None), ("op", "$skip 5"),
         ("col", "после $skip · 8", [(row(d, "number", "total"), "on") for d in docs[5:]], None), ("op", "$limit 10"),
         ("col", "выход · 8", [(row(d, "number", "total"), "on") for d in docs[5:]], "предел 10 не достигнут")]
    body = '<b class="cap">$limit 10, затем $skip 5</b>' + lane(a) + '<b class="cap" style="margin-top:14px">$skip 5, затем $limit 10</b>' + lane(b)
    return block("4.5 order", "Пропуск и предел в двух порядках", "5 и 8 документов",
                 "На схеме — те же 13 заказов на двух лентах с одинаковыми стадиями в разном порядке.",
                 body, "Стадии выполняются в порядке списка. Предел до пропуска оставляет десять документов, и пропуск уменьшает их до пяти. Пропуск до предела оставляет восемь, и предел 10 их не уменьшает.")


@vis("4.5", "стадия $count")
def s_count():
    docs = agg('[{$match: {status: "доставлен"}}, {$project: {number: 1, city: "$delivery.city"}}]')
    items = [chip(short(d["number"]), None, city_k(d["city"]), i) for i, d in enumerate(docs)]
    body = f'<div class="bins"><div class="bin"><b class="bin__key">$count: "delivered"</b>{chips(items)}<div class="bin__acc">поток заменён одним документом: <b>{{delivered: {len(docs)}}}</b></div></div></div>'
    return block("4.5 count", "Стадия $count считает поток", "69 → 1 документ",
                 "На схеме — 69 доставленных заказов, которые пришли в стадию <code>$count</code>.",
                 body, "<code>$count</code> принимает все документы потока и выпускает один документ с одним полем — их числом. Сами заказы дальше по конвейеру не идут. Цвет фишек — город, как в главе 4.4.")


@vis("4.5", "$count после $group")
def s_countgroups():
    docs = agg(f'[{DELIVERED}, {{$project: {{number: 1, total: 1, city: "$delivery.city"}}}}]')
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        s = sum(d["total"] for d in mine)
        bins.append(binbox(esc(city), [chip(short(d["number"]), None, k, i) for i, d in enumerate(mine)],
                           [f"revenue → <b>{num(s)}</b>", "проходит $match" if s >= 2000000 else "отброшен"], k, "" if s >= 2000000 else "drop"))
    body = (f'<div class="sorter__arrow">$group по городу → $match revenue ≥ 2 000 000 ↓</div><div class="bins">{"".join(bins)}</div>'
            '<div class="sorter__arrow">$count "cities" — считает документы-группы, которые дошли ↓</div>'
            '<div class="bins"><div class="bin"><b class="bin__key">результат</b><div class="bin__acc"><b>{cities: 2}</b></div></div></div>')
    return block("4.5 countgroups", "$count после $group считает группы", "69 → 5 → 2 → 1",
                 "На схеме — что приходит в <code>$count</code> в этом конвейере: не заказы, а группы, оставшиеся после <code>$match</code>.",
                 body, "После <code>$group</code> документ потока — группа. <code>$count</code> считает документы, которые дошли до него, поэтому ответ — две группы.")


@vis("4.5", "$count, когда документов нет")
def s_empty():
    cols = [("col", "вход · 120", [("2026-0001 · доставлен", ""), ("2026-0002 · собирается", ""), ("2026-0003 · доставлен", ""), ("… ещё 117", "skip")], None),
            ("op", "$match<br>status «возврат»"),
            ("col", "после $match · 0", [("документов нет", "out")], "таких заказов нет"),
            ("op", "$count"),
            ("col", "выход · 0", [("документа {returns: 0} нет", "out")], "результат — пустой список")]
    return block("4.5 empty", "$count на пустом потоке", "120 → 0 → 0",
                 "На схеме — лента конвейера, в котором <code>$match</code> не пропустил ни одного документа.",
                 lane(cols), "<code>$count</code> выпускает документ, только если в него что-то пришло. На пустом потоке он не выпускает ничего, и результат запроса пуст. Ноль программа получает сама — по длине результата.", play=False)


@vis("4.5", "$sortByCount и $group с $sort")
def s_sortbycount():
    docs = agg('[{$sort: {_id: 1}}, {$project: {number: 1, status: 1}}]')
    order = [r["_id"] for r in agg('[{$sortByCount: "$status"}]')]
    inp = [chip(short(d["number"]), None, order.index(d["status"]), i) for i, d in enumerate(docs)]
    bins = [binbox(esc(st), [chip(short(d["number"]), None, k, i) for i, d in enumerate(x for x in docs if x["status"] == st)],
                   [f"count → <b>{sum(1 for x in docs if x['status'] == st)}</b>"], k) for k, st in enumerate(order)]
    body = sorter("вход: 120 заказов, цвет — статус", [i.replace("<i", '<i', 1) for i in inp],
                  "$sortByCount: ящик на статус, ящики по убыванию числа фишек ↓", bins)
    body = body.replace('<div class="chips">', '<div class="chips mini">')
    return block("4.5 sortbycount", "Ящики $sortByCount", "120 → 4 группы",
                 "На схеме — 120 заказов, разложенные стадией <code>$sortByCount</code> по статусу.",
                 body, "Это те же ящики, что у <code>$group</code> с <code>{\"$sum\": 1}</code>, только ящики сразу выставлены по убыванию числа фишек: так работает пара <code>$group</code> и <code>$sort</code>.")


# ── 4.6 $unwind ───────────────────────────────────────────────────────────

CATS = ["ноутбуки", "смартфоны", "периферия", "комплектующие", "аксессуары"]


@vis("4.6", "позиции заказов по категориям")
def u_category():
    lines = agg('[{$sort: {_id: 1}}, {$unwind: "$items"}, {$project: {qty: "$items.qty", price: "$items.price", cat: "$items.category"}}]')
    bins = []
    for k, cat in enumerate(CATS):
        mine = [l for l in lines if l["cat"] == cat]
        items = [chip(f'×{l["qty"]}', None, k, i) for i, l in enumerate(mine)]
        bins.append(binbox(esc(cat), items, [f"lines: $sum 1 → <b>{len(mine)}</b>", f"qty → <b>{sum(l['qty'] for l in mine)}</b>",
                                             f"revenue → <b>{num(sum(l['qty'] * l['price'] for l in mine))}</b>"], k))
    body = (f'<div class="sorter__arrow">$unwind items: 120 заказов → 271 позиция; $group по items.category ↓</div>'
            f'<div class="bins">{"".join(bins)}</div>').replace('<div class="chips">', '<div class="chips mini">')
    return block("4.6 category", "Позиции заказов в ящиках категорий", "271 позиция → 5 групп",
                 "На схеме — 271 позиция после <code>$unwind</code>, разложенная стадией <code>$group</code> по категории. Фишка — одна позиция, на ней количество штук.",
                 body, "До <code>$unwind</code> в ящик пришлось бы класть заказ целиком, а в заказе бывают позиции разных категорий. После разворота каждая позиция — отдельный документ и попадает в ящик своей категории. Аккумуляторы складывают штуки и произведения количества на цену.")


# ── 4.7 $push, $addToSet, $first, $last ───────────────────────────────────

@vis("4.7", "$push: номера заказов в пути по городам")
def g_push():
    docs = agg('[{$match: {status: "в пути"}}, {$sort: {number: 1}}, {$project: {number: 1, city: "$delivery.city"}}]')
    order = sorted({d["city"] for d in docs})
    inp = [chip(short(d["number"]), None, CITIES.index(d["city"]), i) for i, d in enumerate(docs)]
    bins = []
    for city in order:
        mine = [d for d in docs if d["city"] == city]
        k = CITIES.index(city)
        bins.append(binbox(esc(city), [chip(short(d["number"]), None, k, i) for i, d in enumerate(mine)],
                           ["numbers: $push →<br><b>[" + ", ".join(d["number"] for d in mine) + "]</b>"], k))
    body = sorter("вход: 13 заказов в пути после $sort по номеру", inp, "$group по городу, $push $number — содержимое ящика становится массивом ↓", bins)
    return block("4.7 push", "$push: ящик становится массивом", "13 заказов → 4 группы",
                 "На схеме — 13 заказов в пути в ящиках городов. Под ящиком — массив, который собрал <code>$push</code>.",
                 body, "<code>$push</code> кладёт в массив значение каждой фишки ящика в том порядке, в каком фишки пришли. Перед <code>$group</code> заказы отсортированы по номеру, поэтому и в массивах номера по возрастанию.")


@vis("4.7", "$push и $addToSet: категории покупок")
def g_set():
    lines = agg('[{$match: {customer_id: "c-007"}}, {$sort: {_id: 1}}, {$unwind: "$items"}, {$project: {cat: "$items.category"}}]')
    items = [chip(l["cat"][:5] + ".", None, CATS.index(l["cat"]), i) for i, l in enumerate(lines)]
    uniq = sorted({l["cat"] for l in lines})
    bins = [binbox("c-007", items, ["all: $push → <b>" + str(len(lines)) + " элементов</b>, с повторами",
                                    "unique: $addToSet → <b>" + str(len(uniq)) + " элементов</b>: " + ", ".join(uniq)])]
    body = f'<div class="sorter__arrow">$unwind items, $group по customer_id ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.7 set", "Один ящик, два аккумулятора", "15 позиций → 1 группа",
                 "На схеме — 15 позиций покупателя c-007 в одном ящике. Цвет фишки — категория.",
                 body, "<code>$push</code> переносит в массив каждую фишку. <code>$addToSet</code> кладёт значение, только если такого в массиве ещё нет: из семи фишек «периферия» в массив попадает одна. Здесь множество выписано по алфавиту, как в выводе после <code>$sortArray</code>.")


def first_last_bins(sort_js):
    docs = agg('[{$match: {customer_id: {$in: ["c-007", "c-011", "c-018"]}}}' + sort_js + ', {$project: {number: 1, customer_id: 1, created: 1}}]')
    bins = []
    for k, c in enumerate(["c-007", "c-011", "c-018"]):
        mine = [d for d in docs if d["customer_id"] == c]
        items = [chip(short(d["number"]), d["created"][8:10] + "." + d["created"][5:7], k, i, "hl" if i in (0, len(mine) - 1) else "") for i, d in enumerate(mine)]
        bins.append(binbox(c, items, [f"$first → <b>{mine[0]['number']}</b>", f"$last → <b>{mine[-1]['number']}</b>"], k))
    return f'<div class="bins">{"".join(bins)}</div>'


@vis("4.7", "$first и $last после $sort")
def g_first():
    body = '<div class="sorter__arrow">$sort created 1, затем $group по customer_id ↓</div>' + first_last_bins(", {$sort: {created: 1}}")
    return block("4.7 first_last", "$first и $last: первая и последняя фишка ящика", "3 покупателя",
                 "На схеме — заказы трёх покупателей в ящиках. Фишки лежат в том порядке, в каком пришли в <code>$group</code>: по дате создания. Под номером — дата.",
                 body, "Обведены первая и последняя фишка каждого ящика: из них <code>$first</code> и <code>$last</code> берут номер. Порядок фишек задала стадия <code>$sort</code> перед группировкой.")


@vis("4.7", "$first и $last без $sort")
def g_unsorted():
    body = '<div class="sorter__arrow">$group по customer_id без $sort — фишки в порядке хранения ↓</div>' + first_last_bins(", {$sort: {_id: 1}}")
    return block("4.7 unsorted", "Те же ящики без сортировки", "3 покупателя",
                 "На схеме — те же ящики, но фишки лежат в порядке хранения, по <code>_id</code>. Даты под номерами идут вразнобой.",
                 body, "Обведённые фишки теперь другие: первым в ящик попал заказ с наименьшим номером, хотя он не самый ранний. Порядок хранения сервер не гарантирует, поэтому без <code>$sort</code> ответ может измениться.")


@vis("4.7", "самый дорогой заказ города")
def g_top():
    docs = agg('[{$sort: {total: -1}}, {$project: {number: 1, total: 1, city: "$delivery.city"}}]')
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        items = [chip(short(d["number"]), num(d["total"]), k, i, "hl" if i == 0 else "") for i, d in enumerate(mine[:8])]
        items.append(chip("…", f"ещё {len(mine) - 8}"))
        bins.append(binbox(esc(city), items, [f"$first → <b>{mine[0]['number']} · {num(mine[0]['total'])}</b>"], k))
    body = f'<div class="sorter__arrow">$sort total −1, затем $group по городу ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.7 top", "Первая фишка — самый дорогой заказ", "120 заказов → 5 групп",
                 "На схеме — ящики городов после сортировки всех заказов по сумме. В каждом ящике показаны восемь первых фишек.",
                 body, "Заказы пришли в <code>$group</code> от дорогих к дешёвым, поэтому первая фишка каждого ящика — самый дорогой заказ города. Оба <code>$first</code> берут номер и сумму из этой фишки.")


# ── 4.8 $bucket, $bucketAuto ──────────────────────────────────────────────

BOUNDS = [0, 10000, 50000, 100000, 200000, 500000]


def shelves(docs, bounds, default=None):
    bins = []
    for k in range(len(bounds) - 1):
        mine = [d for d in docs if bounds[k] <= d["total"] < bounds[k + 1]]
        bins.append(binbox(f"_id {bounds[k]}<br>{num(bounds[k])} — {num(bounds[k + 1] - 1)}", [chip(short(d["number"]), None, k, i) for i, d in enumerate(mine)],
                           [f"count → <b>{len(mine)}</b>"], k))
    if default is not None:
        mine = [d for d in docs if d["total"] >= bounds[-1]]
        bins.append(binbox(f"default<br>«{default}»", [chip(short(d["number"]), None, 5, i) for i, d in enumerate(mine)], [f"count → <b>{len(mine)}</b>"], 5))
    return f'<div class="bins">{"".join(bins)}</div>'.replace('<div class="chips">', '<div class="chips mini">')


@vis("4.8", "$bucket: заказы по диапазонам суммы")
def b_bucket():
    docs = agg('[{$sort: {total: 1}}, {$project: {number: 1, total: 1}}]')
    body = '<div class="sorter__arrow">$bucket по total, границы 0 · 10 000 · 50 000 · 100 000 · 200 000 · 500 000 ↓</div>' + shelves(docs, BOUNDS)
    return block("4.8 bucket", "Корзины $bucket — полки с границами", "120 заказов → 5 корзин",
                 "На схеме — 120 заказов, разложенные по корзинам. Корзина — ящик, ключ которого — диапазон суммы.",
                 body, "Для каждого заказа сервер ищет корзину, в диапазон которой попадает <code>total</code>, и кладёт его туда. Внутри корзины заказы показаны по возрастанию суммы. Ящики выходят в порядке границ.")


@vis("4.8", "документы вне границ и default")
def b_default():
    docs = agg('[{$sort: {total: 1}}, {$project: {number: 1, total: 1}}]')
    body = ('<div class="sorter__arrow">границы 0 · 10 000 · 50 000 · 100 000 · 200 000 и default «200000 и больше» ↓</div>'
            + shelves(docs, BOUNDS[:-1], "200000 и больше"))
    return block("4.8 default", "Корзина default для значений вне границ", "120 заказов → 5 корзин",
                 "На схеме — та же раскладка, но последняя граница — 200 000. Заказам дороже некуда лечь, и для них заведена корзина <code>default</code>.",
                 body, "Без <code>default</code> первая же фишка дороже 200 000 не находит корзину, и запрос завершается ошибкой 40066. С <code>default</code> все такие фишки ложатся в одну корзину с заданным ключом.")


@vis("4.8", "$bucketAuto: четыре корзины")
def b_auto():
    docs = agg('[{$sort: {total: 1, _id: 1}}, {$project: {number: 1, total: 1}}]')
    res = agg('[{$bucketAuto: {groupBy: "$total", buckets: 4}}]')
    bins = []
    for k, r in enumerate(res):
        lo, hi = r["_id"]["min"], r["_id"]["max"]
        last = k == len(res) - 1
        mine = [d for d in docs if lo <= d["total"] and (d["total"] <= hi if last else d["total"] < hi)]
        bins.append(binbox(f"min {num(lo)}<br>max {num(hi)}", [chip(short(d["number"]), None, k, i) for i, d in enumerate(mine)], [f"count → <b>{len(mine)}</b>"], k))
    body = ('<div class="sorter__arrow">$bucketAuto: 120 заказов по возрастанию суммы делятся на 4 части поровну ↓</div>'
            f'<div class="bins">{"".join(bins)}</div>').replace('<div class="chips">', '<div class="chips mini">')
    return block("4.8 auto", "$bucketAuto: поровну фишек в ящике", "120 заказов → 4 корзины",
                 "На схеме — те же 120 заказов, разложенные стадией <code>$bucketAuto</code> на четыре корзины.",
                 body, "Сервер выстраивает заказы по сумме и режет строй на четыре равные части по 30. Границы корзин — суммы на местах разреза, их не задавали заранее.")


# ── 4.9 $replaceWith ──────────────────────────────────────────────────────

@vis("4.9", "группировка после $replaceWith")
def r_group():
    docs = agg('[{$match: {status: "в пути"}}, {$sort: {_id: 1}}, {$replaceWith: "$delivery"}]')
    types = sorted({d["type"] for d in docs})
    inp = [chip(d["type"][:6] + ".", f'{d["days"]} дн.', types.index(d["type"]), i) for i, d in enumerate(docs)]
    bins = []
    for k, t in enumerate(types):
        mine = [d for d in docs if d["type"] == t]
        bins.append(binbox(esc(t), [chip(f'{d["days"]} дн.', None, k, i) for i, d in enumerate(mine)],
                           [f"orders → <b>{len(mine)}</b>", f"days: $avg → {sum(d['days'] for d in mine)} ÷ {len(mine)} = <b>{num(sum(d['days'] for d in mine) / len(mine))}</b>"], k))
    body = sorter("вход $group: 13 документов доставки после $replaceWith", inp, "$group по $type — поле теперь на верхнем уровне ↓", bins)
    return block("4.9 group", "Документы доставки в ящиках способа доставки", "13 → 2 группы",
                 "На схеме — 13 документов доставки, которые получились из заказов в пути, и их раскладка по способу доставки.",
                 body, "После <code>$replaceWith</code> у каждого документа только поля <code>city</code>, <code>type</code> и <code>days</code>. Ключ группы — <code>\"$type\"</code>, без префикса <code>delivery.</code>. Среднее <code>days</code> считается по фишкам ящика.")


# ── 4.10 витрина ──────────────────────────────────────────────────────────

QUARTER = '{$match: {status: "доставлен", created: {$gte: ISODate("2026-04-01"), $lt: ISODate("2026-07-01")}}}'


@vis("4.10", "раздел 2")
def v_months():
    docs = agg(f'[{QUARTER}, {{$sort: {{created: 1}}}}, {{$project: {{number: 1, total: 1, created: 1}}}}]')
    names = {"04": "апрель", "05": "май", "06": "июнь"}
    bins = []
    for k, m in enumerate(["04", "05", "06"]):
        mine = [d for d in docs if d["created"][5:7] == m]
        bins.append(binbox(f"{names[m]}<br>_id 2026-{m}-01", [chip(short(d["number"]), d["created"][8:10] + "." + m, k, i) for i, d in enumerate(mine)],
                           [f"orders → <b>{len(mine)}</b>", f"revenue → <b>{num(sum(d['total'] for d in mine))}</b>"], k))
    body = f'<div class="sorter__arrow">$bucket по created: границы 1 апреля · 1 мая · 1 июня · 1 июля ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.10 months", "Корзины-месяцы", "26 заказов → 3 корзины",
                 "На схеме — 26 доставленных заказов квартала в корзинах-месяцах. Под номером — дата создания.",
                 body, "Корзина берёт даты от своей границы включительно до следующей. Заказ от 30 июня ложится в июнь, потому что граница 1 июля в корзину не входит.")


@vis("4.10", "раздел 7")
def v_best():
    docs = agg(f'[{QUARTER}, {{$sort: {{total: -1}}}}, {{$project: {{number: 1, total: 1, city: "$delivery.city"}}}}]')
    bins = []
    for k, city in enumerate(CITIES):
        mine = [d for d in docs if d["city"] == city]
        bins.append(binbox(esc(city), [chip(short(d["number"]), num(d["total"]), k, i, "hl" if i == 0 else "") for i, d in enumerate(mine)],
                           [f"$first → <b>{mine[0]['number']}</b>"], k))
    body = f'<div class="sorter__arrow">$sort total −1, затем $group по городу ↓</div><div class="bins">{"".join(bins)}</div>'
    return block("4.10 best", "Первая фишка ящика — самый дорогой заказ", "26 заказов → 5 групп",
                 "На схеме — доставленные заказы квартала в ящиках городов после сортировки по сумме.",
                 body, "Обведена первая фишка каждого ящика — из неё <code>$first</code> берёт номер и сумму. Остальные фишки на результат не влияют.")


# ── запуск ────────────────────────────────────────────────────────────────

def run(chapter: str) -> None:
    for (ch, caption), fn in VIS.items():
        if chapter in ("all", ch):
            insert(ch, caption, fn())


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "all")
