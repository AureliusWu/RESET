# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是发生在架空中国城市“梧城”的现代校园视觉小说。核心围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；视觉小说仍是主体，战斗采用少量高强度、与读档叙事咬合的轻类魂方向。

## 当前状态

- 中文名：**回留**
- 当前内容版本：**v0.3.0**
- 当前阶段：三章可玩 Demo 骨架 + 首个异常体/轻类魂语义原型 + 第一阶段路线分流
- 引擎：独立仓库 `AureliusWu/VN-Engine-v2`
- 引擎基线：v0.3.0 alpha，固定提交 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 构建时组合 `game/project.json`、所有 `game/content/*.json` 与音频映射，再由 VN Engine v2 生成独立离线作品。

## 当前可玩内容

第一章建立 18:42、夜梧城、六位主要角色与“六人中有人会杀你”的主谜题。

第二章《残响》让陈渡遭遇会跨读档学习的异常体“无面行人”，第一次证明死亡并非单方面的信息优势。

第三章《没有发生过的约定》把残响从恐怖机制推进到人物关系：林晚收到未曾写过的信，周小满感到“凶手”的恐惧，许栖发现夜梧城中的第七把椅子。六人汇合后收到未来陈渡的新规则：**杀你的人不是凶手。不要阻止她，先弄明白你为什么会求她。**

章节末开放林晚 / 周小满 / 许栖三条第一阶段调查路线。

## 内容结构

```text
game/project.json               第一章与基础项目数据
game/content/chapter2.json      第二章内容包
game/content/chapter3.json      第三章与首轮路线分流
game/combat/faceless-v1.json    无面行人实时战斗目标规格
game/audio.json                 音乐/音效与演出映射
game/assets/                    背景、立绘、CG、UI 原型资产
scripts/generate-audio.mjs      可重复生成原创 WAV
scripts/build.mjs               合并内容包并调用 VN Engine v2
docs/STORY_BIBLE.md             故事圣经
docs/CHAPTER2.md                第二章
docs/CHAPTER3.md                第三章
docs/ROUTE_MATRIX.md            六路线分工
docs/COMBAT_DESIGN.md           轻类魂模块方向
docs/ART_DIRECTION.md           视觉方向
docs/ASSET_STATUS.md            资产生产状态
```

content pack 按文件名排序组合，因此章节和路线可以独立维护；每个包可新增/替换场景、状态、舞台演出和资产。

## 本地构建

需要 Node.js 22+，并将 `VN-Engine-v2` 放在本仓库同级目录：

```bash
npm run build
python -m http.server 8000 --directory dist
```

也可以设置 `VN_ENGINE_PATH=/path/to/VN-Engine-v2`。

当前 SVG 与程序音乐均进入实际构建，用于剧情、构图、交互和节奏验证；正式角色立绘仍需满足统一底模、稳定表情差分、干净线稿与克制赛璐璐上色标准。
