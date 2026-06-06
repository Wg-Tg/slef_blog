---
title: "HTML+fastAPI+Dify｜打通前后端至智能体的路"
description: "从一个真实demo项目出发，讲清楚 AI 聊天应用里最关键的流式通信模式。"
date: 2026-06-01
tags: ["FastAPI", "Dify", "AI", "流式通信", "SSE"]
---
# HTML+fastAPI+Dify|打通前后端至智能体的路


> 从一个真实demo项目出发，讲清楚 AI 聊天应用里最关键的流式通信模式。

---

### 前言

当你你在聊天页面输入【各科平均分是多少？请用柱状图展示】，点击发送。几秒后 AI 像打字机一样逐字吐出答案，最后还附上一张 ECharts 图表。

这个过程看似简单，背后却是一段精心设计的旅程：

```undefined
浏览器  →  FastAPI  →  Dify AI Agent  →  FastAPI  →  浏览器
```

该篇将带你一步步拆解其中的关键节点，帮助你建立【流式通信】的完整流程。

---

### 一、三个角色

| 角色 | 技术栈 | 职责 |
|:---:|:---:|:---:|
| **前端** | HTML + JS + ECharts | 收集输入、打字机效果、渲染图表 |
| **后端** | Python FastAPI + httpx | 代理请求、安全转发流数据 |
| **Dify** | Dify NLP2SQL Agent | 理解自然语言、查库、生成回答 |


**为什么不直接从前端请求 Dify？** API Key 写在前端 JS 里，任何人打开开发者工具都能看到。正确做法是前端 → 后端 →Dify。就像去餐厅点菜，你告诉服务员，服务员有钥匙进厨房。

---

### 二、一次请求的完整旅程

#### 1. 前端发送请求

用户点击发送后，前端发起 POST 请求（因为是在【提交】问题，而非【获取】页面）：

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "各科平均分是多少？", conversation_id: "" }),
});
```

#### 2. 后端接收并返回流式响应

FastAPI用 Pydantic 定义请求结构，然后返回StreamingResponse：

```python
class ChatRequest(BaseModel):
    question: str
    conversation_id: str = ""
​
@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        ask_dify_stream(req.question, req.conversation_id),
        media_type="text/event-stream",
    )
```

核心决策：返回 StreamingResponse而非JSONResponse， `media_type` 设为 `text/event-stream` ——告诉浏览器 **数据会一段一段来** 。

#### 3. 后端请求 Dify

后端从 `.env` 读取 Dify 配置，组装请求：

```python
headers = {"Authorization": f"Bearer {DIFY_API_TOKEN}"}
payload = {
    "inputs": {},
    "query": question,
    "response_mode": "streaming",   # 关键：要求 Dify 流式返回
    "conversation_id": conversation_id,
    "user": "web-user",
}
```

然后用 `httpx` 流式请求：

```python
async with httpx.AsyncClient(timeout=None) as client:
    async with client.stream("POST", DIFY_CHAT_URL, headers=headers, json=payload) as resp:
        ...
```

`timeout=None` 避免 AI 生成较慢时过早断连。

#### 4. Dify 处理并流式返回

Dify 的 NLP2SQLAgent收到问题后：NLP 理解意图，SQL 转化为数据库查询。然后边生成边以 SSE 格式返回：

```python
data: {"event":"message","answer":"各科平均分如下："}
​
data: {"event":"message","answer":"语文 86，数学 91，英语 88。"}
​
data: {"event":"message_end","conversation_id":"abc-123"}
```

#### 5. 后端原样转发

后端逐行读取 Dify 返回，遇到 `data:` 开头就转发——不改内容，纯粹的传声筒：

```python
async for line in resp.aiter_lines():
    if line.startswith("data:"):
        yield line + "\n\n"
```

yield 而非 `return` ——一点一点「让渡」数据。

#### 6. 前端流式读取 —— 核心差异

**这是全文最重要的部分。** 前端拿到 `response` 后， **没有** 这样做：

```javascript
// 普通做法：等全部返回后一次性解析
const data = await response.json();
```

而是这样做了：

```javascript
// 流式做法：自己动手，一块一块读
const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";
​
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
​
  buffer += decoder.decode(value, { stream: true });
  const events = buffer.split("\n\n");
  buffer = events.pop();  // 最后一个可能不完整，留到下次拼接
​
  for (const item of events) {
    const line = item.split("\n").find(r => r.startsWith("data:"));
    if (!line) continue;
​
    const data = JSON.parse(line.slice(5));  // 去掉 "data:" 前缀
​
    if (data.event === "message" || data.event === "agent_message") {
      fullAnswer += data.answer || "";
      aiMessageText.textContent = fullAnswer;  // 实时更新页面！
    }
  }
}
```

**两种写法的本质区别：** 

|   | `response.json()` | `response.body.getReader()` |
|:---:|:---:|:---:|
| **获取方式** | 等服务器全部返回完 | 返回一点读一点 |
| **体验** | 等待后一次性出现 | 打字机效果 |
| **内存** | 全部加载 | 流式处理 |
| **场景** | 普通 API、配置 | AI 聊天、实时日志 |
| **底层** | 内部 read→JSON.parse | 直接操作 ReadableStream |


比喻： `response.json()` 是厨师做完一整桌菜再端出来， `getReader()` 是做好一道端一道。

#### 7. 流结束后渲染Markdown与图表

这里没有导入其他库来做markdown的渲染，而是采用了替换的方式

流式接收期间，前端用 `textContent` 纯文本显示，避免 Markdown 不完整导致渲染错乱。结束后做三件事：

1. **渲染 Markdown** ： `## 标题` 、 `**加粗**` 等转为 HTML。

2. **提取并渲染 ECharts** ：

```javascript
const regex = /```(?:json|echarts)?\s*([\s\S]*?)```/g;
const json = JSON.parse(match[1]);
if (json.xAxis || json.series) {
  // 用 ECharts 渲染
  const chart = echarts.init(chartDiv);
  chart.setOption(json);
}
```

---

### 三、为什么这样设计？

**1. 安全性** ：API Key 只存于服务端 `.env` ，浏览器代码中找不到任何密钥。

**2. 体验** ：非流式下用户要等十几秒才看到回复；流式模式下第一秒就有反馈。

**3. 解耦** ：前端只知道 `/api/chat` 和SSE协议。后端换 AI 服务商，前端无需改动。

---

### 四、动手实践：最小示例

**后端（FastAPI）：** 

```python
import asyncio, json, uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, FileResponse
from starlette.staticfiles import StaticFiles
 
app = FastAPI(
    title="流式输出测试",
    version="1.0.0"
)
 
async def generate():
    for word in ["你好", "，", "这是", "流式", "响应", "。"]:
        yield f"data: {json.dumps({'event': 'message', 'answer': word})}\n\n"
        await asyncio.sleep(0.3)
 
@app.get("/")
async def root():
    return FileResponse("index.html")
 
@app.post("/api/chat")
async def chat():
    return StreamingResponse(generate(), media_type="text/event-stream")
```

**前端（流式读取）：** 

```javascript
(async () => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "你好" }),
  });
 
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
 
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();
    for (const item of events) {
      const line = item.split("\n").find(r => r.startsWith("data:"));
      if (line) console.log(JSON.parse(line.slice(5)).answer);
    }
  }
})();
```

---

### 五、常见问题速查

| 现象 | 原因 | 解决 |
|:---:|:---:|:---:|
| 发送失败 | 后端未启动 | 访问 `/api/health` |
| `has_token: false` | `.env` 未配置 | 检查根目录 `.env` |
| Dify 401 | Key 错误 | 重新复制密钥 |
| 有文字无图表 | JSON 缺少 `xAxis` / `series` | 检查代码块结构 |
| 显示了图表代码 | JSON 格式非法 | 确保纯 JSON |


---

### 六、总结

这个项目的核心架构可以用四句话概括：

```javascript
前端负责交互      —— 收集输入、打字机效果、渲染图表
后端负责安全转发  —— 持有密钥、代理请求、原样转发 SSE
Dify 负责 AI      —— NLP2SQL 理解意图、生成回答
前端负责最终展示  —— Markdown 转换、JSON 提取、ECharts 渲染
```

而贯穿全链路的那条金线，就是 **流式通信** ——从 Dify 的 `response_mode: "streaming"` ，到后端的 `httpx.stream()` + `yield` ，再到前端的 `response.body.getReader()` ，三个环节环环相扣，共同构成了打字机般的流畅体验。

当从 `const data = await response.json()` 走向 `const reader = response.body.getReader()` 的那一刻，完成的不仅是一次 API 调用的升级，更是从「请求-响应」思维到「流式通信」思维的跃迁。理解了这一点，你就掌握了现代 AI 聊天应用最核心的通信模式。
