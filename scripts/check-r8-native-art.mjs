// Mechanical evidence only: native provenance and exact files cannot grant ART_PASS.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadSupportingArt} from './supporting-art.mjs';
import {loadContentPacks} from './content-packs.mjs';
const root=resolve('.'),json=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const ledger=await json('game/visual/r8-native-art-production.json');
const groups={portraits:'characters',anomalies:'anomalies',cgs:'cg',backgrounds:'backgrounds',ui:'ui'};
const expected={portraits:11,anomalies:2,cgs:8,backgrounds:20,ui:5};
const records=[],missing=[],digest=b=>createHash('sha256').update(b).digest('hex');
for(const [group,category] of Object.entries(groups)){
 assert.equal(ledger[group]?.length,expected[group],`${group} scope must be explicit`);
 for(const item of ledger[group]){
  const base=`game/art-sources/chatgpt/${category}/${item.id}/`;
  let p;try{p=await json(base+'provenance.json');}catch(e){if(e.code==='ENOENT'&&process.argv.includes('--partial')){missing.push(item.id);continue;}throw e;}
  if(p.sourceType!=='chatgpt-native-imagegen'&&process.argv.includes('--partial')){missing.push(item.id);continue;}
  assert.equal(p.sourceType,'chatgpt-native-imagegen',item.id);assert.equal(p.native4kClaim,false,item.id);
  assert.ok(!p.sourceVector&&!p.assets?.some(a=>a.sourceVector),`${item.id}: vector source is still authoritative`);
  for(const field of ['prompt','spec']){assert.ok(p[field].startsWith(base),`${item.id}: ${field} outside source directory`);assert.equal(digest(await readFile(p[field])),p[field+'SHA256'],`${item.id}: ${field} hash`);}
  const a=p.assets?.[0];assert.ok(a,item.id);
  for(const kind of ['original','master','runtime']){assert.equal(digest(await readFile(a[kind])),a[kind+'SHA256'],`${item.id}: ${kind} hash`);assert.ok(a[kind+'Size']?.every(n=>Number.isInteger(n)&&n>0),`${item.id}: ${kind} actual dimensions`);}
  records.push({id:item.id,category,original:a.original,originalSize:a.originalSize,originalSHA256:a.originalSHA256,masterSHA256:a.masterSHA256,runtime:a.runtime,runtimeSHA256:a.runtimeSHA256,native4kClaim:false});
 }
}
const art=await loadSupportingArt(root);
{
 const manifest=await json('game/assets/manifest.json');const mapping=await json('game/visual/r8-scene-background-plan.json');const {packs}=await loadContentPacks(root);const scenes=new Map(packs.filter(x=>x.entry.role==='chapter').flatMap(x=>x.pack.scenes.map(s=>[s.id,s])));
 assert.equal(scenes.size,82);for(const m of mapping.mappings){assert.equal(scenes.get(m.scene)?.background,m.background,m.scene);assert.ok(manifest.production.some(a=>a.id===m.background),m.background);}
 for(const p of records)if(p.category!=='ui')assert.ok(manifest.production.some(a=>'game/'+a.src===p.runtime),`${p.id}: absent from manifest`);
}
const report={status:missing.length?'PARTIAL':art.approved.size===art.characters.length&&art.acceptance.releaseGate==='PASS'?'TECH_READY_ART_PASS':'TECH_READY_ART_UNVERIFIED',nativeAssetsVerified:records.length,requiredNewNativeAssets:46,supportingNativeCandidates:art.records.filter(r=>r.artifacts).length,supportingApproved:art.approved.size,supportingOwnerApproved:art.ownerApproved.size,supportingAiSimulatedApproved:art.simulatedApproved.size,missing,records,note:'Includes 11 replacement supporting portraits; Xu Jiashu pilot validated separately. Mechanical evidence does not grant owner visual PASS or device acceptance.'};
if(process.argv.includes('--write')){await mkdir('docs/evidence/r8-native-art',{recursive:true});await writeFile('docs/evidence/r8-native-art/source-audit.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({...report,records:undefined},null,2));
