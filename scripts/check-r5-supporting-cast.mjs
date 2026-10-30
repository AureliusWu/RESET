import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContentPacks } from './content-packs.mjs';
import { loadSupportingArt, assertSupportingMappings } from './supporting-art.mjs';
import { supportingRuntimeWitnesses } from './supporting-runtime.mjs';
import assert from 'node:assert/strict';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const supportPlan = await readJson(resolve(game, 'visual/r5-supporting-cast-plan.json'));
const speakerPolicy = await readJson(resolve(game, 'visual/r5-speaker-policy.json'));
const { packs } = await loadContentPacks(root);
const project = await readJson(resolve(game, 'project.json'));
const runtimeSpeakers = Object.assign({}, project.stage?.speakers ?? {}, ...packs.map(({ pack }) => pack.stage?.speakers ?? {}));
const errors = [];
const art = await loadSupportingArt(root);
assertSupportingMappings(art, runtimeSpeakers, speakerPolicy);
let dialogueLines = 0;

for (const item of supportPlan.characters ?? []) {
  for (const { pack } of packs) for (const scene of pack.scenes ?? []) for (const line of scene.lines ?? []) if (line.speaker === item.name) dialogueLines++;
}

if ((supportPlan.characters ?? []).length !== 12) errors.push(`expected 12 tracked supporting characters, got ${supportPlan.characters?.length ?? 0}`);
if (dialogueLines !== 116) errors.push(`supporting cast dialogue coverage drift: expected 116 direct lines, got ${dialogueLines}`);
if (errors.length) throw new Error(`Supporting portrait quality gate failed:\n${errors.join('\n')}`);

const dist = resolve(process.env.RESET_DIST || resolve(root, 'dist'));
const built = await readJson(resolve(dist, 'project.json'));
const { createProject } = await import(pathToFileURL(resolve(dist, 'lib/index.js')));
assertSupportingMappings(art, built.stage.speakers, speakerPolicy);
const authored = await readJson(resolve(game, 'content/runtime.json'));
const offscreen = Object.entries(authored.stage.lines).filter(([,cue]) => cue.portrait === null).map(([id]) => id);
const migration = await readJson(resolve(root, 'docs/evidence/npc-v1.3.1/presentation-migration.json'));
assert.deepEqual([...offscreen].sort(), migration.hiddenLines.map(line => line.lineId).sort(), 'Every offscreen exception must have a documented story reason');
for (const item of migration.hiddenLines) {
  const scene = built.scenes.find(scene => scene.id === item.sceneId);
  assert.equal(scene?.lines.find(line => line.id === item.lineId)?.speaker, item.speaker, `Offscreen exception does not match canonical dialogue: ${item.lineId}`);
  assert.ok(item.reason?.length > 20, `Offscreen exception has no story reason: ${item.lineId}`);
}
const runtime = supportingRuntimeWitnesses(built, createProject, art.characters, speakerPolicy, offscreen);

console.log(JSON.stringify({
  status: 'supporting-portrait-quality-gate-ok',
  trackedSupportingCharacters: 12,
  directDialogueLinesCovered: dialogueLines,
  supportingCharacters: art.characters.length,
  approved: art.approved.size,
  speakerMapped: art.characters.filter(c => built.stage.speakers[c.name] === c.id).length,
  runtimeVisible: runtime.runtimeVisible,
  runtimeVisibleWitnesses: Object.values(runtime.witnesses).map(({ save, ...witness }) => witness),
  runtimePolicy: 'approved-production-portrait-per-line-with-explicit-offscreen-cues',
  legacyStylizedPortraitsVisible: 0
}, null, 2));
