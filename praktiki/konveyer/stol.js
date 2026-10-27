/* Рабочий стол практикума «Аналитик витрины: конвейеры агрегации».

   1. Данные, состояние, сохранение      6. Письмо 4: свой конвейер
   2. Выполнение и результат             7. Оценка и рецензия
   3. Письмо 1: ревью                    8. Отчёт
   4. Письмо 2: сборка из стадий         9. Вкладки и события
   5. Письмо 3: предсказание

   По ходу работы ничего не оценивается: конвейеры выполняются и показывают
   результат, но не сравниваются с нужным. Письма открываются кнопкой «Дальше»
   без условий. После «Сдать работу» ответы закрываются и открывается рецензия.
   Работа хранится в localStorage этого браузера. */
(() => {
  const { FROM, ERRORS, LETTERS, REVIEW, BUILD, CARDS, PREDICT, WRITE } = window.KV;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ── 1. Данные, состояние, сохранение ─────────────────────────── */
  const DB = Object.fromEntries(Object.entries(window.SHOP_RAW).map(([k, v]) => [k, MQ.revive(v)]));
  const KEY = 'mongodb-konveyer-v1', SKEY = 'mongodb-konveyer-student';
  const blank = () => ({ open: 1, submitted: false, submittedAt: null,
    review: {}, build: {}, buildCur: 0, predict: {}, write: {} });
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v || fallback; } catch (_) { return fallback; } };
  let state = Object.assign(blank(), read(KEY, {}));
  let student = read(SKEY, { name: '', group: '' });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { } };
  const saveStudent = () => { try { localStorage.setItem(SKEY, JSON.stringify(student)); } catch (_) { } };
  let tab = state.submitted ? 5 : Math.min(state.open, 4);
  const runs = {};
  const locked = () => state.submitted;
  const dis = () => (locked() ? ' disabled' : '');

  /* ── 2. Выполнение и результат ────────────────────────────────── */
  const run = (coll, text) => {
    try {
      const { collection, pipeline } = AG.parse(text);
      if (collection && collection !== coll) return { error: `Конвейер обращается к коллекции ${collection}, а в задании нужна ${coll}.` };
      return AG.run(DB[coll], pipeline);
    } catch (e) {
      return { error: e instanceof AG.AggError || e instanceof AG.QueryError ? e.message : 'Конвейер не разобран: ' + e.message };
    }
  };
  /* Сравнение результатов: порядок документов важен, порядок полей — нет. */
  const canon = v => {
    if (Array.isArray(v)) return v.map(canon);
    if (v instanceof Date) return { $d: v.getTime() };
    if (v && typeof v === 'object' && !(v instanceof MQ.OID)) return Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])]));
    if (typeof v === 'number') return Math.round(v * 1e6) / 1e6;
    return v;
  };
  const sameDocs = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
  const expectedCache = {};
  const expected = (coll, text) => (expectedCache[coll + text] = expectedCache[coll + text] || run(coll, text).docs);
  const solved = (coll, text, answer) => { if (!text.trim()) return false; const r = run(coll, text); return !r.error && sameDocs(r.docs, expected(coll, answer)); };

  const stepsHtml = (coll, steps) => {
    const max = Math.max(DB[coll].length, ...steps.map(s => s.count), 1);
    const row = (name, n) => `<div class="sflow__row"><code>${esc(name)}</code><span class="sflow__bar"><i style="width:${Math.max(n ? 1.5 : 0, n / max * 100).toFixed(1)}%"></i></span><b>${n}</b></div>`;
    return `<div class="sflow"><span class="lbl">Документов после каждой стадии</span>${row('вход · ' + coll, DB[coll].length)}${steps.map(s => row(s.name, s.count)).join('')}</div>`;
  };
  const resultHtml = (coll, res, want) => {
    if (!res) return '';
    if (res.error) return `<div class="res"><div class="res__err">${esc(res.error)}</div></div>`;
    let head = `Документов в результате: ${res.docs.length}`;
    if (want) head += sameDocs(res.docs, want) ? ' · совпадает с нужным' : ' · не совпадает с нужным';
    const items = res.docs.slice(0, 30).map(d => `<li><pre>${esc(MQ.show(d))}</pre></li>`).join('');
    const more = res.docs.length > 30 ? `<li class="res__more">… ещё ${res.docs.length - 30}</li>` : '';
    return `<div class="res">${stepsHtml(coll, res.steps)}<div class="res__head"><span>${head}</span><span>db.${coll}</span></div>`
      + (res.docs.length ? `<ol>${items}${more}</ol>` : '<div class="res__empty">Ни одного документа.</div>') + '</div>';
  };
  const wantHtml = (coll, answer) => `<details class="want"><summary>Нужный результат</summary>${resultHtml(coll, run(coll, answer))}</details>`;

  const letterHtml = n => {
    const L = LETTERS[n - 1];
    return `<article class="letter"><div class="letter__head">От: <b>${esc(FROM)}</b><span class="letter__subject">${esc(L.subject)}</span></div>`
      + `<div class="letter__body">${L.body.map(p => `<p>${esc(p)}</p>`).join('')}</div></article>`
      + `<div class="task"><b>Задание</b>${esc(L.task)}</div>` + (n === 3 ? cardsHtml() : '');
  };
  const nextHtml = (n, left) => {
    if (locked()) return '<p class="note">Работа сдана. Ответы можно посмотреть, но не изменить. Рецензия — на вкладке «Рецензия».</p>';
    const warn = left ? `<span class="note">Не заполнено: ${left}. Перейти можно и так — вернуться к письму можно в любой момент до сдачи.</span>` : '';
    if (n < 4) return `<div class="row"><button type="button" class="btn" data-next="${n + 1}">Дальше: письмо ${n + 1} →</button>${warn}</div>`;
    return `<div class="row"><button type="button" class="btn" data-act="submit">Сдать работу</button>${warn}</div>`;
  };

  /* ── 3. Письмо 1: ревью ───────────────────────────────────────── */
  const rv = id => (state.review[id] = state.review[id] || { verdict: null, kind: '', comment: '', fix: '' });
  const reviewDone = r => { const s = rv(r.id); return s.verdict === 'ok' || (s.verdict === 'err' && s.kind); };
  const reviewRight = r => { const s = rv(r.id); return r.error === null ? s.verdict === 'ok' : s.verdict === 'err' && s.kind === r.error; };
  const errName = id => (ERRORS.find(e => e[0] === id) || ['', ''])[1];

  const reviewCard = (r, n) => {
    const s = rv(r.id);
    return `<article class="card" data-review="${r.id}">`
      + `<div class="card__head"><span>Конвейер <b>${n}</b> из ${REVIEW.length} · ${esc(r.author)}</span><span>коллекция ${r.coll}</span></div>`
      + `<div class="card__body"><p class="card__task"><b>Задача:</b> ${esc(r.task)}</p>`
      + `<pre class="q">db.${r.coll}.aggregate(${esc(r.query)})</pre>`
      + `<div class="claim"><b>Коллега пишет</b>${esc(r.claim)}</div>`
      + `<div class="row"><button type="button" class="btn btn--ghost btn--small" data-run="orig">Выполнить конвейер коллеги</button></div>`
      + `<div data-out="orig">${resultHtml(r.coll, runs['r-orig-' + r.id])}</div>`
      + `<span class="lbl">Ваше решение</span><div class="verdict">`
      + `<button type="button" class="chip" data-verdict="ok" aria-pressed="${s.verdict === 'ok'}"${dis()}>Конвейер верный</button>`
      + `<button type="button" class="chip" data-verdict="err" aria-pressed="${s.verdict === 'err'}"${dis()}>Есть ошибка</button></div>`
      + `<div class="field"${s.verdict === 'err' ? '' : ' hidden'}><label for="k-${r.id}">Вид ошибки</label><select id="k-${r.id}" data-kind${dis()}>`
      + `<option value="">— выберите —</option>${ERRORS.map(([id, t]) => `<option value="${id}"${s.kind === id ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`
      + `<div class="field"><label for="c-${r.id}">Комментарий к ревью</label><textarea id="c-${r.id}" data-comment${dis()} placeholder="Что не так и как исправить. Для верного конвейера — почему он верный.">${esc(s.comment)}</textarea></div>`
      + `<div class="field"><label for="f-${r.id}">Исправленный конвейер (необязательно)</label><textarea id="f-${r.id}" class="code" data-fix spellcheck="false"${dis()} placeholder="[ { … }, { … } ]">${esc(s.fix)}</textarea></div>`
      + `<div class="row"><button type="button" class="btn btn--ghost btn--small" data-run="fix">Выполнить исправленный</button></div>`
      + `<div data-out="fix">${resultHtml(r.coll, runs['r-fix-' + r.id])}</div>`
      + '</div></article>';
  };
  const reviewView = () => {
    const left = REVIEW.filter(r => !reviewDone(r)).length;
    return REVIEW.map((r, i) => reviewCard(r, i + 1)).join('') + nextHtml(1, left ? `${left} из ${REVIEW.length} конвейеров без решения` : '');
  };

  /* ── 4. Письмо 2: сборка из стадий ────────────────────────────── */
  const bs = b => (state.build[b.id] = state.build[b.id] || { order: [], runs: 0 });
  const blockOf = (b, id) => b.blocks.find(x => x.id === id);
  const composeText = b => {
    const order = bs(b).order;
    return order.length ? '[\n  ' + order.map(id => blockOf(b, id).code).join(',\n  ') + '\n]' : '[ ]';
  };
  const buildSolved = b => bs(b).order.length > 0 && solved(b.coll, composeText(b), b.answer);

  const buildView = () => {
    const cur = Math.min(state.buildCur, BUILD.length - 1);
    const b = BUILD[cur], st = bs(b);
    const pills = BUILD.map((x, i) => `<button type="button" data-bcur="${i}" aria-current="${i === cur}" class="${bs(x).order.length ? 'is-ok' : ''}">${i + 1}</button>`).join('');
    const tray = b.blocks.filter(x => !st.order.includes(x.id))
      .map(x => `<button type="button" class="blk" data-add="${x.id}"${dis()}>${esc(x.code)}</button>`).join('');
    const placed = st.order.map((id, i) => `<div class="pipe__stage"><span class="pipe__n">${i + 1}</span><code>${esc(blockOf(b, id).code)}</code>`
      + (locked() ? '' : `<span class="pipe__tools"><button type="button" data-up="${i}"${i ? '' : ' disabled'} aria-label="Выше">↑</button>`
        + `<button type="button" data-down="${i}"${i < st.order.length - 1 ? '' : ' disabled'} aria-label="Ниже">↓</button>`
        + `<button type="button" data-del="${i}" aria-label="Вернуть в набор">×</button></span>`) + '</div>').join('');
    const left = BUILD.filter(x => !bs(x).order.length).length;
    return `<div class="pills" aria-label="Заявки">${pills}</div>`
      + `<article class="card"><div class="card__head"><span>Заявка <b>${cur + 1}</b> из ${BUILD.length} · ${esc(b.client)}</span><span>коллекция ${b.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(b.request)}</p></div></article>`
      + `<div class="build"><div><span class="lbl">Набор стадий</span><div class="tray">${tray || '<span class="zone__empty">Все стадии в конвейере</span>'}</div>`
      + '<p class="note">Нажмите на стадию, чтобы добавить её в конец конвейера.</p></div>'
      + `<div><span class="lbl">Конвейер db.${b.coll}.aggregate([ … ])</span><div class="pipe">${placed || '<span class="zone__empty">Стадий пока нет</span>'}</div>`
      + `<div class="row"><button type="button" class="btn" data-act="run-build"${st.order.length ? '' : ' disabled'}>Выполнить</button></div>`
      + resultHtml(b.coll, runs['b-' + b.id]) + '</div></div>'
      + nextHtml(2, left ? `${left} из ${BUILD.length} заявок без конвейера` : '');
  };

  /* ── 5. Письмо 3: предсказание ────────────────────────────────── */
  const cardDocs = () => DB[CARDS.coll].filter(d => MQ.match(d, CARDS.filter)).slice().sort((a, b) => a.created - b.created);
  const fmtDate = d => `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  function cardsHtml() {
    return '<div class="orders"><span class="lbl">Заказы покупателя c-007 по дате</span>' + cardDocs().map(d =>
      `<div class="order"><b>${esc(d.number)}</b> · ${fmtDate(d.created)} · ${esc(d.status)} · total ${d.total}`
      + `<small>${d.items.map(it => `${esc(it.category)} ×${it.qty}`).join(', ')}</small></div>`).join('') + '</div>';
  }
  /* Варианты: результат верного конвейера и трёх ошибочных; порядок — от номера раунда. */
  const optionsOf = p => {
    const all = [p.pipeline, ...p.wrong].map((text, i) => ({ i, text: JSON.stringify(canon(run('orders', text).docs)), show: (run('orders', text).docs || []).map(d => MQ.show(d)).join('\n') }));
    const shift = PREDICT.indexOf(p) % 4;
    return all.map((_, k) => all[(k + shift + 1) % 4]);
  };
  const pr = id => (state.predict[id] = state.predict[id] || { pick: null });
  const predictRight = p => pr(p.id).pick === 0;
  const predictView = () => {
    const html = PREDICT.map((p, n) => {
      const opts = optionsOf(p);
      return `<article class="card" data-predict="${p.id}"><div class="card__head"><span>Конвейер <b>${n + 1}</b> из ${PREDICT.length}</span><span>заказы c-007</span></div>`
        + `<div class="card__body"><pre class="q">db.orders.aggregate(${esc(p.pipeline)})</pre><span class="lbl">Что вернёт сервер</span><div class="options">`
        + opts.map((o, k) => `<button type="button" class="option" data-pick="${o.i}" aria-pressed="${pr(p.id).pick === o.i}"${dis()}><b>${'АБВГ'[k]}</b><pre>${esc(o.show || '(пустой результат)')}</pre></button>`).join('')
        + '</div></div></article>';
    }).join('');
    const left = PREDICT.filter(p => pr(p.id).pick === null).length;
    return html + nextHtml(3, left ? `${left} из ${PREDICT.length} конвейеров без ответа` : '');
  };

  /* ── 6. Письмо 4: свой конвейер ───────────────────────────────── */
  const ws = w => (state.write[w.id] = state.write[w.id] || { text: '', runs: 0, hint: false });
  const writeSolved = w => solved(w.coll, ws(w).text, w.answer);
  const writeCard = (w, n) => {
    const st = ws(w);
    return `<article class="card" data-write="${w.id}"><div class="card__head"><span>Задача <b>${n}</b> из ${WRITE.length}</span><span>коллекция ${w.coll}</span></div>`
      + `<div class="card__body"><p class="card__task">${esc(w.task)}</p>`
      + `<div class="field"><label for="w-${w.id}">db.${w.coll}.aggregate(</label><textarea id="w-${w.id}" class="code tall" data-wtext spellcheck="false"${dis()} placeholder="[\n  { $match: { … } },\n  { $group: { … } }\n]">${esc(st.text)}</textarea><span class="lbl">)</span></div>`
      + `<div class="row"><button type="button" class="btn" data-act="run-write">Выполнить</button>`
      + `<button type="button" class="btn btn--ghost btn--small" data-act="hint">${st.hint ? 'Скрыть подсказку' : 'Подсказка'}</button></div>`
      + (st.hint ? `<div class="why"><b>Подсказка</b>${esc(w.hint)}</div>` : '')
      + `<div data-out="write">${resultHtml(w.coll, runs['w-' + w.id])}</div></div></article>`;
  };
  const writeView = () => {
    const left = WRITE.filter(w => !ws(w).text.trim()).length;
    return WRITE.map((w, i) => writeCard(w, i + 1)).join('') + nextHtml(4, left ? `${left} из ${WRITE.length} конвейеров не написаны` : '');
  };

  /* ── 7. Оценка и рецензия ─────────────────────────────────────── */
  const scores = () => {
    const r = REVIEW.filter(reviewRight).length, b = BUILD.filter(buildSolved).length;
    const p = PREDICT.filter(predictRight).length, w = WRITE.filter(writeSolved).length;
    const parts = [
      { name: 'Письмо 1 · ревью', got: r, of: REVIEW.length, pts: r >= 7 ? 3 : r >= 5 ? 2 : r >= 3 ? 1 : 0, max: 3, unit: 'конвейеров оценено верно' },
      { name: 'Письмо 2 · сборка', got: b, of: BUILD.length, pts: b === 5 ? 3 : b === 4 ? 2 : b >= 2 ? 1 : 0, max: 3, unit: 'заявок решено' },
      { name: 'Письмо 3 · предсказание', got: p, of: PREDICT.length, pts: p === 5 ? 2 : p >= 3 ? 1 : 0, max: 2, unit: 'результатов предсказано' },
      { name: 'Письмо 4 · свой конвейер', got: w, of: WRITE.length, pts: w === 5 ? 2 : w >= 3 ? 1 : 0, max: 2, unit: 'конвейеров решено' },
    ];
    const total = parts.reduce((n, x) => n + x.pts, 0);
    const grade = total >= 9 ? 'отлично' : total >= 7 ? 'хорошо' : total >= 5 ? 'удовлетворительно' : 'неудовлетворительно';
    return { parts, total, grade };
  };
  const nums = list => list.join(', ');
  const advice = () => {
    const out = [];
    const wrong = REVIEW.filter(r => !reviewRight(r));
    const low = t => t[0].toLowerCase() + t.slice(1);
    const topics = [...new Set(wrong.filter(r => r.error).map(r => low(errName(r.error))))];
    if (topics.length) out.push(`Ревью: повторите — ${topics.join('; ')}.`);
    if (wrong.some(r => !r.error)) out.push('Ревью: верный конвейер оценён как ошибочный. Перед решением выполняйте конвейер и сверяйте результат с задачей.');
    if (!wrong.length) out.push('Ревью: все конвейеры оценены верно.');
    const bb = BUILD.filter(b => !buildSolved(b));
    out.push(bb.length ? `Сборка: не решены заявки ${nums(bb.map(b => BUILD.indexOf(b) + 1))}.` : 'Сборка: все заявки решены.');
    const pb = PREDICT.filter(p => !predictRight(p));
    out.push(pb.length ? `Предсказание: ошибки в конвейерах ${nums(pb.map(p => PREDICT.indexOf(p) + 1))}.` : 'Предсказание: все результаты предсказаны верно.');
    const wb = WRITE.filter(w => !writeSolved(w));
    out.push(wb.length ? `Свой конвейер: не решены задачи ${nums(wb.map(w => WRITE.indexOf(w) + 1))}.` : 'Свой конвейер: все задачи решены.');
    return out;
  };
  const verdictText = s => (s.verdict === 'ok' ? 'конвейер верный' : s.verdict === 'err'
    ? 'есть ошибка — ' + (s.kind ? low1(errName(s.kind)) : 'вид не выбран') : 'решение не вынесено');
  const low1 = t => t[0].toLowerCase() + t.slice(1);

  const recenzia = () => {
    const sc = scores();
    let h = `<article class="card"><div class="card__head"><span>Рецензия</span><span>${esc(student.name || 'без имени')}</span></div><div class="card__body">`
      + `<p class="card__task">От: <b>${esc(FROM)}</b></p>`
      + `<ul class="progress">${sc.parts.map(p => `<li><span>${p.name}: ${p.got} из ${p.of} — ${p.unit}</span><span>${p.pts} / ${p.max}</span></li>`).join('')}`
      + `<li><span><b>Итого</b></span><span>${sc.total} / 10 · ${sc.grade}</span></li></ul>`
      + `<ul>${advice().map(a => `<li>${esc(a)}</li>`).join('')}</ul>`
      + '<p class="note">Комментарии к ревью преподаватель читает отдельно: автоматически оцениваются решение и вид ошибки.</p></div></article>';

    h += '<h3>Письмо 1. Ревью</h3>';
    REVIEW.forEach((r, i) => {
      const s = rv(r.id), ok = reviewRight(r);
      const fix = s.fix.trim() ? `<p class="note">Ваш исправленный конвейер: ${solved(r.coll, s.fix, r.answer) ? '✓ возвращает нужный результат' : '✗ возвращает не тот результат'}.</p>` : '';
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Конвейер <b>${i + 1}</b> · ${ok ? 'оценка верна' : 'оценка неверна'}</span><span>${r.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(r.task)}</p><pre class="q">${esc(r.query)}</pre>`
        + `<p class="note">Ваше решение: ${esc(verdictText(s))}.${s.comment.trim() ? ' Комментарий: «' + esc(s.comment.trim()) + '»' : ''}</p>`
        + `<div class="why${ok ? '' : ' why--bad'}"><b>${r.error ? 'Ошибка: ' + esc(low1(errName(r.error))) : 'Конвейер верный'}</b>${esc(r.why)}<pre>${esc(r.answer)}</pre></div>${fix}</div></article>`;
    });
    h += '<h3>Письмо 2. Сборка из стадий</h3>';
    BUILD.forEach((b, i) => {
      const ok = buildSolved(b);
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Заявка <b>${i + 1}</b> · ${ok ? 'решена' : 'не решена'}</span><span>${b.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(b.request)}</p><span class="lbl">Ваш конвейер</span><pre class="q">${esc(composeText(b))}</pre>`
        + (bs(b).order.length ? resultHtml(b.coll, run(b.coll, composeText(b)), expected(b.coll, b.answer)) : '<p class="note">Конвейер не собран.</p>')
        + `<div class="why${ok ? '' : ' why--bad'}"><b>Разбор</b>${esc(b.why)}<pre>${esc(b.answer)}</pre></div></div></article>`;
    });
    h += '<h3>Письмо 3. Предсказание</h3>';
    PREDICT.forEach((p, i) => {
      const ok = predictRight(p), opts = optionsOf(p);
      const mine = opts.findIndex(o => o.i === pr(p.id).pick), right = opts.findIndex(o => o.i === 0);
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Конвейер <b>${i + 1}</b> · ${ok ? 'верно' : 'неверно'}</span><span>c-007</span></div><div class="card__body">`
        + `<pre class="q">${esc(p.pipeline)}</pre><p class="note">Ваш ответ: ${mine < 0 ? 'нет' : 'вариант ' + 'АБВГ'[mine]}. Верный — вариант ${'АБВГ'[right]}:</p><pre class="q">${esc(opts[right].show)}</pre>`
        + `<div class="why${ok ? '' : ' why--bad'}"><b>Почему так</b>${esc(p.why)}</div></div></article>`;
    });
    h += '<h3>Письмо 4. Свой конвейер</h3>';
    WRITE.forEach((w, i) => {
      const st = ws(w), ok = writeSolved(w);
      h += `<article class="card ${ok ? 'card--ok' : 'card--bad'}"><div class="card__head"><span>Задача <b>${i + 1}</b> · ${ok ? 'решена' : 'не решена'}</span><span>${w.coll}</span></div><div class="card__body">`
        + `<p class="card__task">${esc(w.task)}</p><span class="lbl">Ваш конвейер</span><pre class="q">${esc(st.text.trim() || '[ ]')}</pre>`
        + (st.text.trim() ? resultHtml(w.coll, run(w.coll, st.text), expected(w.coll, w.answer)) : '<p class="note">Конвейер не написан.</p>')
        + `<div class="why${ok ? '' : ' why--bad'}"><b>Один из верных вариантов</b><pre>${esc(w.answer)}</pre></div>${wantHtml(w.coll, w.answer)}</div></article>`;
    });
    return h;
  };

  const submit = () => {
    const left = REVIEW.filter(r => !reviewDone(r)).length + BUILD.filter(b => !bs(b).order.length).length
      + PREDICT.filter(p => pr(p.id).pick === null).length + WRITE.filter(w => !ws(w).text.trim()).length;
    const msg = (left ? `Не заполнено ответов: ${left}. Они будут засчитаны как неверные.\n\n` : '') + 'После сдачи ответы изменить нельзя. Сдать работу?';
    if (!confirm(msg)) return;
    state.submitted = true; state.submittedAt = new Date().toISOString(); state.open = 5;
    save(); tab = 5; draw();
    $('#work').parentElement.scrollTop = 0;
  };

  /* ── 8. Отчёт ─────────────────────────────────────────────────── */
  const reportMd = () => {
    const sc = scores();
    const md = ['# Практикум «Аналитик витрины: конвейеры агрегации»', '',
      `- Студент: ${student.name || '—'}`, `- Группа: ${student.group || '—'}`,
      `- Сдано: ${state.submittedAt ? new Date(state.submittedAt).toLocaleString('ru-RU') : 'не сдано'}`, '',
      '## Рецензия', '', '| Часть | Результат | Баллы |', '|---|---|---|',
      ...sc.parts.map(p => `| ${p.name} | ${p.got} из ${p.of} | ${p.pts} / ${p.max} |`),
      `| **Итого** | | **${sc.total} / 10 · ${sc.grade}** |`, '', ...advice().map(a => `- ${a}`), '',
      '## Письмо 1. Ревью конвейеров', ''];
    REVIEW.forEach((r, i) => {
      const s = rv(r.id);
      md.push(`### ${i + 1}. ${r.task}`, '', `- Решение: ${verdictText(s)} — ${reviewRight(r) ? 'верно' : 'неверно'}`, `- Комментарий: ${s.comment.trim() || '—'}`);
      if (s.fix.trim()) md.push('- Исправленный конвейер:', '', '```js', s.fix.trim(), '```');
      md.push('');
    });
    md.push('## Письмо 2. Сборка из стадий', '');
    BUILD.forEach((b, i) => md.push(`### ${i + 1}. ${b.request}`, '', '```js', `db.${b.coll}.aggregate(${composeText(b)})`, '```', '', `- ${buildSolved(b) ? 'Решено' : 'Не решено'}, запусков: ${bs(b).runs}`, ''));
    md.push('## Письмо 3. Предсказание', '', '| № | Ответ | Оценка |', '|---|---|---|');
    PREDICT.forEach((p, i) => { const o = optionsOf(p).findIndex(x => x.i === pr(p.id).pick); md.push(`| ${i + 1} | ${o < 0 ? '—' : 'АБВГ'[o]} | ${predictRight(p) ? 'верно' : 'неверно'} |`); });
    md.push('', '## Письмо 4. Свои конвейеры', '');
    WRITE.forEach((w, i) => md.push(`### ${i + 1}. ${w.task}`, '', '```js', `db.${w.coll}.aggregate(${ws(w).text.trim() || '[ ]'})`, '```', '', `- ${writeSolved(w) ? 'Результат совпадает с нужным' : 'Не решено'}, запусков: ${ws(w).runs}`, ''));
    return md.join('\n');
  };
  const reportForm = () => '<div class="task"><b>Что сдать</b>Файл отчёта .md: рецензия с баллами, решения по всем письмам, комментарии к ревью и тексты конвейеров.</div>'
    + `<div class="field"><label for="st-name">Фамилия и имя</label><input id="st-name" data-student="name" value="${esc(student.name)}"></div>`
    + `<div class="field"><label for="st-group">Группа</label><input id="st-group" data-student="group" value="${esc(student.group)}"></div>`
    + '<div class="row"><button type="button" class="btn" data-act="download">Скачать отчёт .md</button></div>'
    + '<p class="note">Работа хранится только в этом браузере. Перед сменой компьютера скачайте отчёт.</p>';

  /* Сброс работы — только преподавателем; пароль тот же, что в практикуме «Аналитик данных». */
  const RESET_HASH = 'd8e6d5a33bc8e95ed9a2505ccb9c0087102dc21bb8f02f87ef12e32fef4d9ba9';
  const sha256 = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(x => x.toString(16).padStart(2, '0')).join('');
  const resetByTeacher = async () => {
    const pw = prompt('Сброс стирает все ответы и рецензию в этом браузере.\nПароль преподавателя:');
    if (pw === null) return;
    let ok = false;
    try { ok = (await sha256('mongodb-analitik:' + pw.trim().toLowerCase())) === RESET_HASH; }
    catch (_) { alert('Браузер не поддерживает проверку пароля. Откройте страницу по адресу https://…'); return; }
    if (!ok) { alert('Пароль неверный. Работа не сброшена.'); return; }
    state = blank(); save(); go(1); alert('Работа сброшена.');
  };
  const download = () => {
    const who = (student.name || 'student').trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_-]/gu, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([reportMd()], { type: 'text/markdown;charset=utf-8' }));
    a.download = `konveyer_${who}.md`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ── 9. Вкладки, отрисовка, события ───────────────────────────── */
  const TABS = [[1, 'Письмо 1'], [2, 'Письмо 2'], [3, 'Письмо 3'], [4, 'Письмо 4'], [5, 'Рецензия']];
  const isOpen = t => (t === 5 ? state.submitted : t <= state.open);
  const draw = () => {
    $('#tabs').innerHTML = TABS.map(([t, n]) => `<button type="button" role="tab" data-tab="${t}" aria-selected="${tab === t}"${isOpen(t) ? '' : ' disabled'}>${n}</button>`).join('');
    $('#steps').innerHTML = [['Ревью', 1], ['Сборка', 2], ['Предсказание', 3], ['Свой конвейер', 4], ['Рецензия', 5]].map(([n, t]) =>
      `<li class="${state.submitted || t < state.open ? 'is-done' : isOpen(t) ? 'is-open' : ''}">${t} · ${n}</li>`).join('');
    const y = $('#work').parentElement.scrollTop;
    if (tab === 5) { $('#mail').innerHTML = reportForm(); $('#work').innerHTML = recenzia(); }
    else { $('#mail').innerHTML = letterHtml(tab); $('#work').innerHTML = [reviewView, buildView, predictView, writeView][tab - 1](); }
    $('#work').parentElement.scrollTop = y;
  };
  const go = t => { tab = t; draw(); $('#work').parentElement.scrollTop = 0; $('#mail').parentElement.scrollTop = 0; };

  const bind = () => {
    $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b && !b.disabled) go(+b.dataset.tab); });
    const work = $('#work');
    work.addEventListener('click', e => {
      const t = e.target;
      const next = t.closest('[data-next]');
      if (next) { state.open = Math.max(state.open, +next.dataset.next); save(); go(+next.dataset.next); return; }
      const act = t.closest('[data-act]');
      if (act && act.dataset.act === 'submit') return submit();
      const done = () => { save(); draw(); };
      /* выполнение доступно и после сдачи */
      const rcard = t.closest('[data-review]');
      const runBtn = t.closest('[data-run]');
      if (rcard && runBtn) {
        const r = REVIEW.find(x => x.id === rcard.dataset.review), which = runBtn.dataset.run;
        runs[`r-${which}-${r.id}`] = run(r.coll, which === 'orig' ? r.query : (rv(r.id).fix || '[]'));
        rcard.querySelector(`[data-out="${which}"]`).innerHTML = resultHtml(r.coll, runs[`r-${which}-${r.id}`]);
        return;
      }
      const bcur = t.closest('[data-bcur]');
      if (bcur) { state.buildCur = +bcur.dataset.bcur; return done(); }
      if (act && act.dataset.act === 'run-build') { const b = BUILD[state.buildCur]; runs['b-' + b.id] = run(b.coll, composeText(b)); bs(b).runs++; return done(); }
      const wcard = t.closest('[data-write]');
      if (act && act.dataset.act === 'run-write' && wcard) { const w = WRITE.find(x => x.id === wcard.dataset.write); runs['w-' + w.id] = run(w.coll, ws(w).text || '[]'); ws(w).runs++; return done(); }
      if (act && act.dataset.act === 'hint' && wcard) { const st = ws(WRITE.find(x => x.id === wcard.dataset.write)); st.hint = !st.hint; return done(); }
      if (locked()) return;
      if (rcard) { const v = t.closest('[data-verdict]'); if (v) { rv(rcard.dataset.review).verdict = v.dataset.verdict; return done(); } }
      if (tab === 2) {
        const b = BUILD[state.buildCur], st = bs(b);
        const add = t.closest('[data-add]'); if (add) { st.order.push(add.dataset.add); return done(); }
        const up = t.closest('[data-up]'), down = t.closest('[data-down]'), del = t.closest('[data-del]');
        if (up) { const i = +up.dataset.up; [st.order[i - 1], st.order[i]] = [st.order[i], st.order[i - 1]]; return done(); }
        if (down) { const i = +down.dataset.down; [st.order[i + 1], st.order[i]] = [st.order[i], st.order[i + 1]]; return done(); }
        if (del) { st.order.splice(+del.dataset.del, 1); return done(); }
      }
      const pick = t.closest('[data-pick]');
      if (pick) { pr(pick.closest('[data-predict]').dataset.predict).pick = +pick.dataset.pick; return done(); }
    });
    work.addEventListener('input', e => {
      if (locked()) return;
      const t = e.target, rcard = t.closest('[data-review]');
      if (rcard) { const s = rv(rcard.dataset.review); if (t.matches('[data-comment]')) s.comment = t.value; if (t.matches('[data-fix]')) s.fix = t.value; save(); return; }
      const wcard = t.closest('[data-write]');
      if (wcard && t.matches('[data-wtext]')) { ws(WRITE.find(x => x.id === wcard.dataset.write)).text = t.value; save(); }
    });
    work.addEventListener('change', e => {
      if (locked() || !e.target.matches('[data-kind]')) return;
      rv(e.target.closest('[data-review]').dataset.review).kind = e.target.value; save(); draw();
    });
    const mail = $('#mail');
    mail.addEventListener('input', e => { if (e.target.dataset.student) { student[e.target.dataset.student] = e.target.value; saveStudent(); } });
    mail.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'download') download(); });
    $('#reset').addEventListener('click', resetByTeacher);
  };
  bind(); draw();
})();
