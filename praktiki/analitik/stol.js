/* Рабочий стол практикума «Аналитик данных: первая неделя».

   1. Данные, состояние, сохранение     6. Письмо 4: свой запрос
   2. Общие куски: результат запроса    7. Оценка и рецензия
   3. Письмо 1: ревью                   8. Отчёт
   4. Письмо 2: сборка из блоков        9. Вкладки и события
   5. Письмо 3: сито

   По ходу работы ничего не оценивается: запросы выполняются и показывают
   найденные документы, но не сравниваются с нужным результатом. Письма
   открываются кнопкой «Дальше» без условий. После «Сдать работу» ответы
   закрываются и открывается рецензия по всем четырём письмам.
   Работа хранится в localStorage этого браузера. */
(() => {
  const { FROM, ERRORS, LETTERS, REVIEW, BUILD, SIEVE, WRITE } = window.AN;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ── 1. Данные, состояние, сохранение ─────────────────────────── */
  const DB = Object.fromEntries(Object.entries(window.HH_RAW).map(([k, v]) => [k, MQ.revive(v)]));
  const idOf = d => String(d._id);
  const KEY = 'mongodb-analitik-v2', SKEY = 'mongodb-analitik-student';

  const blank = () => ({ open: 1, submitted: false, submittedAt: null,
    review: {}, build: {}, buildCur: 0, sieve: {}, sieveCur: 0, write: {} });
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v || fallback; } catch (_) { return fallback; } };
  let state = Object.assign(blank(), read(KEY, {}));
  let student = read(SKEY, { name: '', group: '' });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { } };
  const saveStudent = () => { try { localStorage.setItem(SKEY, JSON.stringify(student)); } catch (_) { } };
  let tab = state.submitted ? 5 : Math.min(state.open, 4);
  const runs = {};   // последние выполнения: ключ → { docs | error }
  const locked = () => state.submitted;

  /* Нужный результат задания считается по эталонному запросу. */
  const expectedCache = {};
  const expected = (coll, answer) => {
    const k = coll + answer;
    if (!expectedCache[k]) expectedCache[k] = MQ.find(DB[coll], MQ.parse(answer)).map(idOf);
    return expectedCache[k];
  };

  const run = (coll, text) => {
    try {
      const { collection, filter } = MQ.unwrap(text);
      if (collection && collection !== coll) return { error: `Запрос обращается к коллекции ${collection}, а в задании нужна ${coll}.` };
      return { docs: MQ.find(DB[coll], MQ.parse(filter)) };
    } catch (e) {
      return { error: e instanceof MQ.QueryError ? e.message : 'Запрос не разобран: ' + e.message };
    }
  };
  const sameSet = (docs, ids) => docs.length === ids.length && docs.every(d => ids.includes(idOf(d)));

  /* ── 2. Общие куски ───────────────────────────────────────────── */
  const date = d => (d instanceof Date ? d.toISOString().slice(0, 16).replace('T', ' ') : '');
  const title = (coll, d) => ({
    resumes: () => d.fio, vacancies: () => `${d.title} · ${d.company}`, companies: () => d.name,
    interviews: () => `${d._id} · ${d.candidate} · ${d.company.name}`,
  }[coll])();
  const sub = (coll, d) => ({
    resumes: () => `${d.city}, ${d.salary} ₽`,
    vacancies: () => `${d.city}, ${d.salary.from}–${d.salary.to} ₽`,
    companies: () => `${d.city}, сотрудников: ${d.employees}`,
    interviews: () => `${d.stage}, ${d.format}, ${date(d.when)}`,
  }[coll])();

  const docItem = (coll, d, mark) => {
    const TAG = { ok: '<span class="tag tag--ok">нужен</span>', extra: '<span class="tag tag--extra">лишний</span>', miss: '<span class="tag tag--miss">не найден</span>' };
    return `<li class="${mark || ''}"><details><summary>${mark ? TAG[mark] : ''}<span>${esc(title(coll, d))}</span><small>${esc(sub(coll, d))}</small></summary>`
      + `<pre>${esc(MQ.show(d))}</pre></details></li>`;
  };

  /* Результат выполнения. С want (только в рецензии) — сравнение с нужным результатом. */
  const resultHtml = (coll, res, want) => {
    if (!res) return '';
    if (res.error) return `<div class="res"><div class="res__err">${esc(res.error)}</div></div>`;
    const docs = res.docs;
    let head = `Найдено документов: ${docs.length}`;
    let items = docs.map(d => docItem(coll, d, want ? (want.includes(idOf(d)) ? 'ok' : 'extra') : ''));
    if (want) {
      const missing = DB[coll].filter(d => want.includes(idOf(d)) && !docs.some(x => idOf(x) === idOf(d)));
      items = items.concat(missing.map(d => docItem(coll, d, 'miss')));
      const extra = docs.filter(d => !want.includes(idOf(d))).length;
      head += sameSet(docs, want) ? ' · совпадает с нужным' : ` · лишних: ${extra}, не найдено: ${missing.length}`;
    }
    return `<div class="res"><div class="res__head"><span>${head}</span><span>db.${coll}</span></div>`
      + (items.length ? `<ol>${items.join('')}</ol>` : '<div class="res__empty">Ни один документ не подошёл.</div>') + '</div>';
  };

  const letterHtml = n => {
    const L = LETTERS[n - 1];
    return `<article class="letter"><div class="letter__head">От: <b>${esc(FROM)}</b><span class="letter__subject">${esc(L.subject)}</span></div>`
      + `<div class="letter__body">${L.body.map(p => `<p>${esc(p)}</p>`).join('')}</div></article>`
      + `<div class="task"><b>Задание</b>${esc(L.task)}</div>`;
  };

  /* Кнопка перехода к следующему письму — без условий. */
  const nextHtml = (n, left) => {
    if (locked()) return '<p class="note">Работа сдана. Ответы можно посмотреть, но не изменить. Рецензия — на вкладке «Рецензия».</p>';
    const warn = left ? `<span class="note">Не заполнено: ${left}. Перейти можно и так — вернуться к письму можно в любой момент до сдачи.</span>` : '';
    if (n < 4) return `<div class="row"><button type="button" class="btn" data-next="${n + 1}">Дальше: письмо ${n + 1} →</button>${warn}</div>`;
    return `<div class="row"><button type="button" class="btn" data-act="submit">Сдать работу</button>${warn}</div>`;
  };

  /* ── 3. Письмо 1: ревью ───────────────────────────────────────── */
  const rv = id => (state.review[id] = state.review[id] || { verdict: null, kind: '', comment: '', fix: '' });
  const reviewDone = r => { const s = rv(r.id); return s.verdict === 'ok' || (s.verdict === 'err' && s.kind); };
  const reviewRight = r => {
    const s = rv(r.id);
    return r.error === null ? s.verdict === 'ok' : s.verdict === 'err' && s.kind === r.error;
  };
  const dis = () => (locked() ? ' disabled' : '');

  const reviewCard = (r, n) => {
    const s = rv(r.id);
    return `<article class="card" data-review="${r.id}">`
      + `<div class="card__head"><span>Запрос <b>${n}</b> из ${REVIEW.length} · ${esc(r.author)}</span><span>коллекция ${r.coll}</span></div>`
      + `<div class="card__body"><p class="card__task"><b>Задача:</b> ${esc(r.task)}</p>`
      + `<pre class="q">db.${r.coll}.find(${esc(r.query)})</pre>`
      + `<div class="claim"><b>Коллега пишет</b>${esc(r.claim)}</div>`
      + `<div class="row"><button type="button" class="btn btn--ghost btn--small" data-run="orig">Выполнить запрос коллеги</button></div>`
      + `<div data-out="orig">${resultHtml(r.coll, runs['r-orig-' + r.id])}</div>`
      + `<span class="lbl">Ваше решение</span><div class="verdict">`
      + `<button type="button" class="chip" data-verdict="ok" aria-pressed="${s.verdict === 'ok'}"${dis()}>Запрос верный</button>`
      + `<button type="button" class="chip" data-verdict="err" aria-pressed="${s.verdict === 'err'}"${dis()}>Есть ошибка</button></div>`
      + `<div class="field"${s.verdict === 'err' ? '' : ' hidden'}><label for="k-${r.id}">Вид ошибки</label><select id="k-${r.id}" data-kind${dis()}>`
      + `<option value="">— выберите —</option>${ERRORS.map(([id, t]) => `<option value="${id}"${s.kind === id ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`
      + `<div class="field"><label for="c-${r.id}">Комментарий к ревью</label><textarea id="c-${r.id}" data-comment${dis()} placeholder="Что не так и как исправить. Для верного запроса — почему он верный.">${esc(s.comment)}</textarea></div>`
      + `<div class="field"><label for="f-${r.id}">Исправленный запрос (необязательно)</label><textarea id="f-${r.id}" class="code" data-fix${dis()} placeholder="{ … }">${esc(s.fix)}</textarea></div>`
      + `<div class="row"><button type="button" class="btn btn--ghost btn--small" data-run="fix">Выполнить исправленный</button></div>`
      + `<div data-out="fix">${resultHtml(r.coll, runs['r-fix-' + r.id])}</div>`
      + '</div></article>';
  };

  const reviewView = () => {
    const left = REVIEW.filter(r => !reviewDone(r)).length;
    return REVIEW.map((r, i) => reviewCard(r, i + 1)).join('')
      + nextHtml(1, left ? `${left} из ${REVIEW.length} запросов без решения` : '');
  };

  /* ── 4. Письмо 2: сборка из блоков ────────────────────────────── */
  const bs = b => (state.build[b.id] = state.build[b.id] || { root: [], runs: 0 });
  const blockOf = (b, id) => b.blocks.find(x => x.id === id);
  let picked = null;   // блок, выбранный нажатием, — ждёт нажатия на место в фильтре

  const placedIds = st => {
    const out = [];
    st.root.forEach(e => {
      out.push(e.id);
      if (e.branches) e.branches.forEach(br => out.push(...br));
      if (e.items) out.push(...e.items);
    });
    return out;
  };
  const removeBlock = (st, id) => {
    st.root = st.root.filter(e => e.id !== id);
    st.root.forEach(e => {
      if (e.branches) e.branches = e.branches.map(br => br.filter(x => x !== id));
      if (e.items) e.items = e.items.filter(x => x !== id);
    });
  };
  const placeBlock = (b, zone, id) => {
    const st = bs(b), blk = blockOf(b, id);
    if (!blk) return;
    removeBlock(st, id);
    if (zone === 'tray') return;
    if (blk.kind) {   // контейнеры — только на верхний уровень фильтра
      st.root.push(blk.kind === 'or' ? { id, branches: [[], []] } : { id, items: [] });
      return;
    }
    if (zone === 'root') st.root.push({ id });
    else if (zone.startsWith('or:')) {
      const box = st.root.find(e => e.branches);
      if (box) box.branches[+zone.slice(3)].push(id);
    } else if (zone === 'elem') {
      const box = st.root.find(e => e.items);
      if (box) box.items.push(id);
    }
  };

  /* Текст фильтра в порядке блоков: повтор ключа виден так же, как в редакторе. */
  const composeText = b => {
    const st = bs(b);
    const code = id => blockOf(b, id).code;
    const parts = st.root.map(e => {
      const blk = blockOf(b, e.id);
      if (blk.kind === 'or') return `$or: [ ${e.branches.map(br => `{ ${br.map(code).join(', ')} }`).join(', ')} ]`;
      if (blk.kind === 'elem') return `${blk.field}: { $elemMatch: { ${e.items.map(code).join(', ')} } }`;
      return blk.code;
    });
    return parts.length ? `{\n  ${parts.join(',\n  ')}\n}` : '{ }';
  };
  const buildSolved = b => {
    if (!bs(b).root.length) return false;
    const res = run(b.coll, composeText(b));
    return !res.error && sameSet(res.docs, expected(b.coll, b.answer));
  };

  const blkHtml = (b, blk, placed) => {
    const x = placed && !locked() ? `<button type="button" class="blk__x" data-remove="${blk.id}" title="Вернуть в набор" aria-label="Вернуть в набор">×</button>` : '';
    const cls = blk.kind ? ` blk--${blk.kind}` : blk.inner ? ' blk--inner' : '';
    const label = blk.kind === 'or' ? '$or: [ { … }, { … } ]' : blk.kind === 'elem' ? `${blk.field}: { $elemMatch: { … } }` : blk.code;
    return `<div class="blk${cls}${picked === blk.id ? ' is-picked' : ''}" draggable="${!locked()}" tabindex="0" role="button" data-blk="${blk.id}">${x}${esc(label)}</div>`;
  };

  const zoneHtml = (b, zone, ids, emptyText) => `<div class="zone${picked ? ' is-target' : ''}" data-zone="${zone}">`
    + (ids.length ? ids.map(id => blkHtml(b, blockOf(b, id), true)).join('') : `<span class="zone__empty">${emptyText}</span>`) + '</div>';

  const buildView = () => {
    const cur = Math.min(state.buildCur, BUILD.length - 1);
    const b = BUILD[cur], st = bs(b);
    const placed = placedIds(st);
    const pills = BUILD.map((x, i) => `<button type="button" data-bcur="${i}" aria-current="${i === cur}" class="${bs(x).root.length ? 'is-ok' : ''}">${i + 1}</button>`).join('');
    const xBtn = (id, label) => (locked() ? '' : `<button type="button" class="blk__x" data-remove="${id}" aria-label="${label}">×</button>`);

    const rootItems = st.root.map(e => {
      const blk = blockOf(b, e.id);
      if (blk.kind === 'or') {
        return `<div class="box" data-blk="${e.id}" draggable="${!locked()}"><div class="box__line"><span>$or: [</span>${xBtn(e.id, 'Убрать $or')}</div>`
          + e.branches.map((br, i) => `<div class="box__branch">ветка ${i + 1}: {</div>${zoneHtml(b, 'or:' + i, br, 'условия этой ветки')}<div class="box__branch">}</div>`).join('')
          + (locked() ? '' : `<div class="branch-tools"><button type="button" class="btn btn--ghost btn--small" data-branch="add">+ ветка</button>`
            + (e.branches.length > 2 ? `<button type="button" class="btn btn--ghost btn--small" data-branch="del">− ветка</button>` : '') + '</div>')
          + '<div class="box__line">]</div></div>';
      }
      if (blk.kind === 'elem') {
        return `<div class="box" data-blk="${e.id}" draggable="${!locked()}"><div class="box__line"><span>${esc(blk.field)}: { $elemMatch: {</span>${xBtn(e.id, 'Убрать $elemMatch')}</div>`
          + zoneHtml(b, 'elem', e.items, 'условия для одного элемента массива') + '<div class="box__line">} }</div></div>';
      }
      return blkHtml(b, blk, true);
    }).join('');

    const tray = b.blocks.filter(x => !placed.includes(x.id)).map(x => blkHtml(b, x, false)).join('');
    const left = BUILD.filter(x => !bs(x).root.length).length;

    return `<div class="pills" aria-label="Заявки">${pills}</div>`
      + `<article class="card"><div class="card__head"><span>Заявка <b>${cur + 1}</b> из ${BUILD.length} · ${esc(b.client)}</span><span>коллекция ${b.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(b.request)}</p></div></article>`
      + `<div class="build"><div><span class="lbl">Набор блоков</span><div class="tray" data-zone="tray">${tray || '<span class="zone__empty">Все блоки в фильтре</span>'}</div>`
      + '<p class="note">Перетащите блок в фильтр или нажмите на блок, а затем на место в фильтре. Пунктирная рамка у блока — условие для элемента массива: имя поля в нём записано без пути.</p></div>'
      + `<div><span class="lbl">Фильтр</span><div class="composer"><div class="line">db.${b.coll}.find({</div>`
      + `<div class="zone${picked ? ' is-target' : ''}" data-zone="root">${rootItems || '<span class="zone__empty">Положите сюда условия</span>'}</div>`
      + '<div class="line">})</div></div>'
      + `<div class="row"><button type="button" class="btn" data-act="run-build">Выполнить</button>`
      + `<button type="button" class="btn btn--ghost btn--small" data-act="copy-build">Копировать запрос</button></div>`
      + `<pre class="q" id="build-text">db.${b.coll}.find(${esc(composeText(b))})</pre>`
      + resultHtml(b.coll, runs['b-' + b.id]) + '</div></div>'
      + nextHtml(2, left ? `${left} из ${BUILD.length} заявок без запроса` : '');
  };

  const runBuild = () => {
    const b = BUILD[state.buildCur];
    runs['b-' + b.id] = run(b.coll, composeText(b));
    bs(b).runs++;
    save();
    draw();
  };

  /* ── 5. Письмо 3: сито ────────────────────────────────────────── */
  const ss = s => (state.sieve[s.id] = state.sieve[s.id] || { place: {} });
  const truthOf = (s, d) => (MQ.match(d, MQ.parse(s.filter)) ? 'in' : 'out');
  const sieveRight = s => DB.resumes.filter(d => ss(s).place[idOf(d)] === truthOf(s, d)).length;
  const SIEVE_TOTAL = SIEVE.length * DB.resumes.length;

  const fieldLines = (d, fields) => fields.map(f => (f in d ? `${f}: ${MQ.show(d[f], '')}` : `${f}: — поля нет`)).join('\n');

  const docCard = (s, d, where, marked) => {
    const truth = truthOf(s, d);
    const mark = marked ? (ss(s).place[idOf(d)] === truth ? ' is-ok' : ' is-bad') : '';
    const tools = locked() ? (marked ? `<span class="note">${truth === 'in' ? 'попадает' : 'не попадает'}</span>` : '')
      : (where !== 'in' ? `<button type="button" class="btn btn--ghost btn--small" data-put="in">попадёт</button>` : '')
        + (where !== 'out' ? `<button type="button" class="btn btn--ghost btn--small" data-put="out">не попадёт</button>` : '')
        + (where !== 'pool' ? `<button type="button" class="btn btn--ghost btn--small" data-put="pool">вернуть</button>` : '');
    return `<div class="doc-card${mark}" draggable="${!locked()}" data-doc="${idOf(d)}"><div class="doc-card__name"><span>${esc(d.fio)}</span></div>`
      + `<pre>${esc(fieldLines(d, s.fields))}</pre>`
      + `<details style="margin:0 9px 6px;padding:0;border:0;background:none"><summary class="note">весь документ</summary><pre>${esc(MQ.show(d))}</pre></details>`
      + `<div class="doc-card__tools">${tools}</div></div>`;
  };

  const sieveView = () => {
    const cur = Math.min(state.sieveCur, SIEVE.length - 1);
    const s = SIEVE[cur], st = ss(s);
    const docs = DB.resumes;
    const at = d => st.place[idOf(d)] || 'pool';
    const filled = x => DB.resumes.every(d => ss(x).place[idOf(d)]);
    const pills = SIEVE.map((x, i) => `<button type="button" data-scur="${i}" aria-current="${i === cur}" class="${filled(x) ? 'is-ok' : ''}">${i + 1}</button>`).join('');
    const col = (where, head, cls) => `<div class="bin ${cls}" data-bin="${where}"><p class="bin__head">${head} · ${docs.filter(d => at(d) === where).length}</p>`
      + docs.filter(d => at(d) === where).map(d => docCard(s, d, where, false)).join('') + '</div>';
    const left = SIEVE.reduce((n, x) => n + DB.resumes.filter(d => !ss(x).place[idOf(d)]).length, 0);
    return `<div class="pills" aria-label="Раунды">${pills}</div>`
      + `<article class="card"><div class="card__head"><span>Раунд <b>${cur + 1}</b> из ${SIEVE.length}</span><span>коллекция resumes</span></div>`
      + `<div class="card__body"><pre class="q">db.resumes.find(${esc(s.filter)})</pre></div></article>`
      + `<div class="sieve">${col('pool', 'Не разобраны', 'bin--pool')}${col('in', 'Попадёт в результат', 'bin--in')}${col('out', 'Не попадёт', 'bin--out')}</div>`
      + nextHtml(3, left ? `${left} из ${SIEVE_TOTAL} карточек не разложены` : '');
  };

  /* ── 6. Письмо 4: свой запрос ─────────────────────────────────── */
  const ws = w => (state.write[w.id] = state.write[w.id] || { text: '', runs: 0, hint: false });
  const writeSolved = w => {
    if (!ws(w).text.trim()) return false;
    const res = run(w.coll, ws(w).text);
    return !res.error && sameSet(res.docs, expected(w.coll, w.answer));
  };

  const writeCard = (w, n) => {
    const st = ws(w);
    return `<article class="card" data-write="${w.id}"><div class="card__head"><span>Запрос <b>${n}</b> из ${WRITE.length}</span><span>коллекция ${w.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(w.task)}</p>`
      + `<div class="field"><label for="w-${w.id}">db.${w.coll}.find(</label><textarea id="w-${w.id}" class="code" data-wtext spellcheck="false"${dis()} placeholder="{ }">${esc(st.text)}</textarea><span class="lbl">)</span></div>`
      + `<div class="row"><button type="button" class="btn" data-act="run-write">Выполнить</button>`
      + `<button type="button" class="btn btn--ghost btn--small" data-act="hint">${st.hint ? 'Скрыть подсказку' : 'Подсказка'}</button></div>`
      + (st.hint ? `<div class="why"><b>Подсказка</b>${esc(w.hint)}</div>` : '')
      + `<div data-out="write">${resultHtml(w.coll, runs['w-' + w.id])}</div></div></article>`;
  };

  const writeView = () => {
    const left = WRITE.filter(w => !ws(w).text.trim()).length;
    return WRITE.map((w, i) => writeCard(w, i + 1)).join('') + nextHtml(4, left ? `${left} из ${WRITE.length} запросов не написаны` : '');
  };

  const runWrite = id => {
    const w = WRITE.find(x => x.id === id), st = ws(w);
    runs['w-' + id] = run(w.coll, st.text || '{}');
    st.runs++;
    save();
    draw();
  };

  /* ── 7. Оценка и рецензия ─────────────────────────────────────── */
  /* Баллы — по шкале со страницы описания практикума. */
  const scores = () => {
    const r = REVIEW.filter(reviewRight).length;
    const b = BUILD.filter(buildSolved).length;
    const s = SIEVE.reduce((n, x) => n + sieveRight(x), 0);
    const w = WRITE.filter(writeSolved).length;
    const parts = [
      { name: 'Письмо 1 · ревью', got: r, of: REVIEW.length, pts: r >= 7 ? 3 : r >= 5 ? 2 : r >= 3 ? 1 : 0, max: 3, unit: 'запросов оценено верно' },
      { name: 'Письмо 2 · сборка', got: b, of: BUILD.length, pts: b === 5 ? 3 : b === 4 ? 2 : b >= 2 ? 1 : 0, max: 3, unit: 'заявок решено' },
      { name: 'Письмо 3 · сито', got: s, of: SIEVE_TOTAL, pts: s >= 40 ? 2 : s >= 32 ? 1 : 0, max: 2, unit: 'карточек разложено верно' },
      { name: 'Письмо 4 · свой запрос', got: w, of: WRITE.length, pts: w === 5 ? 2 : w >= 3 ? 1 : 0, max: 2, unit: 'запросов решено' },
    ];
    const total = parts.reduce((n, p) => n + p.pts, 0);
    const grade = total >= 9 ? 'отлично' : total >= 7 ? 'хорошо' : total >= 5 ? 'удовлетворительно' : 'неудовлетворительно';
    return { parts, total, grade };
  };

  /* Короткий вывод по письму: что получилось и что повторить. */
  const advice = () => {
    const out = [];
    const wrongKinds = REVIEW.filter(r => !reviewRight(r));
    if (wrongKinds.length) {
      const low = t => t[0].toLowerCase() + t.slice(1);
      const topics = [...new Set(wrongKinds.map(r => (r.error ? low(ERRORS.find(e => e[0] === r.error)[1]) : 'как отличить верный запрос: проверьте его результат на данных')))];
      out.push(`Ревью: повторите — ${topics.join('; ')}.`);
    } else out.push('Ревью: все запросы оценены верно.');
    const bad = BUILD.filter(b => !buildSolved(b));
    out.push(bad.length ? `Сборка: не решены заявки ${bad.map(b => BUILD.indexOf(b) + 1).join(', ')} — сравните свой запрос с разбором ниже.` : 'Сборка: все заявки решены.');
    const weak = SIEVE.filter(s => sieveRight(s) < DB.resumes.length);
    out.push(weak.length ? `Сито: ошибки в раундах ${weak.map(s => SIEVE.indexOf(s) + 1).join(', ')}.` : 'Сито: все карточки разложены верно.');
    const wbad = WRITE.filter(w => !writeSolved(w));
    out.push(wbad.length ? `Свой запрос: не решены задачи ${wbad.map(w => WRITE.indexOf(w) + 1).join(', ')}.` : 'Свой запрос: все задачи решены.');
    return out;
  };

  const verdictText = s => (s.verdict === 'ok' ? 'запрос верный' : s.verdict === 'err'
    ? 'есть ошибка — ' + (s.kind ? ERRORS.find(e => e[0] === s.kind)[1].toLowerCase() : 'вид не выбран') : 'решение не вынесено');

  const recenzia = () => {
    const sc = scores();
    let h = `<article class="card"><div class="card__head"><span>Рецензия за неделю</span><span>${esc(student.name || 'без имени')}</span></div><div class="card__body">`
      + `<p class="card__task">От: <b>${esc(FROM)}</b></p>`
      + `<ul class="progress">${sc.parts.map(p => `<li><span>${p.name}: ${p.got} из ${p.of} — ${p.unit}</span><span>${p.pts} / ${p.max}</span></li>`).join('')}`
      + `<li><span><b>Итого</b></span><span>${sc.total} / 10 · ${sc.grade}</span></li></ul>`
      + `<ul>${advice().map(a => `<li>${esc(a)}</li>`).join('')}</ul>`
      + '<p class="note">Комментарии к ревью преподаватель читает отдельно: автоматически оценивается только вердикт и вид ошибки.</p></div></article>';

    h += '<h3>Письмо 1. Ревью</h3>';
    REVIEW.forEach((r, i) => {
      const s = rv(r.id), ok = reviewRight(r);
      let fix = '';
      if (s.fix.trim()) {
        const fr = run(r.coll, s.fix);
        fix = `<p class="note">Ваш исправленный запрос: ${!fr.error && sameSet(fr.docs, expected(r.coll, r.answer)) ? '✓ возвращает нужный результат' : '✗ возвращает не тот результат'}.</p>`;
      }
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Запрос <b>${i + 1}</b> · ${ok ? 'оценка верна' : 'оценка неверна'}</span><span>${r.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(r.task)}</p><pre class="q">db.${r.coll}.find(${esc(r.query)})</pre>`
        + `<p class="note">Ваше решение: ${esc(verdictText(s))}.${s.comment.trim() ? ' Комментарий: «' + esc(s.comment.trim()) + '»' : ''}</p>`
        + `<div class="why${ok ? '' : ' why--bad'}"><b>${r.error ? 'Ошибка: ' + esc(ERRORS.find(e => e[0] === r.error)[1].toLowerCase()) : 'Запрос верный'}</b>${esc(r.why)}<pre>db.${r.coll}.find(${esc(r.answer)})</pre></div>${fix}</div></article>`;
    });

    h += '<h3>Письмо 2. Сборка из блоков</h3>';
    BUILD.forEach((b, i) => {
      const ok = buildSolved(b);
      const res = bs(b).root.length ? run(b.coll, composeText(b)) : null;
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Заявка <b>${i + 1}</b> · ${ok ? 'решена' : 'не решена'}</span><span>${b.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(b.request)}</p><span class="lbl">Ваш запрос</span><pre class="q">db.${b.coll}.find(${esc(composeText(b))})</pre>`
        + (res ? resultHtml(b.coll, res, expected(b.coll, b.answer)) : '<p class="note">Запрос не собран.</p>')
        + `<div class="why${ok ? '' : ' why--bad'}"><b>Разбор</b>${esc(b.why)}<pre>db.${b.coll}.find(${esc(b.answer)})</pre></div></div></article>`;
    });

    h += '<h3>Письмо 3. Сито</h3>';
    SIEVE.forEach((s, i) => {
      const right = sieveRight(s), all = DB.resumes.length;
      const wrong = DB.resumes.filter(d => ss(s).place[idOf(d)] !== truthOf(s, d));
      h += `<article class="card ${right === all ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Раунд <b>${i + 1}</b> · верно ${right} из ${all}</span><span>resumes</span></div><div class="card__body">`
        + `<pre class="q">db.resumes.find(${esc(s.filter)})</pre>`
        + (wrong.length ? `<p class="note">Ошибки: ${wrong.map(d => `${esc(d.fio)} — ${truthOf(s, d) === 'in' ? 'попадает' : 'не попадает'}${ss(s).place[idOf(d)] ? '' : ' (не разложена)'}`).join('; ')}.</p>` : '')
        + `<div class="why${right === all ? '' : ' why--bad'}"><b>Почему так</b>${esc(s.why)}</div></div></article>`;
    });

    h += '<h3>Письмо 4. Свой запрос</h3>';
    WRITE.forEach((w, i) => {
      const st = ws(w), ok = writeSolved(w);
      const res = st.text.trim() ? run(w.coll, st.text) : null;
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Запрос <b>${i + 1}</b> · ${ok ? 'решён' : 'не решён'}</span><span>${w.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(w.task)}</p><span class="lbl">Ваш запрос</span><pre class="q">db.${w.coll}.find(${esc(st.text.trim() || '{ }')})</pre>`
        + (res ? resultHtml(w.coll, res, expected(w.coll, w.answer)) : '<p class="note">Запрос не написан.</p>')
        + `<div class="why${ok ? '' : ' why--bad'}"><b>Один из верных вариантов</b><pre>db.${w.coll}.find(${esc(w.answer)})</pre></div></div></article>`;
    });
    return h;
  };

  const submit = () => {
    const left = REVIEW.filter(r => !reviewDone(r)).length + BUILD.filter(b => !bs(b).root.length).length
      + SIEVE.reduce((n, x) => n + DB.resumes.filter(d => !ss(x).place[idOf(d)]).length, 0) + WRITE.filter(w => !ws(w).text.trim()).length;
    const msg = (left ? `Не заполнено ответов: ${left}. Они будут засчитаны как неверные.\n\n` : '')
      + 'После сдачи ответы изменить нельзя. Сдать работу?';
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
    const sc = scores();
    const md = ['# Практикум «Аналитик данных: первая неделя»', '',
      `- Студент: ${student.name || '—'}`, `- Группа: ${student.group || '—'}`,
      `- Сдано: ${state.submittedAt ? new Date(state.submittedAt).toLocaleString('ru-RU') : 'не сдано'}`, '',
      '## Рецензия', '', '| Часть | Результат | Баллы |', '|---|---|---|',
      ...sc.parts.map(p => `| ${p.name} | ${p.got} из ${p.of} | ${p.pts} / ${p.max} |`),
      `| **Итого** | | **${sc.total} / 10 · ${sc.grade}** |`, '', ...advice().map(a => `- ${a}`), '',
      '## Письмо 1. Ревью запросов', ''];
    REVIEW.forEach((r, i) => {
      const s = rv(r.id);
      md.push(`### Запрос ${i + 1}. ${r.task}`, '', '```js', `db.${r.coll}.find(${r.query})`, '```', '',
        `- Решение: ${verdictText(s)} — ${reviewRight(r) ? 'верно' : 'неверно'}`,
        `- Комментарий: ${s.comment.trim() || '—'}`);
      if (s.fix.trim()) md.push('- Исправленный запрос:', '', '```js', s.fix.trim(), '```');
      md.push('');
    });
    md.push('## Письмо 2. Запросы из блоков', '');
    BUILD.forEach((b, i) => md.push(`### Заявка ${i + 1}. ${b.client}`, '', b.request, '', '```js', `db.${b.coll}.find(${composeText(b)})`, '```', '',
      `- ${buildSolved(b) ? 'Решено' : 'Не решено'}, запусков: ${bs(b).runs}`, ''));
    md.push('## Письмо 3. Сито', '', '| Раунд | Фильтр | Верно |', '|---|---|---|');
    SIEVE.forEach((s, i) => md.push(`| ${i + 1} | \`${s.filter}\` | ${sieveRight(s)} из ${DB.resumes.length} |`));
    md.push('', '## Письмо 4. Свои запросы', '');
    WRITE.forEach((w, i) => md.push(`### ${i + 1}. ${w.task}`, '', '```js', `db.${w.coll}.find(${ws(w).text.trim() || '{ }'})`, '```', '',
      `- ${writeSolved(w) ? 'Результат совпадает с нужным' : 'Не решено'}, запусков: ${ws(w).runs}`, ''));
    return md.join('\n');
  };

  const reportForm = () => `<div class="task"><b>Что сдать</b>Файл отчёта .md: рецензия с баллами, решения по всем письмам, комментарии к ревью и тексты запросов.</div>`
    + `<div class="field"><label for="st-name">Фамилия и имя</label><input id="st-name" data-student="name" value="${esc(student.name)}"></div>`
    + `<div class="field"><label for="st-group">Группа</label><input id="st-group" data-student="group" value="${esc(student.group)}"></div>`
    + '<div class="row"><button type="button" class="btn" data-act="download">Скачать отчёт .md</button></div>'
    + '<p class="note">Работа хранится только в этом браузере. Перед сменой компьютера скачайте отчёт.</p>'
    + '<div class="row"><button type="button" class="btn btn--danger" data-act="reset">Начать заново</button></div>';

  const download = () => {
    const who = (student.name || 'student').trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_-]/gu, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([reportMd()], { type: 'text/markdown;charset=utf-8' }));
    a.download = `analitik_${who}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ── 9. Вкладки, отрисовка, события ───────────────────────────── */
  const TABS = [[1, 'Письмо 1'], [2, 'Письмо 2'], [3, 'Письмо 3'], [4, 'Письмо 4'], [5, 'Рецензия']];
  const isOpen = t => (t === 5 ? state.submitted : t <= state.open);

  const draw = () => {
    $('#tabs').innerHTML = TABS.map(([t, n]) => `<button type="button" role="tab" data-tab="${t}" aria-selected="${tab === t}"${isOpen(t) ? '' : ' disabled'}>${n}</button>`).join('');
    $('#steps').innerHTML = [['Ревью', 1], ['Сборка', 2], ['Сито', 3], ['Свой запрос', 4], ['Рецензия', 5]].map(([n, t]) =>
      `<li class="${state.submitted || t < state.open ? 'is-done' : isOpen(t) ? 'is-open' : ''}">${t} · ${n}</li>`).join('');
    const scrollY = $('#work').parentElement.scrollTop;
    if (tab === 5) {
      $('#mail').innerHTML = reportForm();
      $('#work').innerHTML = recenzia();
    } else {
      $('#mail').innerHTML = letterHtml(tab);
      $('#work').innerHTML = [reviewView, buildView, sieveView, writeView][tab - 1]();
    }
    $('#work').parentElement.scrollTop = scrollY;
  };

  const go = t => {
    tab = t;
    picked = null;
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
      if (act) {
        const a = act.dataset.act;
        if (a === 'submit') return submit();
        if (a === 'run-build') return runBuild();
        if (a === 'copy-build') {
          const text = $('#build-text').textContent;
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
            () => { act.textContent = 'Скопировано'; }, () => { act.textContent = 'Выделите текст ниже'; });
          return;
        }
        const wcard = t.closest('[data-write]');
        if (a === 'run-write' && wcard) return runWrite(wcard.dataset.write);
        if (a === 'hint' && wcard) { const st = ws(WRITE.find(x => x.id === wcard.dataset.write)); st.hint = !st.hint; save(); draw(); return; }
      }
      /* Ревью */
      const rcard = t.closest('[data-review]');
      if (rcard) {
        const r = REVIEW.find(x => x.id === rcard.dataset.review), s = rv(r.id);
        const v = t.closest('[data-verdict]');
        if (v && !locked()) { s.verdict = v.dataset.verdict; save(); draw(); return; }
        const runBtn = t.closest('[data-run]');
        if (runBtn) {
          const which = runBtn.dataset.run;
          runs[`r-${which}-${r.id}`] = run(r.coll, which === 'orig' ? r.query : (s.fix || '{}'));
          rcard.querySelector(`[data-out="${which}"]`).innerHTML = resultHtml(r.coll, runs[`r-${which}-${r.id}`]);
          return;
        }
      }
      /* Сборка */
      const bcur = t.closest('[data-bcur]');
      if (bcur) { state.buildCur = +bcur.dataset.bcur; picked = null; save(); draw(); return; }
      if (tab === 2 && !locked()) {
        const b = BUILD[state.buildCur];
        const rm = t.closest('[data-remove]');
        if (rm) { removeBlock(bs(b), rm.dataset.remove); picked = null; save(); draw(); return; }
        const br = t.closest('[data-branch]');
        if (br) {
          const box = bs(b).root.find(x => x.branches);
          if (br.dataset.branch === 'add') box.branches.push([]);
          else if (box.branches.length > 2) box.branches.pop();
          save(); draw(); return;
        }
        /* Нажатие: блок выбран — нажатие на место в фильтре ставит его туда;
           блок не выбран — нажатие на блок выбирает его. */
        const blk = t.closest('[data-blk]');
        const zone = t.closest('[data-zone]');
        const onBlock = blk && (!zone || zone.contains(blk)) ? blk.dataset.blk : null;
        if (picked && onBlock === picked) { picked = null; draw(); return; }
        if (picked && zone) { placeBlock(b, zone.dataset.zone, picked); picked = null; save(); draw(); return; }
        if (onBlock) { picked = onBlock; draw(); return; }
      }
      /* Сито */
      const scur = t.closest('[data-scur]');
      if (scur) { state.sieveCur = +scur.dataset.scur; save(); draw(); return; }
      const put = t.closest('[data-put]');
      if (put && !locked()) {
        const id = put.closest('[data-doc]').dataset.doc, st = ss(SIEVE[state.sieveCur]);
        if (put.dataset.put === 'pool') delete st.place[id]; else st.place[id] = put.dataset.put;
        save(); draw();
      }
    });

    work.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.blk')) { e.preventDefault(); e.target.click(); }
    });

    work.addEventListener('input', e => {
      if (locked()) return;
      const t = e.target;
      const rcard = t.closest('[data-review]');
      if (rcard) {
        const s = rv(rcard.dataset.review);
        if (t.matches('[data-comment]')) s.comment = t.value;
        if (t.matches('[data-fix]')) s.fix = t.value;
        save();
        return;
      }
      const wcard = t.closest('[data-write]');
      if (wcard && t.matches('[data-wtext]')) { ws(WRITE.find(x => x.id === wcard.dataset.write)).text = t.value; save(); }
    });
    work.addEventListener('change', e => {
      if (locked() || !e.target.matches('[data-kind]')) return;
      rv(e.target.closest('[data-review]').dataset.review).kind = e.target.value;
      save();
      draw();   // обновить счётчик «не заполнено» внизу письма
    });

    /* Перетаскивание: блоки сборки и карточки сита. */
    work.addEventListener('dragstart', e => {
      if (locked()) { e.preventDefault(); return; }
      const blk = e.target.closest('[data-blk]');
      const doc = e.target.closest('[data-doc]');
      if (blk && tab === 2) { e.dataTransfer.setData('text/an', 'blk:' + blk.dataset.blk); e.stopPropagation(); }
      else if (doc && tab === 3) e.dataTransfer.setData('text/an', 'doc:' + doc.dataset.doc);
      e.dataTransfer.effectAllowed = 'move';
    });
    const target = e => e.target.closest(tab === 2 ? '[data-zone]' : '[data-bin]');
    work.addEventListener('dragover', e => {
      const z = target(e);
      if (!z || locked() || !e.dataTransfer.types.includes('text/an')) return;
      e.preventDefault();
      work.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over'));
      z.classList.add('is-over');
    });
    work.addEventListener('dragleave', e => { const z = target(e); if (z && !z.contains(e.relatedTarget)) z.classList.remove('is-over'); });
    work.addEventListener('drop', e => {
      const z = target(e);
      if (!z || locked()) return;
      e.preventDefault();
      const [kind, id] = e.dataTransfer.getData('text/an').split(':');
      if (kind === 'blk' && tab === 2) { placeBlock(BUILD[state.buildCur], z.dataset.zone, id); picked = null; }
      if (kind === 'doc' && tab === 3) {
        const st = ss(SIEVE[state.sieveCur]);
        if (z.dataset.bin === 'pool') delete st.place[id]; else st.place[id] = z.dataset.bin;
      }
      save(); draw();
    });

    const mail = $('#mail');
    mail.addEventListener('input', e => { if (e.target.dataset.student) { student[e.target.dataset.student] = e.target.value; saveStudent(); } });
    mail.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'download') download();
      if (a.dataset.act === 'reset' && confirm('Стереть все ответы и рецензию в этом браузере и начать практикум заново? Отменить будет нельзя.')) {
        state = blank(); save(); go(1);
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && picked) { picked = null; draw(); } });
  };

  bind();
  draw();
})();
