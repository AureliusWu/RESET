#!/usr/bin/env python3
"""Emit UTF-8 metadata and file paths only; never serialize image bytes."""
import json,sys
from pathlib import Path
items=[x.split(':',1) for x in sys.argv[1:]]
a=json.loads(Path('game/assets/4k/visual-acceptance.json').read_text());entries=[];assets=[];records=[];retire=[]
for category,id in items:
 d=Path('game/art-sources/chatgpt')/category/id
 for name in ['provenance.json','spec.json','prompt-neutral.txt' if category=='characters' else 'prompt.txt']:
  p=d/name;entries.append({'path':str(p),'mode':'100644','type':'blob','content':p.read_text()})
 asset=json.loads((d/'provenance.json').read_text())['assets'][0]
 assets.append({'id':id,'category':category,'files':{k:asset[k] for k in ['original','master','runtime']}})
 if category=='characters':records.append(next(x for x in a['supportingCharacters'] if x['id']==id))
 if (d/'source.svg').exists():retire.append(str(d/'source.svg'))
print(json.dumps({'entries':entries,'assets':assets,'records':records,'retire':retire,'plan':json.loads(Path('game/visual/r8-native-art-production.json').read_text())},ensure_ascii=False))
