import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

// Drive the shipped plugin with a manual animation clock. Input events can both
// arrive before one frame, as they do for fast taps on a slow or hidden browser.
const source = readFileSync(resolve(process.env.RESET_DIST || 'dist', 'combat.mjs'), 'utf8');
function harness(sceneId = 'faceless_first', settings = {}) {
  const events = () => {
    const handlers = new Map();
    return {
      addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); },
      removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
      emit(type, code) { for (const fn of [...handlers.get(type) || []]) fn({ type, code, preventDefault() {}, stopPropagation() {} }); },
      count() { return [...handlers.values()].reduce((sum, set) => sum + set.size, 0); }
    };
  };
  const window = events(), document = { ...events(), hidden: false }, frames = new Map(), timers = new Map(), store = new Map();
  const drawn = { x: 170, y: 270, stamina: 100, hp: 5, bossHp: null, swings:0, trails:0 }, buttons = new Map();
  let time = 0, serial = 0, removed = false, result;
  const ctx = new Proxy({
    createLinearGradient: () => ({ addColorStop() {} }),
    arc(x, y, r) { if (r === 18) { drawn.x = x; drawn.y = y; } if(r===65||r===85)drawn.swings++;if(r===17)drawn.trails++; },
    fillRect(x, y, width) {
      if (x === 30 && y === 48 && this.fillStyle === '#9db7a7') drawn.stamina = width / 226 * 100;
      if (x === 30 && y === 26 && this.fillStyle === '#d7e7ee') drawn.hp = width / 226 * 5;
      if (x === 572 && y === 26 && this.fillStyle === '#d09288') drawn.bossHp = width / 356;
    }
  }, { get(target, key) { return key in target ? target[key] : () => {}; } });
  for (const code of ['ArrowLeft','ArrowUp','ArrowDown','ArrowRight','Space','KeyJ','KeyK']) buttons.set(code, { ...events(), dataset: { key: code } });
  const overlay = { setAttribute() {}, querySelector: () => ({ getContext: () => ctx }), querySelectorAll: () => [...buttons.values()], remove() { removed = true; } };
  document.createElement = () => overlay; document.body = { appendChild() {} };
  const callbacks = new Set();
  const config = { faceless_first: ['watch_reflection','rush_forward'], faceless_second: ['change_read','repeat_old'], c5_echo_fail: ['break_habit','repeat_dodge'] }[sceneId];
  const view = { frame: { sceneId, actions: config.map(id => ({ id })) }, settings, ready: true, visit: 1, paused: false };
  const session = {
    subscribe(fn) { callbacks.add(fn); return () => callbacks.delete(fn); }, getView: () => view,
    pause(reason, paused) { view.paused = paused; for (const fn of callbacks) fn(); },
    act(id) { result = id; return true; }
  };
  const mount = runInNewContext(source.replace('export function mountCombatBridge', 'function mountCombatBridge') + '\nmountCombatBridge', {
    document, localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    addEventListener: window.addEventListener, removeEventListener: window.removeEventListener,
    performance: { now: () => time }, queueMicrotask: fn => fn(),
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, at: time + delay }); return id; }, clearTimeout: id => timers.delete(id)
  });
  const bridge = mount({ session });
  function frame(count = 1) { for (let i = 0; i < count; i++) { time += 16; const pending = [...frames]; frames.clear(); for (const [,fn] of pending) fn(time); for (const [id,timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn(); } } }
  const key = (type, code) => window.emit(type, code);
  const tap = code => { key('keydown', code); key('keyup', code); };
  const touch = (type, code) => buttons.get(code).emit(type);
  return { frame, key, tap, touch, window, document, bridge, drawn, view, frames, timers, get removed() { return removed; }, get result() { return result; } };
}

for (const encounter of ['faceless_first','faceless_second','c5_echo_fail']) {
  for (const [code, cost] of [['KeyJ',16],['KeyK',30],['Space',26]]) {
    for (const device of ['keyboard','touch']) test(`${encounter}: ${device} ${code} down/up before one frame is consumed once`, () => {
      const h = harness(encounter);
      if (device === 'keyboard') h.tap(code); else { h.touch('pointerdown', code); h.touch('pointerup', code); }
      h.frame(); assert.ok(Math.abs(h.drawn.stamina - (100 - cost + .4)) < .001);
      h.frame(); assert.ok(Math.abs(h.drawn.stamina - (100 - cost + .8)) < .001, 'release must not repeat the action');
      h.bridge.dispose();
    });
  }
}

test('keyboard release and touch cancellation stop held movement; repeated attacks respect cooldown', () => {
  const h = harness();
  h.key('keydown','KeyD'); h.frame(); assert.ok(h.drawn.x > 170);
  h.key('keyup','KeyD'); const x = h.drawn.x; h.frame(3); assert.equal(h.drawn.x,x);
  h.touch('pointerdown','ArrowDown'); h.frame(); const y = h.drawn.y; assert.ok(y > 270);
  h.touch('pointercancel','ArrowDown'); h.frame(3); assert.equal(h.drawn.y,y);
  for (let i = 0; i < 8; i++) { const before = h.drawn.stamina; h.tap('KeyJ'); h.frame(); assert.ok(h.drawn.stamina < before - 15); const after = h.drawn.stamina; h.tap('KeyJ'); h.frame(); assert.ok(h.drawn.stamina > after); h.frame(40); }
  h.bridge.dispose();
});

for (const signal of ['blur','hidden']) test(`${signal} drops held movement and pending actions without replaying them on return`, () => {
  const h = harness(); h.key('keydown','KeyD'); h.tap('KeyK');
  if (signal === 'blur') h.window.emit('blur'); else { h.document.hidden = true; h.document.emit('visibilitychange'); }
  h.frame(); assert.equal(h.drawn.x,170); assert.equal(h.drawn.stamina,100);
  h.document.hidden = false; h.document.emit('visibilitychange'); h.frame(3);
  assert.equal(h.drawn.x,170); assert.equal(h.drawn.stamina,100); h.bridge.dispose();
});

test('disposing during the result delay cancels callbacks, animation and all global input handlers', () => {
  const h = harness(); h.key('keydown','KeyD'); h.frame(150); h.key('keyup','KeyD');
  for (let i = 0; i < 1000 && !h.timers.size; i++) { h.tap('KeyK'); h.frame(); }
  assert.equal(h.timers.size,1,'a real win or loss must schedule its VN result');
  h.bridge.dispose(); assert.equal(h.frames.size,0); assert.equal(h.timers.size,0);
  assert.equal(h.window.count(),0); assert.equal(h.document.count(),0); assert.equal(h.removed,true); assert.equal(h.view.paused,false);
  h.tap('KeyJ'); h.frame(100); assert.equal(h.result,undefined,'disposed combat must not invoke a stale VN choice');
});

test('attack and dodge feedback respects reduced motion without changing action costs or movement', () => {
  const normal=harness('faceless_first',{reducedMotion:false}), reduced=harness('faceless_first',{reducedMotion:true});
  for(const h of [normal,reduced]){h.key('keydown','KeyD');h.tap('Space');h.tap('KeyJ');h.frame();h.key('keyup','KeyD');}
  assert.ok(normal.drawn.swings>0);assert.ok(normal.drawn.trails>0);assert.equal(reduced.drawn.swings,0);assert.equal(reduced.drawn.trails,0);
  for(const property of ['x','y','stamina','hp'])assert.equal(normal.drawn[property],reduced.drawn[property],property+' must remain identical');
  normal.bridge.dispose();reduced.bridge.dispose();
});
