# 《回留》结局矩阵

## 主路线结局

| 类型 | ID | 名称 / 含义 | 关键选择 |
| --- | --- | --- | --- |
| Normal | `normal-linwan` | 林晚 · 这一轮也算数 | 停止追查，承认这一轮的她不可替代 |
| Normal | `normal-xiaoman` | 周小满 · 今天别重来 | 不再让下一轮发生 |
| Normal | `normal-xuqi` | 许栖 · 留在被放弃的世界 | 留在夜梧城陪她 |
| Normal | `normal-tinglan` | 沈听澜 · 未归档的人 | 封存档案，不让记录继续定义陈渡 |
| Normal | `normal-tangli` | 唐梨 · 向前跑 | 离开异常区，不再回头 |
| Normal | `normal-nanxing` | 乔南星 · 已读不回 | 删除未来消息，留在现在 |
| True | `true-end` | **回留 · 明天见** | 拒绝永久存档，接受不可逆的明天 |

## 核心 Bad End

| ID | 触发 | 叙事作用 |
| --- | --- | --- |
| `bad-home` | 第一章直接回家 | 建立“异常不会只存在于调查地点” |
| `bad-station` | 在南湖站拒绝进入夜梧城 | 建立现实层同样存在危险 |
| `death-fifth` | 无面行人初战错误行动 | 第一次证明异常体会记住读取次数 |
| `death-sixth` | 重复旧闪避规律 | 证明 Boss 会学习玩家习惯 |
| `bad-no-checkpoint` | 第七人战中依赖旧习惯 | 明确 10 月 24 日已经没有可用回退点 |
| `bad-permanent-save` | 终局选择“保存这一刻” | 永久存档本身重新制造第 8 次循环 |

## 主题闭环

六个 Normal End 都允许玩家放弃“唯一正确答案”，选择和某个人一起承认当前世界的价值；它们不是失败路线。

True End 要求玩家把前面学会的“保存以避免后悔”主动放下。最终的胜利条件不是获得一个完美存档，而是允许 10 月 25 日成为真正无法撤回的明天。

## 自动验收

`scripts/check-release.mjs` 强制要求六个 Normal End、`bad-permanent-save` 与 `true-end` 存在。具体死亡型 Bad End 通过剧情和战斗回接继续验证，不把所有中间死亡都当作独立收藏结局。
