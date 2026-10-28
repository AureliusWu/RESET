from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "game"
PLAN_PATH = GAME / "visual" / "r5-key-cg-plan.json"
CHAPTER_PATH = GAME / "content" / "chapters" / "04.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def scene_for_ending(chapter: dict, ending: str) -> dict:
    matches = [scene for scene in chapter.get("scenes", []) if scene.get("ending") == ending]
    if len(matches) != 1:
        raise RuntimeError(f"expected one scene for {ending}, got {len(matches)}")
    return matches[0]


def atmospheric_background(path: Path, route_index: int) -> Image.Image:
    bg = Image.open(path).convert("RGB").resize((1920, 1080), Image.Resampling.LANCZOS)
    # Route CGs share one restrained cinematic treatment while preserving the approved background.
    bg = ImageEnhance.Contrast(bg).enhance(1.04)
    bg = ImageEnhance.Color(bg).enhance(0.92 + (route_index % 3) * 0.03)
    veil = Image.new("RGBA", bg.size, (8, 12, 20, 28))
    bg = Image.alpha_composite(bg.convert("RGBA"), veil)
    # Add a soft-focus depth layer behind the portrait, not a replacement background.
    glow = bg.filter(ImageFilter.GaussianBlur(radius=2.2))
    bg = Image.blend(bg, glow, 0.10)
    return bg


def place_portrait(canvas: Image.Image, portrait_path: Path, position: str) -> Image.Image:
    portrait = Image.open(portrait_path).convert("RGBA")
    target_h = 1160
    scale = target_h / portrait.height
    target_w = max(1, round(portrait.width * scale))
    portrait = portrait.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Gentle shadow separates the character from the background without changing the character art.
    alpha = portrait.getchannel("A")
    shadow = Image.new("RGBA", portrait.size, (0, 0, 0, 0))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(radius=14)))
    shadow_color = Image.new("RGBA", portrait.size, (0, 0, 0, 115))
    shadow_color.putalpha(shadow.getchannel("A"))

    if position == "left":
        x = 120
    else:
        x = 1920 - target_w - 120
    y = 1080 - target_h + 95

    canvas.alpha_composite(shadow_color, (x + 18, y + 18))
    canvas.alpha_composite(portrait, (x, y))
    return canvas


def add_cinematic_vignette(canvas: Image.Image) -> Image.Image:
    # Bottom gradient keeps dialogue UI readable when the CG is shown full-screen.
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    px = overlay.load()
    height = overlay.height
    for y in range(height):
        t = max(0.0, min(1.0, (y - height * 0.58) / (height * 0.42)))
        alpha = round(135 * (t ** 1.7))
        if alpha:
            for x in range(overlay.width):
                px[x, y] = (2, 6, 12, alpha)
    return Image.alpha_composite(canvas, overlay)


def write_asset(item: dict, scene: dict, route_index: int):
    asset_id = item["asset"]
    character = item["character"]
    expression = item["expression"]
    background = scene["background"]

    bg_path = GAME / "assets" / "4k" / "backgrounds" / f"{background}.png"
    portrait_path = GAME / "assets" / "4k" / "characters" / character / f"{expression}.png"
    if not bg_path.exists():
        raise FileNotFoundError(bg_path)
    if not portrait_path.exists():
        raise FileNotFoundError(portrait_path)

    original = atmospheric_background(bg_path, route_index)
    original = place_portrait(original, portrait_path, item.get("position", "right"))
    original = add_cinematic_vignette(original)

    source_dir = GAME / "art-sources" / "chatgpt" / "cg" / asset_id
    source_dir.mkdir(parents=True, exist_ok=True)
    original_path = source_dir / "original.png"
    original.convert("RGB").save(original_path, format="PNG", optimize=True)

    master_dir = GAME / "assets" / "4k" / "cg"
    runtime_dir = GAME / "assets" / "4k" / "runtime" / "cg"
    master_dir.mkdir(parents=True, exist_ok=True)
    runtime_dir.mkdir(parents=True, exist_ok=True)
    master_path = master_dir / f"{asset_id}.png"
    runtime_path = runtime_dir / f"{asset_id}.webp"

    master = original.convert("RGB").resize((3840, 2160), Image.Resampling.LANCZOS)
    master.save(master_path, format="PNG", optimize=True)
    original.convert("RGB").save(runtime_path, format="WEBP", quality=92, method=6)

    provenance = {
        "schema": 1,
        "assetId": asset_id,
        "sourceType": "deterministic-composite-from-approved-production-art",
        "native4kClaim": False,
        "inputs": {
            "background": f"game/assets/4k/backgrounds/{background}.png",
            "portrait": f"game/assets/4k/characters/{character}/{expression}.png",
            "ending": item["ending"],
            "scene": scene["id"]
        },
        "assets": [{
            "original": f"game/art-sources/chatgpt/cg/{asset_id}/original.png",
            "originalSHA256": sha256(original_path),
            "originalSize": [1920, 1080],
            "master": f"game/assets/4k/cg/{asset_id}.png",
            "masterSHA256": sha256(master_path),
            "runtime": f"game/assets/4k/runtime/cg/{asset_id}.webp",
            "runtimeSHA256": sha256(runtime_path)
        }]
    }
    (source_dir / "provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"generated {asset_id}: {background} + {character}/{expression} -> {scene['id']}")


def main():
    plan = load_json(PLAN_PATH)
    chapter = load_json(CHAPTER_PATH)
    items = plan.get("requiredEndingCgs", [])
    if len(items) != 6:
        raise RuntimeError(f"expected six route CGs, got {len(items)}")
    for index, item in enumerate(items):
        write_asset(item, scene_for_ending(chapter, item["ending"]), index)


if __name__ == "__main__":
    main()
