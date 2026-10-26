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

- 状态：进行中；运行时 production 位图已接入规划，4K master 尚未通过，不进入 Round 3
- 参考画风已重新收拢：长黑发、灰蓝眼、米白针织外套、蓝白校服、蓝色蝴蝶结、深蓝百褶裙、白袜棕色乐福鞋、蓝色书本与黑色肩包；现代日系二维角色设定稿风格
- 当前剧情正式 expression：`neutral / smile / worried / surprised / serious`
- 额外暂存：`sad`
- production 运行时目标：`game/assets/generated-portraits/linwan-production/*.webp`
- 5 个正式 expression 的 asset ID 保持不变，仅替换 `src`
- `sad.webp` 暂存但不新增剧情 asset ID，因为当前正式剧情未引用 sad
- 运行时位图用于纠正旧 SVG production 画风偏移；不计作正式 4K master
- 正式 4K 目标仍为：`game/assets/4k/characters/linwan/*.png`
- 运行时 4K derivative 仍允许：`game/assets/4k/runtime/characters/linwan/*.webp`
- master/runtime 策略：4K PNG master + WebP runtime derivative，冻结根目录 `game/assets/4k/` 不变
- 自动校验：`art:check` / `art:legacy` / `art:size`
- `npm run build` 已接入 production art integrity；正式资源路径断裂时直接失败
- 4K master 审计继续检查 PNG 尺寸与透明通道

恢复条件：以当前林晚参考画风和运行时位图为视觉基准，补齐原生达到最低尺寸、带透明通道、同底模一致的 `base/normal/smile/worried/sad/surprised/serious` 4K PNG master，写入 `game/assets/4k/characters/linwan/`；执行 `art:check`、Build、浏览器与 Windows smoke，通过后再提交 `art(linwan): add production 4k sprite set` 并进入 Round 3。
