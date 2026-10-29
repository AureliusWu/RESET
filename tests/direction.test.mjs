import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
import{createDirectionState}from'../game/runtime/direction.mjs';import{validateDirection}from'../scripts/check-direction.mjs';
const sheet=JSON.parse(await readFile('game/direction/cues.json'));
const project=JSON.parse(await readFile((process.env.RESET_DIST||'dist')+'/project.json'));
const v=(visit=1,sceneId='prologue_1842',lineId='p001',reason='start')=>({visit,reason,ready:false,paused:false,skipping:false,frame:{sceneId,lineId,stage:{background:'classroom-rain'}}});

test('direction waits for title entry and decoded pixels, then consumes one plan without story readiness delay',()=>{
  const state=createDirectionState(project,sheet),view=v();assert.ok(state.update(view).pending);
  assert.ok(state.update(view,{entered:true,imagesReady:false}).pending);
  const result=state.update(view,{entered:true});assert.equal(result.plan.chapter,1);assert.equal(result.plan.transition,true);assert.equal(state.update(view,{entered:true}).plan,undefined);
});
test('authored beats start on line entry during typewriting, never on repeated settings notifications',()=>{
  const state=createDirectionState(project,sheet),view=v(1,'archive_photo','c3f001','advance');
  const result=state.update(view,{entered:true});assert.equal(result.plan.beat,'shutter');assert.equal(view.ready,false);assert.equal(state.update(view,{entered:true}).plan,undefined);
});
test('restore and reread reconcile mood without replaying reveals or chapter cards',()=>{
  const state=createDirectionState(project,sheet);const r=state.update(v(1,'archive_photo','c3f001','restore'),{entered:true});assert.equal(r.mood,'memory');assert.equal(r.plan,undefined);
  assert.equal(state.update(v(2,'archive_photo','c3f001','reread'),{entered:true}).plan,undefined);
});
test('a new visit retires a pending cue before an old image can complete',()=>{
  const state=createDirectionState(project,sheet);state.update(v(1,'archive_photo','c3f001','advance'),{entered:true,imagesReady:false});
  const second=v(2,'future_rule','c3h001','advance');state.update(second,{entered:true,blocked:true});const r=state.update(second,{entered:true});assert.equal(r.plan.beat,undefined);
});
test('reduced motion and skip consume pending effects so toggling back cannot replay them',()=>{
  for(const suppression of [{reduced:true},{}]){const state=createDirectionState(project,sheet),view=v(1,'archive_photo','c3f001','advance');if(!suppression.reduced)view.skipping=true;
    assert.equal(state.update(view,{entered:true,...suppression}).suppressed,true);view.skipping=false;assert.equal(state.update(view,{entered:true}).plan,undefined);}
});
test('chapter cards derive from canonical scenes, and a same-chapter line does not retrigger a transition',()=>{
  const state=createDirectionState(project,sheet),first=v(1,'prologue_1842','p001','start');state.update(first,{entered:true});
  const second=v(2,'prologue_1842','p002','advance');const r=state.update(second,{entered:true});assert.equal(r.plan.chapter,undefined);assert.equal(r.plan.transition,false);
  const next=v(3,'chapter2_teaser','z001','action');assert.equal(state.update(next,{entered:true}).plan.chapter,2);
});
test('source gates reject missing chapters, quiet-line effects, wrong text anchors and intensity drift',()=>{
  assert.doesNotThrow(()=>validateDirection(project,sheet));
  for(const mutate of [s=>s.chapters.pop(),s=>s.beats.c6w001=s.beats.c3f001,s=>s.beats.c3f001.text='different',s=>s.limits.maxFlashOpacity=.8]){const broken=structuredClone(sheet);mutate(broken);assert.throws(()=>validateDirection(project,broken));}
});
