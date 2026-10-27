# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是一部发生在架空中国城市“梧城”的现代校园视觉小说，围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；主体是 VN 阅读与角色路线，关键节点穿插少量可操作的 2D 实时战斗。

## 当前状态

- 当前稳定发行：**v1.2.1**
- 故事版本：`reset-v1.2.1`
- 剧情：主线、六角色 Normal End、关键 Bad End、True Route / True End 已闭环
- 角色美术：六位角色 production 美术人工视觉 Gate **全部 PASS**
- 引擎：`AureliusWu/VN-Engine-v2` v0.3.0
- 锁定引擎提交：`15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 发布平台：**Web/PWA + Windows x64**
- Windows：`RESET.exe → VNEngine.exe → game/` 自包含启动链，不依赖 Node.js 或 .NET SDK

项目继续执行：

```text
TECH_READY != ART_READY
```

技术完整性与人工视觉验收分别作为发布门禁；`game/assets/4k/visual-acceptance.json` 是角色视觉验收事实源。

## v1.2.1 修复重点

- 标题页恢复为真实可交互 UI，提供明确的「进入游戏」入口。
- 修复标题 Key Visual 覆盖剧情、导致底层控件无法交互的问题。
- 修复 Android 竖屏与 844×390 横屏布局。
- 移动端标题、剧情选项、工具栏与面板触控目标保持至少 44px。
- 恢复桌面与 4K 宽屏布局，避免移动端修复影响桌面舞台比例。
- 接入 Chromium `beforeinstallprompt`，可安装时显示「安装到设备」。
- 保留 Service Worker 离线、同源升级、存档与 Meta 持久化。
- 当前角色正式美术保持不变；本版本没有重绘已确认角色资产。

完整说明见 [CHANGELOG_v1.2.1.md](CHANGELOG_v1.2.1.md)。

## 下载与运行

正式发行页：<https://github.com/AureliusWu/RESET/releases/tag/v1.2.1>

- Windows x64：`RESET-huiliu-v1.2.1-win-x64.zip`，完整解压后运行根目录 `RESET.exe`。需要 Windows 10/11 x64 与 Microsoft Edge WebView2 Runtime。
- Web / PWA：`RESET-huiliu-v1.2.1-web.zip`，用 HTTPS 或 localhost 静态托管。首次联网等待“已下载，可离线游玩”后可离线重开。

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

v1.2.1 受控接受并校验以下故事版本备份：

- `reset-v1.0.0`
- `reset-v1.0.1`
- `reset-v1.1.0`
- `reset-v1.2.0-dev`
- `reset-v1.2.0-rc.1`
- `reset-v1.2.0-rc.2`
- `reset-v1.2.0`
- `reset-v1.2.1-dev`

升级只修改加载到会话中的版本标记，不原地改写用户备份，并继续经过引擎路线校验。

## 美术与音频

- 六位角色 production 美术：PASS
- 20 个主要背景、关键 CG、异常体 / Boss 继续使用 4K master/runtime 体系
- UI Key Visual 只作为装饰视觉，不得覆盖核心可玩 UI
- 独立作品品牌、Chapter 01–07 章节卡、Q 版角色记忆与剧情道具视觉
- 原创程序音乐 / 音效在构建时统一归一化与软限幅

详细矩阵见 `docs/ART_4K_PLAN.md`、`docs/ART_COMPLETENESS_AUDIT.md` 与 `game/assets/4k/visual-acceptance.json`。

## 构建

需要 Node.js 22+，并将锁定版本的 `VN-Engine-v2` 放在本仓库同级目录，或设置 `VN_ENGINE_PATH`。

```bash
npm run build
npm run check:stable
npm run test:release
npm run test:browser
```

CI 对最终 Web ZIP 和 Windows ZIP 运行真实浏览器 / WebView2 验收；稳定发布只有在 Build、Web、Windows 三条门禁全部通过后才允许创建不可移动 tag 与 Release。Pages 只从公开 Release 的 Web ZIP 部署并再次执行公网回归。

《回留》内容与专属资产保留全部权利，具体见 `LICENSE.md`。VN Engine v2 按其独立仓库的 MIT License 发布。
