import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('.');
const acceptance = JSON.parse(await readFile(resolve(root, 'game/assets/4k/visual-acceptance.json'), 'utf8'));

test('visual acceptance has one explicit PASS status for every heroine after owner review', () => {
  const records = new Map(acceptance.characters.map(item => [item.id, item]));
  for (const id of ['linwan','xiaoman','xuqi','tinglan','tangli','nanxing']) assert.equal(records.get(id)?.status, 'PASS', id);
  assert.equal(acceptance.releaseGate, 'PASS');
  assert.equal(acceptance.principle, 'TECH_READY != ART_READY');
  for (const check of ['identity','styleConsistency','bodyProportion','expressionReadability','desktopComposition','mobileComposition','provenanceTruth']) {
    assert.ok(acceptance.requiredChecks.includes(check), check);
  }
});

test('production build cannot regenerate placeholder vector portraits', async () => {
  const build = await readFile(resolve(root, 'scripts/build.mjs'), 'utf8');
  assert.equal(build.includes("scripts/generate-portraits.mjs") || build.includes("'generate-portraits.mjs'"), false,
    'production build must not invoke the deterministic placeholder portrait generator');
  const pack = await readFile(resolve(root, 'game/content/zz-art-v1.json'), 'utf8');
  assert.ok(pack.includes('assets/4k/runtime/characters/'));
  assert.equal(pack.includes('generated-portraits'), false);
});
