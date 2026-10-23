# 特殊客人与剧情

一位特殊客人 = 一个完整的内容包：登场条件、剧情、新食材、新菜式、头像、配饰，全写在 `js/data/stories/<id>.js` 一个文件里。
新玩法（步骤）和新互动各是一个独立模块，可以被不同客人复用。引擎（`js/story.js`）、座位、✦、存档、结算都不用动。

## 已有的客人

| 客人 | 文件 | 登场 | 现状 |
|---|---|---|---|
| 老渔夫·松叔 | `stories/songshu.js` | 第 2 夜起 | 首章：连点收网（`reel`），解锁鳗鱼·炙烧；第二章：讲老伴，给 120 资金和鱼篓装饰 |
| 加班的上班族·小林健太 | `stories/xiaolin.js` | 第 4 夜起，单夜上菜 ≥ 10 份 | 首章：三个选项只影响好感度和台词，解锁鲑鱼籽军舰卷（围海苔，`wrap`）；二章（辞职 / 回来 / 带同事来）和好感度加成还没做，好感度目前只写进存档 |

关卡排期（`data/levels.js`）：松叔第 2–4 夜，小林第 4–8 夜。第 4 夜两人都列了，同一夜只来一位：松叔还有章节没走完时他先来，否则小林来。

## 规则（已实现）

- 一夜最多 1 位特殊客人。只在"当前这一夜"（真记账的夜）出现；教学夜和回头重玩的练习夜不来。
- 关卡 `npcs: ['songshu']` 决定这一夜允许谁来（`data/levels.js`）；还要满足剧情自己的 `when` 和当前章节的 `when`。列表里靠前的、条件满足的先来。
- 登场时间在本夜 25%–60% 之间随机，座位全满就等空位；最后 25 秒不再安排。
- 入座后头顶 ✦（点它，或按对应座位的数字键 1–5 都行）。没人点，坐 `stay`（默认 20）秒后安静离开：不扣连击、不扣钱、不写任何进度，下一夜条件仍满足就再来。
- 对话和互动期间全店暂停（时间不走、耐心不掉）。
- 首章 `order` 节点之后客人点专属菜：**做成功**才算章节完成、菜式正式解锁并写入存档 `dishes`；这一夜没做成，存档里记着 `ordered`，下次来直接带着订单入座，不用再聊。专属菜等不到也只是安静离开。
- 剧情奖励（`give.money`）记进当夜账本的"剧情奖励"，打烊时入账；闭店回档时这笔钱和当夜其他账一起退回，剧情进度保留。
- 带 `from: { story }` 的菜式，解锁前不进普通点单池，也不出现在传送带上（专属订单除外）。
- 座位数由店铺扩建决定（3~5 座），特殊客人和 ✦ 的位置一律读 `G.seats[i].x`。

## 剧情文件的字段速查

```js
SG.registerStory({
  id: 'xiaolin',
  name: '小林健太',
  when: { night: [4, 99], stat: { served: 10 } },   // 登场条件，条件语言见 registry.js；每章还可以有自己的 when
  stay: 20,           // 头顶 ✦ 没人点，坐这么多秒就安静离开
  patience: 45,       // 点了专属菜之后愿意等多久（秒）
  look: { skin, hair, shirt, acc: 'tie' },           // 外观调色板 + 配饰 id
  ingredients: { ikura: { name, base, stripe, dark, pattern: 'roe', gunkan: true } },
  dishes: { ikura: { method: 'gunkan', cost: 36, price: 95 } },   // 菜式 id 必须和食材 id 一致
  chapters: [ { id: 'c1', script: [ ...节点 ] } ],
});
// 同一个文件里还可以登记：
SG.registerSlicePattern('roe', (x0, y0, w, h, f) => {});   // 鱼片花纹，f = 食材外观，画图用 SG.px.R
SG.registerAccessory('tie', (x, y, s) => {});              // 场景里客人身上的配饰，y 是身体底线，s = look
SG.registerPortrait('xiaolin', (x, y) => {});              // 对话框头像，34×38 的框，背景由对话框画好
```

食材外观里 `gunkan: true` 表示画寿司时围一圈海苔。花纹可以被别的食材复用（`pattern: 'roe'`）。

## 加一位新客人

1. 复制 `js/data/stories/songshu.js`（带互动的例子）或 `xiaolin.js`（带新做法、新花纹、头像、配饰的例子），改 `id / name / when / look / chapters`。
2. 有新食材、新菜式：写在同一个文件的 `ingredients`、`dishes` 里（菜式 id 必须和食材 id 一致）。新花纹用 `SG.registerSlicePattern`，帽子等用 `SG.registerAccessory`，头像用 `SG.registerPortrait`。
3. 新做法写在 `data/methods.js`；新步骤写 `js/steps/xxx.js`；新互动写 `js/interacts/xxx.js`。
4. `index.html` 里为新文件各加一行 `<script>`。
5. 在想让他登场的关卡里写 `npcs: ['新id']`。
6. 想送装饰：在 `give.deco` 里写装饰名，并在 `js/data/upgrades.js` 里加一项带 `from` 的装饰（商店里只展示，不卖），再到 `js/draw/deco.js` 里画出来。

## 脚本节点

| 节点 | 写法 | 说明 |
|---|---|---|
| say | `{ say: '台词', who: 'chef' }` | 一句一屏。`who` 不写 = 这位客人；`'chef'` = 澄姐 |
| choice | `{ choice: [{ text, then: [节点], affinity, flag }] }` | 选项，最多 3 个比较合适 |
| act | `{ act: 'reel', n: 14 }` | 互动，完成后继续往下走 |
| give | `{ give: { money, deco, name, dish } }` | money 剧情奖励；deco 装饰（记在存档 `upgrades` 里，id 前缀 `deco_`，店里会摆出来）；dish 直接解锁菜式 |
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
SG.save.data.dishes = []; SG.save.write()     // 重置菜式解锁
SG.story.state                                // 引擎当前状态（plan / run / visited）
```

## 后续客人（草稿，可以继续改）

这几位还没做，每位做成一个包，登场条件和玩法都是草案：

| 客人 | 登场 | 首章与新菜式 | 新玩法 | 后续 |
|---|---|---|---|---|
| 狸猫·阿团 | 完美寿司 ≥ 3 | 化成人形来蹭饭，尾巴藏不好（客人头上露一小截尾巴像素）；互动"找尾巴"（点 3 次，位置不同），解锁稻荷寿司 | 稻荷：拖动填饭控量 | 带来"树叶钱"，月圆夜给大额打赏 |
| 失眠的老奶奶·梅婆婆 | 连击 ≥ 8 | 聊孙女；互动"按住"模拟卷一卷保持稳定，解锁手卷 | 手卷：点击顺序 | 寄来孙女的信，送风铃 |
| 神秘旅人·无名 | 第 5 夜起，且已解锁 ≥ 3 道菜 | 蒙着斗篷，"我在找一种值得冒险的味道"；三个选项，解锁河豚·刺身 | 河豚：沿虚线划一刀，高风险高回报 | 揭晓是退休名厨 |
| 同行老师傅·岩崎 | 第 7 夜起 | 隔壁老店要关了，来"偷师"，嘴上不饶人；互动"跟节拍点 4 下"，解锁押寿司 | 押寿司：节拍点击 | 老店关门前送木模具（装饰 + 永久小加成） |