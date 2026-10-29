// Optional independent EBU R128 / true-peak measurement. Requires ffmpeg.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const dist = resolve(process.env.RESET_DIST || 'dist'), out = resolve('test-results/music-r1');
const metadata = JSON.parse(await readFile(resolve(dist, 'music-manifest.json'), 'utf8'));
const version = spawnSync('ffmpeg', ['-version'], {encoding:'utf8'});
if (version.error || version.status) throw Error('EBU R128 measurement requires ffmpeg');
const tracks = [];
for (const track of metadata.tracks) {
  const path = resolve(dist, track.src), bytes = await readFile(path);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== track.sha256) throw Error(`Stale measurement source: ${track.id}`);
  const result = spawnSync('ffmpeg', ['-hide_banner','-nostdin','-i',path,'-af','ebur128=peak=true','-f','null','-'], {encoding:'utf8',maxBuffer:4*1024*1024});
  if (result.error || result.status) throw Error(`EBU R128 failed for ${track.id}: ${result.stderr}`);
  const summary = result.stderr.slice(result.stderr.lastIndexOf('Summary:'));
  const integratedLufs = Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  const loudnessRangeLu = Number(summary.match(/LRA:\s+([\d.]+) LU/)?.[1]);
  const truePeakDbfs = Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
  if (![integratedLufs,loudnessRangeLu,truePeakDbfs].every(Number.isFinite) || integratedLufs < -18 || integratedLufs > -14 || truePeakDbfs > -2.9) throw Error(`Outside perceptual mix budget: ${track.id}`);
  tracks.push({id:track.id,sha256,integratedLufs,loudnessRangeLu,truePeakDbfs});
}
const spreadLu = Math.max(...tracks.map(t=>t.integratedLufs)) - Math.min(...tracks.map(t=>t.integratedLufs));
if (spreadLu > 2) throw Error(`Perceived score loudness spread exceeds 2 LU: ${spreadLu}`);
const report = {schema:1,status:'PASS',measurement:'FFmpeg EBU R128 integrated LUFS and oversampled true peak',tool:version.stdout.split('\n')[0],spreadLu,tracks,subjectiveListening:'NOT_CLAIMED'};
await mkdir(out,{recursive:true}); await writeFile(resolve(out,'loudness-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:'music-loudness-ok',tracks:tracks.length,spreadLu,lufsRange:[Math.min(...tracks.map(t=>t.integratedLufs)),Math.max(...tracks.map(t=>t.integratedLufs))],maxTruePeakDbfs:Math.max(...tracks.map(t=>t.truePeakDbfs))},null,2));
