import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHash } from 'node:crypto';
import { renderScoreCue, validateScore } from './music-score.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'game/assets/generated');
const sampleRate = 32000;
const TAU = Math.PI * 2;

function seeded(seed = 1842) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0xffffffff; };
}
function clamp(value, min = -1, max = 1) { return Math.max(min, Math.min(max, value)); }
function softOsc(phase, color = 0) {
  const base = Math.sin(phase);
  const second = Math.sin(phase * 2 + .37) * (.12 + color * .05);
  const third = Math.sin(phase * 3 + 1.1) * (.035 + color * .02);
  return base + second + third;
}
function panGains(pan = 0) {
  const angle = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
  return [Math.cos(angle), Math.sin(angle)];
}
function master(left, right, peak = .68) {
  let max = 0;
  for (let i = 0; i < left.length; i++) max = Math.max(max, Math.abs(left[i]), Math.abs(right[i]));
  if (!max) return { left, right };
  const gain = Math.min(10, peak / max);
  const norm = Math.tanh(1.12);
  for (let i = 0; i < left.length; i++) {
    left[i] = Math.tanh(left[i] * gain * 1.12) / norm;
    right[i] = Math.tanh(right[i] * gain * 1.12) / norm;
  }
  return { left, right };
}
function wavStereo(left, right, peak = .68) {
  master(left, right, peak);
  const frames = left.length, bytes = Buffer.alloc(44 + frames * 4);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + frames * 4, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 4, 28); bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(frames * 4, 40);
  for (let i = 0, offset = 44; i < frames; i++, offset += 4) {
    bytes.writeInt16LE(Math.round(clamp(left[i]) * 32767), offset);
    bytes.writeInt16LE(Math.round(clamp(right[i]) * 32767), offset + 2);
  }
  return bytes;
}

function renderSfx({ duration, peak = .62, seed = 1842, tone = [], noise = 0, sweep, stereo = .16 }) {
  const frames = Math.floor(duration * sampleRate), left = new Float64Array(frames), right = new Float64Array(frames), random = seeded(seed);
  let filtered = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate, x = t / duration;
    const env = Math.sin(Math.PI * Math.min(1, x)) ** 1.35 * Math.exp(-x * 2.2);
    let value = 0;
    for (const [hz, amp, phase = 0] of tone) value += softOsc(TAU * hz * t + phase, .25) * amp;
    if (sweep) {
      const [from, to, amp] = sweep;
      const hz = from + (to - from) * x;
      value += Math.sin(TAU * hz * t + x * x * 5) * amp;
    }
    if (noise) {
      filtered = filtered * .82 + (random() * 2 - 1) * .18;
      value += filtered * noise;
    }
    const pan = Math.sin(Math.PI * x) * stereo;
    const [gl, gr] = panGains(pan);
    left[i] = value * env * gl;
    right[i] = value * env * gr;
  }
  return wavStereo(left, right, peak);
}

const sfx = {
  'sfx-memory-ping.wav': { duration:.46, tone:[[880,.055],[1320,.034,.4],[1760,.015,.8]], sweep:[620,980,.018], noise:.004, peak:.5, seed:11, stereo:.28 },
  'sfx-load.wav': { duration:.95, tone:[[110,.05],[220,.032,.7],[440,.017,1.4]], sweep:[180,1240,.032], noise:.028, peak:.62, seed:12, stereo:.34 },
  'sfx-impact.wav': { duration:.38, tone:[[62,.11],[93,.05,.4],[186,.02,1.1]], sweep:[120,42,.028], noise:.095, peak:.74, seed:13, stereo:.12 },
  'sfx-dodge.wav': { duration:.28, tone:[[420,.02],[760,.014,.6]], sweep:[1280,360,.05], noise:.036, peak:.56, seed:14, stereo:.55 },
  'sfx-camera-self.wav': { duration:.22, tone:[[1046.5,.038],[1568,.022,.5],[2093,.012,1.1]], noise:.018, peak:.48, seed:15, stereo:.18 },
  'sfx-message-future.wav': { duration:.5, tone:[[659.25,.032],[987.77,.024,.5],[1318.5,.014,1.1]], sweep:[520,1180,.018], noise:.002, peak:.48, seed:16, stereo:.4 },
  'sfx-door-ghost.wav': { duration:.82, tone:[[73.42,.045],[110,.022,.9],[220,.009,1.7]], sweep:[96,48,.025], noise:.045, peak:.58, seed:17, stereo:.3 }
};

const scoreBytes = await readFile(resolve(root, 'game/music/score.json'));
const score = JSON.parse(scoreBytes); validateScore(score);
const generatorBytes = await readFile(resolve(root, 'scripts/music-score.mjs'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const tracks = [];
await mkdir(out, { recursive: true });
for (const cue of score.cues) {
  const result = renderScoreCue(cue, score);
  const src = `assets/generated/${cue.id}.wav`;
  await writeFile(resolve(root, 'game', src), result.bytes);
  tracks.push({ id: cue.id, title: cue.title, src, bpm: cue.bpm, bars: score.bars,
    beatsPerBar: score.beatsPerBar, instrument: cue.instrument, form: 'A/B, 8 + 8 bars',
    loop: true, loopStart: 0, loopEnd: result.duration, frames: result.frames,
    defaultGain: 1, events: result.events, bytes: result.bytes.length, sha256: hash(result.bytes) });
}
for (const [name, config] of Object.entries(sfx)) await writeFile(resolve(out, name), renderSfx(config));
await writeFile(resolve(out, 'music-manifest.json'), JSON.stringify({
  schema: 1, revision: 'music-r1', synthesis: 'original-procedural',
  provenance: score.provenance, scoreSha256: hash(scoreBytes), rendererSha256: hash(generatorBytes),
  sampleRate, channels: 2, bits: 16, targetRmsDbfs: score.targetRmsDbfs,
  peakCeilingDbfs: score.peakCeilingDbfs, tracks
}, null, 2) + '\n');
console.log(`Generated ${tracks.length} original 16-bar A/B score cues and ${Object.keys(sfx).length} unchanged stereo SFX at ${sampleRate} Hz`);
