import json
from collections import Counter
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "game" / "content" / "chapters" / "03.json"
data = json.loads(path.read_text(encoding="utf-8"))

luo = "罗秀梅记不住什么18:42理论，却记得陈渡这周哪天没来食堂。她的记忆琐碎到近乎无用，也因此不容易被他们自己的推理带偏。"
art = "不是为了寻找隐藏线索，只是为了记住：这一轮里，梧城一中·旧美术教室确实有人生活过。"

luo_rep = {
    "chapter3_gate": "罗秀梅只记得陈渡这周少来过几次食堂。正因为她不懂18:42，她那点琐碎记忆反而没有被他们的理论提前整理过。",
    "route_linwan_dream": "罗秀梅记得陈渡哪天没来吃饭，却不知道旧文具店意味着什么。她保留下来的恰好是推理之外的日常。",
    "route_merge_message": "罗秀梅不会核时间戳，只记得哪天有人错过饭点。这样的记忆不精密，却能和他们的记录从另一侧互相校对。",
}
art_rep = {
    "route_method_choice": "离开前，陈渡又看了一眼那张争论过方法的桌子。旧风扇还在转，这一轮的分歧确实发生过。",
    "future_rule": "离开前，陈渡记住手机亮着的那张桌面。未来消息会不会消失还不知道，18:44已经真实过去。",
    "focus_xiaoman_open": "离开前，陈渡记住画架旁擦过眼泪的位置。周小满今天说过的话，不需要下一轮替她证明。",
}

changed = 0
for scene in data.get("scenes", []):
    sid = scene["id"]
    for line in scene.get("lines", []):
        if line.get("text") == luo and sid in luo_rep:
            line["text"] = luo_rep[sid]
            changed += 1
        elif line.get("text") == art and sid in art_rep:
            line["text"] = art_rep[sid]
            changed += 1
        if len(line.get("text", "")) > 80:
            raise SystemExit(f"line over 80: {line.get('id')} {len(line.get('text',''))}")

if changed != 6:
    raise SystemExit(f"expected 6 final duplicate edits, got {changed}")
counts = Counter(line.get("text", "") for scene in data.get("scenes", []) for line in scene.get("lines", []) if line.get("text"))
remaining = [(n,t) for t,n in counts.items() if n >= 3]
if remaining:
    raise SystemExit(f"remaining duplicates >=3: {remaining[:10]}")
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("R4 D final duplicate cleanup: 6 lines; no Chapter 3 exact duplicate remains >=3")
