# Round 10 — v1.2.0-rc.1 冻结验收

状态：**completed**

- Round 9 完成基线：`d1cb09c3775775e478c6e0c4967049d8360ee783`
- RC 版本契约提交：`9481dfb46ef586836233971362f93dce187f5b20`
- 最终 RC 验收 SHA：`3a3442f0af075b2b11c1cc57c1645b7b372c9ed1`
- 当前候选：`v1.2.0-rc.1` / `reset-v1.2.0-rc.1`
- VN Engine v2：继续锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- Build 回留：Run `40411223632` — **success**
- Release 回留：Run `40411223838` — **Web success / Windows success**

## 冻结内容

- package、作品 storyVersion、Build / Release 断言及候选产物名统一进入 `v1.2.0-rc.1`。
- `reset-v1.2.0-dev` 被纳入受控旧存档升级来源；v1.0.0、v1.0.1、v1.1.0 兼容链继续保留。
- 4K 资产保持 Round 9 冻结结果：58 / 58 production 4K 引用，无正式 SVG fallback；5 张 UI 关键视觉保持正式 runtime。
- 冻结前本地门禁通过：严格 4K 审计、art:check、build、check:release、62 / 62 Node 回归。
- 最终 Build 对同一 RC SHA 再次完成语法检查、4K 映射、打包、发行完整性、回归与 `reset-v1.2.0-rc.1` 版本断言。

## 最终 RC 验收

- Web：最终 `v1.2.0-rc.1` Web ZIP 通过解压后完整浏览器验收、v1.1.0 → rc.1 升级 fixture、PWA / 离线 / 存档 / Meta / 结局 / CG / 战斗 / 响应式回归。
- Windows：最终 `v1.2.0-rc.1` x64 ZIP 通过原生 host、`RESET.exe → VNEngine.exe → game/`、实际窗口烟测、解压后 WebView2、存档/Meta、退出与重启持久化验收。
- RC Build artifact：`RESET-huiliu-v1.2.0-rc.1`，digest `sha256:33197ba38154295bcabb69bdc1f4a937bd658f357cabe0ed6fea2f1f4f6b6f12`。
- RC Web artifact：`RESET-huiliu-v1.2.0-rc.1-web`，digest `sha256:4368588d3d42333e0408f2e5f4103c7870e63344ba813264fcc43cd4289efdb6`。
- RC Windows artifact：`RESET-huiliu-v1.2.0-rc.1-win-x64`，digest `sha256:05e3975939d41c14046e0c89105fde40ba0754e8e8ecae8a515c611be8ff2b48`。
- 验收证据另有 `RESET-huiliu-v1.2.0-rc.1-web-validation` 与 `RESET-huiliu-v1.2.0-rc.1-windows-validation`。

## CI 证据

- Build: https://github.com/AureliusWu/RESET/actions/runs/40411223632
- Release: https://github.com/AureliusWu/RESET/actions/runs/40411223838

## 边界

Round 10 完成的是 **Release Candidate 冻结与自动化发行候选验收**。本轮没有创建 `v1.2.0` 正式 Release，没有覆盖正式 `v1.1.0 Pages`。

实体 Android、实体 Windows 显示器/DPI、公开 HTTPS 候选站点与更多实际玩家反馈仍属于人工验收边界；本记录不把 CI、浏览器模拟或托管 Windows runner 冒充为这些人工/实体设备验收。

后续若推进正式 `v1.2.0`，应以本 RC 验收 SHA 与上述边界为输入，不重新打开 Round 1–9 的 4K 迁移工作，除非发现明确回归。
