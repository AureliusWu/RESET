const UI_BASE = './assets/4k/runtime/ui/';
const UI = {
  title: UI_BASE + 'title-key-visual.webp',
  save: UI_BASE + 'save-anomaly.webp',
  endings: UI_BASE + 'ending-collection-header.webp',
  gallery: UI_BASE + 'cg-gallery-header.webp',
  combat: UI_BASE + 'combat-hud-key-visual.webp'
};

const CHAPTERS = new Map([
  [1, ['01', '雨夜存档点', '18:42 / 回到开始']],
  [2, ['02', '残响', '被擦掉的出口']],
  [3, ['03', '约定', '没有发生过的约定']],
  [4, ['04', '六条路线', '把这一天交给谁']],
  [5, ['05', '10月24日', '锚点之前']],
  [6, ['06', '不保存', '不可逆']],
  [7, ['07', '明天见', '10月25日']]
]);

const CAST = [
  {id:'linwan',name:'林晚',hair:'#202832',hairHi:'#34414d',eye:'#657f98',top:'#b9d3e2',accent:'#6e94ad',style:'long'},
  {id:'xiaoman',name:'周小满',hair:'#704d3d',hairHi:'#9a6c50',eye:'#735d45',top:'#d8c3a5',accent:'#5e8f91',style:'short'},
  {id:'xuqi',name:'许栖',hair:'#d9dce2',hairHi:'#f2f3f7',eye:'#b99b55',top:'#303743',accent:'#c2a867',style:'silver'},
  {id:'tinglan',name:'沈听澜',hair:'#272c31',hairHi:'#3c454b',eye:'#526c5d',top:'#718c79',accent:'#dce7de',style:'glasses'},
  {id:'tangli',name:'唐梨',hair:'#8b4e3d',hairHi:'#b46a50',eye:'#684b3f',top:'#d77a42',accent:'#292e35',style:'pony'},
  {id:'nanxing',name:'乔南星',hair:'#282a3d',hairHi:'#4d4c74',eye:'#686a98',top:'#4c526e',accent:'#a39ac8',style:'star'}
];

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

function brandSvg() {
  return `<svg viewBox="0 0 720 240" role="img" aria-label="回留 RESET"><defs><linearGradient id="reset-brand-g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9f5ec"/><stop offset="1" stop-color="#79b3aa"/></linearGradient></defs><g fill="none" stroke="url(#reset-brand-g)" stroke-linecap="round"><path d="M92 123a54 54 0 1 1 28 47" stroke-width="13"/><path d="M118 169l-18 4 9-17" stroke-width="10" stroke-linejoin="round"/><path d="M92 70v102" stroke-width="5" opacity=".28"/></g><text x="172" y="118" fill="#f0fbf7" font-size="72" font-family="system-ui,'Microsoft YaHei',sans-serif" font-weight="650" letter-spacing="8">回留</text><text x="176" y="165" fill="#a9d3cc" font-size="27" font-family="system-ui,sans-serif" letter-spacing="13">RESET</text><text x="548" y="164" fill="#7ba9a2" font-size="22" font-family="ui-monospace,monospace" letter-spacing="3">18:42</text></svg>`;
}

function chibiSvg(c) {
  const longBack = c.style === 'short' ? '' : `<path d="M56 75q-15 45-6 87l30-9 5-55h30l5 55 30 9q9-42-6-87z" fill="${c.hair}"/>`;
  const pony = c.style === 'pony' ? `<path d="M139 64q38 10 33 47-4 30-32 43l-12-24q20-8 20-25 0-14-16-19z" fill="${c.hair}"/>` : '';
  const fringe = c.style === 'silver' ? `<path d="M65 72l14-37 9 39 13-44 10 42 14-35 8 37 17-26 2 43z" fill="${c.hair}"/>` : `<path d="M58 71q11-47 43-47 37 0 46 48-22-19-47-16-20 2-29 11z" fill="${c.hair}"/><path d="M69 58q18-28 47-24-15 7-20 24 18-16 38-11-13 5-22 17" fill="${c.hairHi}" opacity=".6"/>`;
  const accessory = c.style === 'glasses' ? `<g fill="none" stroke="#d8e8e1" stroke-width="4"><circle cx="82" cy="87" r="13"/><circle cx="120" cy="87" r="13"/><path d="M95 87h12"/></g>` : c.style === 'star' ? `<path d="M142 53l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="${c.accent}"/>` : c.style === 'short' ? `<path d="M139 52l17-10 7 9-18 10z" fill="#e6b86e"/>` : '';
  return `<svg viewBox="0 0 200 220" role="img" aria-label="${esc(c.name)} Q版"><defs><linearGradient id="skin-${c.id}" x2="0" y2="1"><stop stop-color="#f5ddd2"/><stop offset="1" stop-color="#deb6a8"/></linearGradient></defs>${longBack}${pony}<path d="M48 214q5-67 52-75 47 8 52 75z" fill="${c.top}" stroke="#22333a" stroke-width="5"/><path d="M70 151q30 18 60 0l-8 27q-22 12-44 0z" fill="${c.accent}" opacity=".9"/><ellipse cx="100" cy="92" rx="47" ry="54" fill="url(#skin-${c.id})" stroke="#8d6f68" stroke-width="4"/>${fringe}<g fill="${c.eye}" stroke="#332d2d" stroke-width="3"><ellipse cx="82" cy="91" rx="7" ry="10"/><ellipse cx="118" cy="91" rx="7" ry="10"/></g><g fill="#fff"><circle cx="80" cy="88" r="2.5"/><circle cx="116" cy="88" r="2.5"/></g><path d="M87 116q13 10 26 0" fill="none" stroke="#a35f60" stroke-width="4" stroke-linecap="round"/>${accessory}</svg>`;
}

function mapPropSvg() {
  return `<svg viewBox="0 0 920 620" role="img" aria-label="2009年旧城区地图与被圈出的下穿通道"><defs><filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-opacity=".35"/></filter></defs><g filter="url(#paper-shadow)" transform="rotate(-2 460 310)"><rect x="55" y="42" width="810" height="536" rx="18" fill="#e6dcc8" stroke="#8d806c" stroke-width="5"/><g stroke="#8c8a7d" stroke-width="7" fill="none" opacity=".75"><path d="M110 135h690M110 245h690M110 355h690M110 465h690"/><path d="M205 88v440M365 88v440M535 88v440M705 88v440"/></g><path d="M126 510C250 430 326 388 440 390s190 56 328 90" fill="none" stroke="#6b8793" stroke-width="22" opacity=".72"/><path d="M534 287c38-35 78-40 121-8s54 73 29 112-78 49-122 30-64-84-28-134z" fill="none" stroke="#8f3f45" stroke-width="11"/><path d="M525 281c45-46 109-43 153-6 51 43 45 110 10 147-40 43-106 41-150 8" fill="none" stroke="#8f3f45" stroke-width="6" opacity=".75"/><text x="104" y="108" fill="#5f584d" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="26" font-weight="650">梧城旧城区 · 2009</text><text x="514" y="470" fill="#7d3339" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="23" transform="rotate(-5 514 470)">不要在18:42经过这里</text><text x="590" y="347" fill="#5c554c" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="19">下穿通道？</text></g></svg>`;
}

function phonePropSvg() {
  return `<svg viewBox="0 0 520 900" role="img" aria-label="来自五分钟后的未来照片消息"><defs><linearGradient id="phone-bg" x2="0" y2="1"><stop stop-color="#202b38"/><stop offset="1" stop-color="#0d141c"/></linearGradient></defs><rect x="48" y="25" width="424" height="850" rx="60" fill="#0a0d12" stroke="#77828d" stroke-width="8"/><rect x="70" y="76" width="380" height="740" rx="34" fill="url(#phone-bg)"/><rect x="186" y="47" width="148" height="17" rx="9" fill="#313943"/><text x="98" y="129" fill="#dce9ea" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="24" font-weight="650">陈渡</text><text x="98" y="160" fill="#83a7aa" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="17">来自未来 · 18:47</text><rect x="104" y="202" width="312" height="360" rx="22" fill="#121922" stroke="#52626f" stroke-width="3"/><path d="M132 510l65-96 47 55 49-86 93 127z" fill="#283541"/><circle cx="342" cy="286" r="42" fill="#7d8e98" opacity=".35"/><path d="M258 326c-24 18-35 56-25 99l-46 73h146l-44-73c10-43-3-80-31-99z" fill="#15181d"/><path d="M145 545h225" stroke="#844a4f" stroke-width="8" opacity=".8"/><rect x="98" y="607" width="300" height="86" rx="22" fill="#2d5151"/><text x="122" y="645" fill="#e6f3ef" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="18">发送人：你</text><text x="122" y="674" fill="#bdd8d3" font-family="system-ui,'Microsoft YaHei',sans-serif" font-size="17">拍摄时间：五分钟后</text><text x="260" y="784" fill="#80969b" text-anchor="middle" font-family="ui-monospace,monospace" font-size="18">18:42</text></svg>`;
}

export function mountUiBridge(game) {
  const { session, renderer } = game;
  const host = renderer.element;
  const doc = host.ownerDocument;
  let disposed = false;
  let lastChapter = null;
  let chapterTimer = 0;
  const style = doc.createElement('style');
  style.dataset.resetArtCompleteness = 'v1';
  style.textContent = `
.reset-brand-mark{position:absolute;z-index:9;left:clamp(20px,5vw,72px);top:clamp(24px,8vh,92px);width:min(48%,620px);pointer-events:none;filter:drop-shadow(0 12px 24px #0008)}.reset-brand-mark svg{display:block;width:100%;height:auto}.reset-chapter-card{position:absolute;z-index:12;left:clamp(18px,4vw,64px);top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:20px;min-width:min(560px,78%);padding:20px 28px;border-left:3px solid #a9d3cc;background:linear-gradient(90deg,#0d1b22ee,#10242bd9 72%,transparent);box-shadow:0 18px 50px #0007;pointer-events:none;animation:resetChapterIn .28s ease-out,resetChapterOut .35s ease-in 1.45s forwards}.reset-chapter-number{font:700 clamp(44px,7vw,84px)/1 ui-monospace,monospace;color:#7fb7ae;opacity:.7}.reset-chapter-kicker{font:600 11px/1.2 system-ui,sans-serif;letter-spacing:.35em;color:#7fa49f;margin-bottom:5px}.reset-chapter-card strong{display:block;font:650 clamp(25px,3vw,42px)/1.15 system-ui,'Microsoft YaHei',sans-serif;color:#f0f8f6;letter-spacing:.08em}.reset-chapter-card span{display:block;margin-top:7px;font:400 clamp(12px,1.3vw,16px)/1.4 system-ui,'Microsoft YaHei',sans-serif;color:#aec9c5;letter-spacing:.08em}@keyframes resetChapterIn{from{opacity:0;transform:translate(-24px,-50%)}to{opacity:1;transform:translate(0,-50%)}}@keyframes resetChapterOut{to{opacity:0;transform:translate(18px,-50%)}}.reset-story-prop{position:absolute;z-index:8;right:clamp(12px,3vw,44px);top:clamp(56px,10vh,110px);pointer-events:none;filter:drop-shadow(0 18px 30px #0008)}.reset-story-prop svg{display:block;width:100%;height:auto}.reset-story-prop-map{width:min(43%,620px);transform:rotate(1.5deg)}.reset-story-prop-phone{width:min(27%,330px);top:50%;transform:translateY(-50%) rotate(1deg)}.reset-memory-cast{margin-top:24px;padding-top:20px;border-top:1px solid #3c5864}.reset-memory-cast h3{margin:0 0 12px}.reset-chibi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.reset-chibi-card{min-width:0;padding:8px 7px 9px;border:1px solid #3c5864;border-radius:12px;background:linear-gradient(180deg,#17313b,#10232c);text-align:center;box-shadow:inset 0 1px #ffffff0d}.reset-chibi-card svg{display:block;width:100%;aspect-ratio:10/11;max-height:150px;margin:auto}.reset-chibi-card span{display:block;margin-top:3px;font-size:11px;color:#d4e9e6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.reset-brand-mark{width:min(68%,440px);left:16px;top:22px}.reset-chapter-card{left:12px;min-width:min(620px,92%);padding:14px 18px;gap:12px}.reset-story-prop-map{width:min(62%,480px);right:8px;top:72px}.reset-story-prop-phone{width:min(38%,250px);right:8px}.reset-chibi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-height:480px){.reset-brand-mark{width:min(34%,360px);top:12px}.reset-chapter-card{top:42%;padding:10px 14px}.reset-chapter-number{font-size:38px}.reset-story-prop-map{width:min(38%,400px);top:32px}.reset-story-prop-phone{width:min(22%,210px)}}@media(prefers-reduced-motion:reduce){.reset-chapter-card{animation:none}}
`;
  doc.head.append(style);

  const makeImage = (src, id, alt, className = 'reset-ui-header') => { const image = doc.createElement('img'); image.src = src; image.alt = alt; image.className = className; image.dataset.uiVisual = id; image.decoding = 'async'; return image; };
  const makeSvgNode = (html, className, id) => { const wrap = doc.createElement('div'); wrap.className = className; if (id) wrap.dataset.artExtra = id; wrap.innerHTML = html; return wrap; };

  function syncTitle() {
    if (disposed) return;
    const stage = host.querySelector('.vn-stage'); if (!stage) return;
    const show = session.getView().frame.sceneId === 'prologue_1842';
    let image = stage.querySelector('[data-ui-visual="title-key-visual"]');
    let brand = stage.querySelector('[data-art-extra="brand-mark"]');
    if (show && !image) { image = makeImage(UI.title, 'title-key-visual', '回留 RESET · 18:42', 'reset-title-key-visual'); stage.append(image); } else if (!show && image) image.remove();
    if (show && !brand) { brand = makeSvgNode(brandSvg(), 'reset-brand-mark', 'brand-mark'); stage.append(brand); } else if (!show && brand) brand.remove();
  }

  function syncChapterCard() {
    if (disposed) return;
    const stage = host.querySelector('.vn-stage'); if (!stage) return;
    const chapter = Number(session.getView().frame.chapter); if (!CHAPTERS.has(chapter) || chapter === lastChapter) return;
    lastChapter = chapter; stage.querySelector('[data-art-extra="chapter-card"]')?.remove();
    const [num, title, subtitle] = CHAPTERS.get(chapter); const card = doc.createElement('div'); card.className = 'reset-chapter-card'; card.dataset.artExtra = 'chapter-card';
    card.innerHTML = `<div class="reset-chapter-number">${num}</div><div><div class="reset-chapter-kicker">CHAPTER</div><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></div>`; stage.append(card);
    clearTimeout(chapterTimer); chapterTimer = setTimeout(() => card.remove(), doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 900 : 1900);
  }

  function syncStoryProps() {
    if (disposed) return;
    const stage = host.querySelector('.vn-stage'); if (!stage) return;
    const sceneId = session.getView().frame.sceneId;
    const wanted = sceneId === 'archive_erased_map' ? ['erased-map', mapPropSvg(), 'reset-story-prop reset-story-prop-map'] : sceneId === 'underpass_warning' ? ['future-phone', phonePropSvg(), 'reset-story-prop reset-story-prop-phone'] : null;
    const current = stage.querySelector('[data-art-extra^="story-prop-"]');
    if (!wanted) { current?.remove(); return; }
    const [id, svg, className] = wanted; if (current?.dataset.artExtra === `story-prop-${id}`) return; current?.remove(); stage.append(makeSvgNode(svg, className, `story-prop-${id}`));
  }

  function insertAfter(reference, node) { reference.parentNode?.insertBefore(node, reference.nextSibling); }
  function decorateCast(panel) {
    if (panel.querySelector('[data-art-extra="memory-cast"]')) return;
    const section = doc.createElement('section'); section.className = 'reset-memory-cast'; section.dataset.artExtra = 'memory-cast';
    const heading = doc.createElement('h3'); heading.textContent = '角色记忆'; const grid = doc.createElement('div'); grid.className = 'reset-chibi-grid';
    for (const character of CAST) { const card = doc.createElement('div'); card.className = 'reset-chibi-card'; card.dataset.character = character.id; card.innerHTML = `${chibiSvg(character)}<span>${esc(character.name)}</span>`; grid.append(card); }
    section.append(heading, grid); panel.append(section);
  }

  function decorateArchive() {
    if (disposed) return;
    const modal = host.querySelector('.reset-dialog'); const panel = modal?.querySelector('.reset-panel'); const head = panel?.querySelector('.reset-panel-head'); if (!panel || !head || modal.hidden) return; const page = modal.dataset.page;
    if (page === 'slots' && !panel.querySelector('[data-ui-visual="save-anomaly"]')) insertAfter(head, makeImage(UI.save, 'save-anomaly', '异常存档 · 10月17日 18:42'));
    if (page === 'collection') {
      if (!panel.querySelector('[data-ui-visual="ending-collection-header"]')) insertAfter(head, makeImage(UI.endings, 'ending-collection-header', '结局收藏关键视觉'));
      if (!panel.querySelector('[data-ui-visual="cg-gallery-header"]')) { const galleryHeading = [...panel.querySelectorAll('h3')].find(node => node.textContent === 'CG 图鉴'); if (galleryHeading) panel.insertBefore(makeImage(UI.gallery, 'cg-gallery-header', 'CG 图鉴关键视觉'), galleryHeading); }
      decorateCast(panel);
    }
  }

  function decorateCombat() { if (disposed) return; for (const overlay of doc.querySelectorAll('.reset-combat')) { overlay.classList.add('reset-round7-ui'); overlay.dataset.uiVisual = 'combat-hud-key-visual'; overlay.style.setProperty('--reset-combat-key-visual', `url("${UI.combat}")`); } }
  const sync = () => { syncTitle(); syncChapterCard(); syncStoryProps(); decorateArchive(); decorateCombat(); };
  const unsubscribe = session.subscribe(sync); const observer = new MutationObserver(sync); observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-page'] }); sync();

  return { dispose() { if (disposed) return; disposed = true; clearTimeout(chapterTimer); unsubscribe(); observer.disconnect(); style.remove(); host.querySelectorAll('[data-ui-visual="title-key-visual"],[data-ui-visual="save-anomaly"],[data-ui-visual="ending-collection-header"],[data-ui-visual="cg-gallery-header"]').forEach(node => node.remove()); host.querySelectorAll('[data-art-extra]').forEach(node => node.remove()); doc.querySelectorAll('.reset-combat.reset-round7-ui').forEach(node => { node.classList.remove('reset-round7-ui'); node.style.removeProperty('--reset-combat-key-visual'); delete node.dataset.uiVisual; }); } };
}
