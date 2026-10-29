import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';

export async function verifySfxDecoding(page,pass) {
  const records=await page.evaluate(async()=>{
    const m=await(await fetch('./sfx-manifest.json')).json(),ctx=new OfflineAudioContext(2,1,32000),result=[];
    for(const e of m.effects){const response=await fetch(e.src);if(!response.ok)throw Error(e.id);const b=await ctx.decodeAudioData(await response.arrayBuffer());if(b.length!==e.frames||b.numberOfChannels!==2||b.sampleRate!==32000)throw Error(`SFX decode mismatch ${e.id}`);result.push({id:e.id,duration:b.duration,frames:b.length});}return result;
  });
  assert.equal(records.length,7);pass?.('All seven packaged one-shots decode in the real platform decoder');return records;
}
function installProbe(){
  const original=HTMLMediaElement.prototype.play,probe=window.__resetSfxProbe={events:[],players:[]};
  HTMLMediaElement.prototype.play=function(...args){
    const src=this.src;
    if(!src.includes('/sfx-'))return original.apply(this,args);
    const id=new URL(src).pathname.split('/').at(-1).replace('.wav','');
    probe.players.push(this);probe.events.push({event:'requested',id,src,loop:this.loop,volume:this.volume});
    this.addEventListener('playing',()=>probe.events.push({event:'playing',id,src,loop:this.loop,volume:this.volume}),{once:true});
    this.addEventListener('ended',()=>probe.events.push({event:'ended',id}),{once:true});
    return original.apply(this,args);
  };
}
async function run(){
  const engine=resolve(process.env.VN_ENGINE_PATH||'../VN-Engine-v2');
  const{chromium}=await import(pathToFileURL(resolve(engine,'node_modules/playwright/index.mjs')));
  const dist=resolve(process.env.RESET_DIST||'dist'),out=resolve('test-results/sfx-r1');await mkdir(out,{recursive:true});
  const fixtures=JSON.parse(await readFile('test-results/route-fixtures.json'));
  const project=JSON.parse(await readFile(resolve(dist,'project.json')));
  const{createProject}=await import(pathToFileURL(resolve(dist,'lib/index.js')));
  function beforeLine(sceneId,lineId){const{session}=createProject(project,'https://reset.test/',{settings:{textDelayMs:0,reducedMotion:true}});let previous;
    try{session.restore(fixtures.witnesses[sceneId]);for(let i=0;i<150;i++){const v=session.getView();if(v.frame.sceneId!==sceneId)break;if(v.frame.lineId===lineId)return previous;previous=session.save();if(!session.next())break;}throw Error(`Missing story witness ${lineId}`);}finally{session.dispose();}}
  const beforeCamera=beforeLine('archive_photo','c3f001'),beforeMessage=beforeLine('future_rule','c3h001');
  const beforeMemory=beforeLine('after_school_choice','a001'),beforeDoor=beforeLine('station_fourth','s005');
  assert.ok(beforeCamera&&beforeMessage);
  const cameraState=(()=>{const {session}=createProject(project,'https://reset.test/',{settings:{textDelayMs:0,reducedMotion:true}});try{session.restore(beforeCamera);session.next();return session.save();}finally{session.dispose();}})();
  const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname);if(!path.startsWith('/play/'))throw Error('scope');const file=resolve(dist,path.slice(6)||'index.html');if(!file.startsWith(dist+sep))throw Error('path');const b=await readFile(file);res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.wav':'audio/wav','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[extname(file)]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/play/`;
  const checks=[],errors=[];let browser,page;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    for(const mobile of [false,true]){
      const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
      await context.addInitScript(installProbe);
      await context.addInitScript(()=>{if(!localStorage.getItem('vn-engine:reset:settings'))localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,voiceEnabled:false,soundEffects:true,volume:.4}));});
      page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      const pass=name=>{checks.push({platform:mobile?'mobile-emulation':'desktop-browser',name});console.log('PASS',mobile?'mobile':'desktop',name);};
      const control=id=>page.locator(`[data-control="${id}"]`),close=()=>page.getByRole('button',{name:'关闭',exact:true}).click();
      const enter=async()=>{await page.locator('[data-reset-enter]').click();await page.locator('.reset-title-gate').waitFor({state:'detached'});};
      const count=async(id,event='playing')=>page.evaluate(({id,event})=>window.__resetSfxProbe.events.filter(e=>e.id===id&&e.event===event).length,{id,event});
      const started=async(id,previous)=>page.waitForFunction(({id,previous})=>window.__resetSfxProbe.events.filter(e=>e.id===id&&e.event==='playing').length>previous,{id,previous});
      const load=async save=>{await control('settings').click();await page.locator('input[type=file]').setInputFiles({name:'sfx-witness.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});await page.locator('.vn-modal').waitFor({state:'hidden'});await page.waitForFunction(id=>document.querySelector('.vn-engine')?.dataset.scene===id,save.state.sceneId);};
      await page.goto(url);await enter();await verifySfxDecoding(page,pass);
      for(const [save,id] of [[beforeMemory,'sfx-memory-ping'],[beforeDoor,'sfx-door-ghost']]){await load(save);const previous=await count(id);await control('next').click();await started(id,previous);}
      pass('Memory notification and portal door cues follow their actual story events');
      const restoreBefore=await count('sfx-load');await load(beforeCamera);await started('sfx-load',restoreBefore);
      const cameraBefore=await count('sfx-camera-self');await control('next').click();await started('sfx-camera-self',cameraBefore);
      await control('settings').click();await close();await page.waitForTimeout(120);assert.equal(await count('sfx-camera-self'),cameraBefore+1);
      const all=await page.evaluate(()=>window.__resetSfxProbe.events.filter(e=>e.event==='playing'));
      assert.ok(all.every(e=>!e.loop&&e.volume<=.4));pass('Successful restore feedback and the real shutter line play once; panel resume does not replay the line');
      // Restoring directly onto a sound line may acknowledge load, never replay
      // its scripted sound. The narrative engine retains its restore semantics.
      const oldRequests=await count('sfx-camera-self','requested');await load(cameraState);await page.waitForTimeout(100);assert.equal(await count('sfx-camera-self','requested'),oldRequests);
      await load(beforeMessage);const msgBefore=await count('sfx-message-future');await control('next').click();await started('sfx-message-future',msgBefore);pass('Future notification follows the vibration line; restore does not replay its scripted effect');
      await load(fixtures.combat.faceless_first);await page.locator('.reset-combat canvas').waitFor({state:'visible'});
      const resume=page.locator('[data-combat-resume]');if(await resume.isVisible())await resume.click();
      let dodgeBefore=await count('sfx-dodge');await page.locator('[data-key="Space"]').click();await started('sfx-dodge',dodgeBefore);
      await page.locator('[data-key="Space"]').click();await page.waitForTimeout(100);assert.equal(await count('sfx-dodge'),dodgeBefore+1);
      const hitBefore=await count('sfx-impact');await page.keyboard.down('ArrowRight');await page.waitForTimeout(3200);await page.keyboard.up('ArrowRight');await page.keyboard.press('k');await started('sfx-impact',hitBefore);
      await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.waitForTimeout(100);
      assert.ok(await page.evaluate(()=>window.__resetSfxProbe.players.every(p=>p.paused||p.ended)));
      pass('Real combat inputs produce dodge/impact feedback, reject cooldown taps and stop on simulated focus loss');
      await page.reload();await enter();await control('settings').click();await page.getByLabel('动作音效',{exact:true}).uncheck();await close();
      await load(beforeCamera);await control('next').click();await page.waitForTimeout(150);assert.equal(await count('sfx-camera-self','requested'),0);assert.equal(await count('sfx-load','requested'),0);
      await page.reload();await enter();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('vn-engine:reset:settings')).soundEffects),false);pass('The existing SFX mute setting suppresses scripted/restore cues and survives a full reload');
      await page.waitForFunction(async()=>{const m=await(await fetch('./sfx-manifest.json')).json();for(const e of m.effects)if(!await caches.match(new URL(e.src,location.href).href))return false;return Boolean(await caches.match(new URL('sfx.mjs',location.href).href)&&await caches.match(new URL('sfx-manifest.json',location.href).href));},null,{timeout:45000});
      await context.setOffline(true);await page.reload();await enter();await control('settings').click();await page.getByLabel('动作音效',{exact:true}).check();await page.getByLabel('音乐与音效音量',{exact:true}).fill('0.6');await close();
      await load(beforeCamera);await control('next').click();await started('sfx-camera-self',0);await verifySfxDecoding(page,pass);
      assert.ok(await page.evaluate(()=>window.__resetSfxProbe.events.filter(e=>e.event==='playing').every(e=>e.volume<=.6)));
      pass('Offline reload decodes all seven cached effects and plays story/restore feedback at the persisted volume');
      await context.close();
    }
    assert.deepEqual(errors,[]);await writeFile(resolve(out,'browser-report.json'),JSON.stringify({schema:1,status:'PASS',browser:await browser.version(),checks,errors,physicalDevices:'NOT_RUN',subjectiveListening:'NOT_CLAIMED'},null,2)+'\n');
  }catch(e){const probe=await page?.evaluate(()=>window.__resetSfxProbe?.events).catch(()=>null);await page?.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});await writeFile(resolve(out,'browser-failure.json'),JSON.stringify({status:'FAIL',error:e.stack,checks,errors,probe},null,2)+'\n');throw e;}
  finally{await browser?.close();await new Promise(r=>server.close(r));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await run();
