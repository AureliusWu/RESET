# Round 9 — 全游戏视觉验收

状态：**completed**

- 验收 SHA：`fcac4432f0fc0098a692d3b8954fca1209c8b2e3`
- Round 9 Workflow Run：`40409772370`
- Build 回留：Run `40409772492` — success
- Release 回留：Run `40409772102` — Web / Windows success
- 完成时间：`2026-10-26T22:09:31.179389Z`

## 验收覆盖

- production 4K 引用：58 / 58，全部为 `assets/4k/runtime/`，无正式 SVG fallback。
- 非林晚 production 图像：53 项逐项真实浏览器解码，并在剧情存档或明确标记的独立 renderer fixture 中渲染。
- 林晚：8 份 runtime derivative 全部解码；五个正式表情使用真实剧情帧；另完成 390×844、844×390、800×600、1920×1080、3840×2160 五组布局验收与深/浅底 Alpha 合成复核。
- UI 关键视觉：5 / 5，标题、存档异常、结局收藏、CG 图鉴、战斗 HUD 均在实际游戏界面显式挂载并解码为 1920×1080 runtime WebP。
- 浏览器整包验收：41 项检查通过，包含剧情/存档/Meta/结局/CG/战斗/响应式/PWA 离线链。
- 同 SHA `Build 回留` 与 `Release 回留` 均通过；Release Web 继续执行 v1.1.0 → v1.2.0-dev PWA 升级验收，Windows 继续执行原生 host、`RESET.exe → VNEngine.exe → game/`、最终 ZIP、WebView2 和重启持久化验收。

## 边界

Round 9 只做视觉与发行候选前验收，不改变剧情、asset ID、引擎锁定或正式版本。当前仍为 `v1.2.0-dev`；未创建 RC、未创建正式 Release、未覆盖 `v1.1.0 Pages`。下一轮按冻结计划进入 **Round 10 — 恢复 `v1.2.0-rc.1` 冻结流程**。

## CI 证据

- Build: https://github.com/AureliusWu/RESET/actions/runs/40409772492
- Release: https://github.com/AureliusWu/RESET/actions/runs/40409772102
- Round 9 evidence artifact: `RESET-round9-visual-acceptance-fcac4432f0fc0098a692d3b8954fca1209c8b2e3`（包含浏览器截图、production-art/林晚验收 JSON、5 张 UI 关键视觉截图与验收 JSON）。
