import json
import re
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "game" / "content" / "chapters"
path = root / "03.json"
data = json.loads(path.read_text(encoding="utf-8"))
HAN = re.compile(r"[\u3400-\u9fff]")

ctx = {
    "chapter3_gate": {
        "focus": "课桌里那封湿过的信",
        "evidence": "信封状态、林晚落款和几个人的记忆",
        "friction": "一封指向过去的信和现在的林晚彼此矛盾",
        "outside": "陈岚的晚饭、梁成的交接本和食堂窗口",
        "ordinary": "早读、考勤和家里留的饭",
        "setting": "教室里已经有人翻书、挪椅子，早读前的声音一点点多起来",
        "stance": "六个人可以暂时不同意，但谁也不能把自己的记忆先写成标准答案",
    },
    "letter_examination": {
        "focus": "林晚没有写过却带着她笔迹的信",
        "evidence": "笔迹、纸张来源、借阅记录和林晚本人的否认",
        "friction": "实体证据全都指向林晚，而现在的她明确说自己没写过",
        "outside": "许蓉的登记、沈砚秋的修复工作和陈岚的未读消息",
        "ordinary": "借阅登记、没领走的练习册和第一节课",
        "setting": "空教室的窗台还堆着练习册，纸张本身比任何推理都安静",
        "stance": "沈听澜宁可把未知写下来，也不愿用一封信替林晚承认不存在的过去",
    },
    "route_method_choice": {
        "focus": "六个人对残响方法的第一次争论",
        "evidence": "梦、情绪、夜梧城、档案和设备时间",
        "friction": "六种方法都能碰到真相，却没有一种足够独立证明全貌",
        "outside": "徐嘉树的球局、程妍的考勤和顾老师催的手续",
        "ordinary": "请假、作业和下午还要不要回教室",
        "setting": "旧风扇在头顶转，六个人围着同一张桌子却各自守着不同证据",
        "stance": "这次争论先不求统一；每个人只负责说明自己的证据能证明到哪里",
    },
    "route_linwan_dream": {
        "focus": "林晚梦里的旧文具店和那句警告",
        "evidence": "她的梦、封死的灰墙和林澄记得的童年习惯",
        "friction": "梦里存在的店铺在现实中只剩一面墙，警告却提前说出了许栖的名字",
        "outside": "林澄催回的消息、东门车流和仍在营业的小店",
        "ordinary": "放学人流、林澄的电话和街边换班的小店",
        "setting": "雨沿灰墙往下走，那道墙缝偏偏像一扇从来没有存在过的门",
        "stance": "林晚只肯承认自己梦见了什么，不允许陈渡把旧轮次的承诺算到现在的她头上",
    },
    "route_xiaoman_feeling": {
        "focus": "周小满在旧画架旁突然落下的眼泪",
        "evidence": "她的身体反应、残留情绪和苏遥能确认的现实行程",
        "friction": "情绪真实得无法忽略，却没有画面能证明它来自哪一轮",
        "outside": "苏遥催着收尾的海报和美术社还没结束的工作",
        "ordinary": "海报截稿、画具和放学后的社团安排",
        "setting": "旧画架上还有没擦净的颜料，周小满的眼泪却找不到属于这一轮的原因",
        "stance": "周小满可以描述难过和害怕，没人有资格替她把这种感觉解释成一段确定历史",
    },
    "route_xuqi_night": {
        "focus": "夜梧城里的第七把椅子",
        "evidence": "许栖画的路线、空教室布局和现实侧留下的站务记录",
        "friction": "夜梧城能被走进去，却无法靠一张现实地图解释它为什么多出一个位置",
        "outside": "梁成的交接本和现实里仍按班次运行的地铁",
        "ordinary": "站务交接、手机电量和回程路线",
        "setting": "空城的灯还按自己的节奏亮灭，第七把椅子却比整座城更像在等人",
        "stance": "许栖负责带路，不负责替所有人解释夜梧城；她先把能活着走出去的路线画清楚",
    },
    "route_merge_message": {
        "focus": "那条来自明天的群聊消息",
        "evidence": "设备时间、服务器记录、照片元数据和群聊内容",
        "friction": "三个时间源同时出现偏差，却又以不同方式指向同一条未来消息",
        "outside": "班群里正常的作业消息和罗秀梅照常开的食堂窗口",
        "ordinary": "晚饭、作业消息和设备剩余电量",
        "setting": "正常群聊不断把新消息顶上来，那条来自明天的记录夹在里面反而更刺眼",
        "stance": "乔南星先拆开三个时间源核对，任何一个时间戳都不能单独升级成世界规则",
    },
    "six_person_meeting": {
        "focus": "六个人第一次并排放下的证词",
        "evidence": "六份互相矛盾又彼此重叠的记忆与记录",
        "friction": "同一件事在六个人身上留下了不同形状，没人能独占解释权",
        "outside": "陈岚的消息、许蓉的登记和教室外照常经过的同学",
        "ordinary": "考勤、晚饭和每个人各自要回的消息",
        "setting": "桌上摊着六份记录，没有哪一份摆在正中间，也没有谁先替别人总结",
        "stance": "这次会议只找交集，不投票决定谁的记忆最真；冲突部分继续保留原样",
    },
    "archive_photo": {
        "focus": "旧照片里没有脸的第七个人",
        "evidence": "照片纸、档案来源、人物站位和缺失的面孔",
        "friction": "照片能证明第七个人曾占过位置，却无法告诉他们那个人是谁",
        "outside": "许蓉要归还的档案、沈砚秋的修复规范和学校当天的考勤",
        "ordinary": "档案归还、闭馆时间和教室外的下课铃",
        "setting": "旧照片的折痕和褪色都能解释，只有那张缺掉的脸像被单独从现实里挖走",
        "stance": "沈听澜坚持把“有人”与“是谁”分开记录，缺失本身不能直接填成凶手",
    },
    "future_rule": {
        "focus": "未来消息里那句“杀你的人不是凶手”",
        "evidence": "消息文本、三个时间源和已经发生过的死亡记忆",
        "friction": "一句来自未来的话改变了问题，却没有说明“杀人”和“凶手”为何会被拆开",
        "outside": "社团消息、家里催回的电话和照常运行的设备",
        "ordinary": "电量、回家时间和下一条普通群消息",
        "setting": "18:44已经过去，手机还在继续走秒，那句话却像卡在屏幕里没有跟着过去",
        "stance": "乔南星只承认这条消息确实出现过；它说的规则是什么，仍要等现实自己给证据",
    },
    "focus_linwan_open": {
        "focus": "林晚记得的门后雨声和旧约定",
        "evidence": "林晚的梦、旧街对应位置和她此刻明确说出的边界",
        "friction": "过去的林晚似乎留下过承诺，现在的林晚却仍有权重新回答",
        "outside": "东门晚高峰、林澄的消息和明天照常要交的练习册",
        "ordinary": "晚饭、作业和林澄催她回家的消息",
        "setting": "旧街的雨把招牌照得发亮，林晚站在门不存在的位置谈现在的选择",
        "stance": "陈渡可以记得旧约定，但不能拿记忆要求现在的林晚继续履行",
    },
    "focus_xiaoman_open": {
        "focus": "周小满分不清来源的那阵眼泪",
        "evidence": "她的情绪残留、旧画架触感和苏遥能确认的当天安排",
        "friction": "身体像记得另一轮的恐惧，周小满本人却没有义务接受别人替她拼好的故事",
        "outside": "苏遥等着的海报、没洗的画笔和晚上的社团消息",
        "ordinary": "海报、晚饭和苏遥接连发来的催稿消息",
        "setting": "美术教室里还有没干的颜料味，周小满先擦掉眼泪才继续说话",
        "stance": "她可以承认害怕，也可以拒绝陈渡把这种害怕变成一条固定路线",
    },
    "focus_xuqi_open": {
        "focus": "许栖再次带他们走向第七把椅子",
        "evidence": "她的夜梧城路线、现实站务记录和那把多出来的椅子",
        "friction": "许栖知道更多夜梧城规则，却不愿再被所有人当成一份活着的说明书",
        "outside": "南湖站交接、手机电量和现实侧等着他们回来的班次",
        "ordinary": "电量、站务记录和现实侧最后几班地铁",
        "setting": "夜梧城没有风，第七把椅子前的灰却像刚被什么人碰过",
        "stance": "这次先问许栖愿不愿意继续，再问她知道什么；两件事不能倒过来",
    },
}

OLD = {
    "pre05": "谁在场、谁被吓到、谁因此错过原本的安排，都属于同一件事的后果。",
    "pre06a": "调查逐渐成形以后，六个人第一次需要把各自的方法放在同一张桌上。梦、情绪、地图、档案和时间戳互相冲突；",
    "pre06b": "真正困难的地方，是每个人都只能看见自己那一块。",
    "pre07": "他们很少真正意见一致。有人想继续追下去，有人先问普通人能不能撤开，还有人宁愿把结论空着，也不肯拿猜测当证据。陈渡慢慢习惯了这一点。",
    "post01": "我先把能确认的写下来。记不住也没关系，至少别再假装只有我一个人的记忆算数。",
    "post02": "写得慢一点，至少不会把猜测写成事实。",
    "post03": "他们开始给证据标来源，而不是只记结论。梦境标“主观残响”，旧纸标“实体证据”，手机记录标“数字记录”，第三方记忆则单独写名字和时间。",
    "post04": "这种笨拙的调查方法也让关系变得难堪：有些话一旦记进表格，就像在质疑朋友；有些话不记，又可能在下一轮彻底消失。",
    "post07": "陈渡这才明白，谜底之外的每个人也在过自己的生活。",
    "post09_narrow": "他们没有因此获得完整答案，只得到一条更窄的路。可比起一个漂亮的解释，能够被几个人共同复核的事实更有用。",
    "pre02_people_clock": "过去几天里，陈渡养成了一个笨办法：每到一个地方先看人，再看钟，最后看自己。人会记错，钟会坏，而他本人更不值得完全相信。",
    "post09_crosscheck": "陈渡把这一幕记进了备忘录。钟会错，记录会坏，可另一个人记得同一件小事时，现实就多了一处可以互相校对的地方。",
    "pre05_long": "他开始把从前会顺手划掉的细节也记下来：谁在场，谁被吓到，谁因此错过了原本的安排。异常留下的后果，从来不只写在“线索”里。",
    "pre02_hold": "他把异常暂时压在心里，没有立刻说出口。这里还有太多不知情的人；一句“世界会重来”不能替他们完成眼前的作业、工作和回家路。",
    "pre02_time": "如果只看手机时间，这一刻和任何一天没有区别。真正让陈渡不安的，是身边的人仍然沿着熟悉的习惯行动，而他的记忆已经不再属于同一条时间线。",
    "post09_life": "异常退到视野边缘时，生活立刻重新挤回来：未回的消息、明天的安排、家里留的饭。陈渡第一次觉得这些麻烦本身就是好事。",
    "pre01_shop": "路边小店在换班，骑车的人按铃借道，没有谁知道陈渡正在把这些琐碎当成确认现实的坐标。",
}

changed = 0
for scene in data.get("scenes", []):
    sid = scene["id"]
    c = ctx[sid]
    replacements = {
        OLD["pre05"]: f"{c['focus']}留下的不只是一条线索；有人改了行程、失了约或受了惊，这些后果也得记。",
        OLD["pre06a"]: f"这一页真正撞在一起的是{c['friction']}。六个人先把分歧摆开，才继续往下查。",
        OLD["pre06b"]: f"{c['evidence']}都只能照亮一部分经过，剩下的缺口暂时没有人能补。",
        OLD["pre07"]: c["stance"],
        OLD["post01"]: f"先把{c['focus']}按原话记。谁记得什么就由谁负责，我不替任何人补全。",
        OLD["post02"]: f"关于{c['focus']}，空白先留着；下一次复核如果推翻今天，就照样改。",
        OLD["post03"]: f"这一页把{c['evidence']}分开标来源，再互相核对，不让一种证据替所有人发言。",
        OLD["post04"]: f"把{c['focus']}写进记录时，质疑会落到具体的人身上；怎么记本身也会改变关系。",
        OLD["post07"]: f"{c['outside']}都还在继续。谜底再近，也不能把这些人的日常压成背景。",
        OLD["post09_narrow"]: f"{c['focus']}没有给出完整答案，但把下一步缩小到几个人都能共同复核的范围。",
        OLD["pre02_people_clock"]: f"陈渡仍会核人和时间，但在{c['setting']}时，他先确认眼前发生的事有没有第二个人看见。",
        OLD["post09_crosscheck"]: f"他把{c['focus']}记下，也把能独立复核的人写在旁边；现实因此多了一处交叉点。",
        OLD["pre05_long"]: f"陈渡把{c['ordinary']}也记在异常旁边。被改掉的日常，同样属于事件后果。",
        OLD["pre02_hold"]: f"陈渡没有立刻谈读取。{c['ordinary']}仍在眼前进行，不能先被一句世界异常全部盖过去。",
        OLD["pre02_time"]: f"时间本身没有报错；真正不对劲的是{c['focus']}和眼前这套正常秩序同时成立。",
        OLD["post09_life"]: f"讨论一停，{c['ordinary']}立刻重新占回注意力。陈渡反而愿意让这些麻烦多留一会儿。",
        OLD["pre01_shop"]: c["setting"] + "。",
    }
    for line in scene.get("lines", []):
        text = line.get("text", "")
        if text in replacements:
            new = replacements[text]
            if len(new) > 80:
                raise SystemExit(f"over 80: {sid} {line.get('id')} {len(new)} {new}")
            line["text"] = new
            changed += 1

# Hard validation: high-frequency R1 templates should be gone.
texts = [line.get("text", "") for s in data.get("scenes", []) for line in s.get("lines", [])]
counts = Counter(texts)
for old in OLD.values():
    if counts.get(old, 0) >= 3:
        raise SystemExit(f"template remains x{counts[old]}: {old}")

# Preserve narrative density and line gate.
for s in data.get("scenes", []):
    for line in s.get("lines", []):
        if len(line.get("text", "")) > 80:
            raise SystemExit(f"line over 80: {line.get('id')}")

# Whole-work count from current branch, after A; B/C are disjoint and will increase final density.
chapter_data = [json.loads(p.read_text(encoding="utf-8")) if p.name != "03.json" else data for p in sorted(root.glob("*.json"))]
han = sum(len(HAN.findall(line.get("text", ""))) for ch in chapter_data for s in ch.get("scenes", []) for line in s.get("lines", []))
if han < 80500:
    raise SystemExit(f"R4 D density floor failed: {han}")

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"R4 D patched {changed} repeated lines; whole-work Han={han}")
print("remaining duplicate counts >=3:")
counts = Counter(line.get("text", "") for s in data.get("scenes", []) for line in s.get("lines", []) if line.get("text"))
for text, n in counts.most_common():
    if n < 3:
        break
    print(n, text)
