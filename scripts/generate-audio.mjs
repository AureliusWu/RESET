import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHash } from 'node:crypto';
import { renderScoreCue, validateScore } from './music-score.mjs';
import { renderSfxCue, validateSfx, inspectSfx, sfxViolations } from './sfx-design.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'game/assets/generated');
const sampleRate = 32000;
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
const sfxBytes = await readFile(resolve(root, 'game/sfx/cues.json'));
const sfx = JSON.parse(sfxBytes); validateSfx(sfx);
const effects = [];
for (const cue of sfx.cues) {
  const result = renderSfxCue(cue, sfx), metrics = inspectSfx(result.bytes), failures = sfxViolations(metrics);
  if (failures.length) throw Error(`${cue.id}: ${failures.join(', ')}`);
  const src = `assets/generated/${cue.id}.wav`;
  await writeFile(resolve(root, 'game', src), result.bytes);
  effects.push({id:cue.id,title:cue.title,design:cue.design,src,loop:false,frames:result.frames,duration:result.duration,bytes:result.bytes.length,sha256:hash(result.bytes),...metrics});
}
await writeFile(resolve(out, 'sfx-manifest.json'), JSON.stringify({schema:1,revision:'sfx-r1',synthesis:'original-procedural',provenance:sfx.provenance,sampleRate,channels:2,bits:16,sourceSha256:hash(sfxBytes),rendererSha256:hash(await readFile(resolve(root,'scripts/sfx-design.mjs'))),runtime:sfx.runtime,effects},null,2)+'\n');
await writeFile(resolve(out, 'music-manifest.json'), JSON.stringify({
  schema: 1, revision: 'music-r1', synthesis: 'original-procedural',
  provenance: score.provenance, scoreSha256: hash(scoreBytes), rendererSha256: hash(generatorBytes),
  sampleRate, channels: 2, bits: 16, targetRmsDbfs: score.targetRmsDbfs,
  peakCeilingDbfs: score.peakCeilingDbfs, tracks
}, null, 2) + '\n');
console.log(`Generated ${tracks.length} original 16-bar A/B score cues and ${effects.length} redesigned stereo one-shot SFX at ${sampleRate} Hz`);
