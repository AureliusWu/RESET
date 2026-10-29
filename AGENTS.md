# 《回留 / RESET》开发约定

- 当前稳定发行线为 `v1.2.1`。历史稳定 tag 与 Release 资产不得移动或覆盖；主分支只保留当前开发所需文件，旧阶段资料从 Git 历史追溯。
- `game/assets/4k/visual-acceptance.json` 是角色视觉验收唯一事实源。当前六位角色 production 美术均为 `PASS`；未经新的授权验收，不得擅自替换或重生成。
- 2026-10-29 用户明确要求“验收由你来模拟人类执行”。R8 待验收项目允许 AI 按玩家视角逐项执行视觉/交互审核；配角使用 `review.type=ai-simulated-human`，必须保留用户授权、逐项观察、报告 SHA256 和原图/master/runtime SHA256。不得冒称 owner 本人审核，也不得将浏览器模拟或 Windows CI 记为实体设备实测。六位既有女主美术不在替换范围内。
- 严格执行 `TECH_READY != ART_READY`。尺寸、Alpha、SHA256、文件存在、Decode、Build、自动截图不能单独把美术标记为 PASS；角色一致性、人体比例、构图、移动端/桌面端观感与 Provenance Truth 必须独立验收。
- R2 起静态 production 资产以 `game/assets/manifest.json` 为唯一 Asset ID / kind / runtime path 事实源；`game/project.json` 与 `game/content/**` 不得重新声明 `assets` / `replaceAssets`。正式角色、背景、CG 只允许指向 `game/assets/4k/runtime/` WebP，master 与 provenance 继续保留在 4K / art-sources 链。
- 林晚正式基线只保留 `neutral`，历史 `base` / `normal` 别名已退役；`sad` 是已完成但当前未引用的 extra，只保留源码，不进入正式发行包。
- 项目为现代中国校园 VN、六角色路线、都市灵异、读档 Meta 与少量实时 2D Boss 战。保留陈渡、林晚、周小满、许栖、沈听澜、唐梨、乔南星及现有剧情骨架。
- True End 保持“不保存 → 不可逆 → 10 月 25 日 → 明天见”。不可逆限制必须在 runtime 边界真实生效。
- 引擎继续独立使用 VN Engine v2 0.3.0，精确锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。普通作品功能放在本仓库，不复制或重构引擎。
- R2 起正式正文以 `game/content/chapters/01.json` 至 `07.json` 为唯一可编辑事实源，加载顺序由 `game/content/manifest.json` 显式声明；`game/project.json` 不再保存剧情 Scene，`replaceScenes` 覆盖层不得重新进入 production。
- 保持场景、台词、选项与资产 ID；修改存档数据结构时必须提供迁移。v1.0.0、v1.0.1、v1.1.0、v1.2.0-dev、v1.2.0-rc.1、v1.2.0-rc.2、v1.2.0、v1.2.1-dev 的备份与六个手动槽必须兼容。旧备份不能原地改写。
- v1.2.1 标题页必须保持真实可交互；移动端竖屏与短横屏必须保留 44px 触控下限；桌面/4K 布局不得因移动端覆盖规则退化。
- PWA 安装入口只在浏览器提供 installability prompt 时显示；Service Worker 离线、同源升级、存档与 Meta 持久化均为发布门禁。
- 稳定发布必须等待同 SHA Build、最终 Web ZIP 与最终 Windows ZIP 全绿，随后才允许创建不可移动 tag、GitHub Release 与 `SHA256SUMS.txt`。Pages 只能使用已公开稳定 Release 的原 ZIP、SHA256 与 manifest。
- `npm run check:release` 用于候选技术验收；`npm run check:stable` 是稳定发布硬门禁，任一授权视觉验收项非 PASS、包版本非稳定版本或来源链不完整时必须失败。AI 模拟人工记录必须通过独立授权和报告校验；普通自动截图或 CI 绿色不能授予美术 PASS。
- 修改战斗后运行战斗输入回归；修改存档、Meta、收藏、PWA、触屏后补充对应回归。CI 必须从最终 ZIP 运行浏览器与 Windows 原生验收。
- 浏览器模拟、Android 模拟/实机、Windows CI WebView2 与实体 Windows/DPI 应分开记录，不能互相冒充。
- 小步提交，记录真实状态；不改写既有稳定发布证据。
