import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

// Drive the shipped plugin with a manual animation clock. Input events can both
// arrive before one frame, as they do for fast taps on a slow or hidden browser.
const source = readFileSync(resolve(process.env.RESET_DIST || 'dist', 'combat.mjs'), 'utf8');
function harness(sceneId = 'faceless_first', settings = {}, focused = true, initiallyPaused = false, deferResults = false, store = new Map()) {
  const events = () => {
    const handlers = new Map();
    return {
      addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); },
      removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
      emit(type, code) { for (const fn of [...handlers.get(type) || []]) fn({ type, code, preventDefault() {}, stopPropagation() {} }); },
      count() { return [...handlers.values()].reduce((sum, set) => sum + set.size, 0); }
    };
  };
  const window = events(), document = { ...events(), hidden: false, hasFocus:()=>focused }, frames = new Map(), timers = new Map();
  const drawn = { x: 170, y: 270, stamina: 100, hp: 5, bossHp: null, swings:0, trails:0, telegraph:null }, buttons = new Map();
  let time = 0, serial = 0, removed = false, result;
  const results = [], microtasks = [];
  const ctx = new Proxy({
    createLinearGradient: () => ({ addColorStop() {} }),
    clearRect() { drawn.telegraph=null; },
    fillText(text) { if (/^(圆圈内危险|横向范围攻击|正在瞄准落点)/.test(text)) drawn.telegraph=text.split(' · ')[0]; },
    arc(x, y, r) { if (r === 18) { drawn.x = x; drawn.y = y; } if(r===65||r===85)drawn.swings++;if(r===17)drawn.trails++; },
    fillRect(x, y, width) {
      if (x === 30 && y === 48 && this.fillStyle === '#9db7a7') drawn.stamina = width / 226 * 100;
      if (x === 30 && y === 26 && this.fillStyle === '#d7e7ee') drawn.hp = width / 226 * 5;
      if (x === 572 && y === 26 && this.fillStyle === '#d09288') drawn.bossHp = width / 356;
    }
  }, { get(target, key) { return key in target ? target[key] : () => {}; } });
  for (const code of ['ArrowLeft','ArrowUp','ArrowDown','ArrowRight','Space','KeyJ','KeyK']) buttons.set(code, { ...events(), dataset: { key: code } });
  const resume = {...events(),hidden:true}, hud = {textContent:''};
  const overlay = { setAttribute() {}, querySelector: selector => selector==='[data-combat-resume]' ? resume : selector==='.reset-combat__state' ? hud : ({ getContext: () => ctx }), querySelectorAll: () => [...buttons.values()], remove() { removed = true; } };
  document.createElement = () => overlay; document.body = { appendChild() {} };
  const callbacks = new Set();
  const config = { faceless_first: ['watch_reflection','rush_forward'], faceless_second: ['change_read','repeat_old'], c5_echo_fail: ['break_habit','repeat_dodge'] }[sceneId];
  const pauseReasons = new Set(initiallyPaused ? ['panel'] : []);
  const view = { frame: { sceneId, actions: config.map(id => ({ id })) }, settings, ready: true, visit: 1, paused: initiallyPaused, pauseReasons: [...pauseReasons], hidden: false };
  const notify = () => { view.pauseReasons = [...pauseReasons]; view.paused = pauseReasons.size > 0 || view.hidden; for (const fn of [...callbacks]) fn(); };
  const session = {
    subscribe(fn) { callbacks.add(fn); return () => callbacks.delete(fn); }, getView: () => view,
    pause(reason, paused) { if (pauseReasons.has(reason) === paused) return; if (paused) pauseReasons.add(reason); else pauseReasons.delete(reason); notify(); },
    act(id) { if (view.paused || view.hidden) return false; result = id; results.push(id); return true; }
  };
  const mount = runInNewContext(source.replace('export function mountCombatBridge', 'function mountCombatBridge') + '\nmountCombatBridge', {
    document, localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    addEventListener: window.addEventListener, removeEventListener: window.removeEventListener,
    performance: { now: () => time }, queueMicrotask: fn => deferResults ? microtasks.push(fn) : fn(),
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, at: time + delay }); return id; }, clearTimeout: id => timers.delete(id)
  });
  const sfx = [], sfxStops = [];
  const bridge = mount({ session }, { playSfx:id=>sfx.push(id), stopSfx:()=>sfxStops.push(time) });
  function frame(count = 1) { for (let i = 0; i < count; i++) { time += 16; const pending = [...frames]; frames.clear(); for (const [,fn] of pending) fn(time); for (const [id,timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn(); } } }
  const key = (type, code) => window.emit(type, code);
  const tap = code => { key('keydown', code); key('keyup', code); };
  const touch = (type, code) => buttons.get(code).emit(type);
  const flush = () => { for(const fn of microtasks.splice(0)) fn(); };
  return { frame, key, tap, touch, window, document, bridge, session, notify, flush, results, drawn, view, frames, timers, resume, hud, sfx, sfxStops, get time(){return time;}, get removed() { return removed; }, get result() { return result; } };
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


test('blur freezes boss damage and stamina until an explicit resume; stale inputs never replay', () => {
  const h=harness();h.key('keydown','KeyD');h.frame(150);h.key('keyup','KeyD');
  h.window.emit('blur');const before={...h.drawn};h.tap('KeyK');h.frame(1500);
  for(const key of ['x','y','hp','stamina','bossHp'])assert.equal(h.drawn[key],before[key],key);
  assert.equal(h.resume.hidden,false);h.resume.emit('click');h.frame();assert.equal(h.resume.hidden,true);
  assert.equal(h.drawn.bossHp,before.bossHp,'queued attack must be discarded');h.bridge.dispose();
});

test('cancelled touch actions do not fire and releasing touch cannot release a keyboard direction', () => {
  const h=harness();h.touch('pointerdown','KeyK');h.touch('pointercancel','KeyK');h.frame();assert.equal(h.drawn.stamina,100);
  h.key('keydown','ArrowRight');h.touch('pointerdown','ArrowRight');h.touch('pointerup','ArrowRight');h.frame();assert.ok(h.drawn.x>170);
  h.key('keyup','ArrowRight');const x=h.drawn.x;h.frame();assert.equal(h.drawn.x,x);h.bridge.dispose();
});

test('stationary dodge retreats from the visible boss with the same stamina cost', () => {
  const h=harness();h.tap('Space');h.frame();assert.equal(h.drawn.x,78);assert.equal(h.drawn.y,270);assert.ok(Math.abs(h.drawn.stamina-74.4)<.001);h.bridge.dispose();
});


test('an encounter opened in a background window starts paused without losing health', () => {
  const h=harness('c5_echo_fail',{},false);assert.equal(h.resume.hidden,false);
  h.frame(1000);assert.equal(h.drawn.hp,5);assert.equal(h.drawn.stamina,100);
  h.resume.emit('click');assert.equal(h.resume.hidden,true);h.bridge.dispose();
});

test('the opening gives a touch player time to read controls while attacks remain responsive', () => {
  const h=harness('c5_echo_fail');h.frame(140);assert.equal(h.drawn.hp,5);
  h.tap('KeyJ');h.frame();assert.ok(h.drawn.stamina<85);h.frame(200);assert.ok(h.drawn.hp<5);h.bridge.dispose();
});

function reachResult(h) {
  h.key('keydown','KeyD'); h.frame(150); h.key('keyup','KeyD');
  for (let i=0;i<2000 && !h.timers.size;i++) h.frame();
  assert.equal(h.timers.size,1,'a real death must reach the result delay');
}

for (const encounter of ['faceless_first','faceless_second','c5_echo_fail']) {
  for (const signal of ['blur','hidden']) test(`${encounter}: ${signal} freezes the result delay until explicit resume and applies it once`, () => {
    const h=harness(encounter); reachResult(h); h.frame(10);
    if (signal==='blur') h.window.emit('blur');
    else { h.view.hidden=true; h.notify(); h.document.hidden=true; h.document.emit('visibilitychange'); }
    h.frame(1000); assert.equal(h.result,undefined); assert.equal(h.removed,false); assert.equal(h.resume.hidden,false);
    h.document.hidden=false; h.view.hidden=false; h.notify(); h.document.emit('visibilitychange');
    h.frame(100); assert.equal(h.result,undefined,'returning to the tab must not commit the result');
    h.resume.emit('click'); h.frame(10); assert.equal(h.result,undefined,'remaining foreground delay must be retained');
    h.frame(40); assert.equal(h.results.length,1); assert.equal(h.removed,true); assert.equal(h.view.paused,false);
    h.frame(100); assert.equal(h.results.length,1); h.bridge.dispose();
  });
}

test('an unrelated session pause freezes combat and cannot be bypassed with the resume button', () => {
  const h=harness('c5_echo_fail'); h.key('keydown','KeyD'); h.frame(150); h.key('keyup','KeyD');
  h.session.pause('panel',true); const before={...h.drawn}; h.frame(1500);
  for(const key of ['x','y','hp','stamina','bossHp']) assert.equal(h.drawn[key],before[key]);
  h.resume.emit('click'); h.frame(500); assert.equal(h.drawn.hp,before.hp); assert.equal(h.resume.hidden,false);
  h.session.pause('panel',false); h.frame(100); assert.equal(h.drawn.hp,before.hp);
  h.resume.emit('click'); h.frame(500); assert.ok(h.drawn.hp<before.hp); h.bridge.dispose();
});

test('a combat restored under a settings or archive pause waits until the panel closes', () => {
  const h=harness('c5_echo_fail',{},true,true); assert.equal(h.frames.size,0); assert.equal(h.timers.size,0);
  h.session.pause('panel',false); assert.equal(h.frames.size,1); assert.equal(h.view.paused,true);
  h.bridge.dispose(); assert.equal(h.view.paused,false);
});

test('replacing the story visit disposes an old combat and its pending result', () => {
  const h=harness('c5_echo_fail'); reachResult(h);
  h.view.frame={sceneId:'opening',actions:[]}; h.view.visit++; h.notify();
  assert.equal(h.removed,true); assert.equal(h.timers.size,0); assert.equal(h.frames.size,0); assert.equal(h.view.paused,false);
  h.frame(1000); assert.equal(h.result,undefined); assert.equal(h.window.count(),0); h.bridge.dispose();
});

test('a host pause between combat cleanup and the VN microtask retains the result for resume', () => {
  const h=harness('c5_echo_fail',{},true,false,true); reachResult(h); h.frame(50);
  assert.equal(h.removed,true); h.session.pause('native-host',true); h.flush(); assert.equal(h.result,undefined);
  h.session.pause('native-host',false); h.flush(); assert.equal(h.results.length,1);
  h.flush(); assert.equal(h.results.length,1); h.bridge.dispose();
});

test('disposing after combat cleanup prevents an already queued VN result', () => {
  const h=harness('c5_echo_fail',{},true,false,true); reachResult(h); h.frame(50); assert.equal(h.removed,true);
  h.bridge.dispose(); h.flush(); assert.equal(h.result,undefined); assert.equal(h.window.count(),0);
});

test('Boss learning persists across encounters, changes adaptive patterns and caps the tempo increase', () => {
  const store=new Map(), observed=[];
  const attackCycle=h=>{
    const until=predicate=>{for(let budget=0;budget<1000&&!predicate();budget++)h.frame();assert.ok(predicate());};
    until(()=>h.drawn.telegraph!==null);const first={type:h.drawn.telegraph,time:h.time};
    until(()=>h.drawn.telegraph===null);until(()=>h.drawn.telegraph!==null);
    return {first:first.type,second:h.drawn.telegraph,interval:h.time-first.time};
  };
  for(const prior of [0,1,99,199]){
    store.set('reset:combat-meta:v1',JSON.stringify({faceless_second:prior}));
    const h=harness('faceless_second',{},true,false,false,store);observed.push(attackCycle(h));h.bridge.dispose();
    assert.equal(JSON.parse(store.get('reset:combat-meta:v1')).faceless_second,prior+1);
  }
  assert.equal(observed[0].first,'圆圈内危险');assert.equal(observed[1].first,'横向范围攻击');
  assert.ok(observed[2].interval<observed[0].interval);assert.equal(observed[2].interval,observed[3].interval,'later attempts must stop increasing speed at the existing cap');
  const echo=harness('c5_echo_fail');const prediction=attackCycle(echo);
  assert.equal(prediction.first,'正在瞄准落点');assert.equal(prediction.second,'圆圈内危险');echo.bridge.dispose();
});


test('combat SFX follows successful dodge/hit edges and stops when suspended', () => {
  const h = harness(); h.frame();
  h.tap('Space'); h.frame(); assert.deepEqual(h.sfx,['sfx-dodge']);
  h.tap('Space'); h.frame(); assert.equal(h.sfx.length,1,'cooldown-rejected dodge stays silent');
  h.tap('KeyJ'); h.frame(); assert.equal(h.sfx.length,1,'an attack outside hit range stays silent');
  h.window.emit('blur'); const before=h.sfx.length;
  h.tap('Space'); h.frame(10); assert.equal(h.sfx.length,before);
  assert.ok(h.sfxStops.length); h.bridge.dispose(); assert.ok(h.sfxStops.length>=2);
});

test('combat SFX announces a confirmed melee hit', () => {
  const h=harness();h.key('keydown','ArrowRight');h.frame(145);h.key('keyup','ArrowRight');
  h.tap('KeyJ');h.frame();assert.ok(h.sfx.includes('sfx-impact'));h.bridge.dispose();
});
