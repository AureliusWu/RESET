import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contentDir = resolve(root, 'game/content');
const chaptersDir = resolve(contentDir, 'chapters');

if (await readFile(resolve(contentDir, 'manifest.json'), 'utf8').then(() => true).catch(() => false)) {
  console.log('R2 content schema already materialized');
  process.exit(0);
}

await mkdir(chaptersDir, { recursive: true });
const chapterEntries = [];
const allScenes = [];

for (let chapter = 1; chapter <= 7; chapter++) {
  const nn = String(chapter).padStart(2, '0');
  const oldPath = resolve(contentDir, `zzzzz-r1-chapter-${nn}.json`);
  const oldPack = JSON.parse(await readFile(oldPath, 'utf8'));
  if (!Array.isArray(oldPack.replaceScenes) || oldPack.replaceScenes.length === 0) {
    throw new Error(`${oldPath} has no R1 replaceScenes payload`);
  }
  for (const scene of oldPack.replaceScenes) {
    if (scene.chapter !== chapter) throw new Error(`${scene.id}: expected chapter ${chapter}, got ${scene.chapter}`);
    allScenes.push(scene);
  }
  const canonical = {
    id: `chapter-${nn}`,
    chapter,
    source: 'R2 canonical scenario source',
    scenes: oldPack.replaceScenes
  };
  await writeFile(resolve(chaptersDir, `${nn}.json`), JSON.stringify(canonical, null, 2) + '\n');
  chapterEntries.push({ path: `chapters/${nn}.json`, role: 'chapter', chapter });
}

const ids = allScenes.map(scene => scene.id);
const hanCount = (allScenes.flatMap(scene => scene.lines ?? []).map(line => line.text ?? '').join('').match(/[\u3400-\u9fff]/g) ?? []).length;
console.log(JSON.stringify({ scenes: allScenes.length, uniqueScenes: new Set(ids).size, han: hanCount }, null, 2));
if (allScenes.length !== 82) throw new Error(`Expected 82 canonical scenes, got ${allScenes.length}`);
if (new Set(ids).size !== ids.length) throw new Error('Canonical scene IDs are not unique');
if (hanCount !== 81351) throw new Error(`R2 migration baseline mismatch: expected 81351 Han, got ${hanCount}`);

const projectPath = resolve(root, 'game/project.json');
const project = JSON.parse(await readFile(projectPath, 'utf8'));
project.scenes = [];
await writeFile(projectPath, JSON.stringify(project, null, 2) + '\n');

for (let chapter = 1; chapter <= 7; chapter++) {
  const nn = String(chapter).padStart(2, '0');
  await rm(resolve(contentDir, `zzzzz-r1-chapter-${nn}.json`));
}
for (const legacy of ['chapter2.json','chapter3.json','chapter4.json','chapter5.json','chapter6.json']) {
  await rm(resolve(contentDir, legacy));
}

const manifest = {
  schema: 1,
  source: 'R2 Content Schema',
  packs: [
    ...chapterEntries,
    { path: 'zz-art-v1.json', role: 'asset-extension' },
    { path: 'zzz-scene-art-v1.json', role: 'asset-extension' },
    { path: 'zzzz-anomaly-art-v1.json', role: 'asset-extension' },
    { path: 'zzzz-release-v1.json', role: 'release' }
  ]
};
await writeFile(resolve(contentDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const loader = `import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

export async function loadContentPacks(root) {
  const contentDir = resolve(root, 'game/content');
  const manifest = JSON.parse(await readFile(resolve(contentDir, 'manifest.json'), 'utf8'));
  if (manifest.schema !== 1 || !Array.isArray(manifest.packs) || manifest.packs.length === 0) {
    throw new Error('game/content/manifest.json must declare schema 1 and a non-empty packs array');
  }
  const seenPaths = new Set();
  const packs = [];
  for (const entry of manifest.packs) {
    if (!entry || typeof entry.path !== 'string' || !entry.path.endsWith('.json')) throw new Error('Invalid content manifest entry');
    if (seenPaths.has(entry.path)) throw new Error('Duplicate content manifest path: ' + entry.path);
    seenPaths.add(entry.path);
    const absolute = resolve(contentDir, entry.path);
    const rel = relative(contentDir, absolute);
    if (rel === '..' || rel.startsWith('..' + sep)) throw new Error('Content pack escapes game/content: ' + entry.path);
    const pack = JSON.parse(await readFile(absolute, 'utf8'));
    if (!pack?.id) throw new Error('Content pack ' + entry.path + ' is missing id');
    packs.push({ entry, pack });
  }
  return { manifest, packs };
}
`;
await writeFile(resolve(root, 'scripts/content-packs.mjs'), loader);

const buildPath = resolve(root, 'scripts/build.mjs');
let build = await readFile(buildPath, 'utf8');
if (!build.includes("import { loadContentPacks } from './content-packs.mjs';")) {
  build = build.replace("import { pngIcon } from './pwa-assets.mjs';", "import { pngIcon } from './pwa-assets.mjs';\nimport { loadContentPacks } from './content-packs.mjs';");
}
build = build.replace("const contentDir = resolve(root, 'game/content');\n", '');
build = build.replace(/async function loadContentPacks\(\) \{[\s\S]*?\n\}\n\n(?=function applyPack)/, '');
build = build.replace(/  for \(const replacement of pack\.replaceScenes \?\? \[\]\) \{[\s\S]*?\n  \}\n(?=  for \(const scene of pack\.scenes)/, '');
build = build.replace('for (const pack of await loadContentPacks()) project = applyPack(project, pack);', 'for (const { pack } of (await loadContentPacks(root)).packs) project = applyPack(project, pack);');
if (build.includes('async function loadContentPacks()') || build.includes('pack.replaceScenes')) throw new Error('Legacy scene overlay logic remains in build.mjs');
if (!build.includes('(await loadContentPacks(root)).packs')) throw new Error('build.mjs did not switch to manifest loader');
await writeFile(buildPath, build);

const scenarioPath = resolve(root, 'scripts/check-scenario.mjs');
let scenario = await readFile(scenarioPath, 'utf8');
const hanIndex = scenario.indexOf('\nconst han = ');
if (hanIndex < 0) throw new Error('Cannot locate scenario gate body');
const gateBody = scenario.slice(hanIndex).replace(
  "if (project.scenes.length < 82) throw new Error(`Expected at least 82 scenes, got ${project.scenes.length}`);",
  "if (project.scenes.length !== 82) throw new Error(`Expected exactly 82 scenes, got ${project.scenes.length}`);"
);
const preamble = `import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { loadContentPacks } from './content-packs.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let project = JSON.parse(await readFile(resolve(root, 'game/project.json'), 'utf8'));
if (!Array.isArray(project.scenes) || project.scenes.length !== 0) throw new Error('R2 content schema requires game/project.json scenes to stay empty');
const { packs } = await loadContentPacks(root);
const chapterPacks = packs.filter(({ entry }) => entry.role === 'chapter');
if (chapterPacks.length !== 7) throw new Error('Expected 7 canonical chapter packs, got ' + chapterPacks.length);
const expectedChapters = [1,2,3,4,5,6,7];
if (chapterPacks.some(({ entry }, index) => entry.chapter !== expectedChapters[index])) throw new Error('Canonical chapters must be ordered 1..7 in manifest.json');

const canonicalSceneIds = new Set();
for (const { entry, pack } of chapterPacks) {
  if (Array.isArray(pack.replaceScenes) && pack.replaceScenes.length) throw new Error(entry.path + ': replaceScenes is retired in R2');
  if (!Array.isArray(pack.scenes) || pack.scenes.length === 0) throw new Error(entry.path + ': canonical chapter has no scenes');
  for (const scene of pack.scenes) {
    if (scene.chapter !== entry.chapter) throw new Error(scene.id + ': chapter metadata mismatch');
    if (canonicalSceneIds.has(scene.id)) throw new Error('Duplicate canonical scene ' + scene.id);
    canonicalSceneIds.add(scene.id);
  }
}
for (const { entry, pack } of packs) {
  if (Array.isArray(pack.replaceScenes) && pack.replaceScenes.length) throw new Error(entry.path + ': replaceScenes is retired in R2');
  const scenes = new Map(project.scenes.map(scene => [scene.id, scene]));
  for (const scene of pack.scenes ?? []) {
    if (scenes.has(scene.id)) throw new Error(entry.path + ': duplicate scene ' + scene.id);
    scenes.set(scene.id, scene);
  }
  project = { ...project, ...(pack.version ? { version: pack.version } : {}), stats: { ...(project.stats ?? {}), ...(pack.stats ?? {}) }, scenes: [...scenes.values()] };
}
`;
await writeFile(scenarioPath, preamble + gateBody);

await rm(resolve(root, 'scripts/r2-content-migrate.mjs'));
console.log('R2 content schema migration materialized successfully');
