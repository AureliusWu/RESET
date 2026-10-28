import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentPacks } from './content-packs.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const supportPlan = await readJson(resolve(game, 'visual/r5-supporting-cast-plan.json'));
const speakerPolicy = await readJson(resolve(game, 'visual/r5-speaker-policy.json'));
const { packs } = await loadContentPacks(root);
const project = await readJson(resolve(game, 'project.json'));
const runtimeSpeakers = Object.assign({}, project.stage?.speakers ?? {}, ...packs.map(({ pack }) => pack.stage?.speakers ?? {}));
const errors = [];
let dialogueLines = 0;

for (const item of supportPlan.characters ?? []) {
  const policy = speakerPolicy.speakers?.[item.name];
  if (policy?.mode === 'portrait') {
    errors.push(`${item.name}: reduced-detail supporting portrait must not be runtime-visible; replace with approved 4K original before restoring portrait mode`);
  }
  if (runtimeSpeakers[item.name]) {
    errors.push(`${item.name}: runtime speaker mapping must be absent until an approved 4K original portrait exists`);
  }
  const provenance = await readJson(resolve(game, `art-sources/chatgpt/characters/${item.id}/provenance.json`));
  if (provenance.visualTier === 'supporting-cast-stylized-bust' || provenance.native4kClaim === false) {
    // Known legacy R5 asset: retained in source history/package for compatibility, but forbidden from runtime speaker mapping.
  } else {
    errors.push(`${item.id}: unexpected supporting portrait provenance; review quality policy before enabling`);
  }
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
