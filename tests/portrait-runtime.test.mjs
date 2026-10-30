import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compilePortraitCues } from '../scripts/portrait-cues.mjs';
import { supportingRuntimeWitnesses } from '../scripts/supporting-runtime.mjs';
const dist = resolve(process.env.RESET_DIST || 'dist');
const { createProject } = await import(pathToFileURL(resolve(dist,'lib/index.js')));
const project = JSON.parse(await readFile(resolve(dist,'project.json'),'utf8'));
const policy = JSON.parse(await readFile('game/visual/r5-speaker-policy.json','utf8'));
const {characters} = JSON.parse(await readFile('game/visual/r5-supporting-cast-plan.json','utf8'));
const authored = JSON.parse(await readFile('game/content/runtime.json','utf8'));
const offscreen = Object.entries(authored.stage.lines).filter(([,cue])=>cue.portrait===null).map(([id])=>id);

test('all 12 supporting characters have actual canonical runtime witnesses; narration never retains a portrait', () => {
  const result = supportingRuntimeWitnesses(project,createProject,characters,policy,offscreen);
  assert.equal(result.runtimeVisible,12); assert.equal(result.supportingLines,113);
  // Three preserved route-open nodes are intentionally unreachable; their
  // three direct supporting turns remain in the 116-line source contract.
  assert.equal(project.scenes.flatMap(s=>s.lines).filter(l=>characters.some(c=>c.name===l.speaker)).length,116);
  assert.equal(result.witnesses.chenlan.sceneId,'chapter5_gate');
  assert.ok(result.transitions.c7_after.some(f=>f.speaker==='徐嘉树'&&f.portrait==='xujiashu/neutral'));
  assert.ok(result.transitions.c7_after.some(f=>f.speaker==='程妍'&&f.portrait==='chengyan/neutral'));
  assert.ok(result.transitions.c7_after.some(f=>f.speaker==='顾明远'&&f.portrait==='gumingyuan/neutral'));
});
test('gate rejects mapped and approved speakers hidden by a reintroduced scene flag', () => {
  const broken=structuredClone(project); broken.scenes.find(s=>s.id==='c7_after').noSprite=true;
  assert.throws(()=>supportingRuntimeWitnesses(broken,createProject,characters,policy,offscreen),/approved\/mapped speaker is hidden/);
});
test('gate rejects an accidental null cue even when the same character is visible elsewhere', () => {
  const broken=structuredClone(project); broken.stage.lines.r1_c7_after_pre03_01.portrait=null;
  assert.throws(()=>supportingRuntimeWitnesses(broken,createProject,characters,policy,offscreen),/approved\/mapped speaker is hidden/);
});
test('locked engine reconstructs a line-only voice cue after restore without hiding the next in-person turn', () => {
  const fixture=compilePortraitCues({schema:1,game:'fixture',version:'qa',title:'Fixture',type:'narrative',entry:'scene',assets:[],stage:{speakers:{徐嘉树:'xujiashu',程妍:'chengyan'},lines:{voice:{portrait:null}}},scenes:[{id:'scene',lines:[{id:'voice',speaker:'徐嘉树',text:'Phone'},{id:'person',speaker:'程妍',text:'Here'},{id:'narration',speaker:'旁白',text:'Narration'},{id:'broadcast',speaker:'车站广播',text:'Broadcast'},{id:'protagonist',speaker:'陈渡',text:'Me'},{id:'again',speaker:'徐嘉树',text:'Here now'}],ending:'end'}]},policy);
  const {session}=createProject(fixture,'https://fixture.test/',{settings:{textDelayMs:0}});
  try {
    assert.equal(session.getView().frame.stage.portrait,null);
    const phone=session.save();session.next();assert.equal(session.getView().frame.stage.portrait,'chengyan/neutral');
    session.restore(phone);session.next();assert.equal(session.getView().frame.stage.portrait,'chengyan/neutral');
    for(let i=0;i<3;i++){session.next();assert.equal(session.getView().frame.stage.portrait,null);}
    session.next();assert.equal(session.getView().frame.stage.portrait,'xujiashu/neutral');
  } finally {session.dispose();}
});
