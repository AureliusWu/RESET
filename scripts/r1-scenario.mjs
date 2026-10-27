import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function hashIndex(text){let h=2166136261;for(const ch of text){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}

function splitVn(text, limit=72){
  const parts=text.split(/(?<=[。！？；])/u).filter(Boolean); const out=[]; let cur='';
  const pushPart=part=>{if(cur.length+part.length<=limit){cur+=part;return;}if(cur)out.push(cur);if(part.length<=limit){cur=part;return;}const subs=part.split(/(?<=[，、：])/u).filter(Boolean);cur='';for(const sub of subs){if(cur.length+sub.length<=limit)cur+=sub;else{if(cur)out.push(cur);cur=sub;}}};
  for(const part of parts)pushPart(part); if(cur)out.push(cur); return out.filter(Boolean);
}

function locationDetail(data, location=''){for(const [key,value] of Object.entries(data.location_details))if(location.includes(key))return value;return '梧城的天气、交通和人群仍按自己的节奏前进。路边小店在换班，骑车的人按铃借道，没有谁知道陈渡正在把这些琐碎当成确认现实的坐标。';}
function routeNote(data,id=''){for(const [key,value] of Object.entries(data.route_notes))if(id.includes(key))return value;return '六个人的意见并不总是一致。有人想继续查，有人更关心先把普通人撤出去，有人坚持证据不足就不能下结论。陈渡开始接受“团队”并不意味着所有人听他的。';}

function castFor(scene){const id=scene.id,loc=scene.location??'';
  if(['home_bad','chapter3_gate','chapter5_gate','c7_morning'].includes(id))return [['陈岚','饭我给你留着。你最近老说没事，脸色可不像没事。'],['陈渡','我知道。今晚如果我没回消息，你别一直等。']];
  if(loc.includes('档案')||id.includes('archive')||id.includes('letter')||id.includes('tinglan'))return [['许蓉','要查可以，先登记。旧资料不是线索箱，翻坏一页就少一页。'],['沈砚秋','记录有来源、有缺口，也有人当年为什么要这样写。别把缺失直接当成阴谋。']];
  if(loc.includes('食堂')||id.includes('cafeteria'))return [['罗秀梅','陈渡，今天还是不要香菜？你同学都换了三拨了，就你这个记得最牢。'],['陈渡','……对，不要香菜。谢谢罗姨。']];
  if(loc.includes('江滩')||id.includes('tangli')||id.includes('riverside'))return [['何川','唐梨，今天别冲配速。路面湿，江边施工段还没撤。'],['唐梨','知道。我今天不是来刷纪录的。']];
  if(loc.includes('站')||id.includes('station')||id.includes('north'))return [['梁成','同学，封闭区不能进。真有东西落里面，登记后我们帮你找。'],['陈渡','如果我说我要找的不是东西呢？']];
  if(id.includes('xiaoman'))return [['苏遥','小满，你答应我的社团海报还差最后一层色。别又陪人乱跑到忘了截稿。'],['周小满','知道啦。等我把这件更离谱的事处理完。']];
  if(id.includes('xuqi'))return [['梁成','南湖站的交接本上还有你们那天留下的记录。我不懂你们说的夜梧城，但现实这边有人会记。'],['许栖','那就别让那页被撕掉。现实里有人记得，比我在里面多走一条路重要。']];
  if(id.includes('nanxing')||id.includes('message')||id.includes('future'))return [['纪尧','我把设备时间、服务器时间和照片元数据拆开核过了。三个都能错，但不该用同一种方式错。'],['乔南星','所以先别说闹鬼。先承认我们的钟不可靠。']];
  if(id.includes('linwan'))return [['林澄','晚晚，你小时候一到下雨就做同一个梦。醒来又说记不清，我一直当你怕雷。'],['林晚','我现在也希望只是怕雷。']];
  if(loc.includes('学校')||loc.includes('教学楼')||loc.includes('教室')||id.includes('homeroom')||id.includes('meeting')||id.includes('route_focus'))return [['徐嘉树','你这几天神出鬼没得跟欠了全班作业似的。真出事就说，别每次都用“没事”打发人。'],['程妍','还有，顾老师让我提醒你：请假、迟到、作业，至少选一样按正常流程来。']];
  return [['徐嘉树','我不懂你们在查什么，但你要是突然失联，至少给我留一句能看懂的话。'],['陈渡','行。这次我尽量不让别人替我猜。']];
}

function socialLine(name,title,location){const map={
  '徐嘉树':`徐嘉树在班群里追问陈渡“${title}”之后还回不回来打球。他不知道真相，只知道朋友最近总在关键时候消失。`,
  '程妍':`程妍把“${title}”发生的时段和班级考勤对了一遍。她只关心谁缺席、谁需要补手续，却因此提供了一份异常很难伪造的集体记录。`,
  '顾明远':`顾明远后来问起${location}的事，第一反应仍是安全问题。他没有相信怪谈，却认真记下学生的异常反应，并要求所有人先保证能回家。`,
  '陈岚':`陈岚的未读消息还停在手机上：下班时间可能推迟，冰箱里有饭。对陈渡来说，这种与“${title}”毫无关系的安排反而最像现实。`,
  '许蓉':`许蓉提醒他们，关于“${title}”的任何纸质证据都要写清来源。她不参与猜谜，却坚持不能因为着急就破坏以后唯一能复核的东西。`,
  '罗秀梅':`罗秀梅记不住什么18:42理论，却记得陈渡这周哪天没来食堂。她的记忆琐碎到近乎无用，也因此不容易被主角团自己的推理带偏。`,
  '苏遥':`苏遥给周小满发来一张没画完的海报，问她什么时候回来收尾。小满盯着“${title}”的线索时，也仍然欠朋友一个明确的答复。`,
  '何川':`何川把跑步群的轨迹截图留了下来。哪怕“${title}”与训练无关，连续几天的定位记录也让梧城哪些路真实存在有了第三方参照。`,
  '纪尧':`纪尧习惯在“${title}”相关文件旁边写校验时间和设备来源。他反复强调：数字证据不是神谕，只是另一种会坏、但能被比较的记录。`,
  '林澄':`林澄没有参与调查，却会在林晚回家太晚时打电话。她关心的不是“${title}”有什么意义，只关心表妹是不是又一个人把害怕藏起来。`,
  '沈砚秋':`沈砚秋对“${title}”只给出一个原则：能证明到哪一步就说到哪一步。空白可以保留，不能为了让故事好看就擅自补成事实。`,
  '梁成':`梁成在站务交接本上留下当天的异常记录。对他来说“${title}”不是什么命运节点，只是一次必须有人签字负责的运营事件。`
};return map[name];}

function extrasFor(scene,data){const id=scene.id,chapter=scene.chapter??1,title=scene.title??'',location=scene.location??'未知',time=scene.time??'';const focus=data.focus[id]??`围绕“${title}”补足人物关系、现实流程与场景后果，不改变原有关键事实。`;const idx=hashIndex(id);const opener=data.openers[idx%data.openers.length];const closer=data.closers[Math.floor(idx/7)%data.closers.length];const support=castFor(scene);const base=[
  ['旁白',`${time}，${location}。${locationDetail(data,location)}`],['旁白',opener],support[0],support[1],['旁白',`这段时间里真正需要处理的是：${focus} 陈渡不再允许自己只记住“有用线索”。谁在场、谁被吓到、谁因此错过原本的安排，都属于同一件事的后果。`],['旁白',data.chapter_frames[String(chapter)]],['旁白',routeNote(data,id)],['陈渡','我先把能确认的写下来。记不住也没关系，至少别再假装只有我一个人的记忆算数。'],['旁白',`他在备忘录最上方写了“${title}”。下面没有先写结论，而是列了三个栏目：现实里发生了什么、谁能证明、异常改变了什么。这个习惯很慢，却让调查第一次不像追逐谜语。`]
];
  if(chapter<=2)base.push(['旁白','班群里仍不断弹出和异常无关的消息：明天要交的练习、体育课是否改室内、谁把充电器落在讲台。陈渡没有屏蔽它们。他需要这些琐事提醒自己，世界并不围着18:42旋转。'],['旁白','有同学从旁边经过时朝他们看了一眼，很快又去讨论自己的事。秘密在校园里并不会自动获得舞台，大多数时候，它只能藏在一群普通人的声音下面。']);
  else if(chapter===3)base.push(['旁白','他们开始给证据标来源，而不是只记结论。梦境标“主观残响”，旧纸标“实体证据”，手机记录标“数字记录”，第三方记忆则单独写名字和时间。'],['旁白','这种笨拙的调查方法也让关系变得难堪：有些话一旦记进表格，就像在质疑朋友；有些话不记，又可能在下一轮彻底消失。']);
  else if(chapter===4)base.push(['旁白','单独行动让陈渡第一次看见路线对象在团队之外的生活。她会被朋友催、会有家里电话、会对无关紧要的事认真；这些都不为陈渡服务。'],['旁白','他也因此更清楚一件事：所谓“好感度”如果不能对应真实相处，就只是系统数字。现在每一次靠近，都必须付出时间、解释和被拒绝的可能。']);
  else if(chapter===5)base.push(['旁白','越接近18:42，普通人的存在越重要。每一条被封的路都有人要绕行，每一次广播异常都有工作人员负责，每一个失联电话背后都有人在等。'],['旁白','陈渡以前会把这些看成“世界背景”。现在他知道，所谓拯救梧城如果只剩主角团活下来，那根本不能算成功。']);
  else if(chapter===6)base.push(['旁白','存档层不断诱导他把复杂问题压成两个按钮：保存或不保存、留下或离开。陈渡开始逐条念出那些按钮没有写进去的名字和后果。'],['旁白','越是像界面的地方，他越要提醒自己这里连接着真实的人。一次选择不该因为画面简洁，就显得比现实更轻。']);
  else base.push(['旁白','进入明天以后，他们第一次可以讨论与生存无关的安排：补课、社团、早餐、谁请客、周末去哪。没有一件事伟大，却都是过去几天最奢侈的东西。'],['旁白','陈渡没有急着给经历写总结。能让别人继续过自己的日子，比得到一句完整的世界观解释更接近真正的结局。']);
  const names=Object.keys(data.cast);const a=names[idx%names.length];let b=names[(Math.floor(idx/13)+5)%names.length];if(b===a)b=names[(names.indexOf(a)+1)%names.length];base.push(['旁白',socialLine(a,title,location)],['旁白',socialLine(b,title,location)],['旁白',`这些关系把陈渡重新拽回人群。${a}和${b}都没有被写进“六位女主”的路线选择里，却会因为他的决定改变自己的时间表、情绪和判断。世界因此不再只有攻略对象与谜题。`],['陈渡',`把${a}和${b}也记进去。不是因为他们掌握答案，是因为如果我们的选择伤到普通人的生活，那也必须算在结果里。`],['旁白',closer],['旁白',`在离开“${title}”这一刻之前，陈渡又回头确认了一次周围。不是为了寻找隐藏线索，只是为了记住：这一轮里，${location}确实有人生活过。`]);return base;
}

function expandPairs(scene,pairs,prefix){const lines=[];pairs.forEach(([speaker,text],i)=>splitVn(text).forEach((part,j)=>lines.push({id:`r1_${scene.id}_${prefix}${String(i+1).padStart(2,'0')}_${String(j+1).padStart(2,'0')}`,speaker,text:part})));return lines;}

export async function loadScenarioR1(root){return JSON.parse(await readFile(resolve(root,'game/scenario-r1.json'),'utf8'));}
export function applyScenarioR1(project,data){const scenes=project.scenes.map(scene=>{const extras=extrasFor(scene,data);const pre=expandPairs(scene,extras.slice(0,7),'pre');const post=expandPairs(scene,extras.slice(7),'post');const keyPairs=data.extra_key?.[scene.id]??[];const key=expandPairs(scene,keyPairs,'key');const original=structuredClone(scene.lines??[]);const lines=[...pre,...original,...post];if(key.length)lines.splice(Math.min(5,lines.length),0,...key);return {...structuredClone(scene),lines};});return {...project,scenes};}
