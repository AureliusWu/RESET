import { createSlotStore, ENDINGS, CGS } from './archive-data.mjs';

export function mountArchiveBridge(game, project, metaBridge) {
  const {session,renderer,assets} = game, host = renderer.element;
  const doc = host.ownerDocument, view = doc.defaultView;
  let storage; try { storage = view.localStorage; } catch { storage = null; }
  const store = createSlotStore(storage), toolbar = host.querySelector('.vn-toolbar');
  const stage = host.querySelector('.vn-stage'), reading = host.querySelector('.vn-reading');
  const status = host.querySelector('.vn-status');
  let disposed = false, opened = false, lastFocus, page = '', pending, note;
  const element = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const button = (text, action) => { const node = element('button',text); node.type = 'button'; node.addEventListener('click',action); return node; };
  const slotsButton = button('存档管理',openSlots), collectionButton = button('结局与图鉴',openCollection);
  slotsButton.dataset.resetControl = 'slots'; collectionButton.dataset.resetControl = 'collection';
  toolbar.insertBefore(slotsButton,status); toolbar.insertBefore(collectionButton,status);
  const quickSave = toolbar.querySelector('[data-control=save]'), quickLoad = toolbar.querySelector('[data-control=load]');
  const quickLabels = [quickSave.textContent,quickLoad.textContent];
  quickSave.textContent = '快速存档'; quickLoad.textContent = '快速读档';
  const modal = element('div',undefined,'reset-dialog'); modal.hidden = true; modal.dataset.resetDialog = '';
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); host.append(modal);
  const panel = element('section',undefined,'reset-panel'); modal.append(panel);
  const locked = () => host.dataset.irreversible === 'true';
  const externallyPaused = () => { const state = session.getView(); return state.hidden || state.pauseReasons.some(reason => reason !== 'reset-archive'); };
  const canManage = () => !locked() && !externallyPaused();
  const tell = message => { if (note) note.textContent = message; if (status) status.textContent = message; };
  function begin(kind, title) {
    if (disposed || (!opened && session.getView().paused)) return false;
    if (!opened) {
      lastFocus = doc.activeElement; opened = true; modal.hidden = false;
      stage.inert = true; toolbar.inert = true; session.pause('reset-archive',true);
    }
    page = kind; pending = undefined; modal.dataset.page = kind; modal.setAttribute('aria-label',title);
    panel.replaceChildren();
    const head = element('header',undefined,'reset-panel-head'), close = button('关闭',closePanel);
    close.dataset.resetClose = ''; head.append(element('h2',title),close); panel.append(head);
    note = element('p','','reset-note'); note.setAttribute('role','status');
    queueMicrotask(() => { if (!disposed && opened && close.isConnected) close.focus(); });
    return true;
  }
  function closePanel() {
    if (!opened) return; opened = false; pending = undefined; note = undefined;
    modal.hidden = true; panel.replaceChildren(); stage.inert = false; toolbar.inert = false;
    session.pause('reset-archive',false);
    if (!disposed) (lastFocus?.isConnected && !lastFocus.hidden && !lastFocus.disabled ? lastFocus : host).focus();
  }
  function guarded(action) {
    if (!canManage()) { tell('这一段时间无法存读档。'); return; }
    try { action(); } catch (error) { tell(/quota/i.test(String(error?.name)+' '+String(error?.message)) ? '存储空间不足，已有存档保持不变。' : error instanceof Error ? error.message : '操作失败，已有存档保留。'); }
  }
  function confirm(title, description, action) {
    panel.replaceChildren(); modal.setAttribute('aria-label',title); modal.dataset.page = 'confirm';
    panel.append(element('h2',title),element('p',description));
    const row = element('div',undefined,'reset-row'), cancel = button('取消',openSlots), accept = button('确认',() => guarded(action));
    accept.dataset.resetConfirm = ''; row.append(cancel,accept); panel.append(row); note = element('p','','reset-note'); note.setAttribute('role','status'); panel.append(note);
    pending = action; cancel.focus();
  }
  function openSlots() {
    if (!canManage() || !begin('slots','存档管理')) return;
    panel.append(element('p','6 个手动存档槽。快速存档与旧版存档保持独立。','reset-muted'));
    const list = element('div',undefined,'reset-slot-grid'); panel.append(list,note);
    let slots; try { slots = store.list(); } catch (error) { tell(error.message); return; }
    slots.forEach((slot,index) => {
      const id = index + 1, card = element('article',undefined,'reset-slot'); card.dataset.slot = String(id);
      const head = element('div',undefined,'reset-slot-head'); head.append(element('h3',`手动存档 ${id}`),element('span',slot ? new Date(slot.savedAt).toLocaleString('zh-CN',{hour12:false}) : '空白','reset-muted')); card.append(head);
      card.append(element('p',slot?.title ?? '留一个可以回来的位置。','reset-slot-title'));
      if (slot) card.append(element('p',slot.excerpt,'reset-excerpt'));
      const row = element('div',undefined,'reset-row');
      const save = button(slot ? '覆盖' : '保存',() => guarded(() => {
        const write = () => { store.put(id,session.save(),session.getView().frame,slot); openSlots(); tell(`已保存至手动存档 ${id}`); };
        if (slot) confirm(`覆盖手动存档 ${id}？`,`${slot.title}\n原存档将被当前进度替换。`,write); else write();
      })); save.dataset.slotAction = 'save'; row.append(save);
      const load = button('读取',() => guarded(() => {
        const current = store.list()[index]; if (!current) throw new Error('此存档已不存在。');
        session.restore(current.save); closePanel(); tell(`已读取手动存档 ${id}`);
      })); load.dataset.slotAction = 'load'; load.disabled = !slot; row.append(load);
      if (slot) {
        const remove = button('删除',() => guarded(() => confirm(`删除手动存档 ${id}？`,`${slot.title}\n此操作仅删除这个手动存档。`,() => { store.remove(id,slot); openSlots(); tell(`已删除手动存档 ${id}`); })));
        remove.dataset.slotAction = 'delete'; row.append(remove);
      }
      card.append(row); list.append(card);
    });
  }
  function openCollection() {
    if (!begin('collection','结局与图鉴')) return;
    const meta = metaBridge.meta, endings = new Set(meta.endings), cgs = new Set(meta.cgs);
    panel.append(element('p',`结局 ${ENDINGS.filter(e => endings.has(e.id)).length} / ${ENDINGS.length} · CG ${CGS.filter(cg => cgs.has(cg.id)).length} / ${CGS.length}`,'reset-progress'));
    panel.append(element('p','已走过的路、已见过的画面会留在这里。查看收藏不会改变当前进度。','reset-muted'));
    const list = element('div',undefined,'reset-ending-grid');
    ENDINGS.forEach((ending,index) => {
      const unlocked = endings.has(ending.id), card = element('article',undefined,'reset-ending'); card.dataset.ending = ending.id; card.dataset.unlocked = String(unlocked);
      card.append(element('small',unlocked ? ending.kind : `结局 ${String(index+1).padStart(2,'0')}`),element('h3',unlocked ? ending.title : '尚未抵达'));
      list.append(card);
    }); panel.append(element('h3','结局收藏'),list,element('h3','CG 图鉴'));
    const grid = element('div',undefined,'reset-cg-grid');
    CGS.forEach((cg,index) => {
      const unlocked = cgs.has(cg.id), item = button('',() => { if (unlocked) showCG(cg); }); item.className = 'reset-cg-card'; item.dataset.cg = cg.id; item.disabled = !unlocked;
      if (unlocked) { const image = element('img'); image.src = assets.url(cg.id,'cg'); image.alt = cg.title; image.loading = 'lazy'; item.append(image); }
      else item.append(element('span','未解锁','reset-cg-locked'));
      item.append(element('span',unlocked ? cg.title : `CG ${String(index+1).padStart(2,'0')}`)); grid.append(item);
    }); panel.append(grid,note);
  }
  function showCG(cg) {
    if (!metaBridge.meta.cgs.includes(cg.id)) return;
    if (!begin('cg',cg.title)) return;
    const image = element('img'); image.src = assets.url(cg.id,'cg'); image.alt = cg.title; image.className = 'reset-cg-full';
    panel.append(image,button('返回图鉴',openCollection),note);
  }
  function key(event) {
    if (!opened) return;
    // Keep the engine's story shortcuts outside this read-only/pause scope.
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); closePanel(); return; }
    if (event.key !== 'Tab') return;
    const items = [...panel.querySelectorAll('button:not(:disabled),a[href],input:not([disabled])')];
    const index = items.indexOf(doc.activeElement);
    if (items.length && ((event.shiftKey && index <= 0) || (!event.shiftKey && index === items.length-1))) { event.preventDefault(); items[event.shiftKey ? items.length-1 : 0].focus(); }
  }
  function sync() {
    if (disposed) return;
    const state = session.getView(); slotsButton.hidden = locked();
    slotsButton.disabled = state.paused || locked(); collectionButton.disabled = state.paused;
    if (opened && (locked() && (page === 'slots' || pending))) closePanel();
    if (opened) for (const node of panel.querySelectorAll('[data-slot-action],[data-reset-confirm]')) node.disabled = !canManage() || (node.dataset.slotAction === 'load' && !storeSlotExists(node));
  }
  function storeSlotExists(node) { try { return Boolean(store.list()[Number(node.closest('[data-slot]')?.dataset.slot)-1]); } catch { return false; } }
  const unsubscribe = session.subscribe(sync); modal.addEventListener('keydown',key,true);
  const resize = () => { if (!disposed) host.style.setProperty('--reset-reading',`${Math.ceil(reading.getBoundingClientRect().height)}px`); };
  const observer = view.ResizeObserver ? new view.ResizeObserver(resize) : null; observer?.observe(reading); resize(); sync();
  return {openSlots,openCollection,dispose() {
    if (disposed) return; disposed = true; unsubscribe(); closePanel(); observer?.disconnect(); modal.removeEventListener('keydown',key,true);
    slotsButton.remove(); collectionButton.remove(); modal.remove(); host.style.removeProperty('--reset-reading');
    quickSave.textContent = quickLabels[0]; quickLoad.textContent = quickLabels[1];
  }};
}
