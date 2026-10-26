# 《回留 / RESET》v1.2.0-rc.2

本版本是在已冻结 `v1.2.0-rc.1` 之后形成的第二个 Release Candidate，目标是补齐作品运行时的 Galgame 美术覆盖缺口，同时保持既有 58 个正式 4K production 位图资产、剧情与引擎锁定不变。

正式线上版、正式 GitHub Release 与 Pages 继续保持 **v1.1.0**；rc.2 仅作为候选构建与验收版本。

## 美术补全

- 新增《回留 / RESET / 18:42》独立作品品牌标记，不再只依赖通用界面文字。
- 新增 Chapter 01–07 响应式章节卡。
- 为 `archive_erased_map` 增加 2009 梧城旧城区地图视觉。
- 为 `underpass_warning` 增加“来自五分钟后”的手机 / 照片视觉。
- 新增林晚、周小满、许栖、沈听澜、唐梨、乔南星六位女主 Q 版“角色记忆”徽章。
- PWA 192 / 512 图标由 VN Engine 通用 N 几何升级为《回留》专属“回环 / 存档”标记。

## 画质与资产原则

- rc.1 的 58 个 production 4K 引用继续保持 `assets/4k/runtime/`，没有已知 missing、undersized、missing-alpha 或正式 SVG fallback，因此不进行无依据二次放大或重绘。
- 新增 LOGO、章节卡、Q 版徽章和剧情道具采用分辨率无关的 SVG DOM 几何，在 1080p、4K、高 DPI 与移动端按目标分辨率重绘。
- 新增矢量运行时视觉不恢复已经退役的 `game/assets/*.svg` production fallback。

## 兼容与门禁

- 新增 `tests/art-completeness.test.mjs` 并纳入 `npm run test:release`。
- 存档升级链增加 `reset-v1.2.0-rc.1 → reset-v1.2.0-rc.2`，同时继续接受 v1.0.0、v1.0.1、v1.1.0 与 v1.2.0-dev 的旧备份。
- VN Engine v2 继续精确锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。

详细美术矩阵见 `docs/ART_COMPLETENESS_AUDIT.md`。
