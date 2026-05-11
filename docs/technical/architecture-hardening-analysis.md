# 架构硬化深度分析 / Architecture Hardening Analysis

本文档记录当前项目在大量功能落地后的全栈架构体检结果，并给出风险优先的优化路线。它不是新功能方案，而是后续降低技术债、控制回归面和提升开发效率的执行依据。

This document captures a full-stack architecture review after a large set of features have shipped. It is not a new product feature spec; it is the execution baseline for reducing technical debt, controlling regression risk, and improving development velocity.

---

## 1. 当前架构地图 / Current Architecture Map

### 产品能力 / Product Capabilities

当前产品已经覆盖地图记录、旅伴管理、时间线、行程集合、行前规划、愿望地图、攻略搜索、行前清单、统计中心、旅行成就、年度回顾、Story Studio、旅伴共同回忆、影像编辑台、后台质量治理和账号会话治理。

The product now spans map capture, companions, timelines, trip collections, planning, wishlist maps, guide search, checklists, stats, achievements, annual reviews, Story Studio, companion memories, photo curation, admin quality governance, and account/session governance.

### 前端层 / Frontend Layer

- `src/modules/App.tsx`：会话恢复、角色守卫和顶层页面分发。
- `src/modules/app/router.ts`：手写路由的单一事实源。
- `src/modules/TravelApp.tsx`：首页编排容器。
- `src/modules/**/<module>Model.ts`：页面展示模型和纯派生逻辑。
- `src/components/**`：业务组件、UI 组件和领域子组件。
- `src/lib/api/*Api.ts`：领域 API client。
- `src/lib/api/dto/*`：前端 API DTO 分域类型。

Frontend summary: routing, page orchestration, view models, business components, API clients, and API DTOs are separated into recognizable layers.

### 后端层 / Backend Layer

- `server/appApi/buildApp.ts`：Fastify 应用组装、CORS 和统一错误处理。
- `server/appApi/routes/*`：HTTP 入口、鉴权、schema 解析和 service 调用。
- `server/appApi/schemas/*`：Zod 输入约束。
- `server/appApi/services/*`：业务编排、事务边界和权限规则。
- `server/appApi/repositories/*`：Prisma 查询封装。
- `server/appApi/serializers/*`：DB 模型到 DTO 的转换。
- `server/appApi/dto/*`：后端 API DTO 分域类型。
- `server/prisma/schema.prisma`：MySQL 数据模型与关系。

Backend summary: the API follows a `routes -> schemas -> services -> repositories -> serializers -> Prisma` request flow, with DTOs now split by domain.

### 数据层 / Data Layer

MySQL / Prisma 是主业务数据的单一事实源。IndexedDB 和 guide file cache 只保留缓存或辅助状态语义，不再承载主数据恢复。后台治理保持只读原则，不直接修复业务数据。

MySQL / Prisma is the source of truth. IndexedDB and guide file caches are auxiliary only. Admin governance remains read-only and does not directly repair business data.

---

## 2. 关键风险 / Key Risks

### P0：API DTO 单体与类型漂移 / API DTO Monoliths and Type Drift

近期功能持续增加后，前后端 API DTO 曾分别集中在 `server/appApi/types.ts` 和 `src/lib/api/types.ts`。这会带来三个问题：跨域变更都碰同一个文件、PR 冲突概率升高、前后端字段同步更难审查。

The backend and frontend API DTOs had grown into large monolithic files. That increases merge conflicts, makes cross-domain changes noisy, and makes frontend/backend shape drift harder to review.

当前处理：已按领域拆到 `server/appApi/dto/*` 和 `src/lib/api/dto/*`，原 `types.ts` 保留为兼容 barrel。

Current action: DTOs are split into `server/appApi/dto/*` and `src/lib/api/dto/*`, while the original `types.ts` files remain compatibility barrels.

### P1：统计聚合器过厚 / Oversized Stats Aggregator

`server/appApi/services/stats/aggregator.ts` 曾超过千行，虽然保持纯函数特性，但同时承载筛选、排行、成就、年度回顾和照片/攻略聚合。本轮已迁移到 `server/appApi/services/stats/aggregator/*`，并提供 `filters`、`rankings`、`achievements`、`annualReview` 等子出口，原路径保留兼容 barrel。

`server/appApi/services/stats/aggregator.ts` used to own filtering, rankings, achievements, annual-review composition, and photo/guide aggregation. This round moved it under `server/appApi/services/stats/aggregator/*`, exposed focused sub-exports such as `filters`, `rankings`, `achievements`, and `annualReview`, and kept the original path as a compatibility barrel.

### P1：顶层页面分发继续膨胀 / Top-Level Page Dispatch Growth

`src/modules/App.tsx` 每新增页面都要修改恢复逻辑和渲染分支。当前已拆出 `routeRestore.ts`、`routeGuards.ts` 和 `routeRenderers.tsx`，让会话恢复、权限守卫和页面渲染分发分别收口。

`src/modules/App.tsx` grows whenever a new top-level page is added. The current round extracted `routeRestore.ts`, `routeGuards.ts`, and `routeRenderers.tsx`, keeping session restoration, route guards, and page rendering dispatch in focused modules.

### P2：复杂页面容器仍偏大 / Large Page Containers

`TripDetailPage`、`GuideSearchPanel`、`MarkerDetailPanel` 曾超过理想边界。本轮已拆出 `TripDetailHeader`、`TripDetailEditorDialog`、`GuideChecklistGenerationDialog`、`GuidePlanningDialog`、`MarkerLightbox` 和 `MarkerEditActionBar`，后续新增能力继续优先放入领域子组件或 hook。

Several page/container files had exceeded the ideal boundary. This round extracted `TripDetailHeader`, `TripDetailEditorDialog`, `GuideChecklistGenerationDialog`, `GuidePlanningDialog`, `MarkerLightbox`, and `MarkerEditActionBar`; future additions should continue to land in focused domain components or hooks.

### P2：路由测试单体化 / Route Test Monolith

`server/__tests__/appApiRoutes.spec.ts` 已接近大型综合测试。本轮先拆出 `appApiRoutes.mocks.ts` 统一承载 hoisted mocks 与 service mocks，主测试文件聚焦用例；继续新增路由时，建议按 `auth/admin/trips/photos/settings` 等 domain 进一步拆分。

`server/__tests__/appApiRoutes.spec.ts` has become a large integration-style test file. This round extracted `appApiRoutes.mocks.ts` for hoisted mocks and service mocks so the main spec focuses on scenarios; future route tests should be split further by domain.

---

## 3. 优化路线 / Optimization Roadmap

### Phase 1：DTO 边界硬化 / DTO Boundary Hardening

- 拆分 `server/appApi/types.ts` 为 `server/appApi/dto/*`。
- 拆分 `src/lib/api/types.ts` 为 `src/lib/api/dto/*`。
- 保留原 `types.ts` 作为兼容 barrel，不要求现有调用方迁移。
- 补充 barrel 契约测试，确保 API client import 稳定。

Phase 1 splits DTOs by domain while keeping compatibility barrels, so existing imports remain stable.

### Phase 2：Stats 聚合器拆分 / Stats Aggregator Split

- `filters.ts`：筛选与日期维度。
- `rankings.ts`：地区、城市、旅伴、行程和元数据排行。
- `achievements.ts`：账号级、年度和 streak 成就。
- `annualReview.ts`：年度回顾专属照片、攻略、首末记录和 trip highlights。
- `aggregator.ts`：保留为兼容 barrel 或轻量 orchestrator。

Phase 2 decomposes stats aggregation into focused pure modules.

### Phase 3：页面入口与测试拆分 / Page Entrypoint and Test Split

- 将 `App.tsx` 的页面渲染分发表化。
- 为 `TripDetailPage`、`GuideSearchPanel`、`MarkerDetailPanel` 继续抽出容器层和展示层。
- 将 `appApiRoutes.spec.ts` 按 route domain 拆分。
- 补充浏览器冒烟 checklist，覆盖登录、统计、后台、行程详情、影像编辑台和设置页。

Phase 3 reduces top-level UI and test monoliths while improving smoke coverage.

---

## 4. 扩展规则 / Extension Rules

- 新增 API DTO 必须进入对应 `dto/*` 文件，不再直接膨胀 `types.ts`。
- `types.ts` 只作为兼容 barrel。
- 超过约 `500` 行的纯逻辑聚合文件应评估目录化拆分。
- 超过约 `700` 行的页面容器应优先拆 view model、hook 或子组件。
- 新增后台能力继续保持只读治理原则，除非单独设计权限、审计和回滚策略。
- 新增文档必须中英双语对齐，并同步 `CHANGELOG.md`。

- New API DTOs must be added to the relevant `dto/*` file instead of growing `types.ts`.
- `types.ts` should stay as a compatibility barrel.
- Pure aggregation files over roughly `500` lines should be reviewed for directory splitting.
- Page containers over roughly `700` lines should be decomposed into view models, hooks, or subcomponents.
- Admin features must remain read-only unless permissions, auditing, and rollback are explicitly designed.
- New docs must be bilingual and reflected in `CHANGELOG.md`.

---

## 5. 验证策略 / Verification Strategy

首批 DTO 重构完成后至少运行：

- `npm run test -- src/lib/api/__tests__/apiModules.spec.ts src/lib/api/__tests__/httpClient.spec.ts`
- `npm run test -- server/__tests__/apiDtoBarrel.spec.ts src/lib/api/__tests__/apiDtoBarrel.spec.ts`
- `npm run test -- server/__tests__/adminAuditService.spec.ts server/__tests__/adminQualityReport.spec.ts server/__tests__/adminService.spec.ts server/__tests__/appApiRoutes.spec.ts`
- `npm run test -- src/modules/__tests__/AdminPage.spec.tsx src/modules/__tests__/App.spec.tsx`
- `npm run build`

The first DTO refactor should be validated through API-module tests, barrel tests, admin route/UI regression tests, and a full build.
