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
  let active = null, disposed = false, lastVisit = -1;
  const unsubscribe = session.subscribe(check);
  check();

  function check() {
    if (disposed || active) return;
    const view = session.getView();
    const config = ENCOUNTERS[view.frame.sceneId];
    if (!config || !view.ready || view.visit === lastVisit) return;
    if (!view.frame.actions.some(action => action.id === config.win) || !view.frame.actions.some(action => action.id === config.lose)) return;
    lastVisit = view.visit;
    active = createCombat(config, view.frame.sceneId, result => {
      active = null;
      session.pause('reset-combat', false);
      queueMicrotask(() => session.act(result === 'win' ? config.win : config.lose));
    });
    session.pause('reset-combat', true);
  }

  return { dispose() { disposed = true; unsubscribe(); if (active) active.dispose(); session.pause('reset-combat', false); } };
}

function createCombat(config, encounterId, done) {
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
  </style><div class="reset-combat reset-combat__root"><div class="reset-combat__head"><div class="reset-combat__title">${config.title}</div><div class="reset-combat__hint">第 ${attempt} 次接触 · WASD/方向键移动 · Space闪避 · J轻击 · K重击</div></div><canvas width="960" height="540"></canvas><div class="reset-combat__controls"><button data-key="ArrowLeft">←</button><button data-key="ArrowUp">↑</button><button data-key="ArrowDown">↓</button><button data-key="ArrowRight">→</button><button data-key="Space">闪避</button><button data-key="KeyJ">轻击</button><button data-key="KeyK">重击</button></div></div>`;
  document.body.appendChild(overlay);
  const canvas = overlay.querySelector('canvas'), ctx = canvas.getContext('2d');
  const keys = new Set(), presses = new Set();
  const actions = new Set(['Space','KeyJ','KeyK']);
  const press = code => (actions.has(code) ? presses : keys).add(code);
  let ended = false, raf = 0, finishTimer, last = performance.now(), attackClock = config.tempo, telegraph = null, message = '观察前摇。活下来比抢伤害重要。', messageTime = 2.6;
  const player = { x: 170, y: 270, r: 18, hp: 5, maxHp: 5, stamina: 100, iframes: 0, attackCd: 0, flash: 0, vx: 0, vy: 0 };
  const boss = { x: 760, y: 270, r: 32, hp: config.hp, maxHp: config.hp, flash: 0, phase: 1, attackIndex: 0 };

  const keydown = e => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyJ','KeyK','KeyA','KeyD','KeyW','KeyS'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); press(e.code); } };
  const keyup = e => keys.delete(e.code);
  const blur = () => { keys.clear(); presses.clear(); };
  addEventListener('keydown', keydown, true); addEventListener('keyup', keyup, true);
  addEventListener('blur', blur);
  for (const button of overlay.querySelectorAll('button[data-key]')) {
    const code = button.dataset.key;
    const down = e => { e.preventDefault(); press(code); };
    const up = e => { e.preventDefault(); keys.delete(code); };
    button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('pointerleave', up);
  }

  function strike(kind) {
    if (player.attackCd > 0 || ended) return;
    const heavy = kind === 'heavy', cost = heavy ? 30 : 16;
    if (player.stamina < cost) return;
    player.stamina -= cost; player.attackCd = heavy ? .62 : .34;
    if (distance(player, boss) < (heavy ? 112 : 92)) {
      boss.hp = Math.max(0, boss.hp - (heavy ? 2 : 1)); boss.flash = .12;
      message = heavy ? '重击命中。' : '命中。'; messageTime = .5;
      if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; message = config.mode === 'adaptive' ? '它记住了你的节奏。' : '第二阶段。'; messageTime = 1.4; }
      if (boss.hp <= 0) finish('win');
    }
  }

  function dodge(dx, dy) {
    if (player.iframes > 0 || player.stamina < 26) return;
    player.stamina -= 26; player.iframes = .36;
    const len = Math.hypot(dx, dy) || 1; player.x = clamp(player.x + dx / len * 92, 32, 928); player.y = clamp(player.y + dy / len * 92, 32, 508);
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
    if (hit && player.iframes <= 0) { player.hp--; player.flash = .18; message = config.mode === 'echo' ? '旧选择提前等在了那里。' : '受击。'; messageTime = .9; if (player.hp <= 0) finish('lose'); }
    telegraph = null;
    attackClock = config.tempo * (boss.phase === 2 ? .68 : 1) * Math.max(.72, 1 - (attempt - 1) * .035);
  }

  function finish(result) {
    if (ended) return; ended = true;
    message = result === 'win' ? '突破。' : '死亡。'; messageTime = .7;
    finishTimer = setTimeout(() => { cleanup(); done(result); }, 650);
  }

  function update(dt) {
    messageTime = Math.max(0, messageTime - dt); player.iframes = Math.max(0, player.iframes - dt); player.attackCd = Math.max(0, player.attackCd - dt); player.flash = Math.max(0, player.flash - dt); boss.flash = Math.max(0, boss.flash - dt);
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx--; if (keys.has('ArrowRight') || keys.has('KeyD')) dx++; if (keys.has('ArrowUp') || keys.has('KeyW')) dy--; if (keys.has('ArrowDown') || keys.has('KeyS')) dy++;
    const len = Math.hypot(dx, dy) || 1, speed = 225; player.vx = dx / len * speed; player.vy = dy / len * speed;
    if (dx || dy) { player.x = clamp(player.x + player.vx * dt, 28, 932); player.y = clamp(player.y + player.vy * dt, 28, 512); }
    else { player.vx = 0; player.vy = 0; }
    // A tap can begin and end between animation frames. Queue action edges until
    // update consumes them; keyup/pointerup only release held movement keys.
    if (presses.has('Space')) { presses.delete('Space'); dodge(dx, dy); }
    if (presses.has('KeyJ')) { presses.delete('KeyJ'); strike('light'); }
    if (presses.has('KeyK')) { presses.delete('KeyK'); strike('heavy'); }
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
      if (telegraph.type === 'ring') { ctx.beginPath(); ctx.arc(boss.x,boss.y,(boss.phase===2?190:160)*(.55+.45*progress),0,Math.PI*2);ctx.stroke(); }
      if (telegraph.type === 'dash') { ctx.fillStyle=`rgba(240,120,105,${.08+.2*progress})`;ctx.fillRect(0,boss.y-58,960,116); }
      if (telegraph.type === 'predict') { ctx.beginPath();ctx.arc(telegraph.target.x,telegraph.target.y,92*(.45+.55*progress),0,Math.PI*2);ctx.stroke(); }
    }
    ctx.save(); if (boss.flash>0) ctx.globalAlpha=.45; ctx.fillStyle='#d7dde1';ctx.beginPath();ctx.arc(boss.x,boss.y,boss.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151b21';ctx.fillRect(boss.x-24,boss.y-8,48,16);ctx.restore();
    ctx.save(); if(player.iframes>0)ctx.globalAlpha=.38; if(player.flash>0)ctx.globalAlpha=.25;ctx.fillStyle='#9fc6dc';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.restore();
    bar(28,24,230,16,player.hp,player.maxHp,'#d7e7ee'); bar(28,46,230,10,player.stamina,100,'#9db7a7'); bar(570,24,360,16,boss.hp,boss.maxHp,'#d09288');
    ctx.fillStyle='#e8eef1';ctx.font='15px system-ui';ctx.fillText('陈渡',28,78);ctx.textAlign='right';ctx.fillText(config.title,930,58);ctx.textAlign='left';
    if(messageTime>0){ctx.fillStyle='rgba(4,7,10,.72)';ctx.fillRect(250,475,460,42);ctx.fillStyle='#edf2f4';ctx.textAlign='center';ctx.font='17px system-ui';ctx.fillText(message,480,502);ctx.textAlign='left';}
    if(config.mode==='reflection'){ctx.strokeStyle='rgba(173,208,225,.2)';ctx.beginPath();ctx.moveTo(0,360);ctx.lineTo(960,360);ctx.stroke();ctx.globalAlpha=.18;ctx.fillStyle='#d7dde1';ctx.beginPath();ctx.ellipse(boss.x,410,boss.r*1.2,boss.r*.4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  }

  function loop(now) { if (ended) { draw(); return; } const dt = Math.min(.033,(now-last)/1000); last=now; update(dt); draw(); raf=requestAnimationFrame(loop); }
  raf=requestAnimationFrame(loop);
  function cleanup(){ cancelAnimationFrame(raf); clearTimeout(finishTimer); removeEventListener('keydown',keydown,true);removeEventListener('keyup',keyup,true);removeEventListener('blur',blur);keys.clear();presses.clear();overlay.remove(); }
  return { dispose(){ ended=true;cleanup(); } };
}
