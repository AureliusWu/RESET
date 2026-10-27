import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(resolve(process.env.VN_ENGINE_PATH,'node_modules/playwright/index.mjs')));
const base=process.env.RESET_LIVE_URL.replace(/\/?$/,'/'), expected='reset-'+process.env.RELEASE_TAG;
const out=resolve('test-results/pages-live');await mkdir(out,{recursive:true});
const checks=[],errors=[],pass=name=>{checks.push(name);console.log('PASS',name)};
let browser,context,page,project;
const enterTitle=async()=>{
  const title=page.locator('.reset-title-gate');
  if(await title.count()){
    await title.waitFor({state:'visible'});
    const enter=page.locator('[data-reset-enter]');assert.equal(await enter.isEnabled(),true);
    await enter.click();await title.waitFor({state:'detached'});
  }
};
try{
  for(let attempt=0;attempt<60;attempt++){
    try{const response=await fetch(new URL('project.json?verify='+Date.now(),base));if(response.ok){const value=await response.json();if(value.version===expected){project=value;break;}}}catch{}
    await new Promise(r=>setTimeout(r,3000));
  }
  assert.equal(project?.version,expected,'Public site did not expose the released game');
  for(const [name,mime] of [['index.html','text/html'],['app.mjs','javascript'],['archive.mjs','javascript'],['experience.css','text/css'],['sw.js','javascript']]){
    const response=await fetch(new URL(name,base));assert.equal(response.status,200,name);assert.ok(response.headers.get('content-type')?.includes(mime),name+' MIME');
  }
  pass('Public HTTPS entry, released project and module/CSS/service-worker MIME types respond correctly');
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,voiceEnabled:false})));
  page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('.vn-engine').waitFor();await page.locator('.vn-background').waitFor({state:'visible'});assert.equal(await page.locator('#error').innerText(),'');
  await page.locator('.reset-title-gate').waitFor({state:'visible'});await page.screenshot({path:out+'/online-title.png',fullPage:true});await enterTitle();
  assert.equal(await page.locator('.reset-dialog').evaluate(el=>getComputedStyle(el).position),'absolute');
  const control=id=>page.locator(`[data-control=${id}]`), archive=id=>page.locator(`[data-reset-control=${id}]`);
  const start=await page.locator('.vn-engine').getAttribute('data-line');
  await control('save').click();await control('next').click();await control('load').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),start);
  await archive('slots').click();await page.locator('[data-slot="1"] [data-slot-action=save]').click();await page.keyboard.press('Escape');
  await control('next').click();await archive('slots').click();await page.locator('[data-slot="1"] [data-slot-action=load]').click();if(await page.locator('[data-reset-confirm]').isVisible())await page.locator('[data-reset-confirm]').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),start);
  await archive('collection').click();assert.equal(await page.locator('.reset-ending[data-unlocked=true]').count(),0);await page.keyboard.press('Escape');
  await page.screenshot({path:out+'/online-desktop.png',fullPage:true});
  pass('Real public title entry and game render production art and support quick saves, manual slots, Meta and spoiler-free collection');
  const fixtures=JSON.parse(await readFile(process.env.RESET_FIXTURES||'test-results/route-fixtures.json','utf8'));
  await control('settings').click();await page.locator('input[type=file]').setInputFiles({name:'acceptance-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixtures.witnesses.c6_no_save))});
  await page.locator('.vn-modal').waitFor({state:'hidden'});assert.equal(await control('save').isHidden(),true);assert.equal(await archive('slots').isHidden(),true);
  for(let count=0;count<100;count++){
    if((await page.locator('.vn-actions').innerText()).includes('已到达结局'))break;
    const choice=page.locator('[data-action=confirm_no_save]');if(await choice.count())await choice.click();else await control('next').click();
  }
  assert.equal(await page.title(),'回留 · 明天见');await control('restart').click();
  pass('Public True Route locks save entry points, reaches True End and restarts with retained Meta');
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth && document.querySelector('.vn-toolbar').getBoundingClientRect().bottom<=innerHeight));
  await page.screenshot({path:out+'/online-mobile.png',fullPage:true});
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('可离线游玩'),null,{timeout:90000});
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await control('save').click();await context.setOffline(true);await page.reload();await page.locator('.vn-engine').waitFor();await page.locator('.vn-background').waitFor({state:'visible'});await enterTitle();
  await archive('slots').click();await page.locator('[data-slot="1"] [data-slot-action=load]').click();if(await page.locator('[data-reset-confirm]').isVisible())await page.locator('[data-reset-confirm]').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),start);
  await archive('collection').click();assert.equal(await page.locator('[data-ending=true-end]').getAttribute('data-unlocked'),'true');await page.keyboard.press('Escape');
  assert.equal(await page.title(),'回留 · 明天见');assert.equal(await page.locator('#error').innerText(),'');
  await page.screenshot({path:out+'/offline-mobile.png',fullPage:true});
  pass('Actual hosted PWA reloads with network disabled, re-enters through the cached title gate and preserves production art, manual slots, ending collection and Meta');
  assert.deepEqual(errors,[]);
  await writeFile(out+'/acceptance.json',JSON.stringify({result:'passed',url:base,version:project.version,deploymentCommit:process.env.GITHUB_SHA,browser:await browser.version(),checks,errors},null,2)+'\n');
}catch(error){await page?.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});await writeFile(out+'/failure.json',JSON.stringify({error:error.stack,checks,errors,url:base},null,2));throw error;}
finally{await context?.close();await browser?.close();}
