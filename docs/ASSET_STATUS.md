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
| 角色立绘 / 表情 | 33 个正式 4K production 引用 | **production** | 当前正史使用集合，透明 WebP runtime + 4K PNG master |
| 背景 | 20 个主要场景 | **production** | 校园、江滩、地铁、夜梧城、北站、存档室、True End 清晨等 |
| CG | 5 张主线关键 CG | **production** | 无面行人倒影、18:42 来信、第七把椅子、北站约定、True End 江滩 |
| 异常体 | 无面行人 / 第七人 | **production** | 4K master + runtime，承担剧情与战斗演出 |
| UI Key Visual | 5 张 | **production** | 标题、异常存档、Ending Collection、CG Gallery、战斗 HUD |
| 品牌视觉 | 回留 / RESET / 18:42 标记 | **production-candidate** | `art-completeness` 分支新增，分辨率无关 |
| 章节视觉 | Chapter 01–07 | **production-candidate** | 根据当前章节自动显示，响应式 |
| Q 版角色 | 6 位女主角色记忆徽章 | **production-candidate** | 继承正式角色发色、瞳色、服装主色与识别符号 |
| 剧情道具 | 2009 旧地图、未来手机照片 | **production-candidate** | 对应 `archive_erased_map` / `underpass_warning` |
| PWA 图标 | 192 / 512 PNG | **production-candidate** | 已从引擎通用 N 标识升级为《回留》回环 / 存档标记 |
| 音乐 | 8 首原创程序音乐 | **production** | 日常、夜梧城、战斗、路线、悬疑、终局“不保存”、True End“明天见”等 |
| 音效 | 7 组核心系统/战斗音效 | **production** | 读取、残响、冲击、闪避、异常快门、未来消息、异常门 |
| 语音 | 无 | **optional** | 当前完整版本以无配音成立；全角色配音属于后续增强 |

## 4K 与画质状态

原 RC 已有 **58 个正式 production 图像引用**，全部指向 `assets/4k/runtime/`，没有正式 SVG fallback；对应 4K master / runtime 管线已有尺寸、Alpha、路径与完整性门禁。现有已验收 4K 图像不因“补分类”而重复放大或无依据重绘。

本轮新增的 LOGO、章节卡、Q 版与剧情道具使用矢量 DOM 几何，因此没有固定像素上限，也不会把低分辨率原图冒充原生 4K。

## 自动验收

现有美术门禁继续检查正式 4K production 引用、路径、尺寸、Alpha、离线缓存和最终发行 manifest。`tests/art-completeness.test.mjs` 额外检查：

1. 独立作品品牌视觉存在；
2. Chapter 01–07 章节视觉完整；
3. 旧地图与未来手机剧情道具存在；
4. 六位女主 Q 版角色记忆完整；
5. PWA 图标不再使用引擎通用 N 几何；
6. 192 / 512 图标尺寸正确且可确定性复现。

详细矩阵见 `docs/ART_COMPLETENESS_AUDIT.md`。

## 后续可升级但不阻断当前版本

- 更多姿势差分与服装差分；
- 更高预算手绘角色与 CG 重制；
- 真人或高质量角色配音；
- 更长、更复杂的 OST 编曲与实体原声母带；
- 正式发行用商店胶囊图、宣传海报与社交平台套图。
