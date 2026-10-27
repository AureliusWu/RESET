# 《回留 / RESET》制作状态

更新时间：2026-10-27。当前正式稳定发行仍为 **v1.2.1**；`main` 已进入发布后的内容增强阶段。R1 Scenario Reconstruction 完成后，主线开发状态定义为 **Content Reconstructed / Voice Not Locked**。

## 当前完成基线

- 82 个合成场景，六角色路线、六个 Normal End、关键 Bad End、True Route / True End 保持原有 Scene / Choice / Ending 接口。
- R1 将原约 5,850 汉字剧情骨架扩写为 **80,000–120,000 汉字门禁范围**，当前自动统计不少于 80,000 汉字。
- 新增常驻配角网络与校园、家庭、食堂、图书馆、江滩、地铁、社团、数字聊天等生活层；六位女主均拥有陈渡之外的关系锚点。
- R1 不改 18:42、读取残响、夜梧城、2009 年、10 月 24 日、True Route 等核心谜底。
- 31+ 剧情角色差分、20 个主要背景、5 张关键 CG 与完整 4K 映射继续沿用；R1 不因新增无立绘配角而伪造“全 Cast 美术已完成”。
- 14 个原创程序配乐 cue、7 个核心 SFX，32 kHz / PCM16 / stereo，并进入发行音频门禁。
- 三处实时战斗、6 个手动存档槽、快速存档、MetaState、Ending Collection、CG Gallery、PWA 离线、Windows x64 原生启动链继续保留。
- VN Engine v2 仍锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。

## R1 Scenario Gate

`npm run scenario:check` 作为正式门禁验证：

- 总正文汉字 80,000–120,000；
- VN 单次文本点击不超过 80 字符；
- 82 个场景不得缩水；
- 16 个既有 Ending ID 不得丢失；
- 12 名常驻配角必须持续存在；
- 六位女主路线必须保留至少一个独立社会关系锚点。

该门禁已加入 `check:release` 与 `check:stable`。

## 当前阶段

**Scenario Reconstruction R1 complete → 人工通读 / 演出修订 → Voice Script Lock → Voice Production。**

全角色配音仍未开始。R1 之后如继续增补文本，应先通读确认节奏和口吻，再进入配音锁稿，避免对未稳定文本提前录音。
