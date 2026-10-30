// Candidate-only visual audit of the actual built game. Unreviewed art is
// previewed by a labelled project response override, never production mapping.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { loadSupportingArt } from '../scripts/supporting-art.mjs';

const root = resolve('.'), dist = resolve(process.env.RESET_DIST || 'dist');
const out = resolve('test-results/xujiashu-neutral'); await mkdir(out,{recursive:true});
const engine = resolve(process.env.VN_ENGINE_PATH || '../VN-Engine-v2');
const { chromium } = await import(pathToFileURL(resolve(engine,'node_modules/playwright/index.mjs')));
const { createProject } = await import(pathToFileURL(resolve(dist,'lib/index.js')));
const project = JSON.parse(await readFile(resolve(dist,'project.json'),'utf8'));
const fixtures = JSON.parse(await readFile('test-results/route-fixtures.json','utf8'));
const art = await loadSupportingArt(root), approved = art.approved.has('xujiashu');
const candidate = structuredClone(project);candidate.stage.speakers['徐嘉树']='xujiashu';
const runtimePath='assets/4k/runtime/characters/xujiashu/neutral.webp';
const expectedHash=createHash('sha256').update(await readFile(resolve(root,'game',runtimePath))).digest('hex');
const viewports=[['desktop',1280,900],['mobile-portrait',390,844],['mobile-landscape',844,390],['desktop-4k',3840,2160]];
const fontCss=process.env.RESET_QA_FONT_CSS;
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.wav':'audio/wav','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const base=path.startsWith('/qa-font/') && fontCss ? dirname(fontCss) : dist;
    const rel=base===dist ? (path.startsWith('/play/') ? path.slice(6)||'index.html' : null) : path.slice(9);
    if(rel===null)throw Error('unknown route');const file=resolve(base,rel);
    if(!file.startsWith(base+sep))throw Error('invalid path');
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
  } catch {res.writeHead(404);res.end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/play/`;
function witnessedFrames(sceneId) {
  const {session}=createProject(candidate,'https://reset.test/',{settings:{textDelayMs:0,reducedMotion:true}});
  const result=[];
  try {
    session.restore(fixtures.witnesses[sceneId]);
    for(let i=0;i<200;i++){
      const frame=session.getView().frame;if(frame.sceneId!==sceneId)break;
      if(frame.speaker==='徐嘉树')result.push({lineId:frame.lineId,portrait:frame.stage.portrait,save:session.save()});
      if(!session.next())break;
    }
  } finally {session.dispose();}
  return result;
}
const morning=witnessedFrames('morning_after');assert.ok(morning.length>=2);
assert.equal(morning[0].lineId,'r1_morning_after_pre03_01');
const opening=witnessedFrames('prologue_1842');assert.ok(opening.length);
assert.notEqual(project.scenes.find(s=>s.id==='prologue_1842').noSprite,true);
assert.equal(opening[0].portrait,'xujiashu/neutral','normal opening dialogue must display the approved Xu portrait');
const results=[],errors=[];
let browser;
const enter=async page=>{await page.locator('[data-reset-enter]').click();await page.locator('.reset-title-gate').waitFor({state:'detached'});};
const load=async(page,save)=>{
  await page.locator('[data-control="settings"]').click();
  await page.locator('input[type="file"]').setInputFiles({name:'labelled-art-qa-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
  await page.locator('.vn-modal').waitFor({state:'hidden'});
  await page.waitForFunction(id=>document.querySelector('.vn-engine')?.dataset.scene===id,save.state.sceneId);
};
const ready=async page=>page.waitForFunction(()=>{const im=document.querySelector('.vn-portrait');return im?.dataset.asset==='xujiashu/neutral'&&im.complete&&im.naturalWidth===1080&&im.naturalHeight===1920;});
try {
  browser=await chromium.launch({headless:true,...(process.env.RESET_CHROMIUM_EXECUTABLE?{executablePath:process.env.RESET_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  const setup=async context=>context.addInitScript(()=>localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,voiceEnabled:false})));
  const production=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:900}});await setup(production);
  try {
    const page=await production.newPage();await page.goto(base);await enter(page);await load(page,morning[0].save);
    const visible=await page.locator('.vn-portrait').getAttribute('data-asset');
    assert.equal(visible==='xujiashu/neutral',approved,'production must follow actual owner approval');
  } finally {await production.close();}
  const context=await browser.newContext({viewport:{width:1280,height:900}});await setup(context);
  try {
    if(!approved)await context.route('**/project.json',route=>route.fulfill({json:candidate}));
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);await enter(page);
    if(fontCss){const css=(await readFile(fontCss,'utf8')).replaceAll('./files/','/qa-font/files/');await page.addStyleTag({content:css+'\nbody, #status, #__xuCandidateLabel, .vn-engine, .vn-engine button {font-family:"Noto Sans SC",sans-serif !important;}'});}
    await load(page,opening[0].save);await ready(page);
    for(const [name,width,height] of viewports){
      await page.setViewportSize({width,height});await load(page,morning[0].save);await ready(page);
      await page.evaluate(async()=>{await document.fonts.ready;if(!document.getElementById('__xuCandidateLabel')){const label=document.createElement('div');label.id='__xuCandidateLabel';label.textContent='候选视觉检查 · owner 审核待完成';label.style.cssText='position:fixed;right:6px;top:4px;z-index:2147483647;padding:3px 6px;background:#172f37;color:white;font:11px sans-serif;pointer-events:none';document.body.append(label);}});
      const portrait=await page.locator('.vn-portrait').boundingBox(),stage=await page.locator('.vn-stage').boundingBox(),reading=await page.locator('.vn-reading').boundingBox();
      assert.ok(portrait&&stage&&reading);
      assert.ok(portrait.x>=stage.x-1&&portrait.x+portrait.width<=stage.x+stage.width+1,`${name}: horizontal crop`);
      assert.ok(portrait.y>=stage.y-1&&portrait.y+portrait.height<=stage.y+stage.height+1,`${name}: vertical crop`);
      assert.ok(portrait.y+portrait.height<=reading.y+1,`${name}: portrait overlaps dialogue`);
      await page.screenshot({path:resolve(out,name+'.png'),fullPage:true,animations:'disabled'});
      await load(page,morning[1].save);await ready(page);const later=await page.locator('.vn-portrait').boundingBox();
      for(const key of ['x','y','width','height'])assert.ok(Math.abs(later[key]-portrait[key])<=1,`${name}: neutral anchor changed ${key}`);
      results.push({name,width,height,portrait,reading,stableAnchor:true});
    }
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:20000});
    await page.waitForFunction(async path=>Boolean(await caches.match(new URL(path,location.href).href)),runtimePath,{timeout:20000});
    await context.setOffline(true);
    try {
      const hash=await page.evaluate(async path=>{const response=await fetch(path);if(!response.ok)throw Error('offline fetch failed');const digest=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');},runtimePath);
      assert.equal(hash,expectedHash,'offline decoded asset bytes differ from source');
    } finally {await context.setOffline(false);}
    await page.setViewportSize({width:1080,height:960});
    await page.evaluate(async path=>{const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex';for(const bg of ['#fff','#101820']){const panel=document.createElement('div');panel.style.cssText=`width:540px;height:960px;background:${bg}`;const im=new Image(540,960);im.src=path;panel.append(im);overlay.append(panel);}document.body.append(overlay);await Promise.all([...overlay.querySelectorAll('img')].map(im=>im.decode()));},runtimePath);
    await page.screenshot({path:resolve(out,'alpha-edges.png'),animations:'disabled'});
    assert.deepEqual(errors,[]);
    const report={status:approved?'TECH_PASS_ART_PASS':'TECH_PASS_ART_UNVERIFIED',browser:browser.version(),source:'built-package',candidateProjectOverride:!approved,productionCandidateLeak:false,sceneId:'morning_after',lineId:morning[0].lineId,approvedOpeningPortraitVisible:true,viewports:results,offlineSpriteVerified:true,runtimeSHA256:expectedHash,androidPhysicalDevice:false,windowsNative:false};
    await writeFile(resolve(out,'audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
  } finally {await context.close();}
} finally {await browser?.close();await new Promise(r=>server.close(r));}
