import fs from 'node:fs';

const replacements = {
  'game/content/chapters/01.json': {
    r1_linwan_shadow_pre05_01: '林晚收完值日表，又替程妍把练习册按座号排好。她抬手去够窗边那摞本子时，墙上的影子却比本人早了一拍。',
    r1_after_school_choice_pre05_01: '晚高峰把梧城堵成一片。公交站挤满校服，便利店门铃响个不停；地铁封站公告就在这时刷进手机。陈渡还是决定去南湖站。',
    r1_home_bad_pre05_01: '冰箱上还贴着陈岚的便签，夜班饭盒洗好倒扣在水槽边，手机里躺着两个未接电话。陈渡刚松下一口气，屋里却响起了自己的声音。',
    r1_archive_room_pre05_01: '许蓉先把他们拦在旧档柜外，要求按借阅流程登记。沈听澜戴上手套，从纸张、压痕和馆藏记录一点点往回查，最后停在2009年的一页。',
    r1_cafeteria_path_pre05_01: '二楼窗口前照常排着队，罗秀梅一边打饭一边催人往前走。唐梨训练完饿得厉害，端着餐盘却在拐角停住——她记得这里本该有一道门。',
    r1_rooftop_warning_pre05_01: '放学铃声已经散进操场，天台上还听得见社团收器材的吆喝。许栖把六天后的死亡预告说得很轻，又补了一句：杀他的人未必是恶人。',
  },
  'game/content/chapters/02.json': {
    r1_underpass_warning_pre05_01: '手机里的未来照片只剩五分钟。有人盯施工围挡，有人核对路线，有人看水流和出口；第一次，几个人没等陈渡下命令就同时动了起来。',
    r1_faceless_first_pre05_01: '无面行人从暗处逼近时，陈渡第一次没把“死了再来”当后路。他盯动作，其他人负责喊位置、拉人和退路，每个人都在害怕，也都没有散开。',
    r1_faceless_pattern_pre05_01: '他们不再硬撞。有人盯倒影，有人报距离，有人守撤退口；几次险些擦身而过之后，大家一起确认了那个规律——影子总会比本体早动半拍。',
    r1_death_fifth_pre05_01: '第五次死亡来得很快。最后一瞬，他听见有人喊他的名字；再次睁眼时，胸口仍残着被撞开的闷痛，那声喊也没有跟着重置。',
    r1_faceless_second_pre05_01: '无面行人记住了他们上一轮的躲法。陈渡他们也换了办法；进不了异常现场的人守在外围，用电话、时间和现实里的路口替他们确认位置。',
    r1_death_sixth_pre05_01: '照搬上一轮的方法只换来第六次死亡。再次读取以后，陈渡终于承认：会学习的不只他们，连世界和那些东西也在记住每一次试错。',
    r1_breakthrough_first_pre05_01: '这一次，他们没有赌旧规律。观察、喊话、换位和撤退口一件件对上，终于有人活着走出了通道。可校门还要关，作业还得交，第二天照样会来。',
  },
};

const forbidden = [
  '这段时间里真正需要处理的是', '谜题机器', '写出梧城', '先让陈渡', '进入故事',
  '建立午餐日常', '神秘独白', '路线谜题', '工具化', '主角团', '线索点',
  '把战斗写成', '男主单刷', '关系成本', '现实锚点', '免费试错', '学习玩家',
  '第一次真正突破靠', '死亡保留短促',
];

let changed = 0;
for (const [file, map] of Object.entries(replacements)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const lines = data.scenes.flatMap((scene) => scene.lines || []);
  for (const [id, text] of Object.entries(map)) {
    if (text.length > 80) throw new Error(`replacement exceeds 80 chars: ${id}:${text.length}`);
    const line = lines.find((item) => item.id === id);
    if (!line) throw new Error(`line not found: ${id}`);
    if (line.text !== text) {
      line.text = text;
      changed += 1;
    }
  }
  const serialized = JSON.stringify(data, null, 2) + '\n';
  for (const token of forbidden) {
    if (serialized.includes(token)) throw new Error(`meta prose remains in ${file}: ${token}`);
  }
  fs.writeFileSync(file, serialized);
}
if (!changed) throw new Error('no R3 PR A cleanup changes produced');
console.log(`R3 PR A meta cleanup changed ${changed} lines`);
