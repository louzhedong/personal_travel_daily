# 前端架构 / Frontend Architecture

本文档描述当前前端的真实落地结构，重点回答三个问题：`App` 如何路由，`TravelApp` 如何作为容器编排首页，复杂大组件如何拆成更稳定的子域模块。文档只记录已经存在于仓库中的结构，不描述未落地方案。  
This document describes the frontend architecture as it exists today, focusing on how `App` routes, how `TravelApp` orchestrates the homepage, and how large components were split into more stable domain modules. It only records structures that already exist in the repository.

---

## 1. 设计目标 / Design Goals

当前前端重构的核心目标不是“追求框架感”，而是把原本集中在少数大文件里的职责拆开，让每个模块只处理一层问题。  
The goal of this frontend refactor is not to make the code feel more framework-heavy, but to break responsibilities out of a few oversized files so each module solves one layer of the problem.

- 路由层只处理 URL、页面切换和会话恢复。  
  The routing layer only handles URLs, page switching, and session restoration.
- 容器层只处理状态编排、跨模块联动和页面入口。  
  The container layer only handles state orchestration, cross-module coordination, and page entry composition.
- 组件层只处理单个能力域的渲染与交互。  
  The component layer only handles rendering and interactions inside one capability domain.
- 展示模型、纯函数、领域 hook 尽量从组件体内抽离，降低无限渲染、重复派生和交叉依赖风险。  
  View models, pure helpers, and domain hooks are extracted out of component bodies whenever possible to reduce infinite rerenders, repeated derivation, and cross-dependency risk.

这次架构刷新后，前端可以按 `routes -> modules -> components -> lib -> styles` 理解，而不需要再从单个超大组件中反推职责边界。  
After this refresh, the frontend can be understood as `routes -> modules -> components -> lib -> styles` instead of reverse-engineering boundaries from a single oversized component.

## 2. App 与 Router / App and Router

`src/modules/App.tsx` 现在只保留“顶层页面切换 + 会话恢复 + 路由守卫”职责，不再直接读写 `window.history`。手写路由的单一事实源集中在 `src/modules/app/router.ts`。  
`src/modules/App.tsx` now keeps only top-level page switching, session restoration, and route guarding responsibilities. It no longer reads or writes `window.history` directly, because the hand-written routing source of truth now lives in `src/modules/app/router.ts`.

- `AppRoute` 联合类型枚举当前所有顶层路由：`/`、`/login`、`/register`、`/admin`、`/stats`、`/trips/:id`、`/trips/:id/story`、`/trips/:id/checklist`、`/yearbook/:year`。
  `AppRoute` enumerates all top-level routes: `/`, `/login`, `/register`, `/admin`, `/stats`, `/trips/:id`, `/trips/:id/story`, `/trips/:id/checklist`, and `/yearbook/:year`.
- `createHomeRoute()`、`createTripDetailRoute()` 等工厂函数负责统一构造路由对象。  
  Factory helpers such as `createHomeRoute()` and `createTripDetailRoute()` create route objects consistently.
- `parsePathname()` 负责把浏览器 URL 解析成内部路由状态。  
  `parsePathname()` converts a browser URL into internal route state.
- `useAppRouter()` 负责把 `pushState`、`replaceState`、`popstate` 监听包装成 React 可消费的 API。  
  `useAppRouter()` wraps `pushState`, `replaceState`, and `popstate` handling into a React-friendly API.

`App.tsx` 通过 `fetchSession()` 恢复登录态，然后根据 `route.kind` 和 `account.role` 分发到 `AuthPage`、`TravelApp`、`AdminPage`、`StatsPage`、`TripDetailPage`、`TripStoryPage`、`TripChecklistPage`、`AnnualReviewPage`。
`App.tsx` restores the current session through `fetchSession()` and then dispatches to `AuthPage`, `TravelApp`, `AdminPage`, `StatsPage`, `TripDetailPage`, `TripStoryPage`, `TripChecklistPage`, or `AnnualReviewPage` based on `route.kind` and `account.role`.

这样做之后，新增页面时只需要先扩展 `router.ts`，再在 `App.tsx` 增加一个页面分支即可，顶层状态机不再散落在多个文件。  
With this structure, adding a new page now means extending `router.ts` first and then adding one rendering branch in `App.tsx`, instead of scattering the top-level state machine across multiple files.

## 3. TravelApp 容器 / TravelApp Container

`src/modules/TravelApp.tsx` 是首页应用壳，负责把“远端主数据 + 地图上下文 + 弹层状态 + 首页分区”拼成一个完整体验，但它已经不再承担所有细节渲染。  
`src/modules/TravelApp.tsx` is the homepage application shell. It composes remote store data, map context, overlay state, and homepage sections into one experience, but no longer owns every rendering detail.

当前 `TravelApp` 主要保留四类职责：  
At the moment, `TravelApp` keeps four main responsibilities:

- 初始化 `TravelStore`，并通过 `remoteTravelStoreRepository` 对接后端主数据。  
  Initialize `TravelStore` and sync it with backend source-of-truth data through `remoteTravelStoreRepository`.
- 维护首页级 UI 状态，例如当前详情记录、攻略搜索开关、数据备份弹窗、待删除记录、顶部提示文案。  
  Maintain homepage-level UI state such as the active detail marker, guide search visibility, backup modal visibility, pending deletions, and top-level status messages.
- 组合 `useMapContext()`、`useTravelStoreActions()`、`useLockedModal()` 等 hook，统一调度跨模块状态。  
  Compose hooks like `useMapContext()`, `useTravelStoreActions()`, and `useLockedModal()` to coordinate cross-module state.
- 将页面渲染拆交给 `AppHero`、`StatsPanel`、`AppContent`、`AppOverlays`。  
  Delegate page rendering to `AppHero`, `StatsPanel`, `AppContent`, and `AppOverlays`.

这意味着 `TravelApp` 是“编排层容器”，而不是新的大而全组件。它知道谁和谁要联动，但不再拥有每一个面板的实现细节。  
This means `TravelApp` is an orchestration container rather than a new all-in-one component. It knows which domains need to coordinate, but no longer embeds the implementation details of every panel.

## 4. AppContent 与 AppOverlays / Page Composition Layers

首页内容被明确拆成两个组合层。  
The homepage composition is explicitly split into two layers.

### 4.1 `AppContent`

`src/modules/app/AppContent.tsx` 负责首页常驻主视图布局，组织 `TravelMap`、`MarkerList`、`UserManager`、`TripTimelinePanel` 与 `SavedGuidesPanel`。它主要做 props 编排与布局，不承担复杂派生计算。  
`src/modules/app/AppContent.tsx` owns the persistent homepage layout, arranging `TravelMap`, `MarkerList`, `UserManager`, `TripTimelinePanel`, and `SavedGuidesPanel`. It mainly handles props composition and layout instead of heavy derived logic.

### 4.2 `AppOverlays`

`src/modules/app/AppOverlays.tsx` 负责所有浮层与弹出式交互，包括 `MarkerForm`、`DataSync`、`MarkerDetailPanel` 与 `GuideSearchPanel`。  
`src/modules/app/AppOverlays.tsx` owns all overlay and popup interactions, including `MarkerForm`, `DataSync`, `MarkerDetailPanel`, and `GuideSearchPanel`.

这种拆分把“页面常驻区域”和“浮层状态域”分开，减少首页 JSX 深度，也避免某个弹层逻辑污染主内容结构。  
This split separates persistent page structure from overlay state, reducing homepage JSX depth and preventing drawer or dialog logic from polluting the main content tree.

## 5. 地图能力拆分 / TravelMap Domain Split

`src/components/TravelMap.tsx` 现在明确定位为地图容器，只保留状态与 effect 编排。地图渲染和专门交互已经拆到 `src/components/map/`。  
`src/components/TravelMap.tsx` is now explicitly the map container and keeps only state and effect orchestration. Map rendering and specialized interactions have been moved into `src/components/map/`.

- `MapChrome.tsx`：标题、选择态、图例、顶部说明等壳层 UI。  
  `MapChrome.tsx`: shell UI such as headings, selection state, legend, and top-level explanation.
- `MapRegionLayer.tsx`：区域 path、标签等基础底图渲染。  
  `MapRegionLayer.tsx`: base map region paths and labels.
- `MapJourneyLayer.tsx`：旅途轨迹与 tooltip portal。  
  `MapJourneyLayer.tsx`: journey arcs and tooltip portals.
- `MapReplayLayer.tsx`：地图回放相关渲染层。  
  `MapReplayLayer.tsx`: replay-specific render layers.
- `ReplayControlBar.tsx`：回放控制条。  
  `ReplayControlBar.tsx`: replay control bar.
- `useMapHover.ts`、`useMapViewBox.ts`、`useMapReplayController.ts`、`regionStyles.ts`：hover、缩放、回放和样式决策。  
  `useMapHover.ts`, `useMapViewBox.ts`, `useMapReplayController.ts`, and `regionStyles.ts`: hover, zoom, replay, and style-decision helpers.

因此 `TravelMap.tsx` 更像“地图场景导演”，负责把 geo 数据、marker 聚合、journey arc、hover 与 replay 串起来，而不是直接内嵌所有 SVG 细节。  
As a result, `TravelMap.tsx` behaves more like a map-scene director that coordinates geo data, marker aggregation, journey arcs, hover behavior, and replay state instead of inlining every SVG detail.

## 6. GuideSearchPanel 拆分 / Guide Search Split

`src/components/GuideSearchPanel.tsx` 仍然是攻略搜索的对外入口，但已经从“单文件包办搜索 + 列表 + 正文 + 锁滚动”转成容器模式。  
`src/components/GuideSearchPanel.tsx` remains the public entry for guide search, but it has shifted from a one-file implementation into a container pattern.

- `GuideSearchInputBar.tsx`：搜索框、范围切换、历史与触发入口。  
  `GuideSearchInputBar.tsx`: query input, scope switching, search history, and trigger entry.
- `GuideSearchResultList.tsx`：结果列表、收藏/关联操作区。  
  `GuideSearchResultList.tsx`: result list plus save/attach actions.
- `GuideDocumentDrawer.tsx`：正文抽屉、摘要/原文切换。  
  `GuideDocumentDrawer.tsx`: document drawer and summary/original-content views.
- `useGuideSearchLayoutLock.ts`：嵌套滚动与布局锁定。  
  `useGuideSearchLayoutLock.ts`: nested-scroll and layout-lock handling.

容器文件自身继续负责搜索请求、正文请求、搜索历史同步、高亮派生以及面板挂载/卸载动画。  
The container file itself still owns search requests, document loading, search-history syncing, highlight derivation, and panel mount/unmount behavior.

## 7. TripTimelinePanel 拆分 / Trip Timeline Split

`src/components/TripTimelinePanel.tsx` 已从“大型时间线组件”收口为“筛选与分组容器 + 若干子组件”。  
`src/components/TripTimelinePanel.tsx` has been reduced from a large monolithic timeline component into a filter-and-group container with focused subcomponents.

- `TimelineList.tsx`：普通时间线分支。  
  `TimelineList.tsx`: the plain date-grouped timeline branch.
- `TripGroupList.tsx`：按行程分组分支。  
  `TripGroupList.tsx`: the trip-grouped timeline branch.
- `TripBatchToolbar.tsx`：整理模式工具条。  
  `TripBatchToolbar.tsx`: the organization-mode toolbar.
- `TimelineToolbar.tsx`、`TimelineMarkerButton.tsx`：筛选栏与记录项交互单元。  
  `TimelineToolbar.tsx` and `TimelineMarkerButton.tsx`: filtering and marker-item interaction units.
- `TripEditorDialog.tsx`：新增/编辑行程弹窗。  
  `TripEditorDialog.tsx`: create/edit trip dialog.
- `useTripTimelineActions.ts`：对话框、整理模式、批量选择、目标行程等 UI 状态。  
  `useTripTimelineActions.ts`: dialog state, organization mode, batch selection, and target-trip state.

当前实现保留普通时间线与行程分组时间线两个分支，但两条分支共享同一套 `selectionMode`、`selectedMarkerIds` 与 `batchTripTarget` 状态，因此整理模式不再只在某一个分支可用。  
The implementation still keeps both the plain timeline and the trip-grouped timeline branches, but both branches share the same `selectionMode`, `selectedMarkerIds`, and `batchTripTarget` state so organization mode works consistently across them.

## 8. TripStoryPage 与 Story Studio / TripStoryPage and Story Studio

`src/modules/trips/TripStoryPage.tsx` 是登录态私有故事页容器，继续复用 `GET /api/trips/:id/detail`，不拥有独立持久化或公开分享状态。页面自身只处理加载、模板切换、打印和导出按钮。
`src/modules/trips/TripStoryPage.tsx` is the private authenticated story-page container. It still reuses `GET /api/trips/:id/detail` and does not own standalone persistence or public sharing state. The page itself handles loading, template switching, printing, and export actions.

`src/modules/capsules/MemoryCapsuleCenterPage.tsx` 与 `MemoryCapsuleDetailPage.tsx` 承接新的旅行胶囊中心和详情编辑台。它们通过 `memoryCapsulesApi.ts` 读取持久化配置与实时派生内容，页面只负责预览、编辑、保存和本地导出，不处理公开分享权限。

`src/modules/capsules/MemoryCapsuleCenterPage.tsx` and `MemoryCapsuleDetailPage.tsx` own the new capsule center and detail editing desk. They read saved configuration plus derived content through `memoryCapsulesApi.ts`; the pages only handle previewing, editing, saving, and local exports, not public sharing permissions.

- `tripStoryPageModel.ts`：从 `TripDetailResponseDto` 纯函数派生故事摘要、精选照片、时间线、路线停靠点、故事徽章、路线回放海报和分享卡模型。
  `tripStoryPageModel.ts`: derives story summaries, featured photos, timeline sections, route stops, story badges, the route replay poster, and share-card models from `TripDetailResponseDto`.
- `tripStoryExport.ts`：集中生成 SVG 长图、方形分享卡和竖版分享卡，并触发浏览器下载；不截图、不内联远程图片。
  `tripStoryExport.ts`: builds the SVG long image, square share card, and vertical share card, then triggers browser downloads; it does not screenshot or inline remote images.
- `trip-story.css`：承接杂志风、纪念册和明信片模板，以及故事徽章、路线回放海报、分享卡相关响应式布局。
  `trip-story.css`: owns the magazine, memoir, and postcard templates plus responsive layout for story badges, the route replay poster, and share-card-oriented controls.

这个拆分让 Story Studio 的表达逻辑留在模型和导出 helper 中，避免重新把大段 SVG 拼接和派生规则塞回 React 组件体。
This split keeps Story Studio composition logic in the model and export helper, avoiding a return of large SVG-building and derivation rules inside the React component body.

## 9. AdminPage 拆分 / Admin Page Split

`src/modules/admin/AdminPage.tsx` 现在主要保留“加载数据 + 选择账号 + 切换 tab + 布局壳层”职责，数据整形与局部展示已经拆到 `adminPageModel.ts`、`components/admin/AdminFiltersBar.tsx`、`components/admin/AdminOverviewCards.tsx` 与 `components/admin/AdminRankingTable.tsx`。  
`src/modules/admin/AdminPage.tsx` now mainly keeps loading, account selection, tab switching, and shell layout responsibilities, while data shaping and section rendering are split into `adminPageModel.ts`, `components/admin/AdminFiltersBar.tsx`, `components/admin/AdminOverviewCards.tsx`, and `components/admin/AdminRankingTable.tsx`.

这样做之后，后台页继续保持只读聚合页定位，未来扩展更多筛选或巡检能力时也不需要把逻辑重新塞回 `AdminPage.tsx`。  
This keeps the admin page positioned as a read-only aggregation surface and avoids pushing future inspection or filtering logic back into `AdminPage.tsx`.

## 10. Actions Hooks 分层 / Layered Action Hooks

`src/modules/app/useTravelStoreActions.ts` 不再直接承载所有写操作实现，而是改成一个领域聚合入口。  
`src/modules/app/useTravelStoreActions.ts` no longer contains every write operation directly and now acts as a domain-level aggregation entry.

- `useCompanionActions.ts`  
  `useCompanionActions.ts`
- `useTripActions.ts`  
  `useTripActions.ts`
- `useMarkerActions.ts`  
  `useMarkerActions.ts`
- `useGuideActions.ts`  
  `useGuideActions.ts`

`useTravelStoreActions()` 只负责把四个 hook 的返回值汇总给 `TravelApp` 使用，这让旅伴、行程、记录、攻略四个能力域的写操作边界更清晰，也更容易单独排查副作用。  
`useTravelStoreActions()` now only aggregates the return values of those four hooks for `TravelApp`, which makes companion, trip, marker, and guide write flows easier to isolate and reason about.

## 11. 样式组织约定 / Styling Conventions

前端样式入口是 `src/styles/index.css`，当前采用“基础骨架 + 页面 barrel + 功能域 barrel + 响应式收口”的组织方式。  
The frontend styling entry is `src/styles/index.css`, and it now follows a structure of base skeleton styles, page barrels, feature barrels, and a responsive closing layer.

- 基础骨架：`base.css`、`layout.css`。  
  Base skeleton: `base.css` and `layout.css`.
- 页面 barrel：`pages/index.css` 统一引入 `auth`、`admin`、`home`、`stats-center`、`trip-detail`、`trip-story`、`annual-review`；`trip-story.css` 覆盖 Story Studio 的三模板、故事徽章和路线回放海报。
  Page barrel: `pages/index.css` imports `auth`, `admin`, `home`, `stats-center`, `trip-detail`, `trip-story`, and `annual-review`.
- 功能域 barrel：`features/index.css` 统一引入 `timeline`、`guide-search`、`map`、`marker-list`、`marker-detail`、`data-sync`、`dialog`、`forms`、`sidebar-panels`。  
  Feature barrel: `features/index.css` imports `timeline`, `guide-search`, `map`, `marker-list`, `marker-detail`, `data-sync`, `dialog`, `forms`, and `sidebar-panels`.
- 统计中心进一步拆到 `stats-center/{layout,filters,summary,heatmap}.css`，并通过 `stats-center/index.css` 收口。  
  The stats center is further split into `stats-center/{layout,filters,summary,heatmap}.css` and re-collected through `stats-center/index.css`.
- 成就卡片、成就详情弹窗和年度成就样式分别归属 `stats-center/summary.css` 与 `annual-review.css`；通用弹窗滚动锁和滚动穿透控制归属 `components/dialog.css`。
  Achievement cards, achievement-detail dialogs, and annual-achievement styling live in `stats-center/summary.css` and `annual-review.css`; shared dialog scroll locking and overscroll containment live in `components/dialog.css`.
- 响应式规则统一收口在 `responsive.css`。  
  Responsive rules are centralized in `responsive.css`.

这种结构让页面壳层和功能域样式的归属更稳定，同时保留旧文件作为兼容入口，避免一轮重构里大面积改 TS/TSX import。  
This structure makes ownership clearer between page-shell and feature-domain styles while preserving old files as compatibility entry points so the refactor does not require broad TS/TSX import rewrites.

## 12. 扩展规则 / Extension Rules

按照当前结构，后续新增前端能力时建议遵循以下规则。  
Under the current structure, future frontend work should follow these rules.

- 新增或变更 API DTO 时，优先进入 `src/lib/api/dto/*` 对应领域文件；`src/lib/api/types.ts` 只保留兼容 barrel 和错误码 re-export。
  Add or update API DTOs in the matching `src/lib/api/dto/*` domain file; `src/lib/api/types.ts` should stay as a compatibility barrel plus error-code re-export.
- 新顶层页面先改 `router.ts`，再改 `App.tsx`，不要在业务组件里直接拼路径判断。  
  Extend `router.ts` first and then `App.tsx` for any new top-level page instead of embedding route checks inside business components.
- 首页新面板优先挂到 `AppContent` 或 `AppOverlays`，不要继续膨胀 `TravelApp.tsx`。  
  Add new homepage panels through `AppContent` or `AppOverlays` instead of growing `TravelApp.tsx` again.
- 复杂组件优先拆成“容器 + 子组件 + hook + model”四层，而不是继续堆条件分支。  
  Prefer splitting complex UI into container, subcomponents, hooks, and models rather than adding more conditional branches to one file.
- 超过约 `700` 行的页面容器应优先评估拆分，不再默认接受继续追加 JSX 和局部状态。
  Page containers above roughly `700` lines should be reviewed for decomposition instead of accepting more JSX and local state by default.
- 跨模块共享的纯逻辑优先放 `lib/` 或 `modules/*Model`，不要塞回 JSX 文件。  
  Shared pure logic should live in `lib/` or `modules/*Model` rather than being pushed back into JSX files.

这些规则的目的，是维持这次重构带来的边界清晰度，避免大组件回潮。  
The purpose of these rules is to preserve the clarity gained from this refactor and prevent a return to oversized components.
