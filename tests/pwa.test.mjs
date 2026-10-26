import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
const dist=resolve(process.env.RESET_DIST||'dist');
const source=readFileSync(resolve(dist,'pwa.mjs'),'utf8').replace('export async function','async function')+'\nregisterGamePwa';
function harness(navigator){const status={textContent:''};const register=runInNewContext(source,{navigator,document:{getElementById:()=>status},queueMicrotask,addEventListener(){}});return{status,register};}
test('unsupported or failed offline setup never advertises a completed download or crashes the game',async()=>{
  const missing=harness({});await missing.register();assert.match(missing.status.textContent,/不支持离线缓存/);
  const failed=harness({serviceWorker:{register:async()=>{throw Error('Network')}}});await failed.register();assert.match(failed.status.textContent,/未能下载/);
});
test('a waiting update asks players to save and close clients without replacing a live game',async()=>{
  const listeners=new Map(),owner={active:{state:'activated',addEventListener(){}},waiting:null,addEventListener:(name,fn)=>listeners.set(name,fn)};
  const h=harness({serviceWorker:{register:async()=>owner,addEventListener(){}}});await h.register();assert.match(h.status.textContent,/可离线游玩/);
  owner.waiting={addEventListener(){}};listeners.get('updatefound')();assert.match(h.status.textContent,/先保存进度/);assert.match(h.status.textContent,/关闭所有游戏窗口/);
});
test('mobile installation metadata includes valid 192px and 512px PNG icons and safe-area viewport',()=>{
  const manifest=JSON.parse(readFileSync(resolve(dist,'manifest.webmanifest')));
  for(const size of [192,512]){
    const icon=manifest.icons.find(i=>i.sizes===`${size}x${size}`&&i.type==='image/png');assert.ok(icon);
    const bytes=readFileSync(resolve(dist,icon.src));assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
  }
  assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.match(readFileSync(resolve(dist,'index.html'),'utf8'),/viewport-fit=cover/);
});
