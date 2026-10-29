// Direction is decorative and visit-scoped: it never advances or pauses story.
export const PRESETS={
  focus:{target:'image',duration:620,frames:[{opacity:.88,transform:'scale(1)'},{opacity:1,transform:'scale(1.012)',offset:.7},{opacity:1,transform:'scale(1)'}]},
  shade:{target:'shade',duration:360,frames:[{opacity:0},{opacity:.16,offset:.3},{opacity:0}]},
  memory:{target:'light',duration:420,frames:[{opacity:0},{opacity:.08,offset:.25},{opacity:0}]},
  impact:{target:'background',duration:180,frames:[{transform:'translateX(0)'},{transform:'translateX(-2px)'},{transform:'translateX(2px)'},{transform:'translateX(0)'}]},
  rewrite:{target:'light',duration:380,frames:[{opacity:0},{opacity:.1,offset:.25},{opacity:0}]},
  shutter:{target:'light',duration:160,frames:[{opacity:0},{opacity:.12,offset:.2},{opacity:0}]},
  whiteout:{target:'light',duration:620,frames:[{opacity:0},{opacity:.2,offset:.45},{opacity:0}]},
  release:{target:'warm',duration:600,frames:[{opacity:0},{opacity:.1,offset:.4},{opacity:0}]},
  settle:{target:'image',duration:500,frames:[{opacity:.88},{opacity:1}]}
};
export function createDirectionState(project,sheet){
  const scenes=new Map(project.scenes.map(s=>[s.id,s]));let last,queue;
  return {update(view,{entered=false,blocked=false,imagesReady=true,reduced=false}={}){
    const scene=scenes.get(view.frame.sceneId),stage=view.frame.stage??{};
    const snapshot={visit:view.visit,scene:view.frame.sceneId,chapter:scene?.chapter,background:stage.background,cg:stage.cg};
    const changed=!last||view.visit!==last.visit;
    const mood=sheet.moods[snapshot.scene]??(String(scene?.location??'').startsWith('夜梧城')?'anomaly':'everyday');
    if(changed){
      const ordinary=['start','advance','action','restart'].includes(view.reason);
      queue=ordinary?{visit:view.visit,chapter:(!last||last.chapter!==snapshot.chapter)?snapshot.chapter:undefined,
        transition:!last||last.background!==snapshot.background||last.cg!==snapshot.cg,
        beat:sheet.beats[view.frame.lineId]?.preset}:undefined;
      last=snapshot;
    }
    if(reduced||view.skipping){queue=undefined;return {changed,mood,suppressed:true};}
    if(!entered||blocked||!imagesReady)return {changed,mood,pending:Boolean(queue)};
    const plan=queue;queue=undefined;return {changed,mood,plan};
  }};
}
export function mountDirectionBridge(game,project,sheet){
  const host=game.renderer.element,doc=host.ownerDocument,win=doc.defaultView??globalThis,stage=host.querySelector('.vn-stage');
  const state=createDirectionState(project,sheet),media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const animations=new Map(),layers={};let entered=false,disposed=false;
  host.dataset.direction='r1';
  for(const name of ['vignette','shade','light','warm']){const node=doc.createElement('div');node.className=`reset-direction-${name}`;node.setAttribute('aria-hidden','true');stage.append(node);layers[name]=node;}
  function retire(){for(const [animation,cleanup] of [...animations]){animations.delete(animation);animation.cancel();cleanup?.();}delete host.dataset.directionCue;}
  function animate(node,frames,duration,cleanup){
    if(!node?.animate){cleanup?.();return;}
    const animation=node.animate(frames,{duration,easing:'ease-out',fill:'none'});animations.set(animation,cleanup);
    animation.onfinish=animation.oncancel=()=>{animations.delete(animation);cleanup?.();};
  }
  function chapter(id){
    const info=sheet.chapters.find(c=>c.id===id);if(!info)return;
    const card=doc.createElement('div');card.className='reset-chapter-card reset-direction-chapter';card.dataset.artExtra='chapter-card';card.dataset.chapter=String(id);card.setAttribute('aria-hidden','true');
    const number=doc.createElement('div');number.className='reset-chapter-number';number.textContent=String(id).padStart(2,'0');
    const text=doc.createElement('div'),kicker=doc.createElement('div'),title=doc.createElement('strong'),subtitle=doc.createElement('span');kicker.className='reset-chapter-kicker';kicker.textContent='CHAPTER';title.textContent=info.title;subtitle.textContent=info.subtitle;text.append(kicker,title,subtitle);card.append(number,text);stage.append(card);
    animate(card,[{opacity:0,transform:'translate(-8px,-50%)'},{opacity:1,transform:'translate(0,-50%)',offset:.15},{opacity:1,offset:.8},{opacity:0,transform:'translate(0,-50%)'}],1800,()=>card.remove());
  }
  function ready(frame){
    for(const [kind,selector] of [['background','.vn-background'],['cg','.vn-cg'],['portrait','.vn-portrait']]){
      if(kind==='portrait'&&frame.stage?.cg)continue;const id=frame.stage?.[kind];if(!id)continue;
      const image=host.querySelector(selector);if(!image||image.hidden||!image.complete||!image.naturalWidth||image.dataset.asset!==id)return false;
    }return true;
  }
  function sync(){
    if(disposed)return;const view=session.getView(),reduced=Boolean(view.settings.reducedMotion||media?.matches);
    const blocked=Boolean(view.paused||view.hidden||doc.hidden||host.querySelector('.reset-title-gate'));
    const result=state.update(view,{entered,blocked,imagesReady:ready(view.frame),reduced});
    host.dataset.directionMood=result.mood;host.dataset.directionReduced=String(reduced);
    if(result.changed||result.suppressed)retire();
    for(const animation of animations.keys()){if(blocked&&animation.playState==='running')animation.pause();else if(!blocked&&animation.playState==='paused')animation.play();}
    if(!result.plan)return;
    const plan=result.plan;
    if(plan.transition){const image=host.querySelector(view.frame.stage?.cg?'.vn-cg':'.vn-background');animate(image,[{opacity:.78},{opacity:1}],320);}
    if(plan.chapter)chapter(plan.chapter);
    if(plan.beat){const preset=PRESETS[plan.beat];if(preset){host.dataset.directionCue=plan.beat;
      const node=preset.target==='image'?host.querySelector(view.frame.stage?.cg?'.vn-cg':'.vn-background'):preset.target==='background'?host.querySelector('.vn-background'):layers[preset.target];animate(node,preset.frames,preset.duration);}}
  }
  const session=game.session,unsubscribe=session.subscribe(sync);
  const enter=event=>{if(event.target?.closest?.('[data-reset-enter],[data-reset-load-game]')){entered=true;sync();}};
  host.addEventListener('click',enter,true);host.addEventListener('load',sync,true);doc.addEventListener('visibilitychange',sync);media?.addEventListener?.('change',sync);
  const observer=new win.MutationObserver(sync);observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','src']});sync();
  return {getState(){return {active:animations.size,entered,cue:host.dataset.directionCue,mood:host.dataset.directionMood};},dispose(){if(disposed)return;disposed=true;unsubscribe();observer.disconnect();host.removeEventListener('click',enter,true);host.removeEventListener('load',sync,true);doc.removeEventListener('visibilitychange',sync);media?.removeEventListener?.('change',sync);retire();for(const node of Object.values(layers))node.remove();for(const key of ['direction','directionMood','directionReduced','directionCue'])delete host.dataset[key];}};
}
