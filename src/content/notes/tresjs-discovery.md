---
content: "今天尝试了用 TresJS 在 Vue 中写 Three.js。声明式的 API 比原生 Three.js 简洁太多了，一个球体就是 `<TresSphere />` 一个标签。"
date: 2025-12-20
tags: ["技术", "3D"]
mood: "发现"
---

TresJS 是一个基于 Vue 3 的 Three.js 封装库，它将 Three.js 的 imperative API 转换为声明式组件。

安装很简单：
```bash
npm install three @tresjs/core @tresjs/cientos
```

然后就可以在 Vue 组件中直接使用：
```vue
<TresCanvas>
  <TresPerspectiveCamera />
  <TresMesh>
    <TresSphereGeometry />
    <TresMeshBasicMaterial color="red" />
  </TresMesh>
</TresCanvas>
```

比原生写法代码量减少约 40%，而且完全类型安全。
