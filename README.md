# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是一部发生在架空中国城市“梧城”的现代校园视觉小说。它围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；主体仍是 VN 阅读与角色路线，关键节点穿插少量可操作的 2D 轻类魂 Boss 战。

## 当前状态

- 中文名：**回留**
- 仓库：`AureliusWu/RESET`
- 当前版本：**v1.2.0**
- 当前稳定发行：**v1.2.0**
- 状态：**v1.2.0 正式版**
- 剧情状态：**主线、六角色 Normal End、关键 Bad End、True End 已闭环**
- 引擎：独立仓库 `AureliusWu/VN-Engine-v2`
- 锁定引擎：v0.3.0 / `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 发布平台：**Web/PWA + Windows x64**
- Windows 版通过专用 `RESET.exe` 启动器进入自研 VN Engine v2 宿主，不依赖开发环境。

## 下载与运行

正式发行页：[《回留 / RESET》v1.2.0](https://github.com/AureliusWu/RESET/releases/tag/v1.2.0)。

- [Windows x64](https://github.com/AureliusWu/RESET/releases/download/v1.2.0/RESET-huiliu-v1.2.0-win-x64.zip)：完整解压后运行根目录 `RESET.exe`；保留 `engine/` 与 `game/`。需要 Windows 10/11 x64 和 Microsoft Edge WebView2 Runtime，无需 Node.js 或 .NET SDK。
- [Web / PWA](https://github.com/AureliusWu/RESET/releases/download/v1.2.0/RESET-huiliu-v1.2.0-web.zip)：解压后用静态 HTTP 服务或 HTTPS 网站托管。本地可在解压目录运行 `python -m http.server 8000`，访问 `http://localhost:8000/`。首次联网等候“已下载，可离线游玩”后再离线重开，勿直接双击 HTML。

PWA 缓存需要 HTTPS 或 localhost。系统安装入口取决于浏览器。存档与 Meta 属于当前站点来源/浏览器或 Windows 配置目录；普通剧情区间可在设置中导出存档。True Route 不可逆区间禁止导入、导出和历史回退，完成 True End 后可重新开始并保留结局 Meta。

完整说明见 [CHANGELOG_v1.2.0.md](CHANGELOG_v1.2.0.md)，下载校验值见 Release 附件 `SHA256SUMS.txt`。

## v1.2.0 重点更新

- **战斗稳定性**：失焦/后台/宿主暂停冻结战斗，输入清理、结果延迟、visit 替换和触屏控制进一步收紧。
- **PWA 与移动端**：safe-area、安装图标、等待更新、v1.1.0 → v1.2.0 同源升级、离线重载进入正式验收。
- **4K production 美术**：58 / 58 正式资产完成 4K master/runtime 映射，无尺寸不足、缺 Alpha 或正式 legacy SVG fallback。
- **作品级美术补全**：新增独立 LOGO、7 章章节卡、六位女主 Q 版角色记忆、关键剧情道具视觉与《回留》专属 PWA 图标。
- **兼容性**：v1.0.0 / v1.0.1 / v1.1.0 / v1.2.0-dev / rc.1 / rc.2 备份可受控升级到正式版。

## 游戏内容

故事从 **10 月 17 日 18:42** 开始。陈渡已经经历三次死亡，又回到同一个雨夜。随着林晚、周小满、许栖、沈听澜、唐梨、乔南星逐步卷入异常，读档不再只是玩家掌握的信息优势：被覆盖的世界会留下残响，敌人也会学习，甚至过去版本的“自己”也可能拒绝被当成错误删除。

当前正式版包括：

- 完整共通线与 10 月 24 日高潮
- 林晚 / 周小满 / 许栖 / 沈听澜 / 唐梨 / 乔南星六条角色调查核心
- 六个 Normal End
- 多个关键 Bad End
- 完整 True Route 与 True End
- “无面行人”与“第七人”三处可操作实时战斗节点
- 实际跨读档 Meta 记录：读取次数、已达成结局、标题变化
- True Route 不可逆段落：真实禁用存档 / 读档 / 重开控件
- 6 个手动存档槽、快速存档、Ending Collection 与 CG Gallery
- PWA 离线缓存
- Windows 自包含宿主与《回留》专用启动器

## 美术与音频

v1.2.0 保持统一的二维日系动画感视觉方向，并完成 4K production 升级与作品级视觉补全。

- 六位主要角色：固定底模 + 平静 / 微笑 / 担忧 / 惊讶 / 认真五套正式差分
- 许栖追加剧情所需 `angry` 差分
- 20 个主要背景、5 张主线关键 CG、异常体 / Boss 均进入正式 4K master/runtime 体系
- 5 张 UI Key Visual：标题、存档异常、结局收藏、CG Gallery、战斗 HUD
- 独立作品品牌、Chapter 01–07 章节卡、六位女主 Q 版角色记忆、剧情道具视觉
- 原创程序音乐 / 音效：日常、夜梧城、战斗、路线、终局“不保存”、True End“明天见”等主题
- 音频在构建时统一归一化与软限幅，保持可重复生成

详细矩阵见 `docs/ART_4K_PLAN.md` 与 `docs/ART_COMPLETENESS_AUDIT.md`。

## 目录

```text
game/project.json                   基础项目与第一章
game/content/chapter2.json          残响 / 无面行人
game/content/chapter3.json          第七把椅子 / 初始路线分流
game/content/chapter4.json          六角色路线核心与 Normal End
game/content/chapter5.json          10 月 24 日 / 梧城北站 / 第七人
game/content/chapter6.json          不保存 / True Route / True End
game/content/zz-art-v1.json         角色 production 资产替换
game/content/zzz-scene-art-v1.json  背景与 CG production 资产替换
game/content/zzzz-release-v1.json   正式内容版本锁
game/runtime/combat.mjs             《回留》实时 2D 战斗插件
game/runtime/meta.mjs               跨读档 Meta 与不可逆 UI 插件
game/runtime/archive.mjs            存档管理、结局收藏与 CG 图鉴
game/runtime/archive-data.mjs       六槽存储模型与收藏目录
game/runtime/experience.css         小窗口与手机阅读布局
game/audio.json                     音乐、音效与演出映射
scripts/generate-audio.mjs          原创音频生成与母带化
scripts/generate-portraits.mjs      角色统一底模/表情差分生成
scripts/generate-scenes.mjs         背景与关键 CG 生成
scripts/build.mjs                   内容组合 + VN Engine v2 + 作品插件打包
scripts/check-release.mjs           发布完整性审计
launcher/                           Windows `RESET.exe` 启动器
```

## 构建

需要 Node.js 22+，并将锁定版本的 `VN-Engine-v2` 放在本仓库同级目录，或设置 `VN_ENGINE_PATH`。

```bash
npm run build
npm run check:release
npm run test:release
python -m http.server 8000 --directory dist
```

`npm run check:release` 会验证剧情结局、Boss 回接、Meta/战斗插件、离线缓存、角色差分、production 背景/CG 与终局音乐，避免生成结构不完整的发行包。

CI 从最终 ZIP 运行 `npm run test:browser`，检查真实断网重载、三处实时战斗胜负、结局/Meta/不可逆区间；Windows CI 从最终 ZIP 执行原生启动与进程重启持久化验收。公开 Release 发布后，Pages 只部署原 Release Web ZIP，并再次执行真实公网与 Service Worker 离线验收。

## 发布边界

《回留》内容与专属资产保留全部权利，具体见 `LICENSE.md`。VN Engine v2 按其独立仓库的 MIT License 发布，Windows 发行包同时附带引擎及第三方许可文件。
