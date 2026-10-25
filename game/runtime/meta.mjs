const META_KEY = 'reset:meta:v1';
const IRREVERSIBLE = new Set(['c6_no_save','c6_walk_forward','c6_escape','c6_echo_goodbye','c6_last_door','c7_morning','c7_after','c7_linwan','c7_credits']);
function readMeta(){try{const v=JSON.parse(localStorage.getItem(META_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return{}}}
function writeMeta(v){try{localStorage.setItem(META_KEY,JSON.stringify(v))}catch{}}
export function mountMetaBridge(game){
  const session=game.session, meta=readMeta();
  meta.loads=Number(meta.loads)||0; meta.endings=Array.isArray(meta.endings)?meta.endings:[];
  let disposed=false,lastVisit=-1,lastEnding='';
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
    const locked=IRREVERSIBLE.has(frame.sceneId);
    const host=document.querySelector('.vn-engine');
    if(host)host.dataset.irreversible=String(locked);
    for(const id of ['save','load','restart']){
      const button=document.querySelector(`.vn-toolbar [data-control="${id}"]`);
      if(button){button.disabled=locked;button.hidden=locked;button.setAttribute('aria-hidden',String(locked));}
    }
    if(locked){
      const status=document.querySelector('.vn-status');
      if(status&&!status.textContent)status.textContent='这一段时间不会再被保存。';
    }
    document.title=meta.trueEnd?'回留 · 明天见':meta.loads>0?`回留 · 读取 ${meta.loads}`:'回留 / RESET';
  }
  const unsubscribe=session.subscribe(sync);sync();
  return{meta,dispose(){disposed=true;unsubscribe();}};
}
