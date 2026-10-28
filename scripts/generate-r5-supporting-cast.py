from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'game'
PLAN_PATH = GAME / 'visual/r5-supporting-cast-plan.json'
W, H = 1080, 1920


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rgb(value: str):
    value = value.lstrip('#')
    return tuple(int(value[i:i+2], 16) for i in (0, 2, 4))


def shade(color, delta):
    return tuple(max(0, min(255, c + delta)) for c in color)


def draw_portrait(cfg: dict) -> Image.Image:
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    hair, outfit, inner, accent, eye = map(rgb, [cfg['hair'], cfg['outfit'], cfg['inner'], cfg['accent'], cfg['eye']])
    skin = (236, 201, 181) if cfg.get('age', 20) < 35 else (229, 193, 173)
    outline = (56, 54, 62, 235)
    female = cfg['gender'] == 'female'
    style = cfg['hairStyle']

    # Soft cast shadow; the background remains fully transparent.
    shadow = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((220, 1430, 860, 1890), fill=(8, 15, 24, 72))
    im.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(42)))

    # Back hair establishes a distinct silhouette before body/face layers.
    if style in {'long', 'long-tie'}:
        d.rounded_rectangle((305, 250, 775, 1140), 210, fill=hair + (255,), outline=outline, width=6)
    elif style == 'ponytail':
        d.ellipse((315, 265, 760, 905), fill=hair + (255,), outline=outline, width=6)
        d.rounded_rectangle((690, 480, 875, 1110), 90, fill=shade(hair, -8) + (255,), outline=outline, width=6)
    elif style == 'bun':
        d.ellipse((322, 280, 758, 900), fill=hair + (255,), outline=outline, width=6)
        d.ellipse((445, 135, 650, 345), fill=shade(hair, -6) + (255,), outline=outline, width=6)
    elif style in {'bob', 'short-wave'}:
        d.rounded_rectangle((315, 275, 765, 930), 200, fill=hair + (255,), outline=outline, width=6)
    else:
        d.ellipse((325, 260, 755, 825), fill=hair + (255,), outline=outline, width=6)

    # Neck and torso: supporting cast shares a deliberate simplified bust system.
    d.rounded_rectangle((455, 730, 625, 1040), 55, fill=skin + (255,), outline=outline, width=6)
    d.polygon([(235, 1040), (420, 875), (660, 875), (845, 1040), (965, 1875), (115, 1875)], fill=outfit + (255,), outline=outline)
    d.polygon([(425, 890), (540, 1065), (655, 890), (705, 1875), (375, 1875)], fill=inner + (255,))
    d.polygon([(418, 885), (540, 1065), (442, 1215), (330, 985)], fill=shade(outfit, -20) + (255,))
    d.polygon([(662, 885), (540, 1065), (638, 1215), (750, 985)], fill=shade(outfit, -20) + (255,))

    # Face uses an angular jaw rather than mascot geometry.
    face = [(367, 370), (430, 315), (650, 315), (713, 370), (730, 560), (690, 730), (615, 825), (540, 855), (465, 825), (390, 730), (350, 560)]
    d.polygon(face, fill=skin + (255,), outline=outline)
    d.ellipse((330, 515, 390, 645), fill=skin + (255,), outline=outline, width=5)
    d.ellipse((690, 515, 750, 645), fill=skin + (255,), outline=outline, width=5)

    # Fringe / hairline variants.
    if style in {'short', 'short-side'}:
        fringe = [(350, 470), (365, 335), (450, 275), (620, 280), (715, 355), (720, 455), (655, 400), (620, 470), (565, 390), (505, 465), (450, 395), (405, 455)]
    elif style == 'short-wave':
        fringe = [(350, 470), (365, 340), (430, 285), (505, 330), (565, 280), (640, 330), (715, 350), (720, 465), (650, 420), (595, 475), (535, 405), (470, 475), (410, 420)]
    else:
        fringe = [(350, 470), (375, 320), (465, 260), (635, 275), (715, 360), (705, 470), (655, 405), (610, 475), (555, 395), (500, 470), (450, 395), (400, 455)]
    d.polygon(fringe, fill=hair + (255,))

    # Brows, narrow VN-style eyes, nose plane and mouth.
    brow = shade(hair, -28)
    d.line((420, 520, 495, 510), fill=brow + (255,), width=12)
    d.line((585, 510, 660, 520), fill=brow + (255,), width=12)
    for cx in (462, 618):
        d.polygon([(cx-38, 555), (cx, 545), (cx+38, 555), (cx, 578)], fill=(245, 244, 242, 255), outline=outline)
        d.ellipse((cx-9, 550, cx+9, 575), fill=eye + (255,))
        d.ellipse((cx-3, 554, cx+3, 563), fill=(235, 245, 250, 230))
    d.line((540, 580, 525, 660, 548, 665), fill=(139, 98, 92, 165), width=5)
    d.arc((480, 655, 600, 735), 15, 165, fill=(119, 70, 76, 235), width=6)

    if cfg.get('glasses'):
        d.rounded_rectangle((402, 525, 515, 602), 18, outline=(50, 59, 70, 255), width=7)
        d.rounded_rectangle((565, 525, 678, 602), 18, outline=(50, 59, 70, 255), width=7)
        d.line((515, 560, 565, 560), fill=(50, 59, 70, 255), width=7)

    # Age and fatigue details stay subtle.
    if cfg.get('age', 20) >= 35:
        d.line((405, 625, 448, 620), fill=(133, 97, 92, 75), width=3)
        d.line((632, 620, 675, 625), fill=(133, 97, 92, 75), width=3)
    if cfg['id'] == 'chenlan':
        d.arc((415, 575, 500, 635), 15, 165, fill=(105, 95, 105, 70), width=3)
        d.arc((580, 575, 665, 635), 15, 165, fill=(105, 95, 105, 70), width=3)

    # Role-identifying accessory; each silhouette is intentionally unique.
    acc = cfg['accessory']
    if acc == 'basketball':
        d.ellipse((720, 1360, 965, 1605), fill=(197, 102, 53, 255), outline=outline, width=8)
        d.arc((720, 1360, 965, 1605), 70, 250, fill=outline, width=7); d.line((842, 1360, 842, 1605), fill=outline, width=7)
    elif acc == 'clipboard':
        d.rounded_rectangle((690, 1325, 925, 1690), 24, fill=(205, 211, 214, 255), outline=outline, width=7)
        d.rounded_rectangle((755, 1295, 860, 1350), 15, fill=accent + (255,), outline=outline, width=5)
        for y in (1410, 1480, 1550): d.line((735, y, 875, y), fill=(100, 112, 122, 190), width=5)
    elif acc == 'tie':
        d.polygon([(510, 1015), (570, 1015), (590, 1335), (540, 1415), (490, 1335)], fill=accent + (255,), outline=outline)
    elif acc == 'scrubs':
        d.line((540, 1030, 540, 1510), fill=accent + (220,), width=8); d.arc((470, 1170, 610, 1320), 0, 180, fill=accent + (255,), width=8)
    elif acc == 'book':
        d.rounded_rectangle((700, 1390, 940, 1735), 20, fill=accent + (255,), outline=outline, width=8); d.line((820, 1390, 820, 1735), fill=(238, 230, 205, 255), width=8)
    elif acc == 'apron':
        d.rounded_rectangle((350, 1160, 730, 1840), 38, fill=accent + (225,), outline=outline, width=6); d.line((430, 1160, 390, 955), fill=accent + (255,), width=18); d.line((650, 1160, 690, 955), fill=accent + (255,), width=18)
    elif acc == 'art':
        d.ellipse((665, 335, 705, 375), fill=accent + (255,), outline=outline, width=4); d.ellipse((740, 1390, 775, 1425), fill=(225, 102, 128, 220)); d.ellipse((785, 1435, 820, 1470), fill=(80, 153, 204, 220))
    elif acc == 'whistle':
        d.line((465, 1030, 540, 1295, 615, 1030), fill=accent + (255,), width=10); d.ellipse((510, 1270, 575, 1335), fill=accent + (255,), outline=outline, width=5)
    elif acc == 'lanyard':
        d.line((470, 1030, 540, 1305, 610, 1030), fill=accent + (255,), width=10); d.rounded_rectangle((495, 1285, 585, 1390), 12, fill=(220, 228, 235, 245), outline=outline, width=5)
    elif acc == 'tote':
        d.line((705, 1130, 875, 1490), fill=accent + (255,), width=18); d.rounded_rectangle((740, 1450, 980, 1810), 35, fill=accent + (220,), outline=outline, width=7)
    elif acc == 'folder':
        d.rounded_rectangle((690, 1395, 945, 1730), 18, fill=accent + (245,), outline=outline, width=7); d.polygon([(720, 1395), (810, 1395), (845, 1435), (720, 1435)], fill=shade(accent, 20) + (255,))
    elif acc == 'station':
        d.line((470, 1030, 540, 1290, 610, 1030), fill=accent + (255,), width=10); d.rounded_rectangle((500, 1270, 580, 1370), 10, fill=(221, 230, 233, 245), outline=outline, width=5); d.rectangle((300, 1190, 390, 1270), fill=accent + (255,), outline=outline, width=5)

    # Clean cel highlights / shadows.
    d.polygon([(375, 610), (405, 745), (470, 820), (430, 720)], fill=(120, 78, 76, 22))
    d.arc((390, 285, 690, 620), 195, 330, fill=(255, 255, 255, 55), width=13)
    d.line((250, 1070, 125, 1845), fill=(184, 216, 232, 85), width=6)
    return im


def produce(cfg: dict):
    cid = cfg['id']
    source_dir = GAME / 'art-sources/chatgpt/characters' / cid
    master_dir = GAME / 'assets/4k/characters' / cid
    runtime_dir = GAME / 'assets/4k/runtime/characters' / cid
    source_dir.mkdir(parents=True, exist_ok=True); master_dir.mkdir(parents=True, exist_ok=True); runtime_dir.mkdir(parents=True, exist_ok=True)
    original = draw_portrait(cfg)
    original_path = source_dir / 'neutral.png'; master_path = master_dir / 'neutral.png'; runtime_path = runtime_dir / 'neutral.webp'
    original.save(original_path, 'PNG', optimize=True)
    master = original.resize((2160, 3840), Image.Resampling.LANCZOS)
    master.save(master_path, 'PNG', optimize=True)
    original.save(runtime_path, 'WEBP', lossless=True, method=6)
    body_hash = sha(original_path)
    provenance = {
        'schema': 1,
        'character': cid,
        'name': cfg['name'],
        'sourceType': 'chatgpt-authored-procedural-raster-illustration',
        'visualTier': 'supporting-cast-stylized-bust',
        'native4kClaim': False,
        'designPlan': 'game/visual/r5-supporting-cast-plan.json',
        'assets': [{
            'expression': 'neutral',
            'original': f'game/art-sources/chatgpt/characters/{cid}/neutral.png',
            'originalSHA256': sha(original_path),
            'originalSize': [1080, 1920],
            'master': f'game/assets/4k/characters/{cid}/neutral.png',
            'masterSHA256': sha(master_path),
            'runtime': f'game/assets/4k/runtime/characters/{cid}/neutral.webp',
            'runtimeSHA256': sha(runtime_path),
            'lockedBodySHA256': body_hash
        }]
    }
    write_json(source_dir / 'provenance.json', provenance)


def integrate(characters: list[dict]):
    manifest_path = GAME / 'assets/manifest.json'; manifest = read_json(manifest_path); by_id = {a['id']: a for a in manifest['production']}
    for cfg in characters:
        record = {'id': f"{cfg['id']}/neutral", 'kind': 'portrait', 'src': f"assets/4k/runtime/characters/{cfg['id']}/neutral.webp", 'alt': f"{cfg['name']}立绘"}
        if record['id'] not in by_id: manifest['production'].append(record)
    write_json(manifest_path, manifest)

    art_path = GAME / 'assets/4k/asset-plan.json'; art = read_json(art_path); known = {c['id'] for c in art['characters']}
    for index, cfg in enumerate(characters, start=20):
        if cfg['id'] not in known: art['characters'].append({'id': cfg['id'], 'name': cfg['name'], 'priority': index, 'expressions': ['neutral'], 'extras': [], 'tier': 'supporting'})
    write_json(art_path, art)

    policy_path = GAME / 'visual/r5-speaker-policy.json'; policy = read_json(policy_path)
    for cfg in characters: policy['speakers'][cfg['name']] = {'mode': 'portrait', 'character': cfg['id']}
    write_json(policy_path, policy)

    runtime_path = GAME / 'content/runtime.json'; runtime = read_json(runtime_path); speakers = runtime.setdefault('stage', {}).setdefault('speakers', {})
    for cfg in characters: speakers[cfg['name']] = cfg['id']
    write_json(runtime_path, runtime)

    package_path = ROOT / 'package.json'; package = read_json(package_path); scripts = package['scripts']
    scripts['visual:r5:support'] = 'node scripts/check-r5-supporting-cast.mjs'
    for key in ['build', 'check:release', 'check:stable']:
        if 'npm run visual:r5:support' not in scripts[key]: scripts[key] += ' && npm run visual:r5:support'
    if 'npm run visual:r5:support' not in scripts['visual:r5:final']: scripts['visual:r5:final'] += ' && npm run visual:r5:support'
    write_json(package_path, package)

    assets_path = ROOT / 'scripts/assets.mjs'; text = assets_path.read_text(encoding='utf-8')
    text = text.replace('manifest.production.length !== 64', 'manifest.production.length !== 76').replace('exactly 64 static production assets', 'exactly 76 static production assets')
    text = text.replace('counts.portrait !== 33 || counts.background !== 20 || counts.cg !== 11', 'counts.portrait !== 45 || counts.background !== 20 || counts.cg !== 11')
    assets_path.write_text(text, encoding='utf-8')

    cast_path = ROOT / 'docs/CAST_BIBLE_R1.md'; cast = cast_path.read_text(encoding='utf-8')
    cast = cast.replace('2. 允许无立绘登场。R1 先完成剧本生态，后续按出场频率决定是否进入角色美术轮次。', '2. R5 已为上述 12 名常驻配角建立正式 supporting-cast portrait；普通功能 NPC 仍可无立绘登场。')
    cast_path.write_text(cast, encoding='utf-8')

    release_path = ROOT / 'scripts/check-release.mjs'; release = release_path.read_text(encoding='utf-8')
    anchor = "const xuqiAngry = assetMap.get('xuqi/angry');"
    support_block = "const supportPortraits = " + json.dumps([cfg['id'] for cfg in characters], ensure_ascii=False) + ";\nfor (const character of supportPortraits) { const asset=assetMap.get(`${character}/neutral`); assert(asset?.kind==='portrait',`missing supporting portrait ${character}`); assert(asset.src===`assets/4k/runtime/characters/${character}/neutral.webp`,`supporting portrait path drift: ${character}`); assert(await exists(resolve(dist,asset.src)),`supporting portrait missing from package: ${character}`); assert(sw.includes(asset.src),`supporting portrait not offline cached: ${character}`); }\n"
    if 'const supportPortraits =' not in release: release = release.replace(anchor, support_block + anchor)
    release_path.write_text(release, encoding='utf-8')


if __name__ == '__main__':
    plan = read_json(PLAN_PATH); characters = plan['characters']
    if len(characters) != 12: raise RuntimeError('R5 B requires exactly 12 supporting characters')
    for cfg in characters: produce(cfg)
    integrate(characters)
    print(json.dumps({'status':'r5-supporting-cast-generated','characters':len(characters),'staticProduction':76,'runtimeAssets':97}, ensure_ascii=False, indent=2))
