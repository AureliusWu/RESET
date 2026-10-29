import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentPacks } from './content-packs.mjs';
import { loadSupportingArt, assertSupportingMappings } from './supporting-art.mjs';

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

console.log(JSON.stringify({
  status: 'supporting-portrait-quality-gate-ok',
  trackedSupportingCharacters: 12,
  directDialogueLinesCovered: dialogueLines,
  runtimePolicy: 'approved-4k-original-or-hidden',
  legacyStylizedPortraitsVisible: 0
}, null, 2));
