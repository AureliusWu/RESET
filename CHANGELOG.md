# Changelog

## 1.2.1-dev — Visual recovery

- 修复 v1.2.0 实机反馈暴露的标题 Key Visual 覆盖剧情与移动端角色构图问题。
- Round 3 五位女主重新标记为 `ART_BLOCKED`；尺寸、Alpha、SHA256、Decode 与自动渲染不再等同于 `ART_READY`。
- 新增人工视觉状态事实源与 stable release 硬门禁；production Build 移除确定性 SVG 占位立绘生成链。
- 新增逐角色 390×844 手机剧情截图证据；Web / Windows 工作流在视觉恢复阶段只生成候选包，不发布 tag。
- v1.2.0 存档加入受控升级来源。
- 详见 [CHANGELOG_v1.2.1-dev.md](CHANGELOG_v1.2.1-dev.md) 与 `docs/V1_2_1_VISUAL_RECOVERY.md`。

## 1.2.0 — Stable release

- 正式收口 v1.2.0-dev、rc.1 与 rc.2：体验、战斗、PWA、存档兼容、4K production 技术管线和作品级视觉组件进入稳定发行。
- 58 / 58 production 资产完成 4K master/runtime 技术映射；新增独立品牌、7 章章节卡、剧情道具视觉、六位女主 Q 版角色记忆与《回留》专属安装图标。角色艺术质量在 v1.2.1 重新按人工视觉 Gate 复核。
- 正式故事版本为 `reset-v1.2.0`；兼容 v1.0.0 / v1.0.1 / v1.1.0 / v1.2.0-dev / v1.2.0-rc.1 / v1.2.0-rc.2 备份升级。
- 发布由同 SHA 的 Build、最终 Web ZIP、最终 Windows ZIP 全部验收通过后自动创建不可移动 tag、双平台 Release 与 `SHA256SUMS.txt`；Pages 只从公开 Release 原 ZIP 部署并再次做公网离线回归。
- 详见 [CHANGELOG_v1.2.0.md](CHANGELOG_v1.2.0.md)。

## 1.2.0-rc.2 — Art completeness candidate

- 补齐作品品牌、Chapter 01–07 章节卡、关键剧情道具视觉、六位女主 Q 版角色记忆与专属 PWA 图标。
- 详见 [CHANGELOG_v1.2.0-rc.2.md](CHANGELOG_v1.2.0-rc.2.md)。

## 1.2.0-rc.1 — Release candidate freeze

- 完成 v1.2.0 体验修复、战斗/PWA 加固与 4K 美术 Round 1–10 RC 冻结。
- 详见 [CHANGELOG_v1.2.0-rc.1.md](CHANGELOG_v1.2.0-rc.1.md)。

## 1.1.0 — Saves and collection

- 6 个手动存档槽、13 个结局收藏、5 张 CG 图鉴、自适应阅读与战斗反馈增强。
- 详见 [CHANGELOG_v1.1.0.md](CHANGELOG_v1.1.0.md)。

## 1.0.1 — Combat input patch

- 修复战斗输入、切后台与兼容性问题。
- 详见 [CHANGELOG_v1.0.1.md](CHANGELOG_v1.0.1.md)。

## 1.0.0 — Release

- 《回留 / RESET》的第一个完整正式发行版本。
- 详见 [CHANGELOG_v1.0.0.md](CHANGELOG_v1.0.0.md)。