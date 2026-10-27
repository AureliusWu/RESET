import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAssetManifest } from './assets.mjs';
import { loadContentPacks } from './content-packs.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const fail = message => { throw new Error(message); };

const project = JSON.parse(await readFile(resolve(game, 'project.json'), 'utf8'));
if (!Array.isArray(project.assets) || project.assets.length !== 0) fail('R2 requires game/project.json assets to stay empty');

const assetManifest = await loadAssetManifest(root);
const content = await loadContentPacks(root);
for (const { entry, pack } of content.packs) {
  if (entry.role === 'asset-extension') fail(`Content manifest may not contain asset-extension roles: ${entry.path}`);
  if ((pack.assets?.length ?? 0) > 0) fail(`Content pack may not declare assets: ${entry.path}`);
  if ((pack.replaceAssets?.length ?? 0) > 0) fail(`replaceAssets is retired in R2: ${entry.path}`);
}

for (const path of [
  'content/zz-art-v1.json',
  'content/zzz-scene-art-v1.json',
  'content/zzzz-anomaly-art-v1.json'
]) if (await exists(resolve(game, path))) fail(`Retired asset overlay returned: game/${path}`);

for (const path of [
  'assets/4k/characters/linwan/base.png',
  'assets/4k/characters/linwan/normal.png',
  'assets/4k/runtime/characters/linwan/base.webp',
  'assets/4k/runtime/characters/linwan/normal.webp'
]) if (await exists(resolve(game, path))) fail(`Retired Lin Wan alias returned: game/${path}`);

if (await exists(resolve(root, 'scripts/generate-scenes.mjs'))) fail('Legacy generated-scenes generator returned');

const sad = assetManifest.extras.find(asset => asset.id === 'linwan/sad');
if (!sad) fail('Completed Lin Wan sad extra must remain explicitly registered');
for (const path of [sad.src, sad.master]) if (!(await exists(resolve(game, path)))) fail(`Registered extra is missing: game/${path}`);
if (assetManifest.production.some(asset => asset.id === 'linwan/sad')) fail('Lin Wan sad is an extra, not a current production reference');

const audio = JSON.parse(await readFile(resolve(game, 'audio.json'), 'utf8'));
if (!Array.isArray(audio.assets) || audio.assets.length !== 21) fail(`Expected 21 audio assets, got ${audio.assets?.length ?? 0}`);
const staticIds = new Set(assetManifest.production.map(asset => asset.id));
for (const asset of audio.assets) if (staticIds.has(asset.id)) fail(`Audio/static asset ID collision: ${asset.id}`);

console.log(JSON.stringify({
  status: 'asset-schema-r2-ok',
  staticProduction: assetManifest.production.length,
  extras: assetManifest.extras.length,
  audio: audio.assets.length,
  totalRuntimeAssets: assetManifest.production.length + audio.assets.length
}, null, 2));
