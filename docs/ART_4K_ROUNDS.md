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

- 状态：阻断中，未通过，不进入 Round 3
- 当前真实 main 起点：`4b729e851a2d523ed085cf1450adccff42da16d4`
- 已确认正式剧情引用：`neutral / smile / worried / surprised / serious`
- 额外规划：`sad`
- 已生成：林晚角色设计/表情参考稿（仅参考，未接入 production）
- 未接入原因：当前内置图像生成输出原生尺寸不足真实 4K master 要求；禁止机械 upscale 冒充正式原画
- 当前 production：仍使用既有 SVG，未替换 `src`
- 正式目标：`game/assets/4k/characters/linwan/*.png`
- 运行时允许：`game/assets/4k/runtime/characters/linwan/*.webp`
- master/runtime 策略：已升级为 4K PNG master + WebP runtime derivative，冻结根目录 `game/assets/4k/` 不变
- 新增校验：`art:check` / `art:legacy` / `art:size`
- `npm run build` 已接入 production art integrity；正式 4K 引用被删除或路径断裂时直接失败
- 4K master 审计已增加 PNG 尺寸与透明通道检查
- 本轮已提交：
  - `fa876c48c369389828f08ac5f8ac315d2e352d98` — `test(art): enforce production art integrity`
  - `cbf1bf1e8f07453eea303e9984310161e69fbc10` — `test(art): wire art integrity into build`
  - `8e2cd7a3be914c18ef686ec1cf36455df31a40bf` — `art(plan): define 4k master and runtime derivatives`
  - `8d9d48bff983d2ef168dfd91225c1607236e5f06` — `test(art): audit 4k masters and alpha`
- CI：`8d9d48bff983d2ef168dfd91225c1607236e5f06` Build / Release 已触发，记录更新时仍在执行
- 最近完整闭环 SHA：`8d9d48bff983d2ef168dfd91225c1607236e5f06`

恢复条件：获得原生达到最低尺寸、带透明通道、同底模一致的林晚 `base/normal/smile/worried/sad/surprised/serious` PNG 后，写入 `game/assets/4k/characters/linwan/`，更新 `zz-art-v1.json` 仅替换对应 `src`，执行 `art:check`、Build、浏览器与 Windows smoke，通过后提交 `art(linwan): add production 4k sprite set`，再进入 Round 3。
