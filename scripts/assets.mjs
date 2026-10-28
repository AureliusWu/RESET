import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function loadAssetManifest(root) {
  const path = resolve(root, 'game/assets/manifest.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  if (manifest.schema !== 1) throw new Error('game/assets/manifest.json must use schema 1');
  if (!Array.isArray(manifest.production) || manifest.production.length !== 64) {
    throw new Error(`R5 visual coverage requires exactly 64 static production assets, got ${manifest.production?.length ?? 0}`);
  }
  if (!Array.isArray(manifest.extras)) throw new Error('game/assets/manifest.json extras must be an array');

  const ids = new Set();
  const sources = new Set();
  const counts = { portrait: 0, background: 0, cg: 0 };
  for (const asset of manifest.production) {
    if (!asset?.id || !asset?.kind || !asset?.src) throw new Error('Invalid production asset manifest entry');
    if (ids.has(asset.id)) throw new Error(`Duplicate production asset id: ${asset.id}`);
    ids.add(asset.id);
    if (!['portrait','background','cg'].includes(asset.kind)) throw new Error(`Unsupported static asset kind ${asset.kind}: ${asset.id}`);
    counts[asset.kind]++;
    if (!asset.src.startsWith('assets/4k/runtime/') || !asset.src.endsWith('.webp')) throw new Error(`Production asset must use canonical 4K runtime WebP: ${asset.id} -> ${asset.src}`);
    if (String(asset.alt ?? '').includes('占位')) throw new Error(`Production asset still carries placeholder alt text: ${asset.id}`);
    if (sources.has(asset.src)) throw new Error(`Production source reused by multiple asset IDs: ${asset.src}`);
    sources.add(asset.src);
  }
  if (counts.portrait !== 33 || counts.background !== 20 || counts.cg !== 11) {
    throw new Error(`Production asset count drift: ${JSON.stringify(counts)}`);
  }

  const extraIds = new Set();
  for (const asset of manifest.extras) {
    if (!asset?.id || !asset?.src) throw new Error('Invalid extra asset manifest entry');
    if (ids.has(asset.id) || extraIds.has(asset.id)) throw new Error(`Duplicate extra asset id: ${asset.id}`);
    extraIds.add(asset.id);
  }
  return manifest;
}
