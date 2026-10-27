import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'game/assets/generated');
const sampleRate = 32000;
const TAU = Math.PI * 2;

function seeded(seed = 1842) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0xffffffff; };
}
function clamp(value, min = -1, max = 1) { return Math.max(min, Math.min(max, value)); }
function loopFrequency(hz, duration) { return Math.max(1 / duration, Math.round(hz * duration) / duration); }
function softOsc(phase, color = 0) {
  const base = Math.sin(phase);
  const second = Math.sin(phase * 2 + .37) * (.12 + color * .05);
  const third = Math.sin(phase * 3 + 1.1) * (.035 + color * .02);
  return base + second + third;
}
function triangle(phase) { return Math.asin(Math.sin(phase)) * (2 / Math.PI); }
function panGains(pan = 0) {
  const angle = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
  return [Math.cos(angle), Math.sin(angle)];
}
function gate(local) {
  if (local <= 0 || local >= 1) return 0;
  return Math.sin(Math.PI * local) ** 2;
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

function renderMusic({ duration = 16, chord, bass, motif = [], bpm = 84, noise = .0015, shimmer = 0, pulse = 0, seed = 1842, width = .28, peak = .62 }) {
  const frames = Math.floor(duration * sampleRate), left = new Float64Array(frames), right = new Float64Array(frames);
  const pad = chord.map((hz, index) => ({
    frequency: loopFrequency(hz, duration),
    amplitude: .032 / (1 + index * .18),
    phase: index * .61,
    pan: (index - (chord.length - 1) / 2) * width,
    cycle: index + 1
  }));
  const bassFrequency = loopFrequency(bass, duration);
  const beat = 60 / bpm;
  const beats = Math.max(1, Math.round(duration / beat));
  const exactBeat = duration / beats;
  const noiseRand = seeded(seed + 77);
  const noiseBands = Array.from({ length: 8 }, (_, i) => ({
    frequency: loopFrequency(220 + noiseRand() * 5200, duration),
    amplitude: noise * (.7 + noiseRand() * .5) / (1 + i * .25),
    phase: noiseRand() * TAU,
    pan: noiseRand() * 1.4 - .7
  }));

  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    let l = 0, r = 0;
    for (const layer of pad) {
      const drift = .88 + .12 * (1 + Math.sin(TAU * layer.cycle * t / duration + layer.phase)) / 2;
      const phaseL = TAU * layer.frequency * t + layer.phase;
      const phaseR = phaseL + width * .35 * Math.sin(TAU * t / duration + layer.phase);
      const [gl, gr] = panGains(layer.pan);
      l += softOsc(phaseL, shimmer) * layer.amplitude * drift * gl;
      r += softOsc(phaseR, shimmer) * layer.amplitude * drift * gr;
    }
    const bassDrift = .82 + .18 * Math.sin(TAU * 2 * t / duration + .4);
    l += softOsc(TAU * bassFrequency * t, -.2) * .035 * bassDrift;
    r += softOsc(TAU * bassFrequency * t + .05, -.2) * .035 * bassDrift;

    if (motif.length) {
      const beatIndex = Math.floor(t / exactBeat) % motif.length;
      const local = (t % exactBeat) / exactBeat;
      const note = motif[beatIndex];
      const env = gate(Math.min(1, local / .84)) * Math.exp(-local * 1.1);
      const frequency = loopFrequency(note, duration);
      const phase = TAU * frequency * t;
      const pan = ((beatIndex % 3) - 1) * .22;
      const [gl, gr] = panGains(pan);
      l += (softOsc(phase, .45) + triangle(phase * .5) * .08) * .032 * env * gl;
      r += (softOsc(phase + .045, .45) + triangle(phase * .5 + .08) * .08) * .032 * env * gr;
    }

    if (pulse) {
      const local = (t % exactBeat) / exactBeat;
      const thump = Math.exp(-Math.max(0, local - .08) * 18) * (local >= .08 ? 1 : 0);
      const p = Math.sin(TAU * loopFrequency(52, duration) * t) * .055 * thump * pulse;
      l += p; r += p * .96;
    }

    for (const band of noiseBands) {
      const [gl, gr] = panGains(band.pan);
      const n = Math.sin(TAU * band.frequency * t + band.phase) * band.amplitude;
      l += n * gl; r += n * gr;
    }
    if (shimmer) {
      const high = Math.sin(TAU * loopFrequency(chord[chord.length - 1] * 4, duration) * t + .8) * .0035 * shimmer;
      l += high * (.65 + .35 * Math.sin(TAU * t / duration));
      r += high * (.65 + .35 * Math.sin(TAU * t / duration + 1.7));
    }
    left[i] = l; right[i] = r;
  }
  return wavStereo(left, right, peak);
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

const music = {
  'music-memory-rain.wav': { duration:16, chord:[196,246.94,293.66,392], bass:98, motif:[392,329.63,293.66,246.94,293.66,329.63,392,493.88], bpm:72, noise:.0012, shimmer:.35, seed:1842, peak:.56 },
  'music-night-residue.wav': { duration:16, chord:[82.41,98,123.47,164.81], bass:41.2, motif:[164.81,146.83,123.47,98,123.47,110,98,82.41], bpm:64, noise:.0045, seed:4182, width:.38, peak:.58 },
  'music-fracture-pulse.wav': { duration:12, chord:[73.42,98,110,146.83], bass:36.71, motif:[196,146.83,220,164.81,196,293.66,220,146.83], bpm:108, noise:.006, pulse:1, seed:666, width:.45, peak:.66 },
  'music-letter-dawn.wav': { duration:16, chord:[261.63,329.63,392,493.88], bass:130.81, motif:[523.25,493.88,392,329.63,392,440,493.88,392], bpm:70, noise:.001, shimmer:.55, seed:1025, peak:.54 },
  'music-seven-chairs.wav': { duration:16, chord:[98,123.47,146.83,196], bass:49, motif:[293.66,246.94,196,146.83,196,220,174.61,146.83], bpm:76, noise:.0036, seed:7777, width:.42, peak:.58 },
  'music-route-choice.wav': { duration:16, chord:[174.61,220,261.63,349.23], bass:87.31, motif:[349.23,392,440,349.23,293.66,349.23,392,523.25], bpm:88, noise:.0013, shimmer:.18, seed:3141, peak:.58 },
  'music-no-save.wav': { duration:20, chord:[110,146.83,164.81,220], bass:55, motif:[220,196,164.81,146.83,164.81,146.83,123.47,110,146.83,164.81], bpm:60, noise:.0024, seed:1017, width:.34, peak:.6 },
  'music-tomorrow.wav': { duration:24, chord:[196,246.94,293.66,329.63], bass:98, motif:[392,440,493.88,587.33,493.88,440,392,329.63,392,493.88,587.33,659.25], bpm:72, noise:.0008, shimmer:.8, seed:1025, width:.32, peak:.54 },
  'music-linwan-dream.wav': { duration:16, chord:[196,246.94,329.63,392], bass:98, motif:[493.88,392,329.63,392,440,392,329.63,293.66], bpm:68, noise:.0009, shimmer:.65, seed:1221, width:.36, peak:.54 },
  'music-xiaoman-forward.wav': { duration:16, chord:[220,277.18,329.63,440], bass:110, motif:[440,493.88,554.37,659.25,554.37,493.88,440,369.99], bpm:96, noise:.0012, shimmer:.22, seed:2401, width:.3, peak:.58 },
  'music-xuqi-night.wav': { duration:16, chord:[110,138.59,164.81,220], bass:55, motif:[329.63,277.18,220,277.18,329.63,369.99,329.63,220], bpm:82, noise:.0028, seed:7301, width:.48, peak:.57 },
  'music-tinglan-archive.wav': { duration:16, chord:[146.83,196,246.94,293.66], bass:73.42, motif:[293.66,246.94,220,196,246.94,293.66,329.63,246.94], bpm:66, noise:.0016, seed:5510, width:.26, peak:.55 },
  'music-tangli-road.wav': { duration:16, chord:[164.81,220,261.63,329.63], bass:82.41, motif:[329.63,392,440,523.25,440,392,329.63,293.66], bpm:104, noise:.0018, pulse:.35, seed:8604, width:.34, peak:.6 },
  'music-nanxing-message.wav': { duration:16, chord:[174.61,220,293.66,349.23], bass:87.31, motif:[523.25,587.33,659.25,523.25,440,523.25,659.25,783.99], bpm:90, noise:.0015, shimmer:.4, seed:9027, width:.5, peak:.56 }
};

const sfx = {
  'sfx-memory-ping.wav': { duration:.46, tone:[[880,.055],[1320,.034,.4],[1760,.015,.8]], sweep:[620,980,.018], noise:.004, peak:.5, seed:11, stereo:.28 },
  'sfx-load.wav': { duration:.95, tone:[[110,.05],[220,.032,.7],[440,.017,1.4]], sweep:[180,1240,.032], noise:.028, peak:.62, seed:12, stereo:.34 },
  'sfx-impact.wav': { duration:.38, tone:[[62,.11],[93,.05,.4],[186,.02,1.1]], sweep:[120,42,.028], noise:.095, peak:.74, seed:13, stereo:.12 },
  'sfx-dodge.wav': { duration:.28, tone:[[420,.02],[760,.014,.6]], sweep:[1280,360,.05], noise:.036, peak:.56, seed:14, stereo:.55 },
  'sfx-camera-self.wav': { duration:.22, tone:[[1046.5,.038],[1568,.022,.5],[2093,.012,1.1]], noise:.018, peak:.48, seed:15, stereo:.18 },
  'sfx-message-future.wav': { duration:.5, tone:[[659.25,.032],[987.77,.024,.5],[1318.5,.014,1.1]], sweep:[520,1180,.018], noise:.002, peak:.48, seed:16, stereo:.4 },
  'sfx-door-ghost.wav': { duration:.82, tone:[[73.42,.045],[110,.022,.9],[220,.009,1.7]], sweep:[96,48,.025], noise:.045, peak:.58, seed:17, stereo:.3 }
};

await mkdir(out, { recursive: true });
for (const [name, config] of Object.entries(music)) await writeFile(resolve(out, name), renderMusic(config));
for (const [name, config] of Object.entries(sfx)) await writeFile(resolve(out, name), renderSfx(config));
console.log(`Generated ${Object.keys(music).length} loop-safe stereo score cues and ${Object.keys(sfx).length} stereo SFX at ${sampleRate} Hz`);
