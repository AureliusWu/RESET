import fs from 'node:fs';

const targets = [
  'game/content/chapters/01.json',
  'game/content/chapters/02.json',
];

const exactById = new Map(Object.entries({
  r1_prologue_1842_pre05_01: '晚自习散场，班群还在催作业，徐嘉树把伞塞到他手里，顾老师在走廊尽头一间间锁门。陈渡站在这些再普通不过的声音里，第四次确认：自己已经死过三次。',
  r1_prologue_1842_pre05_02: '他开始把从前会顺手划掉的细节也记下来：谁在场，谁被吓到，谁因此错过了原本的安排。异常留下的后果，从来不只写在“线索”里。',
  r1_prologue_1842_pre06_02: '也正因为如此，那些异常才显得格外突兀——周围的人还在为明天的作业、早班和饭局发愁。',
  r1_prologue_1842_pre07_01: '他们很少真正意见一致。有人想继续追下去，有人先问普通人能不能撤开，还有人宁愿把结论空着，也不肯拿猜测当证据。陈渡慢慢习惯了这一点。',
  r1_prologue_1842_post07_01: '沈砚秋和纪尧也被卷进了这件事。他们不会因为站得离谜底远一些就免受影响；陈渡每做一个决定，都可能改掉他们原本的一天。',
  r1_prologue_1842_post07_02: '那些原本被他当作背景的人，也有自己的生活。',
  r1_prologue_1842_post10_01: '临走前，陈渡又回头看了一眼。不是找线索，只是想把这一刻记牢：这一轮里，梧城一中旧教学楼的灯亮过，人也确实在这里生活过。',
  r1_xiaoman_rain_pre05_01: '苏遥还在奶茶店等她，美术社群里一条接一条催着截稿。周小满嘴上照旧轻快，像什么都能拿来开玩笑——直到那个红衣女人从马路对面的雨幕里出现。',
  r1_xiaoman_rain_pre05_02: '陈渡把苏遥也记进备忘录。她看见了什么、被吓成什么样、会不会因此错过原来的安排，都不能因为“和谜底无关”就被略过去。',
  r1_xiaoman_rain_pre06_02: '越是有人抱怨作业、堵车和明天的早起，那个一闪而过的红衣身影就越显得不属于这里。',
  r1_xiaoman_rain_post07_01: '程妍和沈砚秋也被这件事占走了时间。一个在替班级核对考勤，一个在替他们压住过早的结论；陈渡已经没法再把她们当成不会受影响的旁观者。',
  r1_xiaoman_rain_post07_02: '梧城没有谁天生只是背景。',
  r1_xiaoman_rain_post10_01: '临走前，陈渡回头看了一眼东门。奶茶店的灯还亮着，骑车的人从积水边绕过去。至少这一轮里，这些细节都真实发生过。',
}));

const exactText = new Map(Object.entries({
  ' 陈渡不再允许自己只记住“有用线索”。谁在场、谁被吓到、谁因此错过原本的安排，都属于同一件事的后果。': '他开始把从前会顺手划掉的细节也记下来：谁在场，谁被吓到，谁因此错过了原本的安排。异常留下的后果，从来不只写在“线索”里。',
  '陈渡不再允许自己只记住“有用线索”。谁在场、谁被吓到、谁因此错过原本的安排，都属于同一件事的后果。': '他开始把从前会顺手划掉的细节也记下来：谁在场，谁被吓到，谁因此错过了原本的安排。异常留下的后果，从来不只写在“线索”里。',
  '异常之所以刺眼，正因为大多数人还有明天的作业、早班和饭局。': '也正因为如此，那些异常才显得格外突兀——周围的人还在为明天的作业、早班和饭局发愁。',
  '六个人的意见并不总是一致。有人想继续查，有人更关心先把普通人撤出去，有人坚持证据不足就不能下结论。陈渡开始接受“团队”并不意味着所有人听他的。': '他们很少真正意见一致。有人想继续追下去，有人先问普通人能不能撤开，还有人宁愿把结论空着，也不肯拿猜测当证据。陈渡慢慢习惯了这一点。',
  '世界因此不再只有攻略对象与谜题。': '那些原本被他当作背景的人，也有自己的生活。',
  '这个习惯很慢，却让调查第一次不像追逐谜语。': '写得慢一点，至少不会把猜测写成事实。',
  '有同学从旁边经过时朝他们看了一眼，很快又去讨论自己的事。秘密在校园里并不会自动获得舞台，大多数时候，它只能藏在一群普通人的声音下面。': '旁边有人看了他们一眼，很快又低头聊起自己的事。校园没有因为这场异常停下来，秘密只能夹在这些普通声音里。',
}));

function naturalizePlan(body, scene) {
  let text = body.trim();

  const custom = {
    chapter2_teaser: '界面上的字消失以后，深夜重新安静下来。第二天照样要早读、点名、交作业，可陈渡已经知道：只要还有一个人记得被覆盖的那一轮，普通生活就再也回不到完全干净的状态。',
  };
  if (custom[scene.id]) return custom[scene.id];

  if (text.startsWith('把') && text.includes('：')) {
    text = text.slice(text.indexOf('：') + 1).trim();
  }

  text = text
    .replaceAll('Bad End', '坏结局')
    .replaceAll('True End', '最后的清晨')
    .replaceAll('系统层', '那层冰冷的界面')
    .replaceAll('英雄叙事', '那些关于“英雄”的想象')
    .replace(/([^。；]+)路线核心是/g, '$1真正绕不开的是')
    .replace(/感情推进来自/g, '两个人真正靠近，靠的是')
    .replace(/先写/g, '先是')
    .replace(/强调/g, '也让人看见')
    .replace(/展示/g, '留下的结果是')
    .replace(/；/g, '。');

  return text;
}

function polishText(text, line, scene) {
  if (exactById.has(line.id)) return exactById.get(line.id);

  let out = text.trimStart();
  if (exactText.has(out)) return exactText.get(out);

  if (out.startsWith('这段时间里真正需要处理的是：')) {
    out = naturalizePlan(out.slice('这段时间里真正需要处理的是：'.length), scene);
  }

  out = out.replace(
    /他在备忘录最上方写了“([^”]+)”。下面没有先写结论，而是列了三个栏目：现实里发生了什么、谁能证明、异常改变了什么。/g,
    '陈渡给这一页标上“$1”，只记三件事：发生过什么、谁能作证、异常改掉了什么。结论先空着。',
  );

  out = out.replace(
    /沈砚秋对“([^”]+)”只给出一个原则：能证明到哪一步就说到哪一步。空白可以保留，不能为了让故事好看就擅自补成事实。/g,
    '沈砚秋看完“$1”的记录，只划掉几处推测：能证到哪一步，就写到哪一步。空白可以留着，猜测不能冒充事实。',
  );

  out = out.replace(
    /纪尧习惯在“([^”]+)”相关文件旁边写校验时间和设备来源。他反复强调：数字证据不是神谕，只是另一种会坏、但能被比较的记录。/g,
    '纪尧在“$1”的文件边上补了校验时间和设备来源。对他来说，数字也会出错，只是出错的方式通常还能被另一份记录抓出来。',
  );

  out = out.replace(
    /这些关系把陈渡重新拽回人群。(.+?)和(.+?)都没有被写进“六位女主”的路线选择里，却会因为他的决定改变自己的时间表、情绪和判断。/g,
    '$1和$2也被卷进了这件事。他们不会因为离谜底远一些就免受影响；陈渡每做一个决定，都可能改掉他们原本的一天。',
  );

  out = out.replace(
    /把(.+?)和(.+?)也记进去。不是因为他们掌握答案，是因为如果我们的选择伤到普通人的生活，那也必须算在结果里。/g,
    '别把$1和$2当旁观者。我们的决定如果让他们付出代价，这部分也得记。',
  );

  out = out.replace(
    /在离开“([^”]+)”这一刻之前，陈渡又回头确认了一次周围。不是为了寻找隐藏线索，只是为了记住：这一轮里，(.+?)确实有人生活过。/g,
    '临走前，陈渡又回头看了一眼。不是找线索，只是想把这一刻记牢：这一轮里，$2的灯亮过，人也确实在这里生活过。',
  );

  out = out
    .replaceAll('“六位女主”的路线选择', '所谓的中心位置')
    .replaceAll('攻略对象', '故事中央的人')
    .replaceAll('为了让故事好看', '为了把空白补圆')
    .replaceAll('系统层', '那层冰冷的界面');

  return out;
}

function countHan(value) {
  return (JSON.stringify(value).match(/[\u3400-\u9fff]/g) || []).length;
}

let changed = 0;
for (const file of targets) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const beforeHan = countHan(data);
  const beforeShape = data.scenes.map((scene) => ({
    id: scene.id,
    choices: (scene.choices || []).map((choice) => [choice.id, choice.next]),
    next: scene.next ?? null,
    ending: scene.ending ?? null,
  }));

  for (const scene of data.scenes) {
    for (const line of scene.lines || []) {
      const next = polishText(line.text, line, scene);
      if (next !== line.text) {
        line.text = next;
        changed += 1;
      }
    }
  }

  const afterShape = data.scenes.map((scene) => ({
    id: scene.id,
    choices: (scene.choices || []).map((choice) => [choice.id, choice.next]),
    next: scene.next ?? null,
    ending: scene.ending ?? null,
  }));
  if (JSON.stringify(beforeShape) !== JSON.stringify(afterShape)) {
    throw new Error(`R3 structural drift detected in ${file}`);
  }

  const afterHan = countHan(data);
  if (afterHan < Math.floor(beforeHan * 0.97)) {
    throw new Error(`R3 text shrink exceeds 3% in ${file}: ${beforeHan} -> ${afterHan}`);
  }

  const serialized = JSON.stringify(data, null, 2) + '\n';
  const forbidden = [
    '这段时间里真正需要处理的是',
    '“六位女主”的路线选择',
    '攻略对象与谜题',
    '为了让故事好看就擅自补成事实',
  ];
  for (const token of forbidden) {
    if (serialized.includes(token)) throw new Error(`R3 meta prose remains in ${file}: ${token}`);
  }

  fs.writeFileSync(file, serialized);
  console.log(`${file}: ${beforeHan} -> ${afterHan} Han chars`);
}

if (!changed) throw new Error('R3 polish made no changes');
console.log(`R3 narrative polish changed ${changed} lines`);
