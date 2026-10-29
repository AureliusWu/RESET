import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspectWav, musicViolations } from '../scripts/audio-metrics.mjs';
import { pulseEnvelope, validateScore } from '../scripts/music-score.mjs';
const dist = resolve(process.env.RESET_DIST || 'dist');
const metadata = JSON.parse(await readFile(resolve(dist, 'music-manifest.json'), 'utf8'));

test('real packaged score rejects a click in the middle, independent of a clean loop boundary', async () => {
  const track = metadata.tracks.find(t => t.id === 'music-fracture-pulse');
  const original = await readFile(resolve(dist, track.src));
  assert.deepEqual(musicViolations(inspectWav(original)), []);
  const broken = Buffer.from(original), frame = 32000 * 3;
  broken.writeInt16LE(20000, 44 + frame * 4); broken.writeInt16LE(-20000, 44 + (frame + 1) * 4);
  const metrics = inspectWav(broken);
  assert.ok(metrics.seamStep < .015, 'the regression must retain its clean loop seam');
  assert.ok(musicViolations(metrics).includes('internal sample discontinuity'));
});

test('loop seam, silence, clipping, stereo collapse and duplicate A/B are independent gates', async () => {
  const track = metadata.tracks[0], original = await readFile(resolve(dist, track.src));
  const broken = Buffer.from(original);
  broken.writeInt16LE(22000, 44); broken.writeInt16LE(-22000, broken.length - 4);
  assert.ok(musicViolations(inspectWav(broken)).includes('loop discontinuity'));
  const muted = Buffer.from(original); muted.fill(0, 44);
  const errors = musicViolations(inspectWav(muted));
  for (const name of ['blank gap','RMS outside reading mix budget','stereo imbalance/collapse','A/B sections are effectively identical']) assert.ok(errors.includes(name));
  const clipped = Buffer.from(original); clipped.writeInt16LE(32767, 44 + 32000 * 4);
  assert.ok(musicViolations(inspectWav(clipped)).includes('insufficient sample headroom/clipping'));
});

test('PCM parser rejects truncation and false format declarations', async () => {
  const original = await readFile(resolve(dist, metadata.tracks[0].src));
  assert.throws(() => inspectWav(original.subarray(0, original.length - 2)), /truncated/);
  for (const [offset, value] of [[20, 3], [22, 1], [32, 0], [34, 24]]) {
    const broken = Buffer.from(original); broken.writeUInt16LE(value, offset);
    assert.throws(() => inspectWav(broken), /PCM16/);
  }
});

test('low-frequency pulse has a continuous onset and release for every beat', () => {
  const attack = .012, duration = .2;
  assert.equal(pulseEnvelope(0, duration), 0); assert.equal(pulseEnvelope(duration, duration), 0);
  assert.ok(pulseEnvelope(1 / 32000, duration) < .0001);
  assert.ok(pulseEnvelope(attack, duration) > .8);
  let previous = 0, maxStep = 0;
  for (let i = 0; i <= duration * 32000; i++) {
    const value = pulseEnvelope(i / 32000, duration);
    maxStep = Math.max(maxStep, Math.abs(value - previous)); previous = value;
  }
  assert.ok(maxStep < .005, `pulse envelope still jumps: ${maxStep}`);
});

test('score source fails closed on invalid tempo, duplicate identities and unsafe mix settings', async () => {
  const original = JSON.parse(await readFile('game/music/score.json', 'utf8'));
  assert.doesNotThrow(() => validateScore(original));
  for (const mutate of [s => { s.cues[0].bpm = 0; }, s => { s.cues[1].id = s.cues[0].id; }, s => { s.peakCeilingDbfs = 0; }, s => { s.cues[0].melody[0] = null; }, s => { s.cues[0].pulse = 5; }]) {
    const broken = structuredClone(original); mutate(broken); assert.throws(() => validateScore(broken));
  }
});
