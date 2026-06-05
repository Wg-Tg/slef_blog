---
title: "静态网站与现代前端"
description: "探讨静态网站生成器的优势，以及为什么 Astro 是当下最好的选择之一。"
date: 2025-12-15
tags: ["技术", "前端"]
---

## 为什么选择静态网站？

静态网站正在经历一场复兴。从 Jekyll 到 Hugo，从 Gatsby 到 Astro，每一代工具都在简化构建和部署流程。

### 优势

1. **速度** — 预渲染的 HTML 无需服务端处理
2. **安全** — 无数据库、无注入攻击面
3. **成本** — 免费托管在 Cloudflare Pages 或 GitHub Pages
4. **开发者体验** — Markdown 写作，Git 版本控制

### Astro 的独特之处

Astro 的「岛屿架构」让我可以在静态页面中嵌入交互组件。太阳系导航页就是一个例子——整个 3D 场景是一个 Vue 组件，只在客户端运行。

```typescript
// 内容集合提供类型安全
const posts = await getCollection('blog');
```

这种架构让网站既快又富有交互性。
