# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是发生在架空中国城市“梧城”的现代校园视觉小说。核心围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；视觉小说仍是主体，战斗采用少量高强度、与读档叙事咬合的轻类魂方向。

## 当前状态

- 仓库：`AureliusWu/RESET`
- 中文名：**回留**
- 当前内容版本：**v0.2.0**
- 当前阶段：两章可玩纵切 + 首个异常体/轻类魂语义原型
- 引擎：独立仓库 `AureliusWu/VN-Engine-v2`
- 引擎基线：v0.3.0 alpha，固定提交 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 本作不复制引擎源码；构建时由固定引擎提交解释组合后的项目数据并生成独立离线作品。

## 当前可玩内容

第一章从 **10 月 17 日 18:42，梧城一中旧教学楼** 开始。陈渡已经历三次死亡，第四次回到同一时刻；共通线引出林晚、周小满、许栖、沈听澜、唐梨、乔南星，以及夜梧城、未来照片和“六人中有人会杀你”的主谜题。

第二章《残响》继续推进：林晚记得不存在的约定，周小满残留死亡现场的情绪，沈听澜发现被现实抹掉的下穿通道，唐梨的身体记得不存在的路线。陈渡随后第一次遭遇会保留跨周目信息的异常体 **“无面行人”**。

当前战斗仍运行在 VN narrative runtime 中，采用剧情化决策验证类魂核心语义：观察前摇、死亡、读取、改变策略，以及 **Boss 同样会学习玩家**。后续实时战斗模块接入 VN Engine v2 时应保持这套叙事规则。

## 内容结构

```text
game/project.json              第一章与基础项目数据
game/content/chapter2.json     第二章可组合内容包
game/audio.json                音乐/音效与演出映射
game/assets/                   背景、立绘、CG、UI 原型资产
scripts/generate-audio.mjs      可重复生成原创 WAV 原型
scripts/build.mjs               合并内容包 + 音频，再调用 VN Engine v2 打包
docs/STORY_BIBLE.md             故事圣经
docs/CHAPTER2.md                第二章叙事与战斗语义
docs/COMBAT_DESIGN.md           轻类魂模块方向
docs/ART_DIRECTION.md           已收拢视觉方向
docs/ASSET_STATUS.md            美术/音频生产状态
docs/ENGINE_INTEGRATION.md      引擎接入与扩展边界
```

从第二章开始采用 **content pack**。每一章或路线可以独立声明新增/替换场景、状态、舞台演出和资产；构建时自动组合，避免单一 `project.json` 持续膨胀。

## 六位主要角色

- 林晚：梦境与被覆盖记忆的残响
- 周小满：异常感知与情绪残留
- 许栖：夜梧城、世界裂隙与读档知情者
- 沈听澜：记录、档案与被修改的历史
- 唐梨：道路、方向感与“向前走”的价值锚点
- 乔南星：信息、网络残留与来自未来/其他周目的消息

## 本地构建

需要 Node.js 22+，并将 `VN-Engine-v2` 放在本仓库同级目录：

```bash
npm run build
python -m http.server 8000 --directory dist
```

也可以设置：

```bash
VN_ENGINE_PATH=/path/to/VN-Engine-v2 npm run build
```

构建流程会自动生成当前原创程序音乐/音效，组合所有 `game/content/*.json`，再生成完整独立作品。运行时不需要 React、Ren'Py、Electron、Tauri 或引擎开发仓库。

## 资产边界

当前 SVG 与程序音乐已经进入实际构建，用于剧情、构图、交互和节奏验证；其中多数仍属于 prototype/direction 状态。正式角色立绘必须满足统一底模、表情差分一致、干净线稿、克制赛璐璐上色等要求，未经确认的概念海报或 AI 自生成角色信息不会直接进入正式正史资产。
