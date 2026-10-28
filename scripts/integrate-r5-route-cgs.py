from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "game"
PLAN = json.loads((GAME / "visual/r5-key-cg-plan.json").read_text(encoding="utf-8"))
ITEMS = PLAN["requiredEndingCgs"]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def require(condition: bool, message: str):
    if not condition:
        raise RuntimeError(message)


# Canonical production manifest.
manifest_path = GAME / "assets/manifest.json"
manifest = read_json(manifest_path)
production = manifest["production"]
by_id = {asset["id"]: asset for asset in production}
for item in ITEMS:
    asset_id = item["asset"]
    record = {
        "id": asset_id,
        "kind": "cg",
        "src": f"assets/4k/runtime/cg/{asset_id}.webp",
        "alt": item["title"],
    }
    if asset_id in by_id:
        require(by_id[asset_id] == record, f"manifest drift for {asset_id}")
    else:
        production.append(record)
write_json(manifest_path, manifest)

# Frozen 4K migration plan.
art_plan_path = GAME / "assets/4k/asset-plan.json"
art_plan = read_json(art_plan_path)
for item in ITEMS:
    if item["asset"] not in art_plan["cgs"]:
        art_plan["cgs"].append(item["asset"])
write_json(art_plan_path, art_plan)

# Canonical story trigger: each Normal End owns exactly one route CG.
chapter_path = GAME / "content/chapters/04.json"
chapter = read_json(chapter_path)
for item in ITEMS:
    matches = [scene for scene in chapter["scenes"] if scene.get("ending") == item["ending"]]
    require(len(matches) == 1, f"expected one scene for {item['ending']}, got {len(matches)}")
    matches[0]["cg"] = item["asset"]
write_json(chapter_path, chapter)

# Gallery + MetaState source of truth. meta.mjs already unlocks frame.stage.cg only when it is listed in CGS.
archive_path = GAME / "runtime/archive-data.mjs"
archive = archive_path.read_text(encoding="utf-8")
if ITEMS[0]["asset"] not in archive:
    anchor = "  ['true-end-riverside-cg','明天见']\n"
    require(anchor in archive, "CGS insertion anchor missing")
    additions = [
        "  ['route-linwan-end-cg','林晚 · 这一轮也算数']",
        "  ['route-xiaoman-end-cg','周小满 · 今天别重来']",
        "  ['route-xuqi-end-cg','许栖 · 留在被放弃的世界']",
        "  ['route-tinglan-end-cg','沈听澜 · 未归档的人']",
        "  ['route-tangli-end-cg','唐梨 · 向前跑']",
        "  ['route-nanxing-end-cg','乔南星 · 已读不回']",
    ]
    archive = archive.replace(anchor, "  ['true-end-riverside-cg','明天见'],\n" + ",\n".join(additions) + "\n")
archive_path.write_text(archive, encoding="utf-8")

# Regression expectations.
test_path = ROOT / "tests/archive.test.mjs"
test_text = test_path.read_text(encoding="utf-8")
test_text = test_text.replace("assert.equal(new Set(CGS.map(c=>c.id)).size,5);", "assert.equal(new Set(CGS.map(c=>c.id)).size,11);")
test_path.write_text(test_text, encoding="utf-8")

release_check_path = ROOT / "scripts/check-release.mjs"
release_check = release_check_path.read_text(encoding="utf-8")
old = "const productionCgs = ['faceless-reflection-cg','letter-1842-cg','six-chairs-cg','linwan-1842-cg','true-end-riverside-cg'];"
new_ids = [
    "faceless-reflection-cg",
    "letter-1842-cg",
    "six-chairs-cg",
    "linwan-1842-cg",
    "true-end-riverside-cg",
    *[item["asset"] for item in ITEMS],
]
new = "const productionCgs = [" + ",".join(repr(value) for value in new_ids) + "];"
require(old in release_check or new in release_check, "check-release productionCgs anchor missing")
release_check = release_check.replace(old, new)
release_check_path.write_text(release_check, encoding="utf-8")

# Wire the dedicated R5 key-CG gate into package-level build/release paths.
package_path = ROOT / "package.json"
package = read_json(package_path)
scripts = package["scripts"]
scripts["visual:r5:cgs"] = "node scripts/check-r5-key-cg-coverage.mjs"
scripts["visual:r5:final"] = "node scripts/check-r5-visual-coverage.mjs --final && npm run visual:r5:backgrounds && npm run visual:r5:cgs"
for key in ["build", "check:release", "check:stable"]:
    if "npm run visual:r5:cgs" not in scripts[key]:
        scripts[key] += " && npm run visual:r5:cgs"
write_json(package_path, package)

print(json.dumps({
    "status": "r5-route-cgs-integrated",
    "routeCgs": len(ITEMS),
    "staticProduction": len(production),
    "expectedRuntimeAssets": len(production) + 21,
}, ensure_ascii=False, indent=2))
