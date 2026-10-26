import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const mode = process.argv.includes('--legacy') ? 'legacy' : process.argv.includes('--size') ? 'size' : 'check';
const strictLegacy = process.argv.includes('--strict');

const readJson = async p => JSON.parse(await readFile(p, 'utf8'));
const exists = async p => { try { await stat(p); return true; } catch { return false; } };
const plan = await readJson(resolve(game, 'assets/4k/asset-plan.json'));
const portraitOverlay = await readJson(resolve(game, 'content/zz-art-v1.json'));
const sceneOverlay = await readJson(resolve(game, 'content/zzz-scene-art-v1.json'));
const anomalyOverlay = await readJson(resolve(game, 'content/zzzz-anomaly-art-v1.json'));
const production = [...portraitOverlay.replaceAssets, ...sceneOverlay.replaceAssets, ...anomalyOverlay.replaceAssets];

const ids = new Set();
for (const asset of production) {
  if (ids.has(asset.id)) throw new Error(`duplicate production asset id: ${asset.id}`);
  ids.add(asset.id);
  const full = resolve(game, asset.src);
  if (!(await exists(full))) throw new Error(`broken production art reference: ${asset.id} -> ${asset.src}`);
}

if (mode === 'legacy') {
  const legacy = production.filter(a => /\.svg$/i.test(a.src));
  console.log(`production legacy SVG references: ${legacy.length}`);
  for (const asset of legacy) console.log(`${asset.id} -> ${asset.src}`);
  if (strictLegacy && legacy.length) throw new Error(`legacy production SVG references remain: ${legacy.length}`);
  process.exit(0);
}

if (mode === 'size') {
  let total = 0;
  for (const asset of production) {
    const info = await stat(resolve(game, asset.src));
    total += info.size;
    if (info.size > 20 * 1024 * 1024) console.warn(`oversized production art: ${asset.id} ${(info.size/1024/1024).toFixed(1)} MiB`);
  }
  console.log(`production art payload: ${(total/1024/1024).toFixed(1)} MiB`);
  process.exit(0);
}

function pngInfo(buffer) {
  if (buffer.length < 26 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  const colorType = buffer[25];
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    alpha: colorType === 4 || colorType === 6
  };
}

const adopted4k = production.filter(a => a.src.startsWith('assets/4k/'));
for (const asset of adopted4k) {
  const buffer = await readFile(resolve(game, asset.src));
  if (/\.png$/i.test(asset.src)) {
    const info = pngInfo(buffer);
    if (!info) throw new Error(`invalid PNG: ${asset.id} -> ${asset.src}`);
    const anomaly = plan.anomalies.some(item => item.productionId === asset.id || item.id === asset.id);
    const portrait = asset.kind === 'portrait';
    const minimum = anomaly ? plan.policy.anomaly : portrait ? plan.policy.portrait : asset.kind === 'background' ? plan.policy.background : plan.policy.cg;
    if (info.width < minimum.minimumWidth || info.height < minimum.minimumHeight) {
      throw new Error(`undersized 4K asset: ${asset.id} ${info.width}x${info.height}`);
    }
    if ((portrait || anomaly) && minimum.alpha && !info.alpha) throw new Error(`portrait/anomaly missing alpha channel: ${asset.id}`);
  }
}

console.log(`art integrity ok: ${production.length} production refs, ${adopted4k.length} adopted 4K refs`);
