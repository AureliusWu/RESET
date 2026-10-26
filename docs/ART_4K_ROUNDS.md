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

- 状态：**外部资产生产阻断，未通过；禁止进入 Round 3**
- Round 2 起点：`4b729e851a2d523ed085cf1450adccff42da16d4`
- 最近完整代码闭环：`b5445652684614b45d63314cbdc7e834065556e7`
- 已确认正式剧情引用：`neutral / smile / worried / surprised / serious`
- 额外规划：`sad`
- 已生成但未接入：林晚角色设计/表情参考稿与整轮视觉参考稿；这些只作为设计参考，不是 production master
- 内置图像生成实测输出：`1536×1024` RGBA 参考稿，未达到 4K master 门槛，且输出为合成展示稿；禁止切图放大或机械 upscale 冒充正式资产
- 真 4K 生成服务实测：已请求单张林晚 `9:16 / 4K` production base，连接工作区 `Kokoro` 当前 credits 为 `0`，服务返回 workspace/account limitation，未创建正式 4K 任务
- 因此当前 production：仍使用既有 SVG，未替换任何林晚 `src`
- 正式目标：`game/assets/4k/characters/linwan/{base,neutral,smile,worried,sad,surprised,serious}.png`
- 运行时允许：`game/assets/4k/runtime/characters/linwan/*.webp`
- master/runtime 策略：已升级为 **4K PNG master + WebP runtime derivative**，冻结根目录 `game/assets/4k/` 不变
- 新增校验：`art:check` / `art:legacy` / `art:size`
- `npm run build` 当前顺序：先生成既有 build-time fallback，再执行 `art:check`；正式 4K 引用被删除、路径断裂、尺寸不足或角色 PNG 无 alpha 时直接失败
- 4K master 审计已增加 PNG 尺寸与透明通道检查
- Build run `106`（`b544565...`）：**success**
- Release run `71`：记录时 Web build/archive 已通过，Windows build/content validation/native startup smoke 已通过，最终 Web/Windows 发行验收仍在执行
- 正式 GitHub Release：仍为 `v1.1.0`
- Pages：本阶段没有触发稳定版发布或 Pages 部署；`pages.yml` 仍只接受手动触发或 stable release published

### 本轮已提交

- `fa876c48c369389828f08ac5f8ac315d2e352d98` — `test(art): enforce production art integrity`
- `cbf1bf1e8f07453eea303e9984310161e69fbc10` — `test(art): wire art integrity into build`
- `8e2cd7a3be914c18ef686ec1cf36455df31a40bf` — `art(plan): define 4k master and runtime derivatives`
- `8d9d48bff983d2ef168dfd91225c1607236e5f06` — `test(art): audit 4k masters and alpha`
- `b5445652684614b45d63314cbdc7e834065556e7` — `fix(art): validate generated production assets after build`

### 恢复条件

获得**原生达到最低尺寸、带透明通道、同底模一致**的林晚 `base/neutral/smile/worried/sad/surprised/serious` PNG 后：

1. 写入 `game/assets/4k/characters/linwan/`
2. 保持原 asset ID，仅更新 `zz-art-v1.json` 对应 `src`
3. 生成/校验 runtime derivative（如启用）
4. 执行 `art:check` / Build / Web 浏览器 / Windows smoke / PWA cache 验收
5. 通过后提交 `art(linwan): add production 4k sprite set`
6. 自动进入 Round 3

Round 3–10 在 Round 2 正式通过前保持门禁关闭，避免把低清参考稿或未接入素材伪装成已完成生产资产。
