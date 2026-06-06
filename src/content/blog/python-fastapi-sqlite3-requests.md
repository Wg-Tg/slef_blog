---
title: "Python 入门：FastAPI + SQLite3 + Requests 基础教学"
description: "从语法、库使用、数据库连接到接口开发、请求调用一步步讲解，适合新手学习与日后复习。"
date: 2026-02-21
tags: ["Python", "FastAPI", "SQLite3", "Requests"]
---

# Python 入门：FastAPI + SQLite3 + Requests 基础教学

> 原文链接：https://blog.csdn.net/2401_83519807/article/details/158099896

### 前言

本文从语法、库使用、数据库连接到接口开发、请求调用一步步讲解，适合新手学习与日后复习。全程使用Python内置库 + 轻量框架，无需复杂环境。

### 一、基础知识点说明

#### 1.1 各组件作用

- - FastAPI：Python 高性能 Web 框架，用于快速编写 API 接口。

- - SQLite3：Python 内置轻量级数据库，无需安装、无需启动服务，直接以文件形式存储数据。

- - Requests：用于发送 HTTP 请求，测试或调用自己写的 API。

- - Uvicorn：ASGI 服务器，用于运行 FastAPI 项目。

#### 1.2 环境安装

> pip install fastapi uvicorn requests

SQLite3为 Python 自带，无需安装。

---

### 二、SQLite3 基础语法

#### 2.1 导入库

```python
import sqlite3
```

#### 2.2 连接/创建数据库

```python
conn = sqlite3.connect("test.db")
```

文件不存在会自动创建

#### 2.3 创建游标

```python
cursor = conn.cursor()
```

游标用于执行SQL语句

#### 2.4 执行SQL语句

```python
# 创建表
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER
)
''')
 
# 插入数据
cursor.execute("INSERT INTO users (name, age) VALUES (?, ?)", ("张三", 18))
 
# 查询数据
cursor.execute("SELECT * FROM users")
data = cursor.fetchall()
```

#### 2.5 提交与关闭

```python
conn.commit()   # 提交增删改操作
conn.close()    # 关闭连接
```

导入库 → 连接（创建）数据库 → 创建游标对象（操作数据库） → 执行SQL语句 → 提交操作并关闭连接

### 三、FastAPI基础语法

#### 3.1 导入与创建应用

```python
from fastapi import FastAPI
 
app = FastAPI()
```

#### 3.2 定义get接口

```python
@app.get("/hello")
def hello():
    return {"message": "Hello FastAPI"}
```

#### 3.3 定义带参数get接口

```python
@app.get("/user")
def get_user(name: str):
    return {"你的名字": name}
```

#### 3.4 定义post接口

```python
@app.post("/add")
def add(name: str, age: int):
    return {"接收数据": {"name": name, "age": age}}
```

#### 3.5 运行服务

```python
import uvicorn
 
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
```

可以通过 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) 来访问查看接口和调试

### 四、完整整合fastapi＋sqlite3

新建文件main.py ，以下为可直接运行的完整代码。

```python
import sqlite3
from fastapi import FastAPI
import uvicorn
 
# 创建 FastAPI 实例
app = FastAPI()
 
# 初始化数据库
def init_db():
    conn = sqlite3.connect("data.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
 
# 程序启动时初始化
init_db()
 
# 接口1：添加用户（POST）
@app.post("/api/add_user")
def add_user(name: str, age: int):
    try:
        conn = sqlite3.connect("data.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, age) VALUES (?,?)", (name, age))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        return False
 
 
# 接口2：获取所有用户（GET）
@app.get("/api/get_users")
def get_users():
    conn = sqlite3.connect("data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()
 
    result = []
 
    for u in users:
        result.append({
            "id": u[0],
            "name": u[1],
            "age": u[2]
        })
 
    return True
 
# 运行服务
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
```

### 五、使用 Requests 请求接口（测试）

新建  test_request.py ，用于调用上面的 API。

```python
import requests
 
url = "http://127.0.0.1:8000/api"
 
# 1. 添加用户
def add_user():
    res = requests.post(f"{url}/add_user", params={
        "name": "Python学习者",
        "age": 20
    })
    print("添加结果：", res.json())
 
# 2. 获取用户列表
def get_users():
    res = requests.get(f"{url}/get_users")
    print("所有用户：", res.json())
 
if __name__ == "__main__":
    add_user()
    get_users()
```

### 六、运行步骤

1. 运行  main.py  启动 API 服务

2. 运行  test_request.py  发送请求

3. 查看控制台输出

4. 数据库文件  data.db  自动生成

### 七、核心逻辑总结

1. SQLite 流程：连接 → 创建游标 → 执行 SQL → 提交 → 关闭

2. FastAPI 流程：创建 app → 装饰器定义接口 → 编写函数 → 运行服务

3. 传参方式：GET/POST 均可用  params  传参

4. Requests 流程：指定 URL → 传参 → 获取响应 → 解析 JSON

