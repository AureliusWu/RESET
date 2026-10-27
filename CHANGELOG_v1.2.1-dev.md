# 《回留 / RESET》v1.2.1-dev

`v1.2.1` 是 v1.2.0 发布后的视觉回归修复版本。当前处于开发阶段；公开稳定版、GitHub Release 与 Pages 继续保持 v1.2.0，直到本文件列出的视觉阻断全部解除。

## 修复范围

- 修复 Round 7 标题 Key Visual 在可玩剧情场景中全屏覆盖正文的问题。
- 为桌面与移动端角色立绘增加安全构图边界，避免角色压住阅读区与主要交互。
- 将周小满、许栖、沈听澜、唐梨、乔南星五位 Round 3 角色重新列为 `ART_BLOCKED`，不得以尺寸、Alpha、SHA256、Decode 或自动渲染成功代替人工美术验收。
- 生产 Build 不再执行 `scripts/generate-portraits.mjs`；该确定性 SVG 生成器降级为历史/原型工具，禁止进入正式 production 资产链。
- 新增 `game/assets/4k/visual-acceptance.json`，作为角色人工视觉验收 Single Source of Truth。
- 新增发布硬门禁：稳定发布时任一角色仍为 `BLOCKED / FAIL / UNVERIFIED`，`check:release` 必须失败。

## v0.2 视觉门禁

v1.2.1 按 `GALGAME SPEC v0.2` 的原则执行：

```text
TECH_READY != ART_READY
```

正式角色必须同时通过：

- Identity
- Style Consistency
- Body Proportion
- Expression Readability
- Desktop Composition
- Mobile Composition
- Provenance Truth

只有全部人工视觉项 `PASS`，才能把 `releaseGate` 从 `BLOCKED` 改为 `PASS`。

## 当前阻断

```text
林晚      PASS
周小满    BLOCKED
许栖      BLOCKED
沈听澜    BLOCKED
唐梨      BLOCKED
乔南星    BLOCKED

RELEASE   BLOCKED
```

五位 Round 3 角色需以林晚最终正式立绘为唯一角色美术基准，重建 neutral，再从通过验收的 neutral 制作表情差分。真实剧情截图与移动端/桌面端构图证据必须保留。

## 兼容性

- 开发故事版本：`reset-v1.2.1-dev`。
- v1.2.0 正式存档加入受控升级来源；旧备份仍不原地修改，并继续经过引擎路线校验。
- VN Engine v2 锁定版本不变。

## 发布条件

v1.2.1 不得进入正式发布，直到：

```text
5 位 Round 3 女主重建完成
+
人工视觉 Gate 全 PASS
+
Provenance 修正
+
Web / Windows Build PASS
+
移动端 / 桌面端实际场景视觉验收 PASS
+
最终 ZIP 回归 PASS
```
