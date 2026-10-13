/* Рабочий стол практикума «Инженер платформы: индексы журнала».

   1. Данные, состояние, сохранение     6. Письмо 4: ревизия
   2. Общие куски: ключ, полоса         7. Оценка и рецензия
   3. Письмо 1: тип индекса             8. Отчёт
   4. Письмо 2: индекс под запрос       9. Вкладки и события
   5. Письмо 3: вес индексов

   По ходу работы ничего не оценивается: стол показывает план и числа сервера,
   но не сравнивает ответ с верным. Письма открываются кнопкой «Дальше» без условий.
   После «Сдать работу» ответы закрываются и открывается рецензия.
   Работа хранится в localStorage этого браузера. */
(() => {
  const { FROM, LETTERS, TYPES, FIELDS, CASES, QFIELDS, QUERIES, RANK, RANK_NOTE, CALC, QUIZ, AUDIT, WORK } = window.PX;
  const IX = window.IX;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const num = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const mb = bytes => (bytes / 1048576).toFixed(1).replace('.', ',') + ' МБ';

  /* ── 1. Данные, состояние, сохранение ─────────────────────────── */
  /* События журнала лежат столбцами; значения столбца — номера в отсортированном словаре,
     поэтому сравнение номеров даёт тот же порядок, что сравнение значений. -1 — поля нет или null. */
  const EV = IX.ev;
  const DOCS = Array.from({ length: EV.n }, (_, i) => {
    const d = {};
    for (const f of QFIELDS) { const v = EV.rows[f][i]; d[f] = EV.dict[f] ? (v < 0 ? null : EV.dict[f][v]) : v; }
    return d;
  });

  const KEY = 'mongodb-indeksy-v1', SKEY = 'mongodb-indeksy-student';
  const blank = () => ({ open: 1, submitted: false, submittedAt: null,
    types: {}, q: {}, qCur: 0, rank: { order: RANK.slice(), measured: false },
    calc: { n: 1000000, on: ['service_1_status_1'] }, quiz: {}, audit: {}, auditNote: '' });
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v || fallback; } catch (_) { return fallback; } };
  let state = Object.assign(blank(), read(KEY, {}));
  let student = read(SKEY, { name: '', group: '' });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { } };
  const saveStudent = () => { try { localStorage.setItem(SKEY, JSON.stringify(student)); } catch (_) { } };
  let tab = state.submitted ? 5 : Math.min(state.open, 4);
  const locked = () => state.submitted;
  const dis = () => (locked() ? ' disabled' : '');

  /* ── 2. Общие куски ───────────────────────────────────────────── */
  const letterHtml = n => {
    const L = LETTERS[n - 1];
    return `<article class="letter"><div class="letter__head">От: <b>${esc(FROM)}</b><span class="letter__subject">${esc(L.subject)}</span></div>`
      + `<div class="letter__body">${L.body.map(p => `<p>${esc(p)}</p>`).join('')}</div></article>`
      + `<div class="task"><b>Задание</b>${esc(L.task)}</div>`;
  };

  const nextHtml = (n, left) => {
    if (locked()) return '<p class="note">Работа сдана. Ответы можно посмотреть, но не изменить. Рецензия — на вкладке «Рецензия».</p>';
    const warn = left ? `<span class="note">Не заполнено: ${left}. Перейти можно и так — вернуться к письму можно в любой момент до сдачи.</span>` : '';
    if (n < 4) return `<div class="row"><button type="button" class="btn" data-next="${n + 1}">Дальше: письмо ${n + 1} →</button>${warn}</div>`;
    return `<div class="row"><button type="button" class="btn" data-act="submit">Сдать работу</button>${warn}</div>`;
  };

  /* Ключ индекса — список пар [поле, направление]. */
  const keyName = key => key.map(([f, d]) => `${f}_${d}`).join('_');
  const keyText = key => (key.length ? `{ ${key.map(([f, d]) => `${/\./.test(f) ? `"${f}"` : f}: ${d}`).join(', ')} }` : '{ }');
  const keyId = key => key.map(([f, d]) => (d < 0 ? '-' : '') + f).join(',');
  const idKey = id => (id ? id.split(',').map(s => (s[0] === '-' ? [s.slice(1), -1] : [s, 1])) : []);
  /* Индекс, у которого все направления заменены на обратные, даёт те же планы:
     сервер читает его с другого конца. В таблице планов первое поле всегда по возрастанию. */
  const canon = key => keyId(key.length && key[0][1] < 0 ? key.map(([f, d]) => [f, -d]) : key);

  const palette = (fields, key, max) => fields.map(f => {
    const used = key.some(k => k[0] === f);
    return `<button type="button" class="chip chip--field" data-add="${esc(f)}"${used || key.length >= max || locked() ? ' disabled' : ''}>${esc(f)}</button>`;
  }).join('');
  const keyChips = (key, withDir) => (key.length ? key.map(([f, d], i) =>
    `<span class="keychip"><b>${i + 1}</b><span>${esc(f)}</span>`
    + (withDir ? `<button type="button" data-dir="${i}" title="Направление: 1 — по возрастанию, -1 — по убыванию"${dis()}>${d > 0 ? '↑ 1' : '↓ -1'}</button>` : '')
    + (locked() ? '' : `<button type="button" class="keychip__x" data-del="${i}" aria-label="Убрать поле ${esc(f)}">×</button>`) + '</span>').join('')
    : '<span class="zone__empty">Нажмите на поле в списке выше</span>');

  /* Полоса индекса: 1200 записей в порядке ключа. Толстые линии — границы значений первого поля,
     зелёным — записи, которые нужны запросу. */
  const stripHtml = (key, match) => {
    const cols = key.map(([f]) => EV.rows[f]);
    const order = Array.from({ length: EV.n }, (_, i) => i).sort((a, b) => {
      for (let k = 0; k < key.length; k++) { const x = cols[k][a] - cols[k][b]; if (x) return x * key[k][1]; }
      return a - b;
    });
    const first = key[0][0], grouped = EV.dict[first] && EV.dict[first].length <= 8;
    const segs = [];   // [группа, нужна ли запись, длина]
    let runs = 0, need = 0, prev = false;
    order.forEach(i => {
      const g = grouped ? cols[0][i] : 0, on = match(DOCS[i]);
      if (on) { need++; if (!prev) runs++; }
      prev = on;
      const last = segs[segs.length - 1];
      if (last && last[0] === g && last[1] === on) last[2]++; else segs.push([g, on, 1]);
    });
    const bar = segs.map((s, i) => {
      const edge = i === segs.length - 1 || segs[i + 1][0] !== s[0];
      return `<i style="flex-grow:${s[2]}" class="${s[1] ? 'on' : ''}${edge ? ' g' : ''}"></i>`;
    }).join('');
    let lab = '';
    if (grouped) {
      const groups = [];
      segs.forEach(s => { const l = groups[groups.length - 1]; if (l && l[0] === s[0]) l[1] += s[2]; else groups.push([s[0], s[2]]); });
      lab = `<div class="strip__lab">${groups.map(([g, n]) => `<span style="flex-grow:${n}">${esc(g < 0 ? 'null' : EV.dict[first][g])}</span>`).join('')}</div>`;
    }
    const where = runs === 1 ? 'одним участком' : `в ${num(runs)} местах`;
    return `<div class="strip"><span class="lbl">Полоса индекса ${esc(keyName(key))} · 1200 записей</span>`
      + `<div class="strip__scroll"><div class="strip__in"><div class="strip__bar">${bar}</div>${lab}</div></div>`
      + `<em>Запросу нужны записи: <strong>${need}</strong>, они стоят <strong>${where}</strong>.${grouped ? ` Толстые линии — границы значений поля ${esc(first)}.` : ''}</em></div>`;
  };

  /* ── 3. Письмо 1: тип индекса ─────────────────────────────────── */
  const ts = id => (state.types[id] = state.types[id] || { type: '', key: [] });
  const typeDone = c => { const s = ts(c.id); return s.type === 'none' || (s.type && s.key.length); };
  const typeRight = c => { const s = ts(c.id); return s.type === c.type && s.key.join(',') === c.key.join(','); };
  const typeName = id => (TYPES.find(t => t[0] === id) || ['', 'не выбран'])[1];
  const typeAnswer = (type, key) => (type === 'none' ? typeName(type) : `${typeName(type)}, ключ ${keyText(key.map(f => [f, 1]))}`);

  const caseCard = (c, n) => {
    const s = ts(c.id), key = s.key.map(f => [f, 1]);
    return `<article class="card" data-case="${c.id}">`
      + `<div class="card__head"><span>Обращение <b>${n}</b> из ${CASES.length} · ${esc(c.who)}</span><span>коллекция ${c.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(c.text)}</p><pre class="q">${esc(c.query)}</pre>`
      + `<span class="lbl">Тип индекса</span><div class="verdict">${TYPES.map(([id, t]) =>
        `<button type="button" class="chip" data-type="${id}" aria-pressed="${s.type === id}"${dis()}>${esc(t)}</button>`).join('')}</div>`
      + (s.type && s.type !== 'none'
        ? `<span class="lbl">Поля коллекции</span><div class="verdict">${palette(FIELDS[c.coll], key, 3)}</div>`
          + `<span class="lbl">Ключ индекса: порядок полей — порядок нажатий</span><div class="keyline">${keyChips(key, false)}</div>` : '')
      + '</div></article>';
  };
  const typesView = () => {
    const left = CASES.filter(c => !typeDone(c)).length;
    return CASES.map((c, i) => caseCard(c, i + 1)).join('') + nextHtml(1, left ? `${left} из ${CASES.length} обращений без решения` : '');
  };

  /* ── 4. Письмо 2: индекс под запрос ───────────────────────────── */
  const qs = q => (state.q[q.id] = state.q[q.id] || { cur: [], tries: [], pick: '', shown: '' });
  /* В задании может быть два запроса под один индекс: второй лежит в q.also. */
  const parts = q => (q.also ? [{ tag: 'Запрос А', id: q.id, text: q.text, match: q.match }, { tag: 'Запрос Б', id: q.also.id, text: q.also.text, match: q.also.match }]
    : [{ tag: '', id: q.id, text: q.text, match: q.match }]);
  const planOf = (q, key) => {
    const hit = IX.plans[q.id][canon(key)];
    const [stages, keys, docs, n] = hit || IX.base[q.id];
    return { used: !!hit, text: stages.split('>').map(s => (s === 'IXSCAN' ? 'IXSCAN ' + keyName(key) : s)).join(' → '), keys, docs, n, sort: /SORT/.test(stages) };
  };
  const basePlan = q => { const [stages, keys, docs, n] = IX.base[q.id]; return { text: stages.split('>').join(' → '), keys, docs, n }; };
  const queryText = q => parts(q).map(p => (p.tag ? `// ${p.tag}\n` : '') + p.text).join('\n');
  const queryRight = q => { const p = qs(q).pick; return !!p && q.best.includes(idKey(p).map(k => k[0]).join(',')); };

  const tiles = p => `<div class="tiles"><span><strong>${num(p.keys)}</strong><em>ключей индекса прочитано</em></span>`
    + `<span><strong>${num(p.docs)}</strong><em>документов прочитано</em></span><span><strong>${num(p.n)}</strong><em>документов возвращено</em></span></div>`;

  const runHtml = (q, id) => {
    if (!id) return '';
    const key = idKey(id);
    return `<div class="res"><div class="res__head"><span>Индекс ${esc(keyName(key))}</span><span>db.events</span></div><div class="res__pad">`
      + parts(q).map(part => { const p = planOf(part, key);
        return `<span class="lbl">План запроса${part.tag ? ' · ' + part.tag : ''}</span><pre class="q">${esc(p.text)}</pre>${tiles(p)}`
          + (p.used ? '' : '<p class="note">В плане нет стадии IXSCAN: сервер выполнил запрос так же, как без этого индекса.</p>')
          + stripHtml(key, part.match); }).join('') + '</div></div>';
  };

  const triesHtml = q => {
    const st = qs(q);
    if (!st.tries.length) return '<p class="note">Попыток пока нет.</p>';
    const rows = st.tries.map(id => {
      const key = idKey(id), ps = parts(q).map(part => planOf(part, key)), picked = st.pick === id;
      const cell = f => ps.map(f).join(' / ');
      return `<tr class="${picked ? 'is-picked' : ''}"><td><code>${esc(keyText(key))}</code></td><td>${ps.map(p => `<code>${esc(p.text)}</code>`).join('<br>')}</td>`
        + `<td>${cell(p => num(p.keys))}</td><td>${cell(p => num(p.docs))}</td><td>${cell(p => num(p.n))}</td>`
        + `<td>${picked ? '<b>оставлен</b>' : locked() ? '' : `<button type="button" class="btn btn--ghost btn--small" data-pick="${esc(id)}">Оставить этот</button>`}`
        + ` <button type="button" class="btn btn--ghost btn--small" data-show="${esc(id)}">Показать</button></td></tr>`;
    }).join('');
    return '<div class="table-scroll"><table class="tries"><thead><tr><th>Ключ индекса</th><th>План</th><th>Ключей</th><th>Документов</th><th>Возвращено</th><th></th></tr></thead>'
      + `<tbody>${rows}</tbody></table></div>`;
  };

  const queryView = () => {
    const cur = Math.min(state.qCur, QUERIES.length - 1);
    const q = QUERIES[cur], st = qs(q);
    const now = parts(q).map(part => { const b = basePlan(part); return `${part.tag ? part.tag + ': ' : ''}план <code>${esc(b.text)}</code>, документов прочитано ${num(b.docs)}, возвращено ${num(b.n)}`; }).join('; ');
    const pills = QUERIES.map((x, i) => `<button type="button" data-qcur="${i}" aria-current="${i === cur}" class="${qs(x).pick ? 'is-ok' : ''}">${i + 1}</button>`).join('');
    const left = QUERIES.filter(x => !qs(x).pick).length;
    return `<div class="pills" aria-label="Задания">${pills}</div>`
      + `<article class="card"><div class="card__head"><span>Задание <b>${cur + 1}</b> из ${QUERIES.length} · ${esc(q.who)}</span><span>коллекция logs.events</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(q.task)}</p><pre class="q">${esc(queryText(q))}</pre>`
      + `<p class="note">Сейчас, с одним индексом _id_: ${now}.</p></div></article>`
      + '<article class="card"><div class="card__head"><span>Конструктор индекса</span><span>от одного до трёх полей</span></div><div class="card__body">'
      + `<span class="lbl">Поля коллекции</span><div class="verdict">${palette(QFIELDS, st.cur, 3)}</div>`
      + `<span class="lbl">Ключ индекса: порядок полей — порядок нажатий</span><div class="keyline">${keyChips(st.cur, true)}</div>`
      + `<pre class="q">db.events.createIndex(${esc(keyText(st.cur))})</pre>`
      + `<div class="row"><button type="button" class="btn" data-act="run-index"${st.cur.length && !locked() ? '' : ' disabled'}>Создать индекс и выполнить запрос</button>`
      + (locked() ? '' : '<button type="button" class="btn btn--ghost btn--small" data-act="clear-key">Очистить ключ</button>') + '</div>'
      + runHtml(q, st.shown) + '</div></article>'
      + `<article class="card"><div class="card__head"><span>Журнал попыток</span><span>${st.pick ? 'ответ: ' + esc(keyName(idKey(st.pick))) : 'ответ не выбран'}</span></div>`
      + `<div class="card__body">${triesHtml(q)}</div></article>`
      + nextHtml(2, left ? `${left} из ${QUERIES.length} заданий без выбранного индекса` : '');
  };

  /* ── 5. Письмо 3: вес индексов ────────────────────────────────── */
  const SIZE = n => (n <= 1000000 ? IX.sizes[n] : Object.fromEntries(Object.entries(IX.sizes[1000000]).map(([k, v]) => [k, v * n / 1000000])));
  const DATA = n => (n <= 1000000 ? IX.data[n].storageSize : IX.data[1000000].storageSize * n / 1000000);
  const rankTruth = RANK.slice().sort((a, b) => IX.sizes[1000000][a] - IX.sizes[1000000][b]);
  const rankRight = () => (state.rank.measured ? state.rank.order.filter((n, i) => rankTruth[i] === n).length : 0);
  const quizRight = z => state.quiz[z.id] === z.answer;
  const nameKey = name => idKey(name.replace(/_(-?1)(_|$)/g, (m, d, e) => (d === '-1' ? '\u0001' : '') + (e ? ',' : '')).split(',').map(s => (s.endsWith('\u0001') ? '-' + s.slice(0, -1) : s)).join(','));

  const bars = (names, sizes, max) => `<div class="bars">${names.map(n =>
    `<div class="bars__row"><code>${esc(n)}</code><span class="bars__track"><i style="width:${Math.max(1, sizes[n] / max * 100).toFixed(1)}%"></i></span><b>${mb(sizes[n])}</b></div>`).join('')}</div>`;

  const weightView = () => {
    const r = state.rank, big = IX.sizes[1000000];
    let h = '<article class="card"><div class="card__head"><span>Прогноз: размер четырёх индексов</span><span>журнал · 1 000 000 событий</span></div><div class="card__body">'
      + '<p class="card__task">Расставьте индексы по размеру на диске: сверху — наименьший, снизу — наибольший.</p><ol class="rank">'
      + r.order.map((n, i) => `<li><b>${i + 1}</b><span><code>${esc(keyText(nameKey(n)))}</code><small>${esc(RANK_NOTE[n])}</small></span>`
        + (r.measured ? `<em>${mb(big[n])}</em>` : `<span class="rank__tools"><button type="button" class="btn btn--ghost btn--small" data-up="${i}"${i ? '' : ' disabled'} aria-label="Выше">↑</button>`
          + `<button type="button" class="btn btn--ghost btn--small" data-down="${i}"${i < r.order.length - 1 ? '' : ' disabled'} aria-label="Ниже">↓</button></span>`) + '</li>').join('') + '</ol>'
      + (r.measured ? '<p class="note">Порядок закреплён. Справа от каждого индекса — измеренный размер.</p>'
        : `<div class="row"><button type="button" class="btn" data-act="measure"${dis()}>Измерить</button><span class="note">После измерения порядок изменить нельзя.</span></div>`)
      + '</div></article>';

    if (!r.measured) return h + '<p class="note">Калькулятор и вопросы откроются после измерения.</p>' + nextHtml(3, 'прогноз не измерен, 2 вопроса без ответа');

    const c = state.calc, sizes = SIZE(c.n), on = ['_id_'].concat(CALC.filter(n => c.on.includes(n)));
    const total = on.reduce((s, n) => s + sizes[n], 0), data = DATA(c.n);
    const max = Math.max(data, ...CALC.map(n => sizes[n]), sizes._id_);
    const INS = IX.insert, insMax = Math.max(...Object.values(INS));
    h += '<article class="card"><div class="card__head"><span>Калькулятор</span><span>измерено на сервере стенда, MongoDB 7</span></div><div class="card__body">'
      + '<span class="lbl">Событий в журнале</span><div class="verdict">'
      + [[100000, '100 000'], [1000000, '1 000 000'], [10000000, '10 000 000 · оценка']].map(([n, t]) => `<button type="button" class="chip" data-n="${n}" aria-pressed="${c.n === n}">${t}</button>`).join('') + '</div>'
      + '<span class="lbl">Индексы коллекции: _id_ есть всегда</span><div class="verdict">'
      + CALC.map(n => `<button type="button" class="chip chip--field" data-calc="${esc(n)}" aria-pressed="${c.on.includes(n)}">${esc(n)}</button>`).join('') + '</div>'
      + bars(on, sizes, max)
      + `<div class="bars bars--data"><div class="bars__row"><code>данные на диске</code><span class="bars__track"><i style="width:${(data / max * 100).toFixed(1)}%"></i></span><b>${mb(data)}</b></div></div>`
      + `<div class="tiles"><span><strong>${mb(total)}</strong><em>все отмеченные индексы вместе</em></span>`
      + `<span><strong>${Math.round(total / data * 100)}%</strong><em>от размера данных на диске</em></span>`
      + `<span><strong>${on.length + 1}</strong><em>действий при вставке одного события: документ и ${on.length} ${on.length === 1 ? 'индекс' : on.length < 5 ? 'индекса' : 'индексов'}</em></span></div>`
      + '<p class="note">Размер данных и индексов — место на диске после сжатия, которое сервер выполняет сам. Индекс по полю с немногими значениями сжимается сильнее: одинаковые значения в соседних записях хранятся один раз.</p>'
      + '</div></article>';

    h += '<article class="card"><div class="card__head"><span>Время вставки 100 000 событий</span><span>медиана девяти замеров</span></div><div class="card__body">'
      + `<div class="bars">${[['0', 'только _id_'], ['1', '_id_ и 1 индекс'], ['3', '_id_ и 3 индекса'], ['7', '_id_ и 7 индексов']].map(([k, t]) =>
        `<div class="bars__row"><code>${t}</code><span class="bars__track"><i style="width:${(INS[k] / insMax * 100).toFixed(1)}%"></i></span><b>${num(INS[k])} мс</b></div>`).join('')}</div>`
      + `<p class="note">Одна и та же пачка событий вставлялась в пустую коллекцию с разным числом индексов. С семью индексами вставка заняла в ${(INS['7'] / INS['0']).toFixed(1).replace('.', ',')} раза больше времени, чем с одним _id_. На другом компьютере миллисекунды будут другими.</p>`
      + '</div></article>';

    QUIZ.forEach((z, i) => {
      h += `<article class="card" data-quiz="${z.id}"><div class="card__head"><span>Вопрос <b>${i + 1}</b> из ${QUIZ.length}</span><span>нужен калькулятор</span></div><div class="card__body">`
        + `<p class="card__task">${esc(z.q)}</p><div class="verdict">${z.options.map(([v, t]) =>
          `<button type="button" class="chip" data-answer="${v}" aria-pressed="${state.quiz[z.id] === v}"${dis()}>${esc(t)}</button>`).join('')}</div></div></article>`;
    });
    const left = QUIZ.filter(z => !state.quiz[z.id]).length;
    return h + nextHtml(3, left ? `${left} из ${QUIZ.length} вопросов без ответа` : '');
  };

  /* ── 6. Письмо 4: ревизия ─────────────────────────────────────── */
  const auditOf = name => state.audit[name] || '';
  const auditMask = () => AUDIT.reduce((m, a, i) => m | (auditOf(a.name) === 'drop' ? 0 : 1 << IX.keep.indexOf(a.name)), 0);
  const auditRight = a => auditOf(a.name) === (a.drop ? 'drop' : 'keep');

  const workTable = mask => {
    const set = IX.sets[mask], full = IX.sets[127];
    return '<div class="table-scroll"><table class="tries"><thead><tr><th>№</th><th>Запрос к events</th><th>Как часто</th><th>План с оставшимися индексами</th><th>Документов прочитано</th><th>Возвращено</th></tr></thead><tbody>'
      + WORK.map((w, i) => { const [plan, , docs, n] = set[w.id];
        return `<tr><td>${i + 1}</td><td><code>${esc(w.text)}</code></td><td>${esc(w.per)}</td><td><code>${esc(plan)}</code></td>`
          + `<td>${num(docs)}${docs !== full[w.id][2] ? ` <small>было ${num(full[w.id][2])}</small>` : ''}</td><td>${num(n)}</td></tr>`; }).join('')
      + '</tbody></table></div>';
  };

  const auditView = () => {
    const sizes = IX.sizes[1000000], mask = auditMask();
    const kept = AUDIT.filter(a => auditOf(a.name) !== 'drop');
    const all = AUDIT.reduce((s, a) => s + sizes[a.name], 0), now = kept.reduce((s, a) => s + sizes[a.name], 0);
    const rows = AUDIT.map(a => `<tr data-audit="${esc(a.name)}" class="${auditOf(a.name) === 'drop' ? 'is-dropped' : ''}"><td><code>${esc(a.name)}</code><small>${esc(keyText(nameKey(a.name)))}</small></td>`
      + `<td>${esc(a.who)}</td><td>${mb(sizes[a.name])}</td><td><div class="verdict">`
      + `<button type="button" class="chip" data-keep="keep" aria-pressed="${auditOf(a.name) === 'keep'}"${dis()}>Оставить</button>`
      + `<button type="button" class="chip" data-keep="drop" aria-pressed="${auditOf(a.name) === 'drop'}"${dis()}>Удалить</button></div></td></tr>`).join('');
    const left = AUDIT.filter(a => !auditOf(a.name)).length;
    return '<article class="card"><div class="card__head"><span>Индексы коллекции logs.events</span><span>1 000 000 событий</span></div><div class="card__body">'
      + '<div class="table-scroll"><table class="tries audit"><thead><tr><th>Индекс</th><th>Кто создал</th><th>Размер</th><th>Решение</th></tr></thead>'
      + `<tbody><tr class="is-fixed"><td><code>_id_</code><small>{ _id: 1 }</small></td><td>сервер, при создании коллекции</td><td>${mb(sizes._id_)}</td><td>удалить нельзя</td></tr>${rows}</tbody></table></div>`
      + `<div class="tiles"><span><strong>${mb(now)}</strong><em>занимают оставленные индексы; все семь — ${mb(all)}</em></span>`
      + `<span><strong>${kept.length + 2}</strong><em>действий при вставке одного события: документ, _id_ и ${kept.length} из семи индексов</em></span>`
      + `<span><strong>${mb(IX.data[1000000].storageSize)}</strong><em>данные журнала на диске</em></span></div></div></article>`
      + '<article class="card"><div class="card__head"><span>Рабочие запросы</span><span>планы с оставшимися индексами</span></div><div class="card__body">'
      + workTable(mask)
      + '<p class="note">Индекс без решения считается оставленным. «Было» — число документов, которое запрос читал со всеми семью индексами.</p></div></article>'
      + `<div class="field"><label for="audit-note">Комментарий к ревизии</label><textarea id="audit-note" data-note${dis()} placeholder="Почему удалены именно эти индексы.">${esc(state.auditNote)}</textarea></div>`
      + nextHtml(4, left ? `${left} из ${AUDIT.length} индексов без решения` : '');
  };

  /* ── 7. Оценка и рецензия ─────────────────────────────────────── */
  const scores = () => {
    const t = CASES.filter(typeRight).length;
    const q = QUERIES.filter(queryRight).length;
    const w = rankRight() + QUIZ.filter(quizRight).length, wOf = RANK.length + QUIZ.length;
    const a = AUDIT.filter(auditRight).length;
    const parts = [
      { name: 'Письмо 1 · тип индекса', got: t, of: CASES.length, pts: t >= 7 ? 3 : t >= 5 ? 2 : t >= 3 ? 1 : 0, max: 3, unit: 'обращений решено верно' },
      { name: 'Письмо 2 · индекс под запрос', got: q, of: QUERIES.length, pts: q === 5 ? 3 : q === 4 ? 2 : q >= 2 ? 1 : 0, max: 3, unit: 'заданий с наилучшим индексом' },
      { name: 'Письмо 3 · вес индексов', got: w, of: wOf, pts: w >= 5 ? 2 : w >= 3 ? 1 : 0, max: 2, unit: 'мест в прогнозе и ответов верно' },
      { name: 'Письмо 4 · ревизия', got: a, of: AUDIT.length, pts: a === 7 ? 2 : a >= 5 ? 1 : 0, max: 2, unit: 'решений по индексам верно' },
    ];
    const total = parts.reduce((n, p) => n + p.pts, 0);
    const grade = total >= 9 ? 'отлично' : total >= 7 ? 'хорошо' : total >= 5 ? 'удовлетворительно' : 'неудовлетворительно';
    return { parts, total, grade };
  };

  const nums = list => list.join(', ');
  const advice = () => {
    const out = [];
    const tb = CASES.filter(c => !typeRight(c));
    out.push(tb.length ? `Тип индекса: разберите обращения ${nums(tb.map(c => CASES.indexOf(c) + 1))} — глава 3.2, §5–§8.` : 'Тип индекса: все обращения решены верно.');
    const qb = QUERIES.filter(q => !queryRight(q));
    out.push(qb.length ? `Индекс под запрос: наилучший индекс не выбран в заданиях ${nums(qb.map(q => QUERIES.indexOf(q) + 1))} — глава 3.2, §3–§4.` : 'Индекс под запрос: во всех заданиях выбран наилучший индекс.');
    out.push(rankRight() === RANK.length ? 'Вес индексов: прогноз совпал с измерением.' : `Вес индексов: в прогнозе на своих местах ${rankRight()} из ${RANK.length} индексов.`);
    const ab = AUDIT.filter(a => !auditRight(a));
    out.push(ab.length ? `Ревизия: другое решение нужно по индексам ${nums(ab.map(a => a.name))}.` : 'Ревизия: все решения верны.');
    return out;
  };

  const recenzia = () => {
    const sc = scores();
    let h = `<article class="card"><div class="card__head"><span>Рецензия</span><span>${esc(student.name || 'без имени')}</span></div><div class="card__body">`
      + `<p class="card__task">От: <b>${esc(FROM)}</b></p>`
      + `<ul class="progress">${sc.parts.map(p => `<li><span>${p.name}: ${p.got} из ${p.of} — ${p.unit}</span><span>${p.pts} / ${p.max}</span></li>`).join('')}`
      + `<li><span><b>Итого</b></span><span>${sc.total} / 10 · ${sc.grade}</span></li></ul>`
      + `<ul>${advice().map(a => `<li>${esc(a)}</li>`).join('')}</ul>`
      + '<p class="note">Комментарий к ревизии преподаватель читает отдельно: автоматически оцениваются только решения.</p></div></article>';

    h += '<h3>Письмо 1. Тип индекса</h3>';
    CASES.forEach((c, i) => {
      const s = ts(c.id), ok = typeRight(c);
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Обращение <b>${i + 1}</b> · ${ok ? 'верно' : 'неверно'}</span><span>${c.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(c.text)}</p><pre class="q">${esc(c.query)}</pre>`
        + `<p class="note">Ваше решение: ${esc(s.type ? typeAnswer(s.type, s.key) : 'не вынесено')}.</p>`
        + `<div class="why${ok ? '' : ' why--bad'}"><b>${esc(typeAnswer(c.type, c.key))}</b>${esc(c.why)}</div></div></article>`;
    });

    h += '<h3>Письмо 2. Индекс под запрос</h3>';
    QUERIES.forEach((q, i) => {
      const st = qs(q), ok = queryRight(q), bestKey = idKey(q.best[0]);
      const line = (part, key) => { const p = planOf(part, key); return `${part.tag ? part.tag + ': ' : ''}${p.text} · ключей ${p.keys}, документов ${p.docs}, возвращено ${p.n}`; };
      let mine = '<p class="note">Индекс не выбран.</p>';
      if (st.pick) mine = `<span class="lbl">Ваш индекс</span><pre class="q">db.events.createIndex(${esc(keyText(idKey(st.pick)))})\n${esc(parts(q).map(part => line(part, idKey(st.pick))).join('\n'))}</pre>`;
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Задание <b>${i + 1}</b> · ${ok ? 'наилучший индекс' : 'есть индекс лучше'}</span><span>попыток: ${st.tries.length}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(q.task)}</p><pre class="q">${esc(queryText(q))}</pre>${mine}`
        + `<div class="why${ok ? '' : ' why--bad'}"><b>Наилучший индекс</b>${esc(q.why)}<pre>db.events.createIndex(${esc(keyText(bestKey))})\n${esc(parts(q).map(part => line(part, bestKey)).join('\n'))}</pre></div>`
        + parts(q).map(part => stripHtml(bestKey, part.match)).join('') + '</div></article>';
    });

    h += '<h3>Письмо 3. Вес индексов</h3>';
    const big = IX.sizes[1000000], rr = rankRight();
    h += `<article class="card ${rr === RANK.length ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Прогноз · на своих местах ${rr} из ${RANK.length}</span><span>1 000 000 событий</span></div><div class="card__body">`
      + (state.rank.measured ? `<p class="note">Ваш порядок: ${state.rank.order.map(esc).join(' → ')}.</p>` : '<p class="note">Прогноз не измерен и не засчитан.</p>')
      + bars(rankTruth, big, big[rankTruth[rankTruth.length - 1]])
      + '<div class="why"><b>Почему размеры такие</b>Размер индекса зависит от того, что в нём записано. У поля service пять значений: соседние записи индекса одинаковы, и сервер хранит повторяющееся значение один раз. У user_id значений 20 000, и около половины событий записаны без покупателя: повторов меньше, чем у service, но они есть. У ts и trace каждое значение своё, повторов нет; строка trace длиннее даты, и её индекс больше.</div></div></article>';
    QUIZ.forEach((z, i) => {
      const ok = quizRight(z), opt = v => (z.options.find(o => o[0] === v) || ['', 'нет ответа'])[1];
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Вопрос <b>${i + 1}</b> · ${ok ? 'верно' : 'неверно'}</span><span>по калькулятору</span></div><div class="card__body">`
        + `<p class="card__task">${esc(z.q)}</p><p class="note">Ваш ответ: ${esc(opt(state.quiz[z.id]))}.</p>`
        + `<div class="why${ok ? '' : ' why--bad'}"><b>${esc(opt(z.answer))}</b>${esc(z.why)}</div></div></article>`;
    });

    h += '<h3>Письмо 4. Ревизия</h3>';
    const mine = auditMask(), right = AUDIT.reduce((m, a) => m | (a.drop ? 0 : 1 << IX.keep.indexOf(a.name)), 0);
    const sum = mask => AUDIT.filter(a => mask >> IX.keep.indexOf(a.name) & 1).reduce((s, a) => s + big[a.name], 0);
    AUDIT.forEach(a => {
      const ok = auditRight(a), word = v => (v === 'drop' ? 'удалить' : v === 'keep' ? 'оставить' : 'решения нет');
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span><b>${esc(a.name)}</b> · ${ok ? 'верно' : 'неверно'}</span><span>${mb(big[a.name])}</span></div><div class="card__body">`
        + `<p class="note">Ваше решение: ${word(auditOf(a.name))}.</p><div class="why${ok ? '' : ' why--bad'}"><b>${a.drop ? 'Удалить' : 'Оставить'}</b>${esc(a.why)}</div></div></article>`;
    });
    h += '<article class="card"><div class="card__head"><span>Запросы после ревизии</span><span>ваш набор и набор из разбора</span></div><div class="card__body">'
      + `<span class="lbl">Ваш набор индексов · ${mb(sum(mine))}</span>${workTable(mine)}`
      + `<span class="lbl">Набор из разбора · ${mb(sum(right))} вместо ${mb(sum(127))}</span>${workTable(right)}</div></article>`;
    return h;
  };

  const submit = () => {
    const left = CASES.filter(c => !typeDone(c)).length + QUERIES.filter(q => !qs(q).pick).length
      + (state.rank.measured ? 0 : 1) + QUIZ.filter(z => !state.quiz[z.id]).length + AUDIT.filter(a => !auditOf(a.name)).length;
    const msg = (left ? `Не заполнено ответов: ${left}. Они будут засчитаны как неверные.\n\n` : '') + 'После сдачи ответы изменить нельзя. Сдать работу?';
    if (!confirm(msg)) return;
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    state.open = 5;
    save();
    tab = 5;
    draw();
    $('#work').parentElement.scrollTop = 0;
  };

  /* ── 8. Отчёт ─────────────────────────────────────────────────── */
  const reportMd = () => {
    const sc = scores(), big = IX.sizes[1000000];
    const md = ['# Практикум «Инженер платформы: индексы журнала»', '',
      `- Студент: ${student.name || '—'}`, `- Группа: ${student.group || '—'}`,
      `- Сдано: ${state.submittedAt ? new Date(state.submittedAt).toLocaleString('ru-RU') : 'не сдано'}`, '',
      '## Рецензия', '', '| Часть | Результат | Баллы |', '|---|---|---|',
      ...sc.parts.map(p => `| ${p.name} | ${p.got} из ${p.of} | ${p.pts} / ${p.max} |`),
      `| **Итого** | | **${sc.total} / 10 · ${sc.grade}** |`, '', ...advice().map(a => `- ${a}`), '',
      '## Письмо 1. Тип индекса', '', '| № | Коллекция | Решение | Оценка |', '|---|---|---|---|'];
    CASES.forEach((c, i) => { const s = ts(c.id); md.push(`| ${i + 1} | ${c.coll} | ${s.type ? typeAnswer(s.type, s.key) : '—'} | ${typeRight(c) ? 'верно' : 'неверно'} |`); });
    md.push('', '## Письмо 2. Индекс под запрос', '');
    QUERIES.forEach((q, i) => {
      const st = qs(q);
      md.push(`### Задание ${i + 1}. ${q.task}`, '', '```js', queryText(q), '```', '');
      if (st.pick) {
        md.push('```js', `db.events.createIndex(${keyText(idKey(st.pick))})`, '```', '');
        parts(q).forEach(part => { const p = planOf(part, idKey(st.pick)); md.push(`- ${part.tag ? part.tag + '. ' : ''}План: ${p.text}; ключей прочитано ${p.keys}, документов прочитано ${p.docs}, возвращено ${p.n}`); });
      }
      else md.push('- Индекс не выбран');
      md.push(`- ${queryRight(q) ? 'Наилучший индекс' : 'Есть индекс лучше'}, попыток: ${st.tries.length}`, '');
    });
    md.push('## Письмо 3. Вес индексов', '',
      `- Прогноз: ${state.rank.measured ? state.rank.order.join(' → ') : 'не измерен'}`,
      `- Измерение на 1 000 000 событий: ${rankTruth.map(n => `${n} — ${mb(big[n])}`).join('; ')}`,
      `- На своих местах: ${rankRight()} из ${RANK.length}`,
      ...QUIZ.map((z, i) => `- Вопрос ${i + 1}: ${(z.options.find(o => o[0] === state.quiz[z.id]) || ['', '—'])[1]} — ${quizRight(z) ? 'верно' : 'неверно'}`), '',
      '## Письмо 4. Ревизия', '', '| Индекс | Размер | Решение | Оценка |', '|---|---|---|---|');
    AUDIT.forEach(a => md.push(`| ${a.name} | ${mb(big[a.name])} | ${auditOf(a.name) === 'drop' ? 'удалить' : auditOf(a.name) === 'keep' ? 'оставить' : '—'} | ${auditRight(a) ? 'верно' : 'неверно'} |`));
    md.push('', `Комментарий: ${state.auditNote.trim() || '—'}`, '');
    return md.join('\n');
  };

  const reportForm = () => '<div class="task"><b>Что сдать</b>Файл отчёта .md: рецензия с баллами, решения по всем письмам, выбранные индексы с планами и комментарий к ревизии.</div>'
    + `<div class="field"><label for="st-name">Фамилия и имя</label><input id="st-name" data-student="name" value="${esc(student.name)}"></div>`
    + `<div class="field"><label for="st-group">Группа</label><input id="st-group" data-student="group" value="${esc(student.group)}"></div>`
    + '<div class="row"><button type="button" class="btn" data-act="download">Скачать отчёт .md</button></div>'
    + '<p class="note">Работа хранится только в этом браузере. Перед сменой компьютера скачайте отчёт.</p>';

  /* Сброс работы — только преподавателем. В коде хранится только хеш пароля;
     пароль тот же, что в практикуме «Аналитик данных». */
  const RESET_HASH = 'd8e6d5a33bc8e95ed9a2505ccb9c0087102dc21bb8f02f87ef12e32fef4d9ba9';
  const sha256 = async text => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const resetByTeacher = async () => {
    const pw = prompt('Сброс стирает все ответы и рецензию в этом браузере.\nПароль преподавателя:');
    if (pw === null) return;
    let ok = false;
    try { ok = (await sha256('mongodb-analitik:' + pw.trim().toLowerCase())) === RESET_HASH; }
    catch (_) { alert('Браузер не поддерживает проверку пароля. Откройте страницу по адресу https://…'); return; }
    if (!ok) { alert('Пароль неверный. Работа не сброшена.'); return; }
    state = blank();
    save();
    go(1);
    alert('Работа сброшена.');
  };

  const download = () => {
    const who = (student.name || 'student').trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_-]/gu, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([reportMd()], { type: 'text/markdown;charset=utf-8' }));
    a.download = `indeksy_${who}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ── 9. Вкладки, отрисовка, события ───────────────────────────── */
  const TABS = [[1, 'Письмо 1'], [2, 'Письмо 2'], [3, 'Письмо 3'], [4, 'Письмо 4'], [5, 'Рецензия']];
  const isOpen = t => (t === 5 ? state.submitted : t <= state.open);

  const draw = () => {
    $('#tabs').innerHTML = TABS.map(([t, n]) => `<button type="button" role="tab" data-tab="${t}" aria-selected="${tab === t}"${isOpen(t) ? '' : ' disabled'}>${n}</button>`).join('');
    $('#steps').innerHTML = [['Тип', 1], ['Запрос', 2], ['Вес', 3], ['Ревизия', 4], ['Рецензия', 5]].map(([n, t]) =>
      `<li class="${state.submitted || t < state.open ? 'is-done' : isOpen(t) ? 'is-open' : ''}">${t} · ${n}</li>`).join('');
    const scrollY = $('#work').parentElement.scrollTop;
    if (tab === 5) {
      $('#mail').innerHTML = reportForm();
      $('#work').innerHTML = recenzia();
    } else {
      $('#mail').innerHTML = letterHtml(tab);
      $('#work').innerHTML = [typesView, queryView, weightView, auditView][tab - 1]();
    }
    $('#work').parentElement.scrollTop = scrollY;
  };

  const go = t => {
    tab = t;
    draw();
    $('#work').parentElement.scrollTop = 0;
    $('#mail').parentElement.scrollTop = 0;
  };

  const bind = () => {
    $('#tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (b && !b.disabled) go(+b.dataset.tab);
    });

    const work = $('#work');
    work.addEventListener('click', e => {
      const t = e.target;
      const next = t.closest('[data-next]');
      if (next) { state.open = Math.max(state.open, +next.dataset.next); save(); go(+next.dataset.next); return; }
      const act = t.closest('[data-act]');
      if (act && act.dataset.act === 'submit') return submit();
      const done = () => { save(); draw(); };

      /* Письмо 2: журнал попыток доступен и после сдачи — только просмотр. */
      const qcur = t.closest('[data-qcur]');
      if (qcur) { state.qCur = +qcur.dataset.qcur; return done(); }
      const show = t.closest('[data-show]');
      if (show && tab === 2) { qs(QUERIES[state.qCur]).shown = show.dataset.show; return done(); }
      /* Письмо 3: калькулятор работает и после сдачи. */
      const nbtn = t.closest('[data-n]');
      if (nbtn) { state.calc.n = +nbtn.dataset.n; return done(); }
      const cbtn = t.closest('[data-calc]');
      if (cbtn) { const n = cbtn.dataset.calc, on = state.calc.on; state.calc.on = on.includes(n) ? on.filter(x => x !== n) : on.concat(n); return done(); }
      if (locked()) return;

      /* Письмо 1 */
      const ccard = t.closest('[data-case]');
      if (ccard) {
        const s = ts(ccard.dataset.case);
        const ty = t.closest('[data-type]');
        if (ty) { s.type = ty.dataset.type; if (s.type === 'none') s.key = []; return done(); }
        const add = t.closest('[data-add]');
        if (add && !add.disabled) { s.key.push(add.dataset.add); return done(); }
        const del = t.closest('[data-del]');
        if (del) { s.key.splice(+del.dataset.del, 1); return done(); }
        return;
      }
      /* Письмо 2 */
      if (tab === 2) {
        const q = QUERIES[state.qCur], st = qs(q);
        const add = t.closest('[data-add]');
        if (add && !add.disabled) { st.cur.push([add.dataset.add, 1]); return done(); }
        const del = t.closest('[data-del]');
        if (del) { st.cur.splice(+del.dataset.del, 1); return done(); }
        const dir = t.closest('[data-dir]');
        if (dir) { st.cur[+dir.dataset.dir][1] *= -1; return done(); }
        const pick = t.closest('[data-pick]');
        if (pick) { st.pick = pick.dataset.pick; return done(); }
        if (act && act.dataset.act === 'clear-key') { st.cur = []; return done(); }
        if (act && act.dataset.act === 'run-index' && st.cur.length) {
          const id = keyId(st.cur);
          if (!st.tries.includes(id)) st.tries.push(id);
          st.shown = id;
          return done();
        }
        return;
      }
      /* Письмо 3 */
      if (tab === 3) {
        const up = t.closest('[data-up]'), down = t.closest('[data-down]');
        if ((up || down) && !state.rank.measured) {
          const i = +(up || down).dataset[up ? 'up' : 'down'], j = up ? i - 1 : i + 1, o = state.rank.order;
          if (j >= 0 && j < o.length) { [o[i], o[j]] = [o[j], o[i]]; return done(); }
        }
        if (act && act.dataset.act === 'measure') {
          if (!confirm('После измерения порядок индексов изменить нельзя. Измерить?')) return;
          state.rank.measured = true; return done();
        }
        const ans = t.closest('[data-answer]');
        if (ans) { state.quiz[ans.closest('[data-quiz]').dataset.quiz] = ans.dataset.answer; return done(); }
        return;
      }
      /* Письмо 4 */
      const keep = t.closest('[data-keep]');
      if (keep) { state.audit[keep.closest('[data-audit]').dataset.audit] = keep.dataset.keep; return done(); }
    });

    work.addEventListener('input', e => {
      if (!locked() && e.target.matches('[data-note]')) { state.auditNote = e.target.value; save(); }
    });

    const mail = $('#mail');
    mail.addEventListener('input', e => { if (e.target.dataset.student) { student[e.target.dataset.student] = e.target.value; saveStudent(); } });
    mail.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      if (a && a.dataset.act === 'download') download();
    });
    $('#reset').addEventListener('click', resetByTeacher);
  };

  bind();
  draw();
})();
