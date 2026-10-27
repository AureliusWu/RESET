# 《回留 / RESET》R1 — Scenario Reconstruction

## 轮次定义

R1 是第一次正式剧本重构轮。目标不是“把原句拉长”，而是在完全保留既有核心谜底、路线结构、Ending ID、战斗节点、MetaState 与系统接口的前提下，把约 5,850 汉字的剧情骨架提升到可作为完整中短篇 Galgame 阅读的正文体量。

## R1 完成定义

- [x] 建立核心七人之外的常驻配角网络。
- [x] 建立校园、家庭、食堂、图书馆、江滩、地铁、社团、数字聊天八类生活层。
- [x] Chapter 1–7 全部场景进入正式扩写正文。
- [x] 保留原 Scene ID / Choice ID / Ending ID / continuation / combat / Meta 相关字段。
- [x] 六女主各自拥有陈渡之外的人际关系和生活目标。
- [x] 普通人会受异常后果影响；“拯救梧城”不再只等于七名核心角色存活。
- [x] 正文目标锁定 80,000–120,000 汉字，并以自动化 Scenario Gate 验收。

## 文本原则

- 日常先成立，异常再破坏。
- 每个场景至少同时承担：生活、关系、信息/冲突、情绪变化、下一步推动中的两到三项。
- 不用“所有人都围着陈渡转”的人物配置。
- 不为凑字数重复解释谜底。新增篇幅优先投入关系、后果、现实流程与城市细节。
- R1 不进入全角色配音锁稿；Voice Production 必须在 R1 文本回归与人工通读后再开始。

## 正式正文

R2 Content Schema Consolidation 之后，R1 正文的唯一可编辑事实源为：

- `game/content/chapters/01.json`
- `game/content/chapters/02.json`
- `game/content/chapters/03.json`
- `game/content/chapters/04.json`
- `game/content/chapters/05.json`
- `game/content/chapters/06.json`
- `game/content/chapters/07.json`

加载顺序由 `game/content/manifest.json` 显式声明。`game/project.json` 只保存项目级配置，不再保存剧情 Scene；历史 `chapter2–6 + replaceScenes` 双层覆盖结构已经退出 production。Build 与 `scenario:check` 直接消费上述七章 canonical `scenes`，任何新的 `replaceScenes` 都会被 Scenario Gate 阻断。

## 后续门槛

任何继续压缩文本、移除配角网络、丢失核心 Ending、重新引入覆盖层，或把总汉字量降回 80,000 以下的修改，都应被 `scenario:check` 阻断。
