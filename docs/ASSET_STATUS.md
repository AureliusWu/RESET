# 资产状态表

## 状态定义

- **direction**：方向已确定，可继续迭代，但不能视为最终生产资产。
- **prototype**：可直接运行，用于剧情、演出、技术和节奏验证。
- **production-candidate**：已接近正式资产标准，仍需角色一致性/分辨率/版权与细节复核。
- **production**：可以进入正式版本。

## 当前资产

| 类别 | 资产 | 状态 | 说明 |
| --- | --- | --- | --- |
| 背景 | 第一章校园/地铁/档案室等 SVG | prototype | 可运行，占位构图用途 |
| 背景 | `bg-stairwell-morning.svg` | direction | 清晨校园色调基准 |
| 背景 | `bg-riverside-dusk.svg` | direction | 梧城江滩黄昏色调基准 |
| 背景 | `bg-underpass-rain.svg` | direction | 都市灵异与战斗场景基准 |
| 角色 | 六位女主 SVG | prototype | 只验证身份映射与 VN 立绘流程，不代表最终角色造型 |
| 异常体 | `ch-faceless.svg` | direction | 无面行人的轮廓和气质基准 |
| CG | `cg-faceless-reflection.svg` | direction | 倒影提前动作的镜头设计基准 |
| UI | 标题/异常存档槽等 SVG | direction | Meta UI 的视觉基准 |
| 音乐 | `music-memory-rain.wav` | prototype | 原创程序氛围音乐 |
| 音乐 | `music-night-residue.wav` | prototype | 原创程序异常氛围音乐 |
| 音乐 | `music-fracture-pulse.wav` | prototype | 原创程序战斗脉冲音乐 |
| 音效 | memory/load/impact/dodge | prototype | 可随构建重复生成 |

## 正式立绘晋级条件

六位主要角色的正式立绘必须满足：

1. 固定脸型、头身比、发型轮廓与服装结构；
2. 至少 neutral / smile / worried / surprised / serious 五个表情使用同一底模；
3. 正面、3/4、侧面转向时识别点不漂移；
4. 透明背景和统一画布基准；
5. 干净线稿、克制赛璐璐上色，禁止回到厚涂概念海报风；
6. 在 VN 实际 1080p 画面中检查边缘、缩放和对话框遮挡；
7. 未经角色设定文档确认的生日、班级、配饰等 AI 自生成信息不得进入正史。

## 第二轮资产原则

第二轮的目标是让**剧情、演出、音乐、场景和战斗语义全部能在引擎中跑通**。角色最终美术仍单独迭代，不因为技术链已经接通就降低一致性门槛。
