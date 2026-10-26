# 《回留 / RESET》开发约定

- 当前稳定发行线为 `v1.2.0`；`v1.2.0-rc.1` / `v1.2.0-rc.2` 保留为历史候选基线。已经发布的稳定 tag 与 Release 资产不得移动或覆盖；后续修改必须进入新的开发版本。
- 项目为现代中国校园 VN、六角色路线、都市灵异、读档 Meta 与少量实时 2D Boss 战。保留陈渡、林晚、周小满、许栖、沈听澜、唐梨、乔南星及现有剧情骨架。
- True End 保持“不保存 → 不可逆 → 10 月 25 日 → 明天见”。不可逆限制必须在 runtime 边界真实生效，不能只写成台词。
- 引擎继续独立使用 VN Engine v2 0.3.0，精确锁定 `15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。普通作品功能放在本仓库，不复制或重构引擎；其他四作不在本任务修改范围。
- 保持场景、台词、选项与资产 ID；修改存档数据结构时必须提供迁移。v1.0.0、v1.0.1、v1.1.0、v1.2.0-dev、v1.2.0-rc.1、v1.2.0-rc.2 的备份和六个手动槽都必须兼容。旧备份不能原地改写。
- 保留现有二维动画感 production 视觉方向；正常演出为主，异常演出克制。保持无角色配音版，语音不是发布阻断项。
- `.github/workflows/release.yml` 的稳定发布必须等待同 SHA 的 Build、最终 Web ZIP 与最终 Windows ZIP 验收全绿后，才允许创建不可移动 tag、GitHub Release 与 `SHA256SUMS.txt`。Pages 只能使用已公开稳定 Release 的原 ZIP、SHA256 与 manifest，不能直接部署 main 的 dist。
- 修改战斗后运行全部战斗输入回归；修改存档、Meta、收藏、PWA、触屏后补充相关回归。`npm run build`、`npm run check:release`、`npm run test:release` 为基础门禁，CI 从最终 ZIP 运行浏览器与 Windows 原生验收。
- 浏览器模拟、实体 Android、Windows CI 原生 WebView2、实体 Windows/DPI 必须分开记录。模拟和编译通过不能冒充实机通过。
- 小步提交，记录真实状态。v1.2.0 之后的工作从新的开发版本开始，不改写 v1.2.0 发布证据。
