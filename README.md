# 深夜寿司屋 · 像素寿司屋

纯原生 HTML + Canvas，无需构建工具。**双击 `index.html` 就能玩**（手机和电脑都行）。

规则与数值说明见 [docs/RULES.md](docs/RULES.md)。

## 目录结构

```
index.html            页面骨架 + 脚本加载顺序
css/style.css         界面样式（顶栏、飘字、开屏、选关、结算）
js/
  config.js           全局常量：布局坐标、判定容差、计分数值、整局流程（夜数/重做次数）
  registry.js         注册表：剧情 / 互动 / 对话节点 / 步骤 / 做法 / 条件，以及条件语言
  data/               纯数据，加内容主要改这里
    ingredients.js      食材外观（颜色、花纹、是否带海苔）
    dishes.js           菜式 = 食材 + 做法 + 成本 + 售价 + 解锁来源
    methods.js          做法 = 步骤 id 的有序列表
    levels.js           关卡（时长、解锁、难度曲线、称号）
    customers.js        客人外观调色板
    lore.js             开屏背景文案
    howto.js            玩法说明卡的文字
    stories/            剧情，每位特殊客人一个文件（步骤 4 起）
  save.js             统一存档（带版本号）
  util.js             随机工具
  canvas.js           画布缩放、屏幕坐标转换
  state.js            所有可变状态（SG.G）+ 最高分存取
  audio.js            WebAudio 合成音效、震动
  fx.js               飘字、粒子、飞出的寿司、抖动
  draw/
    primitives.js       像素椭圆、圆环、矩形
    sprites.js          饭团、鱼片、寿司、客人、气泡、灯笼
    title.js            开屏夜景 + 玩法说明卡的小动画
    scene.js            营业画面的绘制顺序
  steps/              玩法步骤模块，一个文件一种操作
    rice.js             捏饭团
    fish.js             放鱼片
    serve.js            上菜 / 倒掉
  game.js             流程：开局/结算、客人、传送带、难度曲线、按步骤表往下走
  ui.js               DOM 界面：顶栏、序章、首页、玩法说明、选关、结算、静音
  input.js            鼠标/触屏/键盘 → SG.game → 当前步骤
  main.js             初始化 + 主循环
```

## 约定

- **不用 ES Module**：为了双击 `index.html` 就能运行（`file://` 下浏览器不允许加载模块）。每个文件是一个 IIFE，通过全局命名空间 `window.SG` 共享。
- **加载顺序就是依赖顺序**，写在 `index.html` 里。新增 JS 文件要记得在那里加一行。
- **状态只放 `SG.G`**，并且只修改它的字段，不要重新赋值整个对象。
- **会保存的东西只放 `SG.save.data`**，改完调用 `SG.save.write()`。改存档结构时把 `config.js` 的 `saveVersion` +1，并在 `save.js` 的 `migrations` 里写升级函数，旧档就不会坏。
- **数值不写死在逻辑里**：判定/计分放 `config.js`，难度曲线放 `data/levels.js`。

## 玩法是怎么串起来的

每个寿司从做法（`data/methods.js`）的第一步开始，`game.js` 只负责"按步骤表往下走"。

```
nigiri:  rice → fish → serve
```

步骤模块的接口（见 `steps/*.js`）：

```js
SG.registerStep('torch', {
  hint: '按住喷枪，火候走到焦香区松手',   // 底部提示
  enter(c) {}, update(c, dt) {},          // 进入 / 每帧
  down(c, x, y) {}, up(c) {}, key(c, code, isDown) {},
  drawUnder(c) {}, draw(c) {},            // 画在垃圾桶之前 / 画饭团那一层
  // canDiscard: true 则垃圾桶高亮
});
// 完成时 c.next()；整份做完（上菜/倒掉）c.restart()
// 放完鱼片后换做法：c.next({ method: 'aburi' })，新步骤表必须包含已完成的步骤
```

## 常见修改

**加一种食材（用已有花纹）**
`js/data/ingredients.js` 加外观，`js/data/dishes.js` 加菜式，再在某个关卡的 `startIngredients` 或 `unlocks` 里写上 id。

**加一种新玩法（例如炙烧）**
1. 写 `js/steps/torch.js`，用 `SG.registerStep('torch', {...})`
2. `data/methods.js` 加 `SG.registerMethod('aburi', { steps: ['rice','fish','torch','serve'] })`
3. 菜式里写 `method: 'aburi'`
4. `index.html` 加一行 `<script src="js/steps/torch.js">`
5. 想让玩法说明里也有，在 `data/howto.js` 加一页，并用 `SG.registerHowtoArt` 画个小动画

**加一个关卡**
在 `js/data/levels.js` 的数组末尾追加一个对象（复制第一关改数值即可）。选关页会自动出现，且需要通关上一夜才解锁。选关页一共 `CFG.run.totalNights` 格，没写的显示"敬请期待"。

**加一条条件**
`SG.registerCond('名字', (参数, env) => boolean)`，之后剧情的 `when` 里就能用。现有：`night` `money` `stat` `flag` `chapterDone` `dishCount`。

**调手感**
- 圈缩得太快 / 金圈太窄：`data/levels.js` → `difficulty.pressDur` / `goldWidth`
- 分数太高 / 太低：`config.js` → `score`
- 鱼片对位太严 / 太松：`config.js` → `drop`

**改外观**
- 客人：`js/data/customers.js` 调色板，`js/draw/sprites.js` 的 `customer()` 画法
- 营业场景：`js/draw/scene.js`；开屏夜景：`js/draw/title.js`
- 界面文字和面板：`js/ui.js`、`css/style.css`

## 调试小技巧

浏览器控制台里可以直接访问 `SG`：
```js
SG.G                      // 当前所有状态
SG.save.data              // 当前存档
SG.G.combo = 15           // 直接改连击，测高连击手感
SG.G.timeLeft = 5         // 快进到结算
SG.game.start(SG.LEVELS[0])
localStorage.removeItem('deepNightSushi:save')   // 清档重来（刷新后生效）
```
