# R5 — Visual Coverage

基线：R4 完成于 `206f54064979ae491aca43a3d8e8894c19011c7c`。

R5 的目标不是增加“看起来很多”的美术文件，而是让玩家实际跑完整个 82 Scene 剧情时，人物、背景与关键 CG 都有可验证的视觉落点。

## PR A — Dialogue → Character Visual Mapping

状态：**COMPLETED**，合入 `main@8f37f6b14d735dd7ad0cf5c912f3a184a550a5cc`。

- `game/visual/r5-speaker-policy.json` 把所有对白说话人分类为 portrait / protagonist / narrator / functional。
- `scripts/check-r5-visual-coverage.mjs` 扫描七章 canonical content。
- `？？？` 与 `车站广播` 被明确标记为非角色声源，不借宽泛正则掩盖未知角色。
- `--final` 模式禁止任何 pending supporting portrait 遗留。

## PR B — Supporting Cast Portraits

状态：**COMPLETED**，合入 `main@1511151c60ab77c8af4e09fd21de918931006251`。

12 名常驻配角均已有正式 neutral portrait：

徐嘉树、程妍、顾明远、陈岚、许蓉、罗秀梅、苏遥、何川、纪尧、林澄、沈砚秋、梁成。

生产规范：

- visual tier：`supporting-cast-stylized-bust`
- 每人独立身份、轮廓、发型、服装与角色职业/社团附件；不复用六位女主身体。
- 每人保留 1080×1920 transparent original、2160×3840 PNG master、1080×1920 WebP runtime、SHA256 provenance。
- source type 明确记录为 `chatgpt-authored-procedural-raster-illustration`，不冒充 native 4K 或主角级精细原画。
- `game/assets/manifest.json`、4K plan、speaker policy、runtime `stage.speakers` 已同步。
- 116 条常驻配角直接对白全部获得 portrait speaker 映射。
- `scripts/check-r5-supporting-cast.mjs` 要求 12 / 12、12 个不同 master、116 条对白覆盖、production/runtime/provenance 全链一致。
- PR B 已通过 Build、最终 Web ZIP 浏览器验收、Windows 原生启动与实际安装 ZIP/进程重启验收。

R5 将 R1 的“常驻配角允许无立绘”历史规则升级为：上述 12 名常驻配角必须有正式 supporting portrait；普通功能 NPC 仍可无立绘。

## PR C — 82-Scene Background Coverage

状态：**COMPLETED**，合入 `main@3ab8d70e029518ca4b3b2b1620fe5d7048ac6150`。

- 82 / 82 canonical Scene 都显式声明 `background`。
- 使用 20 个 canonical production 4K 背景合理复用，不为了数字强制制造 82 张唯一图片。
- `scripts/check-r5-background-coverage.mjs` 禁止缺省背景、未知 asset、错误 kind、脱离 4K plan、非 production WebP 引用。
- Build / release / stable gate 持续要求 `82 / 82`。

## PR D — Route / Story Key CG Expansion

状态：**COMPLETED**，合入 `main@1d4f06ec5298730090f9760b2bed438324e8adc5`。

- 既有 5 张关键 CG 保留。
- 六条 Normal Route 各新增一张路线收束 CG，总 production / Gallery CG：11 张。
- 新 CG 由已验收 production background + heroine portrait 确定性合成，保留 original / 3840×2160 master / runtime WebP / SHA256 provenance，并明确 `native4kClaim:false`。
- 六个 Normal End Scene 与六张路线 CG 一一对应。
- Gallery / MetaState、4K plan、production manifest、离线缓存与回归测试全部同步。
- `scripts/check-r5-key-cg-coverage.mjs` 要求 `11 / 11` CG 有 production asset、4K mapping、剧情 trigger 与 Gallery 注册。
- PR D 已通过 Build、最终 Web ZIP 浏览器验收、Windows 原生启动与实际安装 ZIP/进程重启验收。

## Final Visual Integration

状态：**COMPLETED / PASS**。

`npm run visual:r5:final` 已升级为正式硬门禁，并由 Build / release / stable 全部直接调用。最终门禁同时检查 source 与已经打包到 `dist` 的实际产物：

- Dialogue visual mapping：100%
- Portrait speaker mappings：20 / 20
- Supporting cast portrait strategy：12 / 12
- Scene background coverage：82 / 82
- Required key CG coverage：11 / 11
- Static production visual assets：76（45 portrait + 20 background + 11 CG）
- Runtime assets（含 21 audio）：97
- Missing runtime visual assets：0
- Broken visual references：0
- Placeholder/fallback production visuals：0
- Production visual offline cache：76 / 76
- Release regressions：70 / 70 PASS
- Build：PASS
- final extracted Web ZIP browser acceptance：PASS
- Windows native startup：PASS
- actual installed Windows ZIP + process restart：PASS
- Publish：SKIPPED

最终平台验收基线：Build run `40618511057`；Release run `40618511041`。详细证据见 `docs/R5_FINAL_VISUAL_AUDIT.md`。

R5 不移动或覆盖已发布的 `v1.2.1` tag / Release / Pages；后续公开发布仍作为独立明确动作执行。
