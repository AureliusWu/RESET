import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const project = JSON.parse(await readFile(resolve(dist, 'project.json'), 'utf8'));
const sw = await readFile(resolve(dist, 'sw.js'), 'utf8');

function assert(condition, message) { if (!condition) throw new Error(message); }
function wavInfo(bytes) {
  assert(bytes.length >= 44, 'WAV is too small');
  assert(bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE', 'invalid WAV container');
  const channels = bytes.readUInt16LE(22), sampleRate = bytes.readUInt32LE(24), bits = bytes.readUInt16LE(34);
  const dataBytes = bytes.readUInt32LE(40), blockAlign = bytes.readUInt16LE(32);
  assert(blockAlign > 0 && dataBytes <= bytes.length - 44, 'invalid WAV payload');
  return { channels, sampleRate, bits, dataBytes, frames: dataBytes / blockAlign, blockAlign };
}
function pcm16At(bytes, frame, channel, channels) { return bytes.readInt16LE(44 + (frame * channels + channel) * 2); }
function seamPeak(bytes, info) {
  const last = info.frames - 1;
  let peak = 0;
  for (let channel = 0; channel < info.channels; channel++) peak = Math.max(peak, Math.abs(pcm16At(bytes, 0, channel, info.channels) - pcm16At(bytes, last, channel, info.channels)));
  return peak / 32767;
}

const assets = project.assets.filter(asset => asset.kind === 'audio');
const ids = new Set(assets.map(asset => asset.id));
const sources = new Set();
assert(assets.length >= 21, `expected upgraded audio catalog, got ${assets.length}`);
for (const asset of assets) {
  assert(!sources.has(asset.src), `audio assets share a source unexpectedly: ${asset.src}`);
  sources.add(asset.src);
  const bytes = await readFile(resolve(dist, asset.src));
  const info = wavInfo(bytes);
  assert(info.channels === 2, `${asset.id} is not stereo`);
  assert(info.sampleRate >= 32000, `${asset.id} sample rate regressed below 32 kHz`);
  assert(info.bits === 16, `${asset.id} must remain PCM16 for WebView/browser compatibility`);
  const duration = info.frames / info.sampleRate;
  if (asset.id.startsWith('music-')) {
    assert(duration >= 12, `${asset.id} is too short for a score loop`);
    assert(seamPeak(bytes, info) < .1, `${asset.id} has a likely audible loop seam`);
  } else if (asset.id.startsWith('sfx-')) {
    assert(duration > .1 && duration < 2, `${asset.id} has an implausible SFX duration`);
  }
  assert(sw.includes(asset.src), `${asset.id} is not available offline`);
}

for (const [sceneId, stage] of Object.entries(project.stage?.scenes ?? {})) {
  if (stage.music) assert(ids.has(stage.music), `scene ${sceneId} references missing music ${stage.music}`);
  if (stage.ambience) assert(ids.has(stage.ambience), `scene ${sceneId} references missing ambience ${stage.ambience}`);
}
for (const [lineId, stage] of Object.entries(project.stage?.lines ?? {})) if (stage.sound) assert(ids.has(stage.sound), `line ${lineId} references missing SFX ${stage.sound}`);

const heroineThemes = {
  c4_linwan_1: 'music-linwan-dream',
  c4_xiaoman_1: 'music-xiaoman-forward',
  c4_xuqi_1: 'music-xuqi-night',
  c4_tinglan_1: 'music-tinglan-archive',
  c4_tangli_1: 'music-tangli-road',
  c4_nanxing_1: 'music-nanxing-message'
};
for (const [sceneId, music] of Object.entries(heroineThemes)) assert(project.stage?.scenes?.[sceneId]?.music === music, `${sceneId} lost its heroine-specific theme`);

console.log(JSON.stringify({ status: 'audio-ok', assets: assets.length, music: assets.filter(asset => asset.id.startsWith('music-')).length, sfx: assets.filter(asset => asset.id.startsWith('sfx-')).length, sampleRateFloor: 32000, channels: 2 }, null, 2));
