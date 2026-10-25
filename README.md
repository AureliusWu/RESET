# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是发生在架空中国城市“梧城”的现代校园视觉小说项目。核心围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；后续计划加入少量高强度的轻类魂战斗，但视觉小说仍是主体。

## 当前状态

- 仓库：`AureliusWu/RESET`
- 中文名：**回留**
- 当前阶段：首个可玩纵切 / 共通线第一章骨架
- 引擎：独立仓库 `AureliusWu/VN-Engine-v2`
- 引擎基线：v0.3.0 alpha，固定提交 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 本作不复制引擎源码；构建时由固定引擎提交解释 `game/project.json` 并生成独立离线作品。

## 已写入的首批内容

首个纵切从 **10 月 17 日 18:42，梧城一中旧教学楼** 开始。陈渡已经历三次死亡，第四次回到同一时刻；玩家可选择寻找周小满、观察林晚、回家或前往南湖站。共通线随后引出许栖与“夜梧城”，并在第二天依次让沈听澜、唐梨、乔南星进入主线。

六位主要角色承担不同的异常功能：

- 林晚：梦境与被覆盖记忆的残响
- 周小满：异常感知与情绪残留
- 许栖：夜梧城、世界裂隙与读档知情者
- 沈听澜：记录、档案与被修改的历史
- 唐梨：道路、方向感与“向前走”的价值锚点
- 乔南星：信息、网络残留与来自未来/其他周目的消息

## 目录

```text
game/project.json          VN Engine v2 可直接打包的项目数据
game/assets/               当前纵切占位资产；最终美术尚未冻结
docs/STORY.md              故事与第一章结构
docs/CHARACTERS.md         六位主要角色功能
docs/ART_DIRECTION.md      已收拢的视觉方向
docs/ENGINE_INTEGRATION.md 引擎接入、后续 Meta/战斗扩展边界
scripts/build.mjs           本地调用独立引擎仓库构建
.github/workflows/build.yml 固定引擎提交的 CI 构建
```

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

构建产物为完整独立作品，运行时不需要 React、Ren'Py、Electron、Tauri 或引擎开发仓库。

## 边界

当前资产是为了验证引擎接入和剧情节奏的占位资源，不代表最终角色立绘与背景定案。正式视觉方向以 `docs/ART_DIRECTION.md` 为准；未经确认的概念海报不会直接作为正式游戏素材。
