# 《回留 / RESET》v1.2.1

v1.2.1 是 v1.2.0 发布后的移动端与标题页回归修复版本。角色正式美术保持不变，并已由项目所有者确认通过视觉验收。

## 修复

- 将标题 Key Visual 从不可交互的装饰覆盖层改为真实标题页，提供明确的「进入游戏」入口。
- 修复标题页遮挡底层 VN 控件导致游戏无法进入的问题。
- 修复 Android 竖屏与 844×390 短横屏布局，标题、剧情选项、工具栏与面板触控目标保持至少 44px。
- 恢复 v1.2.0 的桌面与 4K 宽屏布局，避免移动端修复影响桌面舞台比例。
- 保留 safe-area 适配，改善短屏、横屏和刘海屏可用性。
- 接入 `beforeinstallprompt`，当 Chromium 判定可安装时在标题页显示「安装到设备」。
- 保留 Service Worker 离线缓存，并验证从 v1.1.0 PWA 原位升级、离线重载、快速存档、手动存档、Meta、结局与 CG 收藏均可保留。
- Windows x64 原生启动链继续使用锁定的 VN Engine v2，并通过打包后 WebView2 实装验收。

## 美术门禁

六位角色生产美术均为 `PASS`：

- 林晚
- 周小满
- 许栖
- 沈听澜
- 唐梨
- 乔南星

继续执行：

```text
TECH_READY != ART_READY
```

本版本没有重新生成或替换已确认的角色正式美术。

## 验收

发布候选已通过：

- Build / release integrity / 4K production audit
- 70 项 release 回归测试
- Web 最终 ZIP 浏览器验收
- 320×568、360×640、390×844、844×390 Android 模拟与触控验收
- 1920×1080、3840×2160 桌面/4K 布局验收
- PWA 安装入口、Service Worker、离线重载与 v1.1.0 升级验收
- Windows x64 `RESET.exe → VNEngine.exe → WebView2` 最终 ZIP 验收

## 兼容性

- 故事版本：`reset-v1.2.1`
- `v1.0.0`、`v1.0.1`、`v1.1.0`、`v1.2.0-dev`、`v1.2.0-rc.1`、`v1.2.0-rc.2`、`v1.2.0` 与 `v1.2.1-dev` 存档继续走受控升级与路线校验。
- VN Engine v2 锁定提交保持 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。
