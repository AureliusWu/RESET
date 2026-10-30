# 《回留 / RESET》v1.3.1

NPC portrait runtime hotfix · Web/PWA + Windows x64

- 修复 29 个历史 `noSprite` 场景把已批准 NPC 与女主立绘整场隐藏的问题，覆盖全部七章。
- 使用锁定引擎已有的行级 StageCue，逐句选择当前说话人的正式立绘；旁白、陈渡与功能性说话人清空上一人物。27 条电话、录音、回忆及信件对白保留显式 `portrait: null`，下一条当面对白独立恢复。
- 陈岚第五章家中当面交谈使用现有 `chenlan/neutral`，不再沿用整场隐藏的旧约定。
- supporting cast 门禁增加真实剧情 runtime witness；最终 Web ZIP、Windows WebView2 与 Pages 验证全部 12 名配角的 frame、AssetCatalog、可见 DOM 和真实解码尺寸，补充重点场景连续换人检查。
- PWA 验证从不可变 v1.3.0 公开 Web ZIP 同源更新，待全部旧标签关闭后启用新缓存，再离线显示全部 12 名 NPC；保留旧存档、六个手动槽、设置与 Meta。
- 保留所有美术、视觉验收 SHA256、provenance、82 个 Scene、2161 行正文及所有 Scene/Line/choice/asset ID。v1.3.0 与此前公开 tag/Release 保持不变。

引擎未修改：VN Engine v2 0.3.0，`15c101e0d2b2c1e40dbc36d7a0c1a246d102b52c`。审核为用户授权的 AI 玩家观察；浏览器视口模拟和 Windows CI WebView2 验收不等于实体设备测试。

发行资产：`RESET-huiliu-v1.3.1-web.zip`、`RESET-huiliu-v1.3.1-win-x64.zip`、`SHA256SUMS.txt`。仅在同一提交的 Build、最终 Web ZIP、最终 Windows ZIP 与稳定门禁均通过后发布；Pages 只部署公开 Release 的原始 Web ZIP。
