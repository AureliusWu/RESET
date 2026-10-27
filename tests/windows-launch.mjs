// Runs on windows-latest against the extracted final ZIP, without changing the host.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { verifyLinwanArt } from './linwan-art-browser.mjs';
import { verifyProductionArt } from './production-art-browser.mjs';
const {chromium}=await import(pathToFileURL(resolve(process.env.VN_ENGINE_PATH,'node_modules/playwright/index.mjs')));
const root=resolve(process.argv[2]), out=resolve('test-results/windows-installed');await mkdir(out,{recursive:true});
const checks=[],errors=[],limitations=[];let browser,page;
const fixtures=JSON.parse(await readFile('test-results/route-fixtures.json','utf8'));
const project=JSON.parse(await readFile(resolve(root,'game/project.json'),'utf8'));
const gameOrigin='https://game-'+createHash('sha256').update('reset').digest('hex').slice(0,24)+'.vnengine.test/';
const stop=()=>{
  spawnSync('taskkill',['/IM','VNEngine.exe','/T','/F'],{stdio:'ignore'});
  // Previous CI window probes can leave an orphan browser using the default
  // profile. This dedicated runner contains only our disposable test processes.
  spawnSync('taskkill',['/IM','msedgewebview2.exe','/T','/F'],{stdio:'ignore'});
};
const launch=async()=>{
  // The verifier uses Node, but the game process receives only system search
  // paths, with SDK/runtime overrides removed. It must use its packaged host.
  const runtimeEnv={...process.env};
  for(const name of Object.keys(runtimeEnv))if(/^(PATH|NODE.*|NPM.*|DOTNET.*)$/i.test(name))delete runtimeEnv[name];
  runtimeEnv.PATH=`${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`;
  const child=spawn(resolve(root,'RESET.exe'),[],{cwd:root,env:{...runtimeEnv,WEBVIEW2_USER_DATA_FOLDER:resolve(out,'profile'),WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port=9223'}});
  child.on('error',e=>errors.push(e.message));
  for(let i=0;i<150;i++){try{const r=await fetch('http://127.0.0.1:9223/json/version');if(r.ok){browser=await chromium.connectOverCDP('http://127.0.0.1:9223');break}}catch{}await new Promise(r=>setTimeout(r,200));}
  if(!browser){
    const result=spawnSync('powershell',['-NoProfile','-Command',"Get-CimInstance Win32_Process | Where-Object {$_.Name -in @('RESET.exe','VNEngine.exe','msedgewebview2.exe')} | Select-Object Name,ProcessId,ParentProcessId,CommandLine | ConvertTo-Json"],{encoding:'utf8'});
    await writeFile(out+'/process-diagnostics.json',result.stdout||'[]');
  }
  assert.ok(browser,'RESET.exe did not start a debuggable native WebView2');
  const context=browser.contexts()[0];let page;
  for(let i=0;i<100;i++){page=context.pages().find(p=>p.url().startsWith(gameOrigin));if(page)break;await new Promise(r=>setTimeout(r,100));}
  assert.ok(page,'Native RESET game page missing');page.on('pageerror',e=>errors.push(e.message));await page.locator('.vn-engine').waitFor();
  assert.equal(await page.locator('#error').innerText(),'');await page.locator('.vn-background').waitFor({state:'visible'});return page;
};
const enterGame=async()=>{
  const title=page.locator('.reset-title-screen');
  if(await title.count()){
    await title.waitFor({state:'visible'});
    const start=page.locator('[data-title-start]');
    assert.equal(await start.isEnabled(),true,'title Start button must be interactable');
    await start.click();
    await title.waitFor({state:'detached'});
  }
};
try{
  stop();
  page=await launch();await enterGame();checks.push('Extracted RESET.exe starts engine/VNEngine.exe, presents an interactive title screen, and mounts the real game/ content in Windows WebView2 with only system PATH and no SDK overrides');
  await page.locator('[data-control=settings]').click();await page.getByLabel('文字间隔',{exact:true}).fill('0');await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('[data-control=next]').click();await page.locator('[data-control=save]').click();const line=await page.locator('.vn-engine').getAttribute('data-line');
  await page.locator('[data-control=next]').click();await page.locator('[data-control=load]').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),line);
  assert.match(await page.title(),/读取/);checks.push('Native player renders art, uses settings, saves and restores with Meta');
  await page.locator('[data-reset-control=slots]').click();await page.locator('[data-slot="1"] [data-slot-action=save]').click();await page.keyboard.press('Escape');
  const importSave=async save=>{await page.locator('[data-control=settings]').click();await page.locator('input[type=file]').setInputFiles({name:'reset-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});await page.locator('.vn-modal').waitFor({state:'hidden'});};
  await verifyLinwanArt({page,project,fixtures,loadFixture:importSave,control:id=>page.locator(`[data-control="${id}"]`),out,pass:name=>checks.push('Native WebView2: '+name),viewports:false});
  await verifyProductionArt({page,project,fixtures,loadFixture:importSave,out,pass:name=>checks.push('Native WebView2: '+name),captureEdges:false});
  assert.equal(await page.locator('.vn-engine').getAttribute('data-irreversible'),'false','Art QA must leave the main game outside irreversible scenes');
  const cgScene=project.scenes.find(s=>s.cg==='letter-1842-cg');await importSave(fixtures.witnesses[cgScene.id]);
  for(let i=0;i<30;i++){if(await page.locator('.vn-cg').getAttribute('data-asset')==='letter-1842-cg')break;await page.locator('[data-control=next]').click();}
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).cgs.includes('letter-1842-cg'));
  await importSave(fixtures.endings['normal-linwan']);await page.locator('[data-reset-control=collection]').click();
  assert.equal(await page.locator('[data-ending=normal-linwan]').getAttribute('data-unlocked'),'true');assert.equal(await page.locator('[data-cg=letter-1842-cg]').isEnabled(),true);
  await page.screenshot({path:out+'/native-collection.png'});await page.keyboard.press('Escape');
  await page.locator('[data-reset-control=slots]').click();await page.locator('[data-slot="1"] [data-slot-action=load]').click();await page.locator('[data-reset-confirm]').click();
  assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),line);
  const nativeWindow=(action,width=1024,height=768)=>{
    const result=spawnSync('powershell',['-NoProfile','-File',resolve('tests/windows-window.ps1'),'-Action',action,'-Width',String(width),'-Height',String(height)],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout.trim());
  };
  for(const [width,height] of [[1024,768],[1024,600],[800,600]]){
    const rect=nativeWindow('resize',width,height);assert.equal(rect.width,width);assert.equal(rect.height,height);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.vn-toolbar').getBoundingClientRect().bottom<=innerHeight));
    await page.screenshot({path:out+`/native-${width}x${height}.png`});
  }
  assert.equal(nativeWindow('maximize').maximized,true);
  assert.equal(nativeWindow('minimize').minimized,true);assert.equal(nativeWindow('restore').minimized,false);
  checks.push('Real Win32 window resize at 1024x768, 1024x600 and the pinned host minimum 800x600, maximize, minimize and restore keep the player usable');
  const dpi=await page.context().newCDPSession(page);
  for(const scale of [1.25,1.5,2]){
    await dpi.send('Emulation.setDeviceMetricsOverride',{width:800,height:600,deviceScaleFactor:scale,mobile:false});
    assert.equal(await page.evaluate(()=>devicePixelRatio),scale);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await dpi.send('Emulation.clearDeviceMetricsOverride');await dpi.detach();
  checks.push('WebView2 content DPI emulation at 125%, 150% and 200% has no horizontal overflow; physical monitor scaling remains a manual check');
  await importSave(fixtures.combat.faceless_first);await page.locator('.reset-combat canvas').waitFor();
  const focusClient=await page.context().newCDPSession(page);
  // Playwright enables focus emulation in its own Chromium initialization.
  // Disable it before observing actual Win32 foreground/visibility behavior.
  await focusClient.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  nativeWindow('focus');
  const foreground=await page.evaluate(()=>document.hasFocus());
  if(foreground){
    if(await page.locator('[data-combat-resume]').isVisible())await page.locator('[data-combat-resume]').click();
    await page.evaluate(()=>{window.__resetFocusProbe={blur:false};addEventListener('blur',()=>window.__resetFocusProbe.blur=true,{once:true});});
    nativeWindow('defocus');
    if(await page.evaluate(()=>window.__resetFocusProbe.blur)){
      await page.locator('[data-combat-resume]').waitFor({state:'visible'});
      checks.push('Actual native foreground focus loss pauses combat until explicit resume');
    }else limitations.push('The external focus probe did not produce a real blur event; physical Alt+Tab remains unverified');
  }else limitations.push('The runner could not establish a real foreground WebView2 focus; physical Alt+Tab remains unverified');
  if(await page.locator('[data-combat-resume]').isVisible())await page.locator('[data-combat-resume]').click();
  nativeWindow('minimize');nativeWindow('restore');
  if(await page.locator('[data-combat-resume]').isVisible())checks.push('Actual native minimize/restore pauses combat until explicit resume');
  else limitations.push('Native minimize/restore worked, but this runner did not expose a new DOM focus/visibility transition; physical background combat check remains unverified');
  await page.screenshot({path:out+'/native-paused-combat.png'});
  // A normal restart must let WebView2 flush its asynchronous storage backend.
  // taskkill is reserved for disposable runner cleanup, not persistence probes.
  const firstClose=spawnSync('powershell',['-NoProfile','-Command',"Get-Process VNEngine | ForEach-Object { $_.CloseMainWindow() | Out-Null; if (-not $_.WaitForExit(10000)) { throw 'Native window did not close normally' } }"],{encoding:'utf8'});
  assert.equal(firstClose.status,0,firstClose.stderr);await browser.close().catch(()=>{});browser=null;
  page=await launch();await enterGame();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).endings.includes('normal-linwan')),'ending survives first normal process restart');
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).cgs.includes('letter-1842-cg')),'CG survives first normal process restart');
  await page.locator('[data-control=load]').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),line);
  const beforeRestart=await page.evaluate(()=>({loads:JSON.parse(localStorage.getItem('reset:meta:v1')).loads,slots:localStorage.getItem('reset:slots:v1')}));
  checks.push('Native manual slots save and restore; actual story CG and ending unlock in the archive');
  await page.screenshot({path:out+'/native-game.png'});
  const close=spawnSync('powershell',['-NoProfile','-Command',"Get-Process VNEngine | ForEach-Object { $_.CloseMainWindow() | Out-Null; if (-not $_.WaitForExit(10000)) { throw 'Native window did not close normally' } }"],{encoding:'utf8'});
  assert.equal(close.status,0,close.stderr);await browser.close().catch(()=>{});browser=null;
  await new Promise(r=>setTimeout(r,1500));
  page=await launch();await enterGame();assert.equal(await page.evaluate(()=>localStorage.getItem('reset:slots:v1')),beforeRestart.slots);
  await page.locator('[data-reset-control=slots]').click();await page.locator('[data-slot="1"] [data-slot-action=load]').click();await page.locator('[data-reset-confirm]').click();await page.waitForFunction(line=>document.querySelector('.vn-engine')?.dataset.line===line,line);
  assert.equal(await page.title(),`回留 · 读取 ${beforeRestart.loads+1}`);
  await page.locator('[data-control=load]').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),line);
  assert.equal(await page.title(),`回留 · 读取 ${beforeRestart.loads+2}`);
  await page.locator('[data-reset-control=collection]').click();assert.equal(await page.locator('[data-ending=normal-linwan]').getAttribute('data-unlocked'),'true');assert.equal(await page.locator('[data-cg=letter-1842-cg]').isEnabled(),true);await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('vn-engine:reset:settings')).textDelayMs),0);
  checks.push('A complete native process restart retains quick save, manual slots, reading settings, Meta, unlocked endings and CGs');
  await page.screenshot({path:out+'/native-restarted.png'});assert.deepEqual(errors,[]);
  await writeFile(out+'/acceptance.json',JSON.stringify({result:'passed',platform:process.platform,browser:await browser.version(),checks,errors,limitations},null,2)+'\n');
  console.log(JSON.stringify({result:'passed',checks,limitations},null,2));
}catch(e){
  const state=await page?.evaluate(()=>({title:document.title,scene:document.querySelector('.vn-engine')?.dataset,status:document.querySelector('.vn-status')?.textContent,save:localStorage.getItem('vn-engine:reset:save:1'),meta:localStorage.getItem('reset:meta:v1')})).catch(()=>null);
  await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await writeFile(out+'/failure.json',JSON.stringify({error:e.stack,checks,errors,state},null,2));throw e;
}
finally{await browser?.close().catch(()=>{});stop()}
