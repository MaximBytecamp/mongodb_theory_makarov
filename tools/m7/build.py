"""Модуль 7: сборка глав из тела в tools/m7/body/7.N.html.

    python3 tools/m7/build.py          # собрать все главы
    python3 tools/m7/run.py            # затем вписать запросы и их выводы

Тело главы начинается с разделов <h2 id="sN">; оглавление «В этой главе»
собирается по ним. Маркеры запросов <!--Q 7.N имя--><!--/Q--> заполняет run.py.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BODY = os.path.join(ROOT, "tools", "m7", "body")

# номер, папка, заголовок (перенос — «|»), краткое имя для пагинатора, вводный абзац,
# паспорт: связанные темы, зачем знать; файл данных или None
CH = [
    ("7.1", "70-gde-primenyat", "Каким данным подходит|документная модель", "Каким данным подходит документная модель",
     "В этой главе разобрано, по каким признакам данных и запросов видно, что их удобно хранить в MongoDB, а по каким — что удобнее реляционная база. Признаки собраны в таблицу, к каждому дан пример из бизнеса. Отдельно разобраны типы данных, с которыми документная модель экономит работу, и цена этой экономии.",
     "Документ и BSON (глава 1.2), вложенные документы (глава 2.1), $jsonSchema (глава 3.1), индексы (глава 3.2), $lookup (глава 6.1)",
     "Объяснить заказчику и команде, почему для задачи выбрана MongoDB или почему выбрана другая база", None),
    ("7.2", "71-veterinarnaya-klinika", "Ветеринарная клиника:|карточка животного", "Ветеринарная клиника: карточка животного",
     "В этой главе разобрана база ветеринарной клиники: карточки животных разных видов, приёмы с анализами, справочник диагнозов и владельцы. На ней показано, как документ хранит данные, у которых набор полей зависит от вида животного и от болезни, и какие задачи клиники решаются одним запросом: экран врача, проверка аллергии, напоминания о прививках, сводка для закупки.",
     "Вложенные документы и массивы (главы 2.1, 2.6), $jsonSchema (глава 3.1), индексы (глава 3.2), $group (глава 4.4), $filter (глава 5.2), $lookup с конвейером (глава 6.2)",
     "Проектировать коллекции для предметной области, где у записей разный набор полей, и разделять медицинские и персональные данные",
     "vet.js"),
    ("7.3", "72-katalogi-i-ankety", "Каталоги и анкеты|с разными полями", "Каталоги и анкеты с разными полями",
     "В этой главе разобраны две задачи, где число возможных полей заранее не известно: каталог товаров с характеристиками и анкеты, у которых меняются вопросы. Для каталога показан шаблон атрибутов — характеристики хранятся массивом пар «имя — значение» и ищутся по одному индексу. Для анкет — хранение ответов вместе с версией формы.",
     "$elemMatch и $all (глава 2.6), составные индексы (глава 3.2), explain (глава 3.3), $facet (глава 4.8), $unwind (глава 4.6)",
     "Строить поиск и фильтры по характеристикам, которых сотни, и не переделывать базу при каждой новой форме",
     "zoo.js"),
    ("7.4", "73-potoki-sobytiy", "Потоки событий: датчики,|журналы, телеметрия", "Потоки событий: датчики, журналы, телеметрия",
     "В этой главе разобраны данные, которые приходят непрерывно и не меняются после записи: показания датчиков, события журналов, телеметрия. На примере датчиков температуры в холодильниках с вакцинами показана коллекция временных рядов: как сервер складывает замеры в корзины, как найти выход за допустимую температуру и собрать сводку по часам.",
     "Индексы (глава 3.2), $group и аккумуляторы (глава 4.4), журнал logs.events (глава 3.6)",
     "Хранить и разбирать показания оборудования и журналы так, чтобы объём данных не замедлял отчёты",
     "fridge.js"),
    ("7.5", "74-biznes-processy", "Бизнес-процессы:|заявки, статусы, история", "Бизнес-процессы: заявки, статусы, история",
     "В этой главе разобрана заявка, которая проходит этапы: принята, диагностика, ожидание запчасти, ремонт, выдача. На примере сервисного центра показано, как хранить заявку вместе с историей этапов, как найти застрявшие заявки и посчитать, на каком этапе процесс теряет больше всего времени. В конце — другие процессы, которые устроены так же.",
     "Обновление (глава 1.7), $group (глава 4.4), $unwind (глава 4.6), $map (глава 5.3), обновление конвейером",
     "Видеть процесс компании в данных: где очередь, где задержка, что изменить в первую очередь",
     "repair.js"),
    ("7.6", "75-kogda-ne-mongodb", "Где MongoDB не нужна|и как её сочетают с SQL", "Где MongoDB не нужна и как её сочетают с SQL",
     "В этой главе разобраны задачи, для которых реляционная база подходит лучше: деньги и остатки, связи многие-ко-многим, отчётность с произвольными соединениями. Показано, как в одной системе сочетают PostgreSQL и MongoDB, и как защитить данные в каждой из них. В конце — сводная таблица модуля и задание: выбрать хранилище для заказчика и обосновать выбор.",
     "Транзакции и уровни подтверждения записи (кейсы, §2), $jsonSchema (глава 3.1), роли и доступ (кейсы, §1)",
     "Принимать решение о базе данных с учётом рисков, а не привычки, и объяснять это решение письменно",
     None),
]

STYLE = """
    .steps { counter-reset: step; margin: 18px 0; padding: 0; list-style: none; }
    .steps > li { position: relative; margin: 0 0 12px; padding: 12px 16px 12px 52px; border: 2px solid var(--ink); background: var(--page); }
    .steps > li::before { counter-increment: step; content: counter(step); position: absolute; left: 12px; top: 11px; width: 26px; height: 26px; display: grid; place-items: center; background: var(--ink); color: var(--leaf-bright); font: 700 13px/1 var(--mono); }
    .steps > li > b:first-child { display: block; margin-bottom: 3px; }
    .scheme { margin: 20px 0; border: 3px solid var(--ink); box-shadow: 6px 6px 0 var(--ink); background: var(--page); }
    .scheme__head { padding: 7px 14px; background: var(--ink); color: var(--leaf-pale); font: 600 10.5px/1.4 var(--pixel); letter-spacing: 1.1px; text-transform: uppercase; }
    .scheme__body { padding: 14px 16px 10px; overflow-x: auto; }
    .scheme__note { margin: 0; padding: 9px 16px 12px; font-size: 14.5px; line-height: 1.5; color: var(--ink-soft); border-top: 1px solid var(--rule); }
    .split { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 14px; align-items: start; }
    .split > div > b { display: block; margin-bottom: 6px; font: 600 12.5px/1.4 var(--mono); }
    .split__arrow { align-self: center; font: 700 13px/1.3 var(--mono); color: var(--leaf); white-space: nowrap; }
    .split .card { margin: 0 0 8px; padding: 6px 9px; border: 2px solid var(--ink); background: var(--paper); font: 400 12.5px/1.55 var(--mono); }
    .split .card .in { display: block; padding-left: 14px; }
    .on1 { background: #C8EEDA; }
    .on2 { background: #E4DDF5; }
    .on3 { background: #FBE3C4; }
    table.mt { width: 100%; border-collapse: collapse; font: 400 13px/1.45 var(--mono); background: transparent; }
    table.mt th { padding: 5px 8px; text-align: left; font: 600 12px/1.4 var(--mono); letter-spacing: 0; text-transform: none; background: transparent; border-bottom: 2px solid var(--ink); }
    table.mt td { padding: 4px 8px; border-bottom: 1px solid var(--rule); vertical-align: top; }
    table.mt td.ok { color: var(--leaf); font-weight: 700; }
    table.mt td.bad { color: var(--clay); font-weight: 700; }
    .fit { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin: 20px 0; }
    .fit > div { padding: 13px 15px; border: 3px solid var(--ink); background: var(--page); box-shadow: 5px 5px 0 var(--leaf); }
    .fit > div.no { box-shadow: 5px 5px 0 var(--clay); }
    .fit b { display: block; margin-bottom: 6px; font: 600 10.5px/1.4 var(--pixel); letter-spacing: 1.1px; text-transform: uppercase; color: var(--leaf); }
    .fit > div.no b { color: var(--clay); }
    .fit p { margin: 0 0 6px; font-size: 15px; }
    .fit p:last-child { margin: 0; }
    .colls { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
    .colls > div { border: 2px solid var(--ink); background: var(--paper); }
    .colls > div > b { display: block; padding: 5px 9px; background: var(--ink); color: var(--leaf-pale); font: 600 12px/1.4 var(--mono); }
    .colls > div > p { margin: 0; padding: 7px 9px; font: 400 12.5px/1.5 var(--mono); }
    .colls > div.pd > b { background: var(--clay); color: #fff; }
    .flowline { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 4px 0; font: 400 12.5px/1.4 var(--mono); }
    .flowline span { padding: 4px 9px; border: 2px solid var(--ink); background: var(--paper); }
    .flowline span.hot { background: var(--clay-pale); border-color: var(--clay); font-weight: 700; }
    .flowline i { font-style: normal; color: var(--leaf); font-weight: 700; }
    .bar { display: grid; grid-template-columns: 130px minmax(0, 1fr) 70px; gap: 8px; align-items: center; margin: 5px 0; font: 400 12.5px/1.4 var(--mono); }
    .bar > span:nth-child(2) { height: 16px; background: var(--leaf); }
    .bar.hot > span:nth-child(2) { background: var(--clay); }
    @media (max-width: 640px) { .split { grid-template-columns: 1fr; } .split__arrow { justify-self: center; transform: rotate(90deg); } .bar { grid-template-columns: 96px minmax(0, 1fr) 56px; } }
    @media (max-width: 560px) { table.mt { font-size: 12px; } table.mt th, table.mt td { padding: 4px 5px; } }
"""

HEAD = """<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F1EFE6">
  <title>{num} {plain} · Справочник по MongoDB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Literata:ital,opsz,wght@0,7..72,600;0,7..72,700;1,7..72,400&family=Pixelify+Sans:wght@500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles.css">
  <script>
    /* Язык драйвера проставляется до отрисовки: иначе при загрузке мелькает Python. */
    try {{ document.documentElement.dataset.lang = localStorage.getItem('mongodb-book-lang') || 'python'; }} catch (e) {{}}
    /* Система — до отрисовки по той же причине; без сохранённого выбора определяется по браузеру. */
    (function () {{
      var os = null;
      try {{ os = localStorage.getItem('mongodb-book-os'); }} catch (e) {{}}
      if (!os) {{
        var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
        os = /win/i.test(p) ? 'win' : /mac|iphone|ipad/i.test(p) ? 'mac' : 'linux';
      }}
      document.documentElement.dataset.os = os;
    }})();
  </script>
  <style>{style}  </style>
</head>
<body>
  <div class="book">
    <div class="book__body">
      <div class="spine"><span>Модуль 7 · Где применять MongoDB</span></div>

      <main class="leaf">
        <div class="running">
          <p class="eyebrow"><a href="../../index.html" style="text-decoration:none;color:inherit">Справочник по MongoDB</a> · модуль 7 · где применять MongoDB</p>
          <p class="running__folio">{num}</p>
        </div>

        <header class="chapter-head">
          <span class="chapter-num">{num}</span>
          <h1>{title}</h1>
          <p class="lead">{lead}</p>
        </header>

        <dl class="passport">
          <div><dt>Категория</dt><dd>Применение и проектирование</dd></div>
          <div><dt>Уровень</dt><dd>Средний</dd></div>
          <div><dt>Связанные темы</dt><dd>{related}</dd></div>
          <div><dt>Зачем это знать</dt><dd>{why}</dd></div>
        </dl>

{runbox}
        <nav class="contents">
          <b>В этой главе</b>
          <ol>
{toc}
          </ol>
        </nav>

"""

RUNBOX_DATA = """        <div class="runbox">
          <p class="runbox__head">Как запускать примеры этой главы</p>
          <div class="runbox__row"><b>Базы</b><span>Глава работает в песочнице <code>sandbox</code>. Файл данных пересоздаёт коллекции главы, базы курса не меняются.</span></div>
          <div class="runbox__row"><b>Данные</b><span><a href="dannye/{seed}" download><code>{seed}</code></a> — скачайте файл и загрузите: <code>mongosh {seed}</code>, а на стенде в Docker — <code>docker exec -i course-mongo mongosh &lt; {seed}</code>.</span></div>
          <div class="runbox__row"><b>Запуск</b><span>Запросы вводятся в оболочке: <code>mongosh sandbox</code> или <code>docker exec -it course-mongo mongosh sandbox</code>. В Compass то же самое — во вкладке <b>MONGOSH</b> внизу окна, перед запросами выполнить <code>use sandbox</code>.</span></div>
          <div class="runbox__row"><b>Язык</b><span>Запросы модуля записаны для оболочки <code>mongosh</code>: модуль разбирает, для каких данных и задач подходит MongoDB. На драйверах те же запросы записываются так, как показано в модулях 1–6.</span></div>
          <div class="runbox__row"><b>Порядок</b><span>Запросы выполняются по порядку. Те, что меняют данные, отмечены в тексте; чтобы пройти главу заново, загрузите файл данных ещё раз.</span></div>
        </div>
"""

RUNBOX_NONE = """        <div class="runbox">
          <p class="runbox__head">Как читать эту главу</p>
          <div class="runbox__row"><b>Базы</b><span>В главе нет запросов к стенду: она разбирает выбор базы данных. Запросы, на которые она ссылается, выполняются в главах 7.2–7.5.</span></div>
        </div>
"""

TAIL = """
        <div class="pager">{prev}{next}</div>

        <div class="colophon">
          <span>Глава {num} · Справочник по MongoDB</span>
          <span class="author-line">Автор: Макаров Максим Николаевич</span>
        </div>
      </main>
    </div>
  </div>
  <script src="../../book.js"></script>
</body>
</html>
"""


def toc(body):
    items = re.findall(r'<h2 id="(s\d+)"><span class="sec">§\d+</span>(.*?)</h2>', body)
    return "\n".join('            <li><a href="#%s">%s</a></li>' % (i, t) for i, t in items)


def main():
    for k, (num, folder, title, plain, lead, related, why, seed) in enumerate(CH):
        body = io.open(os.path.join(BODY, num + ".html"), encoding="utf-8").read().strip("\n")
        path = os.path.join(ROOT, "temy", folder, "index.html")
        # Уже вписанные run.py блоки запросов переносятся в новую сборку, чтобы
        # сборка без стенда не стирала выводы.
        if os.path.exists(path):
            old = io.open(path, encoding="utf-8").read()
            done = dict(re.findall(r"(<!--Q [\d.]+ \w+-->)(.*?)<!--/Q-->", old, re.S))
            body = re.sub(r"(<!--Q [\d.]+ \w+-->)(.*?)(<!--/Q-->)",
                          lambda m: m.group(1) + done.get(m.group(1), m.group(2)) + m.group(3), body, flags=re.S)
        if k:
            p = CH[k - 1]
            prev = '<a href="../%s/index.html">← %s %s</a>' % (p[1], p[0], p[3])
        else:
            prev = '<a href="../../index.html#modules">← Оглавление</a>'
        if k + 1 < len(CH):
            n = CH[k + 1]
            nxt = '<a href="../%s/index.html">%s %s →</a>' % (n[1], n[0], n[3])
        else:
            nxt = '<a href="../../index.html#modules">Оглавление →</a>'
        runbox = RUNBOX_DATA.format(seed=seed) if seed else RUNBOX_NONE
        page = HEAD.format(num=num, plain=plain, title=title.replace("|", "<br>"), lead=lead,
                           related=related, why=why, style=STYLE, runbox=runbox, toc=toc(body))
        page += "        " + body + "\n" + TAIL.format(prev=prev, next=nxt, num=num)
        io.open(path, "w", encoding="utf-8").write(page)
        print(num, path)


if __name__ == "__main__":
    main()
