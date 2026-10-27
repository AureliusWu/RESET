# 《回留》美术资产约束

R2 起，正式静态 production 资产由 `game/assets/manifest.json` 统一声明。角色、背景与 CG 的运行时来源必须是 `assets/4k/runtime/` 下的 canonical WebP；4K master、原图与 provenance 继续保留用于审计和再加工。历史 SVG、生成占位图与 asset replacement overlay 不再属于 production 链。

## 已锁定视觉方向

- 现代中国校园 / 城市 Galgame。
- 日系二维视觉小说语汇，但人物、校服、街道、地铁、住宅与商业空间保持中国语境。
- 角色采用干净线稿、克制赛璐璐上色、少量柔和渐变。
- 禁止把高细节 AI 概念海报、重厚涂、过度摄影感直接作为标准立绘。
- 背景可以比角色稍写实，但仍需二维动画化。
- 正常世界清透克制；异常只在关键场景增加冷色、紫蓝、错位和局部失真。

## 角色资产规则

1. 正式 heroine 基线表情统一为 neutral / smile / worried / surprised / serious。
2. 许栖保留剧情实际使用的 angry 差分。
3. 林晚历史 base / normal 别名已在 R2 退役；neutral 是唯一 baseline。
4. 林晚 sad 是已完成 extra，保留 master/runtime 源文件，但当前剧情不引用、正式发行包不携带。
5. 差分必须保持同一角色身份、体型、服装与 body lock，不允许无依据漂移。
6. 新增 production Asset ID 必须先进入 `game/assets/manifest.json`，不得通过内容 pack 覆盖旧资产。

## 六位角色识别点

- 林晚：长黑发、冷灰蓝眼、蓝白校服、气质克制。
- 周小满：暖棕发、琥珀眼、活泼、画具 / Q 版挂件。
- 许栖：银白长发、浅金眼、暗色机能 / 哥特细节、掌机与有线耳机。
- 沈听澜：深茶棕长发、细金属框眼镜、档案本与钥匙。
- 唐梨：红棕高马尾、运动感、橙珊瑚强调色、护膝 / 耳机。
- 乔南星：黑发带深蓝光泽、紫蓝眼、手机、星形小元素。

## 生产与审计

- `game/assets/manifest.json`：Asset ID / kind / runtime path 唯一 production 事实源。
- `game/assets/4k/asset-plan.json`：master/runtime 尺寸与配对规则。
- `game/assets/4k/visual-acceptance.json`：人工视觉 PASS 事实源。
- `game/art-sources/chatgpt/**/provenance.json`：原图、master、runtime 的来源与 SHA256。
- `npm run asset:schema` / `npm run art:check`：结构、文件、尺寸、Alpha、provenance 与视觉门禁。
