// RESET score renderer. Every event has a continuous onset/release; tails wrap
// around the loop instead of cutting or fading the entire score to silence.
export const SCORE_PALETTES = ['felt', 'glass', 'marimba', 'pluck', 'reed', 'electric'];
const TAU = Math.PI * 2;
const scales = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const smoothstep = n => { const x = clamp(n, 0, 1); return x * x * (3 - 2 * x); };
export function pulseEnvelope(t, duration, attack = .012, release = .06) {
  if (t <= 0 || t >= duration) return 0;
  return smoothstep(t / attack) * smoothstep((duration - t) / release) * Math.exp(-t * 10);
}
function degree(root, mode, step) {
  const octave = Math.floor(step / 7), index = ((step % 7) + 7) % 7;
  return root + scales[mode][index] + octave * 12;
}
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const gain = db => 10 ** (db / 20);

export function validateScore(score) {
  if (score.schema !== 1 || score.sampleRate !== 32000 || score.bars !== 16 || score.beatsPerBar !== 4) throw Error('Unsupported RESET score format');
  if (!Number.isFinite(score.targetRmsDbfs) || score.targetRmsDbfs > -14 || score.targetRmsDbfs < -24) throw Error('Invalid score RMS target');
  if (!Number.isFinite(score.peakCeilingDbfs) || score.peakCeilingDbfs > -3) throw Error('Score needs at least 3 dB sample headroom');
  if (!Array.isArray(score.cues) || score.cues.length !== 14) throw Error('Keep all fourteen score identities');
  const ids = new Set();
  for (const cue of score.cues) {
    if (!/^music-[a-z-]+$/.test(cue.id) || ids.has(cue.id)) throw Error(`Invalid/duplicate cue ${cue.id}`);
    ids.add(cue.id);
    if (!SCORE_PALETTES.includes(cue.instrument) || !scales[cue.mode] || !['sparse','lyrical','walking','driving'].includes(cue.density)) throw Error(`Invalid palette ${cue.id}`);
    if (!Number.isFinite(cue.bpm) || cue.bpm < 60 || cue.bpm > 108 || !Number.isInteger(cue.root) || cue.root < 45 || cue.root > 72) throw Error(`Invalid tempo/pitch ${cue.id}`);
    if (cue.progression?.length !== 4 || cue.progression.some(n => !Number.isInteger(n) || n < 0 || n > 6) || cue.melody?.length !== 8 || cue.melody.some(n => !Number.isInteger(n) || n < 0 || n > 14)) throw Error(`Invalid phrase ${cue.id}`);
    if (!Number.isFinite(cue.air) || cue.air < 0 || cue.air > .003 || !Number.isInteger(cue.seed) || (cue.pulse !== undefined && (!Number.isFinite(cue.pulse) || cue.pulse < 0 || cue.pulse > 1))) throw Error(`Invalid synthesis settings ${cue.id}`);
  }
}

export function renderScoreCue(cue, score) {
  const rate = score.sampleRate;
  // Quantize one complete 16-bar phrase, never individual notes/frequencies.
  const frames = Math.round(score.bars * score.beatsPerBar * 60 / cue.bpm * rate);
  const duration = frames / rate, beat = duration / (score.bars * score.beatsPerBar);
  const left = new Float64Array(frames), right = new Float64Array(frames);
  const events = [];
  function add(start, length, hz, amplitude, instrument, pan = 0) {
    const angle = (clamp(pan, -.75, .75) + 1) * Math.PI / 4;
    const gl = Math.cos(angle) * amplitude, gr = Math.sin(angle) * amplitude;
    const begin = Math.round(start * rate), count = Math.ceil(length * rate);
    const attack = instrument === 'pad' ? .28 : instrument === 'bass' ? .025 : instrument === 'reed' ? .08 : .012;
    const release = instrument === 'pad' ? .85 : instrument === 'bass' ? .12 : instrument === 'pulse' ? .06 : .22;
    const phase = (cue.seed % 23) * .017;
    events.push({ start, duration: length, frequency: hz, instrument });
    for (let i = 0; i < count; i++) {
      const t = i / rate, p = TAU * hz * t;
      let value, env = smoothstep(t / attack) * smoothstep((length - t) / release);
      if (instrument === 'pulse') { value = Math.sin(p); env = pulseEnvelope(t, length); }
      else if (instrument === 'pad') value = (Math.sin(p) + .14 * Math.sin(p * 2 + .4) + .04 * Math.sin(p * 3)) * (.94 + .06 * Math.sin(TAU * t / length + phase));
      else if (instrument === 'bass') value = (Math.sin(p) + .12 * Math.sin(p * 2)) * Math.exp(-t * .35);
      else if (instrument === 'felt') value = Math.sin(p) * Math.exp(-t * 1.3) + .24 * Math.sin(p * 2.001) * Math.exp(-t * 3.5) + .055 * Math.sin(p * 3.003) * Math.exp(-t * 5);
      else if (instrument === 'glass') value = Math.sin(p) * Math.exp(-t * 1.5) + .12 * Math.sin(p * 2.76) * Math.exp(-t * 3) + .055 * Math.sin(p * 4) * Math.exp(-t * 6);
      else if (instrument === 'marimba') value = Math.sin(p) * Math.exp(-t * 2.8) + .15 * Math.sin(p * 4) * Math.exp(-t * 7);
      else if (instrument === 'pluck') value = (Math.sin(p) + .22 * Math.sin(p * 2) + .08 * Math.sin(p * 3)) * Math.exp(-t * 3.5);
      else if (instrument === 'electric') value = Math.sin(p + .75 * Math.sin(p * 2) * Math.exp(-t * 4)) * Math.exp(-t * 1.6);
      else value = (Math.sin(p) + .12 * Math.sin(p * 2) + .08 * Math.sin(p * 3)) * Math.exp(-t * .65);
      const index = ((begin + i) % frames + frames) % frames;
      left[index] += value * env * gl; right[index] += value * env * gr;
    }
  }
  for (let bar = 0; bar < score.bars; bar++) {
    const section = Math.floor(bar / 8), chordIndex = Math.floor(bar / 2) % 4;
    const chord = cue.progression[chordIndex], start = bar * 4 * beat;
    if (bar % 2 === 0) {
      for (const [i, step] of [0, 2, 4, 6].entries()) add(start, 8 * beat + .9, frequency(degree(cue.root - 12, cue.mode, chord + step)), .036 / (1 + i * .2), 'pad', (i - 1.5) * .27);
    }
    // Bass moves with the harmony. Sparse passages leave breathing space.
    const bassSteps = cue.density === 'driving' ? [0, 1, 2, 3] : cue.density === 'walking' ? [0, 2] : [0];
    for (const b of bassSteps) add(start + b * beat, (cue.density === 'driving' ? .72 : 1.8) * beat, frequency(degree(cue.root - 24, cue.mode, chord)), .06, 'bass');
    if (cue.pulse) for (let b = 0; b < 4; b++) add(start + (b + .08) * beat, .3 * beat, 52, .06 * cue.pulse, 'pulse');
    // A: motif/question, B: response/variation. Last bar leaves a full beat
    // before the returning phrase. Notes and their room tails cross the seam.
    const positions = cue.density === 'driving' ? [0, .75, 1.5, 2, 2.75, 3.5] : cue.density === 'walking' ? [0, 1, 2.5] : cue.density === 'lyrical' ? [0, 1.5, 2.5] : [0, 2.25];
    const breathingBar = bar % 4 === 3;
    const phrase = (bar % 8) * 2;
    for (const [i, b] of positions.entries()) {
      if (breathingBar && (b >= 2 || (cue.density === 'sparse' && bar % 8 === 7))) continue;
      let step = cue.melody[(phrase + i + (section ? 2 : 0)) % cue.melody.length];
      if (section && bar % 4 === 2 && i === 0) step = Math.min(14, step + 2);
      const length = (cue.density === 'driving' ? .55 : cue.density === 'sparse' ? 1.8 : 1.2) * beat + .35;
      const strength = (i === 0 ? 1 : .8) * (section ? .95 : .86);
      add(start + b * beat, length, frequency(degree(cue.root, cue.mode, step)), .072 * strength, cue.instrument, i % 2 ? .2 : -.2);
    }
    // A restrained second voice enters only in B, with a different rhythm.
    if (section && (cue.counter || cue.density === 'lyrical') && bar % 2 === 0) {
      add(start + 3 * beat, 1.6 * beat, frequency(degree(cue.root, cue.mode, chord + 4)), .026, 'glass', .45);
    }
  }
  // Low, deterministic air with an envelope per bar, no hard noise gates.
  let state = cue.seed >>> 0, filtered = 0;
  for (let i = 0; i < frames; i++) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    filtered = filtered * .96 + (state / 0xffffffff * 2 - 1) * .04;
    const fade = smoothstep(i / (rate * .1)) * smoothstep((frames - i) / (rate * .1));
    left[i] += filtered * cue.air * fade; right[i] += filtered * cue.air * fade * .9;
  }
  // Circular short room taps: stereo space without truncating loop tails.
  const dryL = left.slice(), dryR = right.slice();
  for (let i = 0; i < frames; i++) {
    left[i] += dryR[(i - Math.round(rate * .173) + frames) % frames] * .13 + dryL[(i - Math.round(rate * .307) + frames) % frames] * .055;
    right[i] += dryL[(i - Math.round(rate * .211) + frames) % frames] * .13 + dryR[(i - Math.round(rate * .349) + frames) % frames] * .055;
  }
  let dcL = 0, dcR = 0;
  for (let i = 0; i < frames; i++) { dcL += left[i]; dcR += right[i]; }
  dcL /= frames; dcR /= frames;
  let sum = 0, peak = 0;
  for (let i = 0; i < frames; i++) {
    left[i] -= dcL; right[i] -= dcR;
    sum += left[i] ** 2 + right[i] ** 2; peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const scale = Math.min(gain(score.targetRmsDbfs) / Math.sqrt(sum / (frames * 2)), gain(score.peakCeilingDbfs) / peak);
  const bytes = Buffer.alloc(44 + frames * 4);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + frames * 4, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 4, 28); bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) {
    bytes.writeInt16LE(Math.round(clamp(left[i] * scale, -1, 1) * 32767), 44 + i * 4);
    bytes.writeInt16LE(Math.round(clamp(right[i] * scale, -1, 1) * 32767), 46 + i * 4);
  }
  return { bytes, frames, duration, events: events.length };
}
