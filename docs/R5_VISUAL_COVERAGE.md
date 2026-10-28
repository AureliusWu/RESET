# R5 — Visual Coverage

基线：R4 完成于 `206f54064979ae491aca43a3d8e8894c19011c7c`；R5 PR A 已合入 `main@8f37f6b14d735dd7ad0cf5c912f3a184a550a5cc`。

R5 的目标不是增加“看起来很多”的美术文件，而是让玩家实际跑完整个 82 Scene 剧情时，人物、背景与关键 CG 都有可验证的视觉落点。

## PR A — Dialogue → Character Visual Mapping

状态：**COMPLETED**。

- `game/visual/r5-speaker-policy.json` 把所有对白说话人分类为：`portrait`、`protagonist`、`narrator`、`functional`、`pending-support-portrait`。
- `scripts/check-r5-visual-coverage.mjs` 扫描七章 canonical content。
- CI 实测：82 Scene、644 条非旁白对白、222 条现有 portrait 对白；8 个已接入 runtime portrait speaker。
- `？？？` 与 `车站广播` 被明确标记为非角色声源，不借宽泛正则掩盖未知角色。
- `--final` 模式禁止任何 `pending-support-portrait` 遗留。

## PR B — Supporting Cast Portraits

状态：**PENDING ART PRODUCTION**。

目标：为 12 名常驻配角补正式 neutral portrait，并把 speaker policy 从 pending 切换为 portrait：

徐嘉树、程妍、顾明远、陈岚、许蓉、罗秀梅、苏遥、何川、纪尧、林澄、沈砚秋、梁成。

对白直接触发次数共 116 条，其中徐嘉树 31、梁成 18、程妍 15、何川 10，其余 2–8 条。仓库当前没有这些人物可复用的隐藏 portrait，因此不得用占位图冒充完成。

正式资产必须进入 canonical `game/assets/manifest.json`、4K plan、runtime `stage.speakers` 与 provenance，不得只存在 source / docs 或临时工作区。

## PR C — 82-Scene Background Coverage

状态：**IMPLEMENTED / CI VERIFYING**。

- 82 / 82 canonical Scene 都显式声明 `background`。
- 当前使用 20 个 canonical production 4K 背景合理复用，不要求 82 张唯一图片。
- 新增 `scripts/check-r5-background-coverage.mjs`，禁止：缺省背景、未知 asset、错误 kind、脱离 4K plan、非 `assets/4k/runtime/backgrounds/*.webp` 的生产引用。
- `visual:r5:backgrounds` 已接入 build / release / stable gate；最终门禁同样执行。

验收输出必须保持：`82 / 82`、无缺失 ID、无错误 kind、无 placeholder/fallback。

## PR D — Route / Story Key CG Expansion

状态：**PENDING**。

目标：从路线高潮、核心异常、Bad/Normal/True Ending 反推必要 CG，并同步：

- production asset manifest
- 4K asset plan / provenance
- scene trigger
- CG Gallery 元数据
- MetaState 解锁
- 回归测试

当前基线只有 5 张正式 CG、5 个显式剧情 CG Scene。新增 CG 不得只注册到 Gallery 而没有剧情触发，也不得只在剧情出现但无法被 Gallery 解锁。

## Final Visual Integration

最终门禁：

- Dialogue visual mapping：100%
- Supporting cast portrait strategy：100%
- Scene background coverage：82 / 82
- Required key CG coverage：100%
- Missing runtime visual assets：0
- Broken visual references：0
- Placeholder/fallback assets：0
- `npm run visual:r5:final`：PASS
- Build / Web / Windows / PWA / Save / Meta / Gallery：PASS

R5 不移动或覆盖已发布的 `v1.2.1` tag / Release / Pages；完成后再决定下一版本发布线。
