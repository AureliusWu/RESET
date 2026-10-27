import { readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contentDir = resolve(root, 'game/content');

function mergeStage(left = {}, right = {}) {
  return {
    ...left,
    ...right,
    defaults: { ...(left.defaults ?? {}), ...(right.defaults ?? {}) },
    speakers: { ...(left.speakers ?? {}), ...(right.speakers ?? {}) },
    scenes: { ...(left.scenes ?? {}), ...(right.scenes ?? {}) },
    lines: { ...(left.lines ?? {}), ...(right.lines ?? {}) }
  };
}

const legacy = [];
for (let chapter = 2; chapter <= 6; chapter++) {
  const path = `game/content/chapter${chapter}.json`;
  const raw = execFileSync('git', ['show', `origin/main:${path}`], { cwd: root, encoding: 'utf8' });
  const pack = JSON.parse(raw);
  const allowed = new Set(['id','version','stats','replaceScenes','scenes','stage','assets']);
  const unknown = Object.keys(pack).filter(key => !allowed.has(key));
  if (unknown.length) throw new Error(`${path}: unknown non-scene keys would be lost: ${unknown.join(', ')}`);
  legacy.push(pack);
}

const project = JSON.parse(await readFile(resolve(root, 'game/project.json'), 'utf8'));
const baseAssetIds = new Set((project.assets ?? []).map(asset => asset.id));
const runtime = {
  id: 'runtime-content',
  source: 'R2 canonical non-scene runtime metadata',
  stats: {},
  stage: {},
  assets: []
};
const supportAssetIds = new Set();

for (const pack of legacy) {
  runtime.stats = { ...runtime.stats, ...(pack.stats ?? {}) };
  runtime.stage = mergeStage(runtime.stage, pack.stage);
  for (const asset of pack.assets ?? []) {
    if (baseAssetIds.has(asset.id)) throw new Error(`Legacy support asset duplicates base project asset: ${asset.id}`);
    if (supportAssetIds.has(asset.id)) throw new Error(`Duplicate legacy support asset: ${asset.id}`);
    supportAssetIds.add(asset.id);
    runtime.assets.push(asset);
  }
}

if (Object.keys(runtime.stats).length !== 12) throw new Error(`Expected 12 preserved stat keys, got ${Object.keys(runtime.stats).length}`);
if (!runtime.assets.length) throw new Error('Expected preserved runtime asset registrations');
if (runtime.scenes || runtime.replaceScenes) throw new Error('runtime.json must never contain scenes');

await writeFile(resolve(contentDir, 'runtime.json'), JSON.stringify(runtime, null, 2) + '\n');

const manifestPath = resolve(contentDir, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.packs = manifest.packs.filter(entry => entry.path !== 'runtime.json');
manifest.packs.unshift({ path: 'runtime.json', role: 'runtime' });
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

await rm(resolve(root, 'scripts/r2-runtime-support.mjs'));
console.log(JSON.stringify({
  status: 'r2-runtime-preserved',
  stats: Object.keys(runtime.stats),
  stageScenes: Object.keys(runtime.stage.scenes ?? {}).length,
  stageLines: Object.keys(runtime.stage.lines ?? {}).length,
  assets: runtime.assets.length
}, null, 2));
