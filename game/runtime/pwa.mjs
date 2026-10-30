let deferredInstallPrompt=null;

function ensureTitleGate(archive){
  const host=document.querySelector?.('.vn-engine');
  if(!host||host.querySelector('.reset-title-gate'))return;
  if(!host.querySelector('.reset-r7-style')){
    const style=document.createElement('style');
    style.className='reset-r7-style';
    style.textContent=`
      .vn-engine[data-dialog-advance="true"] .vn-reading{cursor:pointer}
      .vn-engine .vn-actions:has(> [data-control="next"]:only-child){position:absolute!important;width:1px!important;height:1px!important;margin:0!important;padding:0!important;overflow:visible!important}
      .vn-engine .vn-stage .vn-portrait{z-index:4!important;animation:none!important;transition:none!important}
      .vn-engine .vn-stage .reset-story-prop{z-index:2!important}
      .vn-engine .vn-stage .reset-story-prop-map{left:clamp(12px,3vw,44px)!important;right:auto!important;width:min(36%,460px)!important;top:clamp(60px,9vh,96px)!important}
      .vn-engine .vn-stage .reset-story-prop-phone{left:clamp(12px,3vw,44px)!important;right:auto!important;width:min(24%,300px)!important}
      .reset-title-gate [data-reset-new-game]{font-weight:700}
      .reset-title-gate [data-reset-load-game]{background:rgba(18,42,53,.88);border-color:#547684}
      @media (pointer:coarse),(max-width:700px){
        .vn-engine .vn-toolbar .reset-toolbar-controls button,.vn-engine .vn-actions button,.vn-engine .reset-panel button,.vn-engine .vn-panel button,.vn-engine .reset-title-gate button{min-height:44px!important;touch-action:manipulation}
        .vn-engine .vn-stage .reset-story-prop-map{left:10px!important;right:auto!important;top:64px!important;width:min(38%,260px)!important;max-height:28%!important}
        .vn-engine .vn-stage .reset-story-prop-phone{left:10px!important;right:auto!important;width:min(30%,210px)!important;max-height:32%!important}
      }
      .vn-engine .vn-actions [data-control="next"]{position:absolute!important;left:0!important;top:0!important;width:1px!important;height:1px!important;min-width:1px!important;min-height:1px!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;overflow:hidden!important;color:transparent!important}
    `;
    host.append(style);
  }
  const gate=document.createElement('section');
  gate.className='reset-title-gate';
  gate.setAttribute('role','dialog');
  gate.setAttribute('aria-modal','true');
  gate.setAttribute('aria-label','回留标题页');
  gate.innerHTML=`<div class="reset-title-gate__shade"></div><div class="reset-title-gate__content"><div class="reset-title-gate__kicker">18:42 · 有人记得你</div><h1>回留</h1><div class="reset-title-gate__en">RESET</div><div class="reset-title-gate__actions"><button type="button" data-reset-enter data-reset-new-game>新游戏</button><button type="button" data-reset-load-game>读取存档</button><button type="button" data-reset-install hidden>安装到设备</button></div><p class="reset-title-gate__hint">点击对话框 / Enter / Space 推进 · 支持离线</p></div>`;
  host.append(gate);
  // Keep keyboard and assistive-technology navigation on the actual title
  // actions, rather than letting it reach the story and toolbar underneath.
  const obscured=[...host.children].filter(node=>node!==gate&&node.tagName!=='STYLE').map(node=>({node,inert:node.inert}));
  for(const {node} of obscured)node.inert=true;
  const newGame=gate.querySelector('[data-reset-new-game]');
  const loadGame=gate.querySelector('[data-reset-load-game]');
  const install=gate.querySelector('[data-reset-install]');
  const keyboard=event=>{
    if(!gate.isConnected||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='Tab'){
      const buttons=[...gate.querySelectorAll('button')].filter(node=>!node.hidden&&!node.disabled&&node.getClientRects().length);
      const current=buttons.indexOf(document.activeElement),next=(current+(event.shiftKey?-1:1)+buttons.length)%buttons.length;
      event.preventDefault();event.stopImmediatePropagation();buttons[next]?.focus();
    }else if(!gate.contains(event.target)){
      event.preventDefault();event.stopImmediatePropagation();newGame.focus({preventScroll:true});
    }else event.stopPropagation();
  };
  document.addEventListener('keydown',keyboard,true);
  newGame.focus({preventScroll:true});
  const release=()=>{
    document.removeEventListener('keydown',keyboard,true);
    removeEventListener('reset-install-available',syncInstall);
    for(const {node,inert} of obscured)node.inert=inert;
  };
  const leave=after=>{
    if(gate.classList.contains('is-leaving'))return;
    gate.classList.add('is-leaving');
    setTimeout(()=>{
      gate.remove();release();
      const reading=host.querySelector('.vn-reading');
      if(reading){if(!reading.hasAttribute('tabindex'))reading.tabIndex=0;reading.focus({preventScroll:true});}
      after?.();
    },220);
  };
  newGame.addEventListener('click',()=>leave(),{once:true});
  loadGame.addEventListener('click',()=>leave(()=>{
    if(archive?.openSlots)archive.openSlots();
    else host.querySelector('[data-reset-control="slots"]')?.click();
  }),{once:true});
  const syncInstall=()=>{install.hidden=!deferredInstallPrompt;};
  install.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;const prompt=deferredInstallPrompt;deferredInstallPrompt=null;syncInstall();await prompt.prompt();try{await prompt.userChoice;}catch{}});
  addEventListener('reset-install-available',syncInstall);syncInstall();
  addEventListener('pagehide',event=>{if(!event.persisted)release();},{once:true});
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
