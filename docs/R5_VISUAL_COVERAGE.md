# R5 — Visual Coverage

基线：`main@206f54064979ae491aca43a3d8e8894c19011c7c`（R4 完成）。

R5 的目标不是增加“看起来很多”的美术文件，而是让玩家实际跑完整个 82 Scene 剧情时，人物、背景与关键 CG 都有可验证的视觉落点。

## PR A — Dialogue → Character Visual Mapping

状态：进行中。

- 新增 `game/visual/r5-speaker-policy.json`，把所有对白说话人分类为：`portrait`、`protagonist`、`narrator`、`functional`、`pending-support-portrait`。
- 新增 `scripts/check-r5-visual-coverage.mjs`，扫描七章 canonical content。
- 审计要求：82 Scene 背景引用必须有效；所有命名对白 speaker 必须有明确视觉策略；portrait speaker 的 neutral / expression 资产必须真实存在。
- `--final` 模式禁止任何 `pending-support-portrait` 遗留。

## PR B — Supporting Cast Portraits

目标：为 12 名常驻配角补正式 neutral portrait，并把 speaker policy 从 pending 切换为 portrait：

徐嘉树、程妍、顾明远、陈岚、许蓉、罗秀梅、苏遥、何川、纪尧、林澄、沈砚秋、梁成。

正式资产必须进入 canonical `game/assets/manifest.json`，不得只存在 source / docs 或临时工作区。

## PR C — 82-Scene Background Coverage

目标：所有 82 Scene 的 `background` 都必须指向 canonical production background；允许合理复用，不强制 82 张唯一图片。

验收输出必须明确：`82 / 82`、无缺失 ID、无错误 kind、无 placeholder/fallback。

## PR D — Route / Story Key CG Expansion

目标：从路线高潮、核心异常、Bad/Normal/True Ending 反推必要 CG，并同步：

- production asset manifest
- 4K asset plan / provenance
- scene trigger
- CG Gallery 元数据
- MetaState 解锁
- 回归测试

新增 CG 不得只注册到 Gallery 而没有剧情触发，也不得只在剧情出现但无法被 Gallery 解锁。

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
