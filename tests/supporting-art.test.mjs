import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { loadSupportingArt, assertSupportingMappings, visualChecks } from '../scripts/supporting-art.mjs';

const repo = resolve('.');
const readJson = async p => JSON.parse(await readFile(p, 'utf8'));
async function fixture(t, approve = false) {
  const root = await mkdtemp(resolve(tmpdir(), 'reset-art-fixture-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const acceptance = await readJson(resolve(repo, 'game/assets/4k/visual-acceptance.json'));
  const item = acceptance.supportingCharacters.find(item => item.id === 'xujiashu');
  if (approve) {
    // Disposable synthetic approval tests the validator. It is never written to
    // the repository acceptance record and is not an actual art review.
    item.status = 'PASS';
    item.review = {type:'owner', name:'TEST FIXTURE ONLY', completedAt:'2026-10-29T00:00:00Z', checks:Object.fromEntries(visualChecks.map(key => [key,'PASS'])), artifactSHA256:Object.fromEntries(Object.entries(item.artifacts).map(([key,value]) => [key,value.sha256]))};
  }
  const paths = ['game/visual/r5-supporting-cast-plan.json', 'game/art-sources/chatgpt/characters/xujiashu/provenance.json','game/art-sources/chatgpt/characters/xujiashu/spec.json','game/art-sources/chatgpt/characters/xujiashu/prompt-neutral.txt', ...Object.values(item.artifacts).map(value => value.path)];
  for (const path of paths) { await mkdir(dirname(resolve(root,path)), {recursive:true}); await copyFile(resolve(repo,path), resolve(root,path)); }
  const save = async () => writeFile(resolve(root,'game/assets/4k/visual-acceptance.json'),JSON.stringify(acceptance));
  await save();
  const policy = await readJson(resolve(repo, 'game/visual/r5-speaker-policy.json'));
  return {root, item, policy, save};
}

test('unreviewed native candidate remains hidden and cannot leak through mapping', async t => {
  const f = await fixture(t); const art = await loadSupportingArt(f.root);
  assert.equal(art.approved.size, 0);
  assertSupportingMappings(art, {}, f.policy);
  assert.throws(() => assertSupportingMappings(art, {'徐嘉树':'xujiashu'},f.policy), /unapproved supporting portrait/);
});
test('complete owner review permits only the approved supporting character', async t => {
  const f = await fixture(t,true);const art = await loadSupportingArt(f.root);
  assert.deepEqual([...art.approved],['xujiashu']);
  f.policy.speakers['徐嘉树']={mode:'portrait',character:'xujiashu'};
  assertSupportingMappings(art, {'徐嘉树':'xujiashu'}, f.policy);
  assert.throws(() => assertSupportingMappings(art, {'徐嘉树':'xujiashu','程妍':'chengyan'},f.policy), /unapproved supporting portrait/);
});
test('procedural provenance cannot inherit native image approval', async t => {
  const f = await fixture(t,true);const path=resolve(f.root,'game/art-sources/chatgpt/characters/xujiashu/provenance.json');const p=await readJson(path);
  p.sourceType='chatgpt-authored-procedural-raster-illustration';await writeFile(path,JSON.stringify(p));
  await assert.rejects(loadSupportingArt(f.root),/native imagegen provenance required/);
});
test('changed runtime bytes invalidate an existing approval', async t => {
  const f = await fixture(t,true);await writeFile(resolve(f.root,f.item.artifacts.runtime.path),'modified bytes');
  await assert.rejects(loadSupportingArt(f.root),/artifact SHA256 mismatch/);
});
test('automated review cannot substitute for independent owner review', async t => {
  const f = await fixture(t,true);f.item.review.type='agent';await f.save();
  await assert.rejects(loadSupportingArt(f.root),/independent owner review required/);
});
