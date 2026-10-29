"""Deterministic framing/encoding of the retained native imagegen PNG; no drawing.

Usage: python3 scripts/prepare-xujiashu-neutral.py /path/to/native-output.png
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('native_png', type=Path)
    source = parser.parse_args().native_png.resolve()
    directory = ROOT / 'game/art-sources/chatgpt/characters/xujiashu'
    original = directory / 'neutral.png'
    if source != original.resolve():
        shutil.copyfile(source, original)
    image = Image.open(original)
    image.load()
    if image.format != 'PNG' or image.mode != 'RGBA':
        raise ValueError('Expected the real native RGBA PNG')
    alpha = image.getchannel('A')
    if alpha.getextrema()[0] != 0:
        raise ValueError('Native image has no actually transparent pixels')
    bounds = alpha.point(lambda value: 255 if value >= 8 else 0).getbbox()
    if bounds is None:
        raise ValueError('Empty artwork')
    cropped = image.crop(bounds)
    factor = min(1944 / cropped.width, 3600 / cropped.height)
    size = (round(cropped.width * factor), round(cropped.height * factor))
    scaled = cropped.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (2160, 3840), (0, 0, 0, 0))
    offset = ((2160 - size[0]) // 2, 3840 - 110 - size[1])
    canvas.paste(scaled, offset)
    master = ROOT / 'game/assets/4k/characters/xujiashu/neutral.png'
    runtime = ROOT / 'game/assets/4k/runtime/characters/xujiashu/neutral.webp'
    master.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(master, optimize=True)
    canvas.convert('RGBa').resize((1080, 1920), Image.Resampling.LANCZOS).convert('RGBA').save(runtime, 'WEBP', quality=92, method=6, exact=True)
    rel = lambda path: path.relative_to(ROOT).as_posix()
    record = {'expression': 'neutral', 'original': rel(original), 'originalSize': list(image.size),
        'originalSHA256': digest(original), 'master': rel(master), 'masterSize': [2160, 3840],
        'masterSHA256': digest(master), 'runtime': rel(runtime), 'runtimeSize': [1080, 1920],
        'runtimeSHA256': digest(runtime), 'lockedBodySHA256': hashlib.sha256(canvas.crop((0, 960, 2160, 3840)).tobytes()).hexdigest()}
    provenance = {'schema': 1, 'character': 'xujiashu', 'name': '徐嘉树',
        'sourceType': 'chatgpt-native-imagegen', 'generator': 'ChatGPT native image_gen.imagegen',
        'workflow': 'chatgpt-original-to-processed-4k-master', 'native4kClaim': False,
        'generationDate': '2026-10-28', 'generationTimePrecision': 'day',
        'toolOutputFilename': 'exec-122f0b47-0db5-49de-9dd6-dd78b58eb7f3.png',
        'toolModel': None, 'toolRequestId': None,
        'evidenceNote': 'Actual native image_gen output. Original recovered byte-for-byte after a workspace reset; original SHA256 unchanged. Model, seed and request ID were not exposed. No API, Runway, SVG or procedural character drawing.',
        'prompt': rel(directory / 'prompt-neutral.txt'), 'promptSHA256': digest(directory / 'prompt-neutral.txt'),
        'spec': rel(directory / 'spec.json'), 'specSHA256': digest(directory / 'spec.json'),
        'processing': {'script': rel(Path(__file__).resolve()), 'pillow': pillow_version,
            'cropBounds': list(bounds), 'framingAlphaThreshold': 8, 'masterCanvas': [2160, 3840],
            'scaledSize': list(size), 'offset': list(offset), 'resize': 'premultiplied-alpha Lanczos',
            'runtimeEncoder': {'format': 'WebP', 'quality': 92, 'method': 6, 'exact': True}}, 'assets': [record]}
    (directory / 'provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(record, ensure_ascii=False))

if __name__ == '__main__':
    main()
