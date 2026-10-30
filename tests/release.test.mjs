import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const dist = resolve(process.env.RESET_DIST || 'dist');
const { createProject } = await import(pathToFileURL(resolve(dist, 'lib/index.js')));
const { mountMetaBridge } = await import(pathToFileURL(resolve(dist, 'meta.mjs')));
const project = JSON.parse(await readFile(resolve(dist, 'project.json'), 'utf8'));
class Clock {
  time = 0; serial = 0; pending = new Map();
  now = () => this.time;
  set = (callback, delay) => { const id = ++this.serial; this.pending.set(id, { at: this.time + delay, callback }); return id; };
  clear = id => this.pending.delete(id);
  tick(ms) {
    const end = this.time + ms;
    for (let budget = 10000; budget > 0; budget--) {
      const item = [...this.pending].sort((a,b) => a[1].at-b[1].at)[0];
      if (!item || item[1].at > end) { this.time = end; return; }
      this.time = item[1].at; this.pending.delete(item[0]); item[1].callback();
    }
    throw Error('Timer did not settle');
  }
}
function instance() {
  const clock = new Clock();
  const { session } = createProject(project, 'https://reset.test/', { clock, settings: { textDelayMs: 0, reducedMotion: true } });
  return { session, clock };
}
function discover() {
  const first = instance().session, queue = [first.save()], visited = new Set(), witnesses = new Map(), endings = new Map(); first.dispose();
  while (queue.length) {
    const session = instance().session; session.restore(queue.shift());
    for (let budget = 2000; budget > 0; budget--) {
      const f = session.getView().frame, key = f.sceneId + '/' + f.line;
      if (visited.has(key)) break;
      visited.add(key); if (!witnesses.has(f.sceneId)) witnesses.set(f.sceneId, session.save());
      if (f.ending) endings.set(f.ending, session.save());
      if (f.actions.length) {
        for (const a of f.actions) { const branch = instance().session; branch.restore(session.save()); assert.equal(branch.act(a.id), true); queue.push(branch.save()); branch.dispose(); }
        break;
      }
      if (!session.next()) { assert.ok(f.ending || !f.canAdvance, 'Unmarked dead end ' + f.sceneId); break; }
    }
    session.dispose();
  }
  return { witnesses, endings };
}
const { witnesses, endings } = discover();
const expected = ['normal-linwan','normal-xiaoman','normal-xuqi','normal-tinglan','normal-tangli','normal-nanxing','bad-home','bad-station','death-fifth','death-sixth','bad-no-checkpoint','bad-permanent-save','true-end'];

test('every release ending is reached through canonical choices and survives save replay', () => {
  for (const id of expected) {
    const save = endings.get(id); assert.ok(save, 'Unreachable ending: ' + id);
    const s = instance().session; s.restore(save); assert.equal(s.getView().frame.ending, id); s.dispose();
  }
  const unreachable = project.scenes.filter(s => !witnesses.has(s.id)).map(s => s.id).sort();
  assert.deepEqual(unreachable, ['focus_linwan_open','focus_xiaoman_open','focus_xuqi_open']);
  assert.equal(witnesses.size, 79);
});

test('all shipped bytes match the build manifest', async () => {
  const manifest = JSON.parse(await readFile(resolve(dist, 'build-manifest.json'), 'utf8'));
  assert.equal(manifest.version, 'reset-v1.3.1'); assert.equal(project.version, manifest.version);
  for (const f of manifest.files) { const data = await readFile(resolve(dist,f.name)); assert.equal(data.length,f.size,f.name); assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256,f.name); }
});

function withMeta(run) {
  const previous = { document: globalThis.document, localStorage: globalThis.localStorage };
  const values = new Map(), controls = Object.fromEntries(['save','load','restart'].map(id => [id,{disabled:false,hidden:false,setAttribute(){}}]));
  const host = { dataset:{} }, status = {textContent:''};
  globalThis.localStorage = { getItem:k=>values.get(k)??null, setItem:(k,v)=>values.set(k,String(v)) };
  globalThis.document = { title:'', createElement:()=>({textContent:'',remove(){}}), head:{appendChild(){}}, querySelector:selector=>selector==='.vn-engine'?host:selector==='.vn-status'?status:controls[/data-control="(.*?)"/.exec(selector)?.[1]]??null };
  try { run({values,controls,host,status}); }
  finally { globalThis.document=previous.document; globalThis.localStorage=previous.localStorage; }
}

test('Meta counts one restore per visit, retains endings and respects paused controls', () => withMeta(({controls,values}) => {
  const s=instance().session, bridge=mountMetaBridge({session:s}), save=s.save();
  s.restore(save); s.configure({volume:.4}); s.pause('panel',true);
  assert.equal(bridge.meta.loads,1); assert.equal(controls.save.disabled,true,'pause must keep save disabled');
  s.pause('panel',false); assert.equal(controls.save.disabled,false);
  s.restore(endings.get('normal-linwan')); s.next(); assert.ok(bridge.meta.endings.includes('normal-linwan'));
  const loads=bridge.meta.loads; s.restart(); assert.equal(bridge.meta.loads,loads); assert.ok(JSON.parse(values.get('reset:meta:v1')).endings.includes('normal-linwan'));
  bridge.dispose(); s.dispose();
}));

test('published and development predecessor saves upgrade without changing routes or bypassing validation', () => withMeta(() => {
  const s=instance().session, bridge=mountMetaBridge({session:s});
  const versions=['reset-v1.0.0','reset-v1.0.1','reset-v1.1.0','reset-v1.2.0-dev','reset-v1.2.0-rc.1','reset-v1.2.0-rc.2','reset-v1.2.0','reset-v1.2.1-dev','reset-v1.2.1','reset-v1.2.2','reset-v1.2.3','reset-v1.3.0'];
  for(const version of versions)for(const id of expected){
    s.restart(); const legacy=structuredClone(endings.get(id)); legacy.state.storyVersion=version;
    s.restore(legacy); assert.equal(s.getView().frame.ending,id); assert.equal(legacy.state.storyVersion,version,'import must not mutate the backup');
    if(id==='true-end')assert.throws(()=>s.save(),/不可逆|保存|回退/);
    else assert.equal(s.save().state.storyVersion,project.version);
  }
  assert.equal(bridge.meta.loads,expected.length*versions.length);
  s.restart(); const invalid=structuredClone(endings.get('normal-linwan')); invalid.state.storyVersion='reset-v1.0.0';
  invalid.state.decisions[0].choiceId='invalid-choice'; assert.throws(()=>s.restore(invalid));
  invalid.state.storyVersion='unknown-version'; assert.throws(()=>s.restore(invalid));
  invalid.game='another-game'; invalid.state.storyVersion='reset-v1.0.0'; assert.throws(()=>s.restore(invalid));
  assert.equal(bridge.meta.loads,expected.length*versions.length,'rejected restores must not increase Meta');
  bridge.dispose(); s.dispose();
}));

test('CG collection unlocks only actual ready frames and survives restart independently of saves', () => withMeta(({values}) => {
  const s=instance().session,bridge=mountMetaBridge({session:s});assert.deepEqual(bridge.meta.cgs,[]);
  const cgScene=project.scenes.find(scene=>scene.cg==='letter-1842-cg');assert.ok(cgScene);
  s.restore(witnesses.get(cgScene.id));
  for(let count=0;count<30&&s.getView().frame.stage.cg!=='letter-1842-cg';count++)assert.ok(s.next());
  assert.ok(bridge.meta.cgs.includes('letter-1842-cg'));
  assert.equal(bridge.meta.cgs.includes('true-end-riverside-cg'),false,'unseen finale CG must stay locked');
  const loads=bridge.meta.loads;s.restart();assert.equal(bridge.meta.loads,loads);assert.ok(bridge.meta.cgs.includes('letter-1842-cg'));
  bridge.dispose();const again=mountMetaBridge({session:s});assert.ok(again.meta.cgs.includes('letter-1842-cg'));
  assert.ok(JSON.parse(values.get('reset:meta:v1')).cgs.includes('letter-1842-cg'));again.dispose();s.dispose();
}));

test('irreversible scenes block history, import, export, load and restart at the session boundary', () => withMeta(({controls}) => {
  const s=instance().session, before=s.save(); s.restore(witnesses.get('c6_no_save'));
  const bridge=mountMetaBridge({session:s}), scene=s.getView().frame.sceneId, earlier=s.history()[0].id;
  assert.equal(controls.save.hidden,true); assert.equal(controls.load.disabled,true);
  assert.equal(s.reread(earlier),false,'history must not bypass the irreversible interval');
  assert.equal(s.getView().frame.sceneId,scene);
  assert.throws(()=>s.restore(before),/不可逆|保存|回退/); assert.throws(()=>s.save(),/不可逆|保存|回退/);
  s.restart(); assert.equal(s.getView().frame.sceneId,scene);
  bridge.dispose(); s.dispose();
}));

test('completed True End records Meta and permits a new game without erasing it', () => withMeta(({controls,values}) => {
  const s=instance().session; s.restore(endings.get('true-end')); const bridge=mountMetaBridge({session:s});
  assert.equal(bridge.meta.trueEnd,true); assert.equal(controls.restart.hidden,false); assert.equal(controls.restart.disabled,false);
  s.restart(); assert.equal(s.getView().frame.sceneId,project.entry); assert.equal(bridge.meta.trueEnd,true);
  bridge.dispose(); const again=mountMetaBridge({session:s}); assert.equal(again.meta.trueEnd,true); assert.equal(document.title,'回留 · 明天见');
  assert.ok(JSON.parse(values.get('reset:meta:v1')).endings.includes('true-end')); again.dispose(); s.dispose();
}));

test('auto stops at choices; skip respects read history; settings and restored history survive', () => {
  const {session:s,clock}=instance();
  s.configure({autoDelayMs:20}); s.setAuto(true); clock.tick(10000);
  assert.ok(s.getView().frame.actions.length); const frame=s.getView().frame.id; clock.tick(1000); assert.equal(s.getView().frame.id,frame);
  s.restart(); assert.equal(s.setSkip(true),true); clock.tick(10000); assert.ok(s.getView().frame.actions.length);
  const save=s.save(); s.restart(); s.restore(save); assert.ok(s.history().length>0); assert.equal(s.getView().settings.autoDelayMs,20); assert.equal(s.getView().auto,false); assert.equal(s.getView().skipping,false); s.dispose();
});

await mkdir('test-results',{recursive:true});
const combatSaves={};
for(const id of ['faceless_first','faceless_second','c5_echo_fail']){
  const s=instance().session;s.restore(witnesses.get(id));while(s.getView().frame.canAdvance)assert.ok(s.next());combatSaves[id]=s.save();s.dispose();
}
await writeFile('test-results/route-fixtures.json',JSON.stringify({witnesses:Object.fromEntries(witnesses),endings:Object.fromEntries(endings),combat:combatSaves}));
await writeFile('test-results/routes.json',JSON.stringify({version:project.version,reachableScenes:witnesses.size,totalScenes:project.scenes.length,endingWitnesses:Object.fromEntries(expected.map(id=>[id,{sceneId:endings.get(id)?.state.sceneId,decisions:endings.get(id)?.state.decisions}]))},null,2)+'\n');

test('chapter-one handoff continues the story without advertising an ending', () => {
  const s=instance().session;s.restore(witnesses.get('rooftop_warning'));
  for(let count=0;count<50&&s.getView().frame.sceneId==='rooftop_warning';count++){
    assert.equal(s.getView().frame.ending,undefined);
    if(s.getView().frame.actions.some(a=>a.id==='@continue'))assert.equal(s.act('@continue'),true);else assert.equal(s.next(),true);
  }
  assert.equal(s.getView().frame.sceneId,'chapter2_teaser');s.dispose();
});
