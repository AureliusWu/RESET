# R5 Final Visual Integration Audit

状态：`FINAL CI VERIFYING`

本文件用于关闭 R5，不用于替代 Build / Release CI。最终状态只有在 PR 的 Build、Web Release、Windows Release 全部通过后才能改为 `PASS`。

## Canonical coverage

| Gate | Required | Evidence |
| --- | ---: | --- |
| Canonical scenes | 82 / 82 | `scripts/check-r5-final-integration.mjs` |
| Dialogue visual classification | 100% | `scripts/check-r5-visual-coverage.mjs --final` |
| Portrait speaker mappings | 20 / 20 | final integration gate |
| Supporting cast portraits | 12 / 12 | `scripts/check-r5-supporting-cast.mjs` |
| Supporting direct dialogue | 116 lines | supporting-cast gate |
| Background scene coverage | 82 / 82 | `scripts/check-r5-background-coverage.mjs` |
| Production backgrounds | 20 | asset schema + final integration gate |
| Production portraits | 45 | asset schema + final integration gate |
| Story / Gallery CG coverage | 11 / 11 | `scripts/check-r5-key-cg-coverage.mjs` |
| Static production visuals | 76 | final integration gate |
| Packaged runtime assets | 97 | final integration gate |
| Offline-cached production visuals | 76 / 76 | final integration gate |

## Zero-tolerance checks

- Missing packaged runtime visual asset: **0 required**
- Broken production visual reference: **0 required**
- `pending-support-portrait`: **0 required**
- Placeholder / fallback / SVG marker in production visual manifest: **0 required**
- Production asset omitted from packaged project asset list: **0 required**
- Gallery CG without canonical story trigger: **0 required**
- Story CG without production asset / Gallery registration: **0 required**

## Platform acceptance

Final close requires all of the following on the same PR head:

- Build 回留: PASS
- Web: final extracted ZIP browser acceptance PASS
- Windows: native host startup smoke PASS
- Windows: actual installed ZIP + process restart PASS
- Publish: SKIPPED unless a separate explicit release action is requested

## Release boundary

R5 visual closure does not move, recreate, or overwrite the existing `v1.2.1` tag, GitHub Release, or Pages deployment. It only advances `main` after the final integration PR is green.
