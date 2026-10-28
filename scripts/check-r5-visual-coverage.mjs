import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentPacks } from './content-packs.mjs';
import { loadAssetManifest } from './assets.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const finalMode = process.argv.includes('--final');
const policy = JSON.parse(await readFile(resolve(game, 'visual/r5-speaker-policy.json'), 'utf8'));
const functionalPatterns = (policy.functionalSpeakerPatterns ?? []).map(pattern => new RegExp(pattern));
const assetManifest = await loadAssetManifest(root);
const assets = new Map(assetManifest.production.map(asset => [asset.id, asset]));
const { packs } = await loadContentPacks(root);
const scenes = packs.filter(({ entry }) => entry.role === 'chapter').flatMap(({ pack }) => pack.scenes ?? []);
const project = JSON.parse(await readFile(resolve(game, 'project.json'), 'utf8'));
const runtimeSpeakerMap = Object.assign(
  {},
  project.stage?.speakers ?? {},
  ...packs.map(({ pack }) => pack.stage?.speakers ?? {})
);

const fail = message => { throw new Error(message); };
const speakerCounts = new Map();
const unknownSpeakers = new Map();
const pendingSpeakers = new Map();
const missingPortraits = [];
const runtimeMappingMisses = [];
const expressionMisses = [];
const backgroundMisses = [];
const cgMisses = [];
let dialogueLines = 0;
let portraitLines = 0;
let deliberatelyNoPortraitLines = 0;
let explicitCgScenes = 0;

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function resolveSpeaker(name) {
  const direct = policy.speakers?.[name];
  if (direct) return direct;
  if (functionalPatterns.some(pattern => pattern.test(name))) return { mode: 'functional' };
  return null;
}

for (const scene of scenes) {
  const background = assets.get(scene.background);
  if (!scene.background || background?.kind !== 'background') {
    backgroundMisses.push(`${scene.id}:${scene.background ?? '<none>'}`);
  }

  const cg = scene.cg ?? scene.stage?.cg;
  if (cg) {
    explicitCgScenes++;
    if (assets.get(cg)?.kind !== 'cg') cgMisses.push(`${scene.id}:${cg}`);
  }

  for (const line of scene.lines ?? []) {
    const speaker = String(line.speaker ?? '旁白').trim() || '旁白';
    bump(speakerCounts, speaker);
    if (speaker === '旁白') continue;
    dialogueLines++;
    const rule = resolveSpeaker(speaker);
    if (!rule) {
      bump(unknownSpeakers, speaker);
      continue;
    }

    if (rule.mode === 'portrait') {
      portraitLines++;
      const neutralId = `${rule.character}/neutral`;
      if (assets.get(neutralId)?.kind !== 'portrait') missingPortraits.push(`${speaker}->${neutralId}`);
      if (runtimeSpeakerMap[speaker] !== rule.character) runtimeMappingMisses.push(`${speaker}->${rule.character}`);
      if (line.expression) {
        const expressionId = `${rule.character}/${line.expression}`;
        if (assets.get(expressionId)?.kind !== 'portrait') expressionMisses.push(`${scene.id}:${line.id ?? '<line>'}:${speaker}->${expressionId}`);
      }
    } else if (rule.mode === 'pending-support-portrait') {
      bump(pendingSpeakers, speaker);
    } else {
      deliberatelyNoPortraitLines++;
    }
  }
}

if (scenes.length !== 82) fail(`R5 visual coverage expects 82 canonical scenes, got ${scenes.length}`);
if (backgroundMisses.length) fail(`R5 background coverage missing/invalid: ${backgroundMisses.slice(0, 12).join(', ')}`);
if (cgMisses.length) fail(`R5 CG references missing/invalid: ${cgMisses.slice(0, 12).join(', ')}`);
if (unknownSpeakers.size) fail(`R5 unclassified dialogue speakers: ${[...unknownSpeakers].map(([name,count]) => `${name}(${count})`).join(', ')}`);
if (missingPortraits.length) fail(`R5 mapped portrait missing neutral asset: ${[...new Set(missingPortraits)].join(', ')}`);
if (runtimeMappingMisses.length) fail(`R5 portrait policy is not wired into runtime stage.speakers: ${[...new Set(runtimeMappingMisses)].join(', ')}`);
if (expressionMisses.length) fail(`R5 expression mapping misses: ${expressionMisses.slice(0, 12).join(', ')}`);
if (finalMode && pendingSpeakers.size) fail(`R5 final gate still has pending supporting portraits: ${[...pendingSpeakers].map(([name,count]) => `${name}(${count})`).join(', ')}`);

const summary = {
  status: finalMode ? 'r5-visual-final-ok' : 'r5-visual-mapping-ok',
  scenes: scenes.length,
  backgroundsCovered: scenes.length - backgroundMisses.length,
  explicitCgScenes,
  dialogueLines,
  portraitLines,
  runtimePortraitSpeakers: Object.keys(runtimeSpeakerMap).length,
  deliberatelyNoPortraitLines,
  pendingSupportingSpeakers: Object.fromEntries([...pendingSpeakers].sort(([a],[b]) => a.localeCompare(b, 'zh-CN'))),
  classifiedSpeakers: Object.fromEntries([...speakerCounts].sort(([a],[b]) => a.localeCompare(b, 'zh-CN')))
};
console.log(JSON.stringify(summary, null, 2));
