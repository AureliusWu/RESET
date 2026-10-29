#!/usr/bin/env python3
"""Frame native imagegen files; never draw characters or synthesize artwork."""
import argparse, hashlib, json, shutil
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageOps, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
p = argparse.ArgumentParser()
p.add_argument('id');p.add_argument('source',type=Path)
p.add_argument('--category',choices=['characters','anomalies','backgrounds','cg','ui'],default='characters')
p.add_argument('--name',default='')
a = p.parse_args();source_dir=ROOT/'game/art-sources/chatgpt'/a.category/a.id
source_dir.mkdir(parents=True,exist_ok=True)
portrait=a.category in ['characters','anomalies']
original=source_dir/('neutral.png' if a.category=='characters' else 'original.png')
if a.category=='characters':
 master=ROOT/f'game/assets/4k/characters/{a.id}/neutral.png';runtime=ROOT/f'game/assets/4k/runtime/characters/{a.id}/neutral.webp'
elif a.category=='anomalies':
 master=ROOT/f'game/assets/4k/anomalies/{a.id}.png';runtime=ROOT/f'game/assets/4k/runtime/anomalies/{a.id}.webp'
else:
 master=ROOT/f'game/assets/4k/{a.category}/{a.id}.png';runtime=ROOT/f'game/assets/4k/runtime/{a.category}/{a.id}.webp'
with Image.open(a.source) as im:
 im.load();source_size=list(im.size);rgba=im.convert('RGBA')
shutil.copyfile(a.source,original)
if portrait:
 mask=rgba.getchannel('A').point(lambda v:255 if v>=8 else 0)
 bbox=mask.getbbox();assert bbox,'native output has no visible subject'
 assert rgba.getchannel('A').getextrema()==(0,255),'portrait requires actual alpha'
 crop=rgba.crop(bbox);scale=min(1944/crop.width,3600/crop.height)
 size=(round(crop.width*scale),round(crop.height*scale))
 scaled=crop.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
 canvas=Image.new('RGBA',(2160,3840));offset=((2160-size[0])//2,3840-110-size[1]);canvas.alpha_composite(scaled,offset)
 runtime_size=(1080,1920)
 processing={'cropBounds':list(bbox),'framingAlphaThreshold':8,'offset':list(offset),'scaledSize':list(size),'resize':'premultiplied-alpha Lanczos'}
else:
 canvas=ImageOps.fit(rgba,(3840,2160),method=Image.Resampling.LANCZOS);runtime_size=(1920,1080)
 processing={'resize':'aspect-fill Lanczos','sourceSize':source_size}
for target in [master,runtime]:target.parent.mkdir(parents=True,exist_ok=True)
canvas.save(master,optimize=True)
canvas.convert('RGBa').resize(runtime_size,Image.Resampling.LANCZOS).convert('RGBA').save(runtime,'WEBP',quality=92,method=6,exact=True)
rel=lambda p:p.relative_to(ROOT).as_posix()
asset={'expression':'neutral' if portrait else a.id,'original':rel(original),'originalSize':source_size,'originalSHA256':sha(original),'master':rel(master),'masterSize':list(canvas.size),'masterSHA256':sha(master),'runtime':rel(runtime),'runtimeSize':list(runtime_size),'runtimeSHA256':sha(runtime)}
if portrait:asset['lockedBodySHA256']=hashlib.sha256(rgba.tobytes()).hexdigest()
prompt=source_dir/('prompt-neutral.txt' if a.category=='characters' else 'prompt.txt');spec=source_dir/'spec.json'
assert prompt.is_file() and spec.is_file(),'record prompt and canonical spec before generation'
provenance={'schema':1,'character':a.id if a.category=='characters' else None,'name':a.name or a.id,'category':a.category,'id':a.id,'sourceType':'chatgpt-native-imagegen','generator':'ChatGPT native image_gen.imagegen','workflow':'native-file-to-processed-master-and-WebP','native4kClaim':False,'generationDate':datetime.now(timezone.utc).date().isoformat(),'generationTimePrecision':'day','toolOutputFilename':a.source.name,'toolModel':None,'toolRequestId':None,'evidenceNote':'Actual native image_gen output retained unchanged. No API, Runway, vector raster or procedural illustration. Processed master is resized and framed, not claimed native 4K.','prompt':rel(prompt),'promptSHA256':sha(prompt),'spec':rel(spec),'specSHA256':sha(spec),'processing':{'script':'scripts/prepare-r8-native-art.py','pillow':pillow_version,**processing},'assets':[asset]}
(source_dir/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
if a.category=='characters':
 ap=ROOT/'game/assets/4k/visual-acceptance.json';acceptance=json.loads(ap.read_text())
 item=next(x for x in acceptance['supportingCharacters'] if x['id']==a.id)
 item.update({'status':'UNVERIFIED','reason':'Native candidate generated; owner visual review pending.','review':None,'artifacts':{k:{'path':asset[k],'sha256':asset[k+'SHA256']} for k in ['original','master','runtime']}})
 ap.write_text(json.dumps(acceptance,ensure_ascii=False,indent=2)+'\n')
staging=ROOT.parent/'r8-upload';staging.mkdir(exist_ok=True)
for label,target in [('original',original),('master',master),('runtime',runtime)]:shutil.copyfile(target,staging/(a.id+'.'+label+target.suffix))
print(json.dumps({'id':a.id,'category':a.category,'originalSize':source_size,'assets':asset,'staging':str(staging)},ensure_ascii=False))
