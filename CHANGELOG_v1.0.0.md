# 《回留 / RESET》v1.0.0

《回留》的首个完整无配音发行版。现代中国校园、都市灵异、多周目与角色路线，搭配三处可操作的实时 2D 轻类魂战斗。

## 下载与运行

| 平台 | 发行包 | 运行方式 |
| --- | --- | --- |
| Windows x64 | `RESET-huiliu-v1.0.0-win-x64.zip` | 完整解压到可写目录，双击根目录 `RESET.exe`；保留 `engine/` 和 `game/`。需要 Windows 10/11 x64 与 Microsoft Edge WebView2 Runtime；无需安装 Node.js 或 .NET SDK。 |
| Web / PWA | `RESET-huiliu-v1.0.0-web.zip` | 解压后使用静态 HTTP 服务或 HTTPS 网站托管；本地可运行 `python -m http.server 8000`。请通过 `http://localhost:8000/` 访问。首次联网等待“已下载，可离线游玩”后，可在同一浏览器中离线重开。不要直接双击 `index.html`。 |

发行附件附带 `SHA256SUMS.txt`。PWA 离线缓存需要 HTTPS 或 localhost 安全上下文；系统的“安装应用”入口取决于浏览器。存档、设置、Meta 与浏览器配置文件/站点来源绑定；更换端口、域名或清除站点数据前，请在普通剧情区间导出存档。

## 本版内容

- 从 10 月 17 日 18:42 到 10 月 25 日的完整共通线、高潮和 True Route。
- 林晚、周小满、许栖、沈听澜、唐梨、乔南星六条角色调查核心与六个 Normal End。
- 六个核心 Bad End，以及 True End《回留 · 明天见》。完整触发说明见[结局矩阵](https://github.com/AureliusWu/RESET/blob/v1.0.0/docs/ENDING_MATRIX.md)（含剧透）。
- 无面行人初战、无面行人再战、第七人，共三处实时战斗；支持 WASD/方向键、Space 闪避、J 轻击、K 重击与触屏按钮。
- 存读档、历史记录、自动阅读、已读快进、阅读/音频设置；独立 Meta 保存实际读取次数、结局记录和通关标题。
- True Route 不可逆区间限制保存、读取、重开及历史回退/备份导入；通关完成后可开始新游戏，保留结局 Meta。
- 六位主要角色固定底模，31 张剧情使用的正式表情差分；20 个主要背景、5 张关键 CG。
- 原创程序音乐与音效、独立终局曲“不保存”和 True End 曲“明天见”，构建时归一化和软限幅。

视觉方向保持现代中国 Galgame 与日系二维动画表现：干净线稿、克制赛璐璐；正常世界清透自然，异常世界冷蓝、紫灰。

## 最终验收修复

- 修复 True Route 可通过历史回看、设置中的存档导入/导出绕过不可逆限制的问题。
- 修复 Meta 插件在面板、后台或战斗暂停时重新启用存读档/新游戏按钮的问题。
- 修复 True End 完成后仍无法开始新游戏的问题；跨读取 Meta 保留。
- 修复攻击/闪避键与触屏按钮在两帧之间快速点击时可能漏招的问题；失焦时清理移动状态，退出战斗时取消延迟回调。
- 更新仍停留在第一章原型阶段的制作/引擎接入文档，并将游戏版权说明、README 和本发行说明加入 Web 包。
- 新增完整运行时路线重放、Meta 回归、最终 ZIP 浏览器验收、三场战斗真实胜负回接、PWA 真断网重载，以及 Windows 最终 ZIP 启动与进程重启持久化验收。

## 构建与验证

- 游戏版本：`1.0.0`；内容版本：`reset-v1.0.0`；Tag：`v1.0.0`。
- VN Engine v2：`0.3.0`，固定提交 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。
- 正式 Release 仅在同一提交的主 Build、Web 最终 ZIP 验收、Windows 最终 ZIP 原生验收全绿后创建。
- 构建与验收报告/截图见[Release Actions](https://github.com/AureliusWu/RESET/actions/workflows/release.yml)中对应提交的 `web-validation`、`windows-validation` Artifact。

## 已知边界

- 本版无角色配音；4K 重绘、高预算手绘重制、精细 Boss 动画为后续增强。
- 三个早期路线开场原型仍保留于源内容数据中，已被正式章节替代，不在可达主流程中；完整路线验收明确记录此状态。
- 不包含旧四作迁移，也未改变锁定引擎。
- 游戏内容与专属素材保留全部权利，详见包内 `LICENSE.md`；VN Engine v2 及第三方依赖保留各自许可。
