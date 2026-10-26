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
- 状态：资产接入、Build、Release Web/Windows、显示及 PWA 技术验收全部通过；透明边缘视觉验收仍有阻断，不能宣布 Round 2 completed。
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

### 当前视觉阻断

原包有真实透明像素，但 neutral/smile 等图在腿部、发丝外缘仍有不透明白色方块及少量彩色残点。仅 RGBA/header 合格无法证明抠图完成。已试用图像技能清理 neutral；试样只有 `941×1672`，且边缘仍未完全干净，故弃用，原母版和 runtime 字节保持交接包一致。

在满足原画风、母版尺寸且边缘干净的正式资产通过之前，保持 Round 2 进行中，不进入 Round 3，不创建 RC/正式 Release，不部署或覆盖 v1.1.0 Pages，不改变 VN Engine v2 锁定。

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
- 目视抽查：Web 390×844、844×390、1920×1080 与 Windows smile 的原生显示截图。角色身份、位置、比例与台词显示合理；原素材白块残点仍以未通过登记，不能以缩小显示或对白遮住脚部代替边缘合格。

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
| 无白边、无透明残块 | **未通过，阻断 Round 2 完成** |
| Round 3 / RC / 正式发布 / Pages 覆盖 | 未执行 |

该 SHA 的技术验收证据齐全，透明边缘视觉阻断仍待修复；本轮保持 v1.2.0-dev。后续文档提交不改变该候选包的素材和运行代码。
