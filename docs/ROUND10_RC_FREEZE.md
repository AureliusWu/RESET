# Round 10 — v1.2.0-rc.1 冻结验收

状态：**validation pending**

- Round 9 完成基线：`d1cb09c3775775e478c6e0c4967049d8360ee783`
- RC 版本契约提交：`9481dfb46ef586836233971362f93dce187f5b20`
- 当前候选：`v1.2.0-rc.1` / `reset-v1.2.0-rc.1`
- VN Engine v2：继续锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`

## 冻结内容

- package、作品 storyVersion、Build / Release 断言及候选产物名统一进入 `v1.2.0-rc.1`。
- `reset-v1.2.0-dev` 被纳入受控旧存档升级来源；v1.0.0、v1.0.1、v1.1.0 兼容链继续保留。
- 4K 资产保持 Round 9 冻结结果：58 / 58 production 4K 引用，无正式 SVG fallback；5 张 UI 关键视觉保持正式 runtime。
- 冻结前本地门禁已通过：严格 4K 审计、art:check、build、check:release、62 / 62 Node 回归。

## 本轮验收条件

本文件提交用于触发最终 RC 状态的 `Build 回留` 与 `Release 回留`。只有同一提交上的 Build、Web 最终 ZIP/PWA、Windows x64 原生包、WebView2、存档升级、离线与重启持久化全部通过，Round 10 才可标记 completed。

## 边界

本轮冻结 Release Candidate，不创建 `v1.2.0` 正式 Release，不覆盖正式 `v1.1.0 Pages`。实体 Android、实体 Windows 显示器/DPI、公开 HTTPS 候选站点与更多实际玩家反馈仍属于人工验收边界，不以 CI 或模拟证据冒充完成。
