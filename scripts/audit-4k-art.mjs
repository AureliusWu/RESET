import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const assetsRoot = resolve(game, 'assets');
const planPath = resolve(assetsRoot, '4k/asset-plan.json');
const strict = process.argv.includes('--strict');
const write = process.argv.includes('--write');

const readJson = async p => JSON.parse(await readFile(p, 'utf8'));
const plan = await readJson(planPath);
const portraitOverlay = await readJson(resolve(game, 'content/zz-art-v1.json'));
const sceneOverlay = await readJson(resolve(game, 'content/zzz-scene-art-v1.json'));
const production = [...portraitOverlay.replaceAssets, ...sceneOverlay.replaceAssets];

const pathFromRule = (rule, vars) => Object.entries(vars).reduce((s,[k,v]) => s.replaceAll(`{${k}}`, v), rule);
const targetById = new Map();
for (const c of plan.characters) {
  for (const expression of [...c.expressions, ...(c.extras || [])]) {
    targetById.set(`${c.id}/${expression}`, pathFromRule(plan.pathRules.portraitMaster, { character:c.id, expression }));
  }
}
for (const id of plan.backgrounds) targetById.set(id, pathFromRule(plan.pathRules.backgroundMaster, { assetId:id }));
for (const id of plan.cgs) targetById.set(id, pathFromRule(plan.pathRules.cgMaster, { assetId:id }));
for (const item of plan.anomalies) targetById.set(item.id, item.master);
for (const item of plan.ui) targetById.set(item.id, item.master);

async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function walk(dir) {
  const out = [];
  if (!(await exists(dir))) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

function dimensionsPng(buffer) {
  if (buffer.length < 26 || buffer.toString('hex',0,8) !== '89504e470d0a1a0a') return null;
  const colorType = buffer[25];
  return { width:buffer.readUInt32BE(16), height:buffer.readUInt32BE(20), format:'png', alpha:colorType===4 || colorType===6 };
}
function dimensionsWebp(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii',0,4) !== 'RIFF' || buffer.toString('ascii',8,12) !== 'WEBP') return null;
  let o=12;
  while (o+8<=buffer.length) {
    const type=buffer.toString('ascii',o,o+4), size=buffer.readUInt32LE(o+4), p=o+8;
    if (type==='VP8X' && p+10<=buffer.length) return {width:1+buffer[p+4]+(buffer[p+5]<<8)+(buffer[p+6]<<16),height:1+buffer[p+7]+(buffer[p+8]<<8)+(buffer[p+9]<<16),format:'webp',alpha:Boolean(buffer[p]&0x10)};
    if (type==='VP8 ' && p+10<=buffer.length) {
      const marker=buffer.indexOf(Buffer.from([0x9d,0x01,0x2a]),p);
      if (marker>=0 && marker+7<=buffer.length) return {width:buffer.readUInt16LE(marker+3)&0x3fff,height:buffer.readUInt16LE(marker+5)&0x3fff,format:'webp',alpha:false};
    }
    if (type==='VP8L' && p+5<=buffer.length && buffer[p]===0x2f) {
      const b0=buffer[p+1],b1=buffer[p+2],b2=buffer[p+3],b3=buffer[p+4];
      return {width:1+(((b1&0x3f)<<8)|b0),height:1+(((b3&0x0f)<<10)|(b2<<2)|((b1&0xc0)>>6)),format:'webp',alpha:true};
    }
    o=p+size+(size%2);
  }
  return null;
}
async function imageInfo(path) { const b=await readFile(path); return dimensionsPng(b)||dimensionsWebp(b); }
function minimumFor(id,kind) {
  if (kind==='portrait') return plan.policy.portrait;
  if (kind==='background') return plan.policy.background;
  if (kind==='cg') return plan.policy.cg;
  if (plan.anomalies.some(x=>x.id===id)) return plan.policy.anomaly;
  return plan.policy.uiKeyVisual;
}

const currentSvg=(await walk(assetsRoot)).filter(p=>p.endsWith('.svg')).map(p=>relative(game,p).split(sep).join('/')).sort();
const rows=[]; let missingMappings=0, missing4k=0, undersized=0, missingAlpha=0;
for (const asset of production) {
  const target=targetById.get(asset.id);
  if (!target) { missingMappings++; rows.push({...asset,target:null,state:'NO_MAPPING'}); continue; }
  const full=resolve(game,target);
  if (!(await exists(full))) { missing4k++; rows.push({...asset,target,state:'PLANNED'}); continue; }
  const info=await imageInfo(full), min=minimumFor(asset.id,asset.kind);
  const sizeGood=info && info.width>=min.minimumWidth && info.height>=min.minimumHeight;
  const alphaGood=!min.alpha || Boolean(info?.alpha);
  if (!sizeGood) undersized++;
  if (!alphaGood) missingAlpha++;
  rows.push({...asset,target,state:sizeGood&&alphaGood?'4K_READY':!sizeGood?'UNDERSIZED':'NO_ALPHA',info});
}

const extraPlanned=[...targetById.entries()].filter(([id])=>!production.some(a=>a.id===id));
const counts={productionAssets:production.length,portraits:production.filter(a=>a.kind==='portrait').length,backgrounds:production.filter(a=>a.kind==='background').length,cgs:production.filter(a=>a.kind==='cg').length,svgFilesInSourceTree:currentSvg.length,mapped:production.length-missingMappings,ready4k:rows.filter(r=>r.state==='4K_READY').length,plannedMissing4k:missing4k,undersized,missingAlpha,extraPlanned:extraPlanned.length};
const lines=['# 《回留》4K 美术自动审计','',`生成时间：${new Date().toISOString()}`,'','## 统计','',`- 当前 production 资产：${counts.productionAssets}`,`- 角色差分：${counts.portraits}`,`- 背景：${counts.backgrounds}`,`- CG：${counts.cgs}`,`- 源树 SVG：${counts.svgFilesInSourceTree}`,`- 已建立 4K master 映射：${counts.mapped}/${counts.productionAssets}`,`- 已存在且达到最低尺寸/Alpha 要求：${counts.ready4k}`,`- 已规划但尚未写入：${counts.plannedMissing4k}`,`- 尺寸不达标：${counts.undersized}`,`- 缺少透明通道：${counts.missingAlpha}`,`- 额外规划资产：${counts.extraPlanned}`,'','## Production → 4K master 映射','','| Asset ID | Kind | 当前 production | 4K master | 状态 |','| --- | --- | --- | --- | --- |',...rows.map(r=>`| ${r.id} | ${r.kind} | ${r.src} | ${r.target||'—'} | ${r.state}${r.info?` ${r.info.width}×${r.info.height}`:''} |`),'','## 仍保留的 SVG','',...currentSvg.map(p=>`- ${p}`),'','## 额外规划资产','',...extraPlanned.map(([id,target])=>`- ${id} → ${target}`),''];
const report=lines.join('\n');
console.log(report);
if (write) await writeFile(resolve(root,'docs/ART_4K_AUDIT.md'),report.trimEnd()+'\n');
if (missingMappings) throw new Error(`4K plan is incomplete: ${missingMappings} production asset(s) have no master mapping`);
if (strict && (missing4k||undersized||missingAlpha)) throw new Error(`4K strict audit failed: ${missing4k} missing, ${undersized} undersized, ${missingAlpha} missing alpha`);
