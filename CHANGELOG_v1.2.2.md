# 《回留 / RESET》v1.2.2

v1.2.2 是 R5 Visual Coverage 完成后的 Web / PWA 正式发布版本。本次只发布网页端与 PWA，不新增 Windows v1.2.2 Release 资产；既有 v1.2.1 Windows 包保持不变。

## R5 Visual Coverage

- 对全部对白说话人建立可机器验收的视觉映射。
- 12 名常驻配角新增正式 supporting-cast portrait，覆盖 116 条直接对白。
- 82 / 82 canonical Scene 均有正式 production background。
- 六条 Normal Route 各新增一张路线收束 CG；CG Gallery / MetaState 从 5 张扩展到 11 张。
- 静态 production visual 共 76 个：45 portrait、20 background、11 CG。
- 最终 runtime assets 共 97 个，包含 21 audio。
- production visual 离线缓存 76 / 76。
- Missing runtime visual assets：0。
- Broken visual references：0。
- Placeholder / fallback production visuals：0。

## Web / PWA

- 故事版本升级为 `reset-v1.2.2`。
- 保留标题页「进入游戏」与 Chromium `beforeinstallprompt` 安装入口。
- 保留 Service Worker 离线缓存与同源原位升级机制。
- `v1.2.1` 存档纳入受控升级白名单，快速存档、手动存档、Meta、Ending Collection 与 CG Gallery 均继续保留。
- 正式网页部署必须从公开 GitHub Release 的 `RESET-huiliu-v1.2.2-web.zip` 原样下载、校验 SHA256、逐文件校验 build manifest 后再部署到 GitHub Pages。
- Pages 部署后继续执行真实在线操作与 Service Worker 断网重载验收。

## 最终验收基线

R5 关闭时已通过：

- Dialogue visual mapping：100%
- Portrait speaker mappings：20 / 20
- Supporting cast portraits：12 / 12
- Background coverage：82 / 82
- Story / Gallery CG：11 / 11
- Release regressions：70 / 70
- Web 最终 ZIP 浏览器验收
- PWA 升级 / 离线重载验收
- R5 Final Visual Integration packaged gate

R6 发布流程会再次要求 matching main Build CI 与最终 Web ZIP 浏览器验收通过后，才允许创建 `v1.2.2` tag 与公开 Release。

## 兼容性

- 故事版本：`reset-v1.2.2`
- `reset-v1.0.0`、`reset-v1.0.1`、`reset-v1.1.0`、`reset-v1.2.0-dev`、`reset-v1.2.0-rc.1`、`reset-v1.2.0-rc.2`、`reset-v1.2.0`、`reset-v1.2.1-dev`、`reset-v1.2.1` 存档继续走受控升级与路线校验。
- VN Engine v2 锁定提交：`15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。
