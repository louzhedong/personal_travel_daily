# 旅行地图时间机器 / Travel Atlas Timeline

本文档规划下一个大功能点：**旅行地图时间机器 / Travel Atlas Timeline**。它将现有旅行记录按时间、地点、旅伴、主题、情绪、天气、交通和预算等维度组织成一个可筛选、可播放、可对比、可导出的全局旅行地图册。

This document plans the next major feature: **Travel Atlas Timeline**. It organizes existing travel records by time, place, companion, theme, mood, weather, transport, and budget into a global travel atlas that can be filtered, replayed, compared, and exported.

## 1. 产品定位 / Product Positioning

旅行地图时间机器的入口为 `/atlas`，定位是“我的旅行地图册”，不是后台统计页，也不是首页地图的简单复刻。

The Travel Atlas Timeline lives at `/atlas`. It is positioned as "my travel atlas", not an admin statistics page and not a simple copy of the homepage map.

它要解决的问题是：当前项目已经有行程、照片、年度回顾、旅伴回忆和旅行胶囊，但缺少一个全局空间视角来把这些旅行资产串成可回放的地图叙事。

The problem it solves is that the project already has trips, photos, annual reviews, companion memories, and memory capsules, but it still lacks a global spatial view that turns those assets into a replayable map narrative.

核心体验应像一页旅行杂志地图内页：大地图、细线时间轴、地名索引、年份切片、路线回放和轻量导出。

The core experience should feel like an editorial travel-atlas spread: a large map, hairline timeline, place index, year slices, route replay, and lightweight exports.

## 2. 功能范围 / Feature Scope

### 2.1 Atlas Home / Atlas Home

`/atlas` 展示全局地图、核心摘要、筛选栏、时间轴、地名索引、对比模块和导出操作。

`/atlas` shows the global map, summary, filters, timeline, place index, comparison modules, and export actions.

筛选维度包括年份、月份、范围、旅伴、行程、标签、情绪、天气、交通和预算。

Filter dimensions include year, month, scope, companion, trip, tag, mood, weather, transport, and budget.

### 2.2 Timeline Replay / Timeline Replay

时间轴按 `visitedStartAt` 升序播放旅行节点，支持播放、暂停、上一站、下一站和重置。

The timeline replays travel nodes by `visitedStartAt` ascending and supports play, pause, previous, next, and reset.

当前节点需要同步地图高亮、节点详情、代表照片、同行人、行程和元数据。

The current node should synchronize map highlighting, node detail, representative photo, companion, trip, and metadata.

### 2.3 Place Index / Place Index

地名索引按地区与城市聚合旅行记录，形成目录式信息结构。

The place index aggregates travel records by region and city, creating a directory-style information structure.

每层目录应包含记录数、照片数、首次访问时间和最近访问时间。

Each directory level should include marker count, photo count, first visited date, and latest visited date.

### 2.4 Compare Mode / Compare Mode

对比模块展示年份、旅伴、国内/国际足迹变化。

The comparison module shows changes across years, companions, and domestic/international footprints.

第一版只做派生对比，不保存用户自定义对比视图。

The first version only derives comparisons and does not persist custom comparison views.

### 2.5 Atlas Export / Atlas Export

导出能力包括年度地图海报、城市索引长图和路线回放 SVG。

Export capabilities include annual map posters, city-index long images, and route-replay SVGs.

导出保持本地 SVG 策略，不截图、不上传、不服务端渲染、不做 base64 内联。

Exports keep the local SVG strategy: no screenshots, no uploads, no server-side rendering, and no base64 inlining.

## 3. 不做范围 / Out of Scope

本阶段不做公开分享链接、匿名访问、多人协作、权限邀请、服务端截图、图片代理、离线地图包或复杂 GIS 坐标编辑。

This phase does not include public share links, anonymous access, collaboration, permission invitations, server-side screenshots, image proxying, offline map packs, or complex GIS coordinate editing.

第一版不新增持久化模型；所有 Atlas 内容从现有旅行记录实时派生。

The first version does not add a persistence model; all Atlas content is derived from existing travel records at read time.

## 4. 当前代码基础 / Current Code Base

手写路由的单一事实源位于 `src/modules/app/router.ts`，新增 `/atlas` 必须同步更新路由联合类型、route factory、`parsePathname()` 和 `pathnameFor()`。

The single source of truth for hand-written routing is `src/modules/app/router.ts`. Adding `/atlas` must update the route union, route factory, `parsePathname()`, and `pathnameFor()`.

登录态页面分发位于 `src/modules/app/routeRenderers.tsx`，新增页面应在这里挂载。

Authenticated page rendering is dispatched in `src/modules/app/routeRenderers.tsx`, where the new page should be mounted.

地图基础能力位于 `src/components/TravelMap.tsx` 及 `src/components/map/*`，包含 GeoJSON 加载、区域图层、hover、replay 和 journey arcs。

Map foundations live in `src/components/TravelMap.tsx` and `src/components/map/*`, including GeoJSON loading, region layers, hover, replay, and journey arcs.

统计数据源位于 `server/appApi/repositories/statsRepository.ts`，可读取当前账号的 companions、trips、markers、images 和 savedGuides。

The statistics data source lives in `server/appApi/repositories/statsRepository.ts` and can load the current account's companions, trips, markers, images, and savedGuides.

统计聚合逻辑位于 `server/appApi/services/statsService.ts` 与 `server/appApi/services/stats/aggregator/*`，Atlas 应复用筛选与纯聚合思路，但避免把 Atlas 逻辑塞回 Stats。

Statistics aggregation lives in `server/appApi/services/statsService.ts` and `server/appApi/services/stats/aggregator/*`. Atlas should reuse the filtering and pure-aggregation approach without pushing Atlas-specific logic back into Stats.

## 5. API 契约 / API Contract

新增接口：

New endpoint:

```http
GET /api/atlas/timeline
```

请求参数：

Query parameters:

```ts
export interface AtlasTimelineQueryDto {
  year?: string | 'all';
  month?: string | 'all';
  scope?: 'all' | 'domestic' | 'international';
  companionId?: string;
  tripId?: string | 'unassigned';
  tag?: string | 'all';
  mood?: string | 'all';
  weather?: string | 'all';
  transport?: string | 'all';
  budgetLevel?: string | 'all';
}
```

响应结构：

Response shape:

```ts
export interface AtlasTimelineResponseDto {
  filters: AtlasTimelineFiltersDto;
  availableYears: string[];
  companions: AtlasCompanionOptionDto[];
  trips: AtlasTripOptionDto[];
  summary: AtlasTimelineSummaryDto;
  replay: AtlasReplayItemDto[];
  placeIndex: AtlasPlaceIndexDto;
  compare: AtlasCompareDto;
  exportModel: AtlasExportModelDto;
  generatedAt: string;
}
```

DTO 文件应新增在 `server/appApi/dto/atlas.ts` 与 `src/lib/api/dto/atlas.ts`，并由对应 `dto/index.ts` 导出。

DTO files should be added as `server/appApi/dto/atlas.ts` and `src/lib/api/dto/atlas.ts`, then re-exported from the matching `dto/index.ts`.

## 6. 后端实现 / Backend Implementation

新增 `server/appApi/routes/atlas.ts` 注册 `GET /api/atlas/timeline`。

Add `server/appApi/routes/atlas.ts` to register `GET /api/atlas/timeline`.

新增 `server/appApi/schemas/atlas.ts` 校验筛选参数，枚举语义保持与 Stats 一致。

Add `server/appApi/schemas/atlas.ts` to validate filters while keeping enum semantics aligned with Stats.

新增 `server/appApi/services/atlasService.ts` 作为编排层，负责读取 source、过滤 markers、调用 Atlas 聚合器并返回 DTO。

Add `server/appApi/services/atlasService.ts` as the orchestration layer that loads the source, filters markers, calls Atlas aggregators, and returns DTOs.

新增 `server/appApi/services/atlas/filters.ts`，包装或复用 Stats 聚合中的 `withYearFilter`、`withCompanionFilter`、`withScopeFilter` 等纯函数。

Add `server/appApi/services/atlas/filters.ts` to wrap or reuse pure filters such as `withYearFilter`, `withCompanionFilter`, and `withScopeFilter` from Stats aggregation.

新增 `server/appApi/services/atlas/replay.ts` 生成时间轴播放节点。

Add `server/appApi/services/atlas/replay.ts` to generate timeline replay nodes.

新增 `server/appApi/services/atlas/placeIndex.ts` 聚合地区与城市索引。

Add `server/appApi/services/atlas/placeIndex.ts` to aggregate region and city indexes.

新增 `server/appApi/services/atlas/compare.ts` 生成年份、旅伴和范围对比。

Add `server/appApi/services/atlas/compare.ts` to generate year, companion, and scope comparisons.

新增 `server/appApi/serializers/atlasSerializer.ts`，统一序列化日期、图片、枚举和空态。

Add `server/appApi/serializers/atlasSerializer.ts` to standardize date, photo, enum, and empty-state serialization.

更新 `server/appApi/buildApp.ts`，注册 `registerAtlasRoutes(app)`。

Update `server/appApi/buildApp.ts` to register `registerAtlasRoutes(app)`.

## 7. 前端实现 / Frontend Implementation

新增 `src/lib/api/atlasApi.ts`，提供 `fetchAtlasTimeline(query)`。

Add `src/lib/api/atlasApi.ts` with `fetchAtlasTimeline(query)`.

新增 `src/modules/atlas/TravelAtlasPage.tsx` 作为 `/atlas` 页面主容器。

Add `src/modules/atlas/TravelAtlasPage.tsx` as the main `/atlas` page container.

新增 `src/modules/atlas/atlasPageModel.ts`，把 DTO 派生成页面所需的地图、时间轴、索引、对比和导出 view model。

Add `src/modules/atlas/atlasPageModel.ts` to derive map, timeline, index, comparison, and export view models from DTOs.

新增 `src/modules/atlas/atlasExport.ts`，生成地图海报、城市索引长图和路线回放 SVG。

Add `src/modules/atlas/atlasExport.ts` to generate map posters, city-index long images, and route-replay SVGs.

新增 `src/components/atlas/AtlasMap.tsx`，只接收 Atlas view model，不依赖首页的 composer、wishlist 或新增足迹交互。

Add `src/components/atlas/AtlasMap.tsx`. It should receive only Atlas view models and should not depend on homepage composer, wishlist, or marker-creation interactions.

新增 `src/styles/features/travel-atlas.css` 并在 `src/styles/features/index.css` 引入。

Add `src/styles/features/travel-atlas.css` and import it from `src/styles/features/index.css`.

更新首页 `AppHero`，增加“地图时间机器”入口。

Update the homepage `AppHero` with a "地图时间机器" entry point.

## 8. 页面结构 / Page Structure

页面顶部使用全局 `.hero-kicker`，标题建议为“地图时间机器”，说明文案保持短句。

The page header should use the global `.hero-kicker`, with the suggested title "地图时间机器" and concise helper copy.

主视觉为大地图区域，占据页面重心，展示区域热度、播放节点和路线线条。

The primary visual should be a large map area that carries the page weight and shows region heat, replay nodes, and route lines.

筛选栏使用 `FancySelect`，禁止原生 `select`，控件高度统一为 40px。

Filters should use `FancySelect`; native `select` is forbidden, and control height should be unified at 40px.

时间轴模块包含当前节点、播放/暂停、上一站、下一站、重置和进度说明。

The timeline module should include the current node, play/pause, previous, next, reset, and progress text.

地名索引采用目录式排版，按地区和城市展示，不做强边框 Web 卡片堆叠。

The place index should use directory-style layout by region and city, avoiding heavy bordered web-card stacks.

对比模块展示年份、旅伴、国内/国际变化，突出差异而不是堆满统计表。

Comparison modules should show year, companion, and domestic/international changes, emphasizing differences rather than dense statistical tables.

## 9. 地图复用策略 / Map Reuse Strategy

第一阶段不要直接扩重 `TravelMap.tsx`。

Do not make `TravelMap.tsx` heavier in the first phase.

优先复用 `src/components/map/*` 中已经拆出的图层、Replay 控制、Journey arcs 和地图 Chrome。

Prefer reusing existing layers, replay controls, journey arcs, and map chrome from `src/components/map/*`.

如果 Atlas 需要新增展示逻辑，应放入 `src/components/atlas/*`，不要塞回首页地图。

If Atlas needs new display logic, place it under `src/components/atlas/*` instead of pushing it back into the homepage map.

## 10. 导出设计 / Export Design

`exportAtlasPoster()` 生成年度地图海报，推荐尺寸 `1080x1350`。

`exportAtlasPoster()` generates an annual map poster, with `1080x1350` as the recommended size.

`exportAtlasIndex()` 生成城市索引长图，高度动态计算。

`exportAtlasIndex()` generates a city-index long image with dynamic height.

`exportAtlasReplay()` 生成路线回放图，展示节点顺序、地名、日期和代表照片。

`exportAtlasReplay()` generates a route-replay graphic with node order, place names, dates, and representative photos.

导出逻辑可与旅行胶囊和 Story Studio 的 SVG helper 后续合并到 `src/modules/export/svgExportHelpers.ts`。

Export logic can later be consolidated with Travel Capsules and Story Studio SVG helpers into `src/modules/export/svgExportHelpers.ts`.

## 11. 视觉规范 / Visual Guidelines

页面应像“旅行地图册内页”，不是 dashboard。

The page should feel like a travel-atlas editorial spread, not a dashboard.

地图区域大而克制，避免高饱和色块。

The map area should be large and restrained, avoiding high-saturation blocks.

时间轴使用细线、小圆点和当前节点强调。

The timeline should use hairlines, small dots, and a clear current-node emphasis.

城市目录使用编号、小字、细线和强标题层级。

The city directory should use numbering, small text, hairlines, and strong title hierarchy.

按钮紧凑，不撑满整行。

Buttons should stay compact and must not stretch to full width.

## 12. 测试计划 / Testing Plan

新增 `server/__tests__/atlasService.spec.ts` 覆盖筛选、播放节点、地名索引、对比和空态。

Add `server/__tests__/atlasService.spec.ts` for filters, replay nodes, place index, comparisons, and empty states.

更新 `server/__tests__/appApiRoutes.spec.ts` 覆盖 `GET /api/atlas/timeline` 鉴权和参数传递。

Update `server/__tests__/appApiRoutes.spec.ts` to cover authentication and parameter forwarding for `GET /api/atlas/timeline`.

新增 `src/modules/__tests__/TravelAtlasPage.spec.tsx` 覆盖加载、筛选、播放和导出按钮。

Add `src/modules/__tests__/TravelAtlasPage.spec.tsx` for loading, filtering, replay controls, and export buttons.

新增 `src/modules/atlas/__tests__/atlasPageModel.spec.ts` 覆盖 view model 派生。

Add `src/modules/atlas/__tests__/atlasPageModel.spec.ts` for view-model derivation.

新增 `src/modules/atlas/__tests__/atlasExport.spec.ts` 覆盖 SVG 输出。

Add `src/modules/atlas/__tests__/atlasExport.spec.ts` for SVG output.

更新 `src/modules/__tests__/App.spec.tsx` 覆盖 `/atlas` 路由。

Update `src/modules/__tests__/App.spec.tsx` to cover the `/atlas` route.

## 13. 实施阶段 / Implementation Phases

### Phase 1: 契约与后端聚合 / Contracts and Backend Aggregation

新增 Atlas DTO、schema、route、service、serializer，完成 `GET /api/atlas/timeline`。

Add Atlas DTOs, schemas, routes, service, and serializer, completing `GET /api/atlas/timeline`.

### Phase 2: 前端 API 与路由 / Frontend API and Routing

新增 `atlasApi.ts`、`TravelAtlasPage` 骨架、`/atlas` route 和首页入口。

Add `atlasApi.ts`, the `TravelAtlasPage` skeleton, `/atlas` route, and homepage entry.

### Phase 3: 地图与时间轴 / Map and Timeline

实现 `AtlasMap`、播放控制、当前节点、路线线条和地图热度。

Implement `AtlasMap`, replay controls, current node, route lines, and map heat.

### Phase 4: 索引与对比 / Index and Comparison

实现地名索引、年份对比、旅伴对比和国内/国际对比。

Implement place index, year comparison, companion comparison, and domestic/international comparison.

### Phase 5: 导出体系 / Export System

实现地图海报、城市索引长图和路线回放 SVG。

Implement map poster, city-index long image, and route-replay SVG.

### Phase 6: 视觉精修 / Visual Refinement

新增 `travel-atlas.css`，完成杂志地图册风格、紧凑按钮、响应式和打印/导出辅助样式。

Add `travel-atlas.css` and complete the editorial atlas style, compact buttons, responsive behavior, and print/export helper styles.

### Phase 7: 测试与文档 / Tests and Documentation

补齐后端、前端、路由、导出测试，并更新中英双语技术文档。

Complete backend, frontend, route, and export tests, then update bilingual technical documentation.

### Phase 8: 完整验证 / Full Verification

运行全量测试、构建、diff 检查和诊断。

Run the full test suite, build, diff check, and diagnostics.

## 14. 验收标准 / Acceptance Criteria

`/atlas` 可打开并展示全局地图时间机器。

`/atlas` opens and displays the global Travel Atlas Timeline.

年份、月份、旅伴、标签等筛选能同步影响地图、时间轴、索引和对比模块。

Filters such as year, month, companion, and tag update the map, timeline, index, and comparison modules together.

时间轴可播放、暂停、前进、后退，并同步当前旅行节点。

The timeline supports play, pause, next, previous, and current-node synchronization.

地名索引能展示记录数量、照片数量、首次访问和最近访问时间。

The place index shows marker count, photo count, first visited date, and latest visited date.

对比模块能展示年份、旅伴和国内/国际足迹变化。

Comparison modules show changes by year, companion, and domestic/international footprint.

三类导出均可生成本地 SVG 或触发打印。

All export types generate local SVGs or trigger printing.

空数据、单条记录、多年份、多旅伴都稳定。

Empty data, single-record data, multi-year data, and multi-companion data all remain stable.

## 15. 验证命令 / Verification Commands

本地联调可先写入 Atlas 专用 mock 数据：

For local integration testing, seed the dedicated Atlas mock data first:

```bash
npm run db:seed:atlas
```

该脚本会为默认账号写入固定 ID 的 Atlas 示例旅伴、行程、足迹、照片、收藏攻略和搜索事件。脚本是幂等的，重复运行会覆盖同一批示例数据，不会无限追加。

The script writes fixed-id Atlas mock companions, trips, markers, photos, saved guides, and search events for the default account. It is idempotent: repeated runs update the same sample records instead of appending duplicates.

```bash
npm run test -- server/__tests__/atlasService.spec.ts server/__tests__/appApiRoutes.spec.ts
npm run test -- src/modules/__tests__/TravelAtlasPage.spec.tsx src/modules/atlas/__tests__/atlasPageModel.spec.ts src/modules/atlas/__tests__/atlasExport.spec.ts src/modules/__tests__/App.spec.tsx
npm run test
npm run build
git diff --check
```
