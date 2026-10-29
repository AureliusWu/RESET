import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSupportingArt, assertSupportingMappings } from './supporting-art.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const art = await loadSupportingArt(root);
const policyPath = resolve(root, 'game/visual/r5-speaker-policy.json');
const runtimePath = resolve(root, 'game/content/runtime.json');
const policy = JSON.parse(await readFile(policyPath, 'utf8'));
const runtime = JSON.parse(await readFile(runtimePath, 'utf8'));
runtime.stage ??= {};
runtime.stage.speakers ??= {};
for (const item of art.characters) {
  if (art.approved.has(item.id)) {
    policy.speakers[item.name] = { mode: 'portrait', character: item.id };
    runtime.stage.speakers[item.name] = item.id;
  } else {
    policy.speakers[item.name] = { mode: 'functional', role: 'awaiting-approved-4k-portrait' };
    delete runtime.stage.speakers[item.name];
  }
}
assertSupportingMappings(art, runtime.stage.speakers, policy);
await writeFile(policyPath, JSON.stringify(policy, null, 2) + '\n');
await writeFile(runtimePath, JSON.stringify(runtime, null, 2) + '\n');
console.log(JSON.stringify({ status: 'recorded-visual-approvals-applied', approved: [...art.approved], ownerApproved: [...art.ownerApproved], aiSimulatedApproved: [...art.simulatedApproved] }));
