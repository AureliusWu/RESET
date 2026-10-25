# 《回留》× VN Engine v2

## 当前接入

本作使用 `VN-Engine-v2` v0.3.0 alpha 的通用 `narrative` runtime，而不是复制《湿性愈合》《“网”恋》或《回路》的运行时代码。

`game/project.json` 当前直接使用：

- 通用数值状态；
- 稳定场景 / 台词 ID；
- 选择与路线重放；
- 背景、角色立绘和表情映射；
- 场景淡入、闪白等演出 cue；
- 存读档、历史、自动、已读快进；
- PWA / 独立离线打包。

引擎固定提交记录在 `ENGINE.lock.json`。CI 会检出该精确提交并打包独立作品，避免游戏仓库静默跟随引擎 main 变化。

## 下一轮需要进入引擎本体的能力

### 1. MetaState

将“当前周目存档”和“跨周目世界状态”分离：

```text
GameState
- scene / line
- route stats
- decisions / history

MetaState
- worldRevision
- playerLoadCount
- completedRoutes
- heroineAwareness
- memoryResidue
- metaFlags
```

普通存档读取只恢复 GameState；玩家主动读取时由引擎事件更新 MetaState。不能通过游戏脚本任意伪造系统读档事件。

### 2. 多角色舞台

从单个 `portrait` 升级为 `sprites[]`，支持 left / center / right、自定义坐标、zIndex、进退场、表情切换、聚焦与暗化。

### 3. MiniGame Registry

剧情只声明小游戏类型与结果：

```text
minigame: combat-soulslike
success: scene_x
failure: load_event_y
```

首个目标是 2D/2.5D 轻类魂 Boss 战：移动、轻/重攻击、闪避、精力、单一角色能力与有限恢复；强调读招、死亡、重试和 Boss 对周目的残响，不建设完整 3D ARPG 系统。

### 4. Meta UI

标题、存档槽和历史记录允许由受控 Meta 事件产生异常表现，例如额外“存档槽”、标题背景改变、历史中出现残响台词。真实玩家存档与伪叙事 UI 必须隔离，禁止破坏或伪造用户设备文件。

## 迁移边界

这次只让新作《回留》使用新引擎。旧四作是否迁移仍是独立决策，不因《回留》接入而自动执行。
