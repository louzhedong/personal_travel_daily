# 后端架构 / Backend Architecture

本文档记录当前 `server/appApi` 的真实分层方式，以及近一轮重构后几个最重要的拆分点：错误码常量共享、`visitMarkerRepository` 目录化、统计聚合与成就解锁分层、bootstrap serializer barrel 拆分、后台账号统计下沉、API DTO 目录化。文档只描述已存在代码，不引入未来态设计。
This document records the actual backend layering in `server/appApi` and the most important refactors from the latest pass: shared error codes, `visitMarkerRepository` directory splitting, stats aggregation and achievement-unlock layering, bootstrap serializer barrel splitting, admin account-stat extraction, and API DTO directory splitting. It only describes code that already exists.

---

## 1. 设计目标 / Design Goals

当前后端不是把所有逻辑塞进 Fastify 路由，而是围绕“请求校验、业务编排、数据访问、DTO 序列化、共享常量”做明确分层。  
The backend is not organized as a set of oversized Fastify routes. Instead, it is layered around request validation, business orchestration, data access, DTO serialization, and shared constants.

- 路由文件保持薄，只做鉴权、schema 解析和 service 调用。  
  Route files stay thin and only handle auth checks, schema parsing, and service invocation.
- service 专注业务流程和事务边界，而不是兼做 SQL/Prisma 细节或 DTO 组装。  
  Services focus on business flow and transaction boundaries instead of mixing in SQL/Prisma details or DTO shaping.
- repository、serializer、shared 成为可复用的底层积木，减少重复字面量和隐式耦合。  
  Repositories, serializers, and shared modules act as reusable lower-level building blocks to reduce duplicated literals and hidden coupling.

这样整理后，后端可以按 `buildApp -> routes -> schemas -> services -> repositories / serializers / shared` 理解。  
With this structure, the backend can be read as `buildApp -> routes -> schemas -> services -> repositories / serializers / shared`.

## 2. 应用入口与请求流 / App Entry and Request Flow

应用入口位于 `server/appApi/buildApp.ts`。它负责注册 `cors`、按能力域注册路由，并统一挂载 `setErrorHandler`。  
The application entry lives in `server/appApi/buildApp.ts`. It registers `cors`, mounts route groups by domain, and attaches a single `setErrorHandler`.

统一错误处理通过 `normalizeAppApiError()` 完成，所有异常最终都会被规范成统一的 `error.code + error.message` 结构。  
Error normalization is handled through `normalizeAppApiError()`, so all thrown failures are normalized into a consistent `error.code + error.message` shape.

标准请求链路通常是：`routes/*.ts` 读取请求，`requestAuth.ts` 完成鉴权，`schemas/*.ts` 与 `parseWithSchema()` 完成输入校验，`services/*.ts` 执行业务流程，`repositories/*.ts` 读写 Prisma，`serializers/*.ts` 输出 DTO，最后由 `buildApp.ts` 返回统一错误结构。  
A standard request flow usually looks like this: `routes/*.ts` reads the request, `requestAuth.ts` performs authentication, `schemas/*.ts` and `parseWithSchema()` validate inputs, `services/*.ts` execute the business flow, `repositories/*.ts` read or write through Prisma, `serializers/*.ts` shape DTOs, and `buildApp.ts` returns standardized errors.

## 3. 当前分层模型 / Current Layering Model

`routes/` 是 HTTP 入口层，只保留路径注册、登录态要求、输入解析和 service 调用。`services/` 是业务编排层，负责事务边界、权限检查、跨 repository 协作和 serializer 调用顺序。`repositories/` 是数据访问层，封装 Prisma 查询、更新和软删除。`schemas/` 用 `zod` 定义请求约束。`serializers/` 负责把 model 或聚合结果转成 DTO。`shared/` 负责前后端可共用的纯常量和纯映射。  
`routes/` is the HTTP entry layer and keeps only path registration, login requirements, input parsing, and service calls. `services/` is the business orchestration layer for transaction boundaries, permission checks, cross-repository coordination, and serializer call order. `repositories/` is the data access layer wrapping Prisma queries, updates, and soft deletes. `schemas/` defines request contracts with `zod`. `serializers/` convert models or aggregation results into DTOs. `shared/` stores runtime-free constants and mappings shared across frontend and backend.

当前共享层已经落地 `shared/errors/*` 与 `shared/geo/*`。  
The shared layer currently contains `shared/errors/*` and `shared/geo/*`.

## 4. 错误码常量与 Shared / Shared Error Codes and Shared Layer

一个关键变化是把错误码字面量收口到 `shared/errors/codes.ts`。当前固定错误码包括：`INVALID_REQUEST`、`NOT_FOUND`、`CONFLICT`、`UNAUTHORIZED`、`FORBIDDEN`、`DATABASE_UNAVAILABLE`、`INTERNAL_SERVER_ERROR`。  
One key change is that error-code literals are now centralized in `shared/errors/codes.ts`. The current stable error codes are `INVALID_REQUEST`, `NOT_FOUND`, `CONFLICT`, `UNAUTHORIZED`, `FORBIDDEN`, `DATABASE_UNAVAILABLE`, and `INTERNAL_SERVER_ERROR`.

`server/appApi/errors.ts` 直接消费并 re-export `APP_API_ERROR_CODE`，前端 `src/lib/api/types.ts` 也复用同一事实源。这样文档、前端错误处理和后端错误工厂不再维护多份字符串表。  
`server/appApi/errors.ts` now consumes and re-exports `APP_API_ERROR_CODE`, and frontend `src/lib/api/types.ts` reuses the same source. This prevents docs, frontend error handling, and backend error factories from maintaining multiple string tables.

`shared/geo/countryMapping.ts` 则承载国际国家映射，统计域通过 `services/stats/countryMapping.ts` 继续暴露兼容 import 路径。  
`shared/geo/countryMapping.ts` now holds the international-country mapping, while the stats domain keeps a compatibility import path through `services/stats/countryMapping.ts`.

## 5. visitMarkerRepository 目录化 / Visit Marker Repository Split

`visitMarkerRepository` 是本轮后端重构最典型的目录化案例。当前结构包括 `read.ts`、`write.ts`、`batch.ts`、`search.ts`、`types.ts`、`index.ts`，以及作为兼容 barrel 的 `visitMarkerRepository.ts`。  
`visitMarkerRepository` is the clearest example of directory-based decomposition in this backend refactor. The current structure includes `read.ts`, `write.ts`, `batch.ts`, `search.ts`, `types.ts`, `index.ts`, and a compatibility barrel `visitMarkerRepository.ts`.

其中 `read.ts` 负责查询，`write.ts` 负责创建和更新，`batch.ts` 负责批量 trip 归属，`search.ts` 负责全文搜索与 fallback，`index.ts` 统一导出稳定 API。  
Within that split, `read.ts` handles queries, `write.ts` handles creation and updates, `batch.ts` handles bulk trip assignment, `search.ts` handles full-text search plus fallback behavior, and `index.ts` exports the stable API surface.

这种拆分让 marker 仓储从“一个文件承接所有行为”变成“按读写/批量/搜索分域”，更适合继续扩展 marker 搜索和批处理逻辑。  
This turns the marker repository from a single all-purpose file into separate read, write, batch, and search concerns, making future search and bulk-processing evolution easier.

## 6. Stats Service 分层 / Stats Service Layering

统计域已经从“单一 service 文件做完所有事”拆成了“service 编排 + 纯聚合函数 + 共享映射 + 解锁记录持久化”的形态。
The stats domain has been split from a single all-in-one service file into service orchestration, pure aggregation helpers, shared mappings, and unlock persistence.

- `services/statsService.ts`：I/O、筛选编排、调用聚合器与 serializer。  
  `services/statsService.ts`: I/O, filtering orchestration, and calls into aggregators and serializers.
- `services/stats/aggregator.ts`：无副作用纯聚合函数。  
  `services/stats/aggregator.ts`: side-effect-free aggregation helpers.
- `services/stats/countryMapping.ts`：兼容层，re-export `shared/geo/countryMapping.ts`。  
  `services/stats/countryMapping.ts`: compatibility re-export of `shared/geo/countryMapping.ts`.
- `repositories/statsRepository.ts`：原始统计数据源读取。  
  `repositories/statsRepository.ts`: raw stats source reads.
- `serializers/statsSerializer.ts`：DTO 输出。  
  `serializers/statsSerializer.ts`: DTO shaping.

`aggregator.ts` 中承载年份、月份、旅行天数、地区归一、排行、heatmap、summary、trip highlights、全局成就和年度成就等纯计算，因此 `statsService.ts` 现在只保留“拿数据 -> 过滤 -> 组装响应 -> 记录首次解锁”的编排职责。
`aggregator.ts` now holds pure calculations for years, months, travel days, region normalization, rankings, heatmaps, summaries, trip highlights, global achievements, and annual achievements, so `statsService.ts` can stay focused on the orchestration flow of fetch -> filter -> assemble response -> persist first unlocks.

成就状态仍按当前请求视图实时计算；只有默认全量统计视图和年度回顾视图会写入 `AchievementUnlock`，用于返回稳定的 `firstUnlockedAt`。筛选后的统计成就不写表，避免把临时视图误当成真实解锁历史。
Achievement status is still computed live for the current request view. Only the default unfiltered stats view and annual-review view write `AchievementUnlock` rows so the API can return stable `firstUnlockedAt` values. Filtered stats views do not write unlock rows, which prevents temporary slices from becoming permanent unlock history.

## 7. Bootstrap Serializer Barrel 拆分 / Bootstrap Serializer Barrel Split

`bootstrap` 相关序列化现在已经拆到 `serializers/bootstrap/` 子目录，包括 `companions.ts`、`trips.ts`、`markers.ts`、`guides.ts`、`shared.ts`、`store.ts` 和 `index.ts`。  
Bootstrap serialization has now been split into the `serializers/bootstrap/` folder, including `companions.ts`, `trips.ts`, `markers.ts`, `guides.ts`, `shared.ts`, `store.ts`, and `index.ts`.

旅行胶囊新增 `routes/memoryCapsules.ts`、`services/memoryCapsuleService.ts`、`services/memoryCapsules/*`、`repositories/memoryCapsuleRepository.ts` 和 `serializers/memoryCapsuleSerializer.ts`。服务层保存配置并实时组合行程、年度或旅伴源内容，避免创建新的内容快照事实源。

Travel Memory Capsules add `routes/memoryCapsules.ts`, `services/memoryCapsuleService.ts`, `services/memoryCapsules/*`, `repositories/memoryCapsuleRepository.ts`, and `serializers/memoryCapsuleSerializer.ts`. The service layer persists configuration and composes trip, annual, or companion source content at read time, avoiding a second snapshot source of truth.

同时保留 `serializers/bootstrapSerializer.ts` 作为对外兼容 barrel，仅 re-export 新目录中的实现。这样对内按业务域拆清楚，对外又不需要一次性修改所有 import 路径。  
At the same time, `serializers/bootstrapSerializer.ts` remains as a compatibility barrel that simply re-exports the new folder implementation. This keeps internals organized by business domain without forcing all existing imports to change at once.

## 8. Admin 聚合下沉 / Admin Aggregation Extraction

后台管理页相关的聚合也完成了“serializer 减负”。当前结构中，`repositories/adminOverviewRepository.ts` 负责读取原始数据，`services/adminService.ts` 负责后台总览流程，`serializers/adminSerializer.ts` 负责 DTO 映射，`services/admin/accountStats.ts` 负责账号级统计摘要 `buildAdminAccountStats()`。  
Admin-related aggregation has also been extracted away from the serializer. In the current structure, `repositories/adminOverviewRepository.ts` reads raw data, `services/adminService.ts` orchestrates the admin overview flow, `serializers/adminSerializer.ts` maps DTOs, and `services/admin/accountStats.ts` builds account-level summary stats through `buildAdminAccountStats()`.

`accountStats.ts` 从 `adminSerializer.ts` 中拆出后，serializer 只做序列化，不再同时承担统计聚合职责，也避免 serializer 反向依赖 service 造成循环引用风险。  
Once `accountStats.ts` was split out of `adminSerializer.ts`, the serializer returned to a pure mapping role instead of mixing in aggregation logic, which also reduces the risk of serializer-to-service circular dependencies.

## 9. Marker 批量归属链路示例 / Batch Trip Assignment Flow Example

`PATCH /api/markers/batch-trip` 很适合作为当前后端分层的示例。它的链路是：`routes/markers.ts` 注册静态路径并保证优先于 `/:id`；`schemas/markers.ts` 校验 `markerIds` 和可空 `tripId`；`services/markerService.ts` 去重并校验 marker 与 trip；`repositories/visitMarker/batch.ts` 执行批量更新；最终通过 `buildCurrentStoreSnapshot()` 回传最新整包 `TravelStore`。  
`PATCH /api/markers/batch-trip` is a good example of the current backend layering. Its flow is: `routes/markers.ts` registers the static path before `/:id`; `schemas/markers.ts` validates `markerIds` and nullable `tripId`; `services/markerService.ts` deduplicates and validates markers and trips; `repositories/visitMarker/batch.ts` performs the batch update; and `buildCurrentStoreSnapshot()` returns the latest full `TravelStore` snapshot.

这个例子说明当前主业务写操作仍然遵循“服务端完成修改后回传最新聚合快照”的模式，而不是只回传局部 mutation 结果。  
This example shows that major write flows still follow a server-updates-then-return-full-snapshot pattern rather than returning only partial mutation results.

## 10. 扩展约定 / Extension Rules

基于当前后端结构，后续扩展应优先遵循以下规则。  
Based on the current backend structure, future work should follow these rules.

- 新接口先补 `schema`，再写 `route` 和 `service`，不要跳过输入层。  
  Add the `schema` first for any new endpoint, then implement the `route` and `service`; do not skip the input layer.
- 新增或变更 API DTO 时，优先进入 `server/appApi/dto/*` 对应领域文件；`server/appApi/types.ts` 只保留兼容 barrel。
  Add or update API DTOs in the matching `server/appApi/dto/*` domain file; `server/appApi/types.ts` should stay as a compatibility barrel.
- 需要复用的 DTO 组装逻辑优先放 `serializers/`，不要散落在 route/service。  
  Reusable DTO-shaping logic should live in `serializers/` instead of being scattered across routes or services.
- 同域大文件膨胀时，优先做“目录化 + barrel 兼容层”拆分，延续 `visitMarkerRepository`、`bootstrapSerializer` 的模式。  
  When a same-domain file grows too large, prefer a directory split with a compatibility barrel, following the `visitMarkerRepository` and `bootstrapSerializer` pattern.
- 超过约 `500` 行的纯聚合或规则文件应优先评估按子域拆分，并保留兼容 barrel 降低 import 迁移成本。
  Pure aggregation or rule files above roughly `500` lines should be reviewed for subdomain splitting while keeping compatibility barrels to reduce import churn.
- 真正跨前后端共享的纯常量和映射优先进入 `shared/`，并保持零运行时依赖。  
  Pure constants and mappings that are truly shared across frontend and backend should move into `shared/` and stay runtime-free.

这些约定的目标不是追求形式统一，而是保持当前已经获得的边界清晰度。  
The purpose of these conventions is not stylistic uniformity, but preserving the clearer boundaries that this refactor has already established.
