# 《回留》4K 美术自动审计

基线提交：`15f5e89590ba988a74387743c05b7a589662a5f5`

## Round 1 盘点

- 当前 production 视觉资产：56
- 角色差分：31
- 背景：20
- CG：5
- `game/assets/` 源树 SVG：35
- 当前正式 4K WebP：0
- 已冻结 production → 4K 映射：56 / 56
- 额外规划：8（林晚 sad、2 个异常体、5 个 UI 关键视觉）

## 结论

当前所有正式流程视觉仍由 SVG production / 构建生成 SVG 承载。Round 1 只冻结路径与替换策略，不删除任何回退资产。

Round 2 起按角色/场景逐项写入 `game/assets/4k/` 并通过相同 asset ID 覆盖 `src`。这使存档、路线、Ending、Gallery 与 Meta 不需要迁移。

## 角色目标

- 林晚：`assets/4k/characters/linwan/{expression}.webp`
- 周小满：`assets/4k/characters/xiaoman/{expression}.webp`
- 许栖：`assets/4k/characters/xuqi/{expression}.webp`
- 沈听澜：`assets/4k/characters/tinglan/{expression}.webp`
- 唐梨：`assets/4k/characters/tangli/{expression}.webp`
- 乔南星：`assets/4k/characters/nanxing/{expression}.webp`

## 其他目标

- 20 背景：`assets/4k/backgrounds/{assetId}.webp`
- 5 CG：`assets/4k/cg/{assetId}.webp`
- 无面行人：`assets/4k/anomalies/faceless.webp`
- 第七人残响：`assets/4k/anomalies/echo-chen.webp`
- UI：`assets/4k/ui/`

后续以 `npm run art:audit` 的实时输出为准；Round 8 开始使用 `--strict` 作为 4K 发布门禁。
