# R5 Final Visual Integration Audit

状态：`PASS`

R5 Final Visual Integration 已在同一 PR 头上通过 Build 与 Release 平台验收。Build run `40618511057`、Release run `40618511041` 均完成要求的正式门禁；Release 的 publish job 按边界保持 `SKIPPED`。

## Canonical coverage

| Gate | Result | Evidence |
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

- Missing packaged runtime visual asset: **0**
- Broken production visual reference: **0**
- `pending-support-portrait`: **0**
- Placeholder / fallback / SVG marker in production visual manifest: **0**
- Production asset omitted from packaged project asset list: **0**
- Gallery CG without canonical story trigger: **0**
- Story CG without production asset / Gallery registration: **0**

## Platform acceptance

Same-head acceptance used for R5 closure:

- Build 回留 — run `40618511057`: **PASS**
  - `visual:r5:final`: PASS
  - release/stable integrity: PASS
  - 70 / 70 release regressions: PASS
- Web — Release run `40618511041`: **PASS**
  - stable composed content: PASS
  - final extracted Web ZIP browser acceptance: PASS
- Windows — Release run `40618511041`: **PASS**
  - native host policy and actual RESET startup smoke: PASS
  - actual installed Windows ZIP + process restart: PASS
- Publish — Release run `40618511041`: **SKIPPED**

## Build artifact evidence

Build run `40618511057` uploaded the standalone stable build after all final gates passed:

- packaged runtime assets: 97
- uploaded files: 155
- artifact SHA256: `cc942f8dc983ec5334c0ff038d69c8cdf704863566b5c1348524c9984cca3589`

## Release boundary

R5 visual closure does not move, recreate, or overwrite the existing `v1.2.1` tag, GitHub Release, or Pages deployment. The final integration PR advances only `main`; a future public release remains a separate explicit action.
