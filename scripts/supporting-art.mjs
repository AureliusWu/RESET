import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const visualChecks = ['identity','styleConsistency','bodyProportion','expressionReadability','desktopComposition','mobileComposition','provenanceTruth'];
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// Approval is bound to the exact native source, processed master and runtime.
// Validate a recorded owner decision or an explicitly user-authorized simulated
// human review. Mechanical checks alone never produce either decision.
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
  const ownerApproved = new Set();
  const simulatedApproved = new Set();
  const reports = new Map();
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
      if (item.status === 'PASS') assert.equal(item.review?.artifactSHA256?.[kind], sha256, `${character.id}: review does not bind ${kind}`);
    }
    for (const field of ['prompt','spec']) {
      assert.ok(typeof provenance[field] === 'string' && provenance[field].startsWith(sourceDir) && !provenance[field].slice(sourceDir.length).includes('/'), `${character.id}: noncanonical ${field} path`);
      assert.equal(digest(await readFile(resolve(root, provenance[field]))), provenance[`${field}SHA256`], `${character.id}: ${field} SHA256 mismatch`);
    }
    if (item.status !== 'PASS') continue;
    const review = item.review;
    assert.ok(['owner','ai-simulated-human'].includes(review?.type), `${character.id}: owner or user-authorized AI simulated human review required`);
    assert.ok(typeof review.name === 'string' && review.name.trim(), `${character.id}: reviewer missing`);
    assert.ok(Number.isFinite(Date.parse(review.completedAt)), `${character.id}: review timestamp missing`);
    for (const check of visualChecks) assert.equal(review.checks?.[check], 'PASS', `${character.id}: visual check incomplete: ${check}`);
    if (review.type === 'ai-simulated-human') {
      const authorization = acceptance.simulatedHumanReviewAuthorization;
      assert.equal(authorization?.mode, 'user-authorized-ai-simulated-human', `${character.id}: explicit user authorization required`);
      assert.ok(typeof authorization.instruction === 'string' && authorization.instruction.trim(), `${character.id}: user instruction missing`);
      assert.ok(Number.isFinite(Date.parse(authorization.authorizedAt)), `${character.id}: authorization date missing`);
      assert.ok(typeof authorization.id === 'string' && authorization.id.length > 0 && review.authorizationId === authorization.id, `${character.id}: review authorization mismatch`);
      assert.ok(authorization.characterIds?.includes(character.id), `${character.id}: outside authorized review scope`);
      const evidence = review.report;
      assert.ok(typeof evidence?.path === 'string' && /^docs\/evidence\/[a-zA-Z0-9_/-]+\.json$/.test(evidence.path), `${character.id}: canonical review report required`);
      if (!reports.has(evidence.path)) reports.set(evidence.path, await readFile(resolve(root, evidence.path)));
      const bytes = reports.get(evidence.path);
      assert.equal(digest(bytes), evidence.sha256, `${character.id}: review report SHA256 mismatch`);
      const report = JSON.parse(bytes.toString('utf8'));
      assert.equal(report.schema, 1, `${character.id}: unsupported review report schema`);
      assert.equal(report.reviewType, 'ai-simulated-human', `${character.id}: report reviewer type mismatch`);
      assert.equal(report.authorizationId, authorization.id, `${character.id}: report authorization mismatch`);
      const matches = report.characters?.filter(value => value.id === character.id) ?? [];
      assert.equal(matches.length, 1, `${character.id}: unique individual review required`);
      const verdict = matches[0];
      assert.equal(verdict.status, 'PASS', `${character.id}: report verdict is not PASS`);
      for (const kind of ['original','master','runtime']) assert.equal(verdict.artifactSHA256?.[kind], item.artifacts[kind].sha256, `${character.id}: report does not bind ${kind}`);
      for (const check of visualChecks) {
        assert.equal(verdict.checks?.[check]?.status, 'PASS', `${character.id}: report check incomplete: ${check}`);
        assert.ok(typeof verdict.checks[check].observation === 'string' && verdict.checks[check].observation.trim(), `${character.id}: individual observation missing: ${check}`);
      }
      simulatedApproved.add(character.id);
    } else ownerApproved.add(character.id);
    approved.add(character.id);
  }
  return { characters, records, approved, ownerApproved, simulatedApproved, acceptance };
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
