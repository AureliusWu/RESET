// Apply only recorded background substitutions; never modify story or approvals.
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('.'),json=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const mapping=await json('game/visual/r8-scene-background-plan.json');
const ledger=await json('game/visual/r8-native-art-production.json');
assert.equal(mapping.mappings.length,23);assert.equal(ledger.backgrounds.length,20);
const manifest=await json('game/assets/manifest.json'),plan=await json('game/assets/4k/asset-plan.json');
const chapters=await Promise.all((await readdir('game/content/chapters')).filter(f=>f.endsWith('.json')).map(async f=>({path:'game/content/chapters/'+f,value:await json('game/content/chapters/'+f)})));
const scenes=new Map(chapters.flatMap(c=>c.value.scenes.map(s=>[s.id,s])));assert.equal(scenes.size,82);
const story=s=>JSON.stringify({...s,background:undefined});
const before=new Map([...scenes].map(([id,s])=>[id,story(s)]));
for(const item of ledger.backgrounds){
 const p=await json(`game/art-sources/chatgpt/backgrounds/${item.id}/provenance.json`);
 assert.equal(p.sourceType,'chatgpt-native-imagegen',item.id);const a=p.assets[0];
 for(const kind of ['original','master','runtime'])assert.equal(createHash('sha256').update(await readFile(a[kind])).digest('hex'),a[kind+'SHA256'],`${item.id}: ${kind}`);
 const asset={id:item.id,kind:'background',src:`assets/4k/runtime/backgrounds/${item.id}.webp`,alt:item.name};
 const existing=manifest.production.find(a=>a.id===item.id);if(existing)assert.deepEqual(existing,asset);else manifest.production.push(asset);
 if(!plan.backgrounds.includes(item.id))plan.backgrounds.push(item.id);
}
for(const m of mapping.mappings){const s=scenes.get(m.scene);assert.ok(s,m.scene);assert.ok([m.previousBackground,m.background].includes(s.background),`${m.scene}: background changed outside recorded plan`);s.background=m.background;}
for(const [id,s] of scenes)assert.equal(story(s),before.get(id),`${id}: non-background story mutation`);
manifest.source='R8 native scene art completion; stable asset IDs';
for(const c of chapters)await writeFile(c.path,JSON.stringify(c.value,null,2)+'\n');
await writeFile('game/assets/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('game/assets/4k/asset-plan.json',JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({backgroundsAdded:20,sceneMappingsApplied:23,scenes:82,storyAndSaveStructureUnchanged:true,visualApprovalUnchanged:true}));
