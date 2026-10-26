import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = resolve(root, 'game');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const exists = async path => { try { await stat(path); return true; } catch { return false; } };
const assert = (value, message) => { if (!value) throw new Error(message); };

const plan = await readJson(resolve(game, 'assets/4k/asset-plan.json'));
const portraitOverlay = await readJson(resolve(game, 'content/zz-art-v1.json'));
const sceneOverlay = await readJson(resolve(game, 'content/zzz-scene-art-v1.json'));
const production = [...portraitOverlay.replaceAssets, ...sceneOverlay.replaceAssets];

const render = (rule, vars) => Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), rule);

function pngInfo(buffer) {
  if (buffer.length < 26 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  const colorType = buffer[25];
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), alpha: colorType === 4 || colorType === 6 };
}

function webpInfo(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const p = offset + 8;
    if (type === 'VP8X' && p + 10 <= buffer.length) return {
      width: 1 + buffer[p + 4] + (buffer[p + 5] << 8) + (buffer[p + 6] << 16),
      height: 1 + buffer[p + 7] + (buffer[p + 8] << 8) + (buffer[p + 9] << 16),
      alpha: Boolean(buffer[p] & 0x10)
    };
    if (type === 'VP8L' && p + 5 <= buffer.length && buffer[p] === 0x2f) {
      const b0 = buffer[p + 1], b1 = buffer[p + 2], b2 = buffer[p + 3], b3 = buffer[p + 4];
      return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)), alpha: true };
    }
    if (type === 'VP8 ' && p + 10 <= buffer.length) {
      const marker = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), p);
      if (marker >= 0 && marker + 7 <= buffer.length) return { width: buffer.readUInt16LE(marker + 3) & 0x3fff, height: buffer.readUInt16LE(marker + 5) & 0x3fff, alpha: false };
    }
    offset = p + size + (size % 2);
  }
  return null;
}

function pathsFor(asset) {
  if (asset.kind === 'portrait') {
    const [character, expression] = asset.id.split('/');
    if (!character || !expression || !plan.characters.some(item => item.id === character)) return null;
    return {
      master: render(plan.pathRules.portraitMaster, { character, expression }),
      runtime: render(plan.pathRules.portraitRuntime, { character, expression }),
      policy: plan.policy.portrait,
      character
    };
  }
  if (asset.kind === 'background' && plan.backgrounds.includes(asset.id)) return {
    master: render(plan.pathRules.backgroundMaster, { assetId: asset.id }), runtime: render(plan.pathRules.backgroundRuntime, { assetId: asset.id }), policy: plan.policy.background
  };
  if (asset.kind === 'cg' && plan.cgs.includes(asset.id)) return {
    master: render(plan.pathRules.cgMaster, { assetId: asset.id }), runtime: render(plan.pathRules.cgRuntime, { assetId: asset.id }), policy: plan.policy.cg
  };
  const anomaly = plan.anomalies.find(item => item.id === asset.id);
  if (anomaly) return { master: anomaly.master, runtime: anomaly.runtime, policy: plan.policy.anomaly };
  const ui = plan.ui.find(item => item.id === asset.id);
  if (ui) return { master: ui.master, runtime: ui.runtime, policy: plan.policy.uiKeyVisual };
  return null;
}

async function verifyMaster(relativePath, policy, label) {
  const full = resolve(game, relativePath);
  assert(await exists(full), `${label} master missing: ${relativePath}`);
  const info = pngInfo(await readFile(full));
  assert(info, `${label} master is not a valid PNG: ${relativePath}`);
  assert(info.width >= policy.minimumWidth && info.height >= policy.minimumHeight, `${label} master undersized: ${info.width}x${info.height}`);
  if (policy.alpha) assert(info.alpha, `${label} master is missing alpha: ${relativePath}`);
  return info;
}

let adopted = 0;
const adoptedCharacters = new Set();
for (const asset of production) {
  if (!asset.src.startsWith('assets/4k/runtime/')) continue;
  const paths = pathsFor(asset);
  assert(paths, `4K runtime asset has no migration mapping: ${asset.id}`);
  assert(asset.src === paths.runtime, `4K runtime path drift: ${asset.id} -> ${asset.src}; expected ${paths.runtime}`);
  const masterInfo = await verifyMaster(paths.master, paths.policy, asset.id);
  const runtimePath = resolve(game, paths.runtime);
  assert(await exists(runtimePath), `runtime derivative missing: ${paths.runtime}`);
  const runtimeInfo = webpInfo(await readFile(runtimePath));
  assert(runtimeInfo, `runtime derivative is not valid WebP: ${paths.runtime}`);
  assert(runtimeInfo.width > 0 && runtimeInfo.height > 0, `runtime derivative has invalid size: ${asset.id}`);
  assert(runtimeInfo.width <= masterInfo.width && runtimeInfo.height <= masterInfo.height, `runtime derivative exceeds master dimensions: ${asset.id}`);
  if (paths.policy.alpha) assert(runtimeInfo.alpha, `runtime derivative is missing alpha: ${asset.id}`);
  adopted++;
  if (paths.character) adoptedCharacters.add(paths.character);
}

for (const characterId of adoptedCharacters) {
  const character = plan.characters.find(item => item.id === characterId);
  for (const expression of [...character.expressions, ...(character.extras || [])]) {
    const master = render(plan.pathRules.portraitMaster, { character: characterId, expression });
    await verifyMaster(master, plan.policy.portrait, `${characterId}/${expression}`);
  }
  if (characterId === 'linwan') {
    for (const alias of ['base', 'normal']) {
      await verifyMaster(`assets/4k/characters/linwan/${alias}.png`, plan.policy.portrait, `linwan/${alias}`);
    }
  }
}

console.log(`4K production pairing ok: ${adopted} runtime asset(s), ${adoptedCharacters.size} adopted character(s)`);
