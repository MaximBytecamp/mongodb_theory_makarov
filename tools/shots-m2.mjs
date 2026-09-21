/* Кадры Compass для модуля 2. Съёмка идёт на живом стенде базы hh:
   что на кадре — то и в базе.

   Перед запуском:
     cd ~/mongodb-practice && docker compose up -d
     env -u ELECTRON_RUN_AS_NODE "/Applications/MongoDB Compass.app/Contents/MacOS/MongoDB Compass" \
       --ignore-additional-command-line-flags --remote-debugging-port=9222 &
     node tools/shots-m2.mjs                    # все кадры
     node tools/shots-m2.mjs 57-hh-dva-usloviya # только один

   Обвязка и правила те же, что в shots-m1.mjs: навигация по спискам рабочей
   области, кнопку Reset не трогаем, все поля запроса заполняем явно. */
import { execFileSync } from 'node:child_process';
import { withCompass } from './lib.mjs';

const OUT = '/Users/makarovmn/mongodb_theory_makarov/shots';
const only = process.argv.slice(2);
const need = name => !only.length || only.includes(name);

/* Числа в подписях к кадрам берутся из базы, а не из памяти: если стенд
   перезалит другими данными, прогон должен остановиться, а не снять кадр,
   который расходится с текстом главы. */
const mongo = script => execFileSync('docker',
  ['exec', 'course-mongo', 'mongosh', 'hh', '--quiet', '--eval', script],
  { encoding: 'utf8' }).trim();

const expect = (script, want, what) => {
  const got = mongo(script);
  if (got !== String(want)) {
    throw new Error(`стенд не тот: ${what} — ждали ${want}, в базе ${got}`);
  }
};

expect('db.resumes.countDocuments({})', 9, 'резюме в hh.resumes');
expect('db.interviews.countDocuments({})', 60, 'собеседования в hh.interviews');
expect('db.resumes.countDocuments({city:"Ярославль", position:"Junior Python-разработчик"})', 2, 'город и должность');
expect('db.resumes.countDocuments({salary:"70000"})', 0, 'зарплата строкой');
expect('db.resumes.countDocuments({skills:"Python"})', 6, 'Python среди навыков');
expect('db.resumes.countDocuments({"education.level":"СПО"})', 4, 'СПО в education.level');
expect('db.companies.countDocuments({employees:{$gte:500}})', 4, 'компании от 500 сотрудников');
expect('db.resumes.countDocuments({ready_to_move:{$ne:true}})', 5, 'ready_to_move не равно true');
expect('db.vacancies.countDocuments({city:{$in:["Москва","Казань"]}})', 4, 'вакансии в Москве или Казани');
expect('db.resumes.countDocuments({skills:{$in:["MongoDB","ClickHouse"]}})', 4, 'MongoDB или ClickHouse');
expect('db.resumes.countDocuments({$or:[{city:"Ярославль"},{ready_to_move:true}]})', 8, 'из Ярославля или готов к переезду');
expect('db.resumes.countDocuments({portfolio:{$exists:true}})', 2, 'резюме с портфолио');
expect('db.resumes.countDocuments({"experience.role":"стажёр","experience.months":{$gte:6}})', 2, 'стажёр и срок через точку');
expect('db.resumes.countDocuments({experience:{$elemMatch:{role:"стажёр",months:{$gte:6}}}})', 1, 'стажёр и срок в $elemMatch');
expect('db.vacancies.countDocuments({title:/разработчик/})', 3, 'вакансии со словом разработчик');
expect('db.resumes.countDocuments({position:/^junior/i})', 4, 'резюме Junior');
console.log('стенд сверен с текстом глав');

await withCompass(async page => {
  const settle = (ms = 600) => page.waitForTimeout(ms);

  // Esc в Compass закрывает вкладку рабочей области — вместо него уводим фокус
  // щелчком по «хлебным крошкам», чтобы всплывающие подсказки не попали в кадр.
  const dismissPopups = async () => {
    const header = page.locator('[data-testid="collection-header"]').first();
    if (await header.count()) await header.click({ position: { x: 5, y: 5 } }).catch(() => {});
    await settle(400);
    const closeAi = page.locator('[data-testid="close-ai-button"]');
    if (await closeAi.count()) { await closeAi.first().click().catch(() => {}); await settle(300); }
  };

  const collapseOptions = async () => {
    const toggle = page.locator('[data-testid="query-bar-options-toggle"]');
    if (await toggle.count() && await toggle.getAttribute('aria-expanded') === 'true') {
      await toggle.click({ force: true });
      await settle(600);
    }
  };

  const shot = async (name, height = 700) => {
    await dismissPopups();
    await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: 1600, height } });
    console.log('снят', name);
  };

  /* Compass после запуска показывает экран Welcome и к серверу не подключён.
     Кнопка CONNECT появляется в боковой панели только после щелчка по самому
     подключению, поэтому порядок такой: щелчок, затем кнопка. */
  const ensureConnected = async () => {
    if (await page.locator('[data-testid="databases-list-body"]').count()) return;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.getByText('Стенд занятия', { exact: true }).first().click({ force: true });
      await settle(1200);
      const connect = page.getByRole('button', { name: /^connect$/i }).first();
      if (await connect.count()) {
        await connect.click({ force: true }).catch(() => {});
        await settle(9000);
      }
      await page.getByText('Стенд занятия', { exact: true }).first().click({ force: true });
      await settle(2500);
      if (await page.locator('[data-testid="databases-list-body"]').count()) return;
      console.log(`  подключение к стенду: попытка ${attempt}`);
    }
    throw new Error('не удалось подключиться к стенду «Стенд занятия»');
  };

  /* Вкладки рабочей области копятся от прогона к прогону и лезут в верхнюю
     полосу кадра: перед съёмкой оставляем одну. */
  const closeExtraTabs = async () => {
    for (let guard = 0; guard < 8; guard += 1) {
      const tabs = page.locator('[data-testid="workspace-tab-button"]');
      if (await tabs.count() <= 1) return;
      await tabs.first().hover().catch(() => {});
      const close = page.locator('[data-testid="close-workspace-tab"]').first();
      if (!(await close.count())) return;
      await close.click({ force: true }).catch(() => {});
      await settle(500);
    }
  };

  /* Вложенные документы и массивы Compass рисует свёрнутыми ({…} и […]).
     Кнопка «Expand all» у документа скрыта, пока на него не наведён курсор,
     поэтому перед каждым кликом наводим мышь на сам документ. */
  const expandAll = async (limit = 25) => {
    const docs = page.locator('[data-testid="document-json-item"]');
    const buttons = page.locator('[data-testid="editor-action-Expand all"]');
    const count = Math.min(await docs.count(), limit);
    // С конца: раскрытый документ удлиняет список и сдвигает те, что ниже
    for (let i = count - 1; i >= 0; i -= 1) {
      await docs.nth(i).hover().catch(() => {});
      await settle(250);
      await buttons.nth(i).click({ force: true }).catch(() => {});
      await settle(300);
    }
    // Раскрытие удлиняет список, и Compass уезжает вниз: возвращаемся к первому
    // документу, иначе верхний документ в кадре окажется обрезанным.
    await docs.first().evaluate(el => el.scrollIntoView({ block: 'start' })).catch(() => {});
    await settle(800);
  };

  /* Высота кадра — по содержимому: пустое поле под последним документом
     на странице главы выглядит как обрыв кадра. */
  const fitHeight = async (max) => {
    const docs = page.locator('[data-testid="document-json-item"]');
    const count = await docs.count();
    if (!count) return max;
    const box = await docs.nth(count - 1).boundingBox().catch(() => null);
    if (!box) return max;
    return Math.min(max, Math.ceil(box.y + box.height) + 24);
  };

  /* Вид документов Compass помнит между запусками: выбираем явно. */
  const useJsonView = async () => {
    const view = page.locator('[data-testid="toolbar-view-json"]').first();
    if (await view.count()) { await view.click({ force: true }).catch(() => {}); await settle(700); }
  };

  const openDatabases = async () => {
    await ensureConnected();
    await page.getByText('Стенд занятия', { exact: true }).first().click();
    await page.waitForSelector('[data-testid="databases-list-body"]', { timeout: 25000 });
    await settle(1200);
  };

  const openCollection = async (database, collection) => {
    // Вкладки закрываются до навигации: закрытие текущей вкладки уводит
    // рабочую область на другую коллекцию, и запрос уходит не туда.
    await closeExtraTabs();
    await openDatabases();
    await page.keyboard.press('Escape');
    await page.locator(`[data-testid="databases-list-row-${database}"]`).first().click({ force: true });
    await page.waitForSelector('[data-testid="collections-list-body"]', { timeout: 25000 });
    await settle(1200);
    await page.locator(`[data-testid="collections-list-row-${collection}"]`).first().click({ force: true });
    await page.waitForSelector('[data-testid="documents-content"]', { timeout: 25000 });
    await settle(2200);
    // Переход открывает новую вкладку: убираем вкладки других коллекций.
    for (let guard = 0; guard < 8; guard += 1) {
      const tabs = page.locator('[data-testid="workspace-tab-button"]');
      if (await tabs.count() <= 1) break;
      const texts = await tabs.allInnerTexts();
      const other = texts.findIndex(t => t.trim() !== collection);
      if (other < 0) break;
      await tabs.nth(other).hover().catch(() => {});
      await tabs.nth(other).locator('[data-testid="close-workspace-tab"]').click({ force: true }).catch(() => {});
      await settle(600);
    }
    const header = await page.locator('[data-testid="collection-header"]').first().innerText();
    if (!header.includes(database) || !header.includes(collection)) {
      throw new Error(`открылось не то: ждали ${database}.${collection}, видим «${header.split('\n')[0]}»`);
    }
  };

  const setQuery = async ({ filter = '', project = '', sort = '', limit = '', skip = '' } = {}) => {
    const toggle = page.locator('[data-testid="query-bar-options-toggle"]');
    if (await toggle.getAttribute('aria-expanded') !== 'true') { await toggle.click(); await settle(700); }

    const fill = async (testid, text, isCodeMirror) => {
      const field = isCodeMirror
        ? page.locator(`[data-testid="${testid}"] .cm-content`).first()
        : page.locator(`[data-testid="${testid}"]`).first();
      if (!(await field.count())) return;
      const normalize = value => (value || '').replace(/\s+/g, '');
      const clear = async () => {
        await field.click();
        await page.keyboard.press('Meta+a');
        await page.keyboard.press('Backspace');
        await settle(150);
        for (let guard = 0; guard < 3; guard += 1) {
          if (isCodeMirror && await page.locator(`[data-testid="${testid}"] .cm-placeholder`).count()) break;
          const rest = isCodeMirror ? await field.innerText() : await field.inputValue();
          const length = (rest || '').trim().length;
          if (!length) break;
          await page.keyboard.press('End');
          for (let i = 0; i < length + 2; i += 1) await page.keyboard.press('Backspace');
          await settle(150);
        }
      };

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await clear();
        if (text) {
          await field.click();
          await settle(150);
          await page.keyboard.insertText(String(text));
        }
        await settle(250);
        const actual = isCodeMirror ? await field.innerText() : await field.inputValue();
        const isEmpty = isCodeMirror
          ? await page.locator(`[data-testid="${testid}"] .cm-placeholder`).count() > 0
          : !normalize(actual);
        const done = text ? normalize(actual) === normalize(text) : isEmpty;
        if (done) return;
        console.log(`  поле ${testid}: попытка ${attempt}, ожидали «${text}», получилось «${(actual || '').trim()}»`);
      }
      throw new Error(`не удалось заполнить ${testid} значением ${text}`);
    };

    await fill('query-bar-option-project-input', project, true);
    await fill('query-bar-option-sort-input', sort, true);
    await fill('query-bar-option-skip-input', skip, false);
    await fill('query-bar-option-limit-input', limit, false);
    await fill('query-bar-option-filter-input', filter, true);

    await page.keyboard.press('Escape');
    await page.locator('[data-testid="query-bar-apply-filter-button"]').click({ force: true });
    await settle(2500);
  };

  const closeDialogs = async () => {
    for (let i = 0; i < 3; i += 1) {
      const cancel = page.getByRole('button', { name: /^cancel$/i });
      if (!(await cancel.count())) return;
      await cancel.first().click({ force: true }).catch(() => {});
      await settle(900);
    }
  };
  await closeDialogs();

  await ensureConnected();

  // Список баз кэширован: после перезаливки данных его надо обновить.
  await page.getByText('Стенд занятия', { exact: true }).first().click();
  await settle(1500);
  const refresh = page.locator('[data-testid="sidebar-navigation-item-actions-refresh-databases-action"]');
  if (await refresh.count()) await refresh.first().click({ force: true }).catch(() => {});
  await settle(3000);

  // --- 55 · глава 2.1 §1: четыре коллекции базы hh ----------------
  if (need('55-hh-kollekcii')) {
    await openDatabases();
    await page.locator('[data-testid="databases-list-row-hh"]').first().click({ force: true });
    await page.waitForSelector('[data-testid="collections-list-body"]', { timeout: 25000 });
    await settle(1500);
    await shot('55-hh-kollekcii', 360);
  }

  // --- 56 · §1: одно резюме целиком, три вида полей ---------------
  if (need('56-hh-resume-polya')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ fio: "Пётр Ковалёв" }' });
    await collapseOptions();
    await useJsonView();
    await expandAll();
    await shot('56-hh-resume-polya', await fitHeight(900));
  }

  // --- 57 · §3: два условия в одном фильтре -----------------------
  if (need('57-hh-dva-usloviya')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ city: "Ярославль", position: "Junior Python-разработчик" }' });
    await collapseOptions();
    await shot('57-hh-dva-usloviya', await fitHeight(700));
  }

  // --- 58 · §4: тип не совпал, результат пустой -------------------
  if (need('58-hh-tip-pusto')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ salary: "70000" }' });
    await collapseOptions();
    await shot('58-hh-tip-pusto', 560);
  }

  // --- 59 · §6: условие на массив строк ---------------------------
  if (need('59-hh-massiv')) {
    await openCollection('hh', 'resumes');
    // Проекции здесь нет: в §6 её нет и в примере, а на кадре нужен сам массив.
    await setQuery({ filter: '{ skills: "Python" }' });
    await collapseOptions();
    await useJsonView();
    await expandAll(1);   // первого раскрытого резюме хватает, чтобы показать массив
    // Кадр обрывается на втором документе: первого раскрытого достаточно,
    // а счётчик «1 – 6 of 6» стоит выше и в кадр попадает целиком.
    await shot('59-hh-massiv', 680);
  }

  // --- 60 · §7: пустой фильтр на коллекции из 60 документов -------
  if (need('60-hh-pustoy-filtr')) {
    await openCollection('hh', 'interviews');
    await setQuery({});
    await collapseOptions();
    await shot('60-hh-pustoy-filtr', 700);   // 25 документов страницы в кадр не влезают, и это видно по счётчику
  }
  // --- 61 · глава 2.2 §8: оператор сравнения ----------------------
  if (need('61-hh-gte')) {
    await openCollection('hh', 'companies');
    await setQuery({ filter: '{ employees: { $gte: 500 } }' });
    await collapseOptions();
    await useJsonView();
    await shot('61-hh-gte', await fitHeight(1160));
  }

  // --- 62 · 2.2 §8: $ne и документ без поля -----------------------
  if (need('62-hh-ne')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ ready_to_move: { $ne: true } }' });
    await collapseOptions();
    await useJsonView();
    // Раскрываем первый документ — резюме без поля ready_to_move
    await expandAll(1);
    await shot('62-hh-ne', 700);
  }
  // --- 63 · глава 2.3 §8: $in по полю ---------------------------
  if (need('63-hh-in')) {
    await openCollection('hh', 'vacancies');
    await setQuery({ filter: '{ city: { $in: ["Москва", "Казань"] } }' });
    await collapseOptions();
    await useJsonView();
    await shot('63-hh-in', await fitHeight(1160));
  }

  // --- 64 · 2.3 §8: $in по полю-массиву ---------------------------
  if (need('64-hh-in-array')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ skills: { $in: ["MongoDB", "ClickHouse"] } }' });
    await collapseOptions();
    await useJsonView();
    await expandAll(1);
    await shot('64-hh-in-array', 760);
  }
  // --- 65 · глава 2.4 §8: $or -------------------------------------
  if (need('65-hh-or')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ $or: [{ city: "Ярославль" }, { ready_to_move: true }] }' });
    await collapseOptions();
    await useJsonView();
    await shot('65-hh-or', 1000);
  }

  // --- 66 · 2.4 §8: $and из двух $or ------------------------------
  if (need('66-hh-and-or')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ $and: [{ $or: [{ city: "Ярославль" }, { ready_to_move: true }] }, { $or: [{ "education.level": "Высшее" }, { "experience.months": { $gte: 10 } }] }] }' });
    await collapseOptions();
    await useJsonView();
    await expandAll(1);
    // Длинный фильтр Compass показывает прокрученным к концу: возвращаем начало строки
    await page.locator('[data-testid="query-bar-option-filter-input"] .cm-content').first().click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Meta+ArrowLeft');
    await settle(400);
    await shot('66-hh-and-or', 900);
  }
  // --- 67 · глава 2.5 §7: вкладка Schema --------------------------
  if (need('67-hh-schema')) {
    await openCollection('hh', 'resumes');
    await setQuery({});
    await collapseOptions();
    await page.locator('[data-testid="Schema-tab-button"]').first().click({ force: true });
    await settle(1500);
    const analyze = page.getByRole('button', { name: /analyze/i }).first();
    if (await analyze.count()) { await analyze.click({ force: true }); }
    await page.waitForSelector('[data-testid="schema-field-list"], [data-testid*="schema-field"]', { timeout: 30000 }).catch(() => {});
    await settle(3000);
    await shot('67-hh-schema', 1000);
    await page.locator('[data-testid="Documents-tab-button"]').first().click({ force: true });
    await settle(800);
  }
  // --- 68 · 2.5 §7: $exists в фильтре -----------------------------
  if (need('68-hh-exists')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ portfolio: { $exists: true } }' });
    await collapseOptions();
    await useJsonView();
    await shot('68-hh-exists', await fitHeight(1160));
  }
  // --- 69, 70 · глава 2.6 §7: без $elemMatch и с ним ----------------
  // Проекция оставляет ФИО и опыт: иначе массив experience не помещается в кадр.
  if (need('69-hh-bez-elemmatch')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ "experience.role": "стажёр", "experience.months": { $gte: 6 } }',
                     project: '{ _id: 0, fio: 1, experience: 1 }' });
    await useJsonView();
    await expandAll(2);
    await shot('69-hh-bez-elemmatch', await fitHeight(1160));
  }
  if (need('70-hh-elemmatch')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ experience: { $elemMatch: { role: "стажёр", months: { $gte: 6 } } } }',
                     project: '{ _id: 0, fio: 1, experience: 1 }' });
    await useJsonView();
    await expandAll(1);
    await shot('70-hh-elemmatch', await fitHeight(1160));
  }
  // --- 71, 72 · глава 2.7 §8: литерал шаблона в Compass --------------
  if (need('71-hh-regex')) {
    await openCollection('hh', 'vacancies');
    await setQuery({ filter: '{ title: /разработчик/ }' });
    await collapseOptions();
    await useJsonView();
    await shot('71-hh-regex', await fitHeight(1160));
  }
  if (need('72-hh-regex-i')) {
    await openCollection('hh', 'resumes');
    await setQuery({ filter: '{ position: /^junior/i }', project: '{ _id: 0, fio: 1, position: 1 }' });
    await useJsonView();
    await shot('72-hh-regex-i', await fitHeight(1160));
  }
});
