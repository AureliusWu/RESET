# 4K 迁移轮次记录

## Round 1 — 资产盘点与命名冻结

- 基线：`15f5e89590ba988a74387743c05b7a589662a5f5`
- 状态：完成
- 冻结目录：`game/assets/4k/`
- 冻结原则：asset ID 不变，只替换 `src`
- production 映射：56 / 56
- 当前 4K 正式资产：0 / 56
- legacy SVG：保留为开发回退至 Round 8
- 自动审计：`scripts/audit-4k-art.mjs`
- CI：Build 增加 4K 映射完整性检查

## Round 2 — 林晚正式 4K 角色基准

- 状态：进行中；林晚 production runtime 位图已准备，4K master 尚未通过，不进入 Round 3
- 参考画风：长黑发、灰蓝眼、米白针织外套、蓝白校服、蓝色蝴蝶结、深蓝百褶裙、白袜棕色乐福鞋、蓝色书本与黑色肩包；现代日系二维角色设定稿风格
- 当前剧情正式 expression：`neutral / smile / worried / surprised / serious`
- 额外暂存：`sad`
- production runtime：`game/assets/generated-portraits/linwan-production/*.webp`
- asset ID 保持不变，仅替换 `src`
- `sad.webp` 暂存但当前剧情未引用
- runtime 位图不计作正式 4K master
- 正式 4K 目标：`game/assets/4k/characters/linwan/*.png`
- 4K runtime derivative：`game/assets/4k/runtime/characters/linwan/*.webp`
- 自动校验：`art:check` / `art:legacy` / `art:size`

恢复条件：将 runtime WebP 完整挂入 main 并通过 Build；随后继续补齐原生 4K PNG master，通过浏览器、Windows、PWA smoke 后再进入 Round 3。
