# 《回留》v1 发布验收清单

## 内容闭环

- [x] 共通线有完整开场、中段、高潮与结局
- [x] 六位主要角色均有独立调查核心与 Normal End
- [x] True Route 揭示读档、锚点、第七人、夜梧城的关系
- [x] “杀你的人不是凶手”伏笔在 10 月 24 日闭环
- [x] “不要保存”在最终选择中兑现
- [x] True End 抵达 10 月 25 日并结束读档循环
- [x] 六个 Normal End、关键 Bad End、True End 均进入自动验收

## 系统

- [x] VN Engine v2 独立构建
- [x] 多存档、历史、自动、快进、设置由引擎提供
- [x] PWA 离线缓存与完整性 manifest
- [x] Windows 原生宿主可承载打包作品
- [x] 《回留》专用 `RESET.exe` 启动器
- [x] 内容包组合构建
- [x] 战斗 / Meta / production art 作品插件进入 build manifest
- [x] 构建身份、结局、关键剧情节点和 production 资产自动校验
- [x] Web/PWA Release Candidate 构建与完整性验收通过
- [x] Windows Release Candidate 实际游戏窗口与 `RESET.exe` 启动链验收通过

## 玩法

- [x] 无面行人：观察前摇、死亡、重复挑战、敌人学习玩家
- [x] 第七人：以旧选择预测玩家的第二场异常对抗
- [x] 可操作的实时 2D 战斗模块
- [x] 移动、体力、轻/重攻击、闪避无敌帧、Boss 前摇与二阶段
- [x] 键鼠与触屏战斗控制
- [x] 战斗尝试次数跨读取保留，敌人按历史尝试调整节奏
- [x] 战斗胜负调用原 VN choice，无缝回接剧情与状态
- [x] True Route 不可逆区间真实禁用存档 / 读档 / 重开控件
- [x] 实际 restore 次数、结局与 True End 进入作品级 MetaState

## 美术

- [x] 全部主线剧情节点具备背景 / 立绘 / CG 或合理无立绘演出
- [x] 六位主要角色正式统一底模
- [x] 六位主要角色五套核心表情统一；许栖追加 `angry`
- [x] 20 个主要背景统一为 production v1
- [x] 5 张关键 CG 统一为 production v1
- [x] 正常梧城与异常世界形成稳定的色彩规则
- [x] production 资产进入离线缓存与自动完整性检查
- [x] 不再把早期 legacy 占位路径作为发布资产

## 音频

- [x] 可重复生成的原创程序音乐/音效管线
- [x] 日常、夜梧城、战斗、路线、悬疑等主题进入构建
- [x] 终局“不保存”与 True End“明天见”独立配乐
- [x] 发行音频统一峰值归一化与软限幅
- [x] 终局音乐文件、场景绑定和离线缓存进入发布检查
- [ ] 全角色语音（**可选增强，不阻断无配音 v1**）

## 发布与法律

- [x] 游戏内容版权边界文件
- [x] 引擎固定到已审计提交
- [x] 引擎 / 第三方许可进入 Windows 包
- [x] Web + Windows 双发布工作流
- [x] Windows 构建链完成游戏构建、宿主编译、启动器编译与发行目录组装
- [x] Windows host-policy、实际《回留》原生窗口、`RESET.exe` 启动子进程验收全绿
- [x] `v1.0.0` 版本冻结
- [ ] `v1.0.0` 标签与最终 Release 产物

## v1 冻结条件

当前冻结提交必须同时满足：

1. 主 Build CI 通过 `npm run check:release`。
2. Web Release CI 生成独立 PWA 压缩包并通过内容完整性检查。
3. Windows Release CI 生成自包含 `RESET.exe + VNEngine.exe + game/` 包，并通过宿主安全策略、实际作品原生窗口和启动器链路检查。
4. 三处实时战斗节点仍拥有正确的 VN 胜负回接动作。
5. True End、六个 Normal End 与关键 Bad End 自动检查通过。
6. 角色、20 个主要背景、5 张关键 CG 与两首终局音乐保持 production 路径且全部进入离线缓存。
7. 发行包不依赖 RESET 或 VN Engine 开发仓库即可运行。

全角色语音、4K 美术、高预算手绘重制属于后续增强，不属于 v1.0.0 阻断项。
