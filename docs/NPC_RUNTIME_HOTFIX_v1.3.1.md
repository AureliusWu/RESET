# RESET v1.3.1 — NPC portrait runtime hotfix

## 原因与实现

锁定的 VN Engine v2 0.3.0 在 `NarrativeDriver.frame()` 的最后用 Scene `noSprite` 清空 portrait；其默认 `presentationAt()` 也会继承上一位角色。资源、审批、mapping 正确仍可能没有人物，或在旁白中残留前一人物。

本次采用 RESET 内容层修复，保持 `ENGINE.lock.json` 的 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。撤销29个旧整场开关，在构建时用既有 `stage.lines[lineId].portrait` 为每句编译独立显示状态；27条离屏语音、录音、回忆、信件使用源码中显式 `portrait: null`，后续对白不会继承这个隐藏状态。旁白、陈渡和 functional speaker 同样明确清空人物。CG 继续使用原有规则隐藏重复常规立绘。

| 章节 | 删除整场 noSprite 的 Scene |
| --- | --- |
| 01 | prologue_1842、after_school_choice、home_bad、station_refuse |
| 02 | chapter2_teaser、faceless_pattern、death_fifth、load_fifth、death_sixth |
| 03 | chapter3_gate、route_method_choice、archive_photo |
| 04 | route_focus_choice、route_convergence |
| 05 | chapter5_gate、c5_team_morning、c5_city_desync、c5_north_station、c5_echo_death、c5_countdown |
| 06 | chapter6_gate、c6_save_again、c6_no_save、c6_walk_forward、c6_escape、c6_last_door |
| 07 | c7_morning、c7_after、c7_credits |

27条离屏对白的完整 Line ID 与逐条原因见 [presentation-migration.json](evidence/npc-v1.3.1/presentation-migration.json)。陈岚在 `chapter5_gate` 家中与陈渡当面交谈，应显示现有正式立绘；门外语音和校内回忆采用行级隐藏。

## 兼容与门禁

82 Scene、2161 行、全部文本与 IDs 保持不变。还原这29个具名旧字段后，完整正文 canonical SHA256 与 v1.3.0 基线一致，并继续校验原 `final-v1.3.0/content-contract.json`；旧证据不改写。全部美术、provenance、验收及 SHA256 不改写。Meta 只增加 `reset-v1.3.0` 到既有迁移白名单，旧备份与六槽原始数据保持原样。

`check-r5-supporting-cast.mjs` 要求12/12 approved、mapped、canonical runtime-visible。异常 null 只有源码中27条具名 cue 允许；角色在别处可见也不能掩盖单句误隐藏。真实入口/选项遍历取得113条可达 supporting 对白；另3条位于保留但不可达的旧 route-open 节点，总源文契约仍为116条。

`test:npc:browser` 直接对最终项目与锁定运行库生成 canonical replay save，并通过正式 Settings 导入，在1280×900、390×844、844×390、3840×2160检查全部12名角色的 runtime frame、AssetCatalog、DOM asset/hidden、像素解码与可见性。重点场景逐句点击 Next 验证角色切换及旁白、陈渡、广播、电话不残留。无 project override、无资源替换、无独立人物 fixture 充当剧情证据。

最终 Web ZIP、Windows 原生 WebView2 和真实 Pages 都执行同一个12人 DOM gate。PWA 从 SHA256 固定的公开 v1.3.0 Web ZIP 升级；旧 client 保持旧 runtime，所有旧标签关闭后才激活新 Worker，在线及断网重开均重新验证12人。发布仍要求同 SHA Build、Web、Windows 和稳定门禁全绿，历史 tag/Release 不覆盖。

## 验证证据

构建、111项回归、技术发布门禁、12人运行时 witness 在本地执行；浏览器通信受当前容器限制，实际 DOM、PWA 与 Windows 证据由 GitHub Actions 对最终 ZIP 产生。独立 AI 观察、源/运行包 SHA256、具名玩家与截图记录保存在 `docs/evidence/npc-v1.3.1/`；各次 CI 实际结果以对应工作流和上传报告为准。

视口模拟、Windows CI WebView2 与实体设备测试分别记录；实体 Android/Windows 与真实受试者未运行。
