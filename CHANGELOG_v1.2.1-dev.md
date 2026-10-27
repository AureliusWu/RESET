# 《回留 / RESET》v1.2.1-dev

`v1.2.1` 是 v1.2.0 发布后的移动端与标题交互修复版本。当前仍处于开发候选阶段；公开稳定版、GitHub Release 与 Pages 继续保持 v1.2.0，直到本文件列出的移动端发布阻断全部解除。

## 修复范围

- 将 Round 7 Key Visual 从可玩剧情覆盖层改为独立标题 Gate，提供明确的 `进入游戏` 交互。
- 标题 Gate 退出后从 DOM 移除，避免透明遮罩继续阻挡 VN 工具栏、剧情按钮与触摸操作。
- 捕获 `beforeinstallprompt`，在浏览器确认 PWA 可安装时提供 `安装到设备` 操作。
- 增加短高度移动横屏布局，压缩标题、阅读区与工具栏占用，保持舞台和触摸操作可用。
- 保留 safe-area 与移动触摸目标尺寸约束。
- 现有六位角色正式美术已由项目所有者确认，`game/assets/4k/visual-acceptance.json` 中角色与 `releaseGate` 均为 `PASS`；本版本不重画角色资产。
- 生产 Build 继续禁止 `scripts/generate-portraits.mjs` 进入正式资产链。
- Web / Windows / Android 模拟验收统一先真实通过标题 Gate，再测试底层 VN 交互，避免测试脚本绕过真实启动流程。

## v0.2 视觉门禁

v1.2.1 继续执行 `GALGAME SPEC v0.2`：

```text
TECH_READY != ART_READY
```

当前角色人工视觉 Gate：

```text
林晚      PASS
周小满    PASS
许栖      PASS
沈听澜    PASS
唐梨      PASS
乔南星    PASS

ART GATE  PASS
```

`check:stable` 在开发候选阶段只负责生产美术 Gate；`1.2.1-dev` 的稳定语义版本身份由后续正式 tag / publish 流程检查。开发分支仍无 publish job。

## 兼容性

- 开发故事版本：`reset-v1.2.1-dev`。
- v1.2.0 正式存档继续作为受控升级来源；旧备份不原地修改，并继续经过引擎路线校验。
- VN Engine v2 锁定版本不变。
- 正式线上继续保持 v1.2.0，候选验收完成前不覆盖 Pages。

## 当前发布条件

v1.2.1 进入正式发布前必须同时满足：

```text
标题页真实进入交互 PASS
+
移动端竖屏 / 横屏场景 PASS
+
PWA 安装路径 PASS
+
PWA 离线重载 PASS
+
Web 候选 ZIP PASS
+
Windows 原生候选 ZIP PASS
+
Build / Release CI 全绿
+
真机最终复核 PASS
```
