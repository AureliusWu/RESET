// Work-level one-shot feedback. Script-line effects stay with the locked engine.
const MIX_GAIN=.5, MAX_VOICES=2, MIN_INTERVAL_MS=80;
const level=settings=>Math.max(0,Math.min(1,Number(settings.volume)||0))*MIX_GAIN;
export function createSfxPlayer({createAudio,sourceFor,settings,allowed,now=()=>performance.now(),onError=()=>{}}) {
  const voices=new Map(),last=new Map();let disposed=false;
  function retire(token) {
    const player=voices.get(token);if(!player)return;
    voices.delete(token);player.onended=player.onerror=null;
    player.pause();player.removeAttribute('src');player.load();
  }
  function stop() { for(const token of [...voices.keys()])retire(token);last.clear(); }
  function play(id) {
    if(disposed)return false;
    const current=settings();
    if(disposed||!current.soundEffects||!level(current)||!allowed())return false;
    const src=sourceFor(id);if(!src)return false;
    const time=now();if(time-(last.get(id)??-Infinity)<MIN_INTERVAL_MS)return false;
    const token={id,time};let player;
    try {
      player=createAudio(src);player.loop=false;player.volume=level(current);
      while(voices.size>=MAX_VOICES)retire(voices.keys().next().value);
      voices.set(token,player);last.set(id,time);
      player.onended=()=>retire(token);
      const failed=()=>{if(!voices.has(token))return;retire(token);onError(id);};
      player.onerror=failed;
      Promise.resolve(player.play()).catch(failed);
      return true;
    } catch { retire(token);return false; }
  }
  return {play,stop,sync(){const current=settings();if(!allowed()||!current.soundEffects||!level(current))stop();else for(const player of voices.values())player.volume=level(current);},
    getState(){return {active:voices.size,ids:[...voices.keys()].map(t=>t.id)};},
    dispose(){if(disposed)return;disposed=true;stop();}};
}
export function mountSfxBridge(game,project) {
  const host=game.renderer.element,doc=host.ownerDocument??document,win=doc.defaultView??globalThis;
  const session=game.session,assets=new Map(project.assets.filter(a=>a.id.startsWith('sfx-')&&a.kind==='audio').map(a=>[a.id,a.src]));
  const allowed=()=>{const v=session.getView();return !doc.hidden&&!v.hidden&&(!v.paused||(v.pauseReasons?.length>0&&v.pauseReasons.every(r=>r==='reset-combat')));};
  const player=createSfxPlayer({
    sourceFor:id=>assets.has(id)?new URL(assets.get(id),doc.baseURI).href:undefined,
    settings:()=>session.getView().settings,allowed,
    createAudio:src=>{const p=doc.createElement('audio');p.preload='auto';p.src=src;return p;}
  });
  let lastVisit=session.getView().visit,pendingLoad;
  function sync() {
    const view=session.getView();
    if(view.visit!==lastVisit){player.stop();pendingLoad=view.reason==='restore'?view.visit:undefined;lastVisit=view.visit;}
    player.sync();
    if(pendingLoad===view.visit&&!view.paused&&!doc.hidden){pendingLoad=undefined;player.play('sfx-load');}
  }
  const stop=()=>player.stop(),unsubscribe=session.subscribe(sync);
  win.addEventListener('blur',stop);doc.addEventListener('visibilitychange',stop);sync();
  return {play:player.play,stop:player.stop,getState:player.getState,dispose(){pendingLoad=undefined;unsubscribe();win.removeEventListener('blur',stop);doc.removeEventListener('visibilitychange',stop);player.dispose();}};
}
