import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "game" / "content" / "chapters" / "04.json"
data = json.loads(path.read_text(encoding="utf-8"))
scenes = {s["id"]: s for s in data.get("scenes", [])}
changed = 0

def set_id(scene_id, line_id, text):
    global changed
    scene = scenes.get(scene_id)
    if not scene:
        raise SystemExit(f"missing scene {scene_id}")
    for line in scene.get("lines", []):
        if line.get("id") == line_id:
            line["text"] = text
            changed += 1
            return
    raise SystemExit(f"missing line {line_id} in {scene_id}")

def set_suffix(scene_id, suffix, text, required=False):
    global changed
    scene = scenes.get(scene_id)
    if not scene:
        if required:
            raise SystemExit(f"missing scene {scene_id}")
        return False
    wanted = f"r1_{scene_id}_{suffix}"
    for line in scene.get("lines", []):
        if line.get("id") == wanted:
            line["text"] = text
            changed += 1
            return True
    if required:
        raise SystemExit(f"missing line {wanted}")
    return False

# Route choice framing: remove the remaining checklist/relationship-summary cadence.
set_id("route_focus_choice", "r1_route_focus_choice_pre05_02", "陈渡把六个人的名字抄在同一页上，又一个个划开。今天跟谁走，意味着有五条线只能暂时停在原地。")
set_id("route_focus_choice", "r1_route_focus_choice_pre06_01", "过去几天他们总围着同一张桌子说话。真正单独走出去以后，朋友、家人、社团和那些不愿解释的沉默才重新回到每个人身上。")
set_id("route_focus_choice", "r1_route_focus_choice_pre07_01", "沈听澜要证据，周小满相信感觉，乔南星盯着时间戳。没人能替别人决定哪一种记忆更可信。")
set_id("route_focus_choice", "r1_route_focus_choice_post01_01", "今天只跟一个人走。剩下的线索我会回来补，不拿谁的时间当可以无限读取的东西。")
set_id("route_focus_choice", "r1_route_focus_choice_post02_01", "他在页顶写下六个名字，没有排序，也没有给谁标上“更重要”。")
set_id("route_focus_choice", "r1_route_focus_choice_post02_02", "四天已经短到不能再假装每一种选择都来得及。")
set_id("route_focus_choice", "r1_route_focus_choice_post03_01", "离开美术教室以后，关系重新有了具体重量：一通家里的电话、一张没交的海报、一句不想回答的问题，都比会议桌上的结论更难绕开。")
set_id("route_focus_choice", "r1_route_focus_choice_post04_01", "靠近一个人要花掉真实的时间。那部分时间不会因为读取而自动退回来。")

route_names = {
    "linwan": "林晚",
    "xiaoman": "周小满",
    "xuqi": "许栖",
    "tinglan": "沈听澜",
    "tangli": "唐梨",
    "nanxing": "乔南星",
}
route_focus = {
    "linwan": "她在意的从来不是哪一轮更正确，而是陈渡有没有把眼前这个她也算进去。",
    "xiaoman": "周小满仍会开玩笑，可真正害怕的时候，她要的是一句今天有效的回答，不是下一轮的保证。",
    "xuqi": "许栖熟悉被丢下的世界。她最先看见的，也总是那些被别人当成可以舍弃的东西。",
    "tinglan": "沈听澜把每个结论往后压一步。她宁愿晚一点知道，也不肯让一份旧档案替活人下判词。",
    "tangli": "唐梨习惯先走再说，但这一次她把速度压下来，等每个人都跟上。",
    "nanxing": "乔南星相信日志，却不再把日志当神谕。时间戳能证明发生过什么，证明不了人该怎么选。",
}
route_closure = {
    "linwan": "林晚没有要求他忘掉别的轮次。她只要他承认，眼前这一轮同样有不能撤销的重量。",
    "xiaoman": "周小满说“今天别重来”时没有笑。陈渡也没有把这句话解释成更宏大的东西。",
    "xuqi": "夜梧城仍在远处发亮。许栖站在这里，像在等一个终于不急着把她带回“正确世界”的回答。",
    "tinglan": "沈听澜合上档案夹。纸页能留下名字，留下不了一个人全部的人生。",
    "tangli": "唐梨把路线记录停在终点。地图上没有的那一段路，他们确实一步一步走过。",
    "nanxing": "乔南星按灭屏幕。未来消息没有再跳出来，眼前这一秒第一次不需要任何时间戳替它作证。",
}
ending_closure = {
    "linwan": "江风把最后一点潮气吹散。林晚往前走，没有回头确认他会不会跟上；陈渡自己跟了上去。",
    "xiaoman": "周小满把手机塞回口袋，催他快一点。今天剩下的时间不多，但够他们把今天过完。",
    "xuqi": "夜梧城没有消失。许栖也没有。陈渡接受了这两个事实，然后在她旁边坐下。",
    "tinglan": "档案柜合上以后，房间里只剩纸张和呼吸声。沈听澜第一次没有继续追下一页。",
    "tangli": "跑步软件停在终点，路线图仍有一小段空白。唐梨笑了一下，说空着也行。",
    "nanxing": "屏幕彻底暗下去以后，乔南星抬头看他。没有新消息，也没有下一秒的提示。",
}

for key, display in route_names.items():
    peak = f"c4_{key}_2"
    # These suffixes are boilerplate-heavy in R3. Patch when present, without touching choices or IDs.
    set_suffix(peak, "pre05_02", f"陈渡没有急着把眼前发生的事归进某条理论。{route_focus[key]}")
    set_suffix(peak, "pre06_01", route_focus[key])
    set_suffix(peak, "post01_01", f"关于{display}，我只记她亲口说过的。以前的约定不能替现在的她签字。")
    set_suffix(peak, "post02_02", "这一次，留白本身也算答案的一部分。")
    set_suffix(peak, "post03_01", route_closure[key])
    set_suffix(peak, "post04_01", "陈渡没有再把关系想成可以反复校准的数值。眼前的人会犹豫，也会拒绝。")
    set_suffix(peak, "post09_01", route_closure[key])
    set_suffix(peak, "post10_01", f"离开前，陈渡只回头看了一次。{display}还在这里，这一轮也还在继续。")

    ending = f"end_{key}"
    set_suffix(ending, "pre05_02", f"真正留下来的不是一条完美结论，而是{display}在这一轮里做过的选择。")
    set_suffix(ending, "pre06_01", route_focus[key])
    set_suffix(ending, "post01_01", f"这页到这里就够了。关于{display}，不用再写一个能把一切解释完的结论。")
    set_suffix(ending, "post03_01", ending_closure[key])
    set_suffix(ending, "post04_01", "那些没有答案的小事重新占满了生活：回消息、赶路、吃饭、明天几点起。")
    set_suffix(ending, "post07_02", "谜底退远以后，旁人的生活反而重新变得清楚。")
    set_suffix(ending, "post09_01", ending_closure[key])
    set_suffix(ending, "post10_01", f"陈渡没有再检查这一刻能不能被保存。他只记得{display}当时就在身边。")

if changed < 40:
    raise SystemExit(f"R4 PR B changed too few lines: {changed}")

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"R4 PR B patched {changed} lines")
