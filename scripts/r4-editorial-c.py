import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "game" / "content" / "chapters"
files = {name: root / name for name in ("05.json", "06.json", "07.json")}
data = {name: json.loads(path.read_text(encoding="utf-8")) for name, path in files.items()}
changed = 0


def scenes_of(name):
    return {s["id"]: s for s in data[name].get("scenes", [])}


def set_id(name, scene_id, line_id, text, required=True):
    global changed
    scene = scenes_of(name).get(scene_id)
    if not scene:
        if required:
            raise SystemExit(f"{name}: missing scene {scene_id}")
        return False
    for line in scene.get("lines", []):
        if line.get("id") == line_id:
            line["text"] = text
            changed += 1
            return True
    if required:
        raise SystemExit(f"{name}: missing line {line_id}")
    return False


def set_suffix(name, scene_id, suffix, text, required=False):
    return set_id(name, scene_id, f"r1_{scene_id}_{suffix}", text, required)

# Chapter 5: the irreversible day begins at home, not at the mystery board.
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_pre02_01", "陈渡没有解释世界会怎样。他只把鞋带重新系紧，因为厨房里的人真正想知道的是另一件事：今晚他回不回来。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_pre05_02", "过去几次死亡里，他只记得自己在哪儿倒下。直到今天，他才开始想象母亲几点会打第一通没人接的电话。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_pre07_01", "六个人对今天仍有不同判断。可在出门前，陈渡第一次先确定了另一件事：如果失联，谁该去找家里和学校。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_post01_01", "妈，如果今晚我没回来，别等到半夜。先给顾老师打电话。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_post02_01", "备忘录第一页没有写谜底，只写了三个联系人：陈岚、顾明远、徐嘉树。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_post02_02", "这是他第一次给“失败以后”留下现实里的处理办法。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_post07_02", "所谓后果，终于有了具体的名字和电话号码。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_post09_01", "门外的楼道很安静。陈渡仍不知道18:42会发生什么，却已经知道有人会等他回家。")
set_id("05.json", "chapter5_gate", "r1_chapter5_gate_post10_01", "关门前，他回头看见餐桌上的早饭。那一眼比倒计时更像今天真正的起点。")

set_id("05.json", "c5_team_morning", "r1_c5_team_morning_pre05_02", "六个人凑齐的代价分散在别处：有人替他们请假，有人接家长电话，有人把社团的活往后挪。")
set_id("05.json", "c5_team_morning", "r1_c5_team_morning_pre07_01", "沈听澜要先核档，唐梨想先找路，乔南星坚持盯时间戳。最后没人说服谁，他们只把各自能做的部分接了下来。")

# Give Night Wucheng scenes concrete atmosphere when R3 boilerplate is still present.
for name in ("05.json", "06.json"):
    for scene in data[name].get("scenes", []):
        if scene.get("background") != "night-wucheng":
            continue
        for line in scene.get("lines", []):
            text = line.get("text", "")
            if text == "这座城市没有因为他的恐惧变得戏剧化。雨还是雨，晚自习还是晚自习，别人甚至会嫌他挡路。正因为如此，他更难把发生的一切归结成梦。":
                line["text"] = "夜梧城最让人不安的地方，是它仍保留着城市的习惯：灯会亮，广播会响，只是这些声音再也找不到该回应它们的人。"
                changed += 1
            elif text == "他开始把从前会顺手划掉的细节也记下来：谁在场，谁被吓到，谁因此错过了原本的安排。异常留下的后果，从来不只写在“线索”里。":
                line["text"] = "陈渡不再只记出口和线索。他也记谁走慢了，谁在黑暗里喊过名字，谁差一点没跟上来。"
                changed += 1
            elif text == "他们很少真正意见一致。有人想继续追下去，有人先问普通人能不能撤开，还有人宁愿把结论空着，也不肯拿猜测当证据。陈渡慢慢习惯了这一点。":
                line["text"] = "在这里，分歧反而让人安心。至少每个人还会争，还会害怕，还会坚持自己认得的那一点现实。"
                changed += 1

# Chapter 6: save room / permanent save / no-save / walking forward.
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_pre01_01", "--:--。这里没有窗，也没有远处的车声。白色界面向四周延伸，像一间把现实全部删掉之后剩下的房间。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_pre01_02", "陈渡听见自己的呼吸，过了几秒才分辨出更远处还有手机震动和脚步声。现实没有消失，只是被界面压得很轻。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_pre02_01", "这里没有可靠的钟可以核对。陈渡只能反复念出那些人的名字，确认自己还记得为什么要离开。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_pre05_02", "按钮没有写陈岚会等到几点，也没有写周小满的海报、唐梨的训练和所有人被截断的明天。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_pre07_01", "没人能替陈渡按下这个按钮。六个人能做的，只是把各自不愿被保存成标本的那一部分人生说给他听。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_post01_01", "这里最容易忘记的，就是按钮之外还有人。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_post02_01", "陈渡没有给“存档室”写结论，只在“永久存档”四个字下面画了一条很重的线。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_post02_02", "如果安全的代价是永远抵达不了明天，那份安全本身也需要被怀疑。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_post07_02", "界面越干净，被它省略掉的人就越需要被重新想起来。")
set_id("06.json", "chapter6_gate", "r1_chapter6_gate_post10_01", "陈渡最后看了一眼两个按钮。它们依然简洁得像任何一次普通选择。")

set_id("06.json", "c6_save_again", "r1_c6_save_again_pre01_01", "18:42。白光合拢以后，世界重新停在他最熟悉的分钟。")
set_id("06.json", "c6_save_again", "r1_c6_save_again_pre01_02", "旧教学楼的潮味、窗外的雨、远处的篮球声一件不少。完美得让陈渡立刻明白，他又失去了什么。")
set_id("06.json", "c6_save_again", "r1_c6_save_again_pre02_01", "他不需要看钟。身体已经先认出了这个时刻。")
set_id("06.json", "c6_save_again", "r1_c6_save_again_pre05_02", "保存成功意味着所有人都被带了回来，也意味着他们刚刚走过的那一段路再次只剩陈渡记得。")
set_id("06.json", "c6_save_again", "r1_c6_save_again_pre07_01", "没有人能在这一轮里和他争论，因为那场争论本身已经被覆盖了。")
set_id("06.json", "c6_save_again", "r1_c6_save_again_post01_01", "这不是保险。是把所有人的今天再删一次。")
set_id("06.json", "c6_save_again", "r1_c6_save_again_post02_02", "他终于知道自己真正舍不得的是什么：犯错以后还可以当作没发生。")

set_id("06.json", "c6_no_save", "r1_c6_no_save_post01_01", "不保存。把这三个字记清楚就够了。")
set_id("06.json", "c6_no_save", "r1_c6_no_save_post02_01", "这一页没有存档点。陈渡只写下时间，然后把笔收了起来。")
set_id("06.json", "c6_no_save", "r1_c6_no_save_post02_02", "接下来的每一步都只发生一次。")
set_id("06.json", "c6_no_save", "r1_c6_no_save_post07_02", "从这一刻起，后悔也只能带着往前走。")
set_id("06.json", "c6_no_save", "r1_c6_no_save_post10_01", "他没有回头确认界面还在不在。下一步已经落在18:43。")

set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_pre05_02", "有人擦破手，有人喘不上气，有人回头确认最后一个人还在。向前第一次变成了很具体的体力活。")
set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_pre06_01", "存档室的白光已经退到身后。现实重新变得粗糙：碎石会硌脚，呼吸会乱，出口也不会自己亮起来。")
set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_pre07_01", "唐梨负责找路，沈听澜盯着人数，周小满一路喊名字。没有谁再有空争哪套理论更漂亮。")
set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_post01_01", "18:43。先把这一分钟记住。")
set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_post02_01", "陈渡在“没有读取键的路”下面只写了一句：我们走过来了。")
set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_post02_02", "这句话不需要推理。")
set_id("06.json", "c6_walk_forward", "r1_c6_walk_forward_post10_01", "梧城北站在身后一点点失去形状。陈渡没有停下脚步。")

# Chapter 7: tomorrow and True End should stop sounding like another investigation report.
set_id("07.json", "c7_morning", "r1_c7_morning_pre01_01", "07:46，梧城一中。门口早餐车正收蒸笼，值日生抱着扫把往楼上跑，校门外堵着送学生的车。")
set_id("07.json", "c7_morning", "r1_c7_morning_pre01_02", "陈渡站在校门口看了很久，直到后面有人催他别挡路。他忽然笑了一下。")
set_id("07.json", "c7_morning", "r1_c7_morning_pre07_01", "没人再急着统一昨晚发生过什么。今天先有早读、请假条和三分钟的迟到。")
set_id("07.json", "c7_morning", "r1_c7_morning_post01_01", "10月25日。就写日期吧。")
set_id("07.json", "c7_morning", "r1_c7_morning_post02_01", "备忘录里只剩一个日期，没有存档点，也没有倒计时。")
set_id("07.json", "c7_morning", "r1_c7_morning_post02_02", "陈渡把手机锁屏，跟着人群进了校门。")
set_id("07.json", "c7_morning", "r1_c7_morning_post04_01", "顾老师会追请假条，陈岚会问晚饭吃什么。能重新被这些事催着走，已经足够。")
set_id("07.json", "c7_morning", "r1_c7_morning_post07_02", "昨天的谜底没有消失，只是终于不用占满今天。")
set_id("07.json", "c7_morning", "r1_c7_morning_post10_01", "上课铃响了。陈渡没有再回头检查世界是否稳定。")

set_id("07.json", "c7_linwan", "r1_c7_linwan_pre02_01", "这一次陈渡没有先看钟。17:58会过去，18:42也会过去，江风不会因为他记得多少轮人生就停下来。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_pre05_02", "林晚忘掉了大部分细节，却留下了一句没有来源的约定。陈渡没有纠正她，也没有替她补完。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_pre06_01", "他们谈的是明天几点到校、周末要不要去江边，还有晚饭。明天第一次只是一个普通日期。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post01_01", "有些事不需要再记成证据。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post02_01", "陈渡把“雨停以后”写在最后一页，没有再分栏。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post02_02", "下面只留了一行空白。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post03_01", "林晚已经在问周末的安排。那些琐碎计划没有任何世界观意义，却第一次真的属于未来。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post04_01", "江风继续吹，桥上的车继续走。陈渡也没有再替这一刻寻找一个更大的解释。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post09_01", "远处有人催同伴回消息，有人停下来系鞋带。这个傍晚没有为他们单独亮灯。")
set_id("07.json", "c7_linwan", "r1_c7_linwan_post10_01", "林晚已经往前走了几步。陈渡收起手机，跟了上去。")

set_id("07.json", "c7_credits", "r1_c7_credits_pre01_01", "后来，梧城又过了很多普通日子。早餐摊换过菜单，地铁照常晚点，班群还是会在半夜突然有人问作业。")
set_id("07.json", "c7_credits", "r1_c7_credits_pre02_01", "陈渡偶尔仍会下意识看一眼时间。看到18:42时，他已经不会停下来。")
set_id("07.json", "c7_credits", "r1_c7_credits_pre05_02", "被覆盖过的那些轮次没有重新出现。它们留在几个人偶尔对不上来源的习惯和梦里。")
set_id("07.json", "c7_credits", "r1_c7_credits_pre06_01", "明天后来变得很普通：迟到、补课、社团、晨跑、家里留的饭。普通到终于不用证明它存在。")
set_id("07.json", "c7_credits", "r1_c7_credits_pre07_01", "他们还是会意见不合，只是争的东西慢慢变成周末去哪、谁忘了交表、谁又迟到。")
set_id("07.json", "c7_credits", "c7c003", "保存能留下记录，留不住当时的那个人。")
set_id("07.json", "c7_credits", "c7c004", "时间继续向前以后，你仍要决定，要不要承认它发生过。")
set_id("07.json", "c7_credits", "r1_c7_credits_post01_01", "最后一页不用再核对了。")
set_id("07.json", "c7_credits", "r1_c7_credits_post02_01", "陈渡在页顶写下“回留”。")
set_id("07.json", "c7_credits", "r1_c7_credits_post02_02", "下面只写：10月25日之后。")
set_id("07.json", "c7_credits", "r1_c7_credits_post04_01", "世界没有给他们颁发答案。它只是继续运转，让所有人把自己的日子接回去。")
set_id("07.json", "c7_credits", "r1_c7_credits_post07_02", "后来陈渡记得最清楚的，反而是这些人的小事。")
set_id("07.json", "c7_credits", "r1_c7_credits_post08_01", "苏遥的海报、何川的跑步群、许蓉的登记表，都有自己的后续。没有谁停在他们的结局里。")
set_id("07.json", "c7_credits", "r1_c7_credits_post10_01", "梧城继续往前。陈渡也一样。")

if changed < 55:
    raise SystemExit(f"R4 PR C changed too few lines: {changed}")

for name, path in files.items():
    path.write_text(json.dumps(data[name], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"R4 PR C patched {changed} lines")
