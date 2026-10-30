# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是一部发生在架空中国城市“梧城”的现代校园视觉小说，围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；主体是 VN 阅读与角色路线，关键节点穿插少量可操作的 2D 实时战斗。

## 当前状态

- 本版发行目标：**v1.3.1**（公开状态以正式发行页为准）
- 故事版本：`reset-v1.3.1`
- 剧情：主线、六角色 Normal End、关键 Bad End、True Route / True End 已闭环
- 角色美术：六位女主既有视觉 Gate **PASS**，12 名配角授权 AI 模拟人工验收 **PASS**
- 引擎：`AureliusWu/VN-Engine-v2` v0.3.0
- 锁定引擎提交：`15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 发布平台：**Web/PWA + Windows x64**
- Windows：`RESET.exe → VNEngine.exe → game/` 自包含启动链，不依赖 Node.js 或 .NET SDK

项目继续执行：

```text
TECH_READY != ART_READY
```

技术完整性与已记录的授权视觉验收分别作为发布门禁；`game/assets/4k/visual-acceptance.json` 是角色视觉验收事实源。

## v1.3.1 更新重点

修复七章29个 noSprite 场景隐藏正式 NPC 的问题；逐行立绘 cue 清除旁白和功能性说话人残留，27条离屏语音保留显式隐藏。12名 supporting cast 必须通过真实剧情 frame + DOM 验证；美术、验收、provenance 和剧情身份保持不变。

- 终审重复旁白、提前揭示、死亡与白色界面连续性，以及选择前错误离场的收尾；保留 82 场景、2161 条台词的位置、ID 与分支效果。
- 标题页焦点隔离、Tab 导航、进入后的阅读焦点与手机 44px 触控尺寸。
- 整合 14 首音乐、7 个重制音效、82 场景配乐、战斗反馈、15 个演出节拍和 7 章字幕。
- 全路线决定路径、六条手机路线、六槽存档与不可逆终局玩家流程分别验证；AI 观察及截图哈希独立记录。
- 从实际公开 v1.2.3 PWA 验证快速存档、六个不同手动槽、设置、结局/CG 的同源升级及离线读取；保留既有美术和锁定引擎。
- Web/PWA 与 Windows x64 同步提供；严格同提交门禁后发布，Pages 使用公开 Release 的原始 Web ZIP。

完整说明见 [CHANGELOG_v1.3.1.md](CHANGELOG_v1.3.1.md) 与 [终审记录](docs/NPC_RUNTIME_HOTFIX_v1.3.1.md)。既有美术观察及授权见 [R8_AI_REVIEW.md](docs/R8_AI_REVIEW.md)。

## 下载与运行

正式发行页：<https://github.com/AureliusWu/RESET/releases/tag/v1.3.1>

- Windows x64：`RESET-huiliu-v1.3.1-win-x64.zip`，完整解压后运行根目录 `RESET.exe`。需要 Windows 10/11 x64 与 Microsoft Edge WebView2 Runtime。
- Web / PWA：`RESET-huiliu-v1.3.1-web.zip`，用 HTTPS 或 localhost 静态托管。首次联网等待“已下载，可离线游玩”后可离线重开。

PWA 安装入口取决于浏览器 installability 判定。支持 `beforeinstallprompt` 的 Chromium 浏览器会在标题页显示「安装到设备」。

## 游戏内容

故事从 **10 月 17 日 18:42** 开始。陈渡已经经历三次死亡，又回到同一个雨夜。随着林晚、周小满、许栖、沈听澜、唐梨、乔南星逐步卷入异常，读档不再只是玩家的信息优势：被覆盖的世界会留下残响，敌人也会学习，过去版本的“自己”也可能拒绝被当成错误删除。

当前内容包括：

- 完整共通线与 10 月 24 日高潮
- 六位女主调查核心与六个 Normal End
- 多个关键 Bad End
- 完整 True Route 与 True End
- 三处可操作实时战斗节点
- 跨读档 Meta：读取次数、结局、CG、标题变化
- True Route 不可逆区间
- 6 个手动存档槽、快速存档、Ending Collection、CG Gallery
- PWA 离线缓存与升级
- Windows 自包含宿主与专用启动器

## 存档兼容

v1.3.1 受控接受并校验以下故事版本备份：

- `reset-v1.0.0`
- `reset-v1.0.1`
- `reset-v1.1.0`
- `reset-v1.2.0-dev`
- `reset-v1.2.0-rc.1`
- `reset-v1.2.0-rc.2`
- `reset-v1.2.0`
- `reset-v1.2.1-dev`
- `reset-v1.2.1`
- `reset-v1.2.2`
- `reset-v1.2.3`
- `reset-v1.3.0`

升级只修改加载到会话中的版本标记，不原地改写用户备份，并继续经过引擎路线校验。

## 美术与音频

- 六位女主既有 production 美术及 12 名配角授权视觉验收：PASS
- 45 立绘、40 背景、11 CG，加 21 音频共 117 项 runtime assets；5 张 UI 装饰资源另计
- 保留 original、4K master、runtime WebP 与来源哈希；放大母版不声明 native 4K
- UI Key Visual 只作为装饰视觉，不得覆盖核心可玩 UI
- 独立作品品牌、Chapter 01–07 章节卡、Q 版角色记忆与剧情道具视觉
- 原创程序配乐使用 16 小节 A/B 编排；音乐与音效分别验证峰值、循环/起音、解码、实际播放与离线能力

详细矩阵见 `docs/ART_4K_PLAN.md`、`docs/ART_COMPLETENESS_AUDIT.md` 与 `game/assets/4k/visual-acceptance.json`。

## 构建

需要 Node.js 22+，并将锁定版本的 `VN-Engine-v2` 放在本仓库同级目录，或设置 `VN_ENGINE_PATH`。

```bash
npm run build
npm run check:stable
npm run test:release
npm run test:routes
npm run test:browser
npm run test:players
```

CI 对最终 Web ZIP 和 Windows ZIP 运行真实浏览器 / WebView2 验收；稳定发布只有在 Build、Web、Windows 三条门禁全部通过后才允许创建不可移动 tag 与 Release。Pages 只从公开 Release 的 Web ZIP 部署并再次执行公网回归。

《回留》内容与专属资产保留全部权利，具体见 `LICENSE.md`。VN Engine v2 按其独立仓库的 MIT License 发布。
