import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

export async function loadContentPacks(root) {
  const contentDir = resolve(root, 'game/content');
  const manifest = JSON.parse(await readFile(resolve(contentDir, 'manifest.json'), 'utf8'));
  if (manifest.schema !== 1 || !Array.isArray(manifest.packs) || manifest.packs.length === 0) {
    throw new Error('game/content/manifest.json must declare schema 1 and a non-empty packs array');
  }
  const seenPaths = new Set();
  const packs = [];
  for (const entry of manifest.packs) {
    if (!entry || typeof entry.path !== 'string' || !entry.path.endsWith('.json')) throw new Error('Invalid content manifest entry');
    if (seenPaths.has(entry.path)) throw new Error('Duplicate content manifest path: ' + entry.path);
    seenPaths.add(entry.path);
    const absolute = resolve(contentDir, entry.path);
    const rel = relative(contentDir, absolute);
    if (rel === '..' || rel.startsWith('..' + sep)) throw new Error('Content pack escapes game/content: ' + entry.path);
    const pack = JSON.parse(await readFile(absolute, 'utf8'));
    if (!pack?.id) throw new Error('Content pack ' + entry.path + ' is missing id');
    packs.push({ entry, pack });
  }
  return { manifest, packs };
}
