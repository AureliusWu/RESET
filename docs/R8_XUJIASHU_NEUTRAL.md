# R8 徐嘉树 / neutral 单张候选

2026-10-29：已通过手机端 Work 云浏览器上传真实二进制图片，并写入候选分支。图片入库及技术验证已完成，owner 视觉审核与生产映射启用仍待完成。

## 来源与文件

- 唯一原图：2026-10-28 的真实 ChatGPT 原生 `image_gen.imagegen` 输出；没有重新生成。
- 原图 941×1672；processed master 2160×3840；runtime WebP 1080×1920，均为 RGBA。
- master 是透明裁切、构图标准化与放大结果，`native4kClaim=false`。
- 三份图片、spec、prompt、处理参数和 SHA256 见 `game/art-sources/chatgpt/characters/xujiashu/provenance.json`。
- 手机安全登录完成后，网页文件选择器上传三份图片，提交 `1f2073de6c89484a6828016709294c8d4b9c4205`；规范路径与 provenance 提交 `226704c3380bbe36d6949dbd2c8634579e733558`。
- 从 GitHub 拉取规范路径实际字节，三份文件均已解码且 SHA256 与保存素材完全一致。上传过程没有图片 Base64 参数。

## 技术检查与候选预览

使用锁定引擎 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`：Build、候选 check:release、78 项 test:release 通过。

`tests/xujiashu-art-browser.mjs` 对真实构建包运行 1280×900、390×844、844×390、3840×2160 检查。通过合法剧情存档到达 `morning_after / r1_morning_after_pre03_01`，验证完整解码、舞台边界、不遮挡阅读区、后续台词 neutral 锚点稳定，以及 Service Worker 控制页面后的离线 WebP 字节。

当前徐嘉树为 UNVERIFIED，生产 speaker mapping 仍隐藏。浏览器检查仅在隔离页面响应中加入候选 speaker mapping，截图明确标为候选；这不构成生产接入或 owner 美术 PASS。开场 `prologue_1842.noSprite=true` 保持，预览也不会显示立绘。

浏览器使用 Chromium 153.0.8010.0。手机是视口模拟，Android 实机与 Windows 原生未在本轮执行。Noto Sans SC 仅用于检查环境，不增加游戏字体依赖。

## 审核后接入

`game/assets/4k/visual-acceptance.json` 保留六位女主原有 PASS，独立登记 12 名配角；徐嘉树 UNVERIFIED，其余 11 人 BLOCKED。

owner 对当前具体图片完成独立视觉审核后，在徐嘉树记录中填入：

- `status: PASS`；
- `review.type: owner`、真实 `review.name` 和 `review.completedAt`；
- 七项 `review.checks` 的真实 PASS：identity、styleConsistency、bodyProportion、expressionReadability、desktopComposition、mobileComposition、provenanceTruth；
- `review.artifactSHA256.original/master/runtime`，必须与该记录 artifacts 及实际文件一致。

随后执行：

```bash
npm run art:support:apply
VN_ENGINE_PATH=/path/to/locked-engine npm run build
VN_ENGINE_PATH=/path/to/locked-engine npm run check:release
VN_ENGINE_PATH=/path/to/locked-engine npm run test:release
VN_ENGINE_PATH=/path/to/locked-engine npm run test:art:xujiashu
```

应用命令只消费已有批准，不创建批准。源映射、打包映射、原生 provenance 与文件 SHA256 由共同门禁校验；任何图片字节变更都会使对应批准失效。

## 发布边界

这是候选分支，不是稳定发行。R8 全部 12 名配角与最终 Web / Android / PWA 门禁完成前，不覆盖公开稳定 Pages。当前正式美术发布门禁按预期拒绝发布。
