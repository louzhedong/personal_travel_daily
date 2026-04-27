# 前端架构 / Frontend Architecture

本文档描述当前前端的真实落地结构，重点回答三个问题：`App` 如何路由，`TravelApp` 如何作为容器编排首页，复杂大组件如何拆成更稳定的子域模块。文档只记录已经存在于仓库中的结构，不描述未落地方案。

This document describes the frontend architecture as it exists today, focusing on routing, homepage orchestration, and how large components were split into smaller domain modules.

---

## 1. 设计目标 / Design Goals

当前前端重构的核心目标不是“追求框架感”，而是把原本集中在少数大文件里的职责拆开，让每个模块只处理一层问题：

- 路由层只处理 URL、页面切换和会话恢复。
- 容器层只处理状态编排、跨模块联动和页面入口。
- 组件层只处理单个能力域的渲染与交互。
- 展示模型、纯函数、领域 hook 尽量从组件体内抽离，降低无限渲染、重复派生和交叉依赖风险。

这次架构刷新后，前端可以按 `routes -> modules -> components -> lib -> styles` 理解，而不需要再从单个超大组件中反推职责边界。

Summary: The current frontend architecture separates routing, orchestration, rendering, pure helpers, and styling so each layer owns a narrower problem.

## 2. App 与 Router / App and Router

`src/modules/App.tsx` 现在只保留“顶层页面切换 + 会话恢复 + 路由守卫”职责，不再直接读写 `window.history`。手写路由的单一事实源集中在 `src/modules/app/router.ts`：

- `AppRoute` 联合类型枚举当前所有顶层路由：`/`、`/login`、`/register`、`/admin`、`/stats`、`/trips/:id`、`/yearbook/:year`。
- `createHomeRoute()`、`createTripDetailRoute()` 等工厂函数负责统一构造路由对象。
- `parsePathname()` 负责把浏览器 URL 解析成内部路由状态。
- `useAppRouter()` 负责把 `pushState`、`replaceState`、`popstate` 监听包装成 React 可消费的 API。

`App.tsx` 通过 `fetchSession()` 恢复登录态，然后根据 `route.kind` 和 `account.role` 分发到：

- `AuthPage`
- `TravelApp`
- `AdminPage`
- `StatsPage`
- `TripDetailPage`
- `AnnualReviewPage`

这样做的结果是：新增页面时，先扩展 `router.ts`，再在 `App.tsx` 增加一个页面分支即可，顶层状态机不再散落在多个文件。

Summary: `App.tsx` is now a thin page switcher, while `router.ts` is the single source of truth for route types, parsing, and navigation.

## 3. TravelApp 容器 / TravelApp Container

`src/modules/TravelApp.tsx` 是首页应用壳，负责把“远端主数据 + 地图上下文 + 弹层状态 + 首页分区”拼成一个完整体验，但它已经不再承担所有细节渲染。

当前 `TravelApp` 主要保留四类职责：

- 初始化 `TravelStore`，并通过 `remoteTravelStoreRepository` 对接后端主数据。
- 维护首页级 UI 状态，例如当前详情记录、攻略搜索开关、数据备份弹窗、待删除记录、顶部提示文案。
- 组合 `useMapContext()`、`useTravelStoreActions()`、`useLockedModal()` 等 hook，统一调度跨模块状态。
- 将页面渲染拆交给 `AppHero`、`StatsPanel`、`AppContent`、`AppOverlays`。

这意味着 `TravelApp` 是“编排层容器”，而不是新的大而全组件。它知道谁和谁要联动，但不再拥有每一个面板的实现细节。

Summary: `TravelApp` works as the homepage orchestration container, coordinating state and cross-module flows without owning detailed rendering logic.

## 4. AppContent 与 AppOverlays / Page Composition Layers

首页内容被明确拆成两个组合层：

### 4.1 `AppContent`

`src/modules/app/AppContent.tsx` 负责首页主视图布局，按“主内容区 + 右侧栏”组织：

- 主内容区：`TravelMap`、`MarkerList`
- 侧栏：`UserManager`、`TripTimelinePanel`、`SavedGuidesPanel`

这个文件不做复杂派生计算，更多是 props 编排与布局组合，因此可以把首页主体结构一眼看清。

### 4.2 `AppOverlays`

`src/modules/app/AppOverlays.tsx` 负责所有浮层与弹出式交互：

- `MarkerForm` 录入弹窗
- `DataSync` 数据备份弹窗
- `MarkerDetailPanel` 记录详情侧板
- `GuideSearchPanel` 攻略搜索侧板

这种拆分把“页面常驻区域”和“浮层状态域”分开，减少首页 JSX 深度，也避免某个弹层逻辑污染主内容结构。

Summary: `AppContent` owns the persistent homepage layout, while `AppOverlays` owns dialogs, drawers, and side panels.

## 5. 地图能力拆分 / TravelMap Domain Split

`src/components/TravelMap.tsx` 现在明确定位为地图容器，只保留状态与 effect 编排。地图渲染和专门交互已经拆到 `src/components/map/`：

- `MapChrome.tsx`：标题、选择态、图例、顶部说明等壳层 UI。
- `MapRegionLayer.tsx`：区域 path、标签等基础底图渲染。
- `MapJourneyLayer.tsx`：旅途轨迹与 tooltip portal。
- `MapReplayLayer.tsx`：地图回放相关渲染层。
- `ReplayControlBar.tsx`：回放控制条。
- `useMapHover.ts`：hover 区域与 tooltip 坐标。
- `useMapViewBox.ts`：缩放、拖拽、viewBox。
- `useMapReplayController.ts`：回放播放状态与步进控制。
- `regionStyles.ts`：区域渲染样式决策。

因此 `TravelMap.tsx` 更像“地图场景导演”，负责把 geo 数据、marker 聚合、journey arc、hover、replay 串起来，而不是直接内嵌所有 SVG 细节。

Summary: `TravelMap` is now an orchestration container, while the `components/map/` folder holds specialized render layers and hooks.

## 6. GuideSearchPanel 拆分 / Guide Search Split

`src/components/GuideSearchPanel.tsx` 仍然是攻略搜索的对外入口，但已经从“单文件包办搜索 + 列表 + 正文 + 锁滚动”转成容器模式：

- `GuideSearchInputBar.tsx`：搜索框、范围切换、历史与触发入口。
- `GuideSearchResultList.tsx`：结果列表、收藏/关联操作区。
- `GuideDocumentDrawer.tsx`：正文抽屉、摘要/原文切换。
- `useGuideSearchLayoutLock.ts`：嵌套滚动与布局锁定。

容器文件自身负责：

- 搜索请求与状态管理
- 正文请求与缓存态
- 搜索历史同步
- 高亮 token 与原文视图派生
- 面板挂载/卸载动画和 ESC 关闭

这类拆分的意义是保留单一交互入口，同时把渲染块、布局锁和正文阅读能力分散到更适合复用和测试的位置。

Summary: `GuideSearchPanel` stays as the container entry, while input, result list, document drawer, and layout locking are delegated to focused submodules.

## 7. TripTimelinePanel 拆分 / Trip Timeline Split

`src/components/TripTimelinePanel.tsx` 已从“大型时间线组件”收口为“筛选与分组容器 + 若干子组件”：

- `TimelineList.tsx`：普通时间线分支
- `TripGroupList.tsx`：按行程分组分支
- `TripBatchToolbar.tsx`：整理模式工具条
- `TimelineToolbar.tsx`、`TimelineMarkerButton.tsx`：筛选栏与记录项交互单元
- `TripEditorDialog.tsx`：新增/编辑行程弹窗
- `useTripTimelineActions.ts`：对话框、整理模式、批量选择、目标行程等 UI 状态

当前实现有两个渲染分支：

- 普通时间线：按日期分组
- 行程分组时间线：按 Trip Collection 分组

但两条分支共享同一套 `selectionMode`、`selectedMarkerIds`、`batchTripTarget` 状态，因此“整理模式”不再只在某一个分支可用，这也是修复普通时间线下不可选择问题的关键。

Summary: `TripTimelinePanel` is split into a stateful container plus focused timeline subcomponents, with both rendering branches sharing one selection state model.

## 8. AdminPage 拆分 / Admin Page Split

后台页 `src/modules/admin/AdminPage.tsx` 现在主要保留“加载数据 + 选择账号 + 切换 tab + 布局壳层”职责，数据整形与局部展示已经拆开：

- `adminPageModel.ts`：时间格式化、详情集合派生、tab 常量
- `components/admin/AdminFiltersBar.tsx`：账号筛选栏
- `components/admin/AdminOverviewCards.tsx`：总览 KPI
- `components/admin/AdminRankingTable.tsx`：明细排行表格

这样做之后，后台页可以继续保持只读聚合页定位。如果未来要扩展只读巡检、更多筛选或分页，也可以继续在 `admin/` 子域内扩展，而无需把逻辑重新塞回 `AdminPage.tsx`。

Summary: `AdminPage` is now a thin admin-shell container, while derived models and visual sections live in `admin/` modules and components.

## 9. Actions Hooks 分层 / Layered Action Hooks

`src/modules/app/useTravelStoreActions.ts` 不再直接承载所有写操作实现，而是改成一个领域聚合入口：

- `useCompanionActions.ts`
- `useTripActions.ts`
- `useMarkerActions.ts`
- `useGuideActions.ts`

`useTravelStoreActions()` 只负责把四个 hook 的返回值汇总给 `TravelApp` 使用。这样分层后：

- 旅伴、行程、记录、攻略四个能力域的写操作边界更清晰。
- 每个 hook 更容易围绕单一能力写测试和排查副作用。
- 共享逻辑继续下沉到 `travelStoreActionHelpers.ts`、`guideActions.ts` 等辅助模块，避免再次膨胀。

这次拆分也降低了“某一个写操作触发过多无关 state 更新”的风险，是控制渲染链条复杂度的重要一步。

Summary: `useTravelStoreActions` is now an aggregator over four domain hooks, making store writes easier to reason about and extend.

## 10. 样式组织约定 / Styling Conventions

前端样式入口是 `src/styles/index.css`，当前遵循“页面级文件 + 组件级文件 + 响应式收口”的组织方式：

- 页面级样式：`auth.css`、`admin.css`、`home.css`、`stats-center.css`、`trip-detail.css`、`annual-review.css`
- 基础骨架：`base.css`、`layout.css`
- 组件/功能域样式：`components/map.css`、`components/timeline.css`、`components/guide-search.css`、`components/marker-detail.css` 等
- 响应式收口：`responsive.css`

当前约定可以概括为：

- 页面布局优先放在页面级 CSS，避免组件样式文件反向定义整页结构。
- 功能性大组件优先拥有自己的 `components/*.css` 文件，便于按能力域定位。
- 统计中心虽然是独立页面，但其样式仍以 `stats-center.css` 作为单独页面文件维护，不和首页 `home.css` 混写。
- `index.css` 只做 import 编排，不在入口文件堆积具体规则。

因此“pages / features / stats-center”的实际含义是：页面壳层和功能域样式分开维护，统计中心作为独立页面有自己的样式文件，不再寄生于首页样式。

Summary: Styles are organized by page shell, feature-domain component files, and a single responsive closing layer, with `index.css` acting only as the import entry.

## 11. 扩展规则 / Extension Rules

按照当前结构，后续新增前端能力时建议遵循以下规则：

- 新顶层页面先改 `router.ts`，再改 `App.tsx`，不要在业务组件里直接拼路径判断。
- 首页新面板优先挂到 `AppContent` 或 `AppOverlays`，不要直接继续膨胀 `TravelApp.tsx`。
- 复杂组件先判断能否拆成“容器 + 子组件 + hook + model”四层，而不是继续加条件分支。
- 跨模块共享的纯逻辑优先放 `lib/` 或 `modules/*Model`，不要塞回 JSX 文件。

这些规则本质上是在维持这次重构后的收益，避免大组件回潮。

Summary: Future frontend work should extend the router centrally, keep `TravelApp` thin, and prefer container-plus-submodule splits over growing monoliths again.
