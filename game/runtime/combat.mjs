const ENCOUNTERS = {
  faceless_first: { title: '无面行人 · 初见', win: 'watch_reflection', lose: 'rush_forward', hp: 9, tempo: 1.05, mode: 'reflection' },
  faceless_second: { title: '无面行人 · 它也记得', win: 'change_read', lose: 'repeat_old', hp: 12, tempo: .82, mode: 'adaptive' },
  c5_echo_fail: { title: '第七人 · 旧选择', win: 'break_habit', lose: 'repeat_dodge', hp: 14, tempo: .78, mode: 'echo' }
};
const META_KEY = 'reset:combat-meta:v1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function readMeta() {
  try { const value = JSON.parse(localStorage.getItem(META_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
  catch { return {}; }
}
function writeMeta(value) { try { localStorage.setItem(META_KEY, JSON.stringify(value)); } catch {} }

export function mountCombatBridge(game) {
  const session = game.session;
  let active = null, disposed = false, lastVisit = -1, activeScene, pendingResult;
  const externallyPaused = view => view.hidden || view.pauseReasons?.some(reason => reason !== 'reset-combat');
  const unsubscribe = session.subscribe(check);
  check();

  function check() {
    if (disposed) return;
    const view = session.getView();
    if (active) {
      if (view.visit !== lastVisit || view.frame.sceneId !== activeScene) {
        active.dispose(); active = null;
        session.pause('reset-combat', false); check();
      } else if (externallyPaused(view)) active.suspend();
      return;
    }
    if (pendingResult) {
      if (view.visit !== pendingResult.visit || view.frame.sceneId !== pendingResult.scene) pendingResult = null;
      else if (!view.paused && !document.hidden) {
        const result = pendingResult; pendingResult = null;
        queueMicrotask(() => {
          if (disposed) return;
          const current = session.getView();
          if (current.visit !== result.visit || current.frame.sceneId !== result.scene) return;
          if (current.paused || document.hidden) { pendingResult = result; return; }
          session.act(result.action);
        });
      }
      return;
    }
    const config = ENCOUNTERS[view.frame.sceneId];
    if (!config || !view.ready || view.paused || view.visit === lastVisit) return;
    if (!view.frame.actions.some(action => action.id === config.win) || !view.frame.actions.some(action => action.id === config.lose)) return;
    lastVisit = view.visit;
    activeScene = view.frame.sceneId;
    active = createCombat(config, view.frame.sceneId, result => {
      active = null;
      pendingResult = { visit: view.visit, scene: view.frame.sceneId, action: result === 'win' ? config.win : config.lose };
      session.pause('reset-combat', false);
      check();
    }, view.settings, () => !externallyPaused(session.getView()));
    session.pause('reset-combat', true);
  }

  return { dispose() { disposed = true; unsubscribe(); if (active) active.dispose(); session.pause('reset-combat', false); } };
}

function createCombat(config, encounterId, done, settings = {}, canResume = () => true) {
  const meta = readMeta();
  meta[encounterId] = (Number(meta[encounterId]) || 0) + 1;
  writeMeta(meta);
  const attempt = meta[encounterId];
  const overlay = document.createElement('section');
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', config.title);
  overlay.innerHTML = `<style>
    .reset-combat{position:fixed;inset:0;z-index:99999;background:rgba(5,8,12,.96);display:grid;grid-template-rows:auto 1fr auto;color:#eef3f5;font-family:system-ui,-apple-system,sans-serif;padding:14px;box-sizing:border-box}
    .reset-combat__head{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;max-width:1100px;width:100%;margin:auto}.reset-combat__title{font-size:18px;font-weight:700}.reset-combat__hint{font-size:12px;opacity:.72;text-align:right}
    .reset-combat canvas{width:min(1100px,100%);height:auto;max-height:70vh;align-self:center;justify-self:center;border:1px solid rgba(220,235,242,.22);background:#101820;touch-action:none}
    .reset-combat__controls{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:12px auto 0;max-width:900px}.reset-combat button{min-width:58px;min-height:46px;border:1px solid rgba(230,240,245,.25);border-radius:9px;background:#18232e;color:#f4f7f8;font-weight:700}.reset-combat button:active{transform:translateY(1px);background:#263847}
    @media (pointer:fine){.reset-combat__controls{opacity:.36}.reset-combat button{min-height:36px}}
  </style><div class="reset-combat reset-combat__root"><div class="reset-combat__head"><div class="reset-combat__title">${config.title}</div><div class="reset-combat__hint">第 ${attempt} 次接触 · WASD/方向键移动 · Space闪避 · J轻击 · K重击</div></div><canvas width="960" height="540"></canvas><div class="reset-combat__controls"><button data-key="ArrowLeft">←</button><button data-key="ArrowUp">↑</button><button data-key="ArrowDown">↓</button><button data-key="ArrowRight">→</button><button data-key="Space">闪避</button><button data-key="KeyJ">轻击</button><button data-key="KeyK">重击</button><button data-combat-resume hidden>继续战斗</button><span class="reset-combat__state" role="status" aria-live="off"></span></div></div>`;
  document.body.appendChild(overlay);
  const canvas = overlay.querySelector('canvas'), ctx = canvas.getContext('2d');
  const keys = new Set(), presses = new Set(), touchKeys = new Set(), touchPresses = new Set();
  const actions = new Set(['Space','KeyJ','KeyK']);
  const press = (code,touch=false) => { if (!suspended && !document.hidden) (actions.has(code) ? (touch ? touchPresses : presses) : (touch ? touchKeys : keys)).add(code); };
  const held = code => keys.has(code) || touchKeys.has(code);
  let suspended = false, ended = false, raf = 0, finishTimer, finishDue = 0, finishRemaining = 650, last = performance.now(), attackClock = config.tempo + 1.2, telegraph = null, message = '观察前摇。活下来比抢伤害重要。', messageTime = 2.6;
  const player = { x: 170, y: 270, r: 18, hp: 5, maxHp: 5, stamina: 100, iframes: 0, attackCd: 0, flash: 0, vx: 0, vy: 0 };
  const boss = { x: 760, y: 270, r: 32, hp: config.hp, maxHp: config.hp, flash: 0, phase: 1, attackIndex: 0 };
  const reducedMotion = Boolean(settings.reducedMotion), sparks = [], trails = [];
  let swing = null;
  function impact(x, y, color) {
    if (reducedMotion) return;
    for (let i=0;i<8;i++) { const angle=i*Math.PI/4, speed=55+(i%3)*30; sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.3,color}); }
  }

  const resumeButton = overlay.querySelector('[data-combat-resume]'), hud = overlay.querySelector('.reset-combat__state');
  let lastHud = '';
  const keydown = e => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyJ','KeyK','KeyA','KeyD','KeyW','KeyS'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) press(e.code); } };
  const keyup = e => keys.delete(e.code);
  const clearInput = () => { keys.clear(); presses.clear(); touchKeys.clear(); touchPresses.clear(); };
  const blur = () => {
    clearInput();
    if (finishTimer !== undefined) {
      finishRemaining = Math.max(0, finishDue-performance.now());
      clearTimeout(finishTimer); finishTimer = undefined;
    }
    suspended = true; resumeButton.hidden = false;
    for (const button of overlay.querySelectorAll('button[data-key]')) button.disabled = true;
    message = '战斗已暂停，点击“继续战斗”后恢复。'; messageTime = 3;
  };
  const resume = () => {
    if (document.hidden || !canResume()) return;
    clearInput(); suspended = false; last = performance.now(); resumeButton.hidden = true;
    for (const button of overlay.querySelectorAll('button[data-key]')) button.disabled = ended;
    if (ended) { message = outcome === 'win' ? '突破。' : '死亡。'; messageTime = .7; scheduleResult(); draw(); return; }
    message = '观察提示范围，再决定进退。'; messageTime = 1.5;
  };
  resumeButton.addEventListener('click',resume);
  const visibility = () => { if (document.hidden) blur(); };
  addEventListener('keydown', keydown, true); addEventListener('keyup', keyup, true);
  addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);
  for (const button of overlay.querySelectorAll('button[data-key]')) {
    const code = button.dataset.key;
    const down = e => { e.preventDefault(); if (suspended) return; button.setPointerCapture?.(e.pointerId); press(code,true); };
    const up = e => { e.preventDefault(); touchKeys.delete(code); };
    const cancel = e => { up(e); touchPresses.delete(code); };
    const leave = e => { if (!button.hasPointerCapture?.(e.pointerId)) up(e); };
    button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up); button.addEventListener('pointercancel', cancel); button.addEventListener('pointerleave', leave); button.addEventListener('lostpointercapture',up);
  }

  function strike(kind) {
    if (player.attackCd > 0 || ended) return;
    const heavy = kind === 'heavy', cost = heavy ? 30 : 16;
    if (player.stamina < cost) { message = '体力不足，松开攻击等待恢复。'; messageTime = .9; return; }
    player.stamina -= cost; player.attackCd = heavy ? .62 : .34;
    if (!reducedMotion) swing = {angle:Math.atan2(boss.y-player.y,boss.x-player.x),life:heavy?.23:.15,total:heavy?.23:.15,heavy};
    if (distance(player, boss) < (heavy ? 112 : 92)) {
      boss.hp = Math.max(0, boss.hp - (heavy ? 2 : 1)); boss.flash = .12;
      impact(boss.x,boss.y,'#e3c3aa');
      message = heavy ? '重击命中。' : '命中。'; messageTime = .5;
      if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; message = config.mode === 'adaptive' ? '它记住了你的节奏。' : '第二阶段。'; messageTime = 1.4; }
      if (boss.hp <= 0) finish('win');
    }
  }

  function dodge(dx, dy) {
    if (player.iframes > 0) return;
    if (player.stamina < 26) { message = '体力不足，暂时无法闪避。'; messageTime = .9; return; }
    if (!dx && !dy) { dx = player.x-boss.x; dy = player.y-boss.y; }
    message = '闪避。'; messageTime = .35;
    player.stamina -= 26; player.iframes = .36;
    const before = {x:player.x,y:player.y};
    const len = Math.hypot(dx, dy) || 1; player.x = clamp(player.x + dx / len * 92, 32, 928); player.y = clamp(player.y + dy / len * 92, 32, 508);
    if (!reducedMotion) for(let i=0;i<4;i++)trails.push({x:before.x+(player.x-before.x)*i/4,y:before.y+(player.y-before.y)*i/4,life:.28});
  }

  function beginAttack() {
    boss.attackIndex++;
    const phaseSpeed = boss.phase === 2 ? .78 : 1;
    let type = 'ring';
    if (config.mode === 'adaptive' && (boss.attackIndex + attempt) % 3 === 0) type = 'dash';
    if (config.mode === 'echo') type = boss.attackIndex % 2 ? 'predict' : 'ring';
    const lead = config.mode === 'reflection' ? .78 : .62 * phaseSpeed;
    const predicted = { x: clamp(player.x + player.vx * (config.mode === 'echo' ? .75 : .35), 25, 935), y: clamp(player.y + player.vy * (config.mode === 'echo' ? .75 : .35), 25, 515) };
    telegraph = { type, t: lead, duration: lead, target: predicted };
  }

  function resolveAttack() {
    if (!telegraph) return;
    let hit = false;
    if (telegraph.type === 'ring') hit = distance(player, boss) < (boss.phase === 2 ? 190 : 160);
    else if (telegraph.type === 'dash') hit = Math.abs(player.y - boss.y) < 58;
    else hit = Math.hypot(player.x - telegraph.target.x, player.y - telegraph.target.y) < 92;
    if (hit && player.iframes <= 0) { player.hp--; player.flash = .18; impact(player.x,player.y,'#aacbdc'); message = config.mode === 'echo' ? '旧选择提前等在了那里。' : '受击。'; messageTime = .9; if (player.hp <= 0) finish('lose'); }
    telegraph = null;
    attackClock = config.tempo * (boss.phase === 2 ? .68 : 1) * Math.max(.72, 1 - (attempt - 1) * .035);
  }

  function finish(result) {
    if (ended) return; ended = true;
    message = result === 'win' ? '突破。' : '死亡。'; messageTime = .7;
    outcome = result; scheduleResult();
  }
  let outcome;
  function scheduleResult() {
    if (suspended || finishTimer !== undefined) return;
    finishDue = performance.now()+finishRemaining;
    finishTimer = setTimeout(() => {
      finishTimer = undefined;
      if (document.hidden || !canResume()) { finishRemaining = 0; blur(); draw(); return; }
      cleanup(); done(outcome);
    }, finishRemaining);
  }

  function update(dt) {
    if (swing) { swing.life-=dt; if(swing.life<=0)swing=null; }
    for(let i=sparks.length-1;i>=0;i--){const spark=sparks[i];spark.life-=dt;spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;if(spark.life<=0)sparks.splice(i,1);}
    for(let i=trails.length-1;i>=0;i--){trails[i].life-=dt;if(trails[i].life<=0)trails.splice(i,1);}
    messageTime = Math.max(0, messageTime - dt); player.iframes = Math.max(0, player.iframes - dt); player.attackCd = Math.max(0, player.attackCd - dt); player.flash = Math.max(0, player.flash - dt); boss.flash = Math.max(0, boss.flash - dt);
    let dx = 0, dy = 0;
    if (held('ArrowLeft') || held('KeyA')) dx--; if (held('ArrowRight') || held('KeyD')) dx++; if (held('ArrowUp') || held('KeyW')) dy--; if (held('ArrowDown') || held('KeyS')) dy++;
    const len = Math.hypot(dx, dy) || 1, speed = 225; player.vx = dx / len * speed; player.vy = dy / len * speed;
    if (dx || dy) { player.x = clamp(player.x + player.vx * dt, 28, 932); player.y = clamp(player.y + player.vy * dt, 28, 512); }
    else { player.vx = 0; player.vy = 0; }
    // A tap can begin and end between animation frames. Queue action edges until
    // update consumes them; keyup/pointerup only release held movement keys.
    if (presses.has('Space') || touchPresses.has('Space')) { presses.delete('Space'); touchPresses.delete('Space'); dodge(dx, dy); }
    if (presses.has('KeyJ') || touchPresses.has('KeyJ')) { presses.delete('KeyJ'); touchPresses.delete('KeyJ'); strike('light'); }
    if (presses.has('KeyK') || touchPresses.has('KeyK')) { presses.delete('KeyK'); touchPresses.delete('KeyK'); strike('heavy'); }
    player.stamina = Math.min(100, player.stamina + 25 * dt);
    if (!telegraph) { attackClock -= dt; if (attackClock <= 0) beginAttack(); }
    else { telegraph.t -= dt; if (telegraph.t <= 0) resolveAttack(); }
  }

  function bar(x, y, w, h, value, max, fill) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x,y,w,h); ctx.fillStyle = fill; ctx.fillRect(x+2,y+2,(w-4)*clamp(value/max,0,1),h-4); }
  function draw() {
    ctx.clearRect(0,0,960,540);
    const grad = ctx.createLinearGradient(0,0,0,540); grad.addColorStop(0,'#17232d'); grad.addColorStop(1,'#070b10'); ctx.fillStyle = grad; ctx.fillRect(0,0,960,540);
    ctx.strokeStyle='rgba(190,215,228,.09)'; ctx.lineWidth=1; for(let x=0;x<960;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke()} for(let y=0;y<540;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke()}
    if (telegraph) {
      const progress = 1 - telegraph.t / telegraph.duration; ctx.lineWidth = 5; ctx.strokeStyle = `rgba(240,120,105,${.25+.6*progress})`;
      if (telegraph.type === 'ring') { ctx.save();ctx.strokeStyle='rgba(240,160,140,.3)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(boss.x,boss.y,boss.phase===2?190:160,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.beginPath(); ctx.arc(boss.x,boss.y,(boss.phase===2?190:160)*(.55+.45*progress),0,Math.PI*2);ctx.stroke(); }
      if (telegraph.type === 'dash') { ctx.fillStyle=`rgba(240,120,105,${.08+.2*progress})`;ctx.fillRect(0,boss.y-58,960,116); }
      if (telegraph.type === 'predict') { ctx.beginPath();ctx.arc(telegraph.target.x,telegraph.target.y,92*(.45+.55*progress),0,Math.PI*2);ctx.stroke(); }
    }
    if(telegraph){ctx.fillStyle='#ebc7b8';ctx.font='14px system-ui';ctx.fillText(({ring:'圆圈内危险',dash:'横向范围攻击',predict:'正在瞄准落点'})[telegraph.type]+' · '+Math.max(0,telegraph.t).toFixed(1)+'s',28,103);}
    const hudText = suspended ? message : `生命 ${player.hp}/${player.maxHp} · 体力 ${Math.round(player.stamina)}/100${messageTime>0 ? ' · '+message : ''}`;
    if(hudText!==lastHud){hud.textContent=hudText;lastHud=hudText;}
    ctx.save();ctx.strokeStyle=boss.phase===2?'#a77f9e':'#7896a4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(boss.x,boss.y,boss.r+9,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(const trail of trails){ctx.save();ctx.globalAlpha=trail.life/.28*.28;ctx.fillStyle='#6f9bae';ctx.beginPath();ctx.arc(trail.x,trail.y,17,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(swing){ctx.save();const progress=1-swing.life/swing.total;ctx.strokeStyle=swing.heavy?'#e2ceb0':'#d6edf1';ctx.globalAlpha=swing.life/swing.total;ctx.lineWidth=swing.heavy?7:4;ctx.beginPath();ctx.arc(player.x,player.y,swing.heavy?85:65,swing.angle-1+progress*.8,swing.angle+.5+progress*.8);ctx.stroke();ctx.restore();}
    for(const spark of sparks){ctx.save();ctx.globalAlpha=spark.life/.3;ctx.fillStyle=spark.color;ctx.fillRect(spark.x-2,spark.y-2,4,4);ctx.restore();}
    ctx.save(); if (!reducedMotion && boss.flash>0) ctx.globalAlpha=.45; ctx.fillStyle='#d7dde1';ctx.beginPath();ctx.arc(boss.x,boss.y,boss.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151b21';ctx.fillRect(boss.x-24,boss.y-8,48,16);ctx.restore();
    ctx.save(); if(!reducedMotion && player.iframes>0)ctx.globalAlpha=.38; if(!reducedMotion && player.flash>0)ctx.globalAlpha=.25;ctx.fillStyle='#9fc6dc';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.restore();
    bar(28,24,230,16,player.hp,player.maxHp,'#d7e7ee'); bar(28,46,230,10,player.stamina,100,'#9db7a7'); bar(570,24,360,16,boss.hp,boss.maxHp,'#d09288');
    ctx.fillStyle='#e8eef1';ctx.font='15px system-ui';ctx.fillText('陈渡',28,78);ctx.textAlign='right';ctx.fillText(config.title,930,58);ctx.textAlign='left';
    if(messageTime>0){ctx.fillStyle='rgba(4,7,10,.72)';ctx.fillRect(250,475,460,42);ctx.fillStyle='#edf2f4';ctx.textAlign='center';ctx.font='17px system-ui';ctx.fillText(message,480,502);ctx.textAlign='left';}
    if(config.mode==='reflection'){ctx.strokeStyle='rgba(173,208,225,.2)';ctx.beginPath();ctx.moveTo(0,360);ctx.lineTo(960,360);ctx.stroke();ctx.globalAlpha=.18;ctx.fillStyle='#d7dde1';ctx.beginPath();ctx.ellipse(boss.x,410,boss.r*1.2,boss.r*.4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  }

  function loop(now) { if (ended) { draw(); return; } const dt = Math.min(.033,(now-last)/1000); last=now; if(!suspended) update(dt); draw(); raf=requestAnimationFrame(loop); }
  if(document.hidden || document.hasFocus?.()===false)blur();
  raf=requestAnimationFrame(loop);
  function cleanup(){ cancelAnimationFrame(raf); clearTimeout(finishTimer); removeEventListener('keydown',keydown,true);removeEventListener('keyup',keyup,true);removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);clearInput();resumeButton.removeEventListener('click',resume);overlay.remove(); }
  return { suspend: blur, dispose(){ ended=true;cleanup(); } };
}
