import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const engine = resolve(process.env.VN_ENGINE_PATH || '../VN-Engine-v2');
const { chromium } = await import(pathToFileURL(resolve(engine, 'node_modules/playwright/index.mjs')));
const dist = resolve(process.env.RESET_DIST || 'dist');
const out = resolve('test-results/round9-ui');
await mkdir(out, { recursive: true });
const fixtures = JSON.parse(await readFile('test-results/route-fixtures.json', 'utf8'));

const mime = {
  '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.wav': 'audio/wav'
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/play/')) throw Error('outside play root');
    const file = resolve(dist, pathname.slice(6) || 'index.html');
    if (!file.startsWith(dist + sep)) throw Error('path traversal');
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(bytes);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const base = `http://127.0.0.1:${server.address().port}/play/`;

const checks = [];
const errors = [];
let browser, context, page;
const pass = name => { checks.push(name); console.log('PASS', name); };
const expectedUi = {
  'title-key-visual': 'assets/4k/runtime/ui/title-key-visual.webp',
  'save-anomaly': 'assets/4k/runtime/ui/save-anomaly.webp',
  'ending-collection-header': 'assets/4k/runtime/ui/ending-collection-header.webp',
  'cg-gallery-header': 'assets/4k/runtime/ui/cg-gallery-header.webp',
  'combat-hud-key-visual': 'assets/4k/runtime/ui/combat-hud-key-visual.webp'
};

async function verifyImage(id) {
  const locator = page.locator(`[data-ui-visual="${id}"]`);
  await locator.waitFor({ state: 'visible' });
  const details = await locator.evaluate(async image => {
    await image.decode();
    return { src: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight, alt: image.alt };
  });
  assert.ok(new URL(details.src).pathname.endsWith('/' + expectedUi[id]), `${id} points to ${details.src}`);
  assert.equal(details.width, 1920, `${id} runtime width`);
  assert.equal(details.height, 1080, `${id} runtime height`);
  return details;
}

async function closeArchive() {
  await page.keyboard.press('Escape');
  await page.locator('.reset-dialog').waitFor({ state: 'hidden' });
}

async function loadFixture(save) {
  await page.locator('[data-control="settings"]').click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'round9-visual-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(save))
  });
  await page.locator('.vn-modal').waitFor({ state: 'hidden' });
}

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(() => localStorage.setItem('vn-engine:reset:settings', JSON.stringify({
    textDelayMs: 0, reducedMotion: true, music: false, voiceEnabled: false
  })));
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.locator('.vn-engine').waitFor();
  assert.equal(await page.locator('#error').innerText(), '');

  const title = await verifyImage('title-key-visual');
  await page.screenshot({ path: out + '/title-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: out + '/title-mobile-390x844.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  pass('Title key visual renders as the 1920x1080 runtime image on desktop and 390x844 mobile without overflow');

  await page.locator('[data-reset-control="slots"]').click();
  const save = await verifyImage('save-anomaly');
  await page.screenshot({ path: out + '/save-anomaly.png', fullPage: true, animations: 'disabled' });
  await closeArchive();
  pass('Save management mounts the dedicated save-anomaly key visual');

  await page.locator('[data-reset-control="collection"]').click();
  const endings = await verifyImage('ending-collection-header');
  const gallery = await verifyImage('cg-gallery-header');
  await page.screenshot({ path: out + '/collection-headers.png', fullPage: true, animations: 'disabled' });
  await closeArchive();
  pass('Ending Collection and CG Gallery mount distinct 1920x1080 header visuals');

  await loadFixture(fixtures.combat.faceless_first);
  const combat = page.locator('.reset-combat[data-ui-visual="combat-hud-key-visual"]');
  await combat.waitFor({ state: 'visible' });
  const combatStyle = await combat.evaluate(element => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    variable: element.style.getPropertyValue('--reset-combat-key-visual')
  }));
  assert.match(combatStyle.backgroundImage, /combat-hud-key-visual\.webp/);
  assert.match(combatStyle.variable, /combat-hud-key-visual\.webp/);
  const combatDecode = await page.evaluate(async src => {
    const image = new Image(); image.src = './' + src; await image.decode();
    return { src: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight };
  }, expectedUi['combat-hud-key-visual']);
  assert.equal(combatDecode.width, 1920);
  assert.equal(combatDecode.height, 1080);
  await page.screenshot({ path: out + '/combat-hud.png', fullPage: true, animations: 'disabled' });
  pass('Combat HUD applies and decodes the dedicated 1920x1080 key visual in an actual combat scene');

  const decoded = { title, save, endings, gallery, combat: combatDecode };
  assert.equal(Object.keys(expectedUi).length, 5);
  assert.deepEqual(errors, []);
  await writeFile(out + '/acceptance.json', JSON.stringify({ result: 'passed', checks, errors, decoded }, null, 2) + '\n');
} catch (error) {
  if (page) await page.screenshot({ path: out + '/failure.png', fullPage: true }).catch(() => {});
  await writeFile(out + '/failure.json', JSON.stringify({ error: error.stack, checks, errors }, null, 2) + '\n');
  throw error;
} finally {
  await context?.close();
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
