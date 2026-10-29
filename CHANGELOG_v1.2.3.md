# 《回留 / RESET》v1.2.3

2026-10-29 · R8 原生美术与双平台更新

## 美术与显示

- 本轮 46 项原生来源链完整入库，加上徐嘉树先导共 47 项：12 名配角、2 个异常体、8 张 CG、20 张专用背景、5 张 UI。
- 12 名配角在用户“验收由你来模拟人类执行”的授权下完成逐项 AI 模拟人工视觉审核，绑定 original/master/runtime 与报告 SHA256，正式 speaker mapping 已启用。
- 保留六位女主已批准图片和陈岚正文 noSprite 规则；82 场景、Scene/Line/choice/asset ID 与剧情不变。
- 修复六个普通结局 CG 上的重复立绘；CG 消失后正常对话立绘恢复。
- 美术审计等待真实标题界面挂载，CG-only 表情使用真实路线 witness 检查，不伪造正文画面。
- runtime manifest：45 立绘、40 背景、11 CG、21 音频，共 117 项；5 张 UI 装饰图另计。
- 保存原图、processed 4K master、runtime WebP、实际 prompt/spec、SHA256/provenance。放大母版不声称 native 4K。

## 平台与存档

- Web/PWA 与 Windows x64 同步发布；Windows 包包含 RESET.exe、VNEngine.exe 和 game/，无需 Node.js 或 .NET SDK。
- 故事版本 reset-v1.2.3；v1.2.2 加入受控存档升级，既有 v1.0.0 至 v1.2.1 及列明开发版本的兼容支持保留。
- 快速存档、六个手动槽、设置、Meta、结局与 CG 收藏跨升级保留；不原地改写旧备份，非法路线继续拒绝。
- PWA 从实际公开 v1.2.2 ZIP 执行同源升级验收，关闭旧客户端后激活新缓存，并验证离线重载。

## 发布门禁与验收口径

同一发布提交必须通过 Build、严格 check:stable、85 项回归、最终 Web ZIP 浏览器验收和最终 Windows ZIP 原生 WebView2/进程重启验收，才创建新 tag 与公开 Release。两个 ZIP 同时列入 SHA256SUMS.txt；Pages 只部署公开 Release 的原始 Web ZIP，并继续验证公网操作与断网重载。

视觉审核类型为 ai-simulated-human，owner 与 AI 批准分别计数。Android 物理设备、实体 Windows/显示器 DPI 未实测；手机视窗/触摸、Windows CI 原生运行及内容 DPI 模拟独立记录。完整观察见 docs/R8_AI_REVIEW.md 与 docs/evidence/r8-ai-review/review.json。

VN Engine v2 继续锁定 0.3.0 / 15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c；不修改既有公开 tag 或 Release 资产。
