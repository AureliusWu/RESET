import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createSfxPlayer,mountSfxBridge} from '../game/runtime/sfx.mjs';
import {renderSfxCue,inspectSfx,sfxViolations,validateSfx} from '../scripts/sfx-design.mjs';
const dist=resolve(process.env.RESET_DIST||'dist');
const config=JSON.parse(await readFile('game/sfx/cues.json'));
const metadata=JSON.parse(await readFile(resolve(dist,'sfx-manifest.json')));
function audioHarness(){
  let time=0,enabled=true,settings={volume:.6,soundEffects:true};const created=[];
  const createAudio=src=>{const player={src,volume:0,loop:true,paused:false,loaded:0,play(){return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){delete this.src;},load(){this.loaded++;}};created.push(player);return player;};
  const p=createSfxPlayer({createAudio,sourceFor:id=>id.startsWith('sfx-')?id+'.wav':undefined,settings:()=>settings,allowed:()=>enabled,now:()=>time});
  return {p,created,createAudio,tick:n=>time+=n,setSettings:s=>settings={...settings,...s},setAllowed:v=>enabled=v};
}

test('seven packaged one-shots reproduce exactly, start promptly and finish at zero',async()=>{
  for(const cue of config.cues){const rendered=renderSfxCue(cue,config).bytes,bytes=await readFile(resolve(dist,metadata.effects.find(e=>e.id===cue.id).src));assert.ok(bytes.equals(rendered),cue.id);assert.deepEqual(sfxViolations(inspectSfx(bytes)),[],cue.id);assert.equal(bytes.readInt16LE(44),0);assert.equal(bytes.readInt16LE(bytes.length-2),0);}
});

test('SFX gates reject internal clicks, a cut tail, silence and slow feedback',async()=>{
  const src=await readFile(resolve(dist,metadata.effects.find(e=>e.id==='sfx-impact').src));
  const click=Buffer.from(src);click.writeInt16LE(20000,44+640*4);click.writeInt16LE(-20000,44+641*4);assert.ok(sfxViolations(inspectSfx(click)).includes('sample discontinuity'));
  const cut=Buffer.from(src);cut.writeInt16LE(10000,cut.length-4);assert.ok(sfxViolations(inspectSfx(cut)).includes('unclean one-shot boundary'));
  const silent=Buffer.from(src);silent.fill(0,44);assert.ok(sfxViolations(inspectSfx(silent)).includes('invalid/silent signal'));
  const delayed={...inspectSfx(src),onsetMs:45,peakMs:150};assert.ok(sfxViolations(delayed).includes('late feedback'));
});

test('invalid SFX design and runtime budgets fail closed',()=>{
  assert.doesNotThrow(()=>validateSfx(config));
  for(const mutate of [c=>c.cues[0].attack=0,c=>c.cues[0].duration=Infinity,c=>c.cues[1].id=c.cues[0].id,c=>c.runtime.maxVoices=100,c=>c.cues[0].pitch=-1]){const c=structuredClone(config);mutate(c);assert.throws(()=>validateSfx(c));}
});

test('one-shot player limits repeated events and steals only the oldest of two voices',()=>{
  const h=audioHarness();assert.equal(h.p.play('sfx-impact'),true);assert.equal(h.created[0].loop,false);assert.equal(h.created[0].volume,.3);
  assert.equal(h.p.play('sfx-impact'),false);h.tick(80);assert.equal(h.p.play('sfx-impact'),true);assert.equal(h.p.play('sfx-dodge'),true);
  assert.equal(h.p.getState().active,2);assert.equal(h.created[0].paused,true);assert.equal(h.created[0].src,undefined);h.p.dispose();assert.equal(h.p.getState().active,0);
});

test('mute, zero volume, background and disposal cannot leave active feedback',()=>{
  const h=audioHarness();h.p.play('sfx-impact');h.setSettings({soundEffects:false});h.p.sync();assert.equal(h.p.getState().active,0);assert.equal(h.p.play('sfx-dodge'),false);
  h.setSettings({soundEffects:true,volume:0});assert.equal(h.p.play('sfx-impact'),false);
  h.setSettings({volume:.8});h.setAllowed(false);assert.equal(h.p.play('sfx-impact'),false);h.setAllowed(true);assert.equal(h.p.play('sfx-impact'),true);
  h.setSettings({volume:.2});h.p.sync();assert.equal(h.created.at(-1).volume,.1);h.setAllowed(false);h.p.sync();assert.equal(h.p.getState().active,0);h.p.dispose();assert.equal(h.p.play('sfx-impact'),false);
});

test('a rejected stale play promise cannot retire a newer voice or affect gameplay',async()=>{
  const h=audioHarness();let reject;h.createAudio('unused');
  const created=[];const p=createSfxPlayer({sourceFor:id=>id,settings:()=>({volume:1,soundEffects:true}),allowed:()=>true,now:()=>100,
    createAudio:src=>{const a=h.createAudio(src);a.play=()=>new Promise((_,r)=>{reject=r;});created.push(a);return a;}});
  assert.equal(p.play('sfx-impact'),true);const rejectOld=reject;p.stop();assert.equal(p.play('sfx-impact'),true);rejectOld(Error('obsolete'));await Promise.resolve();await Promise.resolve();assert.equal(p.getState().active,1);reject(Error('current failure'));await Promise.resolve();await Promise.resolve();assert.equal(p.getState().active,0);p.dispose();
});

test('successful restore feedback waits for its panel and fires once; scene changes cancel it',()=>{
  const h=audioHarness(),handlers=new Map(),eventHost={addEventListener(t,f){handlers.set(t,f);},removeEventListener(t){handlers.delete(t);}};
  const doc={...eventHost,defaultView:eventHost,baseURI:'https://reset.test/play/',hidden:false,createElement:()=>h.createAudio('test')};
  const listeners=new Set(),v={visit:1,reason:'start',paused:false,pauseReasons:[],settings:{volume:1,soundEffects:true}};
  const session={getView:()=>v,subscribe:f=>{listeners.add(f);return()=>listeners.delete(f);}};
  const sync=()=>{for(const fn of listeners)fn();};
  const bridge=mountSfxBridge({session,renderer:{element:{ownerDocument:doc}}},{assets:[{id:'sfx-load',kind:'audio',src:'load.wav'}]});
  assert.equal(h.created.length,0);Object.assign(v,{visit:2,reason:'restore',paused:true,pauseReasons:['panel']});sync();assert.equal(h.created.length,0);
  Object.assign(v,{paused:false,pauseReasons:[]});sync();sync();assert.equal(h.created.length,1);
  Object.assign(v,{visit:3,reason:'restore',paused:true,pauseReasons:['panel']});sync();Object.assign(v,{visit:4,reason:'advance',paused:false,pauseReasons:[]});sync();assert.equal(h.created.length,1);
  bridge.dispose();assert.equal(listeners.size,0);assert.equal(handlers.size,0);
});

test('combat-only narrative pause permits feedback; an additional pause blocks it',()=>{
  const h=audioHarness(),eventHost={addEventListener(){},removeEventListener(){}};
  const doc={...eventHost,defaultView:eventHost,baseURI:'https://reset.test/',hidden:false,createElement:()=>h.createAudio('test')};
  const v={visit:1,reason:'start',paused:true,pauseReasons:['reset-combat'],settings:{volume:1,soundEffects:true}};
  const session={getView:()=>v,subscribe:()=>()=>{}};
  const bridge=mountSfxBridge({session,renderer:{element:{ownerDocument:doc}}},{assets:[{id:'sfx-impact',kind:'audio',src:'impact.wav'}]});
  assert.equal(bridge.play('sfx-impact'),true);bridge.stop();v.pauseReasons.push('native-host');assert.equal(bridge.play('sfx-impact'),false);bridge.dispose();
});
