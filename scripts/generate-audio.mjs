import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'game/assets/generated');
const sampleRate = 16000;

function mastered(samples, peak = .68) {
  let max = 0;
  for (const value of samples) max = Math.max(max, Math.abs(value));
  if (!max) return samples;
  const gain = Math.min(8, peak / max);
  const result = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) result[i] = Math.tanh(samples[i] * gain * 1.08) / Math.tanh(1.08);
  return result;
}

function wav(samples, peak = .68) {
  const source = mastered(samples, peak);
  const bytes = Buffer.alloc(44 + source.length * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + source.length * 2, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(source.length * 2, 40);
  for (let i = 0; i < source.length; i++) bytes.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(source[i] * 32767))), 44 + i * 2);
  return bytes;
}

function seededNoise(seed = 1842) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0xffffffff * 2 - 1; };
}

function synth({ duration, partials, tremolo = 0, noise = 0, attack = .35, release = .45, pulse = 0 }) {
  const count = Math.floor(duration * sampleRate), result = new Float64Array(count), random = seededNoise();
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate;
    let value = 0;
    for (const [frequency, amplitude, phase = 0] of partials) value += Math.sin(Math.PI * 2 * frequency * t + phase) * amplitude;
    if (tremolo) value *= .72 + .28 * Math.sin(Math.PI * 2 * tremolo * t);
    if (pulse) value *= .42 + .58 * Math.pow(Math.max(0, Math.sin(Math.PI * 2 * pulse * t)), 3);
    if (noise) value += random() * noise;
    const fadeIn = Math.min(1, t / attack), fadeOut = Math.min(1, (duration - t) / release);
    result[i] = value * Math.max(0, Math.min(fadeIn, fadeOut));
  }
  return result;
}

function progression({ duration, chords, beat = 2, shimmer = false }) {
  const count = Math.floor(duration * sampleRate), result = new Float64Array(count), random = seededNoise(1025);
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate, chord = chords[Math.floor(t / beat) % chords.length];
    const local = t % beat, envelope = .52 + .48 * Math.exp(-local * 1.7);
    let value = 0;
    chord.forEach((f, index) => {
      value += Math.sin(Math.PI * 2 * f * t + index * .47) * (.032 / (1 + index * .2));
      value += Math.sin(Math.PI * 2 * f * 2 * t + index) * .006;
    });
    if (shimmer) value += Math.sin(Math.PI * 2 * chord[0] * 4 * t) * .004 * (1 + Math.sin(t * .6));
    value = value * envelope + random() * .0008;
    const edge = Math.min(1, t / .7, (duration - t) / .9);
    result[i] = value * Math.max(0, edge);
  }
  return result;
}

await mkdir(out, { recursive: true });
await writeFile(resolve(out, 'music-memory-rain.wav'), wav(synth({ duration: 8, partials: [[196, .07], [293.66, .045, .8], [392, .028, 1.7], [98, .02, .2]], tremolo: .11, noise: .002 })));
await writeFile(resolve(out, 'music-night-residue.wav'), wav(synth({ duration: 8, partials: [[55, .065], [82.41, .032, .5], [123.47, .018, 1.1], [220, .008, 2.3]], tremolo: .07, noise: .009 })));
await writeFile(resolve(out, 'music-fracture-pulse.wav'), wav(synth({ duration: 8, partials: [[49, .08], [73.42, .04, .8], [98, .03, 1.5], [196, .012, 2.2]], pulse: 1.42, noise: .012, attack: .12, release: .6 })));
await writeFile(resolve(out, 'music-letter-dawn.wav'), wav(synth({ duration: 8, partials: [[261.63, .052], [329.63, .032, .7], [392, .026, 1.4], [130.81, .018, .2]], tremolo: .08, noise: .0015 })));
await writeFile(resolve(out, 'music-seven-chairs.wav'), wav(synth({ duration: 8, partials: [[65.41, .06], [98, .035, .7], [146.83, .021, 1.6], [293.66, .009, 2.4]], tremolo: .13, noise: .006 })));
await writeFile(resolve(out, 'music-route-choice.wav'), wav(synth({ duration: 8, partials: [[174.61, .045], [261.63, .034, .6], [349.23, .022, 1.2], [87.31, .018, 2]], tremolo: .09, noise: .002 })));
await writeFile(resolve(out, 'music-no-save.wav'), wav(progression({ duration: 12, beat: 3, chords: [[110,164.81,220],[98,146.83,196],[82.41,123.47,164.81],[73.42,110,146.83]], shimmer:false }), .62));
await writeFile(resolve(out, 'music-tomorrow.wav'), wav(progression({ duration: 16, beat: 4, chords: [[196,246.94,293.66],[220,261.63,329.63],[174.61,220,293.66],[196,246.94,329.63]], shimmer:true }), .58));
await writeFile(resolve(out, 'sfx-memory-ping.wav'), wav(synth({ duration: .42, partials: [[880, .08], [1320, .045, .4], [1760, .02, .8]], attack: .008, release: .32 }), .55));
await writeFile(resolve(out, 'sfx-load.wav'), wav(synth({ duration: .9, partials: [[110, .07], [220, .045, .7], [440, .025, 1.4], [880, .012, 2.1]], tremolo: 5.4, noise: .018, attack: .01, release: .5 }), .64));
await writeFile(resolve(out, 'sfx-impact.wav'), wav(synth({ duration: .32, partials: [[62, .13], [93, .065, .4], [186, .028, 1.1]], noise: .07, attack: .004, release: .29 }), .78));
await writeFile(resolve(out, 'sfx-dodge.wav'), wav(synth({ duration: .22, partials: [[420, .028], [760, .018, .6]], noise: .045, attack: .003, release: .18 }), .58));
await writeFile(resolve(out, 'sfx-camera-self.wav'), wav(synth({ duration: .28, partials: [[1046.5, .045], [1568, .026, .5]], noise: .012, attack: .002, release: .22 }), .52));
await writeFile(resolve(out, 'sfx-message-future.wav'), wav(synth({ duration: .48, partials: [[659.25, .04], [987.77, .03, .5], [1318.5, .018, 1.1]], tremolo: 8, attack: .004, release: .3 }), .52));
await writeFile(resolve(out, 'sfx-door-ghost.wav'), wav(synth({ duration: .7, partials: [[73.42, .06], [110, .028, .9], [220, .013, 1.7]], noise: .035, attack: .03, release: .5 }), .6));
console.log('Generated and mastered original RESET score/SFX in game/assets/generated');
