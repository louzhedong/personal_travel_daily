# 行程集合二期 / Trip Collection Phase Two

本文档记录“行程集合二期”已经落地的产品能力、交互规则、前后端链路和测试覆盖点。它是当前版本的事实说明，不再重复规划阶段的待办清单。  
This document records the shipped scope of trip collection phase two, including product capabilities, interaction rules, frontend-backend flow, and testing coverage. It is a factual description of the current implementation rather than a planning backlog.

---

## 1. 目标与范围 / Goals and Scope

行程集合一期解决的是“行程对象存在”，二期解决的是“行程真正成为可整理、可回看、可轻编辑的内容容器”。  
Phase one established the existence of trip objects. Phase two makes trips into containers that can actually be organized, reviewed, and lightly edited.

当前二期已落地能力包括：  
The currently shipped phase-two capabilities include:

- 在时间线中进入“整理模式”。  
  Entering organization mode from the timeline.
- 多选记录后批量归入某个行程，或移回未归入状态。  
  Batch-assigning selected markers into a trip or moving them back to the unassigned state.
- 时间线支持按行程分组展示。  
  Showing the timeline grouped by trip collections.
- 行程详情页从只读升级为轻编辑。  
  Upgrading the trip-detail page from read-only to lightweight editing.
- 统计中心与年度回顾可钻取到具体行程详情。  
  Allowing the stats center and yearbook pages to drill down into trip detail.

不在本期范围内的内容包括行程内记录拖拽排序、行程封面自动生成策略、多人协作编辑同一行程，以及行程回放专属页面。  
Out of scope for this phase are drag-based marker reordering within a trip, automatic trip-cover generation, multi-user collaborative editing on the same trip, and a dedicated trip replay page.

## 2. UX 总览 / UX Overview

用户当前主要通过两条入口进入行程集合能力：首页时间线侧栏，以及统计中心和年度回顾的钻取路径。  
Users currently enter the trip-collection feature through two main entry points: the homepage timeline sidebar and the drill-down flows from stats and yearbook pages.

时间线面板是行程整理主入口，支持查看当前旅伴记录、按年份筛选、按国内/国际范围筛选、在有行程时切换为按行程分组视图，并进入整理模式批量调整归属。  
The timeline panel is the main organization console. It supports viewing the current companion's records, filtering by year, filtering by domestic/international scope, switching into trip-grouped view when trips exist, and entering organization mode for batch assignment.

统计中心 `/stats` 和年度回顾 `/yearbook/:year` 可以钻取到 `/trips/:id`。这两个入口的分工很明确：时间线负责整理，行程详情负责回看与轻编辑。  
The stats center at `/stats` and the yearbook page at `/yearbook/:year` both drill into `/trips/:id`. Their responsibilities are intentionally separated: the timeline handles organization, while trip detail handles review and lightweight editing.

## 3. 时间线双分支与共享选择态 / Dual Timeline Branches with Shared Selection State

`TripTimelinePanel` 当前内部存在两个渲染分支：普通时间线，以及按 Trip Collection 分组的时间线。未归入记录会被收口到“未归入行程”。  
`TripTimelinePanel` currently renders through two branches: the plain date-grouped timeline and the trip-grouped timeline. Unassigned markers are collected under an “unassigned trip” bucket.

二期的关键设计点是：两个分支共享同一套整理状态，而不是各自维护一套。共享状态包括 `selectionMode`、`selectedMarkerIds` 和 `batchTripTarget`。  
A key phase-two design decision is that both branches share the same organization state instead of maintaining separate implementations. The shared state includes `selectionMode`, `selectedMarkerIds`, and `batchTripTarget`.

这意味着无论用户当前看到的是普通时间线还是行程分组时间线，点击记录都会进入同一条“选择 -> 统计已选 -> 选择目标行程 -> 应用批量整理”的流程。此前普通时间线分支缺少这层接入，导致整理模式在该分支下看起来不可用，这个问题现在已经修复。  
This means that whether the user is looking at the plain timeline or the trip-grouped timeline, clicking markers enters the same flow of select -> count selected -> choose target trip -> apply batch organization. The plain timeline branch previously missed this integration and made organization mode appear broken there; that regression is now fixed.

## 4. 批量整理流程 / Batch Organization Flow

当前批量整理流程如下：用户点击“整理模式”，面板进入选择态，普通点击记录不再打开详情，而是切换选中状态。顶部工具条显示已选数量并允许选择目标行程，随后前端调用 `PATCH /api/markers/batch-trip`，服务端在单事务内完成校验和更新，再返回最新整包 `TravelStore`。  
The current batch-organization flow works as follows: the user enters organization mode, the panel switches into selection state, normal clicks stop opening detail and instead toggle selection, the toolbar shows the selected count and target-trip chooser, then the frontend calls `PATCH /api/markers/batch-trip`, the backend performs validation and updates in one transaction, and finally returns a fresh full `TravelStore` snapshot.

这个流程强调三点：选择态必须显式可见；批量入口要收口在时间线工具条；完成后以前端整包 store 刷新为准，而不是依赖本地猜测更新。  
This flow emphasizes three things: selection state must be visually explicit, the batch action entry must stay inside the timeline toolbar, and completion should refresh from a server-returned full store instead of relying on optimistic local guesses.

## 5. 已选记录 Tooltip 与滚动规则 / Selected Records Tooltip and Overflow Rule

整理模式下，头部会展示“已选 X 条记录”，并通过 tooltip 逐条展示已选内容。每条记录显示地点和日期，长文本会被截断。  
In organization mode, the header shows “X selected records” and exposes a tooltip that lists selected items one by one. Each item shows location and date, and long text is truncated.

当记录数超过 5 条时，tooltip 会切换成固定高度并开启内部滚动，同时继续遵循项目“隐藏滚动条”的视觉约定。  
When the selected count exceeds five, the tooltip switches to a fixed-height scrollable container while still respecting the project's hidden-scrollbar visual convention.

这个规则来自真实交互问题：如果 tooltip 随记录数无限增长，会直接破坏时间线头部区域的阅读和遮挡关系，因此必须在超过 5 条时收口。  
This rule comes from a real interaction problem: if the tooltip keeps growing with the number of selected markers, it breaks readability and overlap behavior around the timeline header, so it must be constrained once the selection exceeds five.

## 6. `PATCH /api/markers/batch-trip` 接口 / Batch Trip Assignment API

二期新增的关键接口是 `PATCH /api/markers/batch-trip`。它既支持把 `markerIds` 批量归入某个 `tripId`，也支持把 `tripId` 设为 `null` 以移回未归入状态。  
The key phase-two API is `PATCH /api/markers/batch-trip`. It supports both assigning `markerIds` into a `tripId` and setting `tripId` to `null` to move them back to the unassigned state.

当前约束包括：`markerIds` 必填且数量在 1 到 100 之间，服务端会去重，所有 marker 必须属于当前登录账号且未软删除，若传入 `tripId` 则必须是当前账号下的有效行程，整个操作在单事务内完成，成功后返回最新整包 `TravelStore`。  
Current constraints include: `markerIds` is required and must contain between 1 and 100 items, the backend deduplicates them, all markers must belong to the current account and not be soft-deleted, any provided `tripId` must be a valid trip for the current account, the operation runs in one transaction, and success returns the latest full `TravelStore`.

后端还特别约束了路由顺序：`/api/markers/batch-trip` 必须先于 `/api/markers/:id` 注册，否则静态路径会被动态路由吞掉。  
The backend also enforces route ordering: `/api/markers/batch-trip` must be registered before `/api/markers/:id`, otherwise the static path would be swallowed by the dynamic route.

## 7. 行程详情页轻编辑 / Lightweight Trip Detail Editing

二期中，`/trips/:id` 不再只是统计中心的只读落点，而是升级为轻编辑详情页。当前支持编辑行程名称、开始日期、结束日期、备注和封面图 URL。  
In phase two, `/trips/:id` is no longer just a read-only drill-down target from the stats center. It has been upgraded into a lightweight editing page that supports editing the trip name, start date, end date, note, and cover image URL.

页面仍然保持“轻编辑”而非“重管理台”定位：主视图以回看为主，编辑通过 `Dialog` 弹层完成，删除行程也仍然经过确认交互保护。  
The page still keeps a lightweight-editing position rather than becoming a full management console: the main view stays review-first, editing happens through `Dialog` overlays, and trip deletion remains guarded by confirmation flows.

## 8. 前后端协作方式 / Frontend and Backend Collaboration

二期在前后端之间采用的是“整包快照回填”模式，而不是“局部 optimistic merge”模式：前端时间线发起批量归属请求，后端更新数据库后重新构建当前 `TravelStore`，前端再直接以服务端返回结果替换本地 store。  
Phase two uses a full-snapshot refresh model between frontend and backend rather than a partial optimistic-merge model: the frontend timeline sends the batch assignment request, the backend updates the database and rebuilds the current `TravelStore`, and the frontend replaces its local store with the server-returned result.

这套方式特别适合本期，因为批量归属会同时影响时间线分组、行程详情聚合、统计中心 trip ranking / trip detail，以及记录详情里的所属行程信息。如果只做局部补丁更新，很容易漏掉某一处派生数据。  
This approach fits the phase especially well because batch assignment affects timeline grouping, trip-detail aggregation, trip rankings and drill-downs in the stats center, and trip ownership shown inside marker detail. A local patch-only update would easily miss one of those derived views.

## 9. 测试覆盖点 / Test Coverage

当前与行程集合二期直接相关的测试主要分布在 `TripTimelinePanel.spec.tsx`、`TripDetailPage.spec.tsx`、`App.spec.tsx`、`apiModules.spec.ts`、`appApiRoutes.spec.ts` 与 `tripDetailService.spec.ts`。  
The tests most directly related to trip collection phase two are located in `TripTimelinePanel.spec.tsx`, `TripDetailPage.spec.tsx`, `App.spec.tsx`, `apiModules.spec.ts`, `appApiRoutes.spec.ts`, and `tripDetailService.spec.ts`.

这些测试重点覆盖：普通时间线分支与行程分组分支的整理模式行为、`PATCH /api/markers/batch-trip` 的前后端链路、tooltip 展示与选择态回归、行程详情页加载/编辑/删除、以及从统计中心进入详情页的跳转链路。  
These tests focus on organization-mode behavior in both the plain and trip-grouped timeline branches, the full frontend-backend chain of `PATCH /api/markers/batch-trip`, tooltip display and selection-state regressions, trip-detail loading/editing/deletion, and the drill-down path from the stats center into trip detail.

其中最重要的回归点是：普通时间线分支也必须能多选整理，这一条直接对应本期修复的问题。  
The most important regression point is that the plain timeline branch must also support multi-select organization, which directly maps to the issue fixed in this phase.

## 10. 当前边界 / Current Boundaries

虽然二期已经闭环，但当前仍有明确边界：行程内记录顺序仍由日期排序驱动，不支持人工重排；批量归属只处理 `tripId`，不处理其他记录字段；行程详情页的编辑范围仍限定在元数据，不直接编辑记录列表；tooltip 只做展示，不承担批量编辑入口。  
Although phase two is functionally closed, it still has explicit boundaries: marker order inside a trip remains date-driven instead of manually reorderable, batch assignment only updates `tripId` rather than other marker fields, trip-detail editing is still limited to metadata instead of editing the marker list directly, and the tooltip remains display-only rather than acting as a batch-edit entry.

这些边界让时间线和详情页的职责保持清楚，避免再次回到“一个页面处理全部任务”的大组件形态。  
These boundaries keep the responsibilities of the timeline and detail page clear and avoid returning to a monolithic page that tries to handle everything.
