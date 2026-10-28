// Work-level stage polish; story identity and the independent engine stay intact.
export function mountExperienceBridge(game, project) {
  const host=game.renderer.element, session=game.session;
  const doc=host.ownerDocument, view=doc.defaultView;
  const scenes=new Map(project.scenes.map(scene=>[scene.id,scene]));
  const animations=new Set();let disposed=false, previous, observedVisit;
  function cancelAnimations() { for(const animation of animations)animation.cancel();animations.clear(); }
  function animate(selector, frames, duration) {
    const element=host.querySelector(selector);if(!element?.animate)return;
    const animation=element.animate(frames,{duration,easing:'ease-out'});animations.add(animation);
    animation.onfinish=animation.oncancel=()=>animations.delete(animation);
  }
  const visible = node => Boolean(node && !node.hidden && !node.disabled && node.getClientRects().length);
  function advanceDialogue() {
    if(disposed || host.querySelector('.reset-title-gate') || session.getView().paused)return false;
    const choice=[...host.querySelectorAll('.vn-actions [data-action]')].find(visible);
    if(choice)return false;
    const next=host.querySelector('[data-control="next"]');
    if(!next || next.disabled)return false;
    next.click();return true;
  }
  function clickReading(event) {
    if(event.defaultPrevented || event.button>0)return;
    const target=event.target;
    if(target instanceof view.Element && target.closest('button,a,input,textarea,select,label,[contenteditable="true"],[role="button"]'))return;
    advanceDialogue();
  }
  function keyAdvance(event) {
    if(event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)return;
    if(event.key!=='Enter' && event.key!==' ' && event.code!=='Space')return;
    const target=event.target;
    if(target instanceof view.Element && target.closest('button,a,input,textarea,select,[contenteditable="true"],[role="button"]'))return;
    if(advanceDialogue()){event.preventDefault();event.stopPropagation();}
  }
  function sync() {
    if(disposed)return;
    const current=session.getView(), frame=current.frame, scene=scenes.get(frame.sceneId);
    const next={visit:current.visit,scene:frame.sceneId,portrait:frame.stage?.portrait,cg:frame.stage?.cg,background:frame.stage?.background};
    // A restore can enter a new visit while an archive/settings panel is still
    // paused. Retire effects from the old visit now, and retain the new visuals
    // until the panel closes and the typewriter is ready.
    if(observedVisit!==current.visit){cancelAnimations();observedVisit=current.visit;}
    if(['death-fifth','death-sixth'].includes(frame.ending)){const retry=host.querySelector('.vn-actions [data-action="@continue"]');if(retry)retry.textContent='重新尝试';}
    host.dataset.world=String(scene?.location??'').startsWith('夜梧城')?'anomaly':'normal';
    host.dataset.reducedMotion=String(current.settings.reducedMotion);
    host.dataset.dialogAdvance=String(Boolean(host.querySelector('[data-control="next"]')) && !current.paused);
    if(current.settings.reducedMotion)cancelAnimations();
    else {
      for(const animation of animations){
        if(current.paused && animation.playState==='running')animation.pause();
        else if(!current.paused && animation.playState==='paused')animation.play();
      }
    }
    if(!current.settings.reducedMotion && previous && current.ready && !current.paused){
      // Portraits are intentionally stable between dialogue lines. Sliding a
      // newly rendered expression by a few pixels made every advance look like
      // the sprite jumped, especially on mobile. Background/CG transitions stay.
      if(previous.background!==next.background)animate('.vn-background',[{opacity:.8},{opacity:1}],240);
      if(previous.cg!==next.cg && next.cg)animate('.vn-cg',[{opacity:.65},{opacity:1}],260);
      if(previous.visit!==next.visit && current.reason==='restore')animate('.vn-reading',[{boxShadow:'inset 0 2px #9accc5'},{boxShadow:'inset 0 2px transparent'}],340);
    }
    // Don't consume a visual change during a typewriter's incomplete first frame.
    if((current.ready && !current.paused) || !previous)previous=next;
  }
  const unsubscribe=session.subscribe(sync);
  host.querySelector('.vn-reading')?.addEventListener('click',clickReading);
  doc.addEventListener('keydown',keyAdvance,true);
  sync();
  return{dispose(){
    disposed=true;unsubscribe();cancelAnimations();
    host.querySelector('.vn-reading')?.removeEventListener('click',clickReading);
    doc.removeEventListener('keydown',keyAdvance,true);
    delete host.dataset.world;delete host.dataset.reducedMotion;delete host.dataset.dialogAdvance;
  }};
}
