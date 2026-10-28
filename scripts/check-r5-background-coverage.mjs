import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentPacks } from './content-packs.mjs';
import { loadAssetManifest } from './assets.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const { packs } = await loadContentPacks(root);
const scenes = packs.filter(({ entry }) => entry.role === 'chapter').flatMap(({ pack }) => pack.scenes ?? []);
const manifest = await loadAssetManifest(root);
const production = new Map(manifest.production.map(asset => [asset.id, asset]));
const plan = JSON.parse(await readFile(resolve(game, 'assets/4k/asset-plan.json'), 'utf8'));
const planned = new Set(plan.backgrounds ?? []);

const errors = [];
const usage = new Map();
for (const scene of scenes) {
  if (!Object.prototype.hasOwnProperty.call(scene, 'background') || !scene.background) {
    errors.push(`${scene.id}: background must be explicit`);
    continue;
  }
  const asset = production.get(scene.background);
  if (!asset) {
    errors.push(`${scene.id}: unknown background ${scene.background}`);
    continue;
  }
  if (asset.kind !== 'background') errors.push(`${scene.id}: ${scene.background} is ${asset.kind}, not background`);
  if (!planned.has(scene.background)) errors.push(`${scene.id}: ${scene.background} is outside frozen 4K background plan`);
  if (!asset.src.startsWith('assets/4k/runtime/backgrounds/') || !asset.src.endsWith('.webp')) {
    errors.push(`${scene.id}: ${scene.background} is not a production 4K runtime background`);
  }
  usage.set(scene.background, (usage.get(scene.background) ?? 0) + 1);
}

if (scenes.length !== 82) errors.push(`expected 82 canonical scenes, got ${scenes.length}`);
if (errors.length) throw new Error(`R5 background coverage failed:\n${errors.join('\n')}`);

const unusedPlanned = [...planned].filter(id => !usage.has(id));
const distribution = Object.fromEntries([...usage].sort(([a],[b]) => a.localeCompare(b)));
console.log(JSON.stringify({
  status: 'r5-background-coverage-ok',
  scenes: scenes.length,
  scenesWithExplicitProductionBackground: scenes.length,
  coverage: `${scenes.length}/${scenes.length}`,
  uniqueBackgroundsUsed: usage.size,
  plannedBackgrounds: planned.size,
  unusedPlannedBackgrounds: unusedPlanned,
  distribution
}, null, 2));
