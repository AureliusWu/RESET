import { readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = resolve(new URL('..', import.meta.url).pathname);
const lock = JSON.parse(await readFile(resolve(root, 'ENGINE.lock.json'), 'utf8'));
const engine = resolve(process.env.VN_ENGINE_PATH || resolve(root, '..', 'VN-Engine-v2'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const projectFile = resolve(root, 'game/project.json');
const contentDir = resolve(root, 'game/content');
const audioFile = resolve(root, 'game/audio.json');
const buildProjectFile = resolve(root, 'game/.project.build.json');

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', encoding: 'utf8' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

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

async function loadContentPacks() {
  let files = [];
  try { files = (await readdir(contentDir)).filter(name => name.endsWith('.json')).sort(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return Promise.all(files.map(async name => JSON.parse(await readFile(resolve(contentDir, name), 'utf8'))));
}

function applyPack(project, pack) {
  if (!pack?.id) throw new Error('Content pack is missing id');
  const scenes = new Map(project.scenes.map(scene => [scene.id, scene]));
  for (const replacement of pack.replaceScenes ?? []) {
    if (!scenes.has(replacement.id)) throw new Error(`Content pack ${pack.id} cannot replace missing scene ${replacement.id}`);
    scenes.set(replacement.id, replacement);
  }
  for (const scene of pack.scenes ?? []) {
    if (scenes.has(scene.id)) throw new Error(`Content pack ${pack.id} duplicates scene ${scene.id}`);
    scenes.set(scene.id, scene);
  }
  const assets = [...project.assets, ...(pack.assets ?? [])];
  const ids = new Set();
  for (const asset of assets) {
    if (ids.has(asset.id)) throw new Error(`Duplicate asset id ${asset.id}`);
    ids.add(asset.id);
  }
  return {
    ...project,
    ...(pack.version ? { version: pack.version } : {}),
    stats: { ...(project.stats ?? {}), ...(pack.stats ?? {}) },
    scenes: [...scenes.values()],
    stage: mergeStage(project.stage, pack.stage),
    assets
  };
}

if (process.env.ALLOW_ENGINE_DRIFT !== '1') {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: engine, encoding: 'utf8' });
  if (head.status !== 0) throw new Error('VN Engine v2 repository is unavailable; set VN_ENGINE_PATH.');
  if (head.stdout.trim() !== lock.commit) throw new Error(`VN Engine v2 must be at ${lock.commit}; set ALLOW_ENGINE_DRIFT=1 only for deliberate engine development.`);
}

run(process.execPath, [resolve(root, 'scripts/generate-audio.mjs')], root);
let project = JSON.parse(await readFile(projectFile, 'utf8'));
for (const pack of await loadContentPacks()) project = applyPack(project, pack);
const audio = JSON.parse(await readFile(audioFile, 'utf8'));
const buildProject = {
  ...project,
  stage: mergeStage(project.stage, audio.stage),
  assets: [...project.assets, ...(audio.assets ?? [])]
};
await writeFile(buildProjectFile, JSON.stringify(buildProject, null, 2) + '\n');

try {
  run(npm, ['run', 'build'], engine);
  await rm(resolve(root, 'dist'), { recursive: true, force: true });
  run(process.execPath, [resolve(engine, 'tools/package-game.mjs'), buildProjectFile, resolve(root, 'dist')], root);
  console.log(`回留 ${buildProject.version} build completed with VN Engine v2 ${lock.version} @ ${lock.commit.slice(0, 12)}`);
} finally {
  await rm(buildProjectFile, { force: true });
}
