# 愿望地图 / Wishlist Map

愿望地图把首页地图从“去过哪里”的回看工具扩展为“想去哪里”的计划工具。它复用当前地图区域、攻略搜索、行程规划和 MySQL 主数据层，不引入公开分享或复杂排期。

The wishlist map extends the homepage map from visited-place retrospection into desired-place planning. It reuses the existing map regions, guide search, trip planning, and MySQL source of truth without introducing public sharing or heavy scheduling.

## 范围 / Scope

- 新增 `WishlistItem`，绑定账号和创建旅伴。
- 首页地图按区域区分 visited / wishlist / both。
- 地图选中区域可直接加入愿望地图，并在 hover 中展示愿望城市。
- 攻略搜索结果可加入愿望地图，与“生成行前清单”和“加入行程规划”并存。
- 行程详情的“行前规划”Tab 可从愿望地图导入规划项。
- 愿望项支持编辑、筛选、排序、去重提示、已导入标记和一键转新行程。

Out of scope: global day-by-day scheduling, route dragging, third-party geocoding, collaboration, batch organization, and public share links.

## 数据模型 / Data Model

`WishlistItem` 保存：

- 地点：`scope / scopeId / scopeName / city`
- 内容：`title / note / priority / targetYear`
- 来源：`sourceGuideIdentity / sourceGuideTitle / sourceGuideSourceName / sourceGuideSourceUrl`
- 导入状态：通过 `TripPlanningItem.sourceWishlistId` 反查 `importedTrips`
- 归属：`accountId / createdByCompanionId`
- 生命周期：`isDeleted / createdAt / updatedAt / deletedAt`

Summary: wishlist items are account-owned desired places with optional guide-source context and a soft-delete lifecycle.

## 接口 / APIs

- `GET /api/wishlist`
- `POST /api/wishlist`
- `PATCH /api/wishlist/:itemId`
- `POST /api/wishlist/:itemId/convert-to-trip`
- `DELETE /api/wishlist/:itemId`
- `POST /api/trips/:id/planning/from-wishlist/:wishlistId`

Bootstrap now includes `store.wishlistItems`, so the homepage can render wishlist state without a second request.

Create uses front-end preflight dedupe and backend conflict protection for the same account / companion / scope / scopeId / city combination. Converting a wishlist item to a trip creates a new trip plus an initial planning item linked back to the source wishlist item.

## 页面入口 / UI Surfaces

- 首页地图选中区域卡片新增“加入愿望”。
- 首页侧栏新增愿望地图面板，展示当前旅伴愿望项，支持优先级 / 范围筛选和排序。
- 愿望卡片支持编辑标题、城市、备注、优先级和目标年份，并展示已导入到哪些行程。
- 愿望卡片支持一键转成新行程，转成后自动打开新行程详情。
- 攻略搜索结果新增“加入愿望地图”。
- 行程详情 `/trips/:id` 的“行前规划”Tab 固定展示愿望地图导入入口。

## 设计边界 / Boundaries

愿望地图表达“未来可能想去”，行程规划表达“某个已存在行程里准备去”。从愿望导入规划不会删除原愿望项，避免用户失去长期愿望池。

Wishlist means “maybe someday”; trip planning means “for this existing trip”. Importing a wishlist item into trip planning does not delete the source wishlist item.

一键转新行程也不会删除原愿望项；它只创建一个新的行程容器，并写入一条带 `sourceWishlistId` 的行前规划，方便愿望项继续显示“已导入”状态。
