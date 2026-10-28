import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadContentPacks } from './content-packs.mjs';
import { loadAssetManifest } from './assets.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const supportPlan = await readJson(resolve(game, 'visual/r5-supporting-cast-plan.json'));
const speakerPolicy = await readJson(resolve(game, 'visual/r5-speaker-policy.json'));
const artPlan = await readJson(resolve(game, 'assets/4k/asset-plan.json'));
const manifest = await loadAssetManifest(root);
const assets = new Map(manifest.production.map(asset => [asset.id, asset]));
const { packs } = await loadContentPacks(root);
const project = await readJson(resolve(game, 'project.json'));
const runtimeSpeakers = Object.assign({}, project.stage?.speakers ?? {}, ...packs.map(({ pack }) => pack.stage?.speakers ?? {}));
const errors = [];
const hashes = new Set();
let dialogueLines = 0;

for (const item of supportPlan.characters ?? []) {
  const id = `${item.id}/neutral`;
  const asset = assets.get(id);
  if (asset?.kind !== 'portrait') errors.push(`${id}: production portrait missing`);
  if (asset && asset.src !== `assets/4k/runtime/characters/${item.id}/neutral.webp`) errors.push(`${id}: runtime path drift`);
  const planEntry = artPlan.characters?.find(character => character.id === item.id);
  if (!planEntry || JSON.stringify(planEntry.expressions) !== JSON.stringify(['neutral'])) errors.push(`${item.id}: 4K plan must contain neutral-only supporting portrait`);
  const policy = speakerPolicy.speakers?.[item.name];
  if (policy?.mode !== 'portrait' || policy.character !== item.id) errors.push(`${item.name}: speaker policy is not portrait -> ${item.id}`);
  if (runtimeSpeakers[item.name] !== item.id) errors.push(`${item.name}: runtime stage.speakers is not wired to ${item.id}`);

  const provenance = await readJson(resolve(game, `art-sources/chatgpt/characters/${item.id}/provenance.json`));
  if (provenance.visualTier !== 'supporting-cast-stylized-bust') errors.push(`${item.id}: visual tier provenance missing`);
  if (provenance.sourceType !== 'chatgpt-authored-procedural-raster-illustration') errors.push(`${item.id}: unexpected source type`);
  if (provenance.native4kClaim !== false) errors.push(`${item.id}: native 4K claim must be false`);
  const record = provenance.assets?.find(entry => entry.expression === 'neutral');
  if (!record) errors.push(`${item.id}: provenance neutral record missing`);
  else {
    const master = await readFile(resolve(root, record.master));
    const runtime = await readFile(resolve(root, record.runtime));
    const masterHash = createHash('sha256').update(master).digest('hex');
    const runtimeHash = createHash('sha256').update(runtime).digest('hex');
    if (masterHash !== record.masterSHA256 || runtimeHash !== record.runtimeSHA256) errors.push(`${item.id}: provenance hash mismatch`);
    if (hashes.has(masterHash)) errors.push(`${item.id}: duplicate supporting portrait master`);
    hashes.add(masterHash);
  }

  for (const { pack } of packs) for (const scene of pack.scenes ?? []) for (const line of scene.lines ?? []) if (line.speaker === item.name) dialogueLines++;
}

if ((supportPlan.characters ?? []).length !== 12) errors.push(`expected 12 supporting portraits, got ${supportPlan.characters?.length ?? 0}`);
if (hashes.size !== 12) errors.push(`supporting portraits must be 12 distinct masters, got ${hashes.size}`);
if (dialogueLines !== 116) errors.push(`supporting cast dialogue coverage drift: expected 116 direct lines, got ${dialogueLines}`);
if (errors.length) throw new Error(`R5 supporting cast coverage failed:\n${errors.join('\n')}`);

console.log(JSON.stringify({
  status: 'r5-supporting-cast-ok',
  supportingCharacters: 12,
  distinctPortraitMasters: hashes.size,
  directDialogueLinesCovered: dialogueLines,
  visualTier: supportPlan.visualTier,
  coverage: '12/12'
}, null, 2));
