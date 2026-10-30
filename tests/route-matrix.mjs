// Enumerate decision paths, not just scene/line witnesses. Retry loops have an
// explicit finite bound; no claim is made about infinitely repeated deaths.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dist=resolve(process.env.RESET_DIST||'dist');
const project=JSON.parse(await readFile(resolve(dist,'project.json'),'utf8'));
const manifest=JSON.parse(await readFile(resolve(dist,'build-manifest.json'),'utf8'));
const {createProject}=await import(pathToFileURL(resolve(dist,'lib/index.js')));
const create=()=>createProject(project,'https://route-matrix.test/',{settings:{textDelayMs:0,reducedMotion:true}}).session;
const initial=create();
const snapshot=session=>{const save=session.save();save.state.history=[];return save;};
const queue=[{save:snapshot(initial),trace:[],visits:{[project.entry]:1}}];initial.dispose();
const scenes=new Map(project.scenes.map(s=>[s.id,s]));
const reached=new Set(),lines=new Set(),actions=new Set(),terminals=[],recoveries=new Set(),variants=new Set();
const session=create(),branch=create(),replay=create();
let processed=0,boundedEdges=0,transitions=0;
while(queue.length){
  assert.ok(++processed<20000,'Route frontier exceeded the documented finite bound');
  if(processed%1000===0)console.log(`Route frontier ${processed}; pending ${queue.length}; endings ${terminals.length}`);
  const node=queue.pop();session.restore(node.save);
  try{
    let previous=session.getView().frame.sceneId;
    for(let budget=0;budget<5000;budget++){
      const frame=session.getView().frame,source=scenes.get(frame.sceneId);
      if(frame.sceneId!==previous){node.visits[frame.sceneId]=(node.visits[frame.sceneId]||0)+1;previous=frame.sceneId;}
      assert.ok(source,frame.sceneId);reached.add(source.id);
      assert.equal(frame.lineId,source.lines[frame.line].id,source.id);
      const original=source.lines[frame.line],variant=original.variant;
      const stats=node.save.state.stats;
      const alternate=variant&&(stats[variant.stat]||0)>=variant.min;
      assert.equal(frame.text,alternate?variant.text:original.text,frame.lineId);
      if(variant)variants.add(frame.lineId+'/'+Boolean(alternate));
      lines.add(frame.lineId);
      if(frame.ending&&!frame.canAdvance){
        terminals.push({ending:frame.ending,trace:node.trace,stats:session.save().state.stats});
        replay.restore(session.save());assert.equal(replay.getView().frame.ending,frame.ending);
      }
      if(frame.actions.length){
        for(const action of frame.actions){
          try{
            branch.restore(snapshot(session));assert.equal(branch.act(action.id),true);
            actions.add(source.id+'/'+action.id);
            const target=branch.getView().frame.sceneId,count=(node.visits[target]||0)+1;
            if(count>2){boundedEdges++;continue;}
            if(['death-fifth','death-sixth'].includes(frame.ending))recoveries.add(frame.ending);
            const visits={...node.visits,[target]:count};
            queue.push({save:snapshot(branch),visits,trace:[...node.trace,{scene:source.id,action:action.id}]});transitions++;
          }finally{/* reusable isolated branch runtime */}
        }
        break;
      }
      if(!session.next()){assert.ok(frame.ending,'Unmarked terminal '+source.id);break;}
      assert.ok(budget<4999,'Narrative path failed to terminate');
    }
  }finally{/* reusable primary runtime; every frontier restores its own snapshot */}
}
session.dispose();branch.dispose();replay.dispose();
const reserved=['focus_linwan_open','focus_xiaoman_open','focus_xuqi_open'];
assert.deepEqual(project.scenes.filter(s=>!reached.has(s.id)).map(s=>s.id).sort(),reserved);
const expected=['normal-linwan','normal-xiaoman','normal-xuqi','normal-tinglan','normal-tangli','normal-nanxing','bad-home','bad-station','death-fifth','death-sixth','bad-no-checkpoint','bad-permanent-save','true-end'];
const counts=Object.fromEntries(expected.map(id=>[id,terminals.filter(t=>t.ending===id).length]));
assert.ok(Object.values(counts).every(Boolean),JSON.stringify(counts));
assert.deepEqual([...recoveries].sort(),['death-fifth','death-sixth']);
for(const scene of project.scenes.filter(s=>reached.has(s.id)))for(const choice of scene.choices||[])assert.ok(actions.has(scene.id+'/'+choice.id),'Uncovered authored choice '+scene.id+'/'+choice.id);
const methods=['trust_memory','trust_feeling','trust_night'],routes=['linwan','xiaoman','xuqi','tinglan','tangli','nanxing'];
for(const method of methods)for(const route of routes){
  const matching=terminals.filter(t=>t.trace.some(a=>a.action===method)&&t.trace.some(a=>a.action==='route_'+route));
  assert.ok(matching.some(t=>t.ending==='normal-'+route),method+'/'+route+'/normal');
  assert.ok(matching.some(t=>t.ending==='true-end'),method+'/'+route+'/true');
}
assert.ok(terminals.some(t=>t.ending==='bad-permanent-save'&&t.trace.some(a=>a.action==='create_permanent_save')));
assert.ok(terminals.some(t=>t.ending==='bad-permanent-save'&&t.trace.some(a=>a.action==='fear_and_save')));
const variantCoverage=project.scenes.filter(s=>reached.has(s.id)).flatMap(s=>s.lines.filter(l=>l.variant).map(l=>({line:l.id,base:variants.has(l.id+'/false'),alternate:variants.has(l.id+'/true')})));
assert.ok(variantCoverage.every(v=>v.base||v.alternate),'Unvisited authored variant');
const replayChoices=project.scenes.filter(s=>reached.has(s.id)).flatMap(s=>(s.choices||[]).map(c=>({scene:s.id,action:c.id,next:c.next})));
await mkdir('test-results/final-qa',{recursive:true});
const report={schema:1,status:'PASS',version:project.version,contentFingerprint:manifest.contentFingerprint,reachableScenes:reached.size,canonicalScenes:project.scenes.length,reachableLines:lines.size,authoredChoicesCovered:replayChoices.length,processedFrontiers:processed,transitions,terminalPaths:terminals.length,endings:counts,methodRoutePairs:18,pairsCheckedFor:['normal-end','true-end'],retryPolicy:'At most two entries per scene per path; both repeatable deaths and their recoveries covered. Infinite retry sequences are not enumerated.',boundedEdges,reservedScenes:reserved,reservedPolicy:'Retained legacy route-open nodes have no canonical incoming edge; reviewed as source, not claimed playable.',variantCoverage,choices:replayChoices,paths:terminals};
await writeFile('test-results/final-qa/route-matrix.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,paths:undefined},null,2));
