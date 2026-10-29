# 徐嘉树 neutral 候选验证

验证对象：`a167fb0d70fe45638213934a465721332eb22cbb`。本目录后续提交仅保存检查证据，不修改游戏运行文件。

- 原始二进制上传与规范路径回读：三份文件真实解码、尺寸、透明度和 SHA256，见 `remote-byte-verification.json`。
- Build / check:release / 78 项回归日志保留。
- `browser-audit.json`：四视口、真实 morning_after 剧情、候选映射覆盖、开场 noSprite 保留、neutral 锚点和离线字节验证。
- `stable-gate.log`：按预期退出 2，12 名配角仍缺 owner 视觉通过；自动检查没有生成美术 PASS。
- Android 是视口模拟，未冒充实机；未执行 Windows 原生。未部署 Pages。
