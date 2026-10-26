import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngIcon } from '../scripts/pwa-assets.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('galgame completeness layer covers brand, chapters, props and chibi cast', async () => {
  const ui = await readFile(resolve(root, 'game/runtime/ui.mjs'), 'utf8');
  for (const marker of ['brand-mark','chapter-card','memory-cast','archive_erased_map','underpass_warning','erased-map','future-phone']) {
    assert.ok(ui.includes(marker), `missing art completeness marker: ${marker}`);
  }
  for (const title of ['雨夜存档点','残响','约定','六条路线','10月24日','不保存','明天见']) {
    assert.ok(ui.includes(title), `missing chapter visual: ${title}`);
  }
  for (const id of ['linwan','xiaoman','xuqi','tinglan','tangli','nanxing']) {
    assert.ok(ui.includes(`id:'${id}'`), `missing chibi cast visual: ${id}`);
  }
  assert.ok(ui.includes('不要在18:42经过这里'));
  assert.ok(ui.includes('拍摄时间：五分钟后'));
});

test('PWA icon is RESET-branded, deterministic and correctly sized', async () => {
  const source = await readFile(resolve(root, 'scripts/pwa-assets.mjs'), 'utf8');
  assert.ok(source.includes("RESET's own loop/save mark"));
  assert.ok(!source.includes("engine's existing N icon geometry"));
  for (const size of [192, 512]) {
    const first = pngIcon(size), second = pngIcon(size);
    assert.ok(first.equals(second), `icon ${size} is not deterministic`);
    assert.equal(first.subarray(1,4).toString(), 'PNG');
    assert.equal(first.readUInt32BE(16), size);
    assert.equal(first.readUInt32BE(20), size);
  }
});
