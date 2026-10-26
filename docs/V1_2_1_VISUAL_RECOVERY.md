# v1.2.1 视觉回归修复记录

日期：2026-10-27。

## 基线

- 已发布稳定版：`v1.2.0`
- 当前开发线：`v1.2.1-dev`
- 开发分支：`v1.2.1-visual-recovery`
- VN Engine v2：继续锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`
- v1.2.0 tag / GitHub Release / Pages 不移动、不覆盖。

## 事故

实体移动端截图暴露两类问题：

1. Round 7 `title-key-visual` 被作为全舞台装饰层挂入可玩序章，遮挡真实剧情画面。
2. Round 3 五位女主的正式 runtime 虽然通过尺寸、Alpha、SHA256、Decode 与自动截图检查，但实际人物比例、五官抽象程度和视觉完成度未达到正式角色立绘标准。

布局问题已由 PR #4 / main `712fe6fc3b8f0b8d7ed48cfe81ee559ed8f3ee22` 止血。

## 源资产核验

对许栖 `neutral.webp` 进行 Git blob 对比：当前 main 与 Round 3 ChatGPT 原图→4K 管线提交 `55f8b98f0d1001bbeb0e1ac4f24b6e740fe60002` 使用同一 blob。

结论：不存在可直接回滚恢复的“更好旧 runtime”。Round 3 源资产本身需要重新进行视觉生产与人工验收。

## v1.2.1 规则

以 `GALGAME SPEC v0.2` 为准：

```text
TECH_READY != ART_READY
```

`game/assets/4k/visual-acceptance.json` 是角色人工视觉验收的事实源。

正式角色必须通过：

- Identity
- Style Consistency
- Body Proportion
- Expression Readability
- Desktop Composition
- Mobile Composition
- Provenance Truth

尺寸、Alpha、文件存在、SHA256、浏览器 Decode、自动渲染成功只能证明 `TECH_READY`。

## 当前状态

| 角色 | Visual Gate |
|---|---|
| 林晚 | PASS |
| 周小满 | BLOCKED |
| 许栖 | BLOCKED |
| 沈听澜 | BLOCKED |
| 唐梨 | BLOCKED |
| 乔南星 | BLOCKED |

因此：

```text
v1.2.1-dev BUILD      ALLOWED
v1.2.1 stable RELEASE BLOCKED
```

## 工程修复

- Production Build 不再执行 `scripts/generate-portraits.mjs`。
- 新增 `scripts/check-art-visual-gate.mjs`。
- 候选 Build 会报告 Visual Gate，但允许生成 QA 包。
- Stable Gate 使用 `--release`；任一角色非 PASS 直接失败。
- Web/Windows `release.yml` 在视觉恢复期间为 candidate-only，不包含 publish job。
- `tests/production-art-browser.mjs` 增加 390×844 每角色 neutral 实际剧情截图与舞台边界检查。
- v1.2.0 正式存档加入 v1.2.1-dev 迁移来源。

## 解除 Blocker 的标准

每位 Round 3 角色逐个执行：

```text
重建 neutral
→ 人工对照林晚基准
→ 桌面剧情截图 PASS
→ 390×844 手机剧情截图 PASS
→ 表情差分
→ Master / Runtime
→ Provenance / SHA256
→ 再次实际场景验收
→ visual-acceptance.json = PASS
```

五人全部 PASS 后，才能恢复 v1.2.1 stable publish job、冻结候选 SHA、生成正式双平台 ZIP、tag、GitHub Release 与 Pages。
