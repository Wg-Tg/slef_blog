# My Space — 个人博客

新粗野主义 × 纸媒体质感 × 太阳系导航。

## 技术栈

| 类型 | 技术 |
|------|------|
| 框架 | Astro 6（静态生成） |
| UI | Vue 3（交互岛屿） |
| 样式 | UnoCSS（原子化 CSS） |
| 3D | TresJS（Vue 3 的 Three.js 封装） |
| 动画 | GSAP（ScrollTrigger + FLIP） |
| 部署 | Cloudflare Pages（零成本） |

## 项目结构

```
/
├── public/              # 静态资源（favicon、头像占位等）
├── src/
│   ├── components/      # Vue 交互组件
│   │   ├── SolarSystem.vue    # 太阳系 3D 首页
│   │   ├── NotesFilter.vue    # 碎片流过滤器
│   │   ├── ScrollReveal.vue   # 滚动显示动画
│   │   └── CustomCursor.vue   # 自定义鼠标光标
│   ├── content/         # Markdown 内容
│   │   ├── blog/        # 博客文章
│   │   └── notes/       # 碎片笔记
│   ├── layouts/         # 布局组件
│   │   └── Base.astro   # 公共布局（导航 + 页脚）
│   ├── pages/           # 路由页面
│   │   ├── index.astro          # 太阳系首页
│   │   ├── blog/index.astro     # 博客列表
│   │   ├── blog/[...slug].astro # 博客详情
│   │   ├── notes/index.astro    # 碎片流
│   │   ├── about.astro          # 个人主页
│   │   ├── hobbies.astro        # 爱好展示
│   │   └── contact.astro        # 联系表单
│   └── styles/
│       └── global.css   # 全局样式 & 设计令牌
├── astro.config.mjs     # Astro 配置
├── uno.config.ts        # UnoCSS 配置
└── package.json
```

## 设计系统

- **风格**：新粗野主义（Neo-Brutalism）— 硬阴影、粗边框、少圆角
- **配色**：米白底 + 墨黑字 + 朱红强调 + 芥末黄辅助
- **字体**：Georgia（正文）/ DM Sans（标题）/ JetBrains Mono（代码）
- **边框**：全局 2px 实线 `#2B2B2B`
- **阴影**：默认 `6px 6px 0`，hover 缩小至 `2px 2px 0`

## 命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 本地预览构建结果 |

## 部署

本项目设计为零成本部署到 Cloudflare Pages：

1. 推送代码到 GitHub
2. 在 Cloudflare Dashboard → Workers & Pages → 连接仓库
3. 构建设置：框架预设 Astro，构建命令 `npm run build`，输出目录 `dist`

## 待办

以下内容使用占位符，需要自行替换：

- [ ] `/about` 页：姓名、简介、技能、项目、社交链接（搜索 `TODO: REPLACE_ME`）
- [ ] Giscus 评论：需在仓库启用 Discussions 并替换 `data-repo-id` 和 `data-category-id`
- [ ] 导航栏标题：搜索 `TODO: REPLACE_ME`
