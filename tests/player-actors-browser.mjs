// Scripted UI actors supply evidence for a separate AI observation record.
// Imported saves are canonical replay fixtures, explicitly disclosed below;
// this is not a claim that a human read the entire novel from the title.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const dist=resolve(process.env.RESET_DIST||'dist'),out=resolve('test-results/final-qa/players');
const {chromium}=await import(pathToFileURL(resolve(process.env.VN_ENGINE_PATH||'../vn-engine','node_modules/playwright/index.mjs')));
const project=JSON.parse(await readFile(resolve(dist,'project.json'),'utf8'));
const fixtures=JSON.parse(await readFile('test-results/route-fixtures.json','utf8'));
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),path=resolve(dist,decodeURIComponent(url.pathname).replace(/^\/actors\//,'')||'index.html');
    if(!url.pathname.startsWith('/actors/')||!path.startsWith(dist+sep))throw Error('path');
    res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json','.wav':'audio/wav','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[extname(path)]||'application/octet-stream'});res.end(await readFile(path));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/actors/`;
const actors=[],screenshots=[],errors=[];
let browser;
async function actor(id,options,work){
  const context=await browser.newContext(options),page=await context.newPage();
  const record={id,viewport:options.viewport,entry:'fresh profile',fixtures:[],checks:[]};actors.push(record);
  page.on('pageerror',e=>errors.push(id+': '+e.message));
  await context.addInitScript(()=>localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,soundEffects:false,voiceEnabled:false})));
  const scene=()=>page.locator('.vn-engine').getAttribute('data-scene');
  const line=()=>page.locator('.vn-engine').getAttribute('data-line');
  const step=()=>options.isMobile?page.locator('.vn-text').tap():page.locator('.vn-text').click();
  const until=async(predicate,label)=>{
    for(let n=0;n<700;n++){
      if(await predicate())return;
      assert.equal(await page.locator('.reset-combat').count(),0,'A UI actor must not bypass real combat');
      assert.equal(await page.locator('.vn-actions [data-action]').count(),0,'Unexpected unanswered choice while reaching '+label);
      await step();
    }
    assert.fail('UI actor did not reach '+label);
  };
  const load=async key=>{
    assert.ok(fixtures.witnesses[key],key);record.fixtures.push({scene:key,method:'Settings backup import; canonical replay save from runtime discovery'});
    await page.locator('[data-control=settings]').click();
    await page.locator('input[type=file]').setInputFiles({name:'canonical-route.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixtures.witnesses[key]))});
    await page.locator('.vn-modal').waitFor({state:'hidden'});assert.equal(await scene(),key);
  };
  const shot=async name=>{
    await page.waitForFunction(()=>{
      const bg=document.querySelector('.vn-background');
      const images=[...document.images].filter(i=>i.getClientRects().length&&!i.hidden&&getComputedStyle(i).visibility!=='hidden');
      return bg?.naturalWidth>0&&images.every(i=>i.complete&&i.naturalWidth>0);
    });
    await page.waitForTimeout(100);
    const file=name+'.png';await page.screenshot({path:resolve(out,file),fullPage:true});
    screenshots.push({file,actor:id,scene:await scene(),line:await line(),sha256:createHash('sha256').update(await readFile(resolve(out,file))).digest('hex')});
  };
  try{
    await page.goto(base);await page.locator('.reset-title-gate').waitFor({state:'visible'});
    await work({page,scene,line,step,until,load,shot,record});
    record.status='PASS';console.log('PASS player actor',id);
  }catch(error){record.status='FAIL';record.error=error.stack;await page.screenshot({path:resolve(out,id+'-failure.png'),fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();}
}
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  await actor('first-time-keyboard',{viewport:{width:1280,height:900}},async({page,line,until,shot,record})=>{
    const firstLine=await line();
    assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-reset-new-game')),true);
    await shot('desktop-title');
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-reset-load-game')),true);
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-reset-new-game')),true);
    await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-reset-load-game')),true);
    await page.keyboard.press('Shift+Tab');await page.keyboard.press('Enter');await page.locator('.reset-title-gate').waitFor({state:'detached'});
    assert.equal(await line(),firstLine,'Title confirmation must not also advance the paragraph');
    assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('vn-reading')),true);
    await until(async()=>await page.locator('[data-action=watch_linwan]').count()>0,'first four-way decision');
    await page.locator('[data-action=watch_linwan]').click();
    const shadow=project.scenes.find(s=>s.id==='linwan_shadow').lines.find(l=>l.text.includes('闪电照亮教室')).id;
    await until(async()=>await line()===shadow,'the shadow moves before Lin Wan');await shot('desktop-first-anomaly');
    const layers=await page.evaluate(()=>({reading:Number(getComputedStyle(document.querySelector('.vn-reading')).zIndex),portrait:Number(getComputedStyle(document.querySelector('.vn-portrait')).zIndex),props:[...document.querySelectorAll('.reset-story-prop,.reset-direction-light,.reset-direction-warm,.reset-direction-shade')].map(n=>Number(getComputedStyle(n).zIndex))}));
    assert.ok(layers.reading>layers.portrait&&layers.props.every(z=>layers.reading>z),'Reading must stay above portraits, props and transient lighting');
    const linwan=project.scenes.find(s=>s.id==='linwan_shadow'),shadowIndex=linwan.lines.findIndex(l=>l.id===shadow);
    const long=linwan.lines.slice(shadowIndex+1).toSorted((a,b)=>b.text.length-a.text.length)[0];
    await until(async()=>await line()===long.id,'long dialogue with a real standing portrait');await shot('desktop-long-dialogue');
    record.checks.push('Fresh title traps Tab/Shift+Tab; Enter enters once and returns focus to reading','Real first choice enters Lin Wan scene and actual shadow paragraph');
    record.checks.push('Long dialogue stays above the actual portrait, scene props and transient direction lights');
  });
  await actor('mobile-six-routes',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2},async({page,scene,until,load,shot,record})=>{
    await shot('mobile-title');await page.locator('[data-reset-enter]').tap();await page.locator('.reset-title-gate').waitFor({state:'detached'});
    for(const route of ['linwan','xiaoman','xuqi','tinglan','tangli','nanxing']){
      await load('route_focus_choice');await until(async()=>await page.locator('[data-action=route_'+route+']').count()>0,'six route choices');
      for(const button of await page.locator('.vn-actions [data-action]').all()){
        await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();assert.ok(b.height>=44&&b.x>=0&&b.x+b.width<=390);
      }
      if(route==='linwan'){await page.locator('[data-action=route_linwan]').scrollIntoViewIfNeeded();await shot('mobile-six-choices');}
      await page.locator('[data-action=route_'+route+']').tap();
      await until(async()=>await page.locator('[data-action='+route+'_normal]').count()>0,route+' Normal/Truth choice');
      await page.locator('[data-action='+route+'_normal]').tap();
      await until(async()=>/已到达结局/.test(await page.locator('.vn-actions').innerText()),route+' Normal End');
      assert.equal(await scene(),'end_'+route);
      assert.equal(await page.evaluate(route=>JSON.parse(localStorage.getItem('reset:meta:v1')).endings.includes('normal-'+route),route),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
      await shot('mobile-ending-'+route);
      record.checks.push(route+': canonical focus fixture -> real route choice -> normal decision -> final paragraph and persistent ending Meta');
    }
  });
  await actor('returning-six-slots',{viewport:{width:1280,height:900}},async({page,scene,line,load,shot,record})=>{
    await page.locator('[data-reset-enter]').click();await page.locator('.reset-title-gate').waitFor({state:'detached'});
    await page.locator('[data-control=save]').click();const quick=await page.evaluate(()=>localStorage.getItem('vn-engine:reset:save:1'));
    const points=['prologue_1842','linwan_shadow','archive_room','route_focus_choice','chapter5_gate','c5_request'];
    for(let i=0;i<points.length;i++){
      await load(points[i]);await page.locator('[data-reset-control=slots]').click();await page.locator(`[data-slot="${i+1}"] [data-slot-action=save]`).click();await page.keyboard.press('Escape');
    }
    const raw=await page.evaluate(()=>localStorage.getItem('reset:slots:v1'));assert.equal(JSON.parse(raw).slots.length,6);
    await load('prologue_1842');const before=await line();await page.locator('[data-reset-control=slots]').click();await shot('desktop-six-slots');
    await page.locator('[data-slot="6"] [data-slot-action=load]').click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.equal(await line(),before);
    await page.locator('[data-slot="6"] [data-slot-action=load]').click();await page.locator('[data-reset-confirm]').click();assert.equal(await scene(),'c5_request');
    assert.equal(await page.evaluate(()=>localStorage.getItem('reset:slots:v1')),raw);
    assert.equal(await page.evaluate(()=>localStorage.getItem('vn-engine:reset:save:1')),quick);
    record.checks.push('Six distinct canonical story positions saved through visible manual-slot controls','Cancel preserves current paragraph; confirmed slot 6 restore does not rewrite the archive or quick-save');
  });
  await actor('true-route-reader',{viewport:{width:1280,height:900}},async({page,scene,until,load,shot,record})=>{
    await page.locator('[data-reset-enter]').click();await page.locator('.reset-title-gate').waitFor({state:'detached'});
    await load('c6_no_save');await until(async()=>await page.locator('[data-action=confirm_no_save]').count()>0,'irreversible confirmation');
    for(const selector of ['[data-control=save]','[data-control=load]','[data-control=restart]','[data-reset-control=slots]'])assert.equal(await page.locator(selector).isHidden(),true);
    await shot('irreversible-confirmation');await page.locator('[data-action=confirm_no_save]').click();
    await until(async()=>await scene()==='c7_morning','October 25 morning');await shot('october-25-morning');
    await until(async()=>await scene()==='c7_linwan','the final riverside conversation');
    await until(async()=>await page.locator('.vn-text').innerText()==='明天见。','the final spoken goodbye');
    await shot('true-end-riverside');
    await until(async()=>await page.title()==='回留 · 明天见'&&/已到达结局/.test(await page.locator('.vn-actions').innerText()),'True End');
    await shot('true-end-complete');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).trueEnd),true);
    await page.locator('[data-control=restart]').click();assert.equal(await scene(),project.entry);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).trueEnd),true);
    record.checks.push('Disclosed c6_no_save fixture, then actual irreversible confirmation and forward-only reading through October 25 and credits','True End allows a new game while retaining Meta');
  });
  assert.deepEqual(errors,[]);
}finally{
  await writeFile(resolve(out,'report.json'),JSON.stringify({schema:1,type:'scripted-ui-player-actors',status:actors.length===4&&actors.every(a=>a.status==='PASS')?'PASS':'FAIL',version:project.version,projectSha256:createHash('sha256').update(await readFile(resolve(dist,'project.json'))).digest('hex'),independentAiObservation:'REQUIRED_SEPARATELY',realHumanParticipants:'NOT_CLAIMED',physicalDevices:'NOT_RUN',actors,screenshots,errors},null,2)+'\n');
  await browser?.close();await new Promise(r=>server.close(r));
}
