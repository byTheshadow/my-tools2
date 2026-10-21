# 捏寿司 · 像素寿司屋

纯原生 HTML + Canvas，无需构建工具。**双击 `index.html` 就能玩**（手机和电脑都行）。

规则与数值说明见 [docs/RULES.md](docs/RULES.md)。

## 目录结构

```
index.html            页面骨架 + 脚本加载顺序
css/style.css         界面样式（顶栏、飘字、标题/结算面板）
js/
  config.js           全局常量：布局坐标、判定容差、计分数值
  data/               纯数据，加内容主要改这里
    ingredients.js      食材（颜色、花纹、是否带海苔）
    levels.js           关卡（时长、解锁、难度曲线、称号）
    customers.js        客人外观调色板
  util.js             随机工具
  canvas.js           画布缩放、屏幕坐标转换
  state.js            所有可变状态（SG.G）+ 最高分存取
  audio.js            WebAudio 合成音效、震动
  fx.js               飘字、粒子、飞出的寿司、抖动
  draw/
    primitives.js       像素椭圆、圆环、矩形
    sprites.js          饭团、鱼片、寿司、客人、气泡、灯笼
    scene.js            整个画面的绘制顺序
  game.js             规则与流程：判定、计分、客人、难度曲线
  ui.js               DOM 界面：顶栏、标题页、结算页、静音
  input.js            鼠标/触屏/键盘 → SG.game
  main.js             初始化 + 主循环
```

## 约定

- **不用 ES Module**：为了双击 `index.html` 就能运行（`file://` 下浏览器不允许加载模块）。每个文件是一个 IIFE，通过全局命名空间 `window.SG` 共享。
- **加载顺序就是依赖顺序**，写在 `index.html` 底部。新增 JS 文件要记得在那里加一行。
- **状态只放 `SG.G`**，并且只修改它的字段，不要重新赋值整个对象。
- **数值不写死在逻辑里**：判定/计分放 `config.js`，难度曲线放 `data/levels.js`。

## 常见修改

**加一种食材（用已有花纹）**
在 `js/data/ingredients.js` 加一项，例如：
```js
eel: { name: '鳗鱼', base: '#6b4a3a', stripe: '#a67b5b', dark: '#3f2a20', pattern: 'marble' },
```
然后在某个关卡的 `startIngredients` 或 `unlocks` 里写上 `'eel'`。

**加一种新花纹**
在 `js/draw/sprites.js` 的 `SLICE_PATTERNS` 里加一个函数 `(x0, y0, w, h, f) => {...}`，再让食材的 `pattern` 指向它。

**加一个关卡**
在 `js/data/levels.js` 的数组末尾追加一个对象（复制第一关改数值即可）。有多个关卡时，标题页会自动变成选关按钮，结算页多一个"选关"按钮，最高分按关卡分别记录。

**调手感**
- 圈缩得太快 / 金圈太窄：`data/levels.js` → `difficulty.pressDur` / `goldWidth`
- 分数太高 / 太低：`config.js` → `score`
- 鱼片对位太严 / 太松：`config.js` → `drop`

**改外观**
- 客人：`js/data/customers.js` 调色板，`js/draw/sprites.js` 的 `customer()` 画法
- 场景：`js/draw/scene.js`
- 界面文字和面板：`js/ui.js`、`css/style.css`

## 调试小技巧

浏览器控制台里可以直接访问 `SG`：
```js
SG.G                      // 当前所有状态
SG.G.combo = 15           // 直接改连击，测高连击手感
SG.G.timeLeft = 5         // 快进到结算
SG.game.start(SG.LEVELS[0])
```
