// Acceptance against the built package, run on the CI runner's isolated browsers.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyArchive } from './archive-browser.mjs';
import { verifyPlayerExperience } from './player-experience-browser.mjs';
import { verifyPwaUpgrade } from './pwa-upgrade-browser.mjs';
import { verifyStageBridge } from './stage-browser.mjs';
const engine=resolve(process.env.VN_ENGINE_PATH||'../VN-Engine-v2');
const {chromium}=await import(pathToFileURL(resolve(engine,'node_modules/playwright/index.mjs')));
const dist=resolve(process.env.RESET_DIST||'dist'), out=resolve('test-results/browser');await mkdir(out,{recursive:true});
const fixtures=JSON.parse(await readFile('test-results/route-fixtures.json','utf8'));
const project=JSON.parse(await readFile(resolve(dist,'project.json'),'utf8'));
const checks=[], errors=[];const pass=name=>{checks.push(name);console.log('PASS',name)};
const server=createServer(async(req,res)=>{
  try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith('/play/'))throw Error();
    const p=resolve(dist,pathname.slice(6)||'index.html');if(!p.startsWith(dist+sep))throw Error();
    const bytes=await readFile(p);res.writeHead(200,{'Content-Type':{'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.wav':'audio/wav'}[extname(p)]||'application/octet-stream'});res.end(bytes);
  }catch{res.writeHead(404);res.end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/play/`;
let browser,context,page;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true});
  await context.addInitScript(()=>{if(!localStorage.getItem('vn-engine:reset:settings'))localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,voiceEnabled:false,autoDelayMs:200}));});
  page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const control=id=>page.locator(`[data-control="${id}"]`);
  const scene=()=>page.locator('.vn-engine').getAttribute('data-scene');
  const isScene=id=>page.waitForFunction(id=>document.querySelector('.vn-engine')?.dataset.scene===id,id);
  const loadFixture=async save=>{
    await control('settings').click();await page.locator('input[type=file]').setInputFiles({name:'reset-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
    await page.locator('.vn-modal').waitFor({state:'hidden'});await isScene(save.state.sceneId);
  };
  await page.goto(base);await page.locator('.vn-engine').waitFor();assert.equal(await page.locator('#error').innerText(),'');
  assert.equal(await page.locator('.reset-dialog').evaluate(el=>getComputedStyle(el).position),'absolute','the packaged experience stylesheet must actually apply');
  await page.locator('.vn-background').waitFor({state:'visible'});
  await page.screenshot({path:out+'/desktop.png',fullPage:true});pass('Standalone package loads from /play/ with actual art and no startup error');
  const start=await scene();await control('save').click();await control('next').click();await control('load').click();assert.equal(await scene(),start);
  assert.match(await page.title(),/读取 1/);pass('Save/load restores the paragraph and increments persistent Meta once');
  const legacy=structuredClone(fixtures.witnesses[start]);legacy.state.storyVersion='reset-v1.0.0';
  await loadFixture(legacy);assert.equal(await scene(),start);assert.match(await page.title(),/读取 2/);
  pass('A published v1.0.0 backup imports through the packaged settings UI and retains the route');
  await verifyArchive({page,context,fixtures,project,loadFixture,control,scene,isScene,out,pass});
  await verifyPlayerExperience({browser,page,base,fixtures,project,out,pass});
  await control('settings').click();assert.equal(await control('save').isDisabled(),true);
  await page.getByLabel('阅读区透明度').fill('0.6');await page.getByRole('button',{name:'关闭',exact:true}).click();
  assert.match(await page.locator('.vn-engine').getAttribute('style'),/0.6/);
  await control('history').click();await page.getByLabel('搜索已读记录').fill('10月17日');assert.ok(await page.locator('.vn-record').count());await page.getByRole('button',{name:'关闭',exact:true}).click();
  await control('auto').click();await page.waitForSelector('.vn-actions [data-action]');const choiceScene=await scene();await page.waitForTimeout(500);assert.equal(await scene(),choiceScene);
  await control('restart').click();await control('skip').click();await page.waitForSelector('.vn-actions [data-action]');assert.equal(await scene(),choiceScene);
  pass('Settings, history search, auto at choices and read-only skip work in the packaged UI');
  for(const [id,save] of Object.entries(fixtures.endings).filter(([id])=>id!=='true-end')){
    await loadFixture(save);assert.match(await page.locator('.vn-actions').innerText(),/已到达结局/);
    const meta=await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')));assert.ok(meta.endings.includes(id));
  }pass('All six Normal Ends and six key Bad Ends render and register Meta from validated route saves');
  await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).uncheck();await page.getByRole('button',{name:'关闭',exact:true}).click();
  await verifyStageBridge({page,fixtures,loadFixture,control,pass});
  for(const [id,save] of Object.entries(fixtures.combat)){
    for(const outcome of ['win','lose']){
      await page.bringToFront();await loadFixture(save);await page.locator('.reset-combat canvas').waitFor();
      if(await page.locator('[data-combat-resume]').isVisible())await page.locator('[data-combat-resume]').click();
      // Observe the visible player pixels rather than assume that a CI runner
      // delivers 60 animation frames per second during a wall-clock key hold.
      const moveTo=async(key,reached)=>{
        await page.keyboard.down(key);
        try{for(let move=0;move<150;move++){
          const position=await page.locator('.reset-combat canvas').evaluate(canvas=>{
            const {data,width}=canvas.getContext('2d').getImageData(0,0,960,540);let sx=0,sy=0,count=0;
            for(let y=100;y<450;y++)for(let x=25;x<935;x++){const i=(y*width+x)*4;if(data[i]===159&&data[i+1]===198&&data[i+2]===220){sx+=x;sy+=y;count++;}}
            return count>40?{x:sx/count,y:sy/count}:null;
          });
          if(position&&reached(position))return;await page.waitForTimeout(60);
        }throw Error('Combat movement did not reach its visible waypoint');}
        finally{await page.keyboard.up(key);}
      };
      if(id==='c5_echo_fail'&&outcome==='win'){
        // The seventh person predicts straight-line movement. Feint upward
        // after its opening read, then close within heavy-attack range.
        await moveTo('d',p=>p.x>=380);await moveTo('w',p=>p.y<=205);
      }
      await moveTo('d',p=>p.x>=700);await page.screenshot({path:out+`/combat-${id}-${outcome}.png`});
      if(outcome==='win')for(let hit=0;hit<500;hit++){
        if(!await page.locator('.reset-combat').count())break;
        try{
          if(id==='faceless_second')await page.locator('.reset-combat [data-key=KeyK]').tap({force:true,timeout:1000});else await page.keyboard.press('k');
        }catch(error){if(!await page.locator('.reset-combat').count())break;throw error}
        await page.waitForTimeout(60);
      }
      if(outcome==='lose'){
        await page.waitForFunction(()=>document.querySelector('.reset-combat__state')?.textContent.includes('生命 0/5'),null,{timeout:45000,polling:25});
        await page.evaluate(()=>dispatchEvent(new CustomEvent('vn-engine-host-visibility',{detail:{hidden:true}})));
        await page.locator('[data-combat-resume]').waitFor({state:'visible'});
        await page.waitForTimeout(900);assert.equal(await scene(),id);assert.equal(await page.locator('.reset-combat').count(),1);
        await page.evaluate(()=>dispatchEvent(new CustomEvent('vn-engine-host-visibility',{detail:{hidden:false}})));
        await page.waitForTimeout(150);assert.equal(await scene(),id);
        await page.locator('[data-combat-resume]').click();
        pass(`Combat ${id}: a native-host pause during the result delay waits for explicit resume`);
      }
      await page.locator('.reset-combat').waitFor({state:'detached',timeout:45000});
      const next=await scene(), expected={faceless_first:{win:'faceless_pattern',lose:'death_fifth'},faceless_second:{win:'breakthrough_first',lose:'death_sixth'},c5_echo_fail:{win:'c5_echo_pattern',lose:'c5_echo_death'}}[id][outcome];
      assert.equal(next,expected,`${id} ${outcome}`);
      assert.equal(await page.locator('.vn-engine').getAttribute('data-paused'),'false');
      if(outcome==='lose'&&id!=='c5_echo_fail'){
        for(let count=0;count<20&&!await page.locator('.vn-actions [data-action="@continue"]').count();count++)await control('next').click();
        assert.equal(await page.locator('.vn-actions [data-action="@continue"]').innerText(),'重新尝试');
      }
      pass(`Combat ${id}: actual ${outcome} returns to ${expected}`);
    }
  }pass('All three real-time combats accept movement/heavy attacks; actual wins and deaths resume the canonical VN branch');
  const combatMeta=await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:combat-meta:v1')));for(const id of Object.keys(fixtures.combat))assert.ok(combatMeta[id]>=2);
  pass('Combat attempt history survives restore and repeated encounters');
  await loadFixture(fixtures.witnesses.c6_no_save);assert.equal(await control('save').isHidden(),true);assert.equal(await control('load').isHidden(),true);assert.equal(await control('restart').isHidden(),true);
  assert.equal(await page.locator('[data-reset-control=slots]').isHidden(),true);
  const irreversibleLoads=await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).loads);
  await page.locator('[data-reset-control=collection]').click();assert.equal(await page.locator('[data-slot-action]').count(),0);await page.keyboard.press('Escape');
  assert.equal(await scene(),'c6_no_save');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).loads),irreversibleLoads);
  await control('history').click();await page.locator('.vn-record').first().click();assert.equal(await scene(),'c6_no_save');await page.getByRole('button',{name:'关闭',exact:true}).click();
  await control('settings').click();assert.equal(await page.locator('.vn-backup').isHidden(),true);await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.screenshot({path:out+'/irreversible.png',fullPage:true});
  for(let count=0;count<100;count++){
    if(await page.locator('.vn-actions').innerText().then(t=>t.includes('已到达结局')))break;
    const choice=page.locator('[data-action=confirm_no_save]');if(await choice.count())await choice.click();else await control('next').click();
  }
  assert.equal(await scene(),'c7_credits');assert.equal(await page.title(),'回留 · 明天见');
  const meta=await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')));assert.equal(meta.trueEnd,true);assert.ok(meta.endings.includes('true-end'));
  assert.ok(meta.cgs.includes('true-end-riverside-cg'));
  await page.screenshot({path:out+'/true-end.png',fullPage:true});
  await control('restart').click();assert.equal(await scene(),start);assert.equal(await page.title(),'回留 · 明天见');
  await page.locator('[data-reset-control=collection]').click();assert.equal(await page.locator('.reset-ending[data-unlocked=true]').count(),13);await page.keyboard.press('Escape');
  pass('True Route blocks toolbar/history/settings bypasses, reaches True End and permits replay with retained Meta');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:out+'/mobile.png',fullPage:true});pass('390px viewport has no horizontal overflow');
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('可离线游玩'));
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  const manifest=await page.evaluate(async()=>await(await fetch('./manifest.webmanifest')).json());assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');
  await control('save').click();await context.setOffline(true);await page.reload();await page.locator('.vn-engine').waitFor();await control('load').click();assert.equal(await scene(),start);
  assert.equal(await page.locator('#error').innerText(),'');await page.locator('.vn-background').waitFor({state:'visible'});
  const resources=await page.evaluate(async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith('vn-self-reset-v2:')));const requests=await c.keys();return requests.map(r=>new URL(r.url).pathname)});
  assert.ok(resources.some(p=>p.endsWith('/meta.mjs')));assert.ok(resources.some(p=>p.endsWith('/combat.mjs')));assert.ok(resources.some(p=>p.endsWith('/assets/generated-scenes/true-end-riverside-cg.svg')));
  assert.ok(resources.some(p=>p.endsWith('/archive.mjs')));assert.ok(resources.some(p=>p.endsWith('/archive-data.mjs')));assert.ok(resources.some(p=>p.endsWith('/experience.css')));
  await page.locator('[data-reset-control=slots]').click();assert.ok(await page.locator('[data-slot="1"] [data-slot-action=load]').isEnabled());await page.keyboard.press('Escape');
  await page.locator('[data-reset-control=collection]').click();assert.equal(await page.locator('.reset-ending[data-unlocked=true]').count(),13);assert.ok(await page.locator('.reset-cg-card img').count());await page.keyboard.press('Escape');
  await page.screenshot({path:out+'/offline.png',fullPage:true});pass('Real service-worker cache at a nested URL reloads offline with assets, saves and Meta intact');
  if(process.env.RESET_PREVIOUS_DIST)await verifyPwaUpgrade({browser,dist,previous:process.env.RESET_PREVIOUS_DIST,fixtures,out,pass});
  assert.deepEqual(errors,[]);await writeFile(out+'/acceptance.json',JSON.stringify({result:'passed',browser:await browser.version(),checks,errors},null,2)+'\n');
}catch(e){if(page)await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});await writeFile(out+'/failure.json',JSON.stringify({error:e.stack,checks,errors},null,2));throw e;}
finally{await context?.close();await browser?.close();await new Promise(r=>server.close(r));}
