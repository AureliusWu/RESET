// Work-level stage polish; story identity and the independent engine stay intact.
export function mountExperienceBridge(game, project) {
  const host=game.renderer.element, session=game.session;
  const scenes=new Map(project.scenes.map(scene=>[scene.id,scene]));
  const animations=new Set();let disposed=false, previous;
  function animate(selector, frames, duration) {
    const element=host.querySelector(selector);if(!element?.animate)return;
    const animation=element.animate(frames,{duration,easing:'ease-out'});animations.add(animation);
    animation.onfinish=()=>animations.delete(animation);
  }
  function sync() {
    if(disposed)return;
    const view=session.getView(), frame=view.frame, scene=scenes.get(frame.sceneId);
    const next={visit:view.visit,scene:frame.sceneId,portrait:frame.stage?.portrait,cg:frame.stage?.cg,background:frame.stage?.background};
    if(['death-fifth','death-sixth'].includes(frame.ending)){const retry=host.querySelector('.vn-actions [data-action="@continue"]');if(retry)retry.textContent='重新尝试';}
    host.dataset.world=String(scene?.location??'').startsWith('夜梧城')?'anomaly':'normal';
    host.dataset.reducedMotion=String(view.settings.reducedMotion);
    if(view.settings.reducedMotion){for(const animation of animations)animation.cancel();animations.clear();}
    else if(previous && view.ready && !view.paused){
      if(previous.portrait!==next.portrait && next.portrait)animate('.vn-portrait',[{opacity:.65,translate:'6px 0'},{opacity:1,translate:'0 0'}],180);
      if(previous.background!==next.background)animate('.vn-background',[{opacity:.8},{opacity:1}],240);
      if(previous.cg!==next.cg && next.cg)animate('.vn-cg',[{opacity:.65},{opacity:1}],260);
      if(previous.visit!==next.visit && view.reason==='restore')animate('.vn-reading',[{boxShadow:'inset 0 2px #9accc5'},{boxShadow:'inset 0 2px transparent'}],340);
    }
    // Don't consume a visual change during a typewriter's incomplete first frame.
    if(view.ready || !previous)previous=next;
  }
  const unsubscribe=session.subscribe(sync);sync();
  return{dispose(){disposed=true;unsubscribe();for(const animation of animations)animation.cancel();animations.clear();delete host.dataset.world;delete host.dataset.reducedMotion;}};
}
