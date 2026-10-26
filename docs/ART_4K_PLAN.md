# 《回留》4K 正式美术迁移规范

状态：`v1.2.0-rc.1` / 4K 迁移完成，RC 冻结阶段。

核心规则：**asset ID 不变，只替换 `src`。** 现有剧情、存档、Ending、CG 解锁和 Meta 均不因美术升级迁移。

## 冻结目录

```text
game/assets/4k/
├─ asset-plan.json
├─ characters/{character}/{expression}.webp
├─ backgrounds/{assetId}.webp
├─ cg/{assetId}.webp
├─ anomalies/{id}.webp
└─ ui/{id}.webp
```

## 最低规格

| 类型 | 最低画布 | 格式 |
| --- | --- | --- |
| 角色立绘 | 2160×3840 | WebP alpha |
| 背景 | 3840×2160 | WebP |
| CG | 3840×2160 | WebP |
| 异常体 / Boss | 2160×3840 | WebP alpha |
| UI 关键视觉 | 3840×2160 | WebP |

禁止将旧 SVG 直接栅格放大后冒充正式 4K 重绘。

## 角色矩阵

| 角色 | 当前 production | 必须保留差分 | 额外差分 | 轮次 |
| --- | ---: | --- | --- | ---: |
| 林晚 | 5 | neutral / smile / worried / surprised / serious | sad | 2 |
| 周小满 | 5 | neutral / smile / worried / surprised / serious | — | 3 |
| 许栖 | 6 | neutral / smile / worried / surprised / serious / angry | — | 3 |
| 沈听澜 | 5 | neutral / smile / worried / surprised / serious | — | 3 |
| 唐梨 | 5 | neutral / smile / worried / surprised / serious | — | 3 |
| 乔南星 | 5 | neutral / smile / worried / surprised / serious | — | 3 |

林晚先作为整个角色系统的视觉基准。其余五人必须对齐她的线稿粗细、脸部抽象程度、阴影层级、材质复杂度和色彩密度。

## 背景矩阵（20）

`classroom-rain`、`school-gate-rain`、`school-gate-evening`、`home-corridor`、`station-night`、`night-wucheng`、`school-morning`、`archive-room`、`cafeteria`、`rooftop-evening`、`stairwell-morning`、`riverside-dusk`、`underpass-rain`、`classroom-dawn`、`old-art-room`、`night-art-room`、`old-stationery`、`north-station`、`save-room`、`true-dawn`。

统一映射到 `assets/4k/backgrounds/{assetId}.webp`。

## CG 矩阵（5）

`faceless-reflection-cg`、`letter-1842-cg`、`six-chairs-cg`、`linwan-1842-cg`、`true-end-riverside-cg`。

统一映射到 `assets/4k/cg/{assetId}.webp`。

## 异常体 / Boss

- `assets/ch-faceless.svg` → `assets/4k/anomalies/faceless.webp`
- `assets/ch-echo-chen.svg` → `assets/4k/anomalies/echo-chen.webp`

## UI 关键视觉

- `assets/ui-title-mark.svg` → `assets/4k/ui/title-key-visual.webp`
- `assets/ui-save-anomaly.svg` → `assets/4k/ui/save-anomaly.webp`
- 新增 `ending-collection-header.webp`
- 新增 `cg-gallery-header.webp`
- 新增 `combat-hud-key-visual.webp`

结构 UI、按钮、对话框和布局继续由 CSS / DOM / 可缩放图形承担，不把整套 UI 烘成一张 4K 图。

## 自动审计

```bash
npm run art:audit
npm run art:audit:write
node scripts/audit-4k-art.mjs --strict
```

默认审计要求所有当前 production asset 都存在冻结映射，但允许 4K 文件仍在逐轮迁移。第 8～10 轮启用 `--strict`：缺失或尺寸不足即失败。

## 轮次

1. 盘点与命名冻结
2. 林晚 4K 基准
3. 其余五位女主
4. 20 个背景
5. 5 个关键 CG
6. 异常体 / Boss
7. UI 关键视觉
8. legacy SVG 正式流程审计
9. 全游戏视觉验收
10. 恢复 `v1.2.0-rc.1` 冻结流程

旧 SVG 生成链在第 8 轮前仅作为开发回退；不提前删除，以保证逐轮替换期间始终可构建、可恢复。

## 2026-10-26 母版制作流程修订（用户授权）

ChatGPT 内置图像生成产出原图，再通过可复现的像素处理制作 4K PNG 母版和半尺寸 WebP。原图尺寸不再作为生成服务阻断；必须记录实际原图尺寸、SHA256、提示词和处理方法，不能宣称为原生 4K 生成。禁止将旧 SVG 栅格放大后冒充新美术。

正式目录以 schema 2 `asset-plan.json` 为准：`assets/4k/{category}/*.png` 保存制作母版，`assets/4k/runtime/{category}/*.webp` 用于游戏。角色为 2160×3840 PNG RGBA + 1080×1920 WebP；横向图为 3840×2160 PNG + 1920×1080 WebP。原图和 provenance 保存在 `game/art-sources/chatgpt/`，不进入客户端和离线缓存。

角色差分由 ChatGPT 编辑独立表情；制作时锁定 neutral 的身体与轮廓，仅合成经复核的表情区域，以避免服装和人体比例随表情漂移。林晚 Round 2 资产保持原样。
