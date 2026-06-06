# WG-TG — 个人博客

踢球是生活，coding 也是。

## 技术栈

| 类型 | 技术 |
|------|------|
| 框架 | Astro 6（静态生成） |
| UI | Vue 3（交互岛屿） |
| 样式 | 纯 CSS（设计令牌） |
| 3D | TresJS（Vue 3 的 Three.js 封装） |
| 动画 | GSAP（ScrollTrigger） |
| 表单 | Web3Forms |
| 部署 | Cloudflare Pages |

## 项目结构

```
/
├── public/              # 静态资源（头像、favicon 等）
├── src/
│   ├── components/      # Vue 交互组件
│   │   ├── SolarSystem.vue      # 太阳系 3D 首页
│   │   ├── ContactTabs.vue      # QQ / GitHub 标签切换
│   │   ├── CursorSparkles.vue   # 光标星星拖尾效果
│   │   ├── NotesFilter.vue      # 碎片流过滤器
│   │   └── ScrollReveal.vue     # 滚动显示动画
│   ├── content/         # Markdown 内容
│   │   ├── blog/        # 博客文章（7 篇 CSDN 迁移）
│   │   └── notes/       # 碎片笔记
│   ├── layouts/         # 布局组件
│   │   └── Base.astro   # 公共布局（导航 + 页脚）
│   ├── pages/           # 路由页面
│   │   ├── index.astro              # 太阳系首页
│   │   ├── blog/index.astro         # 博客列表
│   │   ├── blog/[...slug].astro     # 博客详情
│   │   ├── notes/index.astro        # 碎片流
│   │   ├── about.astro              # 个人主页
│   │   ├── hobbies.astro            # 爱好展示
│   │   ├── hobbies/[slug].astro     # 爱好详情
│   │   └── contact.astro            # 联系表单
│   ├── styles/
│   │   └── global.css   # 全局样式 & 设计令牌
│   └── content.config.ts # 内容集合配置
├── .env.example         # 环境变量模板
├── astro.config.mjs     # Astro 配置
└── package.json
```

## 设计系统

- **风格**：温柔优雅（Gentle Elegance）— 柔和阴影、圆角、留白
- **配色**：米白底 + 深灰字 + 天蓝 / 浅粉紫强调
- **字体**：Noto Sans SC（正文）/ Playfair Display（标题）/ JetBrains Mono（代码）
- **圆角**：8px ~ 24px
- **阴影**：柔和弥散阴影，hover 加深

## 本地开发

```bash
npm install        # 安装依赖
cp .env.example .env  # 创建环境变量文件，填入你的 Web3Forms Key
npm run dev        # 启动开发服务器 → http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 本地预览构建结果
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `WEB3FORMS_KEY` | [Web3Forms](https://web3forms.com) Access Key，用于联系表单 |

## 部署

部署到 Cloudflare Pages：

1. 推送代码到 GitHub
2. Cloudflare Dashboard → Workers & Pages → 连接仓库
3. 构建设置：
   - **框架预设**：Astro
   - **构建命令**：`npm run build`
   - **输出目录**：`dist`
4. 环境变量中配置 `WEB3FORMS_KEY`

## 更多文章

CSDN 主页：[blog.csdn.net/2401_83519807](https://blog.csdn.net/2401_83519807)
