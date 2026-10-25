# 《回留 / RESET》v1.0.1

v1.0.1 是 v1.0.0 正式发布后的战斗输入修复版本，保留原有完整剧情、角色、美术、音乐和锁定引擎。

## 下载与运行

| 平台 | 发行包 | 运行方式 |
| --- | --- | --- |
| Windows x64 | `RESET-huiliu-v1.0.1-win-x64.zip` | 完整解压到可写目录，双击根目录 `RESET.exe`，保留 `engine/` 与 `game/`。需要 Windows 10/11 x64 与 Microsoft Edge WebView2 Runtime；无需 Node.js 或 .NET SDK。 |
| Web / PWA | `RESET-huiliu-v1.0.1-web.zip` | 解压后部署至静态 HTTP / HTTPS 服务；本地可运行 `python -m http.server 8000`，通过 `http://localhost:8000/` 访问。勿直接双击 HTML。 |

下载校验值见附件 `SHA256SUMS.txt`。PWA 需要 HTTPS 或 localhost，首次联网等待“已下载，可离线游玩”后再离线重开。Web 存档与 Meta 绑定站点来源，升级时保持原域名、端口和浏览器；Windows 保持原可写安装目录和用户配置。普通剧情区间可导出存档；True Route 不可逆区间禁止备份和回退。

## 修复与复验

- 修复切后台只触发 `visibilitychange`、未触发 `blur` 时，移动键和待执行攻击/闪避可能残留的问题；页面隐藏时统一清空，返回前台不会补发旧输入。
- 保留 v1.0.0 的跨帧轻击、重击、闪避队列修复，键盘松开和触屏短点击均不会提前清除已按下的行动。
- 兼容 v1.0.0 存档：仅升级已确认剧情未变化的前一版本标识，仍由引擎完整校验并重放路线；不改动备份原文件，未知版本或非法路线仍拒绝加载。
- 新增三处战斗的键盘/触屏短点击、连续输入、按键松开、触屏取消、失焦/隐藏和退出清理回归测试；从最终发行包的插件读取测试对象。
- 重新验收全部六个 Normal End、六个关键 Bad End、True End、Meta 读取次数/结局/标题、不可逆限制及三处战斗真实胜负回接。
- Windows 从最终 ZIP 实际启动 `VNEngine.exe --game game` 与 `RESET.exe → engine/VNEngine.exe → game/`，检查原生窗口、存读档及完整进程重启持久化；启动时移除开发工具搜索路径。
- Web 从最终 ZIP 验收实际浏览器、嵌套路径、触屏布局、完整资源和真实断网重载。

## 内容与构建

- 游戏版本 `1.0.1`；内容版本 `reset-v1.0.1`；Tag `v1.0.1`。
- 82 个场景，79 个可达正式场景；六个 Normal End、六个关键 Bad End 和 True End。[结局矩阵](https://github.com/AureliusWu/RESET/blob/v1.0.1/docs/ENDING_MATRIX.md)含剧透。
- 31 张正式角色表情、20 个主要背景、5 张关键 CG，以及全部发行音乐/音效、战斗插件和 Meta 插件进入双平台发行包及 PWA 缓存。
- VN Engine v2 `0.3.0`，仍锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。
- 主 Build、Web 最终包验收、Windows 最终包原生验收在同一提交通过后才创建正式 Release。v1.0.0 的 Tag 与公开附件保留。
- 运行报告和截图见对应提交 [Release Actions](https://github.com/AureliusWu/RESET/actions/workflows/release.yml) 的 `web-validation`、`windows-validation` Artifact。

## 已知边界

- 完整无配音版；全角色语音、4K 美术、高预算手绘重制及 Boss 动画精修属于后续增强。
- 三个早期路线开场原型仍保留于源内容中，已由正式章节替代，不在可达主流程中；路线测试明确记录。
- Windows 需要 WebView2 Runtime；PWA 安装入口取决于浏览器。
- 游戏及专属素材保留全部权利，详见包内 `LICENSE.md`；引擎与第三方依赖保留各自许可。
