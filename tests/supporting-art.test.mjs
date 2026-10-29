import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadSupportingArt, assertSupportingMappings, visualChecks } from '../scripts/supporting-art.mjs';

const repo = resolve('.');
const readJson = async p => JSON.parse(await readFile(p, 'utf8'));
async function fixture(t, approve = false) {
  const root = await mkdtemp(resolve(tmpdir(), 'reset-art-fixture-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const acceptance = await readJson(resolve(repo, 'game/assets/4k/visual-acceptance.json'));
  for (const record of acceptance.supportingCharacters) {
    record.status = 'UNVERIFIED';
    record.review = null;
  }
  acceptance.releaseGate = 'BLOCKED';
  const item = acceptance.supportingCharacters.find(item => item.id === 'xujiashu');
  if (approve) {
    // Disposable synthetic approval tests the validator. It is never written to
    // the repository acceptance record and is not an actual art review.
    item.status = 'PASS';
    item.review = {type:'owner', name:'TEST FIXTURE ONLY', completedAt:'2026-10-29T00:00:00Z', checks:Object.fromEntries(visualChecks.map(key => [key,'PASS'])), artifactSHA256:Object.fromEntries(Object.entries(item.artifacts).map(([key,value]) => [key,value.sha256]))};
  }
  // The repository now contains native candidates for the whole roster.
  // Copy every recorded source chain so tests exercise real cross-character isolation.
  const paths = ['game/visual/r5-supporting-cast-plan.json'];
  for (const candidate of acceptance.supportingCharacters.filter(value => value.artifacts)) {
    const base = `game/art-sources/chatgpt/characters/${candidate.id}/`;
    paths.push(...['provenance.json','spec.json','prompt-neutral.txt'].map(name => base + name), ...Object.values(candidate.artifacts).map(value => value.path));
  }
  for (const path of paths) { await mkdir(dirname(resolve(root,path)), {recursive:true}); await copyFile(resolve(repo,path), resolve(root,path)); }
  const save = async () => writeFile(resolve(root,'game/assets/4k/visual-acceptance.json'),JSON.stringify(acceptance));
  await save();
  const policy = await readJson(resolve(repo, 'game/visual/r5-speaker-policy.json'));
  for (const record of acceptance.supportingCharacters) policy.speakers[record.name] = {mode:'functional',role:'test-unreviewed'};
  return {root, item, policy, save, acceptance};
}

async function simulatedFixture(t) {
  const f = await fixture(t, true);
  const authorization = {id:'TEST-AUTHORIZATION-ONLY',mode:'user-authorized-ai-simulated-human',instruction:'Synthetic explicit authorization for validator tests only',authorizedAt:'2026-10-29T00:00:00Z',characterIds:['xujiashu']};
  f.acceptance.simulatedHumanReviewAuthorization = authorization;
  const report = {schema:1,reviewType:'ai-simulated-human',authorizationId:authorization.id,characters:[{id:'xujiashu',status:'PASS',artifactSHA256:{...f.item.review.artifactSHA256},checks:Object.fromEntries(visualChecks.map(key => [key,{status:'PASS',observation:'TEST FIXTURE ONLY; no actual art review.'}]))}]};
  const path = 'docs/evidence/test-ai-review/review.json';
  await mkdir(dirname(resolve(f.root,path)),{recursive:true});
  f.item.review.type = 'ai-simulated-human';
  f.item.review.authorizationId = authorization.id;
  const saveReport = async () => {
    const bytes = Buffer.from(JSON.stringify(report));
    await writeFile(resolve(f.root,path),bytes);
    f.item.review.report = {path,sha256:createHash('sha256').update(bytes).digest('hex')};
    await f.save();
  };
  await saveReport();
  return {...f,report,saveReport};
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
test('an ordinary automated review cannot substitute for authorized visual acceptance', async t => {
  const f = await fixture(t,true);f.item.review.type='agent';await f.save();
  await assert.rejects(loadSupportingArt(f.root),/owner or user-authorized AI simulated human review required/);
});

test('explicitly authorized simulated human review accepts only its exact reviewed character', async t => {
  const f = await simulatedFixture(t);const art = await loadSupportingArt(f.root);
  assert.deepEqual([...art.approved],['xujiashu']);
  assert.deepEqual([...art.simulatedApproved],['xujiashu']);
  assert.equal(art.ownerApproved.size,0,'AI acceptance must never be counted as owner review');
  f.policy.speakers['徐嘉树']={mode:'portrait',character:'xujiashu'};
  assertSupportingMappings(art,{'徐嘉树':'xujiashu'},f.policy);
});

test('simulated review without explicit user authorization fails', async t => {
  const f=await simulatedFixture(t);delete f.acceptance.simulatedHumanReviewAuthorization;await f.save();
  await assert.rejects(loadSupportingArt(f.root),/explicit user authorization required/);
});

test('simulated review cannot expand the authorized character scope', async t => {
  const f=await simulatedFixture(t);f.acceptance.simulatedHumanReviewAuthorization.characterIds=[];await f.save();
  await assert.rejects(loadSupportingArt(f.root),/outside authorized review scope/);
});

test('modifying an already bound simulated report invalidates acceptance', async t => {
  const f=await simulatedFixture(t);await writeFile(resolve(f.root,f.item.review.report.path),'changed report');
  await assert.rejects(loadSupportingArt(f.root),/review report SHA256 mismatch/);
});

test('a report cannot accept another runtime image by changing its own digest', async t => {
  const f=await simulatedFixture(t);f.report.characters[0].artifactSHA256.runtime='0'.repeat(64);await f.saveReport();
  await assert.rejects(loadSupportingArt(f.root),/report does not bind runtime/);
});

test('simulated PASS requires an actual observation for every visual criterion', async t => {
  const f=await simulatedFixture(t);f.report.characters[0].checks.mobileComposition.observation='';await f.saveReport();
  await assert.rejects(loadSupportingArt(f.root),/individual observation missing: mobileComposition/);
});

test('a failed report verdict cannot be overridden by a PASS in the ledger', async t => {
  const f=await simulatedFixture(t);f.report.characters[0].status='FAIL';await f.saveReport();
  await assert.rejects(loadSupportingArt(f.root),/report verdict is not PASS/);
});
