/* Тест модуля 1. Одна попытка, 30 минут, автоматическая проверка.

   Состояние живёт в localStorage этого браузера:
     mdb-test-m1:state  — идёт попытка (ФИО, язык, порядок, ответы, дедлайн, уходы)
     mdb-test-m1:result — попытка завершена, оценка зафиксирована

   Пока лежит result, тест больше не запускается: любое открытие ссылки,
   перезагрузка и кнопка «назад» показывают готовую оценку. Оговорка: это
   защита в пределах браузера. Инкогнито, другое устройство или очистка
   данных сайта её снимают — серверной проверки здесь нет. Поэтому
   преподаватель принимает только первый присланный код.

   Порядок вопросов и вариантов перемешивается при старте и сохраняется
   в состоянии. Ответы хранятся и кодируются в исходной нумерации —
   проверка от перемешивания не зависит. */

const KEY_STATE = QUIZ.id + ':state';
const KEY_RESULT = QUIZ.id + ':result';
const LANG_NAMES = { python: 'Python', cpp: 'C++', go: 'Go', ruby: 'Ruby' };

const $ = id => document.getElementById(id);
const screens = { start: $('screen-start'), quiz: $('screen-quiz'), result: $('screen-result') };

let state = null;   // { name, group, lang, order, optOrder, answers, deadline, leaves }
let tick = null;
let finishing = false;

/* ---------- хранилище (не падаем, если оно недоступно) ---------- */

function load(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }
}

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
  $('timer').classList.toggle('hidden', name !== 'quiz');
  window.scrollTo(0, 0);
}

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  const rnd = new Uint32Array(n);
  crypto.getRandomValues(rnd);
  for (let i = n - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- запуск ---------- */

function init() {
  const done = load(KEY_RESULT);
  if (done) { renderResult(done, true); return; }

  const saved = load(KEY_STATE);
  if (saved && saved.answers && saved.order) {
    state = saved;
    if (Date.now() >= state.deadline) { finish(true); return; }
    startQuiz();
    return;
  }
  show('start');
}

let chosenLang = null;
document.querySelectorAll('#langs button').forEach(btn => {
  btn.addEventListener('click', () => {
    chosenLang = btn.dataset.lang;
    document.querySelectorAll('#langs button').forEach(b => b.setAttribute('aria-checked', String(b === btn)));
  });
});

$('btn-start').addEventListener('click', () => {
  const name = $('in-name').value.trim().replace(/\s+/g, ' ');
  const group = $('in-group').value.trim();
  const err = $('start-err');
  if (name.length < 3 || !name.includes(' ')) { err.textContent = 'Укажите фамилию и имя полностью — например, «Иванов Иван».'; return; }
  if (!group) { err.textContent = 'Укажите группу.'; return; }
  if (!chosenLang) { err.textContent = 'Выберите язык: от него зависит код в вопросах.'; return; }
  if (!confirm(`Начать тест? Язык: ${LANG_NAMES[chosenLang]}. Сменить его и пройти тест заново будет нельзя, отсчёт 30 минут пойдёт сразу.`)) return;
  err.textContent = '';

  const optOrder = {};
  QUIZ.questions.forEach(q => { optOrder[q.id] = shuffled(q.options.length); });
  state = {
    name, group, lang: chosenLang,
    order: shuffled(QUIZ.questions.length), optOrder,
    answers: {}, leaves: 0, startedAt: Date.now(),
    deadline: Date.now() + QUIZ.minutes * 60000
  };
  if (!save(KEY_STATE, state)) {
    err.textContent = 'Браузер запретил сохранение данных сайта. Отключите приватный режим — иначе результат потеряется.';
    return;
  }
  startQuiz();
});

function startQuiz() {
  renderQuestions();
  show('quiz');
  updateLeaves();
  startTimer();
}

/* ---------- таймер ---------- */

function startTimer() {
  updateTimer();
  clearInterval(tick);
  tick = setInterval(updateTimer, 250);
}

function updateTimer() {
  const left = Math.max(0, state.deadline - Date.now());
  const el = $('timer');
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  el.textContent = `${m}:${String(s).padStart(2, '0')}`;
  el.classList.toggle('warn', left <= 300000 && left > 60000);
  el.classList.toggle('danger', left <= 60000);
  if (left === 0) { clearInterval(tick); finish(true); }
}

/* ---------- уход со вкладки ---------- */

/* Перезагрузка и закрытие вкладки тоже прячут страницу, но уходом не считаются:
   pagehide приходит раньше visibilitychange. */
let unloading = false;
window.addEventListener('pagehide', () => { unloading = true; });
window.addEventListener('pageshow', () => { unloading = false; });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden' || unloading || !state || finishing || load(KEY_RESULT)) return;
  state.leaves = (state.leaves || 0) + 1;
  save(KEY_STATE, state);
  updateLeaves();
});

function updateLeaves() {
  const note = $('leave-note');
  if (!state || !state.leaves) { note.classList.add('hidden'); return; }
  note.classList.remove('hidden');
  note.innerHTML = `<b>Вы уходили со вкладки теста: ${state.leaves}.</b> Это записано в код результата. Время при этом не останавливается.`;
}

/* кадр Compass — во весь экран по щелчку, закрывается щелчком или Esc */
$('questions').addEventListener('click', e => {
  const img = e.target.closest('.q-img img');
  if (!img) return;
  const layer = document.createElement('div');
  layer.className = 'zoom';
  layer.innerHTML = `<img src="${img.getAttribute('src')}" alt="${esc(img.alt)}" draggable="false">`;
  const close = () => { layer.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  layer.addEventListener('click', close);
  layer.addEventListener('contextmenu', ev => ev.preventDefault());
  document.addEventListener('keydown', onKey);
  document.body.appendChild(layer);
});

['copy', 'cut', 'contextmenu', 'dragstart'].forEach(type => {
  $('questions').addEventListener(type, e => e.preventDefault());
});

/* ---------- вопросы ---------- */

function codeFor(q) {
  if (!q.code) return null;
  if (q.code.shell) return { caption: 'mongosh · оболочка', text: q.code.shell };
  return { caption: LANG_NAMES[state.lang], text: q.code[state.lang] };
}

function renderQuestions() {
  const host = $('questions');
  host.innerHTML = '';
  $('context').innerHTML = QUIZ.context;
  $('lang-badge').textContent = 'ЯЗЫК: ' + LANG_NAMES[state.lang].toUpperCase();

  state.order.forEach((qi, pos) => {
    const q = QUIZ.questions[qi];
    const multi = q.type === 'multi';
    const card = document.createElement('div');
    card.className = 'q';
    card.id = 'card-' + q.id;

    const code = codeFor(q);
    const codeHtml = code ? `<figure class="q-code"><figcaption><span>${esc(code.caption)}</span></figcaption><pre>${
      code.text.split('\n').map(line => `<span class="ln">${esc(line) || ' '}</span>`).join('')}</pre></figure>` : '';
    const imgHtml = q.img ? `<figure class="q-img"><img src="${q.img.src}" alt="${esc(q.img.alt)}" draggable="false"><figcaption>${esc(q.img.caption)}</figcaption></figure>` : '';

    card.innerHTML = `
      <div class="q-head">
        <span class="q-num">ВОПРОС ${pos + 1} ИЗ ${QUIZ.questions.length}</span>
        <span class="q-topic">${esc(q.topic)}</span>
      </div>
      <p class="q-text">${q.text}</p>
      ${imgHtml}${codeHtml}
      ${multi ? '<p class="q-hint">Несколько верных вариантов · балл только за полностью верный набор</p>' : ''}
      <div class="opts"></div>`;
    const opts = card.querySelector('.opts');

    state.optOrder[q.id].forEach(oi => {
      const label = document.createElement('label');
      label.className = 'opt';
      const picked = (state.answers[q.id] || []).includes(oi);
      label.innerHTML = `<input type="${multi ? 'checkbox' : 'radio'}" name="${q.id}" ${picked ? 'checked' : ''}><span>${q.options[oi]}</span>`;
      if (picked) label.classList.add('picked');
      label.querySelector('input').addEventListener('change', () => pick(q, oi, multi));
      opts.appendChild(label);
    });
    host.appendChild(card);
  });
  updateProgress();
}

function pick(q, oi, multi) {
  if (Date.now() >= state.deadline) { finish(true); return; }
  const cur = state.answers[q.id] || [];
  if (multi) {
    state.answers[q.id] = cur.includes(oi) ? cur.filter(x => x !== oi) : cur.concat(oi).sort((a, b) => a - b);
  } else {
    state.answers[q.id] = [oi];
  }
  if (!state.answers[q.id].length) delete state.answers[q.id];
  save(KEY_STATE, state);

  const card = $('card-' + q.id);
  card.querySelectorAll('.opt').forEach(l => l.classList.toggle('picked', l.querySelector('input').checked));
  card.classList.remove('unanswered');
  updateProgress();
}

function updateProgress() {
  const total = QUIZ.questions.length;
  const done = QUIZ.questions.filter(q => state.answers[q.id]).length;
  $('progress-fill').style.width = (done / total * 100) + '%';
  $('progress-text').textContent = `ОТВЕЧЕНО ${done} ИЗ ${total}`;
  $('finish-note').textContent = done < total ? `Без ответа: ${total - done}` : 'Отвечены все вопросы';
}

/* ---------- завершение ---------- */

$('btn-finish').addEventListener('click', () => {
  const missing = state.order.map(i => QUIZ.questions[i]).filter(q => !state.answers[q.id]);
  if (missing.length) {
    missing.forEach(q => $('card-' + q.id).classList.add('unanswered'));
    $('card-' + missing[0].id).scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!confirm(`Без ответа вопросов: ${missing.length}. Они будут засчитаны как неверные.\n\nЗавершить работу? Изменить ответы после этого нельзя.`)) return;
  } else if (!confirm('Завершить работу? Изменить ответы после этого нельзя.')) {
    return;
  }
  finish(false);
});

async function finish(byTimeout) {
  if (finishing) return;
  finishing = true;
  clearInterval(tick);
  const details = [];
  let score = 0;
  for (const q of QUIZ.questions) {
    const picked = state.answers[q.id] || [];
    const ok = await isCorrect(q, picked, state.lang);
    if (ok) score++;
    details.push({ id: q.id, ok });
  }
  const g = gradeFor(score);
  const result = {
    v: 1,
    name: state.name, group: state.group, lang: state.lang,
    answers: QUIZ.questions.map(q => (state.answers[q.id] || []).join('')).join('-'),
    score, total: QUIZ.questions.length, mark: g.mark,
    finishedAt: new Date().toISOString(),
    minutesUsed: Math.round((Math.min(Date.now(), state.deadline) - (state.startedAt || state.deadline - QUIZ.minutes * 60000)) / 60000),
    byTimeout: !!byTimeout,
    leaves: state.leaves || 0,
    order: state.order,
    details
  };
  result.code = await makeCode(result);

  save(KEY_RESULT, result);
  try { localStorage.removeItem(KEY_STATE); } catch (e) {}
  renderResult(result, false);
}

/* ---------- код результата ---------- */

function b64url(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeCode(r) {
  const payload = {
    v: 1, n: r.name, g: r.group, l: r.lang, a: r.answers,
    s: r.score, t: r.total, m: r.mark,
    d: r.finishedAt.slice(0, 16), u: r.minutesUsed, o: r.byTimeout ? 1 : 0, x: r.leaves
  };
  const body = b64url(JSON.stringify(payload));
  const sum = await shortHash(QUIZ.salt + '|code|' + body);
  return `MDB1.${body}.${sum.slice(0, 10)}`;
}

/* ---------- экран результата ---------- */

function renderResult(r, returning) {
  show('result');
  $('result-title').textContent = returning ? 'Тест уже пройден' : (r.byTimeout ? 'Время вышло — работа отправлена' : 'Работа завершена');

  const g = QUIZ.grades.find(x => x.mark === r.mark) || QUIZ.grades[QUIZ.grades.length - 1];
  $('mark').textContent = r.mark;
  $('mark').className = 'mark m' + r.mark;
  $('score-line').textContent = `${r.score} из ${r.total} · ${g.label}`;
  $('who').textContent = `${r.name} · группа ${r.group} · ${LANG_NAMES[r.lang] || r.lang}`;
  const dt = new Date(r.finishedAt);
  $('when').textContent = 'Завершено ' + dt.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })
    + (r.leaves ? ` · уходов со вкладки: ${r.leaves}` : '');
  $('code').value = r.code;

  if (returning && !document.querySelector('.notice.again')) {
    const note = document.createElement('div');
    note.className = 'notice again';
    note.innerHTML = '<b>Повторное прохождение не предусмотрено.</b> Оценка зафиксирована при первой попытке и не меняется. Если тест нужно пересдать, обратитесь к преподавателю.';
    screens.result.insertBefore(note, screens.result.children[2]);
  }

  // номера — в том порядке, в каком студент видел вопросы
  const order = r.order || QUIZ.questions.map((_, i) => i);
  $('review').innerHTML = order.map((qi, pos) => {
    const q = QUIZ.questions[qi];
    const d = r.details.find(x => x.id === q.id) || { ok: false };
    return `<div class="rq ${d.ok ? 'ok' : 'bad'}"><b>${pos + 1} · ${d.ok ? 'верно' : 'неверно'}</b><span>${esc(q.topic)}</span></div>`;
  }).join('');
}

$('btn-copy').addEventListener('click', async () => {
  const ta = $('code');
  try { await navigator.clipboard.writeText(ta.value); }
  catch (e) { ta.removeAttribute('readonly'); ta.select(); document.execCommand('copy'); ta.setAttribute('readonly', ''); }
  $('btn-copy').textContent = 'Скопировано';
  setTimeout(() => { $('btn-copy').textContent = 'Скопировать'; }, 1800);
});

/* уход со страницы во время попытки — предупредить */
window.addEventListener('beforeunload', e => {
  if (state && !finishing && !load(KEY_RESULT)) { e.preventDefault(); e.returnValue = ''; }
});

init();
