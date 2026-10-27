# 回留 / RESET

> 有些选择可以重来，有些人却只能遇见一次。

《回留》是一部发生在架空中国城市“梧城”的现代校园视觉小说。它围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；主体仍是 VN 阅读与角色路线，关键节点穿插少量可操作的 2D 轻类魂 Boss 战。

## 当前状态

- 中文名：**回留**
- 仓库：`AureliusWu/RESET`
- 当前开发版本：**v1.2.1-dev**
- 当前稳定发行：**v1.2.0**
- 状态：**v1.2.1 视觉回归修复 / ART_BLOCKED**
- 剧情状态：**主线、六角色 Normal End、关键 Bad End、True End 已闭环**
- 角色美术：**林晚 PASS；周小满 / 许栖 / 沈听澜 / 唐梨 / 乔南星 BLOCKED，等待按林晚基准重建与人工视觉验收**
- 引擎：独立仓库 `AureliusWu/VN-Engine-v2`
- 锁定引擎：v0.3.0 / `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- 发布平台：**Web/PWA + Windows x64**
- Windows 版通过专用 `RESET.exe` 启动器进入自研 VN Engine v2 宿主，不依赖开发环境。

> v1.2.1 执行 `TECH_READY != ART_READY`。尺寸、Alpha、SHA256、Decode、Build 与自动截图只能证明技术可用，不能代替角色一致性、人体比例、构图和来源真实性的人工验收。当前 stable publish gate 有意保持关闭。

## 下载与运行

当前正式发行仍是：[《回留 / RESET》v1.2.0](https://github.com/AureliusWu/RESET/releases/tag/v1.2.0)。

- [Windows x64](https://github.com/AureliusWu/RESET/releases/download/v1.2.0/RESET-huiliu-v1.2.0-win-x64.zip)：完整解压后运行根目录 `RESET.exe`；保留 `engine/` 与 `game/`。需要 Windows 10/11 x64 和 Microsoft Edge WebView2 Runtime，无需 Node.js 或 .NET SDK。
- [Web / PWA](https://github.com/AureliusWu/RESET/releases/download/v1.2.0/RESET-huiliu-v1.2.0-web.zip)：解压后用静态 HTTP 服务或 HTTPS 网站托管。本地可在解压目录运行 `python -m http.server 8000`，访问 `http://localhost:8000/`。首次联网等候“已下载，可离线游玩”后再离线重开，勿直接双击 HTML。

PWA 缓存需要 HTTPS 或 localhost。系统安装入口取决于浏览器。存档与 Meta 属于当前站点来源/浏览器或 Windows 配置目录；普通剧情区间可在设置中导出存档。True Route 不可逆区间禁止导入、导出和历史回退，完成 True End 后可重新开始并保留结局 Meta。

v1.2.0 完整说明见 [CHANGELOG_v1.2.0.md](CHANGELOG_v1.2.0.md)；v1.2.1 开发修复见 [CHANGELOG_v1.2.1-dev.md](CHANGELOG_v1.2.1-dev.md) 与 `docs/V1_2_1_VISUAL_RECOVERY.md`。

## v1.2.1-dev 当前目标

- **移动端视觉回归止血**：标题 Key Visual 不再覆盖可玩剧情；角色立绘限制在舞台安全构图范围。
- **Round 3 五角色重建**：周小满、许栖、沈听澜、唐梨、乔南星以林晚正式立绘为唯一视觉基准重新生产。
- **视觉硬门禁**：`game/assets/4k/visual-acceptance.json` 作为人工视觉状态事实源；五位角色未全部 PASS 前 stable release 必须失败。
- **切断 Placeholder 生产链**：正式 Build 不再运行 `scripts/generate-portraits.mjs`。
- **实际场景证据**：桌面剧情截图、Alpha edge 检查以及 390×844 每角色 neutral 手机剧情截图进入候选 QA。
- **兼容性**：v1.2.0 正式存档加入受控升级来源。

## v1.2.0 已发布能力

- **战斗稳定性**：失焦/后台/宿主暂停冻结战斗，输入清理、结果延迟、visit 替换和触屏控制进一步收紧。
- **PWA 与移动端**：safe-area、安装图标、等待更新、v1.1.0 → v1.2.0 同源升级、离线重载进入正式验收。
- **4K 技术管线**：58 / 58 production 引用具备 master/runtime 映射、尺寸、Alpha 与完整性记录。该技术状态不再等同于美术质量 PASS。
- **作品级视觉组件**：独立 LOGO、7 章章节卡、六位女主 Q 版角色记忆、关键剧情道具视觉与《回留》专属 PWA 图标。
- **兼容性**：v1.0.0 / v1.0.1 / v1.1.0 / v1.2.0-dev / rc.1 / rc.2 备份可受控升级到正式版。

## 游戏内容

故事从 **10 月 17 日 18:42** 开始。陈渡已经经历三次死亡，又回到同一个雨夜。随着林晚、周小满、许栖、沈听澜、唐梨、乔南星逐步卷入异常，读档不再只是玩家掌握的信息优势：被覆盖的世界会留下残响，敌人也会学习，甚至过去版本的“自己”也可能拒绝被当成错误删除。

当前内容包括：

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

v1.2.1 正在重新执行角色美术人工验收。林晚保持 Round 2 锁定基准；Round 3 五位角色在重建前不得标记 `ART_READY`。

- 林晚：正式基准，保留平静 / 微笑 / 担忧 / 惊讶 / 认真等已验收差分
- 周小满 / 许栖 / 沈听澜 / 唐梨 / 乔南星：`ART_BLOCKED`，等待 neutral 重建 → 人工验收 → 表情差分
- 20 个主要背景、5 张主线关键 CG、异常体 / Boss 保持现有 4K master/runtime 体系
- 5 张 UI Key Visual 保留为装饰/专题视觉，不得遮挡可玩剧情核心 UI
- 独立作品品牌、Chapter 01–07 章节卡、六位女主 Q 版角色记忆、剧情道具视觉
- 原创程序音乐 / 音效：日常、夜梧城、战斗、路线、终局“不保存”、True End“明天见”等主题
- 音频在构建时统一归一化与软限幅，保持可重复生成

详细矩阵见 `docs/ART_4K_PLAN.md`、`docs/ART_COMPLETENESS_AUDIT.md`、`docs/V1_2_1_VISUAL_RECOVERY.md` 与 `game/assets/4k/visual-acceptance.json`。

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
game/content/zzzz-release-v1.json   当前内容版本锁
game/assets/4k/visual-acceptance.json 人工视觉验收事实源
game/runtime/combat.mjs             《回留》实时 2D 战斗插件
game/runtime/meta.mjs               跨读档 Meta 与不可逆 UI 插件
game/runtime/archive.mjs            存档管理、结局收藏与 CG 图鉴
game/runtime/archive-data.mjs       六槽存储模型与收藏目录
game/runtime/experience.css         小窗口与手机阅读布局
game/audio.json                     音乐、音效与演出映射
scripts/generate-audio.mjs          原创音频生成与母带化
scripts/generate-portraits.mjs      历史/原型 SVG 角色生成器；禁止 production Build 调用
scripts/generate-scenes.mjs         背景与关键 CG 生成
scripts/check-art-visual-gate.mjs   人工视觉状态发布门禁
scripts/build.mjs                   内容组合 + VN Engine v2 + 作品插件打包
scripts/check-release.mjs           候选发行完整性审计
launcher/                           Windows `RESET.exe` 启动器
```

## 构建

需要 Node.js 22+，并将锁定版本的 `VN-Engine-v2` 放在本仓库同级目录，或设置 `VN_ENGINE_PATH`。

```bash
npm run build
npm run check:release
npm run test:release
npm run art:visual
python -m http.server 8000 --directory dist
```

开发候选的 `npm run check:release` 会完成技术完整性检查并报告当前视觉阻断；`npm run check:stable` 是稳定发布硬门禁，在任一角色仍为 `BLOCKED / FAIL / UNVERIFIED` 时必须失败。

CI 从最终候选 ZIP 运行 `npm run test:browser`，检查真实断网重载、三处实时战斗胜负、结局/Meta/不可逆区间及逐角色移动端构图证据；Windows CI 从最终 ZIP 执行原生启动与进程重启持久化验收。

## 发布边界

v1.2.1 视觉恢复阶段的 `.github/workflows/release.yml` 只生成候选 Web / Windows 验收包，不包含 stable publish job。五位 Round 3 角色全部人工 PASS 后才恢复正式发布闭环。

《回留》内容与专属资产保留全部权利，具体见 `LICENSE.md`。VN Engine v2 按其独立仓库的 MIT License 发布，Windows 发行包同时附带引擎及第三方许可文件。
