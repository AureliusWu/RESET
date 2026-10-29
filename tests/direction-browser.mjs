import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
export async function directionWitnesses(project,fixtures){
  const {createProject}=await import(pathToFileURL(resolve(process.env.RESET_DIST||'dist','lib/index.js')));
  const find=(sceneId,lineId)=>{const{session}=createProject(project,'https://reset.test/',{settings:{textDelayMs:0,reducedMotion:true}});let previous;
    try{session.restore(fixtures.witnesses[sceneId]);for(let i=0;i<200;i++){const f=session.getView().frame;if(lineId&&f.lineId===lineId)return previous;if(!lineId&&f.actions.some(a=>a.id==='@continue'))return session.save();previous=session.save();if(!session.next())break;}throw Error(`Missing direction witness ${sceneId}/${lineId}`);}finally{session.dispose();}};
  return {camera:find('archive_photo','c3f001'),boundary:find('rooftop_warning'),focus:find('archive_photo','c3f004')};
}
function installProbe(){
  const original=Element.prototype.animate;window.__directionProbe=[];
  Element.prototype.animate=function(frames,options){const a=original.call(this,frames,options);
    if(this.classList.contains('vn-background')||this.classList.contains('vn-cg')||this.className?.startsWith?.('reset-direction-')||this.classList.contains('reset-direction-chapter')){
      a.playbackRate=.1;window.__directionProbe.push({element:this,animation:a,frames,options});
    }return a;};
}
export async function verifyDirection({page,project,fixtures,loadFixture,pass,out,systemPreference=false}){
  const witnesses=await directionWitnesses(project,fixtures),control=id=>page.locator(`[data-control="${id}"]`),close=()=>page.getByRole('button',{name:'关闭',exact:true}).click();
  await control('settings').click();await page.getByLabel('文字间隔',{exact:true}).fill('0');await page.getByLabel('减少动态效果',{exact:true}).uncheck();await close();
  // Install after startup in WebView2 too. Real native WAAPI objects are retained.
  await page.evaluate(installProbe);
  await loadFixture(witnesses.boundary);assert.equal(await page.locator('.reset-direction-chapter').count(),0,'restore must not replay chapter intro');
  await page.locator('[data-action="@continue"]').click();
  await page.locator('.reset-direction-chapter[data-chapter="2"]').waitFor({state:'visible'});
  assert.match(await page.locator('.reset-direction-chapter').innerText(),/残响/);
  const chapterGeometry=await page.locator('.reset-direction-chapter').evaluate(e=>{const a=e.getBoundingClientRect(),s=e.closest('.vn-stage').getBoundingClientRect();return {left:a.left,right:a.right,stageLeft:s.left,stageRight:s.right,pointer:getComputedStyle(e).pointerEvents};});
  assert.ok(chapterGeometry.left>=chapterGeometry.stageLeft-2&&chapterGeometry.right<=chapterGeometry.stageRight+2);assert.equal(chapterGeometry.pointer,'none');
  if(out)await page.screenshot({path:out+'/chapter.png',animations:'allow'});
  pass('Chapter 2 appears on its canonical continuation, stays within the stage and never intercepts input');
  await loadFixture(witnesses.camera);
  assert.equal(await page.locator('.reset-direction-chapter').count(),0);
  assert.equal(await page.locator('.vn-engine').getAttribute('data-direction-cue'),null,'restoring near reveal stays static');
  await control('next').click();
  await page.waitForFunction(()=>document.querySelector('.vn-engine')?.dataset.directionCue==='shutter');
  await page.evaluate(()=>{window.__cue=window.__directionProbe.findLast(p=>p.element.classList.contains('reset-direction-light')).animation;});
  assert.equal(await page.evaluate(()=>window.__cue.playState),'running');
  await control('settings').click();await page.waitForFunction(()=>window.__cue.playState==='paused');await page.evaluate(async()=>await window.__cue.ready);const frozen=await page.evaluate(()=>window.__cue.currentTime);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__cue.currentTime),frozen);
  await close();assert.equal(await page.evaluate(()=>window.__cue.playState),'running');
  await control('next').click();assert.equal(await page.evaluate(()=>window.__cue.playState),'idle');
  assert.equal(await page.locator('.reset-direction-light').evaluate(e=>getComputedStyle(e).opacity),'0');
  pass('A real shutter animation starts on its line, freezes/resumes with settings, and cancels on the next visit');
  await loadFixture(witnesses.focus);await control('next').click();await page.waitForFunction(()=>document.querySelector('.vn-engine')?.dataset.directionCue==='focus');
  const active=await page.evaluate(()=>window.__directionProbe.filter(p=>p.animation.playState==='running').map(p=>({kind:p.element.className,frames:p.animation.effect.getKeyframes()})));
  assert.ok(active.some(p=>p.frames.some(f=>String(f.transform).includes('1.012'))));
  assert.equal(await page.locator('.vn-portrait').evaluate(e=>e.getAnimations().length),0,'ordinary portrait must stay still');
  if(out)await page.screenshot({path:out+'/focus.png',animations:'allow'});
  await control('next').click();pass('A reveal uses the decoded CG/background for a bounded camera push while portraits and dialogue remain usable');
  await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).check();await close();
  await loadFixture(witnesses.camera);await control('next').click();
  assert.equal(await page.locator('.vn-engine').getAttribute('data-direction-reduced'),'true');
  assert.equal(await page.evaluate(()=>window.__directionProbe.filter(p=>['running','paused'].includes(p.animation.playState)).length),0);
  await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).uncheck();await close();
  assert.equal(await page.locator('.vn-engine').getAttribute('data-direction-cue'),null,'motion opt-in cannot replay a consumed reveal');
  pass('Reduced motion removes active effects and switching it off does not replay the current line');
  if(systemPreference){
    await page.emulateMedia({reducedMotion:'reduce'});await loadFixture(witnesses.camera);await control('next').click();
    await page.waitForFunction(()=>document.querySelector('.vn-engine')?.dataset.directionReduced==='true');
    assert.equal(await page.evaluate(()=>window.__directionProbe.filter(p=>['running','paused'].includes(p.animation.playState)).length),0);
    await page.emulateMedia({reducedMotion:'no-preference'});pass('The operating-system reduced-motion preference is honored independently of the game checkbox');
  }
  await loadFixture(fixtures.witnesses.prologue_1842);
  assert.equal(await page.locator('.reset-brand-mark').count(),0,'title decoration must not linger over prologue dialogue');
  assert.equal(await page.locator('.vn-stage').evaluate(e=>getComputedStyle(e).transform),'none');
  pass('Restoring the prologue leaves title decoration and whole-stage camera movement absent');
}
async function run(){
  const engine=resolve(process.env.VN_ENGINE_PATH||'../VN-Engine-v2');const{chromium}=await import(pathToFileURL(resolve(engine,'node_modules/playwright/index.mjs')));
  const dist=resolve(process.env.RESET_DIST||'dist'),out=resolve('test-results/direction-r1');await mkdir(out,{recursive:true});
  const project=JSON.parse(await readFile(resolve(dist,'project.json'))),fixtures=JSON.parse(await readFile('test-results/route-fixtures.json'));
  const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!path.startsWith('/play/'))throw Error('scope');const file=resolve(dist,path.slice(6)||'index.html');if(!file.startsWith(dist+sep))throw Error('path');const b=await readFile(file);res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.wav':'audio/wav','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[extname(file)]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/play/`;const checks=[],errors=[];let browser,page;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    for(const mobile of [false,true]){
      const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
      await context.addInitScript(()=>localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:false,music:false,soundEffects:false,voiceEnabled:false})));
      page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const pass=name=>{checks.push({platform:mobile?'mobile-emulation':'desktop-browser',name});console.log('PASS',mobile?'mobile':'desktop',name);};
      const capture=resolve(out,mobile?'mobile':'desktop');await mkdir(capture,{recursive:true});
      const enter=async()=>{await page.locator('[data-reset-enter]').click();await page.locator('.reset-title-gate').waitFor({state:'detached'});};
      await page.goto(url);await enter();
      const loadFixture=async save=>{await page.locator('[data-control="settings"]').click();await page.locator('input[type=file]').setInputFiles({name:'direction-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});await page.locator('.vn-modal').waitFor({state:'hidden'});await page.waitForFunction(id=>document.querySelector('.vn-engine')?.dataset.scene===id,save.state.sceneId);};
      await verifyDirection({page,project,fixtures,loadFixture,pass,out:capture,systemPreference:true});
      await page.waitForFunction(async()=>Boolean(await caches.match(new URL('direction.mjs',location.href).href)&&await caches.match(new URL('direction-data.mjs',location.href).href)&&await caches.match(new URL('direction.css',location.href).href)),null,{timeout:45000});
      await context.setOffline(true);await page.reload();await enter();await loadFixture(fixtures.witnesses.archive_photo);
      assert.equal(await page.locator('.vn-engine').getAttribute('data-direction-mood'),'memory');assert.equal(await page.locator('#error').innerText(),'');
      pass('Offline reload retains the direction code, authored cue sheet and static restored mood');await context.close();
    }
    assert.deepEqual(errors,[]);await writeFile(resolve(out,'browser-report.json'),JSON.stringify({schema:1,status:'PASS',browser:await browser.version(),checks,errors,physicalDevices:'NOT_RUN'},null,2)+'\n');
  }catch(e){await page?.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});const state=await page?.evaluate(()=>({data:document.querySelector('.vn-engine')?.dataset,animations:window.__directionProbe?.map(p=>({kind:p.element.className,state:p.animation.playState}))})).catch(()=>null);await writeFile(resolve(out,'browser-failure.json'),JSON.stringify({status:'FAIL',error:e.stack,checks,errors,state},null,2)+'\n');throw e;}
  finally{await browser?.close();await new Promise(r=>server.close(r));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await run();
