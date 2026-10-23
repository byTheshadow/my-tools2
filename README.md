# 深夜寿司屋 · 像素寿司屋

纯原生 HTML + Canvas，无需构建工具。**双击 `index.html` 就能玩**（手机和电脑都行）。

规则与数值说明见 [docs/RULES.md](docs/RULES.md)，特殊客人与剧情见 [docs/STORY.md](docs/STORY.md)。

## 目录结构

```
index.html            页面骨架 + 脚本加载顺序
css/
  style.css           界面样式（顶栏、飘字、开屏、选关、结算）
  story.css           剧情对话、选项、✦ 相关样式
  shop.css            小店页样式
js/
  config.js           全局常量：布局坐标（含 seatsBy：3/4/5 座的 x 坐标）、判定容差、计分数值、经营数值（econ）、整局流程（夜数/重做次数）
  registry.js         注册表：剧情 / 互动 / 对话节点 / 步骤 / 做法 / 条件，以及条件语言
  data/               纯数据，加内容主要改这里
    ingredients.js      食材外观（颜色、花纹、是否带海苔）
    dishes.js           菜式 = 食材 + 做法 + 成本 + 售价 + 解锁来源
    methods.js          做法 = 步骤 id 的有序列表
    levels.js           关卡（时长、房租水电、进货价、解锁、难度曲线、称号、允许登场的客人）
    upgrades.js         店铺升级与装饰：分类、档数、价格、效果
    customers.js        客人外观调色板
    lore.js             开屏背景文案
    howto.js            玩法说明卡的文字
    tutorial.js         教学夜脚本：澄姐说什么、每一步要做到什么
    stories/            剧情，每位特殊客人一个文件（含他带来的食材、菜式、头像、配饰）
      songshu.js          老渔夫·松叔（鳗鱼·炙烧）
      xiaolin.js          加班的上班族·小林（鲑鱼籽军舰卷）
  save.js             统一存档（带版本号）
  shop.js             店铺升级逻辑：level / maxLevel / fx / nextTier / buy / seatCount / seatXs / has
  economy.js          经营结算：记账、打烊算账、闭店线、回档 / Game Over
  pace.js             一夜之内的节奏分段（开门 / 正常 / 高峰 / 收尾）
  story.js            剧情引擎：登场安排、对话节点、互动调度、点单与完成判定
  tutorial.js         教学夜引擎：按脚本一步步放开操作
  util.js             随机工具
  canvas.js           画布缩放、屏幕坐标转换
  state.js            所有可变状态（SG.G）+ 最高分存取
  audio.js            WebAudio 合成音效、震动
  fx.js               飘字、粒子、飞出的寿司、抖动
  draw/
    primitives.js       像素椭圆、圆环、矩形
    sprites.js          饭团、鱼片、寿司、客人、气泡、灯笼
    title.js            开屏夜景 + 玩法说明卡的小动画
    dialog.js           澄姐的对话框与头像
    deco.js             店内装饰：SG.registerDeco(id, layer, fn)，layer 为 'wall' 或 'floor'
    scene.js            营业画面的绘制顺序
  steps/              玩法步骤模块，一个文件一种操作
    rice.js             捏饭团
    fish.js             放鱼片
    torch.js            炙烧（按住火候条）
    wrap.js             围海苔（军舰卷）
    serve.js            上菜 / 倒掉
  interacts/          剧情互动模块，一个文件一种互动
    reel.js             收网（松叔首章）
  game.js             流程：开局/结算、客人、传送带、难度曲线、按步骤表往下走
  ui.js               DOM 界面：顶栏、序章、首页、玩法说明、选关、结算、静音
  ui-shop.js          小店页（挂在 ui.js 的屏幕体系上）
  input.js            鼠标/触屏/键盘 → SG.game → 当前步骤
  main.js             初始化 + 主循环
docs/
  RULES.md            规则与数值
  STORY.md            特殊客人与剧情
tools/                Playwright 回归脚本（test-basic.js、test-tutorial.js）
```

## 约定

- **不用 ES Module**：为了双击 `index.html` 就能运行（`file://` 下浏览器不允许加载模块）。每个文件是一个 IIFE，通过全局命名空间 `window.SG` 共享。
- **加载顺序就是依赖顺序**，写在 `index.html` 里。新增 JS 文件要记得在那里加一行（`upgrades.js` 在 `save.js` 之前，`shop.js` 在 `save.js` 之后）。
- **状态只放 `SG.G`**，并且只修改它的字段，不要重新赋值整个对象。
- **会保存的东西只放 `SG.save.data`**，改完调用 `SG.save.write()`。改存档结构时把 `config.js` 的 `saveVersion` +1，并在 `save.js` 的 `migrations` 里写升级函数，旧档就不会坏。
- **数值不写死在逻辑里**：判定/计分放 `config.js`，难度曲线放 `data/levels.js`，升级价格放 `data/upgrades.js`。
- **座位数是可变的（3~5）**：所有"按座位找人"的代码一律读 `G.seats[i].x`，不要用 `CFG.seats`，也不要写死三等份。点击判定用只看位置的 `nearestSeat(x)`，状态（能不能上菜）留给 `serveTo` 判断。
- **界面扩展**：新页面另开文件，用 `SG.ui.addScreen(名字, 渲染函数)` + `SG.ui.addAct(名字, 处理函数)` 挂上去，不要往 `ui.js` 里塞。

## 玩法是怎么串起来的

每个寿司从做法（`data/methods.js`）的第一步开始，`game.js` 只负责"按步骤表往下走"。

```
nigiri:  rice → fish → serve
aburi:   rice → fish → torch → serve
gunkan:  rice → fish → wrap → serve
```

步骤模块的接口（见 `steps/*.js`）：

```js
SG.registerStep('torch', {
  hint: '按住喷枪，火候走到焦香区松手',   // 底部提示
  enter(c) {}, update(c, dt) {},          // 进入 / 每帧
  down(c, x, y) {}, up(c) {}, key(c, code, isDown) {},
  drawUnder(c) {},                        // 画在垃圾桶之前
  draw(c) {},                             // 画饭团那一层
  drawOver(c) {},                         // 画在寿司之上
  // canDiscard: true 则垃圾桶高亮
});
// 完成时 c.next()；整份做完（上菜/倒掉）c.restart()
// 放完鱼片后换做法：c.next({ method: 'aburi' })，新步骤表必须包含已完成的步骤
```

## 常见修改

**加一种食材（用已有花纹）**
`js/data/ingredients.js` 加外观，`js/data/dishes.js` 加菜式，再在某个关卡的 `startIngredients` 或 `unlocks` 里写上 id。
军舰类食材在外观里写 `gunkan: true`，画寿司时会围一圈海苔；新花纹用 `SG.registerSlicePattern`（例子见 `xiaolin.js` 里的 `roe`）。跟着剧情来的食材和菜式写在剧情文件里，不用动这两个 data 文件。

**加一种新玩法（以炙烧为例，军舰卷的围海苔是第二个例子）**
1. 写 `js/steps/torch.js`，用 `SG.registerStep('torch', {...})`
2. `data/methods.js` 加 `SG.registerMethod('aburi', { steps: ['rice','fish','torch','serve'] })`
3. 菜式里写 `method: 'aburi'`
4. `index.html` 加一行 `<script src="js/steps/torch.js">`
5. 想让玩法说明里也有，在 `data/howto.js` 加一页，并用 `SG.registerHowtoArt` 画个小动画（炙烧和军舰卷现在还没有说明页）

军舰卷的做法是 `rice → fish → wrap → serve`，在 `data/methods.js` 里叫 `gunkan`；菜式（鲑鱼籽军舰）跟着小林的剧情包一起登记。

**加一位特殊客人**
一位客人 = `js/data/stories/` 下的一个文件，登场条件、剧情、新食材、新菜式、头像、配饰都写在里面。步骤见 [docs/STORY.md](docs/STORY.md)。简要流程：复制 `songshu.js` 或 `xiaolin.js`（带新食材、新做法、新花纹的完整例子）改一改 → `index.html` 加一行 `<script>` → 在想让他登场的关卡里写 `npcs: ['新id']`。

**加一项升级**
`js/data/upgrades.js`：复制相近的一项，改 id、名字、描述、各档价格和效果；新类别加进 `SG.UPGRADE_CATS`。效果用"键"表示，商店页和存档不用动；如果是全新的效果键，需要在用到它的地方读一次 `SG.shop.fx('键')`（现有读取点：`dropEase`→`steps/fish.js`；`goldBonus` / `beltMaxCut` / `patienceBonus`→`game.js`；`tipRateAdd` / `tipChance` / `rentCut`→`economy.js`；`seatsAdd`→`shop.js`）。

**加一个装饰**
1. `js/data/upgrades.js` 加一项装饰（买得到的写价格；剧情赠送的写 `from`，商店里只展示）
2. `js/draw/deco.js` 里用 `SG.registerDeco(id, layer, fn)` 画出来，`layer` 选 `'wall'` 或 `'floor'`，参照现有的盆栽写法
3. 存档里装饰以 `deco_` 前缀记在 `save.data.upgrades` 里

**改教学夜**
台词、步数、每步的目标都在 `js/data/tutorial.js`。一步的写法：

```js
{
  id: 'fish',
  say: ['...', '...'],            // 进入时澄姐说的话，一句一屏
  task: '把鱼片放上饭团　{n}',     // 左上角小目标，{n} 换成 "已完成 / 需要"
  goal: { ev: 'fish', n: 1 },     // 要做到什么；没有 goal 就是说完自动过
  allow: { belt: true },          // 这一步放开：belt / customers / patience / timer
  spawn: 'match',                 // 立刻来一位客人，点的正好是砧板上这份
  fail: '歪了也无妨。',            // 失败时的安慰，一步只说一次
  after: ['就是这样。'],           // 完成后的回应
}
```

事件由玩法步骤用 `c.ev('名字')` 发出，现有 `rice` `fish` `serve` `discard` `fail`。新玩法想被教学夜认，在步骤里加一行 `c.ev(...)` 即可。

**加一个关卡**
在 `js/data/levels.js` 的数组末尾追加一个对象（复制上一关改数值即可），记得写 `rent`（房租）。选关页会自动出现，打烊没闭店才解锁下一夜。选关页一共 `CFG.run.totalNights` 格，没写的显示"敬请期待"。目前八夜已经写齐。八夜的难度数值集中在 `levels.js` 顶部的 `CURVE` 表里，改手感先改它。

**调经济**
- 房租 / 水电 / 进货价：`data/levels.js` → `rent`、`utilityRate`（水电占房租的比例）、`costMult`（食材成本系数）
- 售价倍率、打赏、倒掉和做坏的成本、"账本紧"的提醒线：`config.js` → `econ`
- 闭店线倍数、重做次数：`config.js` → `run`
- 每道菜的成本和售价：`data/dishes.js`
- 升级价格：`data/upgrades.js`

**加一条条件**
`SG.registerCond('名字', (参数, env) => boolean)`，之后剧情的 `when` 里就能用。现有：`night` `money` `stat` `flag` `chapterDone` `dishCount`。

**调手感**
- 圈缩得太快 / 金圈太窄：`data/levels.js` → `CURVE` 表（或单关的 `difficulty.pressDur` / `goldWidth`）
- 分数太高 / 太低：`config.js` → `score`
- 赚得太多 / 太少：先看上面"调经济"，不要动 `score`（那是计分，不是钱）
- 鱼片对位太严 / 太松：`config.js` → `drop`（磨刀石升级会在此基础上放宽）
- 炙烧的焦香区和满格时间：`steps/torch.js` 的默认值，或关卡里的 `difficulty.torch = { center, half, dur }`

**改外观**
- 客人：`js/data/customers.js` 调色板，`js/draw/sprites.js` 的 `customer()` 画法
- 营业场景：`js/draw/scene.js`；装饰：`js/draw/deco.js`；开屏夜景：`js/draw/title.js`
- 界面文字和面板：`js/ui.js`、`js/ui-shop.js`、`css/*.css`

## 调试小技巧

浏览器控制台里可以直接访问 `SG`：
```js
SG.G                      // 当前所有状态
SG.save.data              // 当前存档
SG.G.combo = 15           // 直接改连击，测高连击手感
SG.G.timeLeft = 5         // 快进到结算
SG.save.data.money = -900; SG.save.write()   // 直接改资金，测闭店线（刷新后生效）
SG.save.data.money = 5000; SG.save.write()   // 有钱逛小店
SG.save.data.night = 2; SG.save.write()      // 刷新后：第 2 夜，松叔会来
SG.save.data.story = {}; SG.save.write()     // 重置剧情进度
SG.save.data.dishes = []; SG.save.write()    // 重置菜式解锁
SG.save.data.upgrades = []; SG.save.write()  // 重置所有升级
SG.save.data.upgrades = ['seat','seat']; SG.save.write()   // 直接 5 座（刷新后生效）
SG.shop.fx('goldBonus')   // 查某项升级效果当前值
SG.story.state            // 剧情引擎当前状态
SG.game.start(SG.LEVELS[0])
localStorage.removeItem('deepNightSushi:save')   // 清档重来（刷新后生效）
```

## 回归测试

`tools/` 下的脚本用 Playwright 在真浏览器里跑。先在项目目录起静态服务，再运行脚本（`file://` 下无头浏览器的 localStorage 不稳定，要走 HTTP）：

```
python3 -m http.server 8765
node tools/test-basic.js
node tools/test-tutorial.js
```