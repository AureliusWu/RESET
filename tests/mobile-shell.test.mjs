import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('game/runtime/experience.css','utf8');
const pwa=readFileSync('game/runtime/pwa.mjs','utf8');
const experience=readFileSync('game/runtime/experience.mjs','utf8');

test('title screen exposes new game and load-save actions above decorative art',()=>{
  assert.match(pwa,/data-reset-enter data-reset-new-game>新游戏/);
  assert.match(pwa,/data-reset-load-game>读取存档/);
  assert.match(pwa,/data-reset-control=\\?"slots/);
  assert.match(pwa,/gate\.remove\(\)/);
  assert.match(css,/\.reset-title-gate\{[^}]*z-index:100/);
  assert.match(css,/\.reset-title-gate button\{[^}]*touch-action:manipulation/);
  assert.match(css,/\.reset-title-key-visual\{display:none!important\}/);
});

test('dialogue advances from reading surface or Enter/Space without a visible next-line button',()=>{
  assert.match(experience,/addEventListener\?\.\('click',clickReading\)/);
  assert.match(experience,/event\.key!==['"]Enter['"]/);
  assert.match(experience,/event\.code!==['"]Space['"]/);
  assert.match(pwa,/data-control=\\?"next/);
  assert.match(pwa,/display:none!important/);
});

test('R7 keeps story props below portraits and moves the mobile map into a safe side area',()=>{
  assert.match(pwa,/\.vn-engine \.vn-stage \.vn-portrait\{z-index:4!important/);
  assert.match(pwa,/\.vn-engine \.vn-stage \.reset-story-prop\{z-index:2!important/);
  assert.match(pwa,/reset-story-prop-map\{left:10px!important;right:auto!important;top:64px!important;width:min\(38%,260px\)!important/);
  assert.match(pwa,/\.vn-engine \.vn-stage \.vn-portrait\{[^}]*animation:none!important;transition:none!important/);
});

test('mobile landscape has a dedicated compact playable layout',()=>{
  assert.match(css,/@media\(orientation:landscape\) and \(max-height:600px\)/);
  assert.match(css,/main#game\{[^}]*height:100dvh/);
  assert.match(css,/\.vn-engine \.vn-reading\{[^}]*flex:0 0 auto;[^}]*max-height:32%/);
});

test('PWA install prompt is captured and exposed as an in-game install action',()=>{
  assert.match(pwa,/beforeinstallprompt/);
  assert.match(pwa,/event\.preventDefault\(\)/);
  assert.match(pwa,/data-reset-install/);
  assert.match(pwa,/await prompt\.prompt\(\)/);
  assert.match(pwa,/appinstalled/);
});
