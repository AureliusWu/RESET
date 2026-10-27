import { readFile, readdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyScenarioR1, loadScenarioR1 } from './r1-scenario.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = resolve(root, 'game/content');
const legacyGenerated = 'zzzzzz-r1-generated.json';
const canonicalPrefix = 'zzzzz-r1-chapter-';
const han = /[\u3400-\u9fff]/g;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`);
}

function applyPack(project, pack) {
  if (!pack?.id) throw new Error('Content pack is missing id');
  const scenes = new Map(project.scenes.map(scene => [scene.id, scene]));
  for (const replacement of pack.replaceScenes ?? []) {
    if (!scenes.has(replacement.id)) throw new Error(`${pack.id}: cannot replace missing scene ${replacement.id}`);
    scenes.set(replacement.id, replacement);
  }
  for (const scene of pack.scenes ?? []) {
    if (scenes.has(scene.id)) throw new Error(`${pack.id}: duplicate scene ${scene.id}`);
    scenes.set(scene.id, scene);
  }
  return {
    ...project,
    ...(pack.version ? { version: pack.version } : {}),
    stats: { ...(project.stats ?? {}), ...(pack.stats ?? {}) },
    scenes: [...scenes.values()]
  };
}

let project = JSON.parse(await readFile(resolve(root, 'game/project.json'), 'utf8'));
const files = (await readdir(contentDir))
  .filter(name => name.endsWith('.json') && name !== legacyGenerated && !name.startsWith(canonicalPrefix))
  .sort();
for (const name of files) {
  project = applyPack(project, JSON.parse(await readFile(resolve(contentDir, name), 'utf8')));
}

const reconstructed = applyScenarioR1(project, await loadScenarioR1(root));
const hanCount = reconstructed.scenes
  .flatMap(scene => scene.lines ?? [])
  .reduce((sum, line) => sum + ((line.text ?? '').match(han) ?? []).length, 0);
if (reconstructed.scenes.length !== 82) throw new Error(`Expected 82 R1 scenes, got ${reconstructed.scenes.length}`);
if (hanCount !== 81351) throw new Error(`Expected validated R1 corpus at 81,351 Han, got ${hanCount}`);

for (let chapter = 1; chapter <= 7; chapter++) {
  const scenes = reconstructed.scenes.filter(scene => scene.chapter === chapter);
  if (!scenes.length) throw new Error(`Chapter ${chapter} has no scenes`);
  const pack = {
    id: `r1-scenario-chapter-${String(chapter).padStart(2, '0')}`,
    chapter,
    source: 'R1 Scenario Reconstruction — committed source of truth',
    replaceScenes: scenes
  };
  const file = resolve(contentDir, `${canonicalPrefix}${String(chapter).padStart(2, '0')}.json`);
  await writeFile(file, JSON.stringify(pack, null, 2) + '\n');
}

const packagePath = resolve(root, 'package.json');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
delete pkg.scripts.prebuild;
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');

const buildPath = resolve(root, 'scripts/build.mjs');
let build = await readFile(buildPath, 'utf8');
const buildOld = ".filter(name => name.endsWith('.json')).sort();";
const buildNew = ".filter(name => name.endsWith('.json') && name !== 'zzzzzz-r1-generated.json').sort();";
if (!build.includes(buildOld) && !build.includes(buildNew)) throw new Error('build.mjs content-pack filter changed unexpectedly');
build = build.replace(buildOld, buildNew);
await writeFile(buildPath, build);

const checkPath = resolve(root, 'scripts/check-scenario.mjs');
let check = await readFile(checkPath, 'utf8');
check = check.replace("import { applyScenarioR1, loadScenarioR1 } from './r1-scenario.mjs';\n", '');
check = check.replace("\nproject = applyScenarioR1(project, await loadScenarioR1(root));", '');
if (check.includes('applyScenarioR1') || check.includes('loadScenarioR1')) throw new Error('Scenario gate still depends on generated R1 text');
await writeFile(checkPath, check);

const docsPath = resolve(root, 'docs/SCENARIO_R1.md');
let docs = await readFile(docsPath, 'utf8');
const oldCompatibility = 'R1 以 `game/scenario-r1.json`（人物/场景种子）+ `scripts/r1-scenario.mjs`（确定性重构器）存在。`npm run prebuild` 会生成最后覆盖层 `game/content/zzzzzz-r1-generated.json`，只替换 scene 正文对象，并继承当前完整 scene 的选择、下一场、结局、CG、角色、背景和 continuation 字段。生成文件不作为手工编辑源；既有章节源文件继续保留，便于追溯骨架与比较重构前后差异。';
const newCompatibility = 'R1 正式正文已经落盘为 `game/content/zzzzz-r1-chapter-01.json` 至 `zzzzz-r1-chapter-07.json`，这 7 个文件是后续人工通读、校稿、口吻修订与演出调整的唯一正文源。Build 与 `scenario:check` 直接消费这些已提交文本，不再在 `prebuild` 阶段重新生成 8 万字正文。`game/scenario-r1.json` 与 `scripts/r1-scenario.mjs` 仅保留为 R1 重构来源与可追溯工具，不得自动覆盖已人工编辑的正式章节。旧的 `game/content/zzzzzz-r1-generated.json` 继续被忽略且构建明确排除，仅作为历史生成路径兼容项。';
if (!docs.includes(oldCompatibility)) throw new Error('SCENARIO_R1 compatibility paragraph changed unexpectedly');
docs = docs.replace(oldCompatibility, newCompatibility);
await writeFile(docsPath, docs);

const workflowPath = resolve(root, '.github/workflows/build.yml');
let workflow = await readFile(workflowPath, 'utf8');
workflow = workflow.replace(/\npermissions:\n  contents: write\n/, '');
workflow = workflow.replace(/\n      # scenario-source-finalize:start[\s\S]*?      # scenario-source-finalize:end\n/, '\n');
await writeFile(workflowPath, workflow);

await unlink(fileURLToPath(import.meta.url));

run('git', ['config', 'user.name', 'github-actions[bot]']);
run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
run('git', ['add', '-A']);
run('git', ['diff', '--cached', '--check']);
run('git', ['commit', '-m', 'refactor(scenario): commit R1 chapters as source of truth']);
run('git', ['push', 'origin', 'HEAD:main']);
console.log(`Committed canonical R1 scenario source: 7 chapters, 82 scenes, ${hanCount.toLocaleString('en-US')} Han.`);
