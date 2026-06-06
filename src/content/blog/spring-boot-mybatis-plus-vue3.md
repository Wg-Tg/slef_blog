---
title: "Spring Boot+MyBatis-Plus+Vue3前后端协作Note"
description: "想把SpringBoot+Vue3前后端分离开发里最基础、最常见的一条链路搞清楚：MyBatis-Plus怎么用、Spring Boot怎么连数据库、前后端怎么打通。"
date: 2026-05-08
tags: ["SpringBoot", "MyBatis-Plus", "Vue3", "前后端分离"]
---
# Spring Boot+MyBatis-Plus+Vue3前后端协作Note


这篇文章基于今天心血来潮写的一个简单的Springboot+vue3的项目，也借助了ai梳理了一下。写这篇博客的主要目的，不是追求多高级的用法，而是想把Springboot+vue3前后端分离开发里最基础、最常见的一条链路搞清楚。

具体来说，我想说明白三件事：

1. MyBatis-Plus 在后端到底怎么用

2. Spring Boot 是怎么连接数据库的

3. 前端页面发起请求后，后端是怎么接住并把数据返回回去的

所以这篇文章会尽量按照“从能跑，到能看懂流程”的思路来写

---

### 1. 先说清楚：这个项目后端在做什么

这个项目的后端是一个典型的JavaWeb 分层项目，技术组合是：

- Spring Boot

- MyBatis-Plus

- MySQL

<span style="color: #3391E5">前端</span>是：

- Vue 3

- Vue Router

- Axios

- Element Plus

项目后端的职责很明确：

1. 连接 MySQL 数据库

2. 提供登录接口

3. 提供宠物的增删改查接口

4. 返回统一JSON数据给前端

也就是说，前端负责页面和交互，后端负责数据和业务逻辑。

---

### 2. 什么是MyBatis-Plus

MyBatis-Plus 可以理解成是 MyBatis 的增强工具。

它的核心价值不是替代 MyBatis，而是帮我们减少大量重复的 CRUD 代码。比如：

- 查询全部

- 根据 id 查询

- 新增

- 修改

- 删除

这些操作在传统 MyBatis 里，往往需要自己写Mapper接口、SQL 映射甚至 XML；而 MyBatis-Plus 已经帮你封装好了很多通用能力。

一句话理解：

> MyBatis 负责“可以手把手操作数据库”，MyBatis-Plus 负责“更省事地操作数据库”。

---

### 3. 项目里是怎么接入 MyBatis-Plus 的

关键依赖有这些：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>

<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
    <version>3.5.13</version>
</dependency>

<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

这里可以这样理解：

- `spring-boot-starter-web` ：让项目具备 Web 服务能力，能接收前端 HTTP 请求

- `spring-boot-starter-jdbc` ：提供 JDBC 基础能力

- `mybatis-plus-spring-boot3-starter` ：引入 MyBatis-Plus

- `mysql-connector-j` ：让 Java 能连接 MySQL

如果你在新项目里要接入 MyBatis-Plus，通常至少也需要这几类依赖。

---

### 4. 数据库连接是怎么配置的

数据库连接配置在：

- `pet_manage/src/main/resources/application.yml`

当前项目里的配置大致是：

```yml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/pet_manager
    username: 用户名
    password: 密码

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

这段配置要掌握 4 个重点：

#### 4.1 driver-class-name

指定MySQL驱动类。

```yml
driver-class-name: com.mysql.cj.jdbc.Driver
```

这是 Java 程序连接 MySQL 时使用的驱动入口。

#### 4.2 url

```yml
url: jdbc:mysql://localhost:3306/pet_manager
```

这表示：

- 连接本机数据库 `localhost`

- 端口是 `3306`

- 数据库名是 `pet_manager`

#### 4.3 log-impl

```yml
log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

这个配置会让 MyBatis 在控制台打印 SQL，特别适合学习和调试。

你在开发时可以看到：

- 发了什么 SQL

- SQL 参数是什么

- 返回了多少数据

---

### 5.Spring Boot是怎么发现 Mapper 的

在这个项目里，Spring Boot 要先知道哪些接口是 Mapper，后面才能把它们交给 MyBatis-Plus 使用。

Mapper 常见有两种注册方式。

#### 第一种：在接口上写@Mapper

例如：

```java
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

这种方式比较直观，看到接口就知道它是 Mapper。

#### 第二种：在启动类上写@MapperScan

```java
@MapperScan("com.liu.pet_manage.mapper")
```

这种方式是批量扫描，适合项目里 Mapper 多的时候统一管理。

简单理解就是：

- `@Mapper` 是单个标记

- `@MapperScan` 是批量扫描

如果没有这些配置， `UserMapper` 和 `PetMapper` 就不能被 Spring 正常识别和注入使用。

---

### 6. 实体类怎么和数据表对应

MyBatis-Plus 的第一步，是把“数据库表”映射成“Java 对象”。

#### 6.1 用户实体

核心代码：

```java
@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
}
```

#### 6.2 宠物实体

核心代码：

```java
@Data
@TableName("pet")
public class Pet {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String type;
    private int age;
}
```

这里要掌握三个注解：

####  `@Data` 

来自 Lombok，自动生成：

- getter

- setter

- toString

- equals

- hashCode

作用是减少样板代码。

####  `@TableName("xxx")` 

指定这个实体类映射哪张表。

比如：

- `User` 对应 `user`

- `Pet` 对应 `pet`

####  `@TableId(type = IdType.AUTO)` 

表示主键是自增类型。

这意味着插入数据时，不需要手动给 `id` 赋值，数据库会自动生成。

---

### 7. Mapper 是怎么写的

Mapper 层负责直接和数据库打交道。

#### 7.1 UserMapper

```java
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

#### 7.2 PetMapper

```java
@Mapper
public interface PetMapper extends BaseMapper<Pet> {
}
```

这里最核心的是：

```java
extends BaseMapper<User>
extends BaseMapper<Pet>
```

只要继承了 `BaseMapper<T>` ，你就自动拥有一批通用数据库方法，例如：

- `insert(T entity)`

- `deleteById(Serializable id)`

- `updateById(T entity)`

- `selectById(Serializable id)`

- `selectList(Wrapper<T> queryWrapper)`

这就是 MyBatis-Plus “少写代码”的第一层体现。

---

### 8. Service 层怎么用 MyBatis-Plus

项目里有两个 Service，写法略有不同，正好可以拿来对比学习。

#### 8.1 UserService：手动调用 Mapper

关键代码：

```java
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public User findByUsername(String username){
        return userMapper.selectOne(
            new QueryWrapper<User>().eq("username", username)
        );
    }

    public void save(User user){
        userMapper.insert(user);
    }
}
```

这里要掌握两个点。

##### 第一，Service 为什么存在

Controller 不应该直接操作数据库。
Service 层负责承接业务逻辑，起到“中间层”作用。

##### 第二，QueryWrapper是什么

```java
new QueryWrapper<User>().eq("username", username)
```

表示拼接查询条件：

```sql
where username = ?
```

也就是说，这段代码的作用是：

“按用户名查一个用户”。

这是 MyBatis-Plus 很常见的条件构造器写法。

---

#### 8.2 PetService：直接继承ServiceImpl

代码非常简洁：

```java
@Service
public class PetService extends ServiceImpl<PetMapper, Pet> {}
```

这段代码之所以成立，是因为 `ServiceImpl` 已经帮你实现了很多通用方法。

继承后，你就能直接使用：

- `list()`

- `save(entity)`

- `updateById(entity)`

- `removeById(id)`

- `getById(id)`

这就是 MyBatis-Plus “少写代码”的第二层体现。

对比一下：

- `UserService` 是“自己调 mapper”

- `PetService` 是“直接继承官方实现”

两种都能学，但从快速 CRUD 的角度看， `ServiceImpl` 更高效。

---

### 9. Controller 如何对外提供接口

Controller 层负责把后端能力暴露成 HTTP 接口，供前端调用。

#### 9.1 登录接口

主要接口：

```java
@PostMapping("/login")
public ApiResponse<String> login(@RequestBody LoginRequest request){
    User user = userService.findByUsername(request.getUsername());
    if(user == null || !user.getPassword().equals(request.getPassword())){
        return ApiResponse.error("用户名或密码错误");
    }
    String token = UUID.randomUUID().toString();
    return ApiResponse.success(token);
}
```

这段代码的流程是：

1. 前端发 `POST /auth/login`

2. 后端接收 JSON 参数

3. 调用 `userService.findByUsername()`

4. 校验密码

5. 成功则返回一个模拟 token

这里要掌握：

####  `@RestController` 

表示这是一个 REST 风格控制器，返回的数据会自动转成 JSON。

####  `@RequestMapping("/auth")` 

给整个控制器加统一路径前缀。

所以这里完整路径是：

- `/auth/login`

- `/auth/register`

####  `@RequestBody` 

表示把前端传来的 JSON 数据映射成 Java 对象。

比如前端发：

```json
{
  "username": "admin",
  "password": "123456"
}
```

就会映射成 `LoginRequest` 对象。这里先知道它是接收登录参数的对象就行，后面还会再讲到它。

---

#### 9.2 宠物 CRUD 接口

核心代码：

```java
@GetMapping
public ApiResponse<List<Pet>> getAllPets() {
    return ApiResponse.success(petService.list());
}

@PostMapping
public ApiResponse<Pet> addPet(@RequestBody Pet pet) {
    petService.save(pet);
    return ApiResponse.success(pet);
}

@PutMapping
public ApiResponse<Pet> updatePet(@RequestBody Pet pet) {
    petService.updateById(pet);
    return ApiResponse.success(pet);
}

@DeleteMapping("/{id}")
public ApiResponse<Void> deletePet(@PathVariable Long id) {
    petService.removeById(id);
    return ApiResponse.success(null);
}
```

这些接口分别对应：

- 查全部

- 新增

- 修改

- 删除

这就是标准的 RESTful CRUD 风格。

---

### 10. 为什么要统一返回

项目里定义了一个统一响应类 `ApiResponse` ：

代码结构大致是：

```java
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
}
```

并且提供了：

```java
ApiResponse.success(data)
ApiResponse.error(message)
```

统一返回的好处是：

1. 前端更容易处理

2. 成功失败格式一致

3. 后续方便扩展

比如前端只要看：

- `code == 0` ：成功

- `code != 0` ：失败

这比每个接口返回不同格式更规范。

---

### 11. 前端是怎么调用后端的

要讲“前后端打通”，就不能只看后端，还要看请求是怎么发过来的。

前端请求封装在：

- `pet_front/src/api/index.ts`

核心代码：

```ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080'
})
```

这表示：

前端所有请求默认都发往：

```txt
http://localhost:8080
```

而 `8080` 正是 Spring Boot 默认端口，所以请求自然就打到后端了。

---

### 12. 登录是如何打通前后端的

前端登录页在：

- `pet_front/src/views/Login.vue`

核心请求：

```ts
const res = await api.post('/auth/login', {
  username: username.value,
  password: password.value
})
```

这时发生的事情是：

1. 用户在浏览器输入账号密码

2. Vue 通过 Axios 发请求到 `http://localhost:8080/auth/login`

3. Spring Boot 的 `AuthController` 接收请求

4. `UserService` 调 `UserMapper` 查数据库

5. 后端返回统一 JSON

6. 前端根据 `res.data.code` 判断是否成功

7. 成功后把 token 存入 `localStorage`

这个过程就是典型的前后端打通。

可以把它画成一条链：

`浏览器页面 -> Axios -> Controller -> Service -> Mapper -> MySQL -> 返回 JSON -> 页面更新` 

---

### 13. 宠物列表和新增是如何打通前后端的

#### 13.1 查询宠物列表

前端页面：

- `pet_front/src/views/PetList.vue`

请求代码：

```ts
const res = await api.get('/pets')
pets.value = res.data.data
```

对应后端：

```java
@GetMapping
public ApiResponse<List<Pet>> getAllPets() {
    return ApiResponse.success(petService.list());
}
```

流程是：

1. 页面加载

2. 前端发 `GET /pets`

3. 后端调用 `petService.list()`

4. MyBatis-Plus 自动查询 `pet` 表全部数据

5. 数据返回前端

6. `el-table` 渲染表格

#### 13.2 新增宠物

前端页面：

- `pet_front/src/views/AddPet.vue`

请求代码：

```ts
await api.post('/pets', {
  name: name.value,
  type: type.value,
  age: age.value
})
```

对应后端：

```java
@PostMapping
public ApiResponse<Pet> addPet(@RequestBody Pet pet) {
    petService.save(pet);
    return ApiResponse.success(pet);
}
```

流程是：

1. 用户填写宠物信息

2. 前端发 `POST /pets`

3. 后端收到 JSON 并映射为 `Pet` 对象

4. `petService.save(pet)` 调用 MyBatis-Plus 新增数据

5. 数据写入 MySQL

6. 后端返回成功响应

7. 前端跳回列表页

这就是“增删改查接口如何真正落到页面功能上”的完整闭环。

---

### 14. 请求拦截器在前后端打通中起什么作用

前端还做了一层统一封装：

```ts
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

这表示：

每次发请求前，都会自动把token带上。

这在真实项目里非常常见，因为很多后端接口需要登录态。

不过这个项目后端目前只是“模拟 token”，还没有真正做鉴权拦截。

---

### 15. 学 MyBatis-Plus 时要真正掌握的基础能力

如果你要把这个项目吃透，建议至少掌握下面这些知识点。

#### 15.1 依赖接入

知道为什么要引入：

- Web

- JDBC

- MyBatis-Plus

- MySQL 驱动

原因很简单：只有先搞清楚每个依赖分别负责什么，后面出了问题你才知道该去哪一层排查。比如接口起不来，通常先看 Web；连不上数据库，通常先看 JDBC 和 MySQL 驱动；CRUD 写法不熟，就看 MyBatis-Plus。

#### 15.2 数据库连接配置

知道：

- 驱动类是什么

- URL 怎么写

- 用户名密码在哪配

- SQL 日志怎么打开

这些都要知道的原因是：数据库连接是后端项目启动和运行的基础。驱动类错了，程序连不上数据库；URL 写错了，连到错误的库；用户名密码不对，认证会失败；SQL 日志不开，很多查询问题根本看不出来。

#### 15.3 实体映射

知道：

- `@TableName`

- `@TableId`

- 主键自增

原因是 MyBatis-Plus 操作数据库，本质上还是靠“Java 对象和表的映射关系”。如果这个映射没搞清楚，就会出现查不到、插不进、主键回填异常之类的问题。

#### 15.4 BaseMapper 基础 CRUD

至少要熟悉：

- `insert`

- `deleteById`

- `updateById`

- `selectById`

- `selectList`

- `selectOne`

原因是这几个方法几乎就是最基础的数据库操作。把它们掌握了，普通的小项目其实已经能完成大部分单表业务。

#### 15.5 条件构造器

至少理解：

- `eq`

- `like`

- `orderByDesc`

当前项目里已经用了：

```java
new QueryWrapper<User>().eq("username", username)
```

原因是实际项目很少只有“查全部”，更多时候都是“按条件查询”。如果不会条件构造器，就只能停留在最表面的CRUD。

#### 15.6 Service 层封装

知道为什么不要在 Controller 里直接写数据库代码。

原因是 Controller 主要负责接请求和回响应，业务逻辑应该放在 Service。这样代码职责更清晰，后面想复用、测试、扩展都会更方便。

#### 15.7 RESTful 接口

知道 HTTP 方法和业务动作对应关系：

- `GET` ：查

- `POST` ：增

- `PUT` ：改

- `DELETE` ：删

原因是当前这个项目本身就是前后端分离，前端调用后端接口时，首先接触到的就是这些请求方式。这个约定理解清楚了，前后端联调会顺很多。

#### 15.8 前后端联调

知道前端发请求后，后端怎么接，数据怎么回，页面怎么更新。

原因是我写这篇文章的核心目标，就是想真正看懂“前端点一个按钮之后，后端到底发生了什么”。只有把这条链看明白，前后端分离开发才不只是会抄代码。

---

### 16. 最后用一段话总结整个项目链路

这个项目的后端流程，本质上就是：

1. Spring Boot 启动项目

2. 读取 `application.yml` 连接 MySQL

3. `@MapperScan` 扫描并注册 Mapper

4. MyBatis-Plus 通过 `BaseMapper` 和 `ServiceImpl` 提供通用 CRUD

5. Controller 把后端能力暴露成 HTTP 接口

6. 前端通过 Axios 调这些接口

7. 后端返回 `ApiResponse` 格式 JSON

8. Vue 页面根据返回结果渲染数据

如果把这条链真正理解了，那么你学到的就不只是 MyBatis-Plus，而是一个完整的前后端协作模型。

---

### 17. 如何实现分页

虽然当前这个项目还没有真正写分页，但现在先简单叙述一下，分页是一个必不可少的路径。

#### 17.1 前端传分页参数

前端请求时，一般会把当前页和每页条数传给后端：

```ts
const res = await api.get('/pets/page', {
  params: {
    current: 1,
    size: 5
  }
})
```

这里的意思是：

- `current` 表示当前是第几页

- `size` 表示每页查几条

#### 17.2 后端接收分页参数

后端可以这样写：

```java
@GetMapping("/page")
public ApiResponse<IPage<Pet>> getPetPage(
        @RequestParam Integer current,
        @RequestParam Integer size) {
    Page<Pet> page = new Page<>(current, size);
    IPage<Pet> result = petService.page(page);
    return ApiResponse.success(result);
}
```

这段代码的核心是：

1. 接收前端传来的 `current` 和 `size`

2. 创建 `Page<Pet>` 对象

3. 调用 MyBatis-Plus 的 `page()` 方法查询分页数据

#### 17.3 后端会返回什么

分页查询返回的 `IPage<Pet>` 里通常会带这些内容：

- `records` ：当前页数据

- `total` ：总条数

- `current` ：当前页码

- `size` ：每页条数

这意味着后端不只是返回“数据列表”，而是把分页需要的信息一起返回给前端。

#### 17.4 前端怎么接分页结果

前端一般会这样处理：

```ts
pets.value = res.data.data.records
total.value = res.data.data.total
```

这样就能同时完成两件事：

- 表格显示当前页数据

- 分页组件根据 `total` 显示总页数和页码

#### 17.5 翻页时本质上发生了什么

当用户点击下一页，本质上就是前端把新的 `current` 再发给后端，后端重新查一次这一页的数据，再返回给前端。

所以分页实现可以简单记成一句话：

前端传页码和条数，后端查对应页的数据，再把当前页记录和总条数一起返回。

---

### 18. 总结

1. MyBatis-Plus 是 MyBatis 的增强工具，核心价值是减少重复 CRUD 代码。

2. 项目连接数据库依赖 `spring-boot-starter-jdbc` 和 `mysql-connector-j` 。

3. `application.yml` 里要配置数据源地址、账号、密码和驱动。

4. `@MapperScan` 用来扫描 Mapper 接口。

5. 实体类通过 `@TableName` 映射数据库表，通过 `@TableId` 指定主键策略。

6. Mapper 继承 `BaseMapper<T>` 后就有基础 CRUD 能力。

7. `QueryWrapper` 用来构造查询条件。

8. Service 层负责业务逻辑，Controller 层负责接收请求和返回响应。

9. 前端通过 Axios 调后端接口，后端返回统一 JSON。

10. 前后端打通的本质是“请求能发到后端，后端能查到数据，前端能正确展示结果”。

---

### 19. 小结

如果你现在和我一样，主要目标是搞清 `Spring Boot + Vue 3` 前后端分离开发的简单流程，那么这类小项目最好的学习方式不是死记注解，而是反复顺着一条请求链去看：

从页面按钮开始，看请求怎么发；
再看 Controller 怎么接；
再看 Service 怎么调；
再看 Mapper 怎么查；
最后看数据怎么回到页面上。

把这条链看顺了，MyBatis-Plus、Spring Boot、Vue 3 以及前后端联调这些知识点就会自然连起来。
