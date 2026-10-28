import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContentPacks } from './content-packs.mjs';
import { loadAssetManifest } from './assets.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const plan = JSON.parse(await readFile(resolve(game, 'visual/r5-key-cg-plan.json'), 'utf8'));
const artPlan = JSON.parse(await readFile(resolve(game, 'assets/4k/asset-plan.json'), 'utf8'));
const manifest = await loadAssetManifest(root);
const assets = new Map(manifest.production.map(asset => [asset.id, asset]));
const { packs } = await loadContentPacks(root);
const scenes = packs.filter(({ entry }) => entry.role === 'chapter').flatMap(({ pack }) => pack.scenes ?? []);
const { CGS } = await import(pathToFileURL(resolve(game, 'runtime/archive-data.mjs')).href);
const galleryIds = new Set(CGS.map(item => item.id));
const artPlanIds = new Set(artPlan.cgs ?? []);
const errors = [];

const existingStoryCgs = [
  'faceless-reflection-cg',
  'letter-1842-cg',
  'six-chairs-cg',
  'linwan-1842-cg',
  'true-end-riverside-cg'
];
for (const id of existingStoryCgs) {
  if (assets.get(id)?.kind !== 'cg') errors.push(`existing key CG missing production asset: ${id}`);
  if (!artPlanIds.has(id)) errors.push(`existing key CG missing 4K plan entry: ${id}`);
  if (!galleryIds.has(id)) errors.push(`existing key CG missing Gallery entry: ${id}`);
}

const required = plan.requiredEndingCgs ?? [];
if (required.length !== 6) errors.push(`expected 6 Normal Route CGs, got ${required.length}`);
for (const item of required) {
  const matches = scenes.filter(scene => scene.ending === item.ending);
  if (matches.length !== 1) {
    errors.push(`${item.ending}: expected one ending scene, got ${matches.length}`);
    continue;
  }
  const scene = matches[0];
  if (scene.cg !== item.asset) errors.push(`${item.ending}: scene ${scene.id} must trigger ${item.asset}, got ${scene.cg ?? '<none>'}`);
  const asset = assets.get(item.asset);
  if (asset?.kind !== 'cg') errors.push(`${item.asset}: missing production CG asset`);
  if (asset && asset.src !== `assets/4k/runtime/cg/${item.asset}.webp`) errors.push(`${item.asset}: noncanonical runtime path ${asset.src}`);
  if (!artPlanIds.has(item.asset)) errors.push(`${item.asset}: missing 4K asset plan mapping`);
  if (!galleryIds.has(item.asset)) errors.push(`${item.asset}: missing CG Gallery/Meta registration`);
}

const allRequired = new Set([...existingStoryCgs, ...required.map(item => item.asset)]);
const triggered = new Set(scenes.map(scene => scene.cg).filter(Boolean));
for (const id of allRequired) if (!triggered.has(id)) errors.push(`${id}: no canonical story scene triggers this CG`);
if (galleryIds.size !== allRequired.size) errors.push(`CG Gallery must expose exactly ${allRequired.size} R5 production CGs, got ${galleryIds.size}`);

if (errors.length) throw new Error(`R5 key CG coverage failed:\n${errors.join('\n')}`);
console.log(JSON.stringify({
  status: 'r5-key-cg-coverage-ok',
  existingKeyCgs: existingStoryCgs.length,
  routeEndingCgs: required.length,
  productionGalleryCgs: galleryIds.size,
  storyTriggeredCgs: [...allRequired].filter(id => triggered.has(id)).length,
  coverage: `${allRequired.size}/${allRequired.size}`
}, null, 2));
