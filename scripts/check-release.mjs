import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const project = JSON.parse(await readFile(resolve(dist, 'project.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(dist, 'build-manifest.json'), 'utf8'));
const app = await readFile(resolve(dist, 'app.mjs'), 'utf8');
const sw = await readFile(resolve(dist, 'sw.js'), 'utf8');

function assert(condition, message) { if (!condition) throw new Error(message); }
async function exists(path) { try { await access(path); return true; } catch { return false; } }

assert(project.game === 'reset', 'wrong game id');
assert(project.version === manifest.version, 'project/build manifest version mismatch');
assert(Array.isArray(manifest.extensions), 'build extensions missing');
for (const extension of ['reset-combat-v1','reset-meta-v1','reset-portrait-set-v1','reset-scene-art-v1','reset-archive-v1','reset-responsive-v1','reset-ui-key-visual-v1']) assert(manifest.extensions.includes(extension), `missing extension ${extension}`);
for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs','icon-192.png','icon-512.png','project.json','sw.js','app.mjs','manifest.webmanifest']) assert(await exists(resolve(dist, file)), `missing ${file}`);
assert(app.includes("import('./combat.mjs')") && app.includes("import('./meta.mjs')"), 'runtime bridges are not mounted');
assert(sw.includes('combat.mjs') && sw.includes('meta.mjs'), 'runtime bridges are not offline cached');
assert(app.includes("import('./archive.mjs')"), 'archive runtime is not mounted');
const html=await readFile(resolve(dist,'index.html'),'utf8');
assert(html.includes('href="./experience.css"'), 'responsive stylesheet is not loaded');
for(const file of ['archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs','icon-192.png','icon-512.png'])assert(sw.includes(file),`${file} not cached`);
const uiVisuals=['title-key-visual','save-anomaly','ending-collection-header','cg-gallery-header','combat-hud-key-visual'];
for(const id of uiVisuals){const path=`assets/4k/runtime/ui/${id}.webp`,bytes=await readFile(resolve(dist,path));const record=manifest.files.find(file=>file.name===path);assert(record?.size===bytes.length&&record.sha256===createHash('sha256').update(bytes).digest('hex'),`UI key visual missing/stale in final manifest: ${id}`);assert(sw.includes(path),`UI key visual not offline cached: ${id}`);}
const uiRuntime=await readFile(resolve(dist,'ui.mjs'),'utf8');for(const id of uiVisuals)assert(uiRuntime.includes(`${id}.webp`),`UI key visual is not wired: ${id}`);

const scenes = new Map(project.scenes.map(scene => [scene.id, scene]));
const encounters = [
  ['faceless_first','watch_reflection','rush_forward'],
  ['faceless_second','change_read','repeat_old'],
  ['c5_echo_fail','break_habit','repeat_dodge']
];
for (const [sceneId, win, lose] of encounters) {
  const scene = scenes.get(sceneId); assert(scene, `missing combat scene ${sceneId}`);
  const actions = new Set((scene.choices ?? []).map(choice => choice.id));
  assert(actions.has(win) && actions.has(lose), `combat scene ${sceneId} lost canonical win/lose actions`);
}

const endings = new Set(project.scenes.map(scene => scene.ending).filter(Boolean));
for (const id of ['normal-linwan','normal-xiaoman','normal-xuqi','normal-tinglan','normal-tangli','normal-nanxing','bad-permanent-save','true-end']) assert(endings.has(id), `missing ending ${id}`);

const cast = ['linwan','xiaoman','xuqi','tinglan','tangli','nanxing'];
const expressions = ['neutral','smile','worried','surprised','serious'];
const assetMap = new Map(project.assets.map(asset => [asset.id, asset]));
const portraitSources = new Set();
for (const character of cast) for (const expression of expressions) {
  const id = `${character}/${expression}`, asset = assetMap.get(id);
  assert(asset?.kind === 'portrait', `missing production portrait ${id}`);
  assert(asset.src.includes('generated-portraits/') || asset.src === `assets/4k/runtime/characters/${character}/${expression}.webp`, `${id} still points at legacy placeholder art`);
  assert(!String(asset.alt ?? '').includes('占位'), `${id} is still labelled placeholder`);
  portraitSources.add(asset.src);
  assert(await exists(resolve(dist, asset.src)), `portrait file missing from package: ${asset.src}`);
  assert(sw.includes(asset.src), `portrait not offline cached: ${asset.src}`);
}
const xuqiAngry = assetMap.get('xuqi/angry');
assert(xuqiAngry?.src === 'assets/generated-portraits/xuqi/angry.svg' || xuqiAngry?.src === 'assets/4k/runtime/characters/xuqi/angry.webp', 'Xu Qi angry expression is not a production sprite');
assert(await exists(resolve(dist, xuqiAngry.src)), 'Xu Qi angry production sprite missing');
assert(portraitSources.size === 30, 'five-expression heroine variants are not distinct files');
for(const asset of project.assets.filter(a=>a.src.startsWith('assets/4k/runtime/'))){
  const bytes=await readFile(resolve(dist,asset.src));
  const record=manifest.files.find(f=>f.name===asset.src);
  assert(record?.size===bytes.length&&record.sha256===createHash('sha256').update(bytes).digest('hex'),`4K runtime missing/stale in final manifest: ${asset.id}`);
  assert(sw.includes(asset.src),`4K runtime missing from offline cache: ${asset.id}`);
}

const productionScenes = [
  'classroom-rain','school-gate-rain','school-gate-evening','home-corridor','station-night','night-wucheng','school-morning','archive-room','cafeteria','rooftop-evening',
  'stairwell-morning','riverside-dusk','underpass-rain','classroom-dawn','old-art-room','night-art-room','old-stationery','north-station','save-room','true-dawn'
];
const productionCgs = ['faceless-reflection-cg','letter-1842-cg','six-chairs-cg','linwan-1842-cg','true-end-riverside-cg'];
for (const id of [...productionScenes, ...productionCgs]) {
  const asset = assetMap.get(id); assert(asset, `missing production scene asset ${id}`);
  const category = productionScenes.includes(id) ? 'backgrounds' : 'cg';
  assert(asset.src === `assets/4k/runtime/${category}/${id}.webp` || (category==='cg' && asset.src===`assets/generated-scenes/${id}.svg`), `${id} has an unexpected production art path`);
  assert(!String(asset.alt ?? '').includes('占位'), `${id} is still labelled placeholder`);
  assert(await exists(resolve(dist, asset.src)), `scene art missing from package: ${asset.src}`);
  assert(sw.includes(asset.src), `scene art not offline cached: ${asset.src}`);
}

const finaleScore = ['music-no-save','music-tomorrow'];
for (const id of finaleScore) {
  const asset = assetMap.get(id);
  assert(asset?.kind === 'audio', `missing finale score ${id}`);
  assert(await exists(resolve(dist, asset.src)), `finale score missing from package: ${asset.src}`);
  assert(sw.includes(asset.src), `finale score not offline cached: ${asset.src}`);
}
const noSaveMusicScenes = ['c5_anchor_truth','c5_request','c5_1842','chapter6_gate','c6_no_save','c6_echo_goodbye'];
const tomorrowMusicScenes = ['c7_morning','c7_after','c7_linwan','c7_credits'];
for (const id of noSaveMusicScenes) assert(project.stage?.scenes?.[id]?.music === 'music-no-save', `no-save theme missing from ${id}`);
for (const id of tomorrowMusicScenes) assert(project.stage?.scenes?.[id]?.music === 'music-tomorrow', `tomorrow theme missing from ${id}`);

const finalScenes = ['c6_no_save','c6_walk_forward','c6_echo_goodbye','c6_last_door','c7_morning','c7_linwan','c7_credits'];
for (const id of finalScenes) assert(scenes.has(id), `missing irreversible/true ending scene ${id}`);

const listed = new Set(manifest.files.map(file => file.name));
for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs','icon-192.png','icon-512.png']) assert(listed.has(file), `${file} absent from integrity manifest`);

// Round 2: verify all eight shipped derivatives, including currently unreferenced
// sad/base/normal, against their source bytes and the final integrity manifest.
for (const expression of ['base','normal','neutral','smile','worried','sad','surprised','serious']) {
  const path = `assets/4k/runtime/characters/linwan/${expression}.webp`;
  const bytes = await readFile(resolve(dist, path));
  const source = await readFile(resolve(root, 'game', path));
  assert(bytes.equals(source), `packaged Lin Wan derivative differs from source: ${path}`);
  const record = manifest.files.find(file => file.name === path);
  assert(record?.size === bytes.length && record.sha256 === createHash('sha256').update(bytes).digest('hex'), `Lin Wan derivative missing or stale in manifest: ${path}`);
  assert(sw.includes(path), `Lin Wan derivative absent from offline cache: ${path}`);
}
for (const expression of expressions) assert(assetMap.get(`linwan/${expression}`)?.src === `assets/4k/runtime/characters/linwan/${expression}.webp`, `Lin Wan production reference regressed: ${expression}`);

console.log(JSON.stringify({
  status: 'release-integrity-ok', version: project.version, scenes: project.scenes.length,
  assets: project.assets.length, endings: endings.size, productionPortraits: portraitSources.size + 1,
  productionBackgrounds: productionScenes.length, productionCGs: productionCgs.length,
  finaleScore: finaleScore.length, extensions: manifest.extensions
}, null, 2));
