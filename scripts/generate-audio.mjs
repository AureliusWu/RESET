import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = resolve(root, 'game/assets/generated');
const sampleRate = 16000;

function wav(samples) {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + samples.length * 2, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) bytes.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  return bytes;
}

function seededNoise(seed = 1842) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0xffffffff * 2 - 1; };
}

function synth({ duration, partials, tremolo = 0, noise = 0, attack = .35, release = .45 }) {
  const count = Math.floor(duration * sampleRate), result = new Float64Array(count), random = seededNoise();
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate;
    let value = 0;
    for (const [frequency, amplitude, phase = 0] of partials) value += Math.sin(Math.PI * 2 * frequency * t + phase) * amplitude;
    if (tremolo) value *= .72 + .28 * Math.sin(Math.PI * 2 * tremolo * t);
    if (noise) value += random() * noise;
    const fadeIn = Math.min(1, t / attack), fadeOut = Math.min(1, (duration - t) / release);
    result[i] = value * Math.max(0, Math.min(fadeIn, fadeOut));
  }
  return result;
}

await mkdir(out, { recursive: true });
await writeFile(resolve(out, 'music-memory-rain.wav'), wav(synth({
  duration: 8,
  partials: [[196, .07], [293.66, .045, .8], [392, .028, 1.7], [98, .02, .2]],
  tremolo: .11, noise: .002
})));
await writeFile(resolve(out, 'music-night-residue.wav'), wav(synth({
  duration: 8,
  partials: [[55, .065], [82.41, .032, .5], [123.47, .018, 1.1], [220, .008, 2.3]],
  tremolo: .07, noise: .009
})));
await writeFile(resolve(out, 'sfx-memory-ping.wav'), wav(synth({
  duration: .42,
  partials: [[880, .08], [1320, .045, .4], [1760, .02, .8]],
  attack: .008, release: .32
})));
console.log('Generated original RESET audio prototypes in game/assets/generated');
