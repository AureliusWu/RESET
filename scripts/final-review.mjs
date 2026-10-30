import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

export const evidencePath='docs/evidence/npc-v1.3.1';
const contractPath='docs/evidence/final-v1.3.0';
export const chapters=Array.from({length:7},(_,i)=>`game/content/chapters/0${i+1}.json`);
export const sourceFiles=[...chapters,...['archive','archive-data','combat','direction','experience','meta','pwa','sfx','ui'].map(n=>`game/runtime/${n}.mjs`),'game/runtime/experience.css','game/runtime/direction.css','scripts/final-review.mjs','scripts/check-final-review.mjs','tests/player-actors-browser.mjs','tests/route-matrix.mjs','tests/browser-release.mjs','tests/pwa-upgrade-browser.mjs','tests/combat-player.mjs','game/content/runtime.json','scripts/build.mjs','scripts/portrait-cues.mjs','scripts/supporting-runtime.mjs','scripts/check-r5-supporting-cast.mjs','tests/supporting-portraits-browser.mjs','tests/supporting-runtime-browser.mjs','tests/portrait-runtime.test.mjs',`${evidencePath}/presentation-migration.json`];
export const packageFiles=['project.json','index.html','app.mjs','archive.mjs','archive-data.mjs','combat.mjs','direction.mjs','direction-data.mjs','direction.css','experience.mjs','experience.css','meta.mjs','pwa.mjs','sfx.mjs','ui.mjs'];
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
// Only wording may change. Array positions, speakers, variants' conditions,
// scene metadata, choices' effects and all stable identities remain covered.
export function structure(value){
  if(Array.isArray(value))return value.map(structure);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>k!=='text').map(([k,v])=>[k,structure(v)]));
  return value;
}
export async function hashes(root,files){
  return Object.fromEntries(await Promise.all(files.map(async path=>[path,sha256(await readFile(resolve(root,path)))])));
}
export async function checkContent(root){
  const contract=JSON.parse(await readFile(resolve(root,contractPath,'content-contract.json'),'utf8'));
  const migration=JSON.parse(await readFile(resolve(root,evidencePath,'presentation-migration.json'),'utf8'));
  assert.equal(migration.baseline,'a92bd91e29dd1b07a17a80c2e909b48c22fbe3df');
  assert.equal(migration.chapters.reduce((n,c)=>n+c.removedNoSprite.length,0),29);
  assert.equal(contract.baseline,'6f1017c0f24c44fdec18d9af0ce8616c8a161aad');
  assert.deepEqual(contract.chapters.map(c=>c.path),chapters);
  let scenes=0,lines=0;
  for(const record of contract.chapters){
    const pack=JSON.parse(await readFile(resolve(root,record.path),'utf8'));
    const change=migration.chapters.find(c=>c.path===record.path);
    assert.ok(change,'Missing scoped presentation migration: '+record.path);
    const original=structuredClone(pack);
    for(const id of change.removedNoSprite){
      const scene=original.scenes.find(s=>s.id===id);
      assert.ok(scene&&!Object.hasOwn(scene,'noSprite'),'Expected only the recorded noSprite removal: '+id);
      scene.noSprite=true;
    }
    assert.equal(sha256(canonical(original)),change.originalCanonicalSha256,'Text or non-presentation content changed from v1.3.0: '+record.path);
    assert.equal(sha256(canonical(structure(original))),record.structureSha256,'Narrative/save identity changed: '+record.path);
    for(const scene of pack.scenes){
      scenes++;lines+=scene.lines.length;
      for(const line of scene.lines)assert.ok(!/在离开“|临走前，陈渡又回头|不是为了寻找隐藏线索/.test(line.text),'Retired generic scene-summary text: '+line.id);
    }
  }
  assert.equal(scenes,82);assert.equal(lines,2161);
  for(const [path,digest] of Object.entries(contract.protectedFiles))assert.equal(sha256(await readFile(resolve(root,path))),digest,'Frozen engine/art/audio/direction contract changed: '+path);
  return{scenes,lines,baseline:contract.baseline};
}
export async function checkReview(root,dist){
  const review=JSON.parse(await readFile(resolve(root,evidencePath,'ai-review.json'),'utf8'));
  assert.equal(review.type,'ai-simulated-human');assert.equal(review.status,'PASS');
  assert.ok(review.authorization?.quote?.includes('发布'),'Explicit release/review authorization missing');
  assert.equal(review.realHumanParticipants,'NOT_CLAIMED');assert.equal(review.physicalDevices,'NOT_RUN');
  assert.deepEqual(review.subject.sourceSha256,await hashes(root,sourceFiles),'Review is stale for the current narrative/runtime sources');
  assert.deepEqual(review.subject.packageSha256,await hashes(dist,packageFiles),'Reviewed runtime differs from the final package');
  assert.ok(review.observations?.length>=6,'Independent player observations missing');
  assert.ok(review.screenshots?.length>=8,'Reviewed screenshot evidence incomplete');
  const actorsRaw=await readFile(resolve(root,evidencePath,'player-actors.json'));
  assert.equal(sha256(actorsRaw),review.playerActorReportSha256,'Player-actor report changed');
  const actors=JSON.parse(actorsRaw);
  assert.equal(actors.status,'PASS');assert.equal(actors.projectSha256,review.subject.packageSha256['project.json']);
  assert.deepEqual(actors.actors.map(a=>[a.id,a.status]),['first-time-keyboard','mobile-six-routes','returning-six-slots','true-route-reader'].map(id=>[id,'PASS']));
  for(const shot of review.screenshots){
    assert.ok(/^screenshots\/[a-z0-9-]+\.png$/.test(shot.file));
    assert.ok(actors.screenshots.some(s=>shot.file==='screenshots/'+s.file&&s.sha256===shot.sha256),'Screenshot is not from the recorded player run: '+shot.file);
    assert.equal(sha256(await readFile(resolve(root,evidencePath,shot.file))),shot.sha256,'Reviewed screenshot has changed: '+shot.file);
    assert.ok(shot.observation?.length>=20,'Screenshot has no actual observation');
  }
  return{type:review.type,observations:review.observations.length,screenshots:review.screenshots.length};
}
