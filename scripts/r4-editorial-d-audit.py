import json
from collections import Counter, defaultdict
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "game" / "content" / "chapters" / "03.json"
data = json.loads(path.read_text(encoding="utf-8"))
print("R4 D CH3 SCENES")
for s in data.get("scenes", []):
    print(f"{s['id']} | {s.get('title')} | {s.get('location')} | {s.get('time')} | {s.get('character','-')} | lines={len(s.get('lines',[]))}")

by_text = defaultdict(list)
for s in data.get("scenes", []):
    for line in s.get("lines", []):
        t = line.get("text", "").strip()
        if t:
            by_text[t].append((s['id'], line.get('id')))
print("\nDUPLICATES >=2")
for text, refs in sorted(by_text.items(), key=lambda kv:(-len(kv[1]), kv[0])):
    if len(refs) >= 2:
        print(f"COUNT={len(refs)} TEXT={text}")
        for sid,lid in refs:
            print(f"  {sid} :: {lid}")
