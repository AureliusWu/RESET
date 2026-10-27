import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('game/runtime/experience.css','utf8');
const pwa=readFileSync('game/runtime/pwa.mjs','utf8');

test('title screen exposes a real enter control above decorative art',()=>{
  assert.match(pwa,/data-reset-enter/);
  assert.match(pwa,/gate\.remove\(\)/);
  assert.match(css,/\.reset-title-gate\{[^}]*z-index:100/);
  assert.match(css,/\.reset-title-gate button\{[^}]*touch-action:manipulation/);
  assert.match(css,/\.reset-title-key-visual\{display:none!important\}/);
});

test('mobile landscape has a dedicated compact playable layout',()=>{
  assert.match(css,/@media\(orientation:landscape\) and \(max-height:600px\)/);
  assert.match(css,/main#game\{height:100dvh/);
  assert.match(css,/\.vn-engine \.vn-reading\{flex:0 0 auto;max-height:32%/);
});

test('PWA install prompt is captured and exposed as an in-game install action',()=>{
  assert.match(pwa,/beforeinstallprompt/);
  assert.match(pwa,/event\.preventDefault\(\)/);
  assert.match(pwa,/data-reset-install/);
  assert.match(pwa,/await prompt\.prompt\(\)/);
  assert.match(pwa,/appinstalled/);
});
