import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {PRESETS} from '../game/runtime/direction.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
export function validateDirection(project,sheet){
  const assert=(v,m)=>{if(!v)throw Error(m);};
  assert(sheet.schema===1&&sheet.revision==='direction-r1'&&sheet.suppressLegacyEffects===true,'Invalid direction policy');
  assert(sheet.limits?.maxFlashOpacity===.2&&sheet.limits.maxCameraPx===2&&sheet.limits.maxScale===1.012&&sheet.limits.maxBeatMs===650,'Direction limits drift');
  assert(sheet.chapters?.length===7&&new Set(sheet.chapters.map(c=>c.id)).size===7&&sheet.chapters.every(c=>Number.isInteger(c.id)&&c.id>=1&&c.id<=7&&c.title&&c.subtitle),'Invalid chapter captions');
  const scenes=new Map(project.scenes.map(s=>[s.id,s])),lines=new Map(project.scenes.flatMap(s=>s.lines.map(l=>[l.id,{sceneId:s.id,text:l.text}])));
  assert(project.scenes.every(s=>sheet.chapters.some(c=>c.id===s.chapter)),'Scene chapter metadata absent');
  for(const [id,mood]of Object.entries(sheet.moods))assert(scenes.has(id)&&['everyday','anomaly','tension','memory','quiet','release'].includes(mood),`Invalid mood ${id}`);
  assert(Object.keys(sheet.beats).length===15,'Expected fifteen authored story beats');
  for(const [id,beat]of Object.entries(sheet.beats)){const line=lines.get(id);assert(line?.sceneId===beat.sceneId&&line.text===beat.text&&PRESETS[beat.preset],`Direction beat drift ${id}`);}
  for(const id of sheet.quietLines)assert(lines.has(id)&&!sheet.beats[id],`Quiet beat must stay quiet ${id}`);
  for(const [id,p]of Object.entries(PRESETS)){
    assert(p.duration>0&&p.duration<=sheet.limits.maxBeatMs,`Long beat ${id}`);
    for(const f of p.frames){if(['light','warm','shade'].includes(p.target))assert(f.opacity>=0&&f.opacity<=.2,`Excess flash ${id}`);
      for(const m of f.transform?.matchAll(/translateX\((-?[\d.]+)px\)/g)??[])assert(Math.abs(Number(m[1]))<=2,`Excess shake ${id}`);
      for(const m of f.transform?.matchAll(/scale\(([\d.]+)\)/g)??[])assert(Number(m[1])>=1&&Number(m[1])<=1.012,`Excess zoom ${id}`);
    }
  }
  return {scenes:scenes.size,chapters:7,beats:15,moods:Object.keys(sheet.moods).length};
}
export async function checkDirectionPackage(dist=resolve(process.env.RESET_DIST||resolve(root,'dist'))){
  const project=JSON.parse(await readFile(resolve(dist,'project.json'))),sheet=JSON.parse(await readFile(resolve(root,'game/direction/cues.json')));
  const summary=validateDirection(project,sheet),manifest=JSON.parse(await readFile(resolve(dist,'build-manifest.json'))),sw=await readFile(resolve(dist,'sw.js'),'utf8');
  const assert=(v,m)=>{if(!v)throw Error(m);},hash=b=>createHash('sha256').update(b).digest('hex');
  assert(manifest.extensions.includes('reset-direction-r1'),'Direction extension absent');
  for(const file of ['direction.mjs','direction.css','direction-data.mjs']){const bytes=await readFile(resolve(dist,file)),record=manifest.files.find(f=>f.name===file);assert(record?.size===bytes.length&&record.sha256===hash(bytes)&&sw.includes(JSON.stringify(file)),`Direction final/offline mismatch ${file}`);}
  assert(await readFile(resolve(dist,'direction-data.mjs'),'utf8')==='export default '+JSON.stringify(sheet)+';\n','Cue sheet package drift');
  for(const group of ['scenes','lines'])for(const [id,value]of Object.entries(project.stage[group]))assert(!value.effect,`Legacy full-stage effect remains ${id}`);
  const app=await readFile(resolve(dist,'app.mjs'),'utf8'),html=await readFile(resolve(dist,'index.html'),'utf8');
  assert(app.includes('mountDirectionBridge(game,project,directionData)')&&app.includes('direction.dispose()')&&app.includes('mountUiBridge(game,project)')&&html.includes('href="./direction.css"'),'Direction lifecycle missing');
  const report={schema:1,status:'PASS',revision:sheet.revision,...summary,sourceSha256:hash(await readFile(resolve(root,'game/direction/cues.json'))),packageFingerprint:manifest.contentFingerprint,limits:sheet.limits,physicalDevices:'NOT_RUN'};
  await mkdir(resolve(root,'test-results/direction-r1'),{recursive:true});await writeFile(resolve(root,'test-results/direction-r1/source-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await checkDirectionPackage();
