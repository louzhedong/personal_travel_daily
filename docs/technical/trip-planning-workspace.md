# 行前规划工作台 / Trip Planning Workspace

这份文档记录 Trip-bound 行前规划工作台的产品范围、数据模型、接口、前端入口、后台只读巡检和测试边界。它的目标是把“旅行发生后整理”前移到“出发前规划”，并和全局愿望地图形成“长期想去 -> 某次行程计划 -> 旅行记录”的轻量闭环。

This document records phase one of the trip-bound planning workspace: product scope, data model, APIs, frontend entry points, admin read-only inspection, and test boundaries. The goal is to move part of the product from post-trip organization into pre-trip planning while keeping the first phase lightweight.

## 目标与范围 / Goals and Scope

- 一期目标：在某个已存在行程内管理“想去地点 / 想做事项”，并在旅行后转成正式旅行记录。
- 已覆盖：规划项 CRUD、优先级、预计日期、攻略来源、从愿望地图导入、转记录、行程详情内 Tab、攻略搜索加入规划、后台只读巡检。
- 暂不覆盖：独立规划页、第三方地理编码、按天排班、多人协作、后台代用户编辑。

- Phase-one goal: manage desired places or planned actions inside an existing trip, then convert them into visit markers after the trip.
- Current scope: planning-item CRUD, priority, planned date, guide source metadata, wishlist import, conversion to marker, trip-detail tab, guide-search entry, and admin read-only inspection.
- Out of scope: standalone planning page, third-party geocoding, day scheduling, collaboration, and admin-side mutation.

## 数据模型 / Data Model

新增 `TripPlanningItem`，绑定 `accountId + tripId + createdByCompanionId`，并以 MySQL / Prisma 为单一事实源。

`TripPlanningItem` is a new trip-bound model owned by `accountId + tripId + createdByCompanionId`, with MySQL / Prisma as the source of truth.

核心字段：

- 地点：`scope`、`scopeId`、`scopeName`、`city`
- 内容：`title`、`note`
- 规划：`priority: low | medium | high`、`plannedDate`
- 状态：`status: planned | converted`、`convertedMarkerId`
- 来源攻略：`sourceGuideIdentity`、`sourceGuideTitle`、`sourceGuideSourceName`、`sourceGuideSourceUrl`
- 来源愿望：`sourceWishlistId`
- 排序与生命周期：`sortOrder`、`isDeleted`、`createdAt`、`updatedAt`、`deletedAt`

The model stores destination identity, title/note, priority, planned date, conversion state, guide-source metadata, optional wishlist source, sort order, and soft-delete lifecycle fields.

## 接口 / APIs

规划项接口全部挂在 trip 子资源下，继承当前登录账号权限：

All planning APIs are trip subresources and inherit authenticated account ownership checks:

- `GET /api/trips/:id/planning`：返回规划摘要与规划项列表。
- `POST /api/trips/:id/planning/items`：新增规划项。
- `PATCH /api/trips/:id/planning/items/:itemId`：更新未转换规划项。
- `DELETE /api/trips/:id/planning/items/:itemId`：软删除规划项。
- `POST /api/trips/:id/planning/from-wishlist/:wishlistId`：从愿望地图复制生成规划项。
- `POST /api/trips/:id/planning/items/:itemId/convert-to-marker`：把规划项转为正式旅行记录。

`GET /api/trips/:id/detail` 只增加轻量 `planningSummary`，完整规划列表仍由专用 planning API 拉取，避免详情聚合继续变厚。

`GET /api/trips/:id/detail` only includes a lightweight `planningSummary`; full planning items are loaded through the dedicated planning API.

## 转记录规则 / Conversion Rules

转记录时，服务端基于规划项创建 `VisitMarker`：

- 使用规划项的 `scope / scopeId / scopeName / city / createdByCompanionId / tripId`。
- 请求必须提供 `visitedStartAt / visitedEndAt`，且结束日期不能早于开始日期。
- marker `note` 优先使用转换请求中的备注，其次使用规划项备注，最后回退到规划项标题。
- 转换成功后写入 `convertedMarkerId` 并把 `status` 改为 `converted`。
- 已转换规划项不能再次转换，也不能继续编辑。

The conversion endpoint creates a `VisitMarker` from the planning item, requires a valid visited date range, writes `convertedMarkerId`, marks the item as `converted`, and prevents duplicate conversion or later editing.

## 前端入口 / Frontend Entry Points

- `/trips/:id` 行程详情页新增 `概览 / 行前规划 / 记录 / 素材` Tab。
- `规划` Tab 内使用 `TripPlanningBoard`，支持新增、编辑备注、删除、按优先级筛选和转记录。
- `规划` Tab 顶部固定展示“愿望地图导入”，即使愿望池为空也显示空态，避免入口不可见。
- 攻略搜索结果新增“加入行程规划”，用户选择目标行程并确认地区、编码、城市和预计日期后创建规划项。
- “加入行程规划”和“生成行前清单”并存：前者沉淀想去地点，后者沉淀准备事项。

- `/trips/:id` now has `Overview / Planning / Records / Assets` tabs.
- The `Planning` tab uses `TripPlanningBoard` for create, note edit, delete, priority filtering, wishlist import, and conversion.
- Guide search results can be added to trip planning after choosing a trip and confirming destination fields.
- Planning and guide-to-checklist remain separate: planning captures desired places, checklist captures preparation tasks.

## 后台只读巡检 / Admin Read-Only Inspection

管理员后台保持只读定位：

- `GET /api/admin/overview` 聚合每个同行人的 `planningItems`。
- 账号统计增加 `planningItemCount` 和 `convertedPlanningItemCount`。
- `/admin` 增加“行前规划”Tab，展示行程、同行人、目的地、优先级、预计日期、状态、来源攻略和创建时间。
- 后台不提供新增、编辑、删除或转记录能力，避免引入后台写权限和审计复杂度。

The admin backoffice remains read-only. It aggregates planning items, exposes planning counters, and adds a planning tab without mutation capabilities.

## Story Studio 导出关联 / Story Studio Export Relationship

旅行故事页已升级为 Story Studio，继续复用行程详情聚合数据，不新增 story 专用接口或持久化。导出能力保持前端 SVG 生成：

- SVG 高度根据摘要、路线、时间线、照片、攻略和清单内容动态增长。
- 长图会包含故事徽章与路线回放海报；路线回放海报是静态行程表达，不依赖地图截图。
- 额外支持方形 / 竖版分享卡导出，使用同一份封面、指标和智能序言模型。
- 照片段落会输出真实 `<image href="...">`，并用 `clipPath` 裁切为卡片。
- 若图片源禁止外链、需要登录或本地 SVG 查看器不加载网络图片，图片可能仍无法显示；这是外链图片加载限制，不是导出内容缺失。
- 不把图片转为 base64 内嵌，避免跨域污染和大文件膨胀。

Trip Story has evolved into Story Studio. Long-image and share-card exports are still generated in the frontend as SVG with real image references and without base64 inlining, so external image loading still depends on the image host and SVG viewer.

## 验证 / Validation

已覆盖的重点：

- App API routes 覆盖 planning 列表、创建、更新、删除和转记录路由。
- `tripDetailService` 覆盖详情聚合在缺少 planning mock 时仍稳定回退。
- `TripDetailPage`、`GuideSearchPanel`、`AdminPage` 回归测试保持通过。
- `TripStoryPage` 覆盖重型照片导出、故事徽章、路线回放海报、明信片模板与方形 / 竖版分享卡导出。

Validated areas include planning API routes, trip-detail aggregation, TripDetail / GuideSearch / Admin UI regressions, and Story Studio SVG export coverage.
