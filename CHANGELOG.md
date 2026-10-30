# Changelog

本文件记录《回留 / RESET》主线版本演进。已经发布的历史版本细节由对应 Git tag / GitHub Release 永久保存；主分支不再重复保留每个历史版本的独立 Changelog 文件。

## 1.3.1 — NPC portrait runtime hotfix

- 七章29个场景撤销整场禁用立绘；27条离屏对白使用显式行级隐藏。
- 12名配角增加真实剧情 frame、DOM、离线升级与 Windows WebView2 发布门禁。
- 引擎锁定、美术验收与剧情/存档身份保持不变。详见 [CHANGELOG_v1.3.1.md](CHANGELOG_v1.3.1.md)。

## 1.3.0 — 文案终审、UI/UX 与音画演出整合

- 终审七章文案及场景衔接，保留 82 场景、2161 条台词和存档/分支身份；源结构契约进入发布门禁。
- 标题键盘焦点与手机触控修订，整合音乐、SFX、演出 R1。
- 有界全决定路径矩阵、具名 UI 玩家流程、六槽旧 PWA 升级与独立 AI 截图观察分别验收。
- 同一提交 Build、严格稳定检查、最终 Web/Windows ZIP 全部通过后创建新 Release，Pages 部署原始公开 Web ZIP。
- 详细范围、平台与验证口径见 [CHANGELOG_v1.3.0.md](CHANGELOG_v1.3.0.md) 和 [终审记录](docs/FINAL_REVIEW_v1.3.0.md)。

## 1.2.3 — R8 原生美术与双平台发布

- 12 名配角完成用户授权的 AI 模拟人工审核并启用；全部 47 个原生美术来源链入库，包含新背景、异常体、CG 与 UI。
- 修复 CG 重复立绘和审计标题截图时序；保留既有女主图片、正文 noSprite 与存档/Meta/不可逆规则。
- Web/PWA 与 Windows x64 同步提供，v1.2.2 存档加入受控升级；实际公开 v1.2.2 PWA 的同源升级和离线重载纳入最终包验收。
- 85 项回归、严格视觉/来源链、同 SHA Build / Web ZIP / Windows ZIP 门禁后发布；Pages 使用公开 Release 原 ZIP。
- 详细说明见 [CHANGELOG_v1.2.3.md](CHANGELOG_v1.2.3.md)。

## 1.2.2 — Visual Coverage Web/PWA

- R5 配角、82 场景背景和路线 CG 覆盖进入 Web/PWA 正式发行；保留原 v1.2.1 Windows 包。
- 历史发布详情见 [CHANGELOG_v1.2.2.md](CHANGELOG_v1.2.2.md) 与对应不可变 Release。

## 1.2.1 — Mobile shell and PWA recovery

- 标题 Key Visual 改为真实可交互标题页，新增明确的「进入游戏」入口。
- 修复移动端 UI 无法交互、844×390 横屏布局、标题/剧情选项/工具栏触控尺寸问题。
- 恢复 v1.2.0 桌面与 4K 宽屏布局，避免移动修复影响桌面舞台。
- 接入 Chromium `beforeinstallprompt`，提供「安装到设备」入口；保留 Service Worker 离线与同源升级能力。
- 六位角色 production 美术由项目所有者确认通过，视觉 Gate 为 `PASS`。
- Web 最终 ZIP、PWA 升级与离线、Windows x64/WebView2 最终 ZIP 均进入稳定发布门禁。
- 正式故事版本为 `reset-v1.2.1`，兼容既有公开版本存档受控升级。
- 当前稳定发行包的详细说明见 [CHANGELOG_v1.2.1.md](CHANGELOG_v1.2.1.md)。

## 1.2.0 — Stable release

- 收口 v1.2.0-dev、rc.1 与 rc.2：体验、战斗、PWA、存档兼容、4K production 技术管线和作品级视觉组件进入稳定发行。
- 58 / 58 production 资产完成 4K master/runtime 技术映射；新增独立品牌、7 章章节卡、剧情道具视觉、六位女主 Q 版角色记忆与《回留》专属安装图标。
- 正式故事版本为 `reset-v1.2.0`；兼容 v1.0.0 / v1.0.1 / v1.1.0 / v1.2.0-dev / v1.2.0-rc.1 / v1.2.0-rc.2 备份升级。
- 发布由同 SHA Build、最终 Web ZIP、最终 Windows ZIP 全部验收通过后创建不可移动 tag、双平台 Release 与 `SHA256SUMS.txt`；Pages 只从公开 Release 原 ZIP 部署并再次做公网离线回归。

## 1.2.0-rc.2 — Art completeness candidate

- 补齐作品品牌、Chapter 01–07 章节卡、关键剧情道具视觉、六位女主 Q 版角色记忆与专属 PWA 图标。

## 1.2.0-rc.1 — Release candidate freeze

- 完成 v1.2.0 体验修复、战斗/PWA 加固与 4K 美术 Round 1–10 RC 冻结。

## 1.1.0 — Saves and collection

- 增加 6 个手动存档槽、13 个结局收藏、5 张 CG 图鉴，并增强自适应阅读与战斗反馈。

## 1.0.1 — Combat input patch

- 修复战斗输入、切后台与兼容性问题。

## 1.0.0 — Release

- 《回留 / RESET》的第一个完整正式发行版本。
