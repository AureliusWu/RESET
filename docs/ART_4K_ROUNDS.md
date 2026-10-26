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
- 状态：资产接入完成；显示与最终 ZIP 验收待对应提交 Actions 确认；透明边缘视觉验收仍有阻断，不能宣布 Round 2 completed。
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

等待推送后的 Build、Release Web、Release Windows；完成后在此补充提交 SHA、run URL、浏览器/原生 smoke/PWA 状态。技术验收通过也不能覆盖上述视觉阻断。
