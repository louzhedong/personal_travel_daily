# 后端架构 / Backend Architecture

本文档记录当前 `server/appApi` 的真实分层方式，以及近一轮重构后几个最重要的拆分点：错误码常量共享、`visitMarkerRepository` 目录化、统计聚合分层、bootstrap serializer barrel 拆分、后台账号统计下沉。文档只描述已存在代码，不引入未来态设计。

This document captures the backend architecture as implemented today, including the current layering model and the key refactors already landed in the repository.

---

## 1. 设计目标 / Design Goals

当前后端不是把所有逻辑塞进 Fastify 路由，而是围绕“请求校验、业务编排、数据访问、DTO 序列化、共享常量”做明确分层。重构目标主要有三点：

- 让路由文件保持薄，只做鉴权、schema 解析和 service 调用。
- 让 service 专注业务流程和事务边界，而不是兼做 SQL/Prisma 细节或 DTO 组装。
- 让 repository、serializer、shared 成为可复用的底层积木，减少重复字面量和隐式耦合。

这样整理后，后端可以按 `buildApp -> routes -> schemas -> services -> repositories / serializers / shared` 理解。

Summary: The backend is intentionally layered so routes stay thin, services orchestrate flows, and repositories / serializers / shared modules hold reusable lower-level logic.

## 2. 应用入口与请求流 / App Entry and Request Flow

应用入口位于 `server/appApi/buildApp.ts`。当前流程非常明确：

- 注册 `cors`
- 按能力域注册各组路由：`auth`、`admin`、`health`、`bootstrap`、`companions`、`trips`、`stats`、`savedGuides`、`guideSearchHistories`、`markers`
- 统一挂载 `setErrorHandler`

统一错误处理通过 `normalizeAppApiError()` 完成，所有异常最终都会被规范成：

```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "human readable message"
  }
}
```

因此单次请求的标准链路通常是：

1. `routes/*.ts` 读取 Fastify request。
2. `requestAuth.ts` 完成会话鉴权。
3. `schemas/*.ts` + `parseWithSchema()` 完成输入校验。
4. `services/*.ts` 执行业务流程和事务。
5. `repositories/*.ts` 读写 Prisma。
6. `serializers/*.ts` 输出 DTO。
7. `buildApp.ts` 的统一错误处理返回标准错误结构。

Summary: `buildApp.ts` wires the route groups and a single error handler, while each request flows through auth, schema validation, services, repositories, and serializers.

## 3. 当前分层模型 / Current Layering Model

### 3.1 `routes/`

`server/appApi/routes/` 是 HTTP 入口层。每个文件只保留：

- 路径注册
- 登录态要求
- 输入解析
- 调用对应 service

例如 `routes/markers.ts` 只做：

- `requireAuthenticatedAccount(request)`
- `parseWithSchema(...)`
- 调用 `searchMarkerRecords()`、`createMarkerRecord()`、`batchUpdateMarkersTrip()`、`updateMarkerRecord()`、`deleteMarkerRecord()`

它不直接写 Prisma，也不直接拼 DTO。

### 3.2 `services/`

`server/appApi/services/` 是业务编排层，负责：

- 事务边界
- 权限/存在性检查
- 跨 repository 协作
- 聚合器或 serializer 的调用顺序

例如 `markerService.ts` 会在一个事务里校验 marker 是否属于当前账号、trip 是否存在，然后再执行批量更新。

### 3.3 `repositories/`

`server/appApi/repositories/` 是数据访问层，封装 Prisma 查询、更新和软删除。它们尽量只描述数据取法和写法，不承接高层 UI 语义。

### 3.4 `schemas/`

`server/appApi/schemas/` 使用 `zod` 描述每个接口的请求体、路径参数和查询参数，是后端输入约束的单一事实源。

### 3.5 `serializers/`

`server/appApi/serializers/` 负责把 Prisma model 或 service 聚合结果转成前端消费的 DTO，避免在 service 里反复手写 response shape。

### 3.6 `shared/`

`shared/` 承担跨前后端共享且不依赖运行时框架的纯常量、纯映射。当前已落地：

- `shared/errors/*`
- `shared/geo/*`

Summary: The current backend uses dedicated folders for routes, services, repositories, schemas, serializers, and cross-runtime shared modules, each with a narrower responsibility.

## 4. 错误码常量与 Shared / Shared Error Codes and Shared Layer

这次后端整理里，一个关键变化是把错误码字面量收口到 `shared/errors/codes.ts`。当前固定错误码只有以下几种：

- `INVALID_REQUEST`
- `NOT_FOUND`
- `CONFLICT`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `DATABASE_UNAVAILABLE`
- `INTERNAL_SERVER_ERROR`

`server/appApi/errors.ts` 不再自己维护一份字符串，而是直接消费并 re-export `APP_API_ERROR_CODE`。这样带来的收益是：

- 前端 `src/lib/api/types.ts` 可以直接复用同一套错误码常量。
- 文档、前端错误处理、后端错误工厂使用同一事实源。
- 新增错误码时不需要手动同步多份字符串表。

`shared/` 的另一个已落地点是 `shared/geo/countryMapping.ts`，统计域通过兼容薄壳 `services/stats/countryMapping.ts` 继续暴露历史 import 路径，同时把真实映射事实源放在共享层。

Summary: Error codes and geo mappings now have runtime-free shared sources so frontend, backend, and docs can reference the same constants.

## 5. visitMarkerRepository 目录化 / Visit Marker Repository Split

`visitMarkerRepository` 是本轮后端重构最典型的目录化案例。当前结构是：

- `repositories/visitMarker/read.ts`
- `repositories/visitMarker/write.ts`
- `repositories/visitMarker/batch.ts`
- `repositories/visitMarker/search.ts`
- `repositories/visitMarker/types.ts`
- `repositories/visitMarker/index.ts`
- `repositories/visitMarkerRepository.ts` 作为兼容 barrel

其中：

- `read.ts` 负责单条/多条查询
- `write.ts` 负责创建、更新、软删除等写入
- `batch.ts` 负责批量 trip 归属更新
- `search.ts` 负责 MySQL fulltext + fallback 搜索
- `index.ts` 统一导出稳定 API
- `visitMarkerRepository.ts` 保留历史 import 路径，避免上层 service 被大规模改路径

这类拆分说明仓库已经从“单仓储文件承接所有 marker 行为”转向“按读写/批量/搜索分域”，更适合后续继续扩展 marker 搜索和批处理逻辑。

Summary: `visitMarkerRepository` has been split by concern into read, write, batch, and search modules, while a barrel preserves the old import surface.

## 6. Stats Service 分层 / Stats Service Layering

统计域当前也已经从“单一 service 文件做完所有事”拆成了“service 编排 + 纯聚合函数 + 共享映射”的形态：

- `services/statsService.ts`：I/O、筛选编排、调用聚合器与 serializer
- `services/stats/aggregator.ts`：无副作用纯聚合函数
- `services/stats/countryMapping.ts`：兼容层，re-export `shared/geo/countryMapping.ts`
- `repositories/statsRepository.ts`：原始统计数据源读取
- `serializers/statsSerializer.ts`：DTO 输出

`aggregator.ts` 中的内容包括：

- 年份、月份、旅行天数等纯计算
- 国内地区名标准化
- 国际国家归一映射
- region/city/trip/companion 排行
- heatmap、summary、trip highlights 等派生结构

因此 `statsService.ts` 现在不需要再内联所有聚合算法，只保留“拿数据 -> 过滤 -> 组装响应”的编排职责。

Summary: The stats domain is split into repository I/O, service orchestration, pure aggregation helpers, and serializer output, with country mapping sourced from shared code.

## 7. Bootstrap Serializer Barrel 拆分 / Bootstrap Serializer Barrel Split

`bootstrap` 相关序列化原本集中在单文件里，现在已经拆到 `serializers/bootstrap/` 子目录：

- `companions.ts`
- `trips.ts`
- `markers.ts`
- `guides.ts`
- `shared.ts`
- `store.ts`
- `index.ts`

同时保留 `serializers/bootstrapSerializer.ts` 作为对外兼容 barrel，仅 re-export 新目录中的实现。这样做有两层收益：

- 对内：按 companions/trips/markers/guides/store 业务域拆清楚，文件更短。
- 对外：`bootstrapService.ts` 等既有调用方不需要一次性全部改 import 路径。

目前 `bootstrapService.ts` 的职责也比较清晰：读取用户、行程、记录、收藏、搜索历史后，调用 `serializeBootstrapStore()` 和 `serializeBootstrapResponse()` 统一输出整包 `TravelStore`。

Summary: Bootstrap serialization is now split by business domain under `serializers/bootstrap/`, while a top-level barrel keeps existing imports stable.

## 8. Admin 聚合下沉 / Admin Aggregation Extraction

后台管理页的聚合也完成了“serializer 减负”。当前结构里：

- `repositories/adminOverviewRepository.ts` 负责取出账号、行程、旅伴、记录、搜索等原始数据
- `services/adminService.ts` 负责后台总览业务流程
- `serializers/adminSerializer.ts` 负责 model -> DTO 映射
- `services/admin/accountStats.ts` 负责账号级统计摘要 `buildAdminAccountStats()`

这里最重要的变化是：`accountStats.ts` 从 `adminSerializer.ts` 中拆出账号层面的派生统计逻辑，包括：

- `tripCount`
- `companionCount`
- `markerCount`
- `savedGuideCount`
- `guideSearchHistoryCount`
- `markerSearchEventCount`

这样 serializer 更纯粹，只做序列化，不再同时承担统计聚合职责，也避免 serializer 反向依赖 service 造成循环引用风险。

Summary: Admin overview stats were extracted into `services/admin/accountStats.ts`, keeping the serializer focused on DTO mapping instead of derived aggregation.

## 9. Marker 批量归属链路示例 / Batch Trip Assignment Flow Example

`PATCH /api/markers/batch-trip` 很适合作为当前后端分层的示例：

1. `routes/markers.ts` 注册静态路径，并且显式要求它先于 `/api/markers/:id` 注册，避免被动态路由吞掉。
2. `schemas/markers.ts` 用 `batchUpdateMarkersTripBodySchema` 约束 `markerIds` 和可空 `tripId`。
3. `services/markerService.ts` 去重 `markerIds`，校验所有 marker 都属于当前账号，若传入 `tripId` 则确认 trip 存在。
4. `repositories/visitMarker/batch.ts` 执行批量 trip 更新。
5. 最终通过 `buildCurrentStoreSnapshot()` 返回最新整包前端 store。

这个例子说明当前 API 并非“就地返回局部 mutation 结果”，而是很多主业务写操作仍然遵循“服务端完成修改后回传最新聚合快照”的模式。

Summary: The batch-trip endpoint shows the full architecture in action, from route ordering and schema validation to transactional service logic and repository-backed updates.

## 10. 扩展约定 / Extension Rules

基于当前后端结构，后续扩展应优先遵循以下规则：

- 新接口先补 `schema`，再写 `route` 和 `service`，不要跳过输入层。
- 需要复用的 DTO 组装逻辑优先放 `serializers/`，不要散落在 route/service。
- 出现同域大文件膨胀时，优先做“目录化 + barrel 兼容层”拆分，延续 `visitMarkerRepository`、`bootstrapSerializer` 的模式。
- 真正跨前后端共享的纯常量和映射优先进入 `shared/`，且保持零运行时依赖。

这些约定的目标不是追求形式统一，而是保持当前已经获得的边界清晰度。

Summary: Future backend work should preserve schema-first inputs, service orchestration, serializer reuse, barrel-backed splits, and runtime-free shared modules.
