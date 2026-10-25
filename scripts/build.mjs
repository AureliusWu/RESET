import { readFile, rm, writeFile, readdir, copyFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const lock = JSON.parse(await readFile(resolve(root, 'ENGINE.lock.json'), 'utf8'));
const engine = resolve(process.env.VN_ENGINE_PATH || resolve(root, '..', 'VN-Engine-v2'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const projectFile = resolve(root, 'game/project.json');
const contentDir = resolve(root, 'game/content');
const audioFile = resolve(root, 'game/audio.json');
const buildProjectFile = resolve(root, 'game/.project.build.json');
const output = resolve(root, 'dist');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32' && /\.cmd$/i.test(command)
  });
  if (result.error) {
    console.error(`Failed to run ${command}:`, result.error);
    process.exit(1);
  }
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

  const assets = new Map((project.assets ?? []).map(asset => [asset.id, asset]));
  for (const replacement of pack.replaceAssets ?? []) {
    if (!assets.has(replacement.id)) throw new Error(`Content pack ${pack.id} cannot replace missing asset ${replacement.id}`);
    assets.set(replacement.id, replacement);
  }
  for (const asset of pack.assets ?? []) {
    if (assets.has(asset.id)) throw new Error(`Content pack ${pack.id} duplicates asset ${asset.id}`);
    assets.set(asset.id, asset);
  }

  return {
    ...project,
    ...(pack.version ? { version: pack.version } : {}),
    stats: { ...(project.stats ?? {}), ...(pack.stats ?? {}) },
    scenes: [...scenes.values()],
    stage: mergeStage(project.stage, pack.stage),
    assets: [...assets.values()]
  };
}

async function walkFiles(directory) {
  const result = [];
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const absolute = resolve(path, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else result.push({ name: relative(directory, absolute).split(sep).join('/'), bytes: await readFile(absolute) });
    }
  }
  await visit(directory);
  return result;
}

async function injectGameRuntime(project) {
  for (const file of ['README.md', 'LICENSE.md', 'CHANGELOG_v1.1.0.md']) {
    await copyFile(resolve(root, file), resolve(output, file));
  }
  for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css']) {
    await copyFile(resolve(root, 'game/runtime', file), resolve(output, file));
  }
  const htmlPath=resolve(output,'index.html');
  await writeFile(htmlPath,(await readFile(htmlPath,'utf8')).replace('</head>','<link rel="stylesheet" href="./experience.css"></head>'));
  const appPath = resolve(output, 'app.mjs');
  let app = await readFile(appPath, 'utf8');
  const pagehide = "window.addEventListener('pagehide',event=>{if(!event.persisted)game.dispose();});";
  if (!app.includes(pagehide)) throw new Error('VN Engine packaged app entry changed; RESET runtime injection needs review');
  app = app.replace(pagehide, "const [{mountCombatBridge},{mountMetaBridge},{mountArchiveBridge}]=await Promise.all([import('./combat.mjs'),import('./meta.mjs'),import('./archive.mjs')]);const combat=mountCombatBridge(game),meta=mountMetaBridge(game),archive=mountArchiveBridge(game,project,meta);window.addEventListener('pagehide',event=>{if(!event.persisted){archive.dispose();meta.dispose();combat.dispose();game.dispose();}});");
  await writeFile(appPath, app);

  const { fingerprintFiles, renderWorker } = await import(pathToFileURL(resolve(engine, 'tools/pwa.mjs')).href);
  const packagedManifest = JSON.parse(await readFile(resolve(output, 'build-manifest.json'), 'utf8'));
  const core = (await walkFiles(output)).filter(file => !['sw.js', 'build-manifest.json'].includes(file.name));
  const fingerprint = fingerprintFiles(core);
  const worker = Buffer.from(renderWorker({ namespace: 'vn-self-' + project.game, version: fingerprint, urls: core.map(file => file.name) }));
  await writeFile(resolve(output, 'sw.js'), worker);
  const finalFiles = [...core, { name: 'sw.js', bytes: worker }];
  const metadata = {
    schema: 1,
    game: project.game,
    version: project.version,
    engine: packagedManifest.engine,
    contentFingerprint: fingerprint,
    extensions: ['reset-combat-v1', 'reset-meta-v1', 'reset-portrait-set-v1', 'reset-scene-art-v1', 'reset-archive-v1', 'reset-responsive-v1'],
    files: finalFiles.map(file => ({ name: file.name, size: file.bytes.length, sha256: createHash('sha256').update(file.bytes).digest('hex') }))
  };
  await writeFile(resolve(output, 'build-manifest.json'), JSON.stringify(metadata, null, 2) + '\n');
}

if (process.env.ALLOW_ENGINE_DRIFT !== '1') {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: engine, encoding: 'utf8' });
  if (head.status !== 0) throw new Error('VN Engine v2 repository is unavailable; set VN_ENGINE_PATH.');
  if (head.stdout.trim() !== lock.commit) throw new Error(`VN Engine v2 must be at ${lock.commit}; set ALLOW_ENGINE_DRIFT=1 only for deliberate engine development.`);
}

run(process.execPath, [resolve(root, 'scripts/generate-audio.mjs')], root);
run(process.execPath, [resolve(root, 'scripts/generate-portraits.mjs')], root);
run(process.execPath, [resolve(root, 'scripts/generate-scenes.mjs')], root);
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
  await rm(output, { recursive: true, force: true });
  run(process.execPath, [resolve(engine, 'tools/package-game.mjs'), buildProjectFile, output], root);
  await injectGameRuntime(buildProject);
  console.log(`回留 ${buildProject.version} build completed with VN Engine v2 ${lock.version} @ ${lock.commit.slice(0, 12)} + RESET combat/meta/production-art runtime`);
} finally {
  await rm(buildProjectFile, { force: true });
}
