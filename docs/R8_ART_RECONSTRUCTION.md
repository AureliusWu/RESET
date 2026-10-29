# R8 — Art Reconstruction & Sprite Completion

状态：原生资源与授权 AI 模拟人工美术审阅完成；最终包回归以当前 PR Checks 为准。

## 目标

对《回留 / RESET》全部 production 美术重新审计，彻底移除或替换低质量、程序化、占位、fallback、SVG 冒充角色原画等视觉资产。角色立绘执行统一规则：**有正式原画才显示；没有合格原画就隐藏。**

R8 首批重建对象为 R5 遗留的 12 名常驻配角：

徐嘉树、程妍、顾明远、陈岚、许蓉、罗秀梅、苏遥、何川、纪尧、林澄、沈砚秋、梁成。

## 生成方式

- 只使用 ChatGPT 原生图像生成能力绘制正式角色原画。
- 禁止 Runway。
- 禁止 `scripts/generate-r5-supporting-cast.py` 一类程序化人物绘制进入 production。
- 禁止 SVG / procedural raster / placeholder / fallback 冒充角色原画。
- 配角允许减少表情和姿势数量，但基础原画质量标准不降级。

## 文件传输规则

R8 禁止把图片作为 Base64 字符串在 Agent / GitHub 工具调用之间搬运。

图像流水线统一采用真实二进制文件：

1. ChatGPT image generation output
2. 原始 PNG 文件
3. transparent master PNG
4. runtime WebP
5. SHA256 + provenance JSON
6. Git / GitHub binary asset commit

工具之间只交换文件引用、路径、角色 ID、尺寸、SHA256 和 provenance 元数据；不得把 `data:image/...;base64,...` 写入 JSON、Markdown、日志或源码。

## 角色原画标准

- Galgame 正式人物立绘。
- 与六位女主当前 production art direction 保持同一视觉世界。
- 透明背景。
- 竖幅全身或接近全身构图，脚部/下摆不得被意外裁切。
- 五官、头发、手部、服装必须达到正式原画可用水平。
- 每名角色保持独立 silhouette、年龄感、身份与职业/社团信息。
- 不复用其他角色身体或仅换色。
- 不把低分辨率放大结果声明为 native 4K。

## 首批 12 人角色规格

| ID | 角色 | 年龄 | 身份 / 视觉锚点 |
| --- | --- | ---: | --- |
| xujiashu | 徐嘉树 | 17 | 陈渡同桌、篮球队替补；普通男高中生、运动感 |
| chengyan | 程妍 | 17 | 班长；整洁校服、表格/文件夹、秩序感 |
| gumingyuan | 顾明远 | 35 | 班主任兼物理老师；眼镜、教师装束、理性克制 |
| chenlan | 陈岚 | 42 | 陈渡母亲、社区医院夜班护士；成熟、疲惫但可靠 |
| xurong | 许蓉 | 29 | 校图书馆管理员；眼镜、书册、安静克制 |
| luoxiumei | 罗秀梅 | 48 | 食堂窗口阿姨；围裙、生活化、中年女性 |
| suyao | 苏遥 | 17 | 美术社学生；画具/速写本、细致安静 |
| hechuan | 何川 | 18 | 田径社学长；运动装、秒表/哨子、夜跑组织者 |
| jiyao | 纪尧 | 17 | 信息技术兴趣小组；眼镜、学生证/设备、技术感但非黑客造型 |
| lincheng | 林澄 | 19 | 林晚表姐、大学一年级；大学生日常穿搭、成熟一点但仍年轻 |
| shenyanqiu | 沈砚秋 | 39 | 市档案馆纸质文献修复员；眼镜、文件夹、专业文献工作者 |
| liangcheng | 梁成 | 33 | 南湖站值班站务员；正式地铁站务制服/工牌、普通可靠的成年人 |

## R8 美术审计

扫描范围：

- `game/assets/manifest.json`
- `game/assets/4k/asset-plan.json`
- `game/assets/4k/runtime/`
- `game/assets/4k/masters/`
- `game/art-sources/`
- 所有 `provenance.json`
- speaker → portrait mapping
- 82 Scene 的 background / CG / story prop 引用

发现以下任一情况即不得作为 production character portrait：

- `supporting-cast-stylized-bust`
- `chatgpt-authored-procedural-raster-illustration`
- procedural / generated placeholder
- SVG character portrait
- fallback portrait
- 不同角色共享同一人物身体
- 明显低细节简笔画与正式角色混用
- provenance 无法说明真实图像来源

## 接入顺序

每个角色单独闭环：

`生成原画 → 人工或明确授权的 AI 模拟人工视觉检查 → 文件化 → 透明背景/裁切 → master/runtime → SHA256/provenance → manifest → speaker mapping → Build → browser visual QA`

任何角色未通过视觉检查时，继续保持 hidden，不允许为了覆盖率接回低质量资产。

## R8 最终门禁

- 12 / 12 常驻配角拥有合格正式原画。
- production character portraits 中 procedural / SVG / placeholder / fallback = 0。
- 所有正式立绘 provenance 可追溯。
- 所有 portrait runtime 引用存在且可加载。
- 82 Scene visual audit PASS。
- 无角色贴图遮挡、异常裁切、比例跳变或逐句抖动。
- Build PASS。
- final Web ZIP browser acceptance PASS。
- Android mobile visual QA PASS。
- PWA offline reload PASS。
- 发布新版 Web/PWA 并完成真实公网验收。

## 发布边界

R8 完成前不覆盖当前公开稳定版。只有全部美术与平台门禁通过后，才创建下一正式 Web/PWA 版本并部署 Pages。

## 2026-10-29 验收授权更新

用户明确要求“验收由你来模拟人类执行”。本轮允许记录 `ai-simulated-human`，保留逐项观察及准确的原图/master/runtime、报告 SHA256；不能将机器截图自动升级为视觉批准。Android/实体 Windows 的物理设备字段仍为 NOT_RUN，模拟验收不冒充实机。完整结论、发现的 CG 重复立绘问题与修复见 [R8_AI_REVIEW.md](R8_AI_REVIEW.md)。
