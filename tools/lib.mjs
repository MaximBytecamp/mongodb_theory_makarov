/* Общая обвязка для съёмки кадров Compass через CDP.
   Compass должен быть запущен так:
     env -u ELECTRON_RUN_AS_NODE "/Applications/MongoDB Compass.app/Contents/MacOS/MongoDB Compass" \
       --ignore-additional-command-line-flags --remote-debugging-port=9222   */
const pwPath = '/Users/makarovmn/python_presentations/tools/node_modules/playwright/index.js';
const pw = (await import(pwPath)).default;

export async function withCompass(work) {
  const browser = await pw.chromium.connectOverCDP('http://localhost:9222');
  const page = browser.contexts()[0].pages()[0];
  try {
    await work(page);
  } finally {
    await browser.close().catch(() => {});
  }
  process.exit(0);
}

export const wait = (page, ms) => page.waitForTimeout(ms);
