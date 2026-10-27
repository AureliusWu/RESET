import { readFile } from 'node:fs/promises';
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

const han = /[\u3400-\u9fff]/g;
const bodyText = project.scenes.flatMap(scene => scene.lines ?? []).map(line => line.text ?? '').join('');
const searchText = project.scenes.flatMap(scene => scene.lines ?? []).map(line => `${line.speaker ?? ''}${line.text ?? ''}`).join('');
const hanCount = (bodyText.match(han) ?? []).length;
const lineCount = project.scenes.reduce((sum, scene) => sum + (scene.lines?.length ?? 0), 0);
const longLines = project.scenes.flatMap(scene => (scene.lines ?? []).filter(line => (line.text ?? '').length > 80).map(line => `${scene.id}:${line.id}:${line.text.length}`));
if (hanCount < 80000 || hanCount > 120000) throw new Error(`R1 scenario Han count ${hanCount} outside 80,000–120,000`);
if (project.scenes.length !== 82) throw new Error(`Expected exactly 82 scenes, got ${project.scenes.length}`);
if (longLines.length) throw new Error(`VN line length >80: ${longLines.slice(0, 8).join(', ')}`);

for (const scene of project.scenes) {
  const ids = (scene.lines ?? []).map(line => line.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate line id in scene ${scene.id}`);
}

const requiredEndings = ['bad-home','bad-station','death-fifth','death-sixth','route-linwan-open','route-xiaoman-open','route-xuqi-open','normal-linwan','normal-xiaoman','normal-xuqi','normal-tinglan','normal-tangli','normal-nanxing','bad-no-checkpoint','bad-permanent-save','true-end'];
const endings = new Set(project.scenes.map(scene => scene.ending).filter(Boolean));
for (const id of requiredEndings) if (!endings.has(id)) throw new Error(`Missing required ending ${id}`);

const supportCast = ['徐嘉树','程妍','顾明远','陈岚','许蓉','罗秀梅','苏遥','何川','纪尧','林澄','沈砚秋','梁成'];
const castMentions = Object.fromEntries(supportCast.map(name => [name, searchText.split(name).length - 1]));
for (const [name, count] of Object.entries(castMentions)) if (count < 3) throw new Error(`Supporting cast ${name} appears only ${count} times`);
const anchors = {linwan:['林澄'],xiaoman:['苏遥'],xuqi:['梁成'],tinglan:['沈砚秋','许蓉'],tangli:['何川'],nanxing:['纪尧']};
for (const [route,names] of Object.entries(anchors)) {
  const routeText = project.scenes.filter(scene => scene.id.includes(route)).flatMap(scene => scene.lines ?? []).map(line => `${line.speaker ?? ''}${line.text ?? ''}`).join('');
  if (!names.some(name => routeText.includes(name))) throw new Error(`Route ${route} lacks independent social anchor (${names.join('/')})`);
}
console.log(JSON.stringify({status:'scenario-r1-ok',scenes:project.scenes.length,lines:lineCount,han:hanCount,endings:endings.size,supportCast:castMentions},null,2));
