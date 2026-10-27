# 文档索引

主分支只保留当前开发仍然需要的事实源与长期设计文档。历史 Round、旧版本计划、恢复记录和一次性验收说明从 Git 历史 / tag / Release 追溯，不再常驻主树。

## 剧情与角色

- [STORY_BIBLE.md](STORY_BIBLE.md) — 世界规则、主线真相与路线功能。
- [CAST_BIBLE_R1.md](CAST_BIBLE_R1.md) — R1 角色网络与常驻配角。
- [SCENARIO_R1.md](SCENARIO_R1.md) — R1 正文边界与七章正式源文件。
- [ENDING_MATRIX.md](ENDING_MATRIX.md) — Ending 与结局结构。

## 美术与音频

- `game/assets/manifest.json` — R2 静态 production Asset ID / kind / runtime path 唯一事实源。
- [ART_DIRECTION.md](ART_DIRECTION.md) — 长期视觉方向。
- [ART_4K_PLAN.md](ART_4K_PLAN.md) — 4K master/runtime 规划。
- [ART_4K_AUDIT.md](ART_4K_AUDIT.md) — 可重生成的 4K 审计快照。
- [ART_COMPLETENESS_AUDIT.md](ART_COMPLETENESS_AUDIT.md) — 作品级美术完整性。
- [ASSET_STATUS.md](ASSET_STATUS.md) — 当前资产状态。
- [AUDIO_DIRECTION.md](AUDIO_DIRECTION.md) — 音乐与 SFX 方向。

## 工程与发行

- [ENGINE_INTEGRATION.md](ENGINE_INTEGRATION.md) — VN Engine v2 接入边界。
- [COMBAT_DESIGN.md](COMBAT_DESIGN.md) — 作品级战斗设计与验收原则。
- [PRODUCTION_STATUS.md](PRODUCTION_STATUS.md) — 当前制作状态。
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — 发布检查项。

## R2 正式源

剧情正文：`game/content/chapters/01.json` → `game/content/chapters/07.json`，加载顺序由 `game/content/manifest.json` 显式声明。`game/project.json` 不再承载剧情 Scene，也不允许重新引入 `replaceScenes`。

静态 production 资产：`game/assets/manifest.json`。`game/project.json` 与 `game/content/**` 不再承载 `assets` / `replaceAssets`；正式角色、背景与 CG 统一指向 `game/assets/4k/runtime/`。音频继续由 `game/audio.json` 独立管理。

任何会影响场景、结局、存档兼容、美术引用或运行时行为的修改，都应继续由现有 Build / Scenario / Asset Schema / Release 门禁验证。
