# 回留 / RESET

<!-- project-badges:start -->
[![Version](https://img.shields.io/github/v/tag/AureliusWu/RESET?sort=semver&style=flat-square&label=version)](https://github.com/AureliusWu/RESET/tags) [![Build](https://github.com/AureliusWu/RESET/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/AureliusWu/RESET/actions/workflows/build.yml) [![Last commit](https://img.shields.io/github/last-commit/AureliusWu/RESET?style=flat-square)](https://github.com/AureliusWu/RESET/commits/main) [![License](https://img.shields.io/github/license/AureliusWu/RESET?style=flat-square)](LICENSE)
<!-- project-badges:end -->

当前正式版：`1.3.1`，故事版本 `reset-v1.3.1`。Web/PWA + Windows x64。

> 有些选择可以重来，有些人却只能遇见一次。

发生在架空城市“梧城”的现代校园视觉小说，围绕读档、记忆残响、都市灵异、恋爱、多周目与“无法重来的选择”展开；关键节点包含少量可操作的 2D 实时战斗。

[v1.3.1 Release](https://github.com/AureliusWu/RESET/releases/tag/v1.3.1) · Web/PWA 以正式 Release 产物部署

## 当前内容

- 共通线、六角色 Normal End、关键 Bad End、True Route / True End 已闭环。
- 82 个场景、六位女主与 supporting cast 正式运行时立绘。
- 背景、CG、音乐、音效、章节卡与跨读档 Meta。
- 6 个手动存档槽、快速存档、Ending Collection 与 CG Gallery。
- Web/PWA 离线缓存与 Windows 自包含宿主。
- True Route 含不可逆区间与独立存档 / Meta 规则。

## 引擎与构建

锁定 `AureliusWu/VN-Engine-v2` v0.3.0：

`15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`

需要 Node.js 22+，并将锁定引擎放在同级目录或设置 `VN_ENGINE_PATH`。

```bash
npm run build
npm run check:stable
npm run test:release
npm run test:routes
npm run test:browser
npm run test:players
```

## AI / 维护者入口

修改前先读 [AGENTS.md](AGENTS.md)。

- 正文事实源：`game/content/chapters/01.json` 至 `07.json`，加载顺序见 `game/content/manifest.json`。
- 资产事实源：`game/assets/manifest.json`。
- 角色视觉验收事实源：`game/assets/4k/visual-acceptance.json`。
- 引擎锁定：`ENGINE.lock.json` 与上方精确提交。
- 跨仓制作：`docs/production/VN-WORKFLOW-R1.md`、`.vn/workflow.json`。
- 当前发行、热修与机器证据：GitHub Release、`CHANGELOG_v1.3.1.md`、`docs/NPC_RUNTIME_HOTFIX_v1.3.1.md`。

严格保持 `TECH_READY != ART_READY`：构建、尺寸、哈希或截图通过不能单独授予视觉验收 PASS。不要移动历史稳定 tag / Release，不要替换已授权角色美术，也不要把浏览器模拟写成实体设备实测。

README 只保留当前作品、构建入口和 AI 真相源；历史轮次、验收流水、兼容版本列表和资产统计继续放在 `docs/`、Release 与 Git 历史中。

## License

《回留》内容与专属资产许可见 `LICENSE.md`；VN Engine v2 采用其独立 MIT License。