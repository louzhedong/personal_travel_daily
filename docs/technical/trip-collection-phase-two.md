# 行程集合二期 / Trip Collection Phase Two

本文档记录“行程集合二期”已经落地的产品能力、交互规则、前后端链路和测试覆盖点。它是当前版本的事实说明，不再重复规划阶段的待办清单。

This document captures the shipped scope of trip collection phase two, covering UX, architecture, API flow, and test coverage.

---

## 1. 目标与范围 / Goals and Scope

行程集合一期解决的是“行程对象存在”，二期解决的是“行程真正成为可整理、可回看、可轻编辑的内容容器”。

当前二期已落地能力包括：

- 在时间线中进入“整理模式”
- 多选记录后批量归入某个行程，或移回未归入状态
- 时间线支持按行程分组展示
- 行程详情页从只读升级为轻编辑
- 统计中心与年度回顾可钻取到具体行程详情

不在本期范围内的内容包括：

- 行程内记录拖拽排序
- 行程封面自动生成策略
- 多人协作编辑同一行程
- 行程回放专属页面

Summary: Phase two turns trip collections from passive containers into manageable, navigable, and lightly editable travel units.

## 2. UX 总览 / UX Overview

用户当前主要通过两条入口进入行程集合能力：

### 2.1 首页时间线侧栏

时间线面板是行程整理主入口，支持：

- 查看当前旅伴的所有记录
- 按年份筛选
- 按国内 / 国际范围筛选
- 在有行程时切换为按行程分组视图
- 进入整理模式并批量调整归属

### 2.2 统计中心与年度回顾钻取

统计中心 `/stats` 和年度回顾 `/yearbook/:year` 可钻取到 `/trips/:id`，行程详情页承担“集中回看 + 轻编辑”的职责。

这两个入口分工非常清晰：

- 时间线负责“整理”
- 行程详情负责“回看与轻编辑”

Summary: The homepage timeline is the organization console, while stats and yearbook pages drill into trip detail for review and lightweight editing.

## 3. 时间线双分支与共享选择态 / Dual Timeline Branches with Shared Selection State

`TripTimelinePanel` 当前内部存在两个渲染分支：

- 普通时间线：按日期分组
- 行程分组时间线：按 Trip Collection 分组，未归入记录收口到 `未归入行程`

二期里一个关键设计点是：这两个分支共享同一套整理状态，而不是各自维护一套。

共享状态包括：

- `selectionMode`
- `selectedMarkerIds`
- `batchTripTarget`

这意味着无论当前看到的是：

- 普通时间线
- 按行程分组的时间线

点击记录都能进入同一条“选择 -> 统计已选 -> 选择目标行程 -> 应用批量整理”的流程。此前普通时间线分支缺少这层接入，曾导致整理模式在某一分支下“看起来不可用”，现已修复。

Summary: The plain timeline and trip-group timeline now share one selection-state model, so organization mode works consistently across both branches.

## 4. 批量整理流程 / Batch Organization Flow

当前批量整理流程如下：

1. 用户在时间线中点击“整理模式”。
2. 面板进入选择态，普通点击记录不再直接打开详情，而是切换选中状态。
3. 顶部工具条显示已选记录数，并允许选择目标行程。
4. 用户可选择一个现有行程，或选择“未归入行程”语义以批量移出。
5. 提交后前端调用 `PATCH /api/markers/batch-trip`。
6. 服务端单事务完成校验与更新，返回最新整包 `TravelStore`。
7. 前端刷新时间线与相关联动视图。

当前交互强调三点：

- 选择态显式可见，避免误触打开详情。
- 批量操作入口收口在时间线工具条，而不是散落在每条记录上。
- 变更完成后以前端整包 store 刷新为准，不依赖本地猜测更新。

Summary: Batch organization follows a clear selection-toolbar-submit-refresh flow centered on the timeline panel and backed by a server-side transaction.

## 5. 已选记录 Tooltip 与滚动规则 / Selected Records Tooltip and Overflow Rule

整理模式下，头部会展示“已选 X 条记录”。该区域不是简单数字，而是一个可 hover 的详细提示入口，用于逐条查看已选内容。

Tooltip 当前规则如下：

- 按条列出已选记录
- 每条记录显示地点和日期信息
- 超长文本启用截断，避免浮层横向撑开
- 当记录数超过 5 条时，tooltip 使用固定高度并开启内部滚动
- 滚动条视觉继续遵循项目“隐藏滚动条”约定

这个规则来自真实交互问题：如果 tooltip 随记录数无限增长，会直接破坏时间线头部区域的阅读与遮挡关系，因此必须让浮层在大于 5 条时收口。

Summary: The selected-records tooltip lists items individually, truncates long text, and switches to internal scrolling once the selection exceeds five items.

## 6. `PATCH /api/markers/batch-trip` 接口 / Batch Trip Assignment API

二期新增的关键接口是：

### `PATCH /api/markers/batch-trip`

请求体：

```json
{
  "markerIds": ["marker-1", "marker-2"],
  "tripId": "trip-2026-spring"
}
```

也支持把 `tripId` 置为 `null`，表示批量移回未归入状态：

```json
{
  "markerIds": ["marker-1", "marker-2"],
  "tripId": null
}
```

当前约束为：

- `markerIds` 必填，至少 1 条，最多 100 条
- 服务端会对 `markerIds` 去重
- 所有 marker 必须属于当前登录账号且未软删除
- 若传入 `tripId`，它必须是当前账号下的有效行程
- 整个操作在单事务内完成
- 成功后返回最新整包 `TravelStore`

当前后端还特别约束了路由顺序：`/api/markers/batch-trip` 必须先于 `/api/markers/:id` 注册，否则静态路径会被动态路由吞掉。

Summary: The phase-two batch API updates marker-to-trip ownership transactionally, supports both assign and unassign flows, and returns a fresh store snapshot.

## 7. 行程详情页轻编辑 / Lightweight Trip Detail Editing

二期中，`/trips/:id` 不再只是统计中心的只读落点，而是升级为轻编辑详情页。当前支持编辑：

- 行程名称
- 开始日期
- 结束日期
- 备注
- 封面图 URL

页面仍然保持“轻编辑”而非“重管理台”定位：

- 主视图以回看为主，展示总览 KPI、记录、照片、攻略、旅伴摘要
- 编辑通过 `Dialog` 弹层完成，不打断主阅读结构
- 删除行程也在详情页内可触达，但仍通过确认交互保护

这保证了从统计中心或年度回顾钻取进来时，用户先看到完整内容，再决定是否微调元数据。

Summary: Trip detail now supports lightweight metadata editing through dialogs while remaining primarily a review page for markers, photos, guides, and summary stats.

## 8. 前后端协作方式 / Frontend and Backend Collaboration

二期在前后端之间采用的是“整包快照回填”模式，而不是“局部 optimistic merge”模式：

- 前端时间线发起批量归属请求
- 后端更新数据库后重新构建当前 `TravelStore`
- 前端直接以服务端返回结果替换本地 store

这套方式对本期特别合适，因为批量归属会同时影响：

- 时间线分组
- 行程详情聚合
- 统计中心 trip ranking / trip detail
- 记录详情里的所属行程信息

如果只在前端做局部补丁更新，很容易漏掉某一处派生数据；而整包回填虽然更重，但一致性更高。

Summary: Phase two favors server-returned full-store snapshots because batch trip assignment affects multiple derived views at once.

## 9. 测试覆盖点 / Test Coverage

当前与行程集合二期直接相关的测试主要分布在以下文件：

- `src/components/__tests__/TripTimelinePanel.spec.tsx`
- `src/modules/__tests__/TripDetailPage.spec.tsx`
- `src/modules/__tests__/App.spec.tsx`
- `src/lib/api/__tests__/apiModules.spec.ts`
- `server/__tests__/appApiRoutes.spec.ts`
- `server/__tests__/tripDetailService.spec.ts`

这些测试覆盖的重点包括：

- 时间线普通分支与行程分组分支的整理模式行为
- `PATCH /api/markers/batch-trip` 的前端 API 转发与后端路由行为
- tooltip 展示与选择态回归
- 行程详情页加载、编辑、删除和错误态
- `App` 路由从统计中心进入详情页的跳转链路
- 行程详情聚合服务的后端结果结构

其中最重要的回归点是：普通时间线分支也必须能多选整理，这一条直接对应本期修复的问题。

Summary: Phase-two coverage focuses on timeline organization behavior, batch-trip routing, trip detail loading/editing, and the drill-down path from app routing into trip detail.

## 10. 当前边界 / Current Boundaries

虽然二期已经闭环，但当前仍有明确边界：

- 行程内记录顺序仍由日期排序驱动，不支持人工重排
- 批量归属只处理 `tripId`，不处理其他记录字段
- 行程详情页的编辑范围仍限定在元数据，不直接编辑记录列表本身
- tooltip 只做展示，不承担批量编辑入口

这些边界让时间线和详情页的职责保持清楚，避免再次回到“一个页面处理全部任务”的大组件形态。

Summary: The current phase-two scope intentionally stops at ownership management and metadata editing, leaving reordering and deeper trip editing for later work.
