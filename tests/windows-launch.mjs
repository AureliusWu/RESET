// Runs on windows-latest against the extracted final ZIP, without changing the host.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const {chromium}=await import(pathToFileURL(resolve(process.env.VN_ENGINE_PATH,'node_modules/playwright/index.mjs')));
const root=resolve(process.argv[2]), out=resolve('test-results/windows-installed');await mkdir(out,{recursive:true});
const checks=[],errors=[];let browser,page;
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
try{
  stop();
  page=await launch();checks.push('Extracted RESET.exe starts engine/VNEngine.exe and mounts the real game/ content in Windows WebView2 with only system PATH and no SDK overrides');
  await page.locator('[data-control=settings]').click();await page.getByLabel('文字间隔',{exact:true}).fill('0');await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('[data-control=next]').click();await page.locator('[data-control=save]').click();const line=await page.locator('.vn-engine').getAttribute('data-line');
  await page.locator('[data-control=next]').click();await page.locator('[data-control=load]').click();assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),line);
  assert.match(await page.title(),/读取/);checks.push('Native player renders art, uses settings, saves and restores with Meta');
  await page.screenshot({path:out+'/native-game.png'});
  const close=spawnSync('powershell',['-NoProfile','-Command',"Get-Process VNEngine | ForEach-Object { $_.CloseMainWindow() | Out-Null; if (-not $_.WaitForExit(10000)) { throw 'Native window did not close normally' } }"],{encoding:'utf8'});
  assert.equal(close.status,0,close.stderr);await browser.close().catch(()=>{});browser=null;
  await new Promise(r=>setTimeout(r,1500));
  page=await launch();await page.locator('[data-control=load]').click();await page.waitForFunction(line=>document.querySelector('.vn-engine')?.dataset.line===line,line);
  assert.match(await page.title(),/读取 2/);checks.push('A complete native process restart retains the save, reading settings and Meta');
  await page.screenshot({path:out+'/native-restarted.png'});assert.deepEqual(errors,[]);
  await writeFile(out+'/acceptance.json',JSON.stringify({result:'passed',platform:process.platform,browser:await browser.version(),checks,errors},null,2)+'\n');
  console.log(JSON.stringify({result:'passed',checks},null,2));
}catch(e){
  const state=await page?.evaluate(()=>({title:document.title,scene:document.querySelector('.vn-engine')?.dataset,status:document.querySelector('.vn-status')?.textContent,save:localStorage.getItem('vn-engine:reset:save:1'),meta:localStorage.getItem('reset:meta:v1')})).catch(()=>null);
  await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await writeFile(out+'/failure.json',JSON.stringify({error:e.stack,checks,errors,state},null,2));throw e;
}
finally{await browser?.close().catch(()=>{});stop()}
