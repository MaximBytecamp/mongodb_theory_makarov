/* Кадры Compass для модуля 4. Съёмка идёт на живом стенде: что на кадре —
   то и в базе. Конвейер вводится на вкладке Aggregations в текстовом режиме
   (поле всего конвейера), затем Compass переключается в режим стадий, где у
   каждой стадии видна выборка её выхода.

   Перед запуском:
     cd ~/mongodb-practice && docker compose up -d
     env -u ELECTRON_RUN_AS_NODE "/Applications/MongoDB Compass.app/Contents/MacOS/MongoDB Compass" \
       --ignore-additional-command-line-flags --remote-debugging-port=9222 \
       --disable-renderer-backgrounding --disable-backgrounding-occluded-windows &
     node tools/shots-m4.mjs                         # все кадры
     node tools/shots-m4.mjs 142-orders-pipeline     # только один
     EXPLORE=1 node tools/shots-m4.mjs explore       # снимок вкладки и список data-testid

   Обвязка (подключение, открытие коллекции, размер области кадра) — из shots-m3.mjs. */
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

expect('shop', 'db.orders.countDocuments()', 120, 'заказов в shop.orders');
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

  /* Вкладка с изменённым конвейером при закрытии спрашивает подтверждение. */
  const confirmTabClose = async () => {
    const dialog = page.locator('[data-testid="confirm-tab-close"][open]');
    if (await dialog.count()) {
      await dialog.locator('button', { hasText: /close/i }).first().click({ force: true }).catch(() => {});
      await settle(700);
    }
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
      await confirmTabClose();
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
    await confirmTabClose();
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
      await confirmTabClose();
      await settle(600);
    }
    const header = await page.locator('[data-testid="collection-header"]').first().innerText();
    if (!header.includes(database) || !header.includes(collection)) {
      throw new Error(`открылось не то: ждали ${database}.${collection}, видим «${header.split('\n')[0]}»`);
    }
  };

  const setQuery = async ({ filter = '', project = '', sort = '', limit = '', skip = '', hint = '' } = {}) => {
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
    await fill('query-bar-option-hint-input', hint, true);
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

  const openTab = async (tab) => {
    await page.locator(`[data-testid="${tab}-tab-button"]`).first().click({ force: true });
    await settle(2000);
  };

  /* Конвейер вводится в текстовом режиме: поле одно, и текст в нём можно
     заменить целиком. Режим стадий Compass строит из этого текста сам. */
  const setPipeline = async (text) => {
    await page.locator('[data-testid="pipeline-builder-toggle-as-text"]').first().click({ force: true });
    await settle(1500);
    const field = page.locator('[data-testid="pipeline-as-text-editor"] .cm-content, [data-testid="pipeline-builder-workspace"] .cm-content').first();
    await field.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await settle(300);
    await page.keyboard.insertText(text);
    await settle(3500);
    const got = (await field.innerText()).replace(/\s+/g, '');
    if (got !== text.replace(/\s+/g, '')) throw new Error('конвейер в поле не тот: ' + got.slice(0, 120));
  };
  const useStages = async () => {
    await page.locator('[data-testid="pipeline-builder-toggle-builder-ui"]').first().click({ force: true });
    await settle(3500);
  };
  const scratch = '/private/tmp/claude-501/-Users-makarovmn-algorthimization-course-vvodnoe/97b231ef-1cf8-4104-9971-7a21629a36b1/scratchpad';

  const CHAIN = `[
  { $match: { status: "доставлен" } },
  { $match: { "delivery.city": { $in: ["Москва", "Санкт-Петербург"] } } },
  { $match: { total: { $gte: 200000 } } }
]`;
  const TOP3 = `[
  { $match: { status: "в пути" } },
  { $sort: { total: -1 } },
  { $limit: 3 }
]`;

  // --- 142 · 4.1 §8: три стадии $match, у каждой выборка выхода -------
  if (need('142-orders-pipeline') || need('explore')) {
    await openCollection('shop', 'orders');
    await openTab('Aggregations');
    await setPipeline(CHAIN);
    await useStages();
    if (need('explore')) {
      await page.screenshot({ path: scratch + '/agg-stages.png' });
      const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-testid]')].map(e => e.dataset.testid))]);
      console.log(ids.filter(x => /stage|preview|collapse|output/i.test(x)).join('\n'));
    } else {
      await page.locator('[data-testid="stage-card"]').first().evaluate(el => el.scrollIntoView({ block: 'start' }));
      await settle(800);
      await page.locator('[data-testid="pipeline-builder-workspace"]').first().evaluate(el => {
        for (let n = el; n; n = n.parentElement) if (n.scrollHeight > n.clientHeight + 5) { n.scrollTop = 0; }
      });
      await settle(800);
      await shot('142-orders-pipeline', 969);
    }
  }

  // --- 143 · 4.1 §8: $match, $sort, $limit в текстовом режиме ---------
  if (need('143-orders-pipeline-text') || need('explore')) {
    await openCollection('shop', 'orders');
    await openTab('Aggregations');
    await setPipeline(TOP3);
    await page.screenshot({ path: scratch + '/agg-text.png' });
    if (!need('explore')) await shot('143-orders-pipeline-text', 969);
  }
  // --- 144 · 4.2 §9: стадия $project с вычисляемыми полями ----------
  if (need('144-products-project')) {
    const LAPTOP_SALE = `[
  { $match: { category: "ноутбуки" } },
  { $sort: { price: -1 } },
  { $project: { _id: 0, title: 1, price: 1, sale: { $multiply: ["$price", 0.9] }, saving: { $subtract: ["$price", { $multiply: ["$price", 0.9] }] } } }
]`;
    await openCollection('shop', 'products');
    await openTab('Aggregations');
    await setPipeline(LAPTOP_SALE);
    await useStages();
    await page.locator('[data-testid="stage-card"]').nth(2).evaluate(el => el.scrollIntoView({ block: 'start' }));
    await settle(1200);
    await shot('144-products-project', 969);
  }
  // --- 145 · 4.3 §9: стадия $addFields у постоянных покупателей ------
  if (need('145-customers-addfields')) {
    const CARD = `[
  { $match: { segment: "постоянный" } },
  { $sort: { name: 1 } },
  { $limit: 3 },
  { $addFields: { card: { $concat: ["$name", ", ", "$city"] } } }
]`;
    await openCollection('shop', 'customers');
    await openTab('Aggregations');
    await setPipeline(CARD);
    await useStages();
    await page.locator('[data-testid="stage-card"]').nth(3).evaluate(el => el.scrollIntoView({ block: 'start' }));
    await settle(1200);
    // Новое поле стоит последним: прокручиваем карточки выборки двух последних стадий вниз
    for (const n of [2, 3]) {
      await page.locator(`[data-testid="stage-preview-${n}"]`).first().evaluate(el => {
        for (const node of el.querySelectorAll('*')) if (node.scrollHeight > node.clientHeight + 4) node.scrollTop = node.scrollHeight;
      }).catch(() => {});
    }
    await settle(800);
    await shot('145-customers-addfields', 969);
  }
  // --- 146 · 4.4 §9: стадия $group по городам -------------------------
  if (need('146-orders-group')) {
    const BY_CITY = `[
  { $match: { status: "доставлен" } },
  { $group: { _id: "$delivery.city", orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
  { $sort: { _id: 1 } }
]`;
    await openCollection('shop', 'orders');
    await openTab('Aggregations');
    await setPipeline(BY_CITY);
    await useStages();
    await page.locator('[data-testid="stage-card"]').nth(1).evaluate(el => el.scrollIntoView({ block: 'start' }));
    await settle(1200);
    await shot('146-orders-group', 969);
  }
  // --- 147 · 4.5 §7: стадия $sortByCount по статусу ----------------------
  if (need('147-orders-sortbycount')) {
    await openCollection('shop', 'orders');
    await openTab('Aggregations');
    await setPipeline(`[
  { $sortByCount: "$status" }
]`);
    await useStages();
    await page.locator('[data-testid="stage-card"]').first().evaluate(el => el.scrollIntoView({ block: 'start' }));
    await settle(1200);
    await shot('147-orders-sortbycount', 969);
  }
  // --- 154 · 4.6 §9: стадии $match и $unwind для одного заказа ---------
  if (need('154-orders-unwind')) {
    await openCollection('shop', 'orders');
    await openTab('Aggregations');
    await setPipeline(`[
  { $match: { _id: "o-0002" } },
  { $unwind: "$items" }
]`);
    await useStages();
    await page.locator('[data-testid="stage-card"]').first().evaluate(el => el.scrollIntoView({ block: 'start' }));
    await settle(1200);
    await shot('154-orders-unwind', 969);
  }
  // --- 155 · 4.7 §6: $group с $push номеров заказов в пути ----------------
  if (need('155-orders-push')) {
    await openCollection('shop', 'orders');
    await openTab('Aggregations');
    await setPipeline(`[
  { $match: { status: "в пути" } },
  { $sort: { number: 1 } },
  { $group: { _id: "$delivery.city", numbers: { $push: "$number" } } }
]`);
    await useStages();
    await page.locator('[data-testid="stage-card"]').nth(2).evaluate(el => el.scrollIntoView({ block: 'start' }));
    await settle(1200);
    await shot('155-orders-push', 969);
  }
});
