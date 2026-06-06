---
title: "从零搭建 Spring Boot 后端：分页、搜索、跨域、文档，一个都不少"
description: "涵盖 MyBatis-Plus 分页+条件查询、日期参数处理、Knife4j 接口文档、CORS 跨域配置、异常数据标记等实战要点，每个知识点都附带【为什么】和【怎么写】。"
date: 2026-06-04
tags: ["SpringBoot", "MyBatis-Plus", "Knife4j", "CORS", "分页"]
---
# 从零搭建 Spring Boot 后端：分页、搜索、跨域、文档，一个都不少


> 写本文的目的是对我最近写的还未完成的项目demo的阶段性技术复盘和问题回顾，涵盖 MyBatis-Plus 分页 + 条件查询、日期参数处理、Knife4j 接口文档、CORS 跨域配置、异常数据标记等实战要点。适合刚接触 Spring Boot 后端开发的同学阅读，每个知识点都为你们附带了【为什么】和【怎么写】。

---

### 一、项目骨架速览

技术栈：SpringBoot 3.5 + MyBatis-Plus 3.5 + MySQL 8.0 + Knife4j + Redis。

分层结构：

```cobol
controller  →  接收请求，返回统一格式 Result<T>
service     →  业务逻辑（分页、搜索、阈值判断、趋势组装）
mapper      →  数据库操作（继承 MyBatis-Plus BaseMapper）
entity      →  实体类，映射数据库表
config      →  跨域、分页插件、Knife4j 等配置
```

所有接口返回格式统一为：

```css
{ "code": 200, "message": "成功", "data": {} }
```

---

**二、MyBatis-Plus 分页：三步走** 

#### 2.1 第一步：注册分页插件

MyBatis-Plus的分页功能默认不开启，需要在 config 包下加一个配置类：

```java
@Configuration
public class MyBatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        PaginationInnerInterceptor pagination = new PaginationInnerInterceptor(DbType.MYSQL);
        pagination.setOverflow(false);   // 超出页码范围返回空数据，而非循环取最后一页
        pagination.setMaxLimit(100L);    // 单页最多 100 条，防止恶意拉全量
        interceptor.addInnerInterceptor(pagination);
        return interceptor;
    }
}
```

pagination.setOverflow(false)是个容易忽略的细节：默认情况下，你请求第 999 页但总共只有 5 页，MyBatis-Plus 会把最后一页的数据返回给你。设为 false 后直接返回空列表，<span style="color: #3391E5">前端</span>才能正确判断【没更多数据了】。

#### 2.2 第二步：分清 Page 和 IPage

这是很多新手会踩的坑：

| 类型 | 角色 | 谁创建 | 干什么 |
|:---:|:---:|:---:|:---:|
| `Page<T>` | 入参（请求对象） | 你 new 出来 | 告诉 MP 要第几页、每页多少条 |
| `IPage<T>` | 出参（结果对象） | MP 查完返回 | 包含 records（数据）、total（总数）、pages（总页数） |


**口诀：入参用 Page，返回值用 IPage。** 

```java
// Controller 接收前端参数
@GetMapping("/elderly")
public Result<IPage<Elderly>> list(
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer pageSize,
        @RequestParam(required = false) String keyword) {
    return Result.success(elderlyService.pageQuery(page, pageSize, keyword));
}
​
// ServiceImpl 实现
public IPage<Elderly> pageQuery(Integer page, Integer pageSize, String keyword) {
    Page<Elderly> pageObj = new Page<>(page, pageSize);  // 入参：Page
    LambdaQueryWrapper<Elderly> wrapper = new LambdaQueryWrapper<>();
    // ... 拼接条件 ...
    return this.page(pageObj, wrapper);                   // 返回值：IPage
}
```

#### 2.3 第三步：LambdaQueryWrapper 条件构造

这是 MyBatis-Plus 最常用的 API，核心优势是 **用 Lambda 表达式引用字段名** ，而不是手写字符串。好处：字段改名时 IDE 自动重构，不会漏掉。

**常用方法速查：** 

| 方法 | SQL 等价 | 示例 |
|:---:|:---:|:---:|
| `.eq(Entity::getX, val)` | `x = val` | 精确匹配 |
| `.ne(Entity::getX, val)` | `x != val` | 不等于 |
| `.like(Entity::getX, val)` | `x LIKE '%val%'` | 模糊搜索 |
| `.ge(Entity::getX, val)` | `x >= val` | 大于等于（日期范围起点） |
| `.le(Entity::getX, val)` | `x <= val` | 小于等于（日期范围终点） |
| `.orderByDesc(Entity::getX)` | `ORDER BY x DESC` | 降序排列 |
| `.orderByAsc(Entity::getX)` | `ORDER BY x ASC` | 升序排列 |


**条件拼接示例 —— 分页 + 关键词搜索 + 日期筛选：** 

```java
LambdaQueryWrapper<HealthRecord> wrapper = new LambdaQueryWrapper<>();
​
// 1. 限定老人（必须条件）
wrapper.eq(HealthRecord::getElderlyId, elderlyId);
​
// 2. 可选日期范围
if (startDate != null) {
    wrapper.ge(HealthRecord::getRecordDate, startDate);
}
if (endDate != null) {
    wrapper.le(HealthRecord::getRecordDate, endDate);
}
​
// 3. 按日期降序（最新在前）
wrapper.orderByDesc(HealthRecord::getRecordDate);
​
// 4. 执行分页查询
Page<HealthRecord> pageObj = new Page<>(page, size);
return this.page(pageObj, wrapper);
```

#### 2.4 关键陷阱： `and()` 的正确用法

关键词搜索的典型需求："按姓名或手机号搜索"，即 `WHERE (name LIKE '%kw%' OR phone LIKE '%131%')` 。

**错误写法** ：

```java
wrapper.eq(Elderly::getStatus, 1)
       .like(Elderly::getName, keyword)
       .or()
       .like(Elderly::getPhone, keyword);
// 结果：WHERE status = 1 AND name LIKE '%kw%' OR phone LIKE '%kw%'
// 语义：(status=1 AND name) OR phone  —— 不符合预期！
```

**正确写法** ：用.and把 OR 条件包在括号里：

```java
wrapper.eq(Elderly::getStatus, 1)
       .and(w -> w.like(Elderly::getName, keyword)
                  .or()
                  .like(Elderly::getPhone, keyword));
// 结果：WHERE status = 1 AND (name LIKE '%kw%' OR phone LIKE '%kw%')
// w是自定义的，符合规则任取，是and()方法内部嵌套的新查询条件包装器
```

**原理** ：SQL 中 AND 优先级高于 OR。不加括号，OR 会把前面的条件拆开。and(Consumer)传入一个子 Wrapper，MP 自动在外面包一层括号。

---

### 三、@DateTimeFormat：GET 请求日期参数的必备注解

#### 3.1 问题

前端传 `?startDate=2026-05-01` ，后端用 `LocalDate` 接收，不加注解直接 400。

#### 3.2 原因

GET 请求的 URL 参数本质都是 **字符串** 。Spring 拿到 `"2026-05-01"` 需要转成 `LocalDate` 对象，你得告诉它按什么格式解析。

#### 3.3 正确写法

```java
@GetMapping("/trend/{elderlyId}")
public Result<?> getTrend(
        @PathVariable Long elderlyId,
        @RequestParam(required = false)
        @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
        @RequestParam(required = false)
        @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
    // ...
}
```

#### 3.4 常见格式对照

| Java 类型 | pattern |
|:---:|:---:|
| `LocalDate` | `yyyy-MM-dd` |
| `LocalDateTime` | `yyyy-MM-dd HH:mm:ss` |
| `LocalTime` | `HH:mm:ss` |


#### 3.5 注意别搞混

- `@DateTimeFormat` → GET 请求 `@RequestParam` / `@PathVariable` （Spring 自己解析）

- `@JsonFormat` → POST 请求 `@RequestBody` （Jackson 反序列化 JSON）

---

### 四、统一返回格式 Result<T>

让所有接口返回结构一致，前端只需处理一种数据格式：

```java
@Schema(description = "统一响应结果")
@Data
public class Result<T> {
    private Integer code;
    private String msg;
    private T data;
 
    public static <T> Result<T> success(T data){
        return new Result<>(200,"成功",data);
    }
 
    public static <T>Result<T> success(){
        return new Result<>(200,"成功",null);
    }
 
    public static <T> Result<T> error(String msg){
        return new Result<>(500,"失败:"+msg,null);
    }
}
```

Controller 返回时直接Result.success(data)，干净利落。

配合@RestControllerAdvice全局异常处理，连 try-catch 都不用写：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }
}
```

---

### 五、Knife4j：接口文档自动生成

#### 5.1 依赖配置

Knife4j 本质是 Swagger 的增强 UI。Spring Boot3.5 需要特别注意版本兼容(已老实，吃过亏了)——springdoc 版本不对会导致 `/doc.html` 页面空白。

```XML
<!-- Knife4j -->
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
    <version>4.5.0</version>
    <exclusions>
        <exclusion>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!-- 显式声明兼容 Spring Boot 3.5 的 springdoc 版本 -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.13</version>
</dependency>
```

#### 5.2 基础配置类

```java
@Configuration
public class Knife4jConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("xxxx API 文档")
                        .version("1.0.0")
                        .description("xxxxx接口文档"));
    }
}
```

#### 5.3 四个核心注解，别再搞混

这是新人最高频的坑——长得像但分工完全不同：

| 注解 | 用途 | 贴在哪里 |
|:---:|:---:|:---:|
| `@Tag(name = "...")` | 接口分组名 | Controller **类** 上 |
| `@Operation(summary = "...")` | 接口说明 | Controller **方法** 上 |
| `@Parameter(description = "...")` | 参数说明 | 方法 **参数** 前 |
| `@Schema(description = "...")` | 字段说明 | Entity **类/字段** 上 |


**记忆技巧** ：

- Operation 描述「操作」——这个接口干什么

- Schema 描述「模型」——这个数据结构长什么样

- Tag 是分组标签

- Parameter 是参数

#### 5.4 application.yml 配置

```XML
springdoc:
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /v3/api-docs
​
knife4j:
  enable: true
  setting:
    language: zh_cn
```

项目启动后访问 `http://localhost:8080/doc.html` 即可看到所有接口，直接在线调试。

---

### 六、CORS 跨域配置

#### 6.1 为什么需要

浏览器同源策略：(协议/域名/端口)端口不同也算跨域。前端 `localhost:5173` 请求后端 `localhost:8080` 会被拦截。后端需要在响应头声明「允许跨域」。

#### 6.2 @CrossOrigin 还是全局配置？

`@CrossOrigin` 贴在每个 Controller 上也能用，但项目 Controller 多了以后容易漏，维护成本高。 **推荐用全局配置类** ，一劳永逸：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")                            // 所有接口
                .allowedOrigins("http://localhost:5173")       // 允许的前端地址
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")                           // 允许所有请求头
                .allowCredentials(true)                        // 允许携带 Cookie/Token
                .maxAge(3600);                                 // 预检请求缓存 1 小时
    }
}
```

#### 6.3 maxAge 的作用

浏览器发跨域请求前会先发一个 OPTIONS 预检请求，问服务器「你允不允许我跨域？」。 `maxAge(3600)` 告诉浏览器「1 小时内不用再问了」，减少不必要的网络开销。

---

### 七、异常数据标记的设计思路

需求：健康记录中，血压、心率、血糖任一指标超出阈值范围，该条记录在列表中红色高亮。

#### 7.1 实现方案

实体类加一个 `abnormal` 字段，标注 `@TableField(exist = false)` 表示它在数据库中没有对应列，只用于返回给前端：

```java
@TableField(exist = false)
@Schema(description = "是否有异常指标")
private Boolean abnormal;
```

查询方法执行后，遍历结果列表，逐条比对阈值：

```java
private void markAbnormal(List<HealthRecord> records) {
    ThresholdConfig config = thresholdConfigService.getConfig();
    if (config == null) return;
​
    for (HealthRecord r : records) {
        boolean abnormal = false;
        // 收缩压超出范围
        if (r.getSystolicPressure() != null) {
            if (r.getSystolicPressure() < config.getSystolicMin()
                || r.getSystolicPressure() > config.getSystolicMax()) {
                abnormal = true;
            }
        }
        // 舒张压、心率、血糖同理...
        r.setAbnormal(abnormal);
    }
}
```

#### 7.2 为什么用 compareTo 而非直接比较

阈值配置中血糖类型是 `BigDecimal` ，不能用 `<` 、 `>` 运算符。必须用 `compareTo` ：

```java
// BigDecimal 专用
r.getBloodGlucose().compareTo(config.getBloodGlucoseMin()) < 0  // 小于下限
r.getBloodGlucose().compareTo(config.getBloodGlucoseMax()) > 0  // 大于上限
```

`compareTo` 返回值：负数表示小于，0 表示相等，正数表示大于。

---

### 八、其他踩坑记录

#### 8.1 @RequestBody 别漏

POST/PUT 接口接收JSONbody，参数前必须加 `@RequestBody` ，否则 Spring 不会把请求体 JSON 反序列化为对象，所有字段都是 null。

#### 8.2 BigDecimal 而非 Integer/Double

金额、血糖、体重等需要小数的字段：

- `Integer` → 存不了小数（血糖 5.6 变 5）

- `Double` → 精度丢失（0.1 + 0.2 ≠ 0.3）

- `BigDecimal` → 唯一正确选择

对应的数据库列类型用 `DECIMAL(M, D)` 。

#### 8.3 keyword.trim().isEmpty()

搜索参数判空时先用 `trim()` 去掉首尾空格再判断。否则用户输入一个空格就会触发一次无效的数据库查询。

---

### 九、总结

该阶段完成了后端地基：CRUD、分页搜索、趋势接口、阈值配置、异常标记、跨域、接口文档。这 7 个知识点是 Spring Boot 后端开发的基本功，哪都绕不开：

1. **MyBatis-Plus 分页** ：Page 入、IPage 出，别忘了注册插件

2. **LambdaQueryWrapper** ：lambda 引用字段名， `and()` 包 OR 条件

3. **@DateTimeFormat** ：GET 请求日期参数必须加

4. **Result<T>** ：统一返回格式，前端省心

5. **Knife4j** ：版本兼容是关键，四个注解各司其职

6. **CORS** ：全局配置优于逐个注解

7. **异常标记** ：transient 字段 + 查询后遍历打标

地基打好了，下一阶段上 JWT + Spring Security 认证授权，敬请期待。

---
