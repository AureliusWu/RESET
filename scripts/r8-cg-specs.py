#!/usr/bin/env python3
"""Record scene-derived CG requests; does not generate or composite artwork."""
from pathlib import Path
import json
scenes={s['id']:{'path':str(f),**s} for f in Path('game/content/chapters').glob('*.json') for s in json.loads(f.read_text()).get('scenes',[])}
base='《回留 / RESET》正式剧情CG，横幅16:9，精致二维日系视觉小说插画，干净细腻线稿、克制赛璐璐和轻柔渐变，现代中国校园都市，低饱和自然光，背景略写实但仍是二维动画，人物解剖手指准确。无文字无标题无对白框无UI无logo无水印。将旧合成CG重绘成统一透视与光照的原生叙事插画，不能把立绘简单贴到背景上。第二张人物参考为已批准人设：严格保持脸型、发色发型、眼睛、校服、配饰和年龄身份；允许改变姿态和构图。主体面部与手置于画幅中部65%以内，底部20%保持低细节供游戏对白覆盖。'
items=[
 ('route-xiaoman-end-cg','end_xiaoman','xiaoman','smile','今天别重来','10月24日18:43的学校天台，周小满在左侧中景，收起手机、另一只手抱着尚未完成的社团海报画纸（画纸仅有无文字的色块草图），对陈渡释然又俏皮地微笑，手指有一点颜料。身后是安全围栏、屋顶水箱、普通城市夕色。'),
 ('route-xuqi-end-cg','end_xuqi','xuqi','serious','留在被放弃的世界','永远18:42的夜梧城钟楼下，许栖在右侧前景，清醒坚定而带一丝孤独，手心有一把普通钥匙。蓝灰安静街道、老钟楼、商店亮着但没有行人，微弱紫蓝异常边缘，不是赛博霓虹。钟盘指针约18:42，不要求文字数字。'),
 ('route-tinglan-end-cg','end_tinglan','tinglan','serious','未归档的人','10月24日18:43的市档案馆纸本文献工作室，沈听澜在画面左侧坐在宽桌旁，把一页没有编号、没有结论的空白纸轻轻推向镜头外的陈渡，表情安静而有温度。旧卷宗、修复纸张工具、棉手套和暖台灯，深处金属档案柜，自然傍晚窗光，纸上无文字。'),
 ('route-tangli-end-cg','end_tangli','tangli','smile','向前跑','10月24日18:43的城外江堤跑道，唐梨在画面右侧跑了几步后转身伸手招呼陈渡继续向前，运动感、明亮但克制的笑，保持参考人设和运动外套，发丝与衣摆随江风轻动。远处河面、堤岸草坡和普通路灯，自然晚霞，画面强调有体积与透视的真实运动姿势。'),
 ('route-nanxing-end-cg','end_nanxing','nanxing','serious','已读不回','10月24日18:43信息楼天台，乔南星在画面左侧倚在安全围栏旁，放下手机看向没有停住的夕阳，表情冷静却放松。手机屏幕不展示任何可读文字，空白的未来。保持人设眼镜和发饰等已有细节。背景是学校信息楼设备、天线箱与普通城市天际线，自然暖冷交织，不画黑客代码。')]
for id,scene,char,expr,name,design in items:
 d=Path('game/art-sources/chatgpt/cg')/id;d.mkdir(parents=True,exist_ok=True)
 refs=[f'game/assets/4k/runtime/cg/{id}.webp',f'game/assets/4k/runtime/characters/{char}/{expr}.webp']
 (d/'prompt.txt').write_text(base+'\n'+design+'\n');s=scenes[scene]
 spec={'schema':1,'id':id,'name':name,'kind':'cg','scene':scene,'canon':{'path':s['path'],'title':s.get('title'),'location':s.get('location'),'time':s.get('time'),'dialogue':[{'id':l.get('id'),'speaker':l.get('speaker'),'text':l.get('text')} for l in s.get('lines',[]) if l.get('speaker') in ['林晚','周小满','许栖','沈听澜','唐梨','乔南星','陈渡']][:10]},'designProposal':design,'references':refs,'characterIdentityMustMatch':char,'reviewStatus':'UNVERIFIED','native4kClaim':False}
 (d/'spec.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
print('Recorded five remaining CG specifications')
