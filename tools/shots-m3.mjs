/* Кадры Compass для модуля 3. Съёмка идёт на живом стенде: что на кадре —
   то и в базе. Состояние песочницы перед каждым кадром готовит mongosh
   (поле prep): так кадр совпадает с выводом примера своего раздела.

   Перед запуском:
     cd ~/mongodb-practice && docker compose up -d
     env -u ELECTRON_RUN_AS_NODE "/Applications/MongoDB Compass.app/Contents/MacOS/MongoDB Compass" \
       --ignore-additional-command-line-flags --remote-debugging-port=9222 \
       --disable-renderer-backgrounding --disable-backgrounding-occluded-windows &
     node tools/shots-m3.mjs                       # все кадры
     node tools/shots-m3.mjs 110-sandbox-validation # только один

   Флаги --disable-renderer-backgrounding и --disable-backgrounding-occluded-windows
   нужны, чтобы окно перерисовывалось, когда оно не на переднем плане: тогда
   съёмка не переключает экран.

   Обвязка — из shots-m2.mjs: навигация по спискам рабочей области, кнопку Reset
   не трогаем, все поля запроса заполняем явно. */
import { execFileSync } from 'node:child_process';
import { withCompass } from './lib.mjs';

const OUT = '/Users/makarovmn/mongodb_theory_makarov/shots';
const only = process.argv.slice(2);
const need = name => !only.length || only.includes(name);

const mongoIn = (dbName, script) => execFileSync('docker',
  ['exec', 'course-mongo', 'mongosh', dbName, '--quiet', '--eval', script],
  { encoding: 'utf8' }).trim();

const expect = (dbName, script, want, what) => {
  const got = mongoIn(dbName, script);
  if (got !== String(want)) throw new Error(`стенд не тот: ${what} — ждали ${want}, в базе ${got}`);
};

/* Правило товара из главы 3.1 — то же, что schema в заготовке главы. */
const SCHEMA = '{ bsonType: "object", required: ["sku", "title", "category", "price"], properties: { sku: { bsonType: "string" }, title: { bsonType: "string" }, category: { bsonType: "string" }, price: { bsonType: "number", minimum: 1 } } }';
const FULL = '{ bsonType: "object", required: ["sku", "title", "category", "price"], properties: { sku: { bsonType: "string", pattern: "^SKU-[A-Z]{2}-[0-9]{3}$" }, title: { bsonType: "string", minLength: 3 }, category: { enum: ["ноутбуки", "смартфоны", "периферия", "комплектующие", "аксессуары"] }, price: { bsonType: "number", minimum: 1 }, stock: { bsonType: "array", items: { bsonType: "object", required: ["warehouse", "qty"], properties: { qty: { bsonType: "number", minimum: 0 } } } } } }';

expect('shop', `db.products.countDocuments({ $jsonSchema: ${SCHEMA} })`, 21, 'товары магазина по правилу');
console.log('стенд сверен с текстом главы');

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
    // Compass открывает коллекцию на вкладке, выбранной в прошлый раз:
    // ждём заголовок коллекции, а не список документов.
    await page.waitForSelector('[data-testid="collection-tabs"]', { timeout: 25000 });
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

  // Размер области и плотность — как у кадров модулей 1 и 2 (ширина 2940 px):
  // кадр не зависит от того, какого размера окно Compass на экране.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',
    { width: 1600, height: 969, deviceScaleFactor: 1.8375, mobile: false });
  await settle(800);

  // Сообщение об обновлении Compass закрывает угол кадра.
  const toast = page.locator('[data-testid="lg-toast-dismiss-button"]');
  if (await toast.count()) { await toast.first().click({ force: true }).catch(() => {}); await settle(500); }

const CHEHOL = '{ sku: "SKU-AC-030", title: "Чехол для ноутбука 15 дюймов", category: "аксессуары", price: 1990 }';
  const CABLE = 'sku: "SKU-AC-034", title: "Кабель HDMI 2 м", category: "аксессуары", price: 990, stock: [{ warehouse: "Москва-1", qty: 15 }]';

  /* Состояния песочницы — те же, что оставляют примеры разделов главы 3.1. */
  const STATE = {
    catalog: `db.catalog.drop();
      db.catalog.insertOne(${CHEHOL});
      db.catalog.insertOne({ sku: "SKU-AC-031", title: "Подставка под монитор", category: "аксессуары", price: "2 490" });
      db.catalog.insertOne({ sku: "SKU-AC-032", category: "аксессуары", price: -350 });
      db.catalog.countDocuments()`,
    checked: `db.checked.drop();
      db.createCollection("checked", { validator: { $jsonSchema: ${SCHEMA} } });
      db.checked.insertOne(${CHEHOL});
      db.checked.countDocuments()`,
    full: `db.checked.drop();
      db.createCollection("checked", { validator: { $jsonSchema: ${FULL} } });
      db.checked.insertOne({ ${CABLE} });
      db.checked.insertOne({ ${CABLE}, color: "чёрный" });
      db.checked.countDocuments()`,
    level: `db.products.deleteMany({ _id: { $in: ["p-901", "p-902"] } });
      db.runCommand({ collMod: "products", validator: {}, validationLevel: "strict", validationAction: "error" });
      db.products.insertOne({ _id: "p-901", sku: "SKU-AC-040", title: "Сумка для ноутбука", category: "аксессуары", price: "1 290" });
      db.runCommand({ collMod: "products", validator: { $jsonSchema: ${SCHEMA} }, validationLevel: "moderate" });
      db.products.updateOne({ _id: "p-901" }, { $set: { brand: "OEM" } });
      db.products.countDocuments()`,
    warn: `db.runCommand({ collMod: "products", validationAction: "warn" });
      db.products.deleteOne({ _id: "p-902" });
      db.products.insertOne({ _id: "p-902", sku: "SKU-AC-041", title: "Сумка-чехол", category: "аксессуары", price: -1 });
      db.products.countDocuments({ $nor: [{ $jsonSchema: ${SCHEMA} }] })`,
  };
  const prep = (name, want) => {
    const got = mongoIn('sandbox', STATE[name]).split('\n').pop();
    if (got !== String(want)) throw new Error(`подготовка ${name}: ждали ${want}, получили ${got}`);
    console.log('  подготовка', name, '→', got);
  };

  const openTab = async (tab) => {
    await page.locator(`[data-testid="${tab}-tab-button"]`).first().click({ force: true });
    await settle(2000);
  };

  // --- 108 · 3.1 §1: три товара без правила ------------------------
  if (need('108-sandbox-catalog')) {
    prep('catalog', 3);
    await openCollection('sandbox', 'catalog');
    await openTab('Documents');
    await setQuery({ project: '{ _id: 0 }' });
    await collapseOptions();
    await useJsonView();
    await shot('108-sandbox-catalog', await fitHeight(900));
  }

  // --- 109 · §2: документы, которые правилу не соответствуют -------
  if (need('109-sandbox-catalog-nor')) {
    prep('catalog', 3);
    await openCollection('sandbox', 'catalog');
    await openTab('Documents');
    await setQuery({ filter: `{ $nor: [{ $jsonSchema: ${SCHEMA} }] }`, project: '{ _id: 0 }' });
    await useJsonView();
    await collapseOptions();
    await page.locator('[data-testid="query-bar-option-filter-input"] .cm-content').first().click();
    await page.keyboard.press('Meta+ArrowLeft');
    await settle(400);
    await shot('109-sandbox-catalog-nor', await fitHeight(900));
  }

  // --- 110 · §3: вкладка Validation коллекции с правилом -----------
  if (need('110-sandbox-checked-validation')) {
    prep('checked', 1);
    await openCollection('sandbox', 'checked');
    await openTab('Validation');
    await shot('110-sandbox-checked-validation', 900);
  }

  // --- 111 · §4: Compass вставляет документ, сервер отказывает -----
  if (need('111-sandbox-checked-insert')) {
    prep('checked', 1);
    await openCollection('sandbox', 'checked');
    await openTab('Documents');
    await useJsonView();
    await page.locator('[data-testid="crud-add-data-show-actions"]').first().click({ force: true });
    await settle(800);
    await page.getByText('Insert document', { exact: true }).first().click({ force: true });
    await settle(1500);
    const editor = page.locator('[data-testid="insert-document-editor"] .cm-content').first();
    await editor.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText('{ "sku": "SKU-AC-031", "category": "аксессуары", "price": "2 490" }');
    await settle(500);
    // Документ в одну строку уезжает за край поля: кнопка Format раскладывает его по строкам
    await page.locator('[data-testid="insert-document-modal"] [data-testid="editor-action-Format"]').first().click({ force: true }).catch(() => {});
    await settle(700);
    await page.locator('[data-testid="insert-document-modal"] [data-testid="submit-button"]').click({ force: true });
    await settle(2500);
    await page.screenshot({ path: `${OUT}/111-sandbox-checked-insert.png`, clip: { x: 0, y: 0, width: 1600, height: 1000 } });
    console.log('снят', '111-sandbox-checked-insert');
    await page.getByRole('button', { name: /view error details/i }).first().click({ force: true });
    await settle(1500);
    await page.screenshot({ path: `${OUT}/112-sandbox-checked-errinfo.png`, clip: { x: 0, y: 0, width: 1600, height: 1210 } });
    console.log('снят', '112-sandbox-checked-errinfo');
    for (const name of [/^back$/i, /^cancel$/i]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.count()) { await b.click({ force: true }).catch(() => {}); await settle(700); }
    }
    await closeDialogs();
    await page.locator('[data-testid="insert-document-modal"] [data-testid="cancel-button"]').click({ force: true }).catch(() => {});
    await settle(800);
  }

  // --- 113 · §5: принятые варианты кабеля --------------------------
  if (need('113-sandbox-checked-full')) {
    prep('full', 2);
    await openCollection('sandbox', 'checked');
    await openTab('Documents');
    await setQuery({ project: '{ _id: 0 }' });
    await collapseOptions();
    await useJsonView();
    await expandAll(2);
    await shot('113-sandbox-checked-full', await fitHeight(1000));
  }

  // --- 114 · §6: правило добавлено коллекции с данными -------------
  if (need('114-sandbox-products-moderate')) {
    prep('level', 22);
    await openCollection('sandbox', 'products');
    await openTab('Validation');
    await shot('114-sandbox-products-moderate', 420);
  }

  // --- 115, 116 · §7: warn и образцы документов -------------------
  // Вкладка выше окна: настройки сверху снимаются отдельным кадром,
  // образцы документов внизу — после прокрутки.
  if (need('115-sandbox-products-warn')) {
    prep('warn', 2);
    // Вкладка products с кадра 114 хранит старые настройки: переход в другую
    // коллекцию закрывает её, и Compass читает настройки заново.
    await openCollection('sandbox', 'catalog');
    await openCollection('sandbox', 'products');
    await openTab('Validation');
    await shot('115-sandbox-products-warn', 420);
    const load = page.locator('[data-testid="load-sample-documents"]');
    if (await load.count()) { await load.first().click({ force: true }); await settle(3000); }
    await page.getByText('Failed validation').first().evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
    await settle(800);
    const top = await page.getByText('Passed validation').first().boundingBox();
    const y = Math.max(0, Math.floor(top.y) - 40);
    await page.screenshot({ path: `${OUT}/116-sandbox-products-samples.png`, clip: { x: 300, y, width: 1300, height: 330 } });
    console.log('снят', '116-sandbox-products-samples');
  }
});
