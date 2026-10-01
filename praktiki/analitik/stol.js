/* Рабочий стол практикума «Аналитик данных: первая неделя».

   1. Данные, состояние, сохранение     5. Письмо 3: сито
   2. Общие куски: результат запроса    6. Письмо 4: свой запрос
   3. Письмо 1: ревью                   7. Отчёт
   4. Письмо 2: сборка из блоков        8. Вкладки и запуск

   Работа хранится в localStorage этого браузера. В отчёт попадает и итог
   первой попытки, и итог последней. */
(() => {
  const { FROM, ERRORS, LETTERS, REVIEW, BUILD, SIEVE, WRITE } = window.AN;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ── 1. Данные, состояние, сохранение ─────────────────────────── */
  const DB = Object.fromEntries(Object.entries(window.HH_RAW).map(([k, v]) => [k, MQ.revive(v)]));
  const idOf = d => String(d._id);
  const KEY = 'mongodb-analitik-v1', SKEY = 'mongodb-analitik-student';

  const blank = () => ({ open: 1, passed: {}, review: {}, reviewChecked: false, reviewFirst: null, reviewLast: null,
    build: {}, buildCur: 0, sieve: {}, sieveCur: 0, write: {} });
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v || fallback; } catch (_) { return fallback; } };
  let state = Object.assign(blank(), read(KEY, {}));
  let student = read(SKEY, { name: '', group: '' });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { } };
  const saveStudent = () => { try { localStorage.setItem(SKEY, JSON.stringify(student)); } catch (_) { } };
  let tab = Math.min(state.open, 4);
  const runs = {};   // последние выполнения: ключ → { docs | error }

  /* Ожидаемый результат задания считается по эталонному запросу. */
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
      if (collection && !DB[collection]) return { error: `Коллекции ${collection} в базе hh нет.` };
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
  }[coll] || (() => idOf(d)))();
  const sub = (coll, d) => ({
    resumes: () => `${d.city}, ${d.salary} ₽`,
    vacancies: () => `${d.city}, ${d.salary.from}–${d.salary.to} ₽`,
    companies: () => `${d.city}, сотрудников: ${d.employees}`,
    interviews: () => `${d.stage}, ${d.format}, ${date(d.when)}`,
  }[coll] || (() => ''))();

  const docItem = (coll, d, mark) => {
    const TAG = { ok: '<span class="tag tag--ok">нужен</span>', extra: '<span class="tag tag--extra">лишний</span>', miss: '<span class="tag tag--miss">не найден</span>' };
    return `<li class="${mark || ''}"><details><summary>${mark ? TAG[mark] : ''}<span>${esc(title(coll, d))}</span><small>${esc(sub(coll, d))}</small></summary>`
      + `<pre>${esc(MQ.show(d))}</pre></details></li>`;
  };

  /* Результат выполнения. С want — сравнение с нужным результатом. */
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
      head += sameSet(docs, want) ? ' · совпадает с заявкой' : ` · лишних: ${extra}, не найдено: ${missing.length}`;
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

  /* ── 3. Письмо 1: ревью ───────────────────────────────────────── */
  const rv = id => (state.review[id] = state.review[id] || { verdict: null, kind: '', comment: '', fix: '' });
  const reviewRight = r => {
    const s = rv(r.id);
    if (r.error === null) return s.verdict === 'ok';
    return s.verdict === 'err' && s.kind === r.error;
  };
  const reviewScore = () => REVIEW.filter(reviewRight).length;

  const reviewCard = (r, n) => {
    const s = rv(r.id);
    const checked = state.reviewChecked;
    const right = checked && reviewRight(r);
    const want = expected(r.coll, r.answer);
    let after = '';
    if (checked) {
      const kind = r.error ? ERRORS.find(e => e[0] === r.error)[1] : '';
      after = `<div class="why${right ? '' : ' why--bad'}"><b>${right ? 'Оценка верна' : 'Оценка неверна'}</b>`
        + (r.error ? `Ошибка: ${esc(kind)}. ` : 'Запрос верный. ') + esc(r.why)
        + `<pre>db.${r.coll}.find(${esc(r.answer)})</pre></div>`;
      if (s.fix.trim()) {
        const fr = run(r.coll, s.fix);
        const good = !fr.error && sameSet(fr.docs, want);
        after += `<p class="note">${good ? '✓ Ваш исправленный запрос возвращает нужный результат.' : '✗ Ваш исправленный запрос возвращает не тот результат, что нужен по задаче.'}</p>`;
      }
    }
    return `<article class="card${checked ? (right ? ' card--ok' : ' card--bad') : ''}" data-review="${r.id}">`
      + `<div class="card__head"><span>Запрос <b>${n}</b> из ${REVIEW.length} · ${esc(r.author)}</span><span>коллекция ${r.coll}</span></div>`
      + `<div class="card__body"><p class="card__task"><b>Задача:</b> ${esc(r.task)}</p>`
      + `<pre class="q">db.${r.coll}.find(${esc(r.query)})</pre>`
      + `<div class="claim"><b>Коллега пишет</b>${esc(r.claim)}</div>`
      + `<div class="row"><button type="button" class="btn btn--ghost btn--small" data-run="orig">Выполнить запрос коллеги</button></div>`
      + `<div data-out="orig">${resultHtml(r.coll, runs['r-orig-' + r.id])}</div>`
      + `<span class="lbl">Ваше решение</span><div class="verdict">`
      + `<button type="button" class="chip" data-verdict="ok" aria-pressed="${s.verdict === 'ok'}">Запрос верный</button>`
      + `<button type="button" class="chip" data-verdict="err" aria-pressed="${s.verdict === 'err'}">Есть ошибка</button></div>`
      + `<div class="field"${s.verdict === 'err' ? '' : ' hidden'}><label for="k-${r.id}">Вид ошибки</label><select id="k-${r.id}" data-kind>`
      + `<option value="">— выберите —</option>${ERRORS.map(([id, t]) => `<option value="${id}"${s.kind === id ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`
      + `<div class="field"><label for="c-${r.id}">Комментарий к ревью</label><textarea id="c-${r.id}" data-comment placeholder="Что не так и как исправить. Для верного запроса — почему он верный.">${esc(s.comment)}</textarea></div>`
      + `<div class="field"><label for="f-${r.id}">Исправленный запрос (необязательно)</label><textarea id="f-${r.id}" class="code" data-fix placeholder="{ … }">${esc(s.fix)}</textarea></div>`
      + `<div class="row"><button type="button" class="btn btn--ghost btn--small" data-run="fix">Выполнить исправленный</button></div>`
      + `<div data-out="fix">${resultHtml(r.coll, runs['r-fix-' + r.id])}</div>`
      + after + '</div></article>';
  };

  const reviewView = () => {
    const done = REVIEW.filter(r => rv(r.id).verdict && (rv(r.id).verdict === 'ok' || rv(r.id).kind)).length;
    return REVIEW.map((r, i) => reviewCard(r, i + 1)).join('')
      + `<div class="row"><button type="button" class="btn" data-act="check-review"${done < REVIEW.length ? ' disabled' : ''}>Проверить ревью</button>`
      + `<span class="note">Решение вынесено по ${done} из ${REVIEW.length}</span></div>`
      + (state.reviewChecked ? `<p class="summary${state.passed[1] ? ' is-pass' : ''}">Верно оценено: ${state.reviewLast} из ${REVIEW.length}`
        + (state.passed[1] ? ' · открыто письмо 2' : ' · для письма 2 нужно 6') + '</p>' : '');
  };

  const checkReview = () => {
    state.reviewChecked = true;
    state.reviewLast = reviewScore();
    if (state.reviewFirst === null) state.reviewFirst = state.reviewLast;
    if (state.reviewLast >= 6) { state.passed[1] = true; state.open = Math.max(state.open, 2); }
    save();
    draw();
  };

  /* ── 4. Письмо 2: сборка из блоков ────────────────────────────── */
  const bs = b => (state.build[b.id] = state.build[b.id] || { root: [], solved: false, attempts: 0, first: null });
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

  const blkHtml = (b, blk, placed) => {
    const x = placed ? `<button type="button" class="blk__x" data-remove="${blk.id}" title="Вернуть в набор" aria-label="Вернуть в набор">×</button>` : '';
    const cls = blk.kind ? ` blk--${blk.kind}` : blk.inner ? ' blk--inner' : '';
    const label = blk.kind === 'or' ? '$or: [ { … }, { … } ]' : blk.kind === 'elem' ? `${blk.field}: { $elemMatch: { … } }` : blk.code;
    return `<div class="blk${cls}${picked === blk.id ? ' is-picked' : ''}" draggable="true" tabindex="0" role="button" data-blk="${blk.id}">${x}${esc(label)}</div>`;
  };

  const zoneHtml = (b, zone, ids, emptyText) => `<div class="zone${picked ? ' is-target' : ''}" data-zone="${zone}">`
    + (ids.length ? ids.map(id => blkHtml(b, blockOf(b, id), true)).join('') : `<span class="zone__empty">${emptyText}</span>`) + '</div>';

  const buildView = () => {
    const cur = Math.min(state.buildCur, BUILD.length - 1);
    const b = BUILD[cur], st = bs(b);
    const placed = placedIds(st);
    const want = expected(b.coll, b.answer);
    const res = runs['b-' + b.id];
    const pills = BUILD.map((x, i) => `<button type="button" data-bcur="${i}" aria-current="${i === cur}" class="${bs(x).solved ? 'is-ok' : bs(x).attempts ? 'is-bad' : ''}">${i + 1}</button>`).join('');

    const rootItems = st.root.map(e => {
      const blk = blockOf(b, e.id);
      if (blk.kind === 'or') {
        return `<div class="box" data-blk="${e.id}" draggable="true"><div class="box__line"><span>$or: [</span><button type="button" class="blk__x" data-remove="${e.id}" aria-label="Убрать $or">×</button></div>`
          + e.branches.map((br, i) => `<div class="box__branch">ветка ${i + 1}: {</div>${zoneHtml(b, 'or:' + i, br, 'условия этой ветки')}<div class="box__branch">}</div>`).join('')
          + `<div class="branch-tools"><button type="button" class="btn btn--ghost btn--small" data-branch="add">+ ветка</button>`
          + (e.branches.length > 2 ? `<button type="button" class="btn btn--ghost btn--small" data-branch="del">− ветка</button>` : '') + '</div><div class="box__line">]</div></div>';
      }
      if (blk.kind === 'elem') {
        return `<div class="box" data-blk="${e.id}" draggable="true"><div class="box__line"><span>${esc(blk.field)}: { $elemMatch: {</span><button type="button" class="blk__x" data-remove="${e.id}" aria-label="Убрать $elemMatch">×</button></div>`
          + zoneHtml(b, 'elem', e.items, 'условия для одного элемента массива') + '<div class="box__line">} }</div></div>';
      }
      return blkHtml(b, blk, true);
    }).join('');

    const tray = b.blocks.filter(x => !placed.includes(x.id)).map(x => blkHtml(b, x, false)).join('');
    let after = '';
    if (st.solved) after = `<div class="why"><b>Заявка выполнена</b>${esc(b.why)}</div>`;
    else if (st.attempts >= 3) after = `<details class="why why--bad"><summary>Разбор заявки (после трёх попыток)</summary>${esc(b.why)}</details>`;

    return `<div class="pills" aria-label="Заявки">${pills}</div>`
      + `<article class="card${st.solved ? ' card--ok' : ''}"><div class="card__head"><span>Заявка <b>${cur + 1}</b> из ${BUILD.length} · ${esc(b.client)}</span><span>коллекция ${b.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(b.request)}</p>`
      + `<p class="note">Под эту заявку в базе подходит документов: ${want.length}.</p></div></article>`
      + `<div class="build"><div><span class="lbl">Набор блоков</span><div class="tray" data-zone="tray">${tray || '<span class="zone__empty">Все блоки в фильтре</span>'}</div>`
      + '<p class="note">Перетащите блок в фильтр или нажмите на блок, а затем на место в фильтре. Пунктирная рамка у блока — условие для элемента массива: имя поля в нём записано без пути.</p></div>'
      + `<div><span class="lbl">Фильтр</span><div class="composer"><div class="line">db.${b.coll}.find({</div>${`<div class="zone${picked ? ' is-target' : ''}" data-zone="root">`
        + (rootItems || '<span class="zone__empty">Положите сюда условия</span>') + '</div>'}<div class="line">})</div></div>`
      + `<div class="row"><button type="button" class="btn" data-act="run-build">Выполнить</button>`
      + `<button type="button" class="btn btn--ghost btn--small" data-act="copy-build">Копировать запрос</button>`
      + `<span class="note">Попыток: ${st.attempts}</span></div>`
      + `<pre class="q" id="build-text">db.${b.coll}.find(${esc(composeText(b))})</pre>`
      + resultHtml(b.coll, res, want) + after + '</div></div>'
      + `<p class="summary${state.passed[2] ? ' is-pass' : ''}">Решено заявок: ${BUILD.filter(x => bs(x).solved).length} из ${BUILD.length}`
      + (state.passed[2] ? ' · открыто письмо 3' : ' · для письма 3 нужно 4') + '</p>';
  };

  const runBuild = () => {
    const b = BUILD[state.buildCur], st = bs(b);
    const res = run(b.coll, composeText(b));
    runs['b-' + b.id] = res;
    if (!st.solved) {
      st.attempts++;
      const ok = !res.error && sameSet(res.docs, expected(b.coll, b.answer));
      if (st.first === null) st.first = ok;
      if (ok) st.solved = true;
    }
    if (BUILD.filter(x => bs(x).solved).length >= 4) { state.passed[2] = true; state.open = Math.max(state.open, 3); }
    save();
    draw();
  };

  /* ── 5. Письмо 3: сито ────────────────────────────────────────── */
  const ss = s => (state.sieve[s.id] = state.sieve[s.id] || { place: {}, checked: false, score: null });
  const SIEVE_TOTAL = SIEVE.length * DB.resumes.length;
  const sieveScore = () => SIEVE.reduce((n, s) => n + (ss(s).score || 0), 0);

  const fieldLines = (d, fields) => fields.map(f => (f in d ? `${f}: ${MQ.show(d[f], '')}` : `${f}: — поля нет`)).join('\n');

  const docCard = (s, d, where) => {
    const st = ss(s);
    const truth = MQ.match(d, MQ.parse(s.filter)) ? 'in' : 'out';
    const mark = st.checked ? (st.place[idOf(d)] === truth ? ' is-ok' : ' is-bad') : '';
    const tools = st.checked ? `<span class="note">${truth === 'in' ? 'попадает' : 'не попадает'}</span>`
      : (where !== 'in' ? `<button type="button" class="btn btn--ghost btn--small" data-put="in">попадёт</button>` : '')
        + (where !== 'out' ? `<button type="button" class="btn btn--ghost btn--small" data-put="out">не попадёт</button>` : '')
        + (where !== 'pool' ? `<button type="button" class="btn btn--ghost btn--small" data-put="pool">вернуть</button>` : '');
    return `<div class="doc-card${mark}" draggable="${!st.checked}" data-doc="${idOf(d)}"><div class="doc-card__name"><span>${esc(d.fio)}</span></div>`
      + `<pre>${esc(fieldLines(d, s.fields))}</pre>`
      + `<details style="margin:0 9px 6px;padding:0;border:0;background:none"><summary class="note">весь документ</summary><pre>${esc(MQ.show(d))}</pre></details>`
      + `<div class="doc-card__tools">${tools}</div></div>`;
  };

  const sieveView = () => {
    const cur = Math.min(state.sieveCur, SIEVE.length - 1);
    const s = SIEVE[cur], st = ss(s);
    const docs = DB.resumes;
    const at = d => st.place[idOf(d)] || 'pool';
    const pills = SIEVE.map((x, i) => `<button type="button" data-scur="${i}" aria-current="${i === cur}" class="${ss(x).checked ? (ss(x).score === docs.length ? 'is-ok' : 'is-bad') : ''}">${i + 1}</button>`).join('');
    const col = (where, head, cls) => `<div class="bin ${cls}" data-bin="${where}"><p class="bin__head">${head} · ${docs.filter(d => at(d) === where).length}</p>`
      + docs.filter(d => at(d) === where).map(d => docCard(s, d, where)).join('') + '</div>';
    const left = docs.filter(d => at(d) === 'pool').length;
    return `<div class="pills" aria-label="Раунды">${pills}</div>`
      + `<article class="card${st.checked ? (st.score === docs.length ? ' card--ok' : ' card--bad') : ''}"><div class="card__head"><span>Раунд <b>${cur + 1}</b> из ${SIEVE.length}</span><span>коллекция resumes</span></div>`
      + `<div class="card__body"><pre class="q">db.resumes.find(${esc(s.filter)})</pre>`
      + (st.checked ? `<p class="summary">Верно: ${st.score} из ${docs.length}</p><div class="why"><b>Почему так</b>${esc(s.why)}</div>`
        : `<div class="row"><button type="button" class="btn" data-act="check-sieve"${left ? ' disabled' : ''}>Проверить раунд</button><span class="note">${left ? `Осталось разложить: ${left}` : 'Все карточки разложены'}</span></div>`)
      + '</div></article>'
      + `<div class="sieve">${col('pool', 'Не разобраны', 'bin--pool')}${col('in', 'Попадёт в результат', 'bin--in')}${col('out', 'Не попадёт', 'bin--out')}</div>`
      + `<p class="summary${state.passed[3] ? ' is-pass' : ''}">Верно во всех раундах: ${sieveScore()} из ${SIEVE_TOTAL}`
      + (state.passed[3] ? ' · открыто письмо 4' : ` · для письма 4 нужно ${Math.ceil(SIEVE_TOTAL * 0.8)} и все раунды`) + '</p>';
  };

  const checkSieve = () => {
    const s = SIEVE[state.sieveCur], st = ss(s);
    const f = MQ.parse(s.filter);
    st.score = DB.resumes.filter(d => st.place[idOf(d)] === (MQ.match(d, f) ? 'in' : 'out')).length;
    st.checked = true;
    if (SIEVE.every(x => ss(x).checked) && sieveScore() >= Math.ceil(SIEVE_TOTAL * 0.8)) { state.passed[3] = true; state.open = Math.max(state.open, 4); }
    save();
    draw();
  };

  /* ── 6. Письмо 4: свой запрос ─────────────────────────────────── */
  const ws = w => (state.write[w.id] = state.write[w.id] || { text: '', solved: false, attempts: 0, hint: false });

  const writeCard = (w, n) => {
    const st = ws(w);
    const want = expected(w.coll, w.answer);
    return `<article class="card${st.solved ? ' card--ok' : ''}" data-write="${w.id}"><div class="card__head"><span>Запрос <b>${n}</b> из ${WRITE.length}</span><span>коллекция ${w.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(w.task)}</p><p class="note">Подходящих документов в базе: ${want.length}.</p>`
      + `<div class="field"><label for="w-${w.id}">db.${w.coll}.find(</label><textarea id="w-${w.id}" class="code" data-wtext spellcheck="false" placeholder="{ }">${esc(st.text)}</textarea><span class="lbl">)</span></div>`
      + `<div class="row"><button type="button" class="btn" data-act="run-write">Выполнить</button>`
      + `<button type="button" class="btn btn--ghost btn--small" data-act="hint">${st.hint ? 'Скрыть подсказку' : 'Подсказка'}</button>`
      + `<span class="note">Попыток: ${st.attempts}${st.solved ? ' · решено' : ''}</span></div>`
      + (st.hint ? `<div class="why"><b>Подсказка</b>${esc(w.hint)}</div>` : '')
      + `<div data-out="write">${resultHtml(w.coll, runs['w-' + w.id], runs['w-' + w.id] ? want : null)}</div></div></article>`;
  };

  const writeView = () => WRITE.map((w, i) => writeCard(w, i + 1)).join('')
    + `<p class="summary${state.passed[4] ? ' is-pass' : ''}">Решено: ${WRITE.filter(w => ws(w).solved).length} из ${WRITE.length}</p>`;

  const runWrite = id => {
    const w = WRITE.find(x => x.id === id), st = ws(w);
    const res = run(w.coll, st.text || '{}');
    runs['w-' + id] = res;
    st.attempts++;
    if (!res.error && sameSet(res.docs, expected(w.coll, w.answer))) st.solved = true;
    if (WRITE.every(x => ws(x).solved)) state.passed[4] = true;
    save();
    draw();
  };

  /* ── 7. Отчёт ─────────────────────────────────────────────────── */
  const lines = () => [
    ['Письмо 1 · ревью', state.reviewChecked ? `${state.reviewLast} из ${REVIEW.length} (с первой попытки ${state.reviewFirst})` : 'не проверено'],
    ['Письмо 2 · сборка', `${BUILD.filter(b => bs(b).solved).length} из ${BUILD.length} (с первой попытки ${BUILD.filter(b => bs(b).first === true).length})`],
    ['Письмо 3 · сито', `${sieveScore()} из ${SIEVE_TOTAL} карточек`],
    ['Письмо 4 · свой запрос', `${WRITE.filter(w => ws(w).solved).length} из ${WRITE.length}`],
  ];

  const reportMd = () => {
    const md = ['# Практикум «Аналитик данных: первая неделя»', '',
      `- Студент: ${student.name || '—'}`, `- Группа: ${student.group || '—'}`, `- Дата: ${new Date().toLocaleDateString('ru-RU')}`, '',
      '## Итоги', '', '| Часть | Результат |', '|---|---|', ...lines().map(([a, b]) => `| ${a} | ${b} |`), '',
      '## Письмо 1. Ревью запросов', ''];
    REVIEW.forEach((r, i) => {
      const s = rv(r.id);
      const kind = s.kind ? ERRORS.find(e => e[0] === s.kind)[1] : '';
      md.push(`### Запрос ${i + 1}. ${r.task}`, '', '```js', `db.${r.coll}.find(${r.query})`, '```', '',
        `- Решение: ${s.verdict === 'ok' ? 'запрос верный' : s.verdict === 'err' ? 'есть ошибка — ' + kind : 'не вынесено'}`,
        `- Оценка ${state.reviewChecked ? (reviewRight(r) ? 'верна' : 'неверна') : 'не проверена'}`,
        `- Комментарий: ${s.comment.trim() || '—'}`);
      if (s.fix.trim()) md.push('- Исправленный запрос:', '', '```js', s.fix.trim(), '```');
      md.push('');
    });
    md.push('## Письмо 2. Запросы из блоков', '');
    BUILD.forEach((b, i) => {
      const st = bs(b);
      md.push(`### Заявка ${i + 1}. ${b.client}`, '', b.request, '', '```js', `db.${b.coll}.find(${composeText(b)})`, '```', '',
        `- ${st.solved ? 'Решено' : 'Не решено'}, попыток: ${st.attempts}`, '');
    });
    md.push('## Письмо 3. Сито', '', '| Раунд | Фильтр | Верно |', '|---|---|---|');
    SIEVE.forEach((s, i) => md.push(`| ${i + 1} | \`${s.filter}\` | ${ss(s).checked ? `${ss(s).score} из ${DB.resumes.length}` : 'не проверен'} |`));
    md.push('', '## Письмо 4. Свои запросы', '');
    WRITE.forEach((w, i) => {
      const st = ws(w);
      md.push(`### ${i + 1}. ${w.task}`, '', '```js', `db.${w.coll}.find(${st.text.trim() || '{ }'})`, '```', '',
        `- ${st.solved ? 'Результат совпадает с нужным' : 'Не решено'}, попыток: ${st.attempts}`, '');
    });
    return md.join('\n');
  };

  const reportForm = () => `<div class="task"><b>Что сдать</b>Файл отчёта .md. В него попадают решения по всем письмам, комментарии к ревью и тексты запросов.</div>`
    + `<div class="field"><label for="st-name">Фамилия и имя</label><input id="st-name" data-student="name" value="${esc(student.name)}"></div>`
    + `<div class="field"><label for="st-group">Группа</label><input id="st-group" data-student="group" value="${esc(student.group)}"></div>`
    + `<ul class="progress">${lines().map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('')}</ul>`
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

  /* ── 8. Вкладки, отрисовка, события ───────────────────────────── */
  const TABS = [[1, 'Письмо 1'], [2, 'Письмо 2'], [3, 'Письмо 3'], [4, 'Письмо 4'], [5, 'Отчёт']];
  const isOpen = t => t === 5 || t <= state.open;

  const draw = () => {
    $('#tabs').innerHTML = TABS.map(([t, n]) => `<button type="button" role="tab" data-tab="${t}" aria-selected="${tab === t}"${isOpen(t) ? '' : ' disabled'}>${n}</button>`).join('');
    $('#steps').innerHTML = [['Ревью', 1], ['Сборка', 2], ['Сито', 3], ['Свой запрос', 4]].map(([n, t]) =>
      `<li class="${state.passed[t] ? 'is-done' : isOpen(t) ? 'is-open' : ''}">${t} · ${n}</li>`).join('');
    const scrollY = $('#work').parentElement.scrollTop;
    if (tab === 5) {
      $('#mail').innerHTML = reportForm();
      $('#work').innerHTML = `<article class="card"><div class="card__head"><span>Предпросмотр отчёта</span></div><div class="card__body"><pre class="q">${esc(reportMd())}</pre></div></article>`;
    } else {
      $('#mail').innerHTML = letterHtml(tab);
      $('#work').innerHTML = [reviewView, buildView, sieveView, writeView][tab - 1]();
    }
    $('#work').parentElement.scrollTop = scrollY;
  };

  const bind = () => {
    $('#tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (!b || b.disabled) return;
      tab = +b.dataset.tab;
      picked = null;
      draw();
      $('#work').parentElement.scrollTop = 0;
    });

    const work = $('#work');
    work.addEventListener('click', e => {
      const t = e.target;
      const act = t.closest('[data-act]');
      /* Ревью */
      const rcard = t.closest('[data-review]');
      if (rcard) {
        const r = REVIEW.find(x => x.id === rcard.dataset.review), s = rv(r.id);
        const v = t.closest('[data-verdict]');
        if (v) { s.verdict = v.dataset.verdict; save(); draw(); return; }
        const runBtn = t.closest('[data-run]');
        if (runBtn) {
          const which = runBtn.dataset.run;
          runs[`r-${which}-${r.id}`] = run(r.coll, which === 'orig' ? r.query : (s.fix || '{}'));
          rcard.querySelector(`[data-out="${which}"]`).innerHTML = resultHtml(r.coll, runs[`r-${which}-${r.id}`]);
          return;
        }
      }
      if (act) {
        const a = act.dataset.act;
        if (a === 'check-review') return checkReview();
        if (a === 'run-build') return runBuild();
        if (a === 'copy-build') {
          const text = $('#build-text').textContent;
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
            () => { act.textContent = 'Скопировано'; }, () => { act.textContent = 'Выделите текст ниже'; });
          return;
        }
        if (a === 'check-sieve') return checkSieve();
        const wcard = t.closest('[data-write]');
        if (a === 'run-write' && wcard) return runWrite(wcard.dataset.write);
        if (a === 'hint' && wcard) { const st = ws(WRITE.find(x => x.id === wcard.dataset.write)); st.hint = !st.hint; save(); draw(); return; }
      }
      /* Сборка */
      const bcur = t.closest('[data-bcur]');
      if (bcur) { state.buildCur = +bcur.dataset.bcur; picked = null; save(); draw(); return; }
      if (tab === 2) {
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
      if (put) {
        const id = put.closest('[data-doc]').dataset.doc, st = ss(SIEVE[state.sieveCur]);
        if (put.dataset.put === 'pool') delete st.place[id]; else st.place[id] = put.dataset.put;
        save(); draw();
      }
    });

    work.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.blk')) { e.preventDefault(); e.target.click(); }
    });

    work.addEventListener('input', e => {
      const t = e.target;
      const rcard = t.closest('[data-review]');
      if (rcard) {
        const s = rv(rcard.dataset.review);
        if (t.matches('[data-kind]')) s.kind = t.value;
        if (t.matches('[data-comment]')) s.comment = t.value;
        if (t.matches('[data-fix]')) s.fix = t.value;
        save();
        if (t.matches('[data-kind]')) draw();
        return;
      }
      const wcard = t.closest('[data-write]');
      if (wcard && t.matches('[data-wtext]')) { ws(WRITE.find(x => x.id === wcard.dataset.write)).text = t.value; save(); }
    });
    work.addEventListener('change', e => {
      if (e.target.matches('[data-kind]')) { rv(e.target.closest('[data-review]').dataset.review).kind = e.target.value; save(); draw(); }
    });

    /* Перетаскивание: блоки сборки и карточки сита. */
    work.addEventListener('dragstart', e => {
      const blk = e.target.closest('[data-blk]');
      const doc = e.target.closest('[data-doc]');
      if (blk && tab === 2) { e.dataTransfer.setData('text/an', 'blk:' + blk.dataset.blk); e.stopPropagation(); }
      else if (doc && tab === 3) e.dataTransfer.setData('text/an', 'doc:' + doc.dataset.doc);
      e.dataTransfer.effectAllowed = 'move';
    });
    const target = e => e.target.closest(tab === 2 ? '[data-zone]' : '[data-bin]');
    work.addEventListener('dragover', e => {
      const z = target(e);
      if (!z || !e.dataTransfer.types.includes('text/an')) return;
      e.preventDefault();
      work.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over'));
      z.classList.add('is-over');
    });
    work.addEventListener('dragleave', e => { const z = target(e); if (z && !z.contains(e.relatedTarget)) z.classList.remove('is-over'); });
    work.addEventListener('drop', e => {
      const z = target(e);
      if (!z) return;
      e.preventDefault();
      const [kind, id] = e.dataTransfer.getData('text/an').split(':');
      if (kind === 'blk' && tab === 2) { placeBlock(BUILD[state.buildCur], z.dataset.zone, id); picked = null; }
      if (kind === 'doc' && tab === 3) {
        const st = ss(SIEVE[state.sieveCur]);
        if (!st.checked) { if (z.dataset.bin === 'pool') delete st.place[id]; else st.place[id] = z.dataset.bin; }
      }
      save(); draw();
    });

    const mail = $('#mail');
    mail.addEventListener('input', e => { if (e.target.dataset.student) { student[e.target.dataset.student] = e.target.value; saveStudent(); } });
    mail.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'download') download();
      if (a.dataset.act === 'reset' && confirm('Стереть все решения практикума в этом браузере? Отменить будет нельзя.')) {
        state = blank(); save(); tab = 1; draw();
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && picked) { picked = null; draw(); } });
  };

  bind();
  draw();
})();
