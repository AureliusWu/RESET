import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const visualChecks = ['identity','styleConsistency','bodyProportion','expressionReadability','desktopComposition','mobileComposition','provenanceTruth'];
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// Approval is bound to the exact native source, processed master and runtime.
// This validates an existing owner decision; it never produces that decision.
export async function loadSupportingArt(root) {
  const plan = await json(resolve(root, 'game/visual/r5-supporting-cast-plan.json'));
  const acceptance = await json(resolve(root, 'game/assets/4k/visual-acceptance.json'));
  const characters = plan.characters;
  assert.equal(characters?.length, 12, 'supporting roster must have 12 characters');
  const records = acceptance.supportingCharacters;
  assert.equal(records?.length, characters.length, 'supporting visual acceptance roster incomplete');
  const byId = new Map(records.map(item => [item.id, item]));
  assert.equal(byId.size, records.length, 'duplicate supporting visual acceptance record');
  const approved = new Set();
  for (const character of characters) {
    const item = byId.get(character.id);
    assert.ok(item, `missing supporting acceptance: ${character.id}`);
    assert.equal(item.name, character.name, `supporting identity mismatch: ${character.id}`);
    assert.ok(['PASS','FAIL','BLOCKED','UNVERIFIED'].includes(item.status), `invalid supporting status: ${character.id}`);
    if (!item.artifacts) {
      assert.notEqual(item.status, 'PASS', `${character.id}: PASS requires exact artifacts`);
      continue;
    }
    const sourceDir = `game/art-sources/chatgpt/characters/${character.id}/`;
    const provenance = await json(resolve(root, sourceDir, 'provenance.json'));
    assert.equal(provenance.character, character.id, `${character.id}: provenance identity mismatch`);
    assert.equal(provenance.sourceType, 'chatgpt-native-imagegen', `${character.id}: native imagegen provenance required`);
    const asset = provenance.assets?.find(value => value.expression === 'neutral');
    assert.ok(asset, `${character.id}: neutral provenance missing`);
    const paths = {
      original: `${sourceDir}neutral.png`,
      master: `game/assets/4k/characters/${character.id}/neutral.png`,
      runtime: `game/assets/4k/runtime/characters/${character.id}/neutral.webp`
    };
    for (const [kind, path] of Object.entries(paths)) {
      const artifact = item.artifacts[kind];
      assert.equal(artifact?.path, path, `${character.id}: noncanonical ${kind} path`);
      assert.equal(asset[kind], path, `${character.id}: ${kind} provenance path mismatch`);
      const sha256 = digest(await readFile(resolve(root, path)));
      assert.equal(artifact.sha256, sha256, `${character.id}: ${kind} artifact SHA256 mismatch`);
      assert.equal(asset[`${kind}SHA256`], sha256, `${character.id}: ${kind} provenance SHA256 mismatch`);
      if (item.status === 'PASS') assert.equal(item.review?.artifactSHA256?.[kind], sha256, `${character.id}: owner review does not bind ${kind}`);
    }
    for (const field of ['prompt','spec']) {
      assert.ok(typeof provenance[field] === 'string' && provenance[field].startsWith(sourceDir) && !provenance[field].slice(sourceDir.length).includes('/'), `${character.id}: noncanonical ${field} path`);
      assert.equal(digest(await readFile(resolve(root, provenance[field]))), provenance[`${field}SHA256`], `${character.id}: ${field} SHA256 mismatch`);
    }
    if (item.status !== 'PASS') continue;
    assert.equal(item.review?.type, 'owner', `${character.id}: independent owner review required`);
    assert.ok(typeof item.review.name === 'string' && item.review.name.trim(), `${character.id}: owner reviewer missing`);
    assert.ok(Number.isFinite(Date.parse(item.review.completedAt)), `${character.id}: owner review timestamp missing`);
    for (const check of visualChecks) assert.equal(item.review.checks?.[check], 'PASS', `${character.id}: owner visual check incomplete: ${check}`);
    approved.add(character.id);
  }
  return { characters, records, approved, acceptance };
}

export function assertSupportingMappings(art, speakers, policy) {
  for (const item of art.characters) {
    const rule = policy.speakers?.[item.name];
    if (art.approved.has(item.id)) {
      assert.equal(rule?.mode, 'portrait', `${item.name}: approved portrait policy missing`);
      assert.equal(rule.character, item.id, `${item.name}: approved character mapping mismatch`);
      assert.equal(speakers[item.name], item.id, `${item.name}: approved runtime mapping missing`);
    } else {
      assert.equal(rule?.mode, 'functional', `${item.name}: unapproved portrait policy is visible`);
      assert.ok(!speakers[item.name], `${item.name}: unapproved supporting portrait is runtime-visible`);
    }
  }
}
