const TITLE_VISUAL = './assets/4k/runtime/ui/title-key-visual.webp';

function installShellStyles(doc) {
  if (doc.getElementById('reset-mobile-shell-style')) return;
  const style = doc.createElement('style');
  style.id = 'reset-mobile-shell-style';
  style.textContent = `
.reset-title-screen{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));background:#08131b center/cover no-repeat;overflow:auto;box-sizing:border-box;pointer-events:auto}.reset-title-screen::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#07131dcc 0%,#07131d88 42%,#07131dee 100%);backdrop-filter:blur(2px)}.reset-title-card{position:relative;width:min(520px,92vw);padding:28px;border:1px solid #71928f88;border-radius:18px;background:#0b1b25e8;box-shadow:0 24px 70px #0009;text-align:center}.reset-title-kicker{font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.34em;color:#8bb4ae}.reset-title-card h1{margin:10px 0 4px;font:700 clamp(34px,8vw,68px)/1 system-ui,"Microsoft YaHei",sans-serif;letter-spacing:.12em;color:#f1fbf8}.reset-title-card .reset-title-en{font:500 15px/1.2 system-ui,sans-serif;letter-spacing:.55em;color:#9bc6bf;margin:0 0 18px}.reset-title-card .reset-title-copy{margin:0 0 20px;color:#c3d7d4;font-size:13px;letter-spacing:.08em}.reset-title-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.reset-title-actions button{appearance:none;border:1px solid #587882;border-radius:12px;background:#18303d;color:#edf7f5;min-height:48px;padding:10px 14px;font:600 14px/1.2 system-ui,"Microsoft YaHei",sans-serif;cursor:pointer;touch-action:manipulation}.reset-title-actions button:hover,.reset-title-actions button:focus-visible{background:#285047;border-color:#91c4b7;outline:none}.reset-title-actions [data-title-start]{grid-column:1/-1;background:#315f56;border-color:#8dc0b3;font-size:15px}.reset-title-note{min-height:1.6em;margin:14px 0 0;color:#9db8b6;font-size:12px;line-height:1.5}.vn-engine[data-title-dismissed=true] .reset-brand-mark{display:none!important}
@media(max-width:700px){.reset-title-card{width:min(430px,94vw);padding:22px 18px}.reset-title-actions{grid-template-columns:1fr}.reset-title-actions [data-title-start]{grid-column:auto}.reset-title-card h1{font-size:clamp(38px,14vw,58px)}}
@media(orientation:landscape) and (max-height:620px){main#game{height:100dvh!important;margin:0 auto!important;padding-top:max(4px,env(safe-area-inset-top))!important;padding-bottom:max(4px,env(safe-area-inset-bottom))!important}.vn-engine .vn-toolbar{padding:4px 6px!important;gap:3px!important}.vn-engine .vn-toolbar .reset-toolbar-controls{flex-wrap:nowrap!important;overflow-x:auto!important;padding:0 0 2px!important}.vn-engine .vn-toolbar .reset-toolbar-controls button{min-height:44px!important;min-width:44px!important;padding:4px 7px!important;font-size:10px!important}.vn-engine .vn-reading{max-height:46%!important;padding:7px 14px 9px!important}.vn-engine .vn-text{font-size:14px!important;line-height:1.55!important;margin-bottom:6px!important}.vn-engine .vn-speaker{font-size:11px!important;margin-bottom:3px!important}.vn-engine .vn-actions button{min-height:44px!important;padding:5px 8px!important;font-size:11px!important}.vn-engine .vn-stage .vn-portrait{max-height:90%!important;max-width:48%!important}.vn-engine .vn-status{font-size:9px!important;line-height:11px!important;min-height:11px!important}.reset-title-screen{place-items:center end}.reset-title-card{width:min(430px,46vw);padding:18px 20px}.reset-title-card h1{font-size:42px}.reset-title-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.reset-title-actions [data-title-start]{grid-column:1/-1}.reset-title-actions button{min-height:44px;padding:6px 10px}.reset-title-copy{margin-bottom:12px!important}}
`;
  doc.head.append(style);
}

function findButton(doc, selector, text) {
  const direct = selector ? doc.querySelector(selector) : null;
  if (direct) return direct;
  return [...doc.querySelectorAll('button')].find(button => button.textContent?.trim() === text) ?? null;
}

function createStartupShell(doc, status, requestInstall, isInstalled) {
  const host = doc.querySelector('.vn-engine');
  if (!host || doc.querySelector('.reset-title-screen')) return null;
  installShellStyles(doc);
  const shell = doc.createElement('section');
  shell.className = 'reset-title-screen';
  shell.setAttribute('role','dialog');
  shell.setAttribute('aria-modal','true');
  shell.setAttribute('aria-label','回留标题页');
  shell.style.backgroundImage = `linear-gradient(#08131b33,#08131b33),url("${TITLE_VISUAL}")`;
  shell.innerHTML = `<div class="reset-title-card"><div class="reset-title-kicker">18:42 · 有人记得你</div><h1>回留</h1><div class="reset-title-en">RESET</div><p class="reset-title-copy">梧城 · 雨夜存档点</p><div class="reset-title-actions"><button type="button" data-title-start>开始游戏</button><button type="button" data-title-continue>继续 / 读档</button><button type="button" data-title-settings>设置</button><button type="button" data-title-install>${isInstalled() ? '已安装应用' : '安装应用'}</button></div><p class="reset-title-note" role="status"></p></div>`;
  const note = shell.querySelector('.reset-title-note');
  host.inert = true;
  const close = async () => {
    host.inert = false;
    host.dataset.titleDismissed = 'true';
    shell.remove();
    if (isInstalled() && screen.orientation?.lock) {
      try { await screen.orientation.lock('landscape'); } catch {}
    }
  };
  const startButton=shell.querySelector('[data-title-start]');
  startButton.addEventListener('click', close);
  shell.querySelector('[data-title-continue]').addEventListener('click', async () => {
    await close();
    queueMicrotask(() => findButton(doc,'[data-reset-control="slots"]','存档管理')?.click());
  });
  shell.querySelector('[data-title-settings]').addEventListener('click', async () => {
    await close();
    queueMicrotask(() => findButton(doc,'[data-control="settings"]','设置')?.click());
  });
  shell.querySelector('[data-title-install]').addEventListener('click', async event => {
    const result = await requestInstall();
    if (result === 'installed') event.currentTarget.textContent = '已安装应用';
    else if (result === 'prompted') note.textContent = '安装提示已打开。';
    else note.textContent = '若浏览器未弹出安装框，请用浏览器菜单选择“安装应用”或“添加到主屏幕”。';
  });
  doc.body.append(shell);
  queueMicrotask(()=>startButton.focus());
  return shell;
}

export async function registerGamePwa() {
  const status=document.getElementById('status');
  const doc=document;
  let deferredPrompt=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  const requestInstall=async()=>{
    if(standalone())return 'installed';
    if(!deferredPrompt)return 'unavailable';
    const prompt=deferredPrompt;deferredPrompt=null;await prompt.prompt();
    try{await prompt.userChoice;}catch{}
    return standalone()?'installed':'prompted';
  };
  const shell=createStartupShell(doc,status,requestInstall,standalone);
  const installButton=()=>shell?.querySelector('[data-title-install]');
  const onBeforeInstall=event=>{event.preventDefault();deferredPrompt=event;const button=installButton();if(button&&!standalone())button.textContent='安装应用';};
  const onInstalled=()=>{deferredPrompt=null;const button=installButton();if(button)button.textContent='已安装应用';if(status)status.textContent='应用已安装，可从桌面直接启动。';};
  addEventListener('beforeinstallprompt',onBeforeInstall);
  addEventListener('appinstalled',onInstalled);

  if(!('serviceWorker' in navigator)){
    status.textContent='当前环境不支持离线缓存，可继续在线游玩。';return;
  }
  try{
    const owner=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    const show=()=>{
      if(owner.waiting && owner.active)status.textContent='新版本已下载。请先保存进度，关闭所有游戏窗口后重新打开以更新。';
      else status.textContent=owner.active?.state==='activated'?'已下载，可离线游玩':'正在下载离线资源';
    };
    const observe=()=>{const worker=owner.installing??owner.waiting??owner.active;worker?.addEventListener('statechange',()=>queueMicrotask(show));show();};
    owner.addEventListener('updatefound',observe);navigator.serviceWorker.addEventListener('controllerchange',show);observe();
    addEventListener('pagehide',()=>{owner.removeEventListener('updatefound',observe);navigator.serviceWorker.removeEventListener('controllerchange',show);removeEventListener('beforeinstallprompt',onBeforeInstall);removeEventListener('appinstalled',onInstalled);},{once:true});
  }catch{
    status.textContent='离线资源未能下载，请检查网络后重新打开。已有存档保留。';
  }
}
