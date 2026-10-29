import { checkSfxPackage } from './check-sfx.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { inspectWav, musicViolations } from './audio-metrics.mjs';
import { validateScore } from './music-score.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(process.env.RESET_DIST || resolve(root, 'dist'));
const project = JSON.parse(await readFile(resolve(dist, 'project.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(dist, 'build-manifest.json'), 'utf8'));
const scoreBytes = await readFile(resolve(root, 'game/music/score.json'));
const score = JSON.parse(scoreBytes); validateScore(score);
const musicManifestBytes = await readFile(resolve(dist, 'music-manifest.json'));
const musicManifest = JSON.parse(musicManifestBytes);
const sw = await readFile(resolve(dist, 'sw.js'), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(musicManifest.schema === 1 && musicManifest.revision === 'music-r1' && musicManifest.synthesis === 'original-procedural', 'Music provenance is missing');
assert(musicManifest.scoreSha256 === hash(scoreBytes) && musicManifest.rendererSha256 === hash(await readFile(resolve(root, 'scripts/music-score.mjs'))), 'Music source provenance is stale');
assert(musicManifest.tracks.length === 14 && new Set(musicManifest.tracks.map(t => t.id)).size === 14, 'Score metadata is incomplete/duplicated');
assert(manifest.extensions.includes('reset-music-r1'), 'Music integration is absent from final package');
function packaged(src, bytes) {
  const record = manifest.files.find(file => file.name === src);
  assert(record?.size === bytes.length && record.sha256 === hash(bytes), `Final audio manifest mismatch: ${src}`);
  assert(sw.includes(JSON.stringify(src)), `Audio unavailable offline: ${src}`);
}
packaged('music-manifest.json', musicManifestBytes);
const assets = project.assets.filter(asset => asset.kind === 'audio');
const ids = new Set(assets.map(asset => asset.id)), sources = new Set();
assert(assets.length === 21 && ids.size === 21, `Expected 14 Music + 7 SFX, got ${assets.length}`);
const tracks = [], effects = [];
let totalBytes = 0;
for (const asset of assets) {
  assert(!sources.has(asset.src), `Audio unexpectedly shares a source: ${asset.src}`); sources.add(asset.src);
  const bytes = await readFile(resolve(dist, asset.src)), info = inspectWav(bytes);
  totalBytes += bytes.length; packaged(asset.src, bytes);
  if (asset.id.startsWith('music-')) {
    const cue = score.cues.find(cue => cue.id === asset.id), record = musicManifest.tracks.find(track => track.id === asset.id);
    assert(cue && record?.sha256 === hash(bytes) && record.src === asset.src && record.bytes === bytes.length, `${asset.id}: missing/stale soundtrack metadata`);
    assert(record.frames === info.frames && record.bpm === cue.bpm && record.bars === 16 && record.beatsPerBar === 4 && record.instrument === cue.instrument && record.title === cue.title, `${asset.id}: composition metadata does not match the score`);
    assert(Math.abs(info.duration - 16 * 4 * 60 / cue.bpm) < 1 / 32000, `${asset.id}: phrase is not tempo-aligned`);
    assert(record.loop === true && record.loopStart === 0 && record.loopEnd === info.duration && record.defaultGain === 1, `${asset.id}: loop metadata does not match full-file engine playback`);
    const errors = musicViolations(info); assert(!errors.length, `${asset.id}: ${errors.join(', ')}`);
    tracks.push({ id: asset.id, title: record.title, instrument: record.instrument, sha256: record.sha256, ...info });
  } else {
    assert(asset.id.startsWith('sfx-') && info.duration > .1 && info.duration < 2 && !info.clippedSamples, `${asset.id}: invalid/overloaded SFX`);
    effects.push({ id: asset.id, sha256: hash(bytes), duration: info.duration });
  }
}
assert(tracks.length === 14 && effects.length === 7, 'Audio identities regressed');
assert(totalBytes <= 96 * 1024 * 1024, 'Uncompressed offline audio exceeds 96 MiB');
const rmsSpreadDb = Math.max(...tracks.map(t => t.rmsDbfs)) - Math.min(...tracks.map(t => t.rmsDbfs));
assert(rmsSpreadDb <= 2, 'Score energy spread exceeds 2 dB');
const sceneIds = new Set(project.scenes.map(scene => scene.id));
const mappings = project.stage?.scenes ?? {};
for (const [sceneId, stage] of Object.entries(mappings)) {
  assert(sceneIds.has(sceneId), `Stale scene mapping ${sceneId}`);
  if (stage.music) assert(tracks.some(track => track.id === stage.music), `Scene ${sceneId} references missing music ${stage.music}`);
  if (stage.ambience) assert(ids.has(stage.ambience), `Scene ${sceneId} references missing ambience ${stage.ambience}`);
}
for (const scene of project.scenes) assert(mappings[scene.id]?.music, `Scene ${scene.id} silently falls back to default music`);
for (const [lineId, stage] of Object.entries(project.stage?.lines ?? {})) {
  if (stage.sound) assert(effects.some(effect => effect.id === stage.sound), `Line ${lineId} references missing SFX ${stage.sound}`);
  if (stage.music) assert(tracks.some(track => track.id === stage.music), `Line ${lineId} references missing Music ${stage.music}`);
}
const themes = { linwan: 'linwan-dream', xiaoman: 'xiaoman-forward', xuqi: 'xuqi-night', tinglan: 'tinglan-archive', tangli: 'tangli-road', nanxing: 'nanxing-message' };
for (const [name, theme] of Object.entries(themes)) for (const scene of [`c4_${name}_1`, `c4_${name}_2`, `end_${name}`]) assert(mappings[scene]?.music === `music-${theme}`, `${scene} lost its character score`);
for (const id of ['c5_anchor_truth','c5_request','c5_1842','chapter6_gate','c6_no_save','c6_echo_goodbye']) assert(mappings[id]?.music === 'music-no-save', `${id} lost no-save score`);
for (const id of ['c7_morning','c7_after','c7_linwan','c7_credits']) assert(mappings[id]?.music === 'music-tomorrow', `${id} lost tomorrow score`);
const report = { schema: 1, status: 'PASS', revision: 'music-r1', scoreSha256: musicManifest.scoreSha256, rendererSha256: musicManifest.rendererSha256, packageFingerprint: manifest.contentFingerprint, measurement: 'PCM energy (dBFS RMS), not perceptual LUFS or human listening',
  totalBytes, rmsSpreadDb, scenes: project.scenes.length, tracks, effects,
  subjectiveListening: 'NOT_CLAIMED', physicalAndroid: 'NOT_RUN', physicalWindows: 'NOT_RUN' };
await mkdir(resolve(root, 'test-results/music-r1'), { recursive: true });
await writeFile(resolve(root, 'test-results/music-r1/audio-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: 'audio-ok', music: tracks.length, sfx: effects.length, explicitSceneScores: project.scenes.length, durationSeconds: [Math.min(...tracks.map(t => t.duration)), Math.max(...tracks.map(t => t.duration))], rmsSpreadDb, maxInternalStep: Math.max(...tracks.map(t => t.maxStep)), maxLoopStep: Math.max(...tracks.map(t => t.seamStep)), totalBytes }, null, 2));

await checkSfxPackage(dist);
