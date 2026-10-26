from pathlib import Path

p = Path('docs/ART_4K_ROUNDS.md')
s = p.read_text(encoding='utf-8')
marker = '## Round 7 — UI 关键视觉'
if marker in s:
    raise SystemExit('Round 7 completion record already exists')

record = r'''

## Round 7 — UI 关键视觉

Round 7 completed。5 张 UI 关键视觉已制作、接入最终运行时并通过 Build / Web / Windows 双平台验收。结构性按钮、对话、存档槽、收藏列表和战斗交互继续由 DOM/CSS/Canvas 驱动，没有把整套 UI 烘成不可交互大图。

- `title-key-visual`：序章 18:42 标题关键视觉；雨夜梧城、时钟与 RESET 标题语义。
- `save-anomaly`：存档管理异常视觉；10 月 17 日 18:42 / 读取痕迹 / “不要再读取了”。
- `ending-collection-header`：结局收藏头图；六条路线与第七个空位。
- `cg-gallery-header`：CG 图鉴头图；幸存帧 / 读档后仍留下的画面。
- `combat-hud-key-visual`：战斗 HUD 底层关键视觉；时间瞄准环、残响与节奏破环语义。
- 五项均保留新 ChatGPT 编写矢量源与 1920×1080 原始 PNG；正式母版为 3840×2160 PNG，runtime 为 1920×1080 WebP。`provenance.json` 记录提示词、处理链和 source/original/master/runtime SHA256，明确 `native4kClaim=false`；旧 `ui-title-mark.svg` / `ui-save-anomaly.svg` 未作为 4K 像素来源。
- 新增 `game/runtime/ui.mjs` 作为独立 UI 视觉桥：标题、存档、结局收藏、CG 图鉴和战斗层按运行态挂载；原 archive/combat 核心交互逻辑保持解耦。
- 构建将 5 个 runtime 全部写入 dist、build manifest、Service Worker 离线缓存及 Windows game/；新增扩展标识 `reset-ui-key-visual-v1`。
- 4K 故事 production 审计继续保持 58 / 58、4K_READY 58、planned 0、undersized 0、missing alpha 0；UI 作为非剧情 registry 资产单独加入 `art:check`，最终门禁为 `5 UI key visual(s)` 全部通过。
- 资产提交：`e18930a99d8711badc21295f2dc659817724908c`。
- 运行时集成提交：`26c9635f4862995979135f1e06efc9788fd3c2de`。
- Build 回留：Run `40363479177`，success；`release-integrity-ok`，Node 回归 `62 / 62`，UI 4K pairing `5 / 5`。
- Release 回留：Run `40363479047`，Web success、Windows success。Web 最终 ZIP / PWA / 离线浏览器验收通过；Windows 原生 host / RESET.exe 启动链 / 最终 ZIP / 重启持久化验收通过。
- 保持 `v1.2.0-dev`；未进入 RC，未创建正式 Release，未覆盖正式 `v1.1.0 Pages`。
- 下一轮：Round 8 — legacy SVG 清理与最终 4K / 引用审计。
'''

p.write_text(s.rstrip() + record + '\n', encoding='utf-8')
