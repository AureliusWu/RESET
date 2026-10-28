let deferredInstallPrompt=null;

function ensureTitleGate(archive){
  const host=document.querySelector?.('.vn-engine');
  if(!host||host.querySelector('.reset-title-gate'))return;
  if(!host.querySelector('.reset-touch-floor-style')){
    const touchStyle=document.createElement('style');
    touchStyle.className='reset-touch-floor-style';
    touchStyle.textContent='@media (pointer:coarse),(max-width:700px){.vn-engine .vn-toolbar .reset-toolbar-controls button,.vn-engine .vn-actions button,.vn-engine .reset-panel button,.vn-engine .vn-panel button,.vn-engine .reset-title-gate button{min-height:44px!important;touch-action:manipulation}}';
    host.append(touchStyle);
  }
  const gate=document.createElement('section');
  gate.className='reset-title-gate';
  gate.setAttribute('role','dialog');
  gate.setAttribute('aria-label','回留标题页');
  gate.innerHTML=`<div class="reset-title-gate__shade"></div><div class="reset-title-gate__content"><div class="reset-title-gate__kicker">18:42 · 有人记得你</div><h1>回留</h1><div class="reset-title-gate__en">RESET</div><div class="reset-title-gate__actions"><button type="button" data-reset-enter data-reset-new-game>新游戏</button><button type="button" data-reset-load-game>读取存档</button><button type="button" data-reset-install hidden>安装到设备</button></div><p class="reset-title-gate__hint">点击对话框 / Enter / Space 推进 · 支持离线</p></div>`;
  host.append(gate);
  const newGame=gate.querySelector('[data-reset-new-game]');
  const loadGame=gate.querySelector('[data-reset-load-game]');
  const install=gate.querySelector('[data-reset-install]');
  const leave=after=>{
    if(gate.classList.contains('is-leaving'))return;
    gate.classList.add('is-leaving');
    setTimeout(()=>{gate.remove();after?.();},220);
  };
  newGame.addEventListener('click',()=>leave(),{once:true});
  loadGame.addEventListener('click',()=>leave(()=>{
    if(archive?.openSlots)archive.openSlots();
    else host.querySelector('[data-reset-control="slots"]')?.click();
  }),{once:true});
  const syncInstall=()=>{install.hidden=!deferredInstallPrompt;};
  install.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;const prompt=deferredInstallPrompt;deferredInstallPrompt=null;syncInstall();await prompt.prompt();try{await prompt.userChoice;}catch{}});
  addEventListener('reset-install-available',syncInstall);syncInstall();
}

export async function registerGamePwa({archive}={}) {
  const status=document.getElementById('status');
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;dispatchEvent(new Event('reset-install-available'));});
  addEventListener('appinstalled',()=>{deferredInstallPrompt=null;dispatchEvent(new Event('reset-install-available'));if(status)status.textContent='已安装，可从桌面直接启动。';});
  ensureTitleGate(archive);
  if(!('serviceWorker' in navigator)){if(status)status.textContent='当前环境不支持离线缓存，可继续在线游玩。';return;}
  try{
    const owner=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
    const show=()=>{if(!status)return;if(owner.waiting&&owner.active)status.textContent='新版本已下载。请先保存进度，关闭所有游戏窗口后重新打开以更新。';else status.textContent=owner.active?.state==='activated'?'已下载，可离线游玩':'正在下载离线资源';};
    const observe=()=>{const worker=owner.installing??owner.waiting??owner.active;worker?.addEventListener('statechange',()=>queueMicrotask(show));show();};
    owner.addEventListener('updatefound',observe);navigator.serviceWorker.addEventListener('controllerchange',show);observe();
    addEventListener('pagehide',()=>{owner.removeEventListener('updatefound',observe);navigator.serviceWorker.removeEventListener('controllerchange',show);},{once:true});
  }catch{if(status)status.textContent='离线资源未能下载，请检查网络后重新打开。已有存档保留。';}
}
