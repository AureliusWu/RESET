# 资产状态表

## 状态定义

- **direction**：方向已确定，可继续迭代，但不能视为正式生产资产。
- **prototype**：可运行，主要用于技术、构图和节奏验证。
- **production-candidate**：达到正式方向，仍等待发行链验收。
- **production**：已纳入发布完整性检查，可以进入正式版本。

## 当前视觉方向

《回留》使用现代中国校园 / 城市生活为基础的二维日系视觉小说表达：角色保持干净线稿、稳定五官抽象与克制赛璐璐层次；现实梧城偏清透自然，夜梧城与异常空间逐渐冷化、失真，但不常态化赛博霓虹。

当前正式剧情图像已经完成 4K 位图迁移；作品级 LOGO、章节卡、Q 版角色记忆和少量剧情道具采用分辨率无关矢量 DOM，以保证 1080p、4K、高 DPI 与移动端均清晰。

## 当前生产资产

| 类别 | 数量/资产 | 状态 | 说明 |
| --- | --- | --- | --- |
| 主要角色 | 6 位女主固定底模 | **production** | 发型、服装、色彩与核心识别点锁定 |
| 角色立绘 / 表情 | 33 个正式 4K production 引用 | **production** | 30 个五表情 heroine + 许栖 angry + 两个异常体；透明 WebP runtime + PNG master |
| 背景 | 20 个主要场景 | **production** | 校园、江滩、地铁、夜梧城、北站、存档室、True End 清晨等 |
| CG | 5 张主线关键 CG | **production** | 无面行人倒影、18:42 来信、第七把椅子、北站约定、True End 江滩 |
| UI Key Visual | 5 张 | **production** | 标题、异常存档、Ending Collection、CG Gallery、战斗 HUD |
| 品牌视觉 | 回留 / RESET / 18:42 标记 | **production-candidate** | 分辨率无关 DOM 视觉 |
| 章节视觉 | Chapter 01–07 | **production-candidate** | 根据当前章节自动显示，响应式 |
| Q 版角色 | 6 位女主角色记忆徽章 | **production-candidate** | 继承正式角色发色、瞳色、服装主色与识别符号 |
| 剧情道具 | 2009 旧地图、未来手机照片 | **production-candidate** | 对应剧情档案与未来照片演出 |
| PWA 图标 | 192 / 512 PNG | **production-candidate** | 《回留》回环 / 存档标记 |
| 音乐 | 14 个原创程序配乐 cue | **production** | 日常、夜梧城、战斗、路线、悬疑、终局“不保存”、True End“明天见”等 |
| 音效 | 7 组核心系统/战斗音效 | **production** | 读取、残响、冲击、闪避、异常快门、未来消息、异常门 |
| 语音 | 无 | **optional** | 当前完整版本以无配音成立；全角色配音属于后续增强 |

## R2 Asset Schema

`game/assets/manifest.json` 是静态 production Asset ID、kind 与 runtime path 的唯一事实源：当前固定 **58 个静态 production 引用 = 33 portrait + 20 background + 5 CG**。音频继续由 `game/audio.json` 独立声明，共 21 个 audio asset，构建后的项目总资产数为 79。

`game/project.json` 与 `game/content/**` 不再声明美术资产，也不允许 `replaceAssets`。正式静态 production 全部指向 `assets/4k/runtime/` WebP；历史 SVG / generated fallback / replacement overlay 已退出 production。

林晚的 `base` / `normal` 重复别名已在 R2 删除，`neutral` 是唯一正式基线。`sad` 是独立完成的 extra，master/runtime 源文件继续保留，但当前正文不引用且发行包不携带。

## 4K 与画质状态

58 个正式 production 图像引用全部具备 4K master / runtime 配对，并由尺寸、Alpha、路径、SHA256、provenance 与最终发行 manifest 门禁验证。现有已验收 4K 图像不因结构重构而重复放大或无依据重绘。

LOGO、章节卡、Q 版与剧情道具使用矢量 DOM 几何，因此没有固定像素上限，也不会把低分辨率原图冒充原生 4K。

## 自动验收

- `npm run asset:schema`：验证 R2 资产所有权、58/21/79 数量基线、禁止 overlay / alias / generated fallback 回归。
- `npm run art:check`：验证 production 文件、4K master/runtime、尺寸、Alpha、provenance 与人工视觉 PASS。
- Release Gate：验证最终 ZIP 内实际引用、离线缓存和 manifest，并确认非 production extra 不泄漏进包。
- `tests/art-completeness.test.mjs`：继续检查品牌视觉、Chapter 01–07、剧情道具、六位女主 Q 版与 PWA 图标。

详细矩阵见 `docs/ART_COMPLETENESS_AUDIT.md`。

## 后续可升级但不阻断当前版本

- 更多姿势差分与服装差分；
- 更高预算手绘角色与 CG 重制；
- 真人或高质量角色配音；
- 更长、更复杂的 OST 编曲与实体原声母带；
- 正式发行用商店胶囊图、宣传海报与社交平台套图。
