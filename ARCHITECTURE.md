# 项目架构快速理解

## 一句话总结

> **Astro 负责"壳"（页面、路由、布局），Vue 3 负责"交互"（需要 JS 的地方）。**

---

## 一、Astro 骨架：页面 & 路由

### 1.1 路由即文件

`src/pages/` 下的每个 `.astro` 文件自动变成一个 URL：

```
src/pages/
├── index.astro            →  /
├── about.astro            →  /about
├── contact.astro          →  /contact
├── hobbies.astro          →  /hobbies
├── hobbies/[slug].astro   →  /hobbies/reading, /hobbies/coffee, ...
├── notes/index.astro      →  /notes
├── blog/index.astro       →  /blog
└── blog/[...slug].astro   →  /blog/hello-world, /blog/static-sites, ...
```

`[slug]` 和 `[...slug]` 是 Astro 的动态路由语法，类似于 Vue Router 的 `:slug`。

### 1.2 页面怎么写（`.astro` 文件格式）

每个 `.astro` 文件分两部分：

```astro
---
// 第一部分：frontmatter（TypeScript）
// 在这里写服务端逻辑：获取数据、定义变量
import Base from '../layouts/Base.astro';
const posts = await getCollection('blog');
---

<!-- 第二部分：模板（HTML + Astro 组件） -->
<!-- 在这里写 HTML，可以用 {} 嵌入 JS 表达式 -->
<Base title="Blog">
  <h1>Blog</h1>
  {posts.map(p => <article>{p.data.title}</article>)}
</Base>
```

**关键点：frontmatter 中的代码在服务端/构建时执行，模板输出的是纯 HTML。**

### 1.3 公共布局（Base.astro）

`src/layouts/Base.astro` 是所有页面的"壳"：

```
Base.astro 提供：
├── <html>, <head>, <meta>       — SEO 标签
├── <nav>                         — 导航栏（Blog / Notes / About / Hobbies）
├── <slot />                      — 页面内容插槽（每个页面自己的内容放这里）
├── <footer>                      — 页脚
├── <ClientRouter />              — 页面过渡动画
└── <CursorSparkles />            — 光标星星拖尾（Vue 组件）
```

每个页面这样用：

```astro
<Base title="关于我">
  <!-- 这里是页面内容，会插入到 <slot /> 的位置 -->
  <h1>关于我</h1>
</Base>
```

### 1.4 内容集合（Content Collections）

`src/content.config.ts` 定义了两种内容类型：

```ts
blog   → src/content/blog/*.md    // 博客文章
notes  → src/content/notes/*.md   // 碎片笔记
```

每篇 `.md` 文件头部有 frontmatter（标题、日期、标签），在页面中通过 `getCollection('blog')` 获取。

---

## 二、Vue 3 交互组件：具体实现了什么

Vue 组件**只在需要客户端 JS 的地方使用**，其他都是纯静态 HTML。

### 2.1 太阳系首页 — `SolarSystem.vue` + `SceneObjects.vue`

```
SolarSystem.vue（父组件）
├── TresJS 3D 画布（TresCanvas）
├── 相机 + 轨道控制器（OrbitControls）
├── 光照（AmbientLight + PointLight）
├── 太阳（金色球体 + TresMesh）
├── SceneObjects.vue（子组件，程序化构建场景）
│   ├── 太阳光晕（Canvas 生成 Sprite）
│   ├── 6 条轨道线（半透明白色圆环）
│   ├── 800 颗星点（3 层粒子：小星 + 大亮星 + 微星）
│   ├── 6 颗行星（Canvas 程序化纹理：水星陨石坑、木星条纹…）
│   ├── 土星环（渐变纹理 Torus）
│   └── Raycaster 交互（hover 放大 + 点击导航）
└── 浮动标签（tooltip）+ 底部提示文字
```

**为什么用 Vue 而不是 Astro？**
因为 Three.js 必须在浏览器中运行（WebGL），不能静态生成。Astro 用 `client:only="vue"` 让它只在客户端渲染。

### 2.2 碎片流过滤器 — `NotesFilter.vue`

```
NotesFilter.vue
├── 文本搜索框（实时过滤）
├── 标签切换按钮（OR 逻辑）
├── 过滤后的笔记列表
├── GSAP stagger 卡片淡入动画
└── 空状态提示
```

**为什么用 Vue？**
搜索和过滤需要客户端交互（用户输入 → 即时响应）。但笔记数据本身由 Astro 在服务端提供，Vue 只负责前端的过滤逻辑。

### 2.3 滚动显示动画 — `ScrollReveal.vue`

```
ScrollReveal.vue
├── 包裹任意内容
├── GSAP ScrollTrigger 检测元素进入视口
├── 从下方 40px 淡入（Power3.out）
└── 只触发一次，支持无障碍（prefers-reduced-motion）
```

**为什么用 Vue？**
GSAP ScrollTrigger 需要访问 DOM 和滚动事件，只能在浏览器运行。

### 2.4 光标星星拖尾 — `CursorSparkles.vue`

```
CursorSparkles.vue
├── 监听 mousemove 事件
├── 在光标位置创建微小圆点
├── 随机大小、颜色（天蓝/浅粉）、飘散方向
├── 动画结束后自动移除 DOM 元素
├── 节流（移动 30px 才生成一颗）
└── 首页自动禁用，移动端自动禁用
```

**为什么用 Vue？**
纯浏览器交互，不需要服务端参与。

---

## 三、数据流总结

```
┌─────────────────────────────────────────────────┐
│                    构建时（服务端）                │
│                                                   │
│  Markdown 文件 ──→ getCollection() ──→ 静态 HTML  │
│  (博客/碎片)                                     │
│                                                   │
│  getStaticPaths() ──→ 生成所有动态路由页面        │
│  (hobbies/[slug])                                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                    浏览器（客户端）               │
│                                                   │
│  静态 HTML ──→ 页面展示                          │
│       +                                          │
│  Vue 组件 hydration ──→ 交互激活                  │
│  (SolarSystem / NotesFilter / ScrollReveal ...)  │
└─────────────────────────────────────────────────┘
```

## 四、关键文件清单

| 文件 | 类型 | 作用 |
|------|------|------|
| `src/pages/*.astro` | Astro | 路由 & 页面结构 |
| `src/layouts/Base.astro` | Astro | 公共布局（导航/页脚/过渡） |
| `src/content.config.ts` | TS | 内容集合定义 |
| `src/content/blog/*.md` | MD | 博客文章 |
| `src/content/notes/*.md` | MD | 碎片笔记 |
| `src/components/*.vue` | Vue 3 | 交互组件 |
| `src/styles/global.css` | CSS | 全局样式 & 设计令牌 |
| `uno.config.ts` | TS | UnoCSS 原子化 CSS 配置 |
| `astro.config.mjs` | JS | Astro 框架配置 |
