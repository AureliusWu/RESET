import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const {createSlotStore,SLOT_KEY,SLOT_COUNT,ENDINGS,CGS} = await import(pathToFileURL(resolve(process.env.RESET_DIST || 'dist','archive-data.mjs')));
const save = {schema:1,game:'reset',savedAt:'2026-10-25T00:00:00.000Z',state:{schema:1,storyVersion:'reset-v1.0.1',sceneId:'prologue_1842',line:0,decisions:[]}};
const frame = {title:'雨夜存档点',text:'10月17日，18:42。'};
function memory() { const values=new Map([['vn-engine:reset:save:1','legacy-quick-save'],['reset:meta:v1','existing-meta']]);let fail=false;return {values,get fail(){return fail},set fail(value){fail=value},getItem:key=>values.get(key)??null,setItem(key,value){if(fail)throw Error('QuotaExceededError');values.set(key,String(value))}}; }

test('six independent manual slots survive recreation and do not alter legacy quick-save or Meta', () => {
  const storage=memory(), slots=createSlotStore(storage,()=>save.savedAt);
  for(let id=1;id<=SLOT_COUNT;id++)slots.put(id,save,{...frame,title:`路线 ${id}`},null);
  const again=createSlotStore(storage).list();assert.equal(again.length,6);
  for(let id=1;id<=6;id++)assert.equal(again[id-1].title,`路线 ${id}`);
  again[0].save.state.line=9;assert.equal(slots.list()[0].save.state.line,0);
  save.state.line=1;assert.equal(slots.list()[0].save.state.line,0);save.state.line=0;
  assert.equal(storage.getItem('vn-engine:reset:save:1'),'legacy-quick-save');assert.equal(storage.getItem('reset:meta:v1'),'existing-meta');
  const previous=slots.list()[2];slots.put(3,save,{...frame,title:'新的选择'},previous);
  assert.equal(slots.list()[2].title,'新的选择');assert.equal(slots.list()[1].title,'路线 2');
  assert.equal(slots.remove(3,slots.list()[2]),true);assert.equal(slots.list()[2],null);assert.equal(slots.list()[1].title,'路线 2');
});

test('stale overwrite/delete confirmations preserve a slot changed in another window', () => {
  const storage=memory(), a=createSlotStore(storage), b=createSlotStore(storage);
  a.put(1,save,frame,null);const old=a.list()[0];b.put(1,save,{...frame,title:'另一个窗口'},old);
  const raw=storage.getItem(SLOT_KEY);
  assert.throws(()=>a.put(1,save,frame,old),/其他窗口/);assert.throws(()=>a.remove(1,old),/其他窗口/);
  assert.throws(()=>a.put(1,save,frame,null),/其他窗口/);assert.equal(storage.getItem(SLOT_KEY),raw);
});

test('storage quota and malformed data never erase or replace existing bytes', () => {
  const storage=memory(), slots=createSlotStore(storage);slots.put(1,save,frame);const raw=storage.getItem(SLOT_KEY);
  storage.fail=true;assert.throws(()=>slots.put(2,save,frame),/Quota/);assert.throws(()=>slots.remove(1),/Quota/);assert.equal(storage.getItem(SLOT_KEY),raw);
  storage.fail=false;
  for(const broken of ['{broken',JSON.stringify({schema:9,game:'reset',slots:[]}),JSON.stringify({schema:1,game:'reset',slots:[null]})]){
    storage.values.set(SLOT_KEY,broken);assert.throws(()=>slots.list());assert.throws(()=>slots.put(1,save,frame));assert.throws(()=>slots.remove(1));assert.equal(storage.getItem(SLOT_KEY),broken);
  }
});

test('invalid slots, wrong-game envelopes and oversized saves are rejected before writing', () => {
  const storage=memory(), slots=createSlotStore(storage);
  for(const id of [0,7,-1,1.1,'1'])assert.throws(()=>slots.put(id,save,frame));
  assert.throws(()=>slots.put(1,{...save,game:'another-game'},frame));
  assert.throws(()=>slots.put(1,{...save,padding:'x'.repeat(2_000_001)},frame));
  assert.equal(storage.getItem(SLOT_KEY),null);
  assert.equal(new Set(ENDINGS.map(e=>e.id)).size,13);assert.equal(new Set(CGS.map(c=>c.id)).size,5);
});


test('a pending manual load cannot silently switch to a slot replaced in another window', () => {
  const storage=memory(), a=createSlotStore(storage), b=createSlotStore(storage);
  a.put(1,save,frame,null);const pending=a.get(1);b.put(1,save,{...frame,title:'更新的位置'},pending);
  const raw=storage.getItem(SLOT_KEY);assert.throws(()=>a.get(1,pending),/其他窗口/);assert.equal(storage.getItem(SLOT_KEY),raw);
  const current=a.get(1);current.save.state.line=999;assert.notEqual(a.get(1).save.state.line,999);
  b.remove(1,a.get(1));assert.throws(()=>a.get(1),/不存在/);
});
