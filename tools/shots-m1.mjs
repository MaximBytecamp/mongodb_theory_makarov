/* Кадры Compass для модуля 1. Съёмка идёт на живом стенде:
   что на кадре — то и в базе.

   Перед запуском:
     env -u ELECTRON_RUN_AS_NODE "/Applications/MongoDB Compass.app/Contents/MacOS/MongoDB Compass" \
       --ignore-additional-command-line-flags --remote-debugging-port=9222 &
     node tools/shots-m1.mjs                 # все кадры
     node tools/shots-m1.mjs 06-find-filter  # только один

   Правила, которые дались опытом:
   · навигация — по спискам в рабочей области: дерево слева бывает свёрнуто,
     а имя products есть и в sandbox, и в shop;
   · кнопку Reset не трогаем — она открывает панель истории запросов, и та лезет в кадр;
   · все поля запроса заполняем явно, включая пустые: Compass помнит их по коллекции. */
import { execFileSync } from 'node:child_process';
import { withCompass } from './lib.mjs';

/* Кадры 09 и 10 показывают результат операций из глав 1.7 и 1.8.
   Состояние песочницы готовим прямо здесь, чтобы кадр нельзя было
   снять «не с тем» набором данных. */
const mongo = script => execFileSync('docker',
  ['exec', 'hh-mongo', 'mongosh', 'sandbox', '--quiet', '--eval', script],
  { encoding: 'utf8' }).trim();

const resetSandbox = () => {
  execFileSync('bash', ['/Users/makarovmn/mongodb-practice/stend/load.sh'], { stdio: 'ignore' });
};

const OUT = '/Users/makarovmn/mongodb_theory_makarov/shots';
const only = process.argv.slice(2);
const need = name => !only.length || only.includes(name);

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

  // Панель Options занимает треть кадра; когда её содержимое не нужно — сворачиваем.
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

  const openDatabases = async () => {
    await page.getByText('Стенд занятия', { exact: true }).first().click();
    await page.waitForSelector('[data-testid="databases-list-body"]', { timeout: 25000 });
    await settle(1200);
  };

  const openCollection = async (database, collection) => {
    await openDatabases();
    await page.keyboard.press('Escape');   // закрыть подсказку автодополнения, если висит
    await page.locator(`[data-testid="databases-list-row-${database}"]`).first().click({ force: true });
    await page.waitForSelector('[data-testid="collections-list-body"]', { timeout: 25000 });
    await settle(1200);
    await page.locator(`[data-testid="collections-list-row-${collection}"]`).first().click({ force: true });
    await page.waitForSelector('[data-testid="documents-content"]', { timeout: 25000 });
    await settle(2200);
    const header = await page.locator('[data-testid="collection-header"]').first().innerText();
    if (!header.includes(database)) {
      throw new Error(`открылась не та база: ждали ${database}, видим «${header.split('\n')[0]}»`);
    }
  };

  const setQuery = async ({ filter = '', project = '', sort = '', limit = '', skip = '' } = {}) => {
    const toggle = page.locator('[data-testid="query-bar-options-toggle"]');
    if (await toggle.getAttribute('aria-expanded') !== 'true') { await toggle.click(); await settle(700); }

    // Редактор запроса сам дописывает закрывающую скобку, а выделение «всё»
    // иногда не срабатывает с первого раза. Поэтому пишем и сверяем результат.
    const fill = async (testid, text, isCodeMirror) => {
      const field = isCodeMirror
        ? page.locator(`[data-testid="${testid}"] .cm-content`).first()
        : page.locator(`[data-testid="${testid}"]`).first();
      if (!(await field.count())) return;
      const normalize = value => (value || '').replace(/\s+/g, '');
      // Полная очистка: выделение «всё» в редакторе срабатывает не всегда,
      // поэтому добиваем оставшееся посимвольно.
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
          await field.click();            // после очистки фокус мог уйти
          await settle(150);
          await page.keyboard.insertText(String(text));
        }
        await settle(250);
        const actual = isCodeMirror
          ? await field.innerText()
          : await field.inputValue();
        // Пустое поле Compass рисует серой подсказкой вроде «{ field: 0 }»,
        // поэтому пустоту проверяем по разметке, а не по тексту.
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

    await page.keyboard.press('Escape');   // убрать всплывающую подсказку CodeMirror
    await page.locator('[data-testid="query-bar-apply-filter-button"]').click({ force: true });
    await settle(2500);
  };

  // Незакрытое окно от прошлого прогона блокирует всё остальное.
  const closeDialogs = async () => {
    for (let i = 0; i < 3; i += 1) {
      const cancel = page.getByRole('button', { name: /^cancel$/i });
      if (!(await cancel.count())) return;
      await cancel.first().click({ force: true }).catch(() => {});
      await settle(900);
    }
  };
  await closeDialogs();

  const connect = page.getByRole('button', { name: 'CONNECT' }).first();
  if (await connect.count()) {
    await connect.click({ force: true });
    await settle(9000);
  }

  // Список баз кэширован: после перезаливки данных его надо обновить.
  await page.getByText('Стенд занятия', { exact: true }).first().click();
  await settle(1500);
  const refresh = page.locator('[data-testid="sidebar-navigation-item-actions-refresh-databases-action"]');
  if (await refresh.count()) await refresh.first().click({ force: true }).catch(() => {});
  await settle(3000);

  if (need('01-databases')) {
    await openDatabases();
    await shot('01-databases', 470);
  }

  if (need('02-collections-shop')) {
    await openDatabases();
    await page.locator('[data-testid="databases-list-row-shop"]').first().click();
    await page.waitForSelector('[data-testid="collections-list-body"]', { timeout: 25000 });
    await settle(1500);
    await shot('02-collections-shop', 330);
  }

  // --- 03 · документ и типы полей --------------------------------
  if (need('03-document-types')) {
    await openCollection('shop', 'products');
    await setQuery({ filter: '{ _id: "p-012" }' });
    await shot('03-document-types', 640);
  }

  // --- 06 · фильтр -----------------------------------------------
  if (need('06-find-filter')) {
    await openCollection('shop', 'products');
    await setQuery({ filter: '{ category: "смартфоны" }' });
    await shot('06-find-filter', 720);
  }

  // --- 07 · проекция ---------------------------------------------
  if (need('07-projection')) {
    await openCollection('shop', 'products');
    await setQuery({ filter: '{ category: "ноутбуки" }', project: '{ _id: 0, title: 1, price: 1 }' });
    await shot('07-projection', 720);
  }

  // --- 08 · сортировка и предел ----------------------------------
  if (need('08-sort-limit')) {
    await openCollection('shop', 'products');
    await setQuery({ project: '{ _id: 0, title: 1, price: 1 }', sort: '{ price: -1 }', limit: '5' });
    await shot('08-sort-limit', 720);
  }

  // --- 04 и 05 · вставка документа руками ------------------------
  // Кадры снимаются подряд: окно вставки, затем результат в коллекции.
  if (need('04-insert-dialog') || need('05-after-insert')) {
    await openCollection('sandbox', 'products');
    await setQuery({});
    // Меню ADD DATA иногда не успевает раскрыться — пробуем несколько раз.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.getByRole('button', { name: /add data/i }).first().click({ force: true });
      await settle(1200);
      const item = page.getByText(/insert document/i).first();
      if (await item.count()) { await item.click({ force: true }); break; }
      console.log(`  меню ADD DATA: попытка ${attempt}`);
      await page.keyboard.press('Escape');
      await settle(600);
    }
    await page.waitForSelector('.cm-content', { timeout: 20000 });
    await settle(2200);

    // Дописываем поля к предзаполненному _id: ставим курсор в конец строки с ключом.
    // Редактор внутри окна вставки: берём последний CodeMirror на странице.
    const editor = page.locator('.cm-content').last();
    await editor.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText([
      '{',
      '  "sku": "SKU-AC-022",',
      '  "title": "Коврик для мыши XL",',
      '  "brand": "OEM",',
      '  "category": "аксессуары",',
      '  "price": 1290',
      '}',
    ].join('\n'));
    await page.keyboard.press('Escape');
    await settle(800);

    if (need('04-insert-dialog')) {
      await page.screenshot({ path: `${OUT}/04-insert-dialog.png`, clip: { x: 0, y: 0, width: 1600, height: 800 } });
      console.log('снят 04-insert-dialog');
    }

    if (need('05-after-insert')) {
      await page.getByRole('button', { name: /^insert$/i }).first().click({ force: true, timeout: 8000 })
        .catch(async () => { await page.locator('[data-testid="insert-document-button"]').first().click({ force: true }); });
      await settle(3000);
      // Показываем именно вставленный документ — его _id сгенерировал сервер.
      await setQuery({ filter: '{ sku: "SKU-AC-022" }' });
      await shot('05-after-insert', 640);
    } else {
      const cancel = page.getByRole('button', { name: /^cancel$/i }).first();
      if (await cancel.count()) await cancel.click().catch(() => {});
      await settle(1200);
    }
  }

  // --- 09 · документ после $inc и $unset -------------------------
  // Кадр показывает результат операций из главы 1.7: reviews стало 32,
  // поля discount в документе больше нет.
  if (need('09-update')) {
    resetSandbox();
    // глава 1.7 §4: +1 к отзывам и снятая скидка
    console.log('  подготовка:', mongo('db.products.updateOne({_id:"p-003"},{$inc:{reviews:1},$unset:{discount:""}}); db.products.findOne({_id:"p-003"},{reviews:1,discount:1})'));
    await openCollection('sandbox', 'products');
    await setQuery({ filter: '{ _id: "p-003" }' });
    await collapseOptions();
    await shot('09-update', 660);
  }

  // --- 10 · коллекция после удаления -----------------------------
  if (need('10-delete')) {
    resetSandbox();
    // главы 1.7 §4 и 1.8 §§1–2: правка, затем два удаления → 18 документов
    console.log('  подготовка:', mongo([
      'db.products.updateOne({_id:"p-003"},{$inc:{reviews:1},$unset:{discount:""}});',
      'db.products.deleteOne({_id:"p-020"});',
      'db.products.deleteMany({category:"аксессуары"});',
      'db.products.countDocuments()',
    ].join(' ')));
    await openCollection('sandbox', 'products');
    await setQuery({});
    await collapseOptions();
    await shot('10-delete', 430);
  }
});
