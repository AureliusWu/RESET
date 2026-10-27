import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const releaseMode = process.argv.includes('--release');
const acceptance = JSON.parse(await readFile(resolve(root, 'game/assets/4k/visual-acceptance.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

const expected = ['linwan','xiaoman','xuqi','tinglan','tangli','nanxing'];
const allowed = new Set(['PASS','FAIL','BLOCKED','UNVERIFIED','N/A']);
if (acceptance.schema !== 1) throw new Error('visual acceptance schema must be 1');
if (acceptance.principle !== 'TECH_READY != ART_READY') throw new Error('visual acceptance principle is missing');
if (!Array.isArray(acceptance.requiredChecks) || acceptance.requiredChecks.length < 7) throw new Error('visual acceptance requiredChecks incomplete');
const records = new Map((acceptance.characters ?? []).map(item => [item.id, item]));
for (const id of expected) {
  const item = records.get(id);
  if (!item) throw new Error(`missing visual acceptance record: ${id}`);
  if (!allowed.has(item.status)) throw new Error(`invalid visual acceptance status: ${id}=${item.status}`);
}
const blockers = expected.map(id => records.get(id)).filter(item => item.status !== 'PASS');
const computed = blockers.length ? 'BLOCKED' : 'PASS';
if (acceptance.releaseGate !== computed) throw new Error(`releaseGate=${acceptance.releaseGate} disagrees with computed=${computed}`);

for (const id of expected) {
  const item = records.get(id);
  console.log(`${item.status.padEnd(10)} ${id.padEnd(10)} ${item.name}${item.reason ? ` — ${item.reason}` : ''}`);
}
console.log(`Visual gate: ${computed}; target=${acceptance.targetVersion}; package=${pkg.version}`);

if (releaseMode && blockers.length) {
  console.error(`NO RELEASE: ${blockers.length} character visual acceptance blocker(s): ${blockers.map(item => item.id).join(', ')}`);
  process.exit(2);
}
if (releaseMode && pkg.version.includes('-')) {
  console.error(`NO RELEASE: package version ${pkg.version} is not a stable version`);
  process.exit(3);
}
if (!releaseMode && blockers.length) console.warn('ART_BLOCKED is allowed only on the development line; stable release remains forbidden.');
