import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {inspectWav} from './audio-metrics.mjs';
import {inspectSfx,sfxViolations,validateSfx} from './sfx-design.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function checkSfxPackage(dist=resolve(process.env.RESET_DIST||resolve(root,'dist'))) {
  const configBytes=await readFile(resolve(root,'game/sfx/cues.json')),config=JSON.parse(configBytes);validateSfx(config);
  const bindingBytes=await readFile(resolve(root,'game/sfx/bindings.json')),bindings=JSON.parse(bindingBytes);
  const project=JSON.parse(await readFile(resolve(dist,'project.json'))),manifest=JSON.parse(await readFile(resolve(dist,'build-manifest.json'))),sw=await readFile(resolve(dist,'sw.js'),'utf8');
  const metadataBytes=await readFile(resolve(dist,'sfx-manifest.json')),metadata=JSON.parse(metadataBytes);
  function assert(condition,message){if(!condition)throw Error(message);}
  function packaged(src,bytes){const r=manifest.files.find(f=>f.name===src);assert(r?.size===bytes.length&&r.sha256===hash(bytes)&&sw.includes(JSON.stringify(src)),`SFX final/offline bytes mismatch ${src}`);}
  assert(metadata.schema===1&&metadata.revision==='sfx-r1'&&metadata.synthesis==='original-procedural'&&metadata.sourceSha256===hash(configBytes)&&metadata.rendererSha256===hash(await readFile(resolve(root,'scripts/sfx-design.mjs'))),'SFX provenance is stale');
  assert(JSON.stringify(metadata.runtime)===JSON.stringify(config.runtime),'SFX runtime policy drift');
  assert(manifest.extensions.includes('reset-sfx-r1'),'SFX runtime extension absent');
  packaged('sfx-manifest.json',metadataBytes);packaged('sfx.mjs',await readFile(resolve(dist,'sfx.mjs')));
  const app=await readFile(resolve(dist,'app.mjs'),'utf8');assert(app.includes('mountSfxBridge(game,project)')&&app.includes('playSfx:sfx.play,stopSfx:sfx.stop')&&app.includes('sfx.dispose()'),'SFX bridge is not mounted/retired');
  const ids=new Set(),effects=[];let totalBytes=0;
  assert(metadata.effects.length===7,'SFX catalogue count changed');
  for(const cue of config.cues){
    const asset=project.assets.find(a=>a.id===cue.id&&a.kind==='audio'),record=metadata.effects.find(e=>e.id===cue.id);
    assert(asset&&record&&!ids.has(cue.id),`Missing/duplicate SFX ${cue.id}`);ids.add(cue.id);
    const bytes=await readFile(resolve(dist,asset.src));const pcm=inspectWav(bytes),metrics=inspectSfx(bytes);packaged(asset.src,bytes);
    assert(record.src===asset.src&&record.loop===false&&record.frames===pcm.frames&&record.duration===metrics.duration&&record.bytes===bytes.length&&record.sha256===hash(bytes),`Stale SFX metadata ${cue.id}`);
    assert(Math.abs(cue.duration-metrics.duration)<1/32000,`SFX timing drift ${cue.id}`);
    const failures=sfxViolations(metrics);assert(!failures.length,`${cue.id}: ${failures.join(', ')}`);
    assert(bytes.readInt16LE(44)===0&&bytes.readInt16LE(46)===0&&bytes.readInt16LE(bytes.length-4)===0&&bytes.readInt16LE(bytes.length-2)===0,`${cue.id}: hard-cut endpoint`);
    for(const [key,value] of Object.entries(metrics))assert(record[key]===value,`SFX measurement drift ${cue.id}/${key}`);
    totalBytes+=bytes.length;effects.push({id:cue.id,sha256:record.sha256,...metrics});
  }
  assert(totalBytes<=512*1024,'One-shot cache budget exceeded');
  const lineMap=new Map(project.scenes.flatMap(scene=>scene.lines.map(line=>[line.id,{sceneId:scene.id,text:line.text}])));
  const actual=Object.entries(project.stage.lines).filter(([,s])=>s.sound).map(([lineId,s])=>[lineId,s.sound]);
  assert(new Set(bindings.bindings.map(b=>b.lineId)).size===bindings.bindings.length&&actual.length===bindings.bindings.length,'Duplicate/untracked SFX line mapping');
  for(const b of bindings.bindings){const line=lineMap.get(b.lineId);assert(line?.sceneId===b.sceneId&&line.text===b.text&&project.stage.lines[b.lineId]?.sound===b.sfxId&&ids.has(b.sfxId),`SFX semantic binding drift ${b.lineId}`);}
  for(const id of bindings.silentLines)assert(!project.stage.lines[id]?.sound,`A silent/unsent passage must stay silent: ${id}`);
  const report={schema:1,status:'PASS',revision:'sfx-r1',packageFingerprint:manifest.contentFingerprint,sourceSha256:metadata.sourceSha256,rendererSha256:metadata.rendererSha256,bindingSha256:hash(bindingBytes),bindings:bindings.bindings.length,totalBytes,effects,subjectiveListening:'NOT_CLAIMED',physicalDevices:'NOT_RUN'};
  await mkdir(resolve(root,'test-results/sfx-r1'),{recursive:true});await writeFile(resolve(root,'test-results/sfx-r1/audio-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:'sfx-ok',effects:7,bindings:report.bindings,totalBytes,maxOnsetMs:Math.max(...effects.map(e=>e.onsetMs)),impactPeakMs:effects.find(e=>e.id==='sfx-impact').peakMs,loadPeakMs:effects.find(e=>e.id==='sfx-load').peakMs},null,2));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await checkSfxPackage();
