import fs from 'node:fs';

const file = 'game/content/chapters/04.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const aliases = new Map([
  ['林晚 Normal End · 这一轮也算数', '林晚 · 这一轮也算数'],
  ['周小满 Normal End · 今天别重来', '周小满 · 今天别重来'],
  ['许栖 Normal End · 留在被放弃的世界', '许栖 · 留在被放弃的世界'],
  ['沈听澜 Normal End · 未归档的人', '沈听澜 · 未归档的人'],
  ['唐梨 Normal End · 向前跑', '唐梨 · 向前跑'],
  ['乔南星 Normal End · 已读不回', '乔南星 · 已读不回'],
]);

let changed = 0;
for (const scene of data.scenes) {
  for (const [from, to] of aliases) {
    if (scene.title === from) {
      scene.title = to;
      changed += 1;
    }
  }
  for (const line of scene.lines || []) {
    let text = line.text;
    for (const [from, to] of aliases) text = text.replaceAll(from, to);
    if (text !== line.text) {
      line.text = text;
      changed += 1;
    }
  }
}

if (!changed) throw new Error('No ending labels were naturalized');
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`Naturalized ${changed} Chapter 4 ending-label references`);
