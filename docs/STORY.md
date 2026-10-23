# 特殊客人与剧情

一位特殊客人 = 一个完整的内容包：登场条件、剧情、新食材、新菜式、头像、配饰，全写在 `js/data/stories/<id>.js` 一个文件里。
新玩法（步骤）和新互动各是一个独立模块，可以被不同客人复用。引擎（`js/story.js`）、座位、✦、存档、结算都不用动。

## 规则（已实现）

- 一夜最多 1 位特殊客人。只在"当前这一夜"（真记账的夜）出现；教学夜和回头重玩的练习夜不来。
- 关卡 `npcs: ['songshu']` 决定这一夜允许谁来（`data/levels.js`）；还要满足剧情自己的 `when` 和当前章节的 `when`。
- 登场时间在本夜 25%–60% 之间随机，座位全满就等空位；最后 25 秒不再安排。
- 入座后头顶 ✦（点它、按 1/2/3 都行）。没人点，坐 `stay`（默认 20）秒后安静离开：不扣连击、不扣钱、不写任何进度，下一夜条件仍满足就再来。
- 对话和互动期间全店暂停（时间不走、耐心不掉）。
- 首章 `order` 节点之后客人点专属菜：**做成功**才算章节完成、菜式正式解锁并写入存档 `dishes`；这一夜没做成，存档里记着 `ordered`，下次来直接带着订单入座，不用再聊。专属菜等不到也只是安静离开。
- 剧情奖励（`give.money`）记进当夜账本的"剧情奖励"，打烊时入账；闭店回档时这笔钱和当夜其他账一起退回，剧情进度保留。
- 带 `from: { story }` 的菜式，解锁前不进普通点单池，也不出现在传送带上（专属订单除外）。

## 加一位新客人

1. 复制 `js/data/stories/songshu.js`，改 `id / name / when / look / chapters`。
2. 有新食材、新菜式：写在同一个文件的 `ingredients`、`dishes` 里（菜式 id 必须和食材 id 一致）。新花纹用 `SG.registerSlicePattern`，帽子等用 `SG.registerAccessory`，头像用 `SG.registerPortrait`。
3. 新做法写在 `data/methods.js`；新步骤写 `js/steps/xxx.js`；新互动写 `js/interacts/xxx.js`。
4. `index.html` 里为新文件各加一行 `<script>`。
5. 在想让他登场的关卡里写 `npcs: ['新id']`。

## 脚本节点

| 节点 | 写法 | 说明 |
|---|---|---|
| say | `{ say: '台词', who: 'chef' }` | 一句一屏。`who` 不写 = 这位客人；`'chef'` = 澄姐 |
| choice | `{ choice: [{ text, then: [节点], affinity, flag }] }` | 选项，最多 3 个比较合适 |
| act | `{ act: 'reel', n: 14 }` | 互动，完成后继续往下走 |
| give | `{ give: { money, deco, name, dish } }` | money 剧情奖励；deco 装饰（记在存档 `upgrades` 里，id 前缀 `deco_`，画面等店铺升级一步再做）；dish 直接解锁菜式 |
| flag | `{ flag: '名字', value }` | 全局剧情标记，条件里用 `flag` 读 |
| affinity | `{ affinity: 1 }` | 好感度 |
| order | `{ order: 'anago' }` | 对话结束，客人点这道菜；没有 order 的章节在脚本走完时直接完成 |

新节点类型：`SG.registerNode('名字', (节点, runner) => ...)`，runner 的接口见 `story.js` 里的 `A`。

## 互动模块

```js
SG.registerAct('reel', (host, done) => ({
  update(dt) {}, draw() {}, down(x, y) {}, up() {}, key(code, isDown) {},
}));
// host = { node（剧情里的那个节点）, G, CFG, ui }；完成时 done({ ok: true })
```
互动期间画面由互动自己画（盖住营业画面），点击和键盘都转给它。

## 存档里的剧情进度

`save.data.story[id] = { chapter（已完成的章节数）, affinity, ordered（已点单未做成的菜式 id 或 null）, flags }`。
这个结构没有改动已有字段，不需要升存档版本。

## 调试

```js
SG.save.data.night = 2; SG.save.write()      // 刷新后：第 2 夜，松叔会来
SG.save.data.story = {}; SG.save.write()      // 重置剧情进度
SG.story.state                                // 引擎当前状态（plan / run / visited）
```