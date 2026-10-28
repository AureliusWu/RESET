# R6 — Web / PWA Release

目标版本：`v1.2.2`

目标：把 R5 Visual Coverage 后的当前 `main` 正式发布到 Web / PWA，并保持已发布的 v1.2.1 Windows 资产不变。

## 发布边界

- Git tag：`v1.2.2`
- GitHub Release：公开稳定版
- Release 资产：
  - `RESET-huiliu-v1.2.2-web.zip`
  - `SHA256SUMS.txt`
- **不发布** `v1.2.2` Windows ZIP。
- v1.2.1 tag / Release / Windows ZIP 不移动、不覆盖。

## 强制门禁

发布提交必须同时满足：

- matching `Build 回留` push CI：PASS
- `npm run check:stable`：PASS
- R5 Final Visual Integration：PASS
- Web ZIP 解压后 `npm run test:release`：PASS
- Web ZIP 浏览器验收：PASS
- PWA 从 v1.1.0 原位升级：PASS
- Service Worker 离线重载：PASS
- story version：`reset-v1.2.2`
- packaged runtime assets：97

## Pages 部署

GitHub Pages 不从开发分支直接部署。`v1.2.2` Release 公开后，现有 `pages.yml` 必须：

1. 从公开 Release 下载 `RESET-huiliu-v1.2.2-web.zip`；
2. 从 `SHA256SUMS.txt` 校验 ZIP；
3. 校验 ZIP 内 `build-manifest.json` 的版本与逐文件 SHA256；
4. 使用 `v1.2.2` tag 中的稳定测试代码运行 release regressions；
5. 部署原样解压后的 Web/PWA；
6. 对真实公网地址执行在线操作与 Service Worker 断网重载验收。

只有 Pages workflow 完成后，R6 才视为正式关闭。
