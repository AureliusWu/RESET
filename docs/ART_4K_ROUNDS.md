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

- 恢复基线：`f87da7725af622e7b689d64143b96c8b1ae6039f`，2026-10-26。
- 状态：Round 2 completed。资产接入、Build、Release Web/Windows、显示、PWA、透明边缘与 4K 大屏复核全部通过。
- 来源：用户交接包 `RESET-Round2-LinWan-4K(1).zip`。导入前逐项核验原 MANIFEST 的 17 份文件大小和 SHA256，全部一致。没有重绘或以低分辨率试样替换母版。
- 参考画风：长黑发、灰蓝眼、米白针织外套、蓝白校服、蓝色蝴蝶结、深蓝百褶裙、白袜棕色乐福鞋、蓝色书本与黑色肩包；现代日系二维角色设定稿风格。
- Master：8 份 `2160×3840` RGBA PNG，目录 `game/assets/4k/characters/linwan/`。
- Runtime：8 份 `1080×1920` RGBA WebP，目录 `game/assets/4k/runtime/characters/linwan/`。
- 文件：`base / normal / neutral / smile / worried / sad / surprised / serious`。`base`、`normal` 是 neutral 的有意别名。
- 正式 asset ID：`linwan/neutral / linwan/smile / linwan/worried / linwan/surprised / linwan/serious`；ID、正文和其他五位女主均未改变，只切换这五个 `src`。
- `sad`、`base`、`normal` 保留为额外资产，未新增剧情引用。
- 构建会将全部 8 份 runtime 纳入 dist、build manifest、Service Worker 缓存及 Windows game/；4K PNG 作为仓库母版保存，不增加客户端下载负担。
- release audit 兼容精确的 4K runtime 路径，保留原有检查；额外核验 8 份安装图与源码字节一致、manifest SHA256 和离线清单。
- 本地：`art:check`、`art:audit`、`art:size`、`build`、`check:release`、`test:release`（62/62）通过。全项目仍有 51 项 master 留待后续轮次，不将迁移总表的 PLANNED 当成本轮已完成。
- 新增共享显示验收：从新游戏选择“观察林晚”看到首次登场；导入有效剧情存档查看五表情；实际 WebP 解码、Alpha、请求错误、表情动画；手机竖/横、小窗口、1080p、4K 浏览器视口截图。
- Web 最终 ZIP 增加 8 图实际缓存与断网显示检查；Windows 最终 ZIP 的原生 `RESET.exe → engine/VNEngine.exe → game/` 上复用五表情显示检查，原有退出/重启持久化测试保留。
- 浏览器视口、WebView2 内容仿真和实体屏幕验收分别记录，不将模拟当成实体 Android/Windows DPI 通过。

### 透明通道复核

早先将图像预览中的白块误判为不透明残留，逐像素读取后撤销该判断：例如 neutral runtime 的 `(441,1410)` 和 `(445,1380)` 实际为 `(255,255,255,0)`，Alpha 为零。这些透明像素存储的 RGB 残色不代表游戏会显示白块。实际 Web/Windows 截图也没有对应的白块。一次修边试样未采用，最终 8 份母版和 8 份 runtime 与交接包字节完全一致。

新增浏览器/WebView2 实际解码与深浅底合成像素断言；Web 另输出六个不同表情在 1080×1920 原尺寸、深浅背景上的截图，单独检查完整发丝、衣服和脚部。此 QA 图面与剧情界面截图分开记录，不能用对白遮住脚部代替边缘验收。`1797fbd3a56d69d4fd80086f376f3a18534b926f` 的 [Build 40281205437](https://github.com/AureliusWu/RESET/actions/runs/40281205437) 和 [Release 40281205695](https://github.com/AureliusWu/RESET/actions/runs/40281205695) 全部通过；下载并校验附件后目视检查六张深浅底图，未见白边、残块或脚部阴影异常。Web 41 项、Windows 原生 13 项，均零页面错误。

### 4K 大屏布局

原有 1280px 最大宽度在 3840×2160 视口形成偏窄的竖长舞台。新增仅在宽≥2000px、 高≥1000px 生效的大屏样式，扩展舞台最大宽度至 3200px，并相应增加正文与工具栏字号。小窗口、手机和 1920×1080 继续使用既有布局。浏览器验收新增实际舞台至少占大屏宽度 65% 的要求，最终截图与宽度断言已通过。

### 对应提交的 CI / 最终证据

- 美术提交 SHA：`70b75c7adf9a7b37dc53f7feaf3641815215dcb2`。
- 固定提交信息：`art(linwan): add production 4k sprite set`。
- [Build 回留 40279986681](https://github.com/AureliusWu/RESET/actions/runs/40279986681)：成功。
- [Release 回留 40279986686](https://github.com/AureliusWu/RESET/actions/runs/40279986686)：Web、Windows 均成功。
- 最终 Web ZIP：浏览器 39 项通过，零 page error；五表情、首次登场、表情动画和五组视口通过。
- 最终 Windows ZIP：原生 WebView2 12 项通过，零 page error，limitations 数组为空；实际 RESET.exe 启动链、首次登场、五表情、8 图解码、退出/重启正常。物理显示器 DPI 仍不等于内容 DPI 模拟。
- PWA：8 图实际 Service Worker 缓存、真实断网中显示新立绘、原有离线重载及 v1.1.0 同源升级通过。
- 下载复核四个 Release Artifact 的 SHA256 均与 GitHub digest 一致；另下载 Build Artifact，同样通过 digest 校验。
- 最终 Web 与 Windows 内层 ZIP 的 127 个 manifest 文件逐项通过大小及 SHA256 验证，两端 contentFingerprint 均为 `496a0ba6fbad4b`；均有 8 张 runtime，无 PNG master 混入客户端下载。
- Web ZIP SHA256：`72406805ab5c34e014cdf728a1e4e244e20677108c083be1ad48355bb6e40f3a`。
- Windows ZIP SHA256：`58813bfeb5a5504d437018b5d5e12d344afc1082e7f35044164cc4f762da938e`。
- 目视抽查：Web 390×844、844×390、1920×1080 与 Windows smile 的原生显示截图，角色身份、位置、比例与台词显示合理。透明区域错误判断已纠正，六种表情的原尺寸边缘复核通过。

### 完成门槛实录

| 门槛 | 结果 |
| --- | --- |
| 8 份 4K PNG + 8 份 runtime 真正写入 GitHub | 通过 |
| 正式五个 src 切换、原 asset ID 保留 | 通过 |
| art:check / art:audit / art:size / build / check:release | 通过 |
| test:release | 62/62 通过 |
| Build / Release Web / Release Windows | 通过 |
| 浏览器真实显示、五表情、动画、五视口 | 通过 |
| Windows 原生 smoke、五表情、退出/重启 | 通过 |
| dist / manifest / PWA cache / Windows package | 8 图均通过 |
| PWA offline / v1.1.0 升级 | 通过 |
| 无白边、无透明残块 | 原预览误判已纠正；原尺寸合成复核通过 |
| Round 3 / RC / 正式发布 / Pages 覆盖 | 未执行 |

透明合成、原尺寸截图与大屏布局修复均已验收；保持 v1.2.0-dev，不进入 Round 3，不创建 RC/正式 Release，不覆盖 v1.1.0 Pages，不改变引擎锁定。

### 最终完成记录

- 最终功能 SHA：`dd9f971bddae976c3c432058ce2894846ec0ffda`。
- [Build 40282090564](https://github.com/AureliusWu/RESET/actions/runs/40282090564)：成功。
- [Release 40282090602](https://github.com/AureliusWu/RESET/actions/runs/40282090602)：Web、Windows 均成功。
- 最终浏览器 41 项、Windows 原生 13 项通过，零页面错误；Node 回归 62/62。
- 4K 大屏解除模板 max-width 限制，舞台宽度断言和实际截图通过。
- 正式资产继续与原包逐字节一致；8 PNG master、8 WebP runtime、五个正式 asset ID 均验收通过。
- Round 2 completed；保持 v1.2.0-dev，未进入 Round 3，未覆盖正式 v1.1.0 Pages。

## Round 3 — 其余五位女主

- 用户已解除 Round 2 停止条件，授权连续执行 Round 3–10。
- 起始 main：`2895b9526985839fc0cc62d3f1dbe574fdd5b5d5`。
- 顺序：周小满 → 许栖 → 沈听澜 → 唐梨 → 乔南星。
- 状态：生成服务规格阻断，未完成；未进入 Round 4。
- 周小满 neutral 首次生成以林晚正式 PNG 为参考，明确请求 2160×3840 PNG RGBA、透明背景；服务实际返回 941×1672 RGBA。候选画风可用于研究，尺寸不满足 schema 2 master 要求，未切换正式引用。
- 未将低分辨率候选放大冒充 4K，未以同一图片复制五种表情，未将未完成轮次标为通过。
- 继续条件：生成服务能够返回实际符合最低规格的母版，或用户提供达标母版。API/CLI 备用路径依技能要求需明确选择，并配置 OPENAI_API_KEY；不得将密钥粘贴到聊天中。
- 当前正式资产、剧情、引擎锁定及 v1.1.0 Pages 保持原状。

### 2026-10-26 用户修订：ChatGPT 原图制作 4K 母版

- 原生尺寸阻断已解除；采用 ChatGPT 内置生成 + 明确标注的 Lanczos 4K 母版制作。
- 已制作周小满 5 表情、许栖 6 表情的 2160×3840 PNG 和 1080×1920 WebP；沈听澜 5 表情制作中，唐梨/乔南星 neutral 原图已生成。
- 原图、提示词、SHA256、实际原图尺寸与处理方法保存在 game/art-sources/chatgpt/；不宣称原生 4K。
- 当前为 Round 3 制作检查点，尚未切换其余五位的正式引用，未宣称 Web/Windows 验收完成。

### Round 3 正式接入候选

- 五位新增角色共 26 份 master + 26 份 runtime 已制作，原图与 provenance 完整保留。
- 六位女主共 31 个正式 asset ID 全部切换至 4K runtime；林晚原图未修改。
- art:check：56 个 production 引用、31 个已接入 4K 引用通过；六角色 master/runtime pairing 通过。
- Build、check:release、62/62 Node 回归通过；新提交的 Web/Windows 安装包验收待 Actions 确认，尚未标记 Round 3 completed。

### Round 3 Windows 验收修正

候选 `4ddddb8` Web 验收通过；Windows 首次重启探针使用 taskkill，WebView2 的异步存储后端未正常关闭，导致解锁记录丢失。将持久化探针改为真实窗口正常关闭，并在第一次与第二次进程重启后分别断言结局和 CG 保留；不降低解锁检查。强制清理仍仅用于启动前及测试结束。等待修正候选验收，尚未标记 Round 3 完成。

### Round 3 completed

最终候选 `f3f566559b8507ac3852614894fc10b50b02ee77`，Build [40289473030](https://github.com/AureliusWu/RESET/actions/runs/40289473030) 和 Release 验收 [40289473066](https://github.com/AureliusWu/RESET/actions/runs/40289473066) Web/Windows 均 success；26 个其余女主差分正式接入，62 项 Node 回归保留。正常关闭后的两次原生进程重启检查解锁与存档保留。自动进入 Round 4。

## Round 4 — 20 个背景

20 张 ChatGPT 原图生成并复核，教室/校门/画室时段变体保持构图。夜梧城时钟头部误生成日期已局部修正，只显示 18:42。执行环境重置后从已生成文件恢复原始像素；provenance 明示提示词按执行记录重建。母版 3840×2160 PNG、runtime 1920×1080 WebP；正式引用保持原 ID。新增背景舞台渲染及源图/母版/runtime 哈希门禁，等待最终 ZIP 双平台验收。

### Round 4 验收修复

`c03c83e` Web 最终 ZIP success；Windows 美术渲染检查通过后，被新增背景探针留在不可逆终章，后续导入按设计被拒绝。纯引擎 witness 生成未挂载作品 Meta 守卫，现共享 runtime 的不可逆场景清单，禁止将这些导出作为可回退的主游戏夹具。不可逆画面以标注的独立渲染夹具检查，真实 True Route 全程门禁保留。等待修正候选双平台结果。

### Round 4 completed

最终候选 `c820c84c5387c14d92e62f3db58365bfb5521c9e`，Release [40302785695](https://github.com/AureliusWu/RESET/actions/runs/40302785695) Web/Windows 均 success。20 背景正式引用全部迁移；46 个新增角色/背景实际解码与渲染通过；62 项 Node 回归通过。不可逆测试夹具问题已修复，正常重启与旧存档门禁保留。

## Round 5 — 5 个关键 CG

Round 5 completed。5 个关键 CG 已正式接入并通过 Build / Web / Windows 双平台验收。五个 CG 已全部切换为 `assets/4k/runtime/cg/*.webp`，对应 3840×2160 PNG 母版保存在 `game/assets/4k/cg/`；provenance 与 SHA256 保存在 `game/art-sources/chatgpt/cg/`。

- `faceless-reflection-cg`：雨中倒影提前动作。
- `letter-1842-cg`：18:42 来信；恢复母版 PNG IDAT 问题已修复。
- `six-chairs-cg`：六位女主 + 第七把空椅子。
- `linwan-1842-cg`：北站 18:42，使用正式林晚 4K 立绘与正式北站 4K 场景合成，强化明显雨夜。
- `true-end-riverside-cg`：使用正式林晚 4K 立绘与 `true-dawn` 4K 场景合成，明确 10 月 25 日暖晨光而非黄昏。

Runner 门禁：`art:audit:write`、`art:audit`、`art:check`、`build`、`check:release`、`test:release` 全部通过后才允许提交。保持 `v1.2.0-dev`，不进入 RC，不覆盖正式 `v1.1.0 Pages`。

### Round 5 completed

- 4K 审计：production 56 / 56，4K_READY 56，planned 0，undersized 0。
- Build 回留：Run `40357135795`，success。
- Release 回留：Run `40357135682`，Web success，Windows success。
- Web：最终 ZIP、PWA、离线缓存、浏览器验收通过。
- Windows：原生 host、RESET.exe 启动链、最终 ZIP、重启与持久化验收通过。
- 资产提交：`80958b048c35ba494011a1c71570a244637567f0`。
- 最终验证触发提交：`f5f5f0a03341f8ad1ae24c384152f4d6c31ad071`。
