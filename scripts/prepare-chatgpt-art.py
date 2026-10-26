"""Reproducible authored assets: ChatGPT original -> explicitly processed 4K master.

This does not call a paid API or invent high-resolution source detail. Original
model outputs and their prompts are retained alongside signed provenance. The
user authorized this processing workflow on 2026-10-26.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_asset(image, master, runtime, size, alpha):
    master.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    image = ImageOps.pad(image, size, method=Image.Resampling.LANCZOS,
                         color=(0, 0, 0, 0) if alpha else (25, 36, 45))
    image = image.convert('RGBA' if alpha else 'RGB')
    temporary_master = master.with_suffix('.png.tmp')
    image.save(temporary_master, format='PNG', optimize=True)
    temporary_master.replace(master)
    # Half-sized runtime; Pillow resizes RGBA through premultiplied alpha.
    temporary_runtime = runtime.with_suffix('.webp.tmp')
    image.resize((size[0] // 2, size[1] // 2), Image.Resampling.LANCZOS).save(
        temporary_runtime, 'WEBP', quality=92, method=6, exact=True)
    temporary_runtime.replace(runtime)
    return {'master': str(master.relative_to(ROOT)), 'masterSize': list(size),
            'masterSHA256': digest(master),
            'runtime': str(runtime.relative_to(ROOT)),
            'runtimeSize': [size[0] // 2, size[1] // 2],
            'runtimeSHA256': digest(runtime)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('spec', type=Path)
    args = parser.parse_args()
    spec = json.loads(args.spec.read_text())
    category, asset_id = spec['category'], spec['id']
    source_dir = ROOT / 'game/art-sources/chatgpt' / category / asset_id
    source_dir.mkdir(parents=True, exist_ok=True)
    portrait = category == 'characters'
    alpha = portrait or category == 'anomalies'
    size = (2160, 3840) if alpha else (3840, 2160)
    result = {'schema': 1, 'generator': 'ChatGPT built-in image generation',
              'workflow': 'chatgpt-original-to-processed-4k-master',
              'native4kClaim': False,
              'processing': 'Pillow Lanczos with premultiplied alpha; aspect-preserving pad',
              'authorization': '2026-10-26: ChatGPT出原图，做出4K母版',
              'category': category, 'id': asset_id, 'assets': []}
    base = None
    if portrait:
        base = Image.open(spec['sources']['neutral']).convert('RGBA')
    for expression, source in spec['sources'].items():
        original = Path(source)
        destination = source_dir / f'{expression}.png'
        shutil.copyfile(original, destination)
        im = Image.open(destination).convert('RGBA' if alpha else 'RGB')
        original_size = list(im.size)
        processing = None
        if portrait and expression != 'neutral' and spec.get('faceRegion'):
            im = im.resize(base.size, Image.Resampling.LANCZOS)
            region = tuple(round(c * base.size[i % 2]) for i, c in enumerate(spec['faceRegion']))
            mask = Image.new('L', base.size)
            ImageDraw.Draw(mask).ellipse(region, fill=255)
            mask = mask.filter(ImageFilter.GaussianBlur(max(1, base.width * .004)))
            # Keep alpha, silhouette, hair, body, clothes, props and pose exactly
            # anchored to neutral; only generated facial pixels are composited.
            edited = Image.composite(im, base, mask)
            edited.putalpha(base.getchannel('A'))
            im = edited
            processing = {'expressionFaceRegion': list(region), 'bodyLockedTo': 'neutral'}
        master = ROOT / 'game/assets/4k' / category / asset_id
        runtime = ROOT / 'game/assets/4k/runtime' / category / asset_id
        if portrait:
            master = master / f'{expression}.png'
            runtime = runtime / f'{expression}.webp'
        else:
            master = master.with_suffix('.png')
            runtime = runtime.with_suffix('.webp')
        record = write_asset(im, master, runtime, size, alpha)
        if portrait:
            body = Image.open(master).crop((0, size[1] // 4, size[0], size[1]))
            record['lockedBodySHA256'] = hashlib.sha256(body.tobytes()).hexdigest()
        record.update({'expression': expression, 'original': str(destination.relative_to(ROOT)),
                       'originalSize': original_size, 'originalSHA256': digest(destination),
                       'prompt': spec.get('prompts', {}).get(expression, ''), 'faceComposition': processing})
        result['assets'].append(record)
    temporary_record = source_dir / 'provenance.json.tmp'
    temporary_record.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary_record.replace(source_dir / 'provenance.json')
    print(json.dumps({'asset': asset_id, 'count': len(result['assets']), 'master': size, 'native4kClaim': False}))


if __name__ == '__main__':
    main()
