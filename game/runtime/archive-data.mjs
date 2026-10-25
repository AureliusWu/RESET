export const SLOT_KEY = 'reset:slots:v1';
export const SLOT_COUNT = 6;
const MAX_SAVE = 2_000_000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export const ENDINGS = [
  ['normal-linwan','Normal End','林晚 · 这一轮也算数'],
  ['normal-xiaoman','Normal End','周小满 · 今天别重来'],
  ['normal-xuqi','Normal End','许栖 · 留在被放弃的世界'],
  ['normal-tinglan','Normal End','沈听澜 · 未归档的人'],
  ['normal-tangli','Normal End','唐梨 · 向前跑'],
  ['normal-nanxing','Normal End','乔南星 · 已读不回'],
  ['bad-home','Bad End','回家的雨夜'],
  ['bad-station','Bad End','站台之外'],
  ['death-fifth','Bad End','第五次死亡'],
  ['death-sixth','Bad End','被记住的闪避'],
  ['bad-no-checkpoint','Bad End','没有回退点'],
  ['bad-permanent-save','Bad End','永久保存'],
  ['true-end','True End','回留 · 明天见']
].map(([id,kind,title]) => Object.freeze({id,kind,title}));

export const CGS = [
  ['faceless-reflection-cg','雨中的倒影'],
  ['letter-1842-cg','18:42 的来信'],
  ['six-chairs-cg','第七把椅子'],
  ['linwan-1842-cg','没有发生过的约定'],
  ['true-end-riverside-cg','明天见']
].map(([id,title]) => Object.freeze({id,title}));

// The UI never trusts imported display markup. The actual save is validated and
// replayed by RuntimeSession.restore; no derived stats from storage are applied.
export function createSlotStore(storage, now = () => new Date().toISOString()) {
  const checkId = id => { if (!Number.isInteger(id) || id < 1 || id > SLOT_COUNT) throw new Error('无效的存档槽'); };
  function read() {
    if (!storage) throw new Error('当前设备无法使用存档册，仍可在设置中导出存档。');
    const raw = storage.getItem(SLOT_KEY);
    if (raw === null) return [];
    if (raw.length > MAX_SAVE * SLOT_COUNT + 10_000) throw new Error('存档册过大，原数据已保留。');
    let value;
    try { value = JSON.parse(raw); } catch { throw new Error('存档册无法读取，原数据已保留。'); }
    const ids = new Set();
    if (!record(value) || value.schema !== 1 || value.game !== 'reset' || !Array.isArray(value.slots) || value.slots.length > SLOT_COUNT) throw new Error('存档册格式不兼容，原数据已保留。');
    for (const slot of value.slots) {
      if (!record(slot)) throw new Error('存档册无法读取，原数据已保留。');
      checkId(slot.id);
      if (ids.has(slot.id) || typeof slot.title !== 'string' || slot.title.length > 200 || typeof slot.excerpt !== 'string' || slot.excerpt.length > 300
        || typeof slot.savedAt !== 'string' || !Number.isFinite(Date.parse(slot.savedAt)) || !record(slot.save) || slot.save.schema !== 1 || slot.save.game !== 'reset'
        || JSON.stringify(slot.save).length > MAX_SAVE) throw new Error('存档册无法读取，原数据已保留。');
      ids.add(slot.id);
    }
    return value.slots;
  }
  function write(slots) {
    // setItem either succeeds completely or leaves the previous value intact.
    // Do not keep a mutable cache which could claim a failed write succeeded.
    storage.setItem(SLOT_KEY, JSON.stringify({schema:1,game:'reset',slots}));
  }
  return {
    list() { const slots = read(); return Array.from({length:SLOT_COUNT}, (_,index) => structuredClone(slots.find(s => s.id === index + 1) ?? null)); },
    put(id, save, frame, expected) {
      checkId(id);
      if (!record(save) || save.schema !== 1 || save.game !== 'reset' || JSON.stringify(save).length > MAX_SAVE) throw new Error('无法保存当前进度。');
      const slots = read(), previous = slots.find(s => s.id === id) ?? null;
      if (expected !== undefined && JSON.stringify(previous) !== JSON.stringify(expected)) throw new Error('此存档已在其他窗口更新，请重新操作。');
      const next = {id,savedAt:now(),title:String(frame.title ?? '当前段落').slice(0,200),excerpt:String(frame.text ?? '').slice(0,300),save:structuredClone(save)};
      write([...slots.filter(s => s.id !== id),next].sort((a,b) => a.id-b.id));
      return structuredClone(next);
    },
    remove(id, expected) {
      checkId(id); const slots = read(), previous = slots.find(s => s.id === id) ?? null;
      if (expected !== undefined && JSON.stringify(previous) !== JSON.stringify(expected)) throw new Error('此存档已在其他窗口更新，请重新操作。');
      if (previous) write(slots.filter(s => s.id !== id));
      return Boolean(previous);
    }
  };
}
