import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {mountExperienceBridge}=await import(pathToFileURL(resolve(process.env.RESET_DIST||'dist','experience.mjs')));

function harness() {
  const animations=[], subscribers=new Set(), retry={textContent:'继续'};
  const host={dataset:{},querySelector(selector){
    if(selector.includes('@continue'))return retry;
    return {animate(frames,options){
      const animation={selector,frames,options,playState:'running',pause(){this.playState='paused';},play(){this.playState='running';},cancel(){this.playState='idle';this.oncancel?.();}};
      animations.push(animation);return animation;
    }};
  }};
  let view={visit:1,reason:'start',ready:true,paused:false,settings:{reducedMotion:false},frame:{sceneId:'opening',stage:{portrait:'neutral',background:'classroom'}}};
  const session={getView:()=>view,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);}};
  const bridge=mountExperienceBridge({renderer:{element:host},session},{scenes:[{id:'opening',location:'梧城高中'},{id:'night',location:'夜梧城 · 江边'}]});
  const update=patch=>{view={...view,...patch};for(const fn of [...subscribers])fn();};
  return {animations,host,retry,bridge,update,get view(){return view;},get subscribers(){return subscribers.size;}};
}

test('a restored visual change waits through panel pause and typewriting, then plays once',()=>{
  const h=harness();
  const frame={sceneId:'night',stage:{portrait:'serious',background:'river',cg:'letter'}};
  h.update({visit:2,reason:'restore',ready:false,paused:true,frame});
  assert.equal(h.host.dataset.world,'anomaly');assert.equal(h.animations.length,0);
  h.update({paused:false});assert.equal(h.animations.length,0);
  h.update({ready:true});assert.equal(h.animations.length,4);
  assert.deepEqual(h.animations.map(a=>a.selector).sort(),['.vn-background','.vn-cg','.vn-portrait','.vn-reading']);
  h.update({settings:{reducedMotion:false,volume:.4}});assert.equal(h.animations.length,4);
  h.bridge.dispose();
});

test('opening a panel or pausing the host freezes work-level stage animations and resumes them',()=>{
  const h=harness();h.update({visit:2,frame:{sceneId:'opening',stage:{portrait:'smile',background:'classroom'}}});
  assert.equal(h.animations.length,1);const animation=h.animations[0];
  h.update({paused:true});assert.equal(animation.playState,'paused');
  h.update({paused:false});assert.equal(animation.playState,'running');assert.equal(h.animations.length,1);h.bridge.dispose();
});

test('leaving a visit cancels its animation before a delayed or paused replacement becomes ready',()=>{
  const h=harness();h.update({visit:2,frame:{sceneId:'opening',stage:{portrait:'smile',background:'classroom'}}});
  const old=h.animations[0];h.update({visit:3,ready:false,paused:true,frame:{sceneId:'night',stage:{portrait:'serious',background:'river'}}});
  assert.equal(old.playState,'idle');assert.equal(h.animations.length,1);
  h.update({ready:true,paused:false});assert.equal(h.animations.length,3);h.bridge.dispose();
});

test('reduced motion and disposal cancel effects without consuming story state or keeping subscriptions',()=>{
  const h=harness();h.update({visit:2,frame:{sceneId:'opening',stage:{portrait:'smile',background:'classroom'}}});
  h.update({settings:{reducedMotion:true}});assert.equal(h.animations[0].playState,'idle');
  h.update({visit:3,frame:{sceneId:'night',stage:{portrait:'serious',background:'river',cg:'letter'}}});assert.equal(h.animations.length,1);
  const before=structuredClone(h.view);h.bridge.dispose();assert.equal(h.subscribers,0);assert.deepEqual(h.view,before);assert.deepEqual(h.host.dataset,{});
  h.bridge.dispose();assert.equal(h.subscribers,0);
});

test('actual combat retry labels remain readable while paused without changing action identity',()=>{
  const h=harness();h.update({paused:true,frame:{...h.view.frame,ending:'death-fifth'}});assert.equal(h.retry.textContent,'重新尝试');h.bridge.dispose();
});
