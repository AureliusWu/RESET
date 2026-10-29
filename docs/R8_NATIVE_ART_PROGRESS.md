# R8 原生美术补齐候选进度

状态：原生素材 46/46 已入库；本轮授权 AI 模拟人工美术验收 12/12 PASS，最终包回归见当前 PR Checks。

## 文件落地

| 类别 | 本轮目标 | 已生成 | 已入 GitHub |
| --- | ---: | ---: | ---: |
| 配角立绘（徐嘉树之外） | 11 | 11 | 11 |
| 异常体 | 2 | 2 | 2 |
| 替换 CG | 8 | 8 | 8 |
| 专用场景背景 | 20 | 20 | 20 |
| UI 主视觉 | 5 | 5 | 5 |
| 本轮合计 | 46 | 46 | 46 |

徐嘉树先导立绘已入库，故配角共 12/12 拥有原生候选。每项入库素材保留原始 PNG、处理后的 master、runtime WebP、规格、实际 prompt 与 SHA256/provenance。原生输出再标准化为 4K 母版，未声称 native 4K。

2026-10-29 已恢复 UI ZIP（57,143,636 字节），按三批低于 25 MB 提交全部 15 个真实图片文件，并将原图、母版、runtime 与匹配的原生 prompt/spec/provenance 原子接入正式路径。`game/visual/r8-ui-transfer-pending.json` 保留原断点文件名，状态已改为 `UPLOADED`，记录三次二进制提交与逐项 SHA256；生产来源仍以各素材 provenance 为准。

## 接入

- `r8-scene-background-plan.json` 的 23 处背景映射已应用；82 个 Scene、Line/choice/asset ID 与正文逻辑保留。
- manifest 现在含 45 立绘、40 背景、11 CG；加上 21 音频为 117 项。另有 5 张 UI 装饰图。
- 六位女主已批准 runtime 图片保持原 SHA256。8 张 CG 保留原 Asset ID，通过新 WebP 接入原剧情引用。
- 配角仍由 `visual-acceptance.json` 决定显示。2026-10-29 用户明确要求“验收由你来模拟人类执行”；12 人已完成有逐项观察、授权和报告/图片 SHA256 绑定的 AI 模拟人工审核，生产 speaker mapping 由既有工具启用。owner 本人审核 0、AI 模拟人工审核 12，分别记录。
- 陈岚只出现在 `noSprite` 正文场景；保留此规则，在独立审核 fixture 预览其立绘。
- 下列 3 场景没有现有路线 witness：`focus_linwan_open`、`focus_xiaoman_open`、`focus_xuqi_open`。审核分别记录 79 个真实路线 witness 与 3 个独立背景 fixture，不伪造可达存档。

## 检查与边界

- `npm run art:r8` 严格检查全部 46 项原生来源链；当前 46/46、missing=[]。映射检查在严格与 `--partial` 两种模式均执行。
- `npm run build`、`npm run check:release` 为候选技术检查；`npm run check:stable` 保留人工验收门禁并严格要求全部原生资源。
- `npm run test:art:r8` 从最终解压 Web 包检查图片解码、Alpha、82 场景背景、4 种视窗中的配角/异常体布局、真实离线哈希及 reload；输出 `test-results/r8-art/audit.json` 和截图。仅退出 0 与报告存在才可记技术通过。
- Release 工作流在 PR / 普通开发提交执行候选技术验收、严格 `art:r8`、最终 Web ZIP 浏览器验收与 Windows 原生 ZIP 验收。正式发布提交在 Web/Windows 打包前仍强制 `check:stable`，publish 在任何 tag/Release 写入前再次校验已记录的授权视觉验收；PR 绿色只代表候选技术检查通过。
- 既有完整 UI 候选 78/78 回归通过。本轮增加授权审核校验与剧情 CG 重复立绘回归，修改后的严格检查和最终包结果见当前 PR Checks；结束前不记通过。
- 浏览器视窗模拟不等于 Android 实机或 Windows 原生验收；Windows CI 通过也不冒充实体 Windows/DPI 或 Android 实机签收。
- 按 AGENTS.md / R8 发布边界：自动截图、Build、SHA256 不单独授予 ART_PASS；本轮根据用户明确授权完成 AI 模拟人工视觉审阅，详见 `R8_AI_REVIEW.md`。当前不覆盖稳定 tag、Release 或 Pages。

## 已入库素材审核入口

下列原生资源已进行 AI 模拟人工视觉审核；12 名配角 PASS 已记录，最终包技术状态由当前 PR Checks 提供。

### portraits

| ID | 名称 | runtime |
| --- | --- | --- |
| xujiashu | 徐嘉树 | [WebP](../game/assets/4k/runtime/characters/xujiashu/neutral.webp) |
| chengyan | 程妍 | [WebP](../game/assets/4k/runtime/characters/chengyan/neutral.webp) |
| gumingyuan | 顾明远 | [WebP](../game/assets/4k/runtime/characters/gumingyuan/neutral.webp) |
| chenlan | 陈岚 | [WebP](../game/assets/4k/runtime/characters/chenlan/neutral.webp) |
| xurong | 许蓉 | [WebP](../game/assets/4k/runtime/characters/xurong/neutral.webp) |
| luoxiumei | 罗秀梅 | [WebP](../game/assets/4k/runtime/characters/luoxiumei/neutral.webp) |
| suyao | 苏遥 | [WebP](../game/assets/4k/runtime/characters/suyao/neutral.webp) |
| hechuan | 何川 | [WebP](../game/assets/4k/runtime/characters/hechuan/neutral.webp) |
| jiyao | 纪尧 | [WebP](../game/assets/4k/runtime/characters/jiyao/neutral.webp) |
| lincheng | 林澄 | [WebP](../game/assets/4k/runtime/characters/lincheng/neutral.webp) |
| shenyanqiu | 沈砚秋 | [WebP](../game/assets/4k/runtime/characters/shenyanqiu/neutral.webp) |
| liangcheng | 梁成 | [WebP](../game/assets/4k/runtime/characters/liangcheng/neutral.webp) |

### anomalies

| ID | 名称 | runtime |
| --- | --- | --- |
| faceless | 无面行人 | [WebP](../game/assets/4k/runtime/anomalies/faceless.webp) |
| echo-chen | 第七人 / 陈渡残响 | [WebP](../game/assets/4k/runtime/anomalies/echo-chen.webp) |

### cgs

| ID | 名称 | runtime |
| --- | --- | --- |
| linwan-1842-cg | 北站18:42最终约定 | [WebP](../game/assets/4k/runtime/cg/linwan-1842-cg.webp) |
| true-end-riverside-cg | 雨停以后·明天见 | [WebP](../game/assets/4k/runtime/cg/true-end-riverside-cg.webp) |
| route-linwan-end-cg | 这一轮也算数 | [WebP](../game/assets/4k/runtime/cg/route-linwan-end-cg.webp) |
| route-xiaoman-end-cg | 今天别重来 | [WebP](../game/assets/4k/runtime/cg/route-xiaoman-end-cg.webp) |
| route-xuqi-end-cg | 留在被放弃的世界 | [WebP](../game/assets/4k/runtime/cg/route-xuqi-end-cg.webp) |
| route-tinglan-end-cg | 未归档的人 | [WebP](../game/assets/4k/runtime/cg/route-tinglan-end-cg.webp) |
| route-tangli-end-cg | 向前跑 | [WebP](../game/assets/4k/runtime/cg/route-tangli-end-cg.webp) |
| route-nanxing-end-cg | 已读不回 | [WebP](../game/assets/4k/runtime/cg/route-nanxing-end-cg.webp) |

### backgrounds

| ID | 名称 | runtime |
| --- | --- | --- |
| wucheng-street-evening | 梧城雨后街头 | [WebP](../game/assets/4k/runtime/backgrounds/wucheng-street-evening.webp) |
| municipal-archive-basement | 市档案馆地下库 | [WebP](../game/assets/4k/runtime/backgrounds/municipal-archive-basement.webp) |
| archive-rooftop-evening | 市档案馆楼顶 | [WebP](../game/assets/4k/runtime/backgrounds/archive-rooftop-evening.webp) |
| abandoned-station-entrance | 废弃站口 | [WebP](../game/assets/4k/runtime/backgrounds/abandoned-station-entrance.webp) |
| information-lab | 梧城一中信息教室 | [WebP](../game/assets/4k/runtime/backgrounds/information-lab.webp) |
| chendu-home-morning | 陈渡家清晨 | [WebP](../game/assets/4k/runtime/backgrounds/chendu-home-morning.webp) |
| city-desync-afternoon | 梧城市区错位 | [WebP](../game/assets/4k/runtime/backgrounds/city-desync-afternoon.webp) |
| north-station-control | 梧城北站控制室 | [WebP](../game/assets/4k/runtime/backgrounds/north-station-control.webp) |
| night-school-corridor | 夜梧城旧教学楼走廊 | [WebP](../game/assets/4k/runtime/backgrounds/night-school-corridor.webp) |
| night-school-exit | 夜梧城旧教学楼出口 | [WebP](../game/assets/4k/runtime/backgrounds/night-school-exit.webp) |
| night-nanhu-station | 夜梧城南湖站 | [WebP](../game/assets/4k/runtime/backgrounds/night-nanhu-station.webp) |
| night-clocktower | 夜梧城钟楼下 | [WebP](../game/assets/4k/runtime/backgrounds/night-clocktower.webp) |
| river-levee-evening | 城外江堤 | [WebP](../game/assets/4k/runtime/backgrounds/river-levee-evening.webp) |
| municipal-archive-workroom | 市档案馆修复工作室 | [WebP](../game/assets/4k/runtime/backgrounds/municipal-archive-workroom.webp) |
| nanhu-station-exit | 南湖站出口 | [WebP](../game/assets/4k/runtime/backgrounds/nanhu-station-exit.webp) |
| information-rooftop-evening | 信息楼天台 | [WebP](../game/assets/4k/runtime/backgrounds/information-rooftop-evening.webp) |
| old-art-room-evening | 旧美术教室夜间 | [WebP](../game/assets/4k/runtime/backgrounds/old-art-room-evening.webp) |
| underpass-exit-evening | 下穿通道出口 | [WebP](../game/assets/4k/runtime/backgrounds/underpass-exit-evening.webp) |
| north-station-after1842 | 北站时间向前 | [WebP](../game/assets/4k/runtime/backgrounds/north-station-after1842.webp) |
| north-station-vanishing | 正在消失的北站 | [WebP](../game/assets/4k/runtime/backgrounds/north-station-vanishing.webp) |

### ui

| ID | 名称 | runtime |
| --- | --- | --- |
| title-key-visual | 标题页主视觉 | [WebP](../game/assets/4k/runtime/ui/title-key-visual.webp) |
| save-anomaly | 存档异常主视觉 | [WebP](../game/assets/4k/runtime/ui/save-anomaly.webp) |
| ending-collection-header | 结局收藏主视觉 | [WebP](../game/assets/4k/runtime/ui/ending-collection-header.webp) |
| cg-gallery-header | CG画廊主视觉 | [WebP](../game/assets/4k/runtime/ui/cg-gallery-header.webp) |
| combat-hud-key-visual | 战斗页面主视觉 | [WebP](../game/assets/4k/runtime/ui/combat-hud-key-visual.webp) |
