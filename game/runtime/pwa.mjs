export async function registerGamePwa() {
  const status=document.getElementById('status');
  if(!('serviceWorker' in navigator)){
    status.textContent='当前环境不支持离线缓存，可继续在线游玩。';return;
  }
  try{
    const owner=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
    const show=()=>{
      if(owner.waiting && owner.active)status.textContent='新版本已下载。请先保存进度，关闭所有游戏窗口后重新打开以更新。';
      else status.textContent=owner.active?.state==='activated'?'已下载，可离线游玩':'正在下载离线资源';
    };
    const observe=()=>{const worker=owner.installing??owner.waiting??owner.active;worker?.addEventListener('statechange',()=>queueMicrotask(show));show();};
    owner.addEventListener('updatefound',observe);navigator.serviceWorker.addEventListener('controllerchange',show);observe();
    // Never force a waiting worker over an active story or irreversible section.
    // Closing every client lets the browser activate its atomically cached build.
    addEventListener('pagehide',()=>{owner.removeEventListener('updatefound',observe);navigator.serviceWorker.removeEventListener('controllerchange',show);},{once:true});
  }catch{
    status.textContent='离线资源未能下载，请检查网络后重新打开。已有存档保留。';
  }
}
