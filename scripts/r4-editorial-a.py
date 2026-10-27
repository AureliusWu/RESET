import json
from pathlib import Path

PATCHES = {
    "01.json": {
        "r1_prologue_1842_pre02_01": "陈渡把那句快冲到嘴边的话咽了回去。走廊里还有人催值日、借充电线、问今晚吃什么；在这里喊一声“世界会重来”，只会先把这些人吓住。",
        "r1_prologue_1842_pre05_01": "晚自习散场，班群还在催作业。徐嘉树把伞塞给他，顾老师沿走廊一间间锁门。陈渡站在这些寻常声音里，再一次确认：自己已经死过三次。",
        "r1_prologue_1842_key04_01": "这种话以前只让他觉得烦。死过三次以后，借伞、催作业、锁门声都成了证据——至少这一轮，他们还好好活在这里。",
        "r1_prologue_1842_pre05_02": "他开始记那些以前嫌麻烦的细节：谁当时在场，谁被吓住，谁因此错过了原本要做的事。一次读取改掉的，从来不止结局。",
        "r1_prologue_1842_post02_01": "他在纸页顶端写下“雨夜存档点”，先记事实：时间、目击者、被改变的细节。至于原因，空着。",
        "r1_prologue_1842_post02_02": "空白让人难受，却比一个太早写下的答案安全。",
        "r1_prologue_1842_post03_02": "18:42像一根扎进脑子的针，可窗外还有无数只钟照常往前走。",
        "r1_xiaoman_rain_pre01_01": "19:03，梧城一中东门。雨水从遮雨棚边缘成串落下，电动车贴着积水绕行，奶茶店门口挤满等单的学生。",
        "r1_xiaoman_rain_pre02_01": "陈渡没有立刻把“读取”两个字说出口。苏遥还在等海报，店员还在报取餐号，周小满也仍有一个原本该继续的晚上。",
        "r1_xiaoman_rain_pre05_02": "陈渡记下苏遥当时站的位置。她不是线索的一部分，却可能因为他们追线索而被卷进去。",
        "r1_xiaoman_rain_pre06_01": "东门堵成一团，便利店微波炉叮了一声，外卖骑手在雨里骂了句路滑。红衣女人就站在这些声音对面，安静得像画面里多出的一层。",
        "r1_xiaoman_rain_post01_01": "你先说你看见了什么，别管它听起来像不像真的。我记。",
        "r1_xiaoman_rain_post02_01": "陈渡在备忘录上写下“奶茶店门口”：19:03，红衣女人，周小满目击。其余先不下结论。",
        "r1_xiaoman_rain_post02_02": "周小满盯着那几行字看了一会儿，没有再拿这件事开玩笑。",
        "r1_xiaoman_rain_post03_02": "群聊里有人为一张化学卷子刷屏，和马路对面的红衣女人毫无关系。陈渡反而因此安心了一点。",
        "r1_xiaoman_rain_post08_01": "程妍和沈砚秋也有自己的事。我们要是把她们拖进来，就得把代价一起算进去。",
        "r1_linwan_shadow_pre01_01": "18:49，高二（三）班。人已经走得差不多了，后排只剩几把没收好的伞，雨声把空教室衬得更大。",
        "r1_linwan_shadow_pre01_02": "林晚按座号整理最后几本练习册。陈渡先看她的手，再看墙上的影子，最后才看钟。",
        "r1_linwan_shadow_pre05_02": "那一瞬间太短，短到足以被解释成眼花。陈渡却把林晚抬手的时刻和影子的动作顺序分开记了下来。",
        "r1_linwan_shadow_pre06_01": "楼下还有学生撑伞冲向校门，保安在催最后几辆电动车挪开。教室里的异常没有惊动任何人。",
        "r1_linwan_shadow_pre06_02": "于是墙上那半拍提前的动作更刺眼：现实没有停，只有林晚的影子抢先走了一步。"
    },
    "02.json": {
        "r1_chapter2_teaser_pre05_02": "真正让陈渡睡不着的，是那些没人能证明的残留：一句没说过的话，一阵没有来由的难过，还有某个人看见他时下意识的熟悉。",
        "r1_chapter2_teaser_pre06_01": "第二天，月考座位表照常贴出来，美术社照常催稿，公交照常晚点。昨夜的失真没有替任何人请假。",
        "r1_chapter2_teaser_pre06_02": "异常越大，白天那些小事反而越固执地继续。",
        "r1_chapter2_teaser_pre07_01": "陈渡已经不再期待所有人给出同一个答案。有人要追，有人要停，有人只肯承认能复核的那一小截事实。",
        "r1_chapter2_teaser_post01_01": "先别替我补答案。你们各自记得什么，就按原样说。",
        "r1_chapter2_teaser_post02_01": "他把这一页命名为“残响”，只抄下能够互相对上的部分。那些单独存在的记忆，被圈起来留待以后。",
        "r1_chapter2_teaser_post02_02": "有些空白暂时没有名字。",
        "r1_chapter2_teaser_post03_02": "群聊还在吵体育课会不会改室内。陈渡第一次觉得这种无聊很珍贵。",
        "r1_chapter2_teaser_post04_01": "路过的人嫌他们挡了道，侧身绕开。没人知道刚才那几句话可能来自一个已经被覆盖的世界。",
        "r1_chapter2_teaser_post09_01": "没人因此得到完整答案。可三个人记住同一个细节，就足够把“也许是我疯了”往后推一步。",
        "r1_chapter2_teaser_post10_01": "陈渡最后看了一眼街口。路灯、积水、远处模糊的车声都还在。他只想确认，自己确实从这里经过。",
        "r1_residue_homeroom_pre02_01": "早读铃还没响，陈渡就把声音压低了。周围有人背单词，有人补昨晚的卷子，这里不适合用一句“世界重来过”把整层楼的人都拖进来。",
        "r1_residue_homeroom_pre05_01": "徐嘉树在后门催值日，程妍抱着考勤本找人签字，顾老师隔着窗往里看了一眼。就在这一套熟得发腻的早晨里，林晚说出了一句不存在的昨天。",
        "r1_residue_homeroom_pre05_02": "陈渡先记下她原话，又记下周小满在楼梯转角突然停住的时间。两段残响彼此挨得太近，他反而不敢急着解释。",
        "r1_residue_homeroom_pre06_01": "教室前门贴着新座位表，走廊有人追着借作业。被覆盖的记忆没有让今天停课。",
        "r1_residue_homeroom_pre06_02": "现实越正常，那句“我知道，可我记得”就越难被当成错觉。",
        "r1_residue_homeroom_pre07_01": "林晚想确认记忆，周小满只想先弄清那股莫名其妙的悲伤从哪来。陈渡夹在两种反应中间，没有资格替她们选一种解释。"
    }
}

root = Path(__file__).resolve().parents[1] / "game" / "content" / "chapters"
changed = 0
for filename, mapping in PATCHES.items():
    path = root / filename
    data = json.loads(path.read_text(encoding="utf-8"))
    seen = set()
    for scene in data.get("scenes", []):
        for line in scene.get("lines", []):
            line_id = line.get("id")
            if line_id in mapping:
                line["text"] = mapping[line_id]
                seen.add(line_id)
                changed += 1
    missing = set(mapping) - seen
    if missing:
        raise SystemExit(f"{filename}: missing line ids: {sorted(missing)}")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(f"R4 PR A patched {changed} lines")
