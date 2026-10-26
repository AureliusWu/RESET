# v1.2.0 开发断点续跑记录

日期：2026-10-26（北京时间）。版本保持 `1.2.0-dev`，正式发行与线上站点保持 v1.1.0，不创建 RC / 正式标签或 Release，不执行正式 Pages 部署。

## 恢复位置

通过 GitHub API 读取 main、最近 20 条提交、版本及 Build / Release / Pages 工作流，随后 fetch 对照本地。恢复入口为 `fb44b8f975dd168097cc01289229ca8c656add9a`，无未提交修改，无 queued / in_progress；入口的 Build 和最终 Web / Windows ZIP 验收均成功。先运行原有 45 项测试，全通过，再继续新增修复。

VN Engine v2 仍锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。本轮只修改作品代码、测试和文档。

## 已提交修复

| 提交 | 变化 |
| --- | --- |
| [8099dc3](https://github.com/AureliusWu/RESET/commit/8099dc392c0fadb7c6f13f3b1540ba7c35af8e31) | 战斗结束等待随暂停冻结；恢复后保留剩余时间，只回接一次；外部暂停不可绕过；面板关闭前不启动战斗；替换 visit / dispose 清理旧结果 |
| [c9262d0](https://github.com/AureliusWu/RESET/commit/c9262d0074d7af9c8712172556fcc854c0b9010b) | 作品层舞台动画随暂停冻结/恢复，进入新 visit 清理旧效果；保留 ready 后演出与减少动态效果；增加实际浏览器回归 |

11 项战斗暂停/生命周期测试、5 项舞台桥接测试、1 项 Boss 学习测试，共新增 17 项；当前 Node 总数 **62**。其中最初 9 项战斗测试及 2 项动画测试在修复前明确失败，已修复。原 35 项与上一轮 45 项均保留。

Boss 测试验证接触次数跨实例保留、第二次接触改变自适应招式、长期重试的提速有上限，以及第七人的预测/范围攻击轮替。输入映射、轻重击、闪避、HP、伤害和原学习算法均未重写。

## 验收证据

代码验收基准 `c9262d0`：

- [Build](https://github.com/AureliusWu/RESET/actions/runs/40260499662)：成功。
- [最终 Web / Windows ZIP 验收](https://github.com/AureliusWu/RESET/actions/runs/40260499660)：成功。该提交当时 61 项 Node 全通过；之后只补充 Boss 学习测试与记录，当前本地 62 / 62 通过。
- 浏览器 **33** 条验收记录，`errors: []`。包含长文本、Auto / Skip / History / 设置、快速槽、六手动槽、结局收藏、CG 图鉴、320/360/390px 竖屏、844×390 横屏、小窗口、三战实际胜负、舞台动画、结果等待暂停、Meta 与 True End。
- Windows 原生 **8** 条验收记录，`errors: []`、`limitations: []`。使用最终 ZIP 的 RESET.exe → VNEngine.exe → game/；包含窗口调整、实际失焦与最小化暂停、设置/存档/收藏和完整进程重启持久化。125% / 150% / 200% 项为内容 DPI 模拟。
- PWA 包含真实 Service Worker 断网重载、校验后的 v1.1.0 ZIP 原地更新、旧客户端关闭后激活、快速/手动槽与 Meta 保留，以及升级后的离线重开。
- 三个旧版 × 13 个正式结局的 **39** 组存档迁移通过；迁移不修改原备份，非法恢复不增加 Meta。

下载并独立验证了以下三个 GitHub Artifact：

| Artifact | SHA256 |
| --- | --- |
| Web ZIP 附件 `12623722915` | `ac73c0c6a669332cfd3b0fe29d968e6129e48c5654633e1536439be9084e096b` |
| Web 验收 `12623872743` | `e855471ceac60d5c021d1ae248122aa781daa7c36ef819096b9810d059b4b42e` |
| Windows 验收 `12624163581` | `ea8498c7641ae831d2f8937052bf87900d6bbb58437adf1a78d9cd0e3501301b` |

SHA256 针对 GitHub Artifact 外层 ZIP；内部 Web 发行 ZIP 的 124 个清单文件另逐一验证大小和 SHA256，manifest 与该提交本地构建一致，contentFingerprint 为 `8020e95817047a`。抽查了手机横屏战斗、竖屏六选项和 Windows 800×600 截图。

浏览器中的宿主可见性事件为合成事件，用于验证作品与宿主的 API 契约；Windows 的前台焦点切换与最小化为原生窗口操作。两类证据分别登记。当前 main 的后续打包与测试状态以 [Build](https://github.com/AureliusWu/RESET/actions/workflows/build.yml) 和 [Release 验收](https://github.com/AureliusWu/RESET/actions/workflows/release.yml) 为准。

## 剧情核查

当前 82 个场景、382 行正文；79 个场景可通过正式路线到达，3 个早期路线原型仍冻结。场景/台词/选项 ID、路线效果、回接、地点和时间与 v1.1.0 对照一致，例外仅为上一轮已修复的第一章 chapterEnd 标记。上一轮 20 句精修保留，本轮未改正文。

高二称呼一致，无高三混入。第 6/7 章与 v1.1.0 逐对象一致，保持：**不保存 → 不可逆 → 10 月 25 日 → 明天见**。

## RC 判断与后续入口

**尚不冻结 RC，继续 v1.2.0-dev。** 当前自动化与 CI 原生验收已覆盖可执行门槛，仍缺：

1. 实体 Android 的主屏幕安装、系统旋转、刘海/状态栏与实际触控体验。
2. 实体 Windows 10/11 的系统 DPI / 显示器与端到端操作抽查。
3. 公开 HTTPS 候选地址的验收；本轮没有部署公开候选。
4. 更多实际玩家对第七人难度与长时间阅读节奏的反馈。

这些项目未用浏览器模拟或 CI 数字冒充完成。继续工作时读取当前 main 及对应 Actions，优先补这几项；无需再做 v1.1.0 发布、迁移引擎或重写主线。
