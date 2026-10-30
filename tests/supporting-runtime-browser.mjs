import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifySupportingPortraits } from './supporting-portraits-browser.mjs';
const dist = resolve(process.env.RESET_DIST || 'dist'), out = resolve('test-results/supporting-runtime');
await mkdir(out, { recursive: true });
const { chromium } = await import(pathToFileURL(resolve(process.env.VN_ENGINE_PATH || '../VN-Engine-v2', 'node_modules/playwright/index.mjs')));
const project = JSON.parse(await readFile(resolve(dist, 'project.json'), 'utf8'));
const server = createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith('/play/')) throw Error('route');
    const file = resolve(dist, path.slice(6) || 'index.html'); if (!file.startsWith(dist + sep)) throw Error('path');
    const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.webmanifest':'application/manifest+json'};
    res.writeHead(200, {'Content-Type': mime[extname(file)] || 'application/octet-stream'}); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.RESET_CHROMIUM_EXECUTABLE ? {executablePath:process.env.RESET_CHROMIUM_EXECUTABLE} : {}), args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: {width:1280,height:900} });
  await context.addInitScript(() => localStorage.setItem('vn-engine:reset:settings', JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,soundEffects:false,voiceEnabled:false})));
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/play/`);
  const enter = async () => { await page.locator('[data-reset-enter]').click(); await page.locator('.reset-title-gate').waitFor({state:'detached'}); };
  await enter();
  const reset = async () => { await page.reload(); await enter(); };
  const loadFixture = async save => {
    await page.locator('[data-control=settings]').click();
    await page.locator('input[type=file]').setInputFiles({name:'canonical-npc-witness.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
    await page.locator('.vn-modal').waitFor({state:'hidden'});
  };
  const report = await verifySupportingPortraits({page,project,loadFixture,reset,out,dist});
  assert.deepEqual(errors, []); console.log(JSON.stringify({status:report.status,runtimeVisible:report.runtimeVisible,domVisible:report.domVisible,viewportChecks:report.records.length,sequentialLines:report.sequences.length}));
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
