const META_KEY = 'reset:meta:v1';
const IRREVERSIBLE = new Set(['c6_no_save','c6_walk_forward','c6_escape','c6_echo_goodbye','c6_last_door','c7_morning','c7_after','c7_linwan','c7_credits']);
function readMeta(){try{const v=JSON.parse(localStorage.getItem(META_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return{}}}
function writeMeta(v){try{localStorage.setItem(META_KEY,JSON.stringify(v))}catch{}}
export function mountMetaBridge(game){
  const session=game.session, meta=readMeta();
  meta.loads=Number(meta.loads)||0; meta.endings=Array.isArray(meta.endings)?meta.endings:[];
  let disposed=false,lastVisit=-1,lastEnding='';
  const locked=()=>IRREVERSIBLE.has(session.getView().frame.sceneId);
  const finished=()=>{const v=session.getView();return v.ready&&v.frame.ending==='true-end'};
  const message='这一段时间不可逆，无法保存或回退。';
  const originals=new Map();
  // Guard the work's session boundary, including settings backups and history.
  for(const name of ['save','restore','restart','reread']){
    const original=session[name], own=Object.getOwnPropertyDescriptor(session,name);
    const guarded=function(...args){
      if(locked()&&!(name==='restart'&&finished())){
        const status=document.querySelector('.vn-status');if(status)status.textContent=message;
        if(name==='save'||name==='restore')throw new Error(message);
        return false;
      }
      // This patch changes no story nodes or choices. Upgrade only the exact
      // published predecessor; the engine still validates and replays the save.
      if(name==='restore'&&args[0]?.schema===1&&args[0]?.game==='reset'&&args[0]?.state?.storyVersion==='reset-v1.0.0'){
        args[0]={...args[0],state:{...args[0].state,storyVersion:'reset-v1.0.1'}};
      }
      return original.apply(session,args);
    };
    originals.set(name,{own,guarded});session[name]=guarded;
  }
  const style=document.createElement('style');
  style.textContent='.vn-engine[data-irreversible="true"] .vn-backup{display:none}.vn-engine[data-irreversible="true"] .vn-record{cursor:default}';
  document.head.appendChild(style);
  function sync(){
    if(disposed)return;
    const view=session.getView(), frame=view.frame;
    if(view.visit!==lastVisit){
      lastVisit=view.visit;
      if(view.reason==='restore'){meta.loads++;writeMeta(meta)}
    }
    if(view.ready&&frame.ending&&frame.ending!==lastEnding){
      lastEnding=frame.ending;
      if(!meta.endings.includes(frame.ending)){meta.endings.push(frame.ending);writeMeta(meta)}
      if(frame.ending==='true-end'){meta.trueEnd=true;writeMeta(meta)}
    }
    const irreversible=locked();
    const host=document.querySelector('.vn-engine');
    if(host)host.dataset.irreversible=String(irreversible);
    for(const id of ['save','load','restart']){
      const button=document.querySelector(`.vn-toolbar [data-control="${id}"]`);
      const blocked=irreversible&&!(id==='restart'&&finished());
      if(button){button.disabled=blocked||view.paused;button.hidden=blocked;button.setAttribute('aria-hidden',String(blocked));}
    }
    if(irreversible){
      const status=document.querySelector('.vn-status');
      if(status&&!status.textContent)status.textContent='这一段时间不会再被保存。历史记录仍可阅读，无法回退。';
    }
    document.title=meta.trueEnd?'回留 · 明天见':meta.loads>0?`回留 · 读取 ${meta.loads}`:'回留 / RESET';
  }
  const unsubscribe=session.subscribe(sync);sync();
  return{meta,dispose(){
    disposed=true;unsubscribe();style.remove();
    for(const [name,{own,guarded}] of originals)if(session[name]===guarded){if(own)Object.defineProperty(session,name,own);else delete session[name]}
  }};
}
