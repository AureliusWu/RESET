# R6 Publication Checklist

状态：**COMPLETED / PASS**

- [x] Version frozen at `v1.2.2` / `reset-v1.2.2`
- [x] v1.2.1 added to controlled save-upgrade compatibility
- [x] R5 final visual gates remain mandatory
- [x] Web/PWA-only publication path established
- [x] Pages deploys only from the public verified Release ZIP
- [x] PR Build PASS
- [x] PR Web ZIP browser acceptance PASS
- [x] Release candidate merged to `main`
- [x] Matching main Build PASS
- [x] Public `v1.2.2` Release created with Web ZIP + `SHA256SUMS.txt`
- [x] Public Release contains no v1.2.2 Windows ZIP
- [x] Pages public Release ZIP SHA256 verification PASS
- [x] 154 packaged files verified against `build-manifest.json`
- [x] Stable release verifier: 70 / 70 PASS
- [x] Pages deploy PASS
- [x] Public HTTPS / MIME / production-art smoke PASS
- [x] Public quick save / manual slot / Meta / Ending Collection smoke PASS
- [x] Public True End restore / retained Meta / restart PASS
- [x] Actual hosted PWA Service Worker offline reload PASS

## Published result

- Release: `v1.2.2` — Web/PWA
- Release tag target: `1cfb2eef71e4921b746be2b1af93350a4abeb147`
- Public site: `https://aureliuswu.github.io/RESET/`
- Web ZIP SHA256: `a0eadf71b0e2b8a45c0ecb6f7033b8b0f2530ff4f463d62a7618dd4e9febf791`
- Final Pages acceptance run: `40622230933` — PASS

The post-release acceptance-script correction changed only `tests/pages-live.mjs`; the deployed bytes remain the unchanged public `v1.2.2` Release ZIP above.
