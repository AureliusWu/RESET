import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { applyScenarioR1, loadScenarioR1 } from './r1-scenario.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = resolve(root, 'game/content');
const outputName = 'zzzzzz-r1-generated.json';
let project = JSON.parse(await readFile(resolve(root, 'game/project.json'), 'utf8'));
const files = (await readdir(contentDir)).filter(name => name.endsWith('.json') && name !== outputName).sort();

function applyPack(project, pack) {
  const scenes = new Map(project.scenes.map(scene => [scene.id, scene]));
  for (const replacement of pack.replaceScenes ?? []) {
    if (!scenes.has(replacement.id)) throw new Error(`${pack.id}: cannot replace missing scene ${replacement.id}`);
    scenes.set(replacement.id, replacement);
  }
  for (const scene of pack.scenes ?? []) {
    if (scenes.has(scene.id)) throw new Error(`${pack.id}: duplicate scene ${scene.id}`);
    scenes.set(scene.id, scene);
  }
  return { ...project, ...(pack.version ? { version: pack.version } : {}), stats: { ...(project.stats ?? {}), ...(pack.stats ?? {}) }, scenes: [...scenes.values()] };
}

for (const name of files) project = applyPack(project, JSON.parse(await readFile(resolve(contentDir, name), 'utf8')));
const data = await loadScenarioR1(root);
const reconstructed = applyScenarioR1(project, data);
const pack = { id: 'r1-scenario-generated', replaceScenes: reconstructed.scenes };
await writeFile(resolve(contentDir, outputName), JSON.stringify(pack, null, 2) + '\n');
console.log(`R1 scenario materialized: ${reconstructed.scenes.length} scenes -> game/content/${outputName}`);
