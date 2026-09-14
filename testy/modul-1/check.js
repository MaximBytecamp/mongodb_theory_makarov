/* ---------------------------------------------------------------
   Замок.

   Пароль в исходнике не лежит: сравнивается SHA-256 от строки
   "СОЛЬ|check|пароль". Пароль и соль те же, что у страницы проверки
   теста ОП.03, — преподавателю не нужно помнить второй.

   Это барьер от того, чтобы студент открыл страницу по ссылке, —
   не защита: страница статическая, проверять пароль негде, кроме
   самого браузера.
   --------------------------------------------------------------- */

const PW_SALT = 'op03-voronka-utm-2026';
const PW_HASH = '9d9d93467fde12247a0b3225d4551ed8ca9804fbe873bf48c9fbc772984a7d1e';
const PW_FLAG = QUIZ.id + ':checker-open';
const LANG_NAMES = { python: 'Python', cpp: 'C++', go: 'Go', ruby: 'Ruby' };
const LETTERS = 'abcde';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function unlock() {
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('tool').classList.remove('hidden');
}

async function tryPassword() {
  const input = document.getElementById('pw');
  const err = document.getElementById('pw-err');
  if (await sha256(PW_SALT + '|check|' + input.value) !== PW_HASH) {
    err.textContent = 'Неверный пароль.';
    input.select();
    return;
  }
  err.textContent = '';
  try { sessionStorage.setItem(PW_FLAG, '1'); } catch (e) {}
  unlock();
  document.getElementById('in').focus();
}

document.getElementById('pw-btn').addEventListener('click', tryPassword);
document.getElementById('pw').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); tryPassword(); }
});
try { if (sessionStorage.getItem(PW_FLAG) === '1') unlock(); } catch (e) {}

/* Проверка кодов. Для каждого кода:
   1) сверяем контрольную сумму — правка кода вручную её ломает;
   2) заново считаем баллы по ответам, зашитым в код, и сравниваем
      с записанными; расхождение показываем явно. */

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function unb64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
}

async function verify(code) {
  const parts = code.trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'MDB1') return { fatal: 'Это не код результата теста модуля 1 (ожидается MDB1.…).' };
  const [, body, sum] = parts;
  const sumOk = (await shortHash(QUIZ.salt + '|code|' + body)).slice(0, 10) === sum;

  let p;
  try { p = JSON.parse(unb64url(body)); }
  catch (e) { return { fatal: 'Тело кода повреждено и не читается.' }; }
  if (!LANG_NAMES[p.l]) return { fatal: 'В коде нет языка или он неизвестен.' };

  const picks = String(p.a || '').split('-');
  const rows = [];
  let recomputed = 0;
  for (let i = 0; i < QUIZ.questions.length; i++) {
    const q = QUIZ.questions[i];
    const picked = (picks[i] || '').split('').filter(Boolean).map(Number);
    const ok = await isCorrect(q, picked, p.l);
    if (ok) recomputed++;
    rows.push({ n: i + 1, topic: q.topic, picked, ok });
  }
  return {
    sumOk, claimed: p.s, recomputed, total: p.t, mark: gradeFor(recomputed).mark, markOk: gradeFor(recomputed).mark === p.m,
    name: p.n, group: p.g, lang: p.l, date: p.d, used: p.u, byTimeout: p.o === 1, leaves: p.x || 0, rows
  };
}

let lastTsv = '';

document.getElementById('btn').addEventListener('click', async () => {
  const out = document.getElementById('out');
  const summary = document.getElementById('summary');
  out.innerHTML = ''; summary.innerHTML = '';
  const codes = document.getElementById('in').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!codes.length) { out.innerHTML = '<div class="notice">Вставьте хотя бы один код.</div>'; return; }

  const seen = new Map();
  const table = [];
  for (const code of codes) {
    const r = await verify(code);
    const box = document.createElement('div');
    box.className = 'panel';

    if (r.fatal) {
      box.innerHTML = `<h2 style="color:var(--red)">Код не распознан</h2><p class="muted">${r.fatal}</p>
        <p><code>${esc(code.slice(0, 90))}${code.length > 90 ? '…' : ''}</code></p>`;
      out.appendChild(box);
      continue;
    }

    const who = (r.name + '|' + r.group).toLowerCase();
    const repeat = seen.has(who);
    seen.set(who, (seen.get(who) || 0) + 1);

    const flags = [];
    if (!r.sumOk) flags.push('контрольная сумма не сходится — код правили вручную');
    if (r.claimed !== r.recomputed) flags.push(`в коде записано ${r.claimed} баллов, по ответам получается ${r.recomputed}`);
    if (!r.markOk) flags.push('оценка в коде не соответствует баллам');
    if (repeat) flags.push('повторный код этого студента — засчитывается первый');
    const trusted = !flags.length;

    table.push([r.name, r.group, LANG_NAMES[r.lang], r.recomputed, r.mark, r.leaves, r.used ?? '', r.byTimeout ? 'да' : 'нет',
      r.date.replace('T', ' '), trusted ? 'ок' : flags.join('; ')]);

    box.innerHTML = `
      <div class="score">
        <div class="mark m${r.mark}">${r.mark}</div>
        <div class="score-text">
          <p><b>${esc(r.name)}</b> · группа ${esc(r.group)} · ${LANG_NAMES[r.lang]}</p>
          <p>${r.recomputed} из ${r.total} · ${gradeFor(r.recomputed).label}</p>
          <p class="muted">${esc(r.date.replace('T', ', '))}${r.used != null ? ` · потрачено ${r.used} мин` : ''}${r.byTimeout ? ' · отправлено по истечении времени' : ''}</p>
          <p style="font-weight:600;color:${r.leaves ? 'var(--clay)' : 'var(--leaf)'}">${r.leaves ? `уходил со вкладки: ${r.leaves} раз` : 'со вкладки не уходил'}</p>
          <p style="font-weight:600;color:${trusted ? 'var(--leaf)' : 'var(--red)'}">${trusted ? '✓ код подлинный, баллы сходятся' : '⚠ ' + flags.join('; ')}</p>
        </div>
      </div>
      <div class="res-wrap"><table class="res">
        <tr><th>№</th><th>Тема</th><th>Ответ</th><th>Итог</th></tr>
        ${r.rows.map(x => `<tr>
          <td>${x.n}</td><td>${esc(x.topic)}</td>
          <td>${x.picked.length ? x.picked.map(i => LETTERS[i]).join(', ') : '<i>нет</i>'}</td>
          <td style="color:${x.ok ? 'var(--leaf)' : 'var(--red)'};font-weight:600">${x.ok ? 'верно' : 'неверно'}</td>
        </tr>`).join('')}
      </table></div>`;
    out.appendChild(box);
  }

  if (table.length) {
    const head = ['ФИО', 'Группа', 'Язык', 'Баллы', 'Оценка', 'Уходы', 'Минут', 'По таймеру', 'Завершено', 'Проверка'];
    lastTsv = [head, ...table].map(row => row.join('\t')).join('\n');
    summary.innerHTML = `<div class="panel"><h2>Сводка</h2><div class="res-wrap"><table class="res">
      <tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>
      ${table.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}
    </table></div></div>`;
    document.getElementById('btn-tsv').classList.remove('hidden');
  }
});

document.getElementById('btn-tsv').addEventListener('click', async () => {
  const btn = document.getElementById('btn-tsv');
  try { await navigator.clipboard.writeText(lastTsv); btn.textContent = 'Скопировано — вставьте в таблицу'; }
  catch (e) { btn.textContent = 'Не удалось скопировать'; }
  setTimeout(() => { btn.textContent = 'Скопировать сводку для таблицы'; }, 2200);
});
