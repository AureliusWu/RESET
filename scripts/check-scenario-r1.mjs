import { readFile } from 'node:fs/promises';
import { resolve, fileURLToPath } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const project = JSON.parse(await readFile(resolve(root, 'dist/project.json'), 'utf8'));
const han = text => [...String(text ?? '').matchAll(/[\p{Script=Han}]/gu)].length;

const scenes = project.scenes ?? [];
if (scenes.length !== 82) throw new Error(`Scenario R1 requires 82 scenes; got ${scenes.length}`);

const lineIds = [];
let narrativeHan = 0;
for (const scene of scenes) {
  for (const line of scene.lines ?? []) {
    if (line.id) lineIds.push(line.id);
    narrativeHan += han(line.text);
    if (line.variant?.text) narrativeHan += han(line.variant.text);
  }
  for (const choice of scene.choices ?? []) narrativeHan += han(choice.text);
}
if (narrativeHan < 80000 || narrativeHan > 120000) {
  throw new Error(`Scenario R1 playable Han count must be 80,000–120,000; got ${narrativeHan}`);
}
if (lineIds.length !== new Set(lineIds).size) throw new Error('Scenario R1 contains duplicate line ids');

const endingIds = new Set(scenes.map(scene => scene.ending).filter(Boolean));
const requiredEndings = [
  'bad-home','bad-station','death-fifth','death-sixth','bad-no-checkpoint','bad-permanent-save',
  'normal-linwan','normal-xiaoman','normal-xuqi','normal-tinglan','normal-tangli','normal-nanxing','true-end'
];
for (const ending of requiredEndings) {
  if (!endingIds.has(ending)) throw new Error(`Scenario R1 lost canonical ending: ${ending}`);
}

const allText = scenes.flatMap(scene => scene.lines ?? []).map(line => `${line.speaker ?? ''}\n${line.text ?? ''}`).join('\n');
const supportCast = ['赵屿','苏沅','徐培青','陈岚','梁初夏','方芸','孟知秋','高原','胡一鸣','姚婧','魏师傅','罗伯'];
const appearances = Object.fromEntries(supportCast.map(name => [name, allText.split(name).length - 1]));
const recurring = Object.entries(appearances).filter(([, count]) => count >= 2).length;
if (recurring < 8) throw new Error(`Scenario R1 requires at least 8 recurring supporting characters; got ${recurring}`);

const requiredScenes = ['prologue_1842','faceless_first','faceless_second','route_focus_choice','c5_echo_chen','chapter6_gate','c7_credits'];
const sceneIds = new Set(scenes.map(scene => scene.id));
for (const id of requiredScenes) if (!sceneIds.has(id)) throw new Error(`Scenario R1 lost structural scene: ${id}`);

console.log(JSON.stringify({
  status: 'scenario-r1-ok',
  scenes: scenes.length,
  lines: lineIds.length,
  narrativeHan,
  endings: endingIds.size,
  recurringSupportingCast: recurring,
  appearances
}, null, 2));
