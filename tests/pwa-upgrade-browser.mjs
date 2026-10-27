import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

export async function verifyPwaUpgrade({browser,dist,previous,fixtures,out,pass}) {
  let root=resolve(previous);
  const server=createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(!pathname.startsWith('/candidate/'))throw Error();
      const file=resolve(root,pathname.slice(11)||'index.html');if(!file.startsWith(root+sep))throw Error();
      const body=await readFile(file);res.writeHead(200,{'Cache-Control':'no-cache','Content-Type':{'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav'}[extname(file)]||'application/octet-stream'});res.end(body);
    }catch{res.writeHead(404);res.end();}
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/candidate/`;
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});let page;
  const enterTitle=async()=>{
    const title=page.locator('.reset-title-gate');
    await title.waitFor({state:'visible',timeout:10000});
    const enter=page.locator('[data-reset-enter]');
    assert.equal(await enter.isEnabled(),true,'upgraded title enter must be interactable');
    await enter.tap();await title.waitFor({state:'detached'});
  };
  await context.addInitScript(()=>{if(!localStorage.getItem('vn-engine:reset:settings'))localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,soundEffects:false}));});
  try{
    page=await context.newPage();await page.goto(base);await page.locator('.vn-engine').waitFor();
    const previousProject=await page.evaluate(async()=>await(await fetch('./project.json')).json());
    assert.equal(previousProject.version,'reset-v1.1.0');
    await page.locator('[data-control=save]').click();
    await page.locator('[data-reset-control=slots]').click();await page.locator('[data-slot="1"] [data-slot-action=save]').click();await page.keyboard.press('Escape');
    const oldEnding=structuredClone(fixtures.endings['normal-linwan']);
    const previousEnding=previousProject.scenes.find(scene=>scene.id===oldEnding.state.sceneId);
    assert.ok(previousEnding,'v1.1.0 must contain the preserved Lin Wan ending scene');
    oldEnding.state.storyVersion=previousProject.version;
    oldEnding.state.line=Math.max(0,(previousEnding.lines?.length??1)-1);
    oldEnding.state.history=[];
    if(previousProject.stats)oldEnding.state.stats=Object.fromEntries(Object.entries(previousProject.stats).map(([key,value])=>[key,oldEnding.state.stats?.[key]??value]));
    await page.locator('[data-control=settings]').click();await page.locator('input[type=file]').setInputFiles({name:'old-route.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(oldEnding))});await page.locator('.vn-modal').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('可离线游玩')&&navigator.serviceWorker.controller);
    const saved=await page.evaluate(async()=>({quick:localStorage.getItem('vn-engine:reset:save:1'),slots:localStorage.getItem('reset:slots:v1'),caches:await caches.keys()}));
    await page.evaluate(async()=>{const c=await caches.open('qa-unrelated-cache');await c.put('./unrelated',new Response('keep'));});
    const nextWorkerPromise=context.waitForEvent('serviceworker');
    root=resolve(dist);await page.evaluate(async()=>{const owner=await navigator.serviceWorker.getRegistration();await owner.update();});
    await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting),null,{timeout:90000});
    assert.equal(await page.evaluate(async()=> (await(await fetch('./project.json')).json()).version),'reset-v1.1.0','the active client must not switch runtime mid-story');
    const nextWorker=await nextWorkerPromise;
    await nextWorker.evaluate(()=>{self.__qaActivated=new Promise(resolve=>self.addEventListener('activate',()=>resolve(true),{once:true}));});
    await page.close();await nextWorker.evaluate(()=>self.__qaActivated);
    await nextWorker.evaluate(()=>new Promise((resolve,reject)=>{
      const deadline=Date.now()+30000;
      const check=()=>{if(!self.registration.waiting&&self.registration.active?.state==='activated')resolve(true);else if(Date.now()>deadline)reject(Error('Candidate worker activation timed out'));else setTimeout(check,25);};check();
    }));
    page=await context.newPage();await page.goto(base);await page.locator('.vn-engine').waitFor();
    await page.waitForFunction(async()=> (await(await fetch('./project.json')).json()).version==='reset-v1.2.1',null,{timeout:90000});
    await enterTitle();
    await page.reload();await page.locator('.vn-engine').waitFor();await enterTitle();await page.locator('.reset-toolbar-controls').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('vn-engine:reset:save:1')),saved.quick);
    assert.equal(await page.evaluate(()=>localStorage.getItem('reset:slots:v1')),saved.slots);
    await page.locator('[data-control=load]').click();
    await page.locator('[data-reset-control=slots]').click();await page.locator('[data-slot="1"] [data-slot-action=load]').click();await page.locator('[data-reset-confirm]').click();
    await page.locator('[data-reset-control=collection]').click();assert.equal(await page.locator('[data-ending=normal-linwan]').getAttribute('data-unlocked'),'true');await page.keyboard.press('Escape');
    const keys=await page.evaluate(()=>caches.keys());assert.ok(keys.includes('qa-unrelated-cache'));
    assert.ok(saved.caches.filter(k=>k.startsWith('vn-self-reset-v2:')).every(k=>!keys.includes(k)));
    pass('Published v1.1.0 PWA upgrades at the same nested origin to v1.2.1 after clients close; old quick/manual saves, settings and ending Meta survive');
    await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.getElementById('status').textContent.includes('可离线游玩'));
    await context.setOffline(true);await page.reload();await page.locator('.vn-engine').waitFor();await enterTitle();
    await page.locator('[data-control=load]').click();await page.locator('[data-reset-control=slots]').click();await page.locator('[data-slot="1"] [data-slot-action=load]').click();await page.locator('[data-reset-confirm]').click();
    await page.locator('.vn-background').waitFor({state:'visible'});assert.equal(await page.locator('#error').innerText(),'');
    await page.screenshot({path:out+'/v110-upgraded-offline.png',fullPage:true});
    pass('Upgraded v1.2.1 reloads offline and reads both real v1.1.0 save formats without clearing other caches');
  }catch(error){
    await page?.screenshot({path:out+'/upgrade-failure.png',fullPage:true}).catch(()=>{});
    const state=await page?.evaluate(async()=>({error:document.querySelector('#error')?.textContent,html:document.body.innerText,cacheKeys:await caches.keys(),cacheProjects:await Promise.all((await caches.keys()).filter(k=>k.startsWith('vn-self-reset-v2:')).map(async key=>{const cache=await caches.open(key),response=await cache.match(new URL('./project.json',location.href));return {key,version:response?(await response.json()).version:null};})),archiveHasNewControls:(await(await fetch('./archive.mjs')).text()).includes('reset-toolbar-controls'),controller:navigator.serviceWorker.controller?.state,waiting:(await navigator.serviceWorker.getRegistration())?.waiting?.state})).catch(()=>null);
    const {writeFile}=await import('node:fs/promises');await writeFile(out+'/upgrade-failure.json',JSON.stringify({error:error.stack,state},null,2));throw error;
  }finally{await context.close();await new Promise(r=>server.close(r));}
}
