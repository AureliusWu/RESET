# R8 徐嘉树 neutral：真实二进制入库

2026-10-29，手机端完成 Work 云浏览器 GitHub 登录后，通过 GitHub 网页文件选择器上传三份真实图片。图片没有以 Base64 / data URI 在 Agent 或 GitHub 工具参数之间传递。

首次二进制提交：`1f2073de6c89484a6828016709294c8d4b9c4205`，候选分支 `r8-xujiashu-neutral`。后续通过 Git tree 复用已存在的 blob SHA，移动到规范资产路径，同时移除根目录临时文件名。

| 文件 | 尺寸 | SHA256 |
| --- | --- | --- |
| 原图 PNG | 941×1672 RGBA | `d8f1508e1f7974f7efd5cdf6a1512bcc8c31cf43f00c3744347decf04b556b5a` |
| processed master PNG | 2160×3840 RGBA | `6894ef6088583daf27188cd27ad323e007ecc2985bcc6084e87b54ac9936b8e9` |
| runtime WebP | 1080×1920 RGBA | `cbc74d63768ab147ded207c1d4835d7ead1c7ae5800e8f2701d764cc80c86892` |

原图不是 native 4K；master 是透明裁切、构图标准化和放大结果。提示词、角色规格、处理脚本和 provenance 一并保留。

当前仍为美术候选，owner 视觉审核尚未获得；生产 speaker mapping 保持 hidden。本次提交不是稳定发布，R8 整体门禁继续执行，不覆盖公开 Pages。

远端回读解码与 SHA256 验证已经通过；候选接入、审核保护及四视口/离线检查已恢复。接入规则和真实剩余工作见 [R8_XUJIASHU_NEUTRAL.md](R8_XUJIASHU_NEUTRAL.md)。
