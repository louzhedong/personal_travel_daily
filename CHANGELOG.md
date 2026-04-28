# Changelog / 更新日志

本文件按日期与 PR 直接追加记录，不使用 `Unreleased` 聚合区。每次创建 PR 时，同步补充对应条目。  
This file is appended directly by date and PR. It does not use an `Unreleased` section, and each PR should add its own entry.

## 2026-04-27

### PR 待定 / TBD `feat: 攻略提炼为行前清单 / Add guide-to-checklist workflow`

### Added / 新增

- 新增 `TripChecklistItem` Prisma 模型、正式 migration 与 trip checklist API，支持 trip-bound 行前清单的查询、自动生成、手动新增、编辑、删除与阶段切换。  
  Added the `TripChecklistItem` Prisma model, a formal migration, and trip-checklist APIs to support trip-bound checklist querying, automatic generation, manual creation, editing, deletion, and stage switching.
- 新增独立放大页 `/trips/:id/checklist` 与共享组件 `TripChecklistBoard`，用于管理“出发前 / 旅途中 / 已完成”三段清单。  
  Added the standalone `/trips/:id/checklist` page and the shared `TripChecklistBoard` component for managing the three checklist stages: pre-departure, in-transit, and done.
- 新增 `docs/technical/guide-to-checklist-workflow.md`，系统记录正文提炼策略、trip-bound 模型、页面流和回退规则。  
  Added `docs/technical/guide-to-checklist-workflow.md` to document the document-first extraction strategy, trip-bound model, page flow, and fallback rules.

### Changed / 变更

- `GuideSearchPanel` 与 `GuideSearchResultList` 现在支持从搜索结果直接生成行前清单，并在生成后跳转到行程详情或放大页。  
  `GuideSearchPanel` and `GuideSearchResultList` now support generating trip checklists directly from search results and linking through to trip detail or the expanded page afterwards.
- `TripDetailPage` 已内嵌固定高度的行前清单面板，并与行程详情聚合接口一起返回 checklist summary/groups。  
  `TripDetailPage` now embeds a fixed-height checklist panel, and the trip-detail aggregate API returns checklist summaries and grouped items together.
- 更新 `README.md`、`project-overview.md`、`future-roadmap.md` 与 `app-api-contract.md`，将“攻略提炼为行前清单”从 roadmap 待办迁移到当前已完成能力。  
  Updated `README.md`, `project-overview.md`, `future-roadmap.md`, and `app-api-contract.md` to move the guide-to-checklist workflow from roadmap planning into the current shipped capability set.

### Verified / 已验证

- `npx tsc -p tsconfig.server.json --noEmit`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run test -- --run server/__tests__/tripChecklistService.spec.ts server/__tests__/tripDetailService.spec.ts server/__tests__/appApiRoutes.spec.ts src/components/__tests__/GuideSearchPanel.spec.tsx src/modules/__tests__/TripDetailPage.spec.tsx src/modules/__tests__/TripChecklistPage.spec.tsx src/lib/api/__tests__/apiModules.spec.ts`

### PR 待定 / TBD `feat: 记录标签与轻量元数据闭环 / Add marker tags and lightweight metadata`

### Added / 新增

- 新增 `shared/markerMetadata.ts` 与 `src/lib/markerMetadata.ts`，统一维护旅行记录标签、心情、天气、交通方式与预算级别的固定枚举和双语标签映射。  
  Added `shared/markerMetadata.ts` and `src/lib/markerMetadata.ts` to centralize the fixed vocabularies and bilingual labels for marker tags, mood, weather, transport, and budget level.
- 新增 `docs/technical/marker-tags-and-metadata.md`，系统记录本次元数据闭环的词表、数据流、筛选语义、统计聚合与后续扩展边界。  
  Added `docs/technical/marker-tags-and-metadata.md` to document the vocabulary, data flow, filter semantics, stats aggregation, and follow-up boundaries for this metadata loop.

### Changed / 变更

- `VisitMarker` 已扩展 `tags / mood / weather / transport / budgetLevel` 字段，前后端类型、Prisma schema、marker create/update/search、bootstrap serializer 与统计 DTO 同步完成对齐。  
  `VisitMarker` now includes `tags / mood / weather / transport / budgetLevel`, with aligned Prisma schema, frontend/backend types, marker create/update/search, bootstrap serialization, and statistics DTOs.
- `MarkerForm`、`MarkerDetailPanel`、`TimelineMarkerButton`、`TripDetailPage` 与统计中心已打通录入、轻编辑、时间线摘要、详情摘要、筛选和排行展示。  
  `MarkerForm`, `MarkerDetailPanel`, `TimelineMarkerButton`, `TripDetailPage`, and the stats center now form a complete loop across capture, lightweight editing, timeline summaries, detail summaries, filters, and rankings.
- 更新 `docs/technical/app-api-contract.md` 与 `docs/technical/future-roadmap.md`，将该能力从待规划项迁移为已完成第一阶段，并补齐 API 契约中的元数据字段和统计返回说明。  
  Updated `docs/technical/app-api-contract.md` and `docs/technical/future-roadmap.md` to move this capability from planned work to a completed first-phase milestone and to document the metadata fields plus stats responses in the API contract.

### Verified / 已验证

- `npx tsc -p tsconfig.server.json --noEmit`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run test -- --run server/__tests__/appApiRoutes.spec.ts server/__tests__/statsService.spec.ts src/components/__tests__/TripTimelinePanel.spec.tsx src/components/__tests__/MarkerDetailPanel.spec.tsx src/modules/__tests__/TripStatsCenter.spec.tsx src/lib/api/__tests__/apiModules.spec.ts`

### PR #23 `refactor: 收口前后端架构拆分并刷新技术文档 / Consolidate frontend-backend architecture splits and refresh technical docs`

### Added / 新增

- 新增 `docs/technical/frontend-architecture.md`、`docs/technical/backend-architecture.md` 与 `docs/technical/trip-collection-phase-two.md`，系统记录当前前后端分层、大组件拆分、行程集合二期交互与测试覆盖。  
  Added `docs/technical/frontend-architecture.md`, `docs/technical/backend-architecture.md`, and `docs/technical/trip-collection-phase-two.md` to document the current frontend/backend layering, large-component splits, and the phase-two trip-collection workflow with testing notes.

### Changed / 变更

- 前端路由和首页组合层继续收口，`App` 通过 `router.ts` 管理顶层路由，`TravelApp` 维持容器定位，`TravelMap`、`GuideSearchPanel`、`TripTimelinePanel`、`AdminPage` 与 `useTravelStoreActions` 的拆分结果已形成稳定结构。  
  The frontend routing and homepage composition are now further consolidated: `App` uses `router.ts` for top-level routing, `TravelApp` stays as the orchestration container, and the splits around `TravelMap`, `GuideSearchPanel`, `TripTimelinePanel`, `AdminPage`, and `useTravelStoreActions` have settled into a stable structure.
- 后端完成 `routes / services / repositories / schemas / serializers / shared` 分层收口，并把错误码共享、`visitMarkerRepository` 目录化、`statsService` 聚合下沉、bootstrap serializer barrel 拆分与 admin 账号统计下沉写回正式文档。  
  The backend layering around `routes / services / repositories / schemas / serializers / shared` is now formally documented, including shared error codes, the directory split of `visitMarkerRepository`, the `statsService` aggregation extraction, the bootstrap serializer barrel split, and the admin account-stats extraction.
- 刷新 `docs/technical/app-api-contract.md` 与 `docs/README.md`，明确纳入 `PATCH /api/markers/batch-trip`、共享错误码枚举以及新的架构文档导航。  
  Refreshed `docs/technical/app-api-contract.md` and `docs/README.md` to explicitly include `PATCH /api/markers/batch-trip`, the shared error-code enum, and navigation to the new architecture documents.

### Fixed / 修复

- 修复 `TripTimelinePanel` 在普通时间线分支下可能触发的整理模式状态异常与无限 render 风险，确保双分支共享选择态并稳定批量整理交互。  
  Fixed the organization-mode state regression and infinite-render risk in the plain timeline branch of `TripTimelinePanel`, ensuring both rendering branches share a stable selection model for batch organization.

### Verified / 已验证

- 文档导航与历史档案链接已手工校对
- Markdown 诊断检查

## 2026-04-25

### PR #22 `feat: 行程集合二期管理台 / Add trip collection phase-two management`

### Added / 新增

- 新增行程时间线“整理模式”，支持多选旅行记录后批量归属到某个行程，或批量移回未归入行程。  
  Added a timeline-based organization mode so users can multi-select markers and batch-assign them to a trip, or move them back to the unassigned bucket.
- 新增 `PATCH /api/markers/batch-trip` 批量归属接口，并在前端 API / repository 层补齐对应调用封装。  
  Added the `PATCH /api/markers/batch-trip` bulk assignment endpoint and corresponding client-side API/repository wrappers.

### Changed / 变更

- `TripTimelinePanel` 升级为行程管理台，补齐创建、编辑、删除、查看详情和批量整理记录的统一入口。  
  `TripTimelinePanel` now works as a trip management console with unified entry points for create, edit, delete, view-detail, and bulk organization flows.
- 批量整理模式补充“已选记录” tooltip，支持逐条列出已选项，并在超过 5 条时启用内部滚动与文本截断，避免浮层撑爆布局。  
  Batch organization mode now includes an "selected records" tooltip that lists chosen items one by one, with internal scrolling and text truncation once the selection exceeds five records.
- 行程详情页从只读回看升级为轻编辑模式，支持修改名称、日期、备注和封面，并保留统计中心回退链路。  
  The trip-detail page is upgraded from a read-only retrospective to a lightweight editing surface, supporting name, date, note, and cover updates while preserving the stats-center return path.
- 旅行记录详情更明确展示所属行程信息，提升单条记录和行程容器之间的结构化关联感。  
  Marker detail now shows trip ownership more explicitly, making the relationship between a single marker and its parent trip container easier to understand.
- 更新 Roadmap、API Contract 与 README，收口年度回顾已完成状态，并同步记录行程集合二期能力边界。  
  Updated the roadmap, API contract, and README to mark annual review as completed and document the scope of trip collection phase two.

### Verified / 已验证

- `npm run test -- --run server/__tests__/appApiRoutes.spec.ts`
- `npm run test -- --run src/lib/api/__tests__/apiModules.spec.ts`
- `npm run test -- --run src/components/__tests__/TripTimelinePanel.spec.tsx`
- `npm run test -- --run src/modules/__tests__/TripDetailPage.spec.tsx`

### PR 待定 / TBD `feat: 地图回放模式一期 / Add map replay mode phase one`

### Added / 新增

- 在首页地图卡片内新增“地图回放模式”一期，支持播放/暂停、上一步、下一步、结束、速度选择和当前回放进度文案。  
  Added phase one of the map replay mode to the homepage map card, including play/pause, previous, next, end, speed selection, and current replay progress text.
- 新增 `src/lib/mapReplay.ts`，集中承载回放序列生成与状态文案逻辑。  
  Added `src/lib/mapReplay.ts` to centralize replay-sequence generation and replay status text.
- 新增地图回放技术文档 `docs/technical/map-replay-mode.md`，补充交互范围、世界地图归属规则、状态流和测试覆盖说明。  
  Added `docs/technical/map-replay-mode.md` to document interaction scope, world-map mapping rules, state flow, and test coverage.

### Changed / 变更

- `TravelMap` 新增回放控制条、移动圆点标签、手动过渡轨迹和世界地图下的国家级回放逻辑。  
  `TravelMap` now includes replay controls, a moving-dot label, temporary manual transition arcs, and country-level replay behavior on the world map.
- 世界地图回放与旅途轨迹不再依赖用户先选中国家；国内城市记录会自动映射到“中国”，国际记录映射到对应国家。  
  World-map replay and journey arcs no longer depend on pre-selecting a country; domestic city records automatically map to China and international records map to their target countries.
- 回放速度选择器改为复用标准 `FancySelect`，并为地图场景增加紧凑尺寸和 portal 下拉菜单渲染。  
  The replay speed selector now reuses the standard `FancySelect`, with a compact map-specific size and portal-rendered dropdown menu.
- 回放条和右下角颜色说明卡的布局做了重新收口，避免大视口下相互遮挡。  
  The replay bar and lower-right legend card layout were tightened to reduce overlap on larger viewports.

### Verified / 已验证

- `npm.cmd run test -- --run src/components/__tests__/TravelMap.spec.tsx`
- `npm.cmd run build`

## 2026-04-24

### PR 待定 / TBD `feat: 扩展统计中心、年度回顾与详情动效 / Expand stats center, annual review, and detail motion`

### Added / 新增

- 新增 `/yearbook/:year` 年度回顾页，按年份汇总旅行记录、照片、热力分布与高光摘要，并支持从统计中心继续钻取到行程详情。  
  Added the `/yearbook/:year` annual review page, summarizing each year with travel records, photos, heat distribution, and highlights, while keeping trip-detail drill-down from the stats center.

### Changed / 变更

- 扩展统计中心前后端数据结构与筛选能力，为年度回顾、热力分布、排行与行程明细提供更完整的数据支撑。  
  Expanded the stats center API, schemas, and client models so annual review, heat distribution, rankings, and trip details can share a richer data shape.
- 调整统计中心与相关样式表现，并补齐 `MarkerDetailPanel` 与 `GuideSearchPanel` 一致的遮罩淡入和右侧滑入动效。  
  Refined the stats center presentation and related styles, and aligned `MarkerDetailPanel` with `GuideSearchPanel` using the same fading backdrop and right-side slide-in motion.
- 同步补充前后端测试，覆盖统计服务、路由、应用入口与年度回顾相关回归场景。  
  Added and updated backend/frontend tests covering stats services, routes, app entry flow, and annual review regressions.

### Verified / 已验证

- 手动检查样式类切换：`detail-backdrop.is-visible`、`detail-panel.is-visible`
- `npm.cmd run test -- --run src/components/__tests__/MarkerDetailPanel.spec.tsx src/components/__tests__/GuideSearchPanel.spec.tsx`  
  因当前环境 `esbuild` 启动子进程触发 `spawn EPERM`，未能在沙箱内完成自动验证。  
  Could not complete automated verification in the sandbox because `esbuild` failed to start with `spawn EPERM`.

## 2026-04-23

### PR 待定 / TBD `chore: 扩充 demo 账号联调数据 / Expand demo account test data`

### Added / 新增

- 为默认 `demo` 账号继续补充联调用测试数据，新增 2 组长线行程、3 条未归入行程记录、更多配图与关联攻略。  
  Expanded the default `demo` account with additional integration-test data, including two more long-range trips, three unassigned markers, more photos, and linked guides.
- 补充 `guide_search_histories` 样例，便于联调搜索历史、后台用户明细和统计筛选相关场景。  
  Added sample `guide_search_histories` records to support local testing for search history, admin user detail, and stats filtering scenarios.

### Changed / 变更

- `db:seed` 现在会在本地库缺少 `marker_search_events` 表时自动跳过该部分写入，避免因为数据库未迁移完整而导致整包 demo 数据灌入失败。  
  `db:seed` now skips `marker_search_events` seeding when the local database does not contain that table, preventing the whole demo data import from failing on partially migrated databases.

### Verified / 已验证

- `npm run db:seed`
- 计数结果：`14 trips / 45 markers / 176 images / 12 guides / 4 search histories`  
  Count result: `14 trips / 45 markers / 176 images / 12 guides / 4 search histories`

### PR 待定 / TBD `refactor: 将统计中心拆到独立页面并重做热力图 / Move stats center to a standalone page and redesign the heatmap`

### Changed / 变更

- 统计中心不再直接挂在主页，新增独立 `/stats` 页面承接趋势、排行、热力分布与行程钻取，首页只保留轻量概览。  
  The statistics center no longer lives directly on the homepage; a standalone `/stats` page now hosts trends, rankings, heat distribution, and trip drill-down, while the homepage keeps only lightweight overview content.
- 统计热力图从伪地图矩形布局改为按强度排序的热力矩阵，只展示有数据的地区，避免出现一大片“0 值灰块”。  
  The heatmap has been changed from a faux-map rectangle layout to a ranked heat matrix that only shows regions with data, avoiding the large area of zero-value gray blocks.
- 行程详情页返回入口改为回到统计中心，匹配“统计页 -> 行程详情页”的浏览链路。  
  The trip-detail return path now goes back to the stats center so the “stats page -> trip detail page” browsing flow stays coherent.

### Verified / 已验证

- `npm run test -- --run src/modules/__tests__/App.spec.tsx src/modules/__tests__/TripStatsCenter.spec.tsx src/modules/__tests__/TripDetailPage.spec.tsx`
- `npm run build`

### PR 待定 / TBD `chore: 补充行程详情页联调样例数据 / Add local showcase seed data for trip detail page`

### Added / 新增

- 为默认演示账号补充可重复执行的高密度样例 seed 数据，当前包含 12 个演示行程、34 条旅行记录、133 张图片与 10 条关联攻略。  
  Added repeatable high-density showcase seed data for the default demo account, currently including 12 demo trips, 34 travel markers, 133 photos, and 10 linked guides.

### Changed / 变更

- 本地执行 `npm run db:seed` 后，可直接从首页统计中心钻取到 `/trips/:id`，验证行程详情页的跳转和展示效果。  
  After running `npm run db:seed`, the homepage statistics center can drill directly into `/trips/:id` so the trip-detail jump and presentation can be verified locally.

### Verified / 已验证

- `npm run db:seed`

### PR 待定 / TBD `refactor: 拆分前端纯逻辑和展示模型 / Split frontend pure logic and view models`

### Changed / 变更

- 抽取日期格式化、旅行记录排序、地图旅程弧线计算、攻略正文视图和后台页展示模型，减少组件内重复逻辑。  
  Extracted date formatting, marker sorting, map journey arc calculation, guide document rendering, and admin-page view models to reduce duplicated component logic.
- 将 store 写操作中的当前用户保持和搜索历史去重逻辑拆到辅助模块，便于后续复用和测试。  
  Moved active-user preservation and guide-search history dedupe helpers out of store actions for clearer reuse.
- 更新 README 和项目总览文档，补齐重构后的目录职责与新增开发原则。  
  Updated README and the project overview docs with the refactored module responsibilities and development guidance.
- 补充协作约定：PR 标题、PR 正文、CHANGELOG 和面向协作的文档更新需保持中英双语。  
  Added a collaboration rule requiring bilingual Chinese/English PR titles, PR bodies, CHANGELOG entries, and collaboration-facing documentation updates.
- 补充发布约定：PR 默认直接创建为 Ready for review，除非用户明确要求 Draft。  
  Added a publishing rule that PRs should be created as ready for review by default unless the user explicitly asks for a draft.

### Verified / 已验证

- `npm.cmd run build`
- `npm.cmd run test`

### PR 待定 / TBD `feat: 增加行程集合 / Add trip collections`

### Added / 新增

- 新增 MySQL `trips` 表、`visit_markers.trip_id` 归属字段与 `/api/trips` 创建、更新、删除接口。  
  Added the MySQL `trips` table, `visit_markers.trip_id`, and create/update/delete APIs for trip collections.
- 前端 `TravelStore` 增加 `trips`，新增行程创建入口，并支持新增旅行记录时选择所属行程。  
  Added `trips` to the frontend `TravelStore`, a trip creation entry point, and trip assignment when creating markers.

### Changed / 变更

- 行程时间线现在会在存在行程时按 Trip Collection 聚合展示记录，未归入行程的记录保留独立分组。  
  The timeline now groups records by Trip Collection when trips exist, while keeping unassigned records in a separate group.
- 更新 App API Contract 与 Roadmap，记录行程集合第一版能力边界。  
  Updated the App API Contract and Roadmap with the first Trip Collection scope.

### Verified / 已验证

- `/opt/homebrew/bin/node node_modules/typescript/bin/tsc -b`
- `/opt/homebrew/bin/node node_modules/vitest/vitest.mjs run src/components/__tests__/TripTimelinePanel.spec.tsx --environment jsdom`

## 2026-04-22

### PR 待定 / TBD `feat: 打通统计中心到行程详情页闭环 / Add trip-detail drill-down from the statistics center`

### Added / 新增

- 新增 `GET /api/trips/:id/detail`，为当前账号的单个行程聚合只读详情，覆盖总览、记录、照片、攻略与旅伴摘要。  
  Added `GET /api/trips/:id/detail` to aggregate a read-only trip detail for the current account, covering summary, markers, photos, guides, and companion snapshots.
- 新增前端 `/trips/:id` 详情页与专用样式，从首页统计中心可直接钻取进入行程详情。  
  Added a frontend `/trips/:id` trip detail page with dedicated styles, enabling direct drill-down from the homepage statistics center.

### Changed / 变更

- `App` 的手写路由升级为支持参数化路径，能够识别并恢复 `trip detail` 页面。  
  Upgraded the handcrafted `App` routing to support parameterized paths so the app can recognize and restore the trip-detail page.
- `TravelApp` 与统计中心点击行为不再只聚焦某条记录，而是跳转到独立行程详情页完成回看闭环。  
  `TravelApp` and the statistics-center click flow now navigate to a dedicated trip detail page instead of only focusing a marker.
- 更新 App API Contract、Roadmap 与 README，补齐行程详情接口和统计中心二期说明。  
  Updated the App API Contract, roadmap, and README to document the trip-detail API and the second phase of the statistics center.

### Verified / 已验证

- 运行新增 `trip detail` 后端服务测试、路由测试、前端页面测试、API 模块测试与主应用路由测试  
  Ran the new trip-detail backend service test, route test, frontend page test, API-module test, and main app routing test.
- 运行与统计中心相关的聚焦测试及 `npm run build`  
  Ran the focused statistics-center tests together with `npm run build`.

### PR 待定 / TBD `feat: 新增行程统计中心一期 / Add trip statistics center phase one`

### Added / 新增

- 新增 `GET /api/stats/overview` 统计聚合接口，支持按年份、范围、旅伴和行程筛选当前账号的统计数据。  
  Added `GET /api/stats/overview`, a statistics aggregation endpoint that supports filtering current-account stats by year, scope, companion, and trip.
- 新增首页第二屏“行程统计中心”，覆盖总览、年度趋势、月度分布、地区/城市排行、旅伴排行、行程排行、区域热力图与行程明细。  
  Added a second-screen trip statistics center on the homepage, covering summary KPIs, yearly trend, monthly distribution, region/city ranking, companion ranking, trip ranking, regional heatmaps, and trip details.
- 新增统计中心前端 API、展示模型、热力图组件与基础测试。  
  Added frontend stats APIs, presentation models, heatmap components, and baseline tests for the statistics center.

### Changed / 变更

- `TravelApp` 现在在 Hero 与主内容区之间挂载统计中心，并为行程详情页预留了从统计模块定位行程记录的跳转行为。  
  `TravelApp` now mounts the statistics center between the hero and the main content area, and reserves a trip-detail jump by focusing trip markers from the stats module.
- 更新 `docs/technical/app-api-contract.md`、`docs/technical/future-roadmap.md` 与 `README.md`，同步统计中心能力说明。  
  Updated `docs/technical/app-api-contract.md`, `docs/technical/future-roadmap.md`, and `README.md` to reflect the new statistics center capability.

### Verified / 已验证

- 计划运行统计路由、前端 API、统计中心组件和主应用相关测试，并执行 `npm run build`  
  Planned verification covers the stats route, frontend API, statistics-center component, main app tests, and `npm run build`.

### PR 待定 / TBD `docs: 补齐业务专项 prompt / Add domain-specific prompts`

### Added / 新增

- 新增 `docs/prompts/auth-prompt.md`、`admin-backoffice-prompt.md`、`app-api-prompt.md`、`prisma-mysql-prompt.md` 与 `local-dev-prompt.md`，分别覆盖认证、后台管理、主业务 API、Prisma/MySQL 以及本地联调场景。  
  Added `docs/prompts/auth-prompt.md`, `admin-backoffice-prompt.md`, `app-api-prompt.md`, `prisma-mysql-prompt.md`, and `local-dev-prompt.md` to cover authentication, admin backoffice, app API, Prisma/MySQL, and local dev workflows.

### Changed / 变更

- 更新 `docs/README.md` 与 `README.md` 的 Prompt 索引，按业务领域补充新的专项 Prompt 入口。  
  Updated the prompt indexes in `docs/README.md` and `README.md` to add the new domain-specific prompt entries.

### Verified / 已验证

- 手工校对新增 Prompt 与当前认证、后台、API、数据库和联调约束一致  
  Manually verified that the new prompts align with the current auth, admin, API, database, and local-development constraints.

### PR 待定 / TBD `docs: 重组文档目录分层 / Reorganize docs into grouped directories`

### Added / 新增

- 新增 `docs/technical/`、`docs/design/` 与 `docs/prompts/` 三层目录，用于分离技术文档、设计资料和 Prompt 文档。  
  Added `docs/technical/`, `docs/design/`, and `docs/prompts/` to separate technical docs, design assets, and prompt documents.

### Changed / 变更

- 将现有认证、接口、联调、性能、Roadmap 等技术文档迁移到 `docs/technical/`。  
  Moved the authentication, API, troubleshooting, performance, and roadmap documents into `docs/technical/`.
- 将 AI 协作文档与专项 Prompt 迁移到 `docs/prompts/`，将设计 Token 文档迁移到 `docs/design/`。  
  Moved AI collaboration and feature prompts into `docs/prompts/`, and moved the design-token document into `docs/design/`.
- 更新 `docs/README.md`、`README.md` 及相关文档互链，适配新的分类目录结构。  
  Updated `docs/README.md`, `README.md`, and inter-document links to match the new categorized layout.

### Verified / 已验证

- 手工检查新的目录结构与 Markdown 链接，确认旧路径引用已清理  
  Manually verified the new folder layout and Markdown links, confirming that old doc-path references were removed.

### PR 待定 / TBD `docs: 增加认证模块架构图 / Add auth module architecture diagram`

### Added / 新增

- 新增 `docs/technical/auth-architecture-diagram.md`，用 Mermaid 模块图梳理前端、路由、服务、会话、仓储、数据库与管理员权限的认证架构关系。  
  Added `docs/technical/auth-architecture-diagram.md` with Mermaid architecture diagrams covering the frontend, routes, services, sessions, repositories, database, and admin-permission boundaries.

### Changed / 变更

- 更新 `docs/README.md`、`README.md`、`docs/technical/auth-technical-design.md` 与 `docs/technical/auth-sequence-diagrams.md`，补充认证架构图入口。  
  Updated `docs/README.md`, `README.md`, `docs/technical/auth-technical-design.md`, and `docs/technical/auth-sequence-diagrams.md` to add entry points to the auth architecture diagrams.

### Verified / 已验证

- 手工校对架构图中的模块职责、依赖关系与当前认证代码结构一致  
  Manually verified that the module responsibilities and dependencies in the diagrams match the current authentication code structure.

### PR 待定 / TBD `docs: 增加认证时序图评审文档 / Add auth sequence-diagram review document`

### Added / 新增

- 新增 `docs/technical/auth-sequence-diagrams.md`，用 Mermaid 时序图展示注册、登录、会话恢复、登出与管理员访问后台的关键链路。  
  Added `docs/technical/auth-sequence-diagrams.md` with Mermaid sequence diagrams covering register, login, session restore, logout, and admin access.

### Changed / 变更

- 更新 `docs/README.md`、`README.md` 与 `docs/technical/auth-technical-design.md`，补充时序图文档入口。  
  Updated `docs/README.md`, `README.md`, and `docs/technical/auth-technical-design.md` to add entry points to the sequence-diagram document.

### Verified / 已验证

- 手工校对时序图与当前认证实现、Cookie Session 机制、管理员权限判断逻辑一致  
  Manually verified that the sequence diagrams match the current auth implementation, Cookie Session flow, and admin-permission checks.

### PR 待定 / TBD `docs: 补充认证与管理员权限技术方案 / Add auth, session, and admin-permission technical design`

### Added / 新增

- 新增 `docs/technical/auth-technical-design.md`，系统收口登录注册、Cookie Session、会话恢复、默认账号/默认同行人初始化以及管理员权限设计。  
  Added `docs/technical/auth-technical-design.md` to consolidate the login/register flow, Cookie Session design, session restore, default account/companion initialization, and admin-permission design.

### Changed / 变更

- 更新 `docs/README.md`、`README.md` 与 `docs/technical/auth-login-register.md`，补充正式认证技术方案文档入口。  
  Updated `docs/README.md`, `README.md`, and `docs/technical/auth-login-register.md` to add entry points for the formal authentication technical design.

### Verified / 已验证

- 手工校对文档中的实现链路、接口、角色策略与当前代码一致  
  Manually verified that the documented flows, APIs, role strategy, and implementation paths match the current codebase.

### PR 待定 / TBD `feat: 新增管理员后台总览页 / Add admin backoffice overview page`

### Added / 新增

- 新增 `Account.role` 角色字段、后台管理员鉴权能力和 `GET /api/admin/overview` 只读聚合接口。  
  Added the `Account.role` field, admin authorization support, and the read-only `GET /api/admin/overview` aggregate endpoint.
- 新增独立 `\/admin` 后台管理页，可查看系统用户、同行人、旅行记录、收藏攻略与搜索历史。  
  Added the standalone `\/admin` backoffice page to inspect accounts, companions, trip records, saved guides, and search history.

### Changed / 变更

- 默认种子账号现在会自动写入 `admin` 角色，普通注册用户默认保持 `member`。  
  The default seeded account now persists as `admin`, while newly registered users remain `member` by default.
- 前端 `App` 路由分流扩展到 `\/admin`，并在管理员主页面 Hero 中加入后台快捷入口。  
  The frontend `App` route switch now supports `\/admin`, and the main-app hero exposes a backoffice shortcut for admins.
- 更新 `docs/technical/app-api-contract.md`，补充 session `role` 返回与后台接口契约。  
  Updated `docs/technical/app-api-contract.md` with the session `role` response and the admin API contract.

### Verified / 已验证

- `npm run test -- --run server/__tests__/appApiRoutes.spec.ts src/lib/api/__tests__/apiModules.spec.ts src/modules/__tests__/App.spec.tsx src/modules/__tests__/AdminPage.spec.tsx`
- `npm run build`

### PR 待定 / TBD `feat: 新增注册登录与独立认证入口 / Add account registration, login, and authenticated app entry`

### Added / 新增

- 新增 `POST /api/auth/register`、`POST /api/auth/login`、`POST /api/auth/logout` 与 `GET /api/auth/session`，提供基础账号认证闭环。  
  Added `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/session` for a basic account-auth flow.
- 新增 `auth_sessions` Prisma 模型与 migration，并为 `accounts` 增加 `username`、`password_hash` 字段。  
  Added the `auth_sessions` Prisma model and migration, and extended `accounts` with `username` and `password_hash`.
- 新增独立登录/注册页，未登录时默认进入 `/auth`，登录后进入主旅行地图应用。  
  Added a dedicated auth page so unauthenticated users land on `/auth` before entering the travel app.

### Changed / 变更

- 现有业务接口改为根据当前登录会话解析 `accountId`，不再直接依赖默认账号作为运行时上下文。  
  Existing business APIs now resolve `accountId` from the active session instead of relying on the default account at runtime.
- 默认同行人初始化改为“按账号首次创建”，每个登录账号都有自己的初始旅行成员与独立数据空间。  
  Default companions are now initialized per account on first creation so each login gets its own seeded travel members and isolated data.
- 前端 `App` 入口升级为“会话恢复 + 独立认证页 + 已登录主应用”三层结构，并在首页 Hero 增加当前账号与退出登录入口。  
  The frontend `App` entry now handles session restore, a standalone auth screen, and the authenticated app shell, including account identity and logout in the hero.

### Verified / 已验证

- `vitest run src/lib/api/__tests__/httpClient.spec.ts src/lib/api/__tests__/apiModules.spec.ts src/modules/__tests__/App.spec.tsx server/__tests__/appApiRepositories.spec.ts`

### PR 待定 / TBD `ops: 切换到 Docker MySQL 本地方案 / Switch local database runtime to Docker MySQL`

### Added / 新增

- 新增 `scripts/start-local-dev-docker.sh` 与 `scripts/stop-local-dev-docker.sh`，提供明确的 Docker 本地联调入口。  
  Added `scripts/start-local-dev-docker.sh` and `scripts/stop-local-dev-docker.sh` as explicit Docker-based local dev entry points.

### Changed / 变更

- 更新 `package.json`，增加 `dev:all:docker` 与 `dev:stop:docker`。  
  Updated `package.json` with `dev:all:docker` and `dev:stop:docker`.
- 更新 README 与本地排查文档，补充 Docker MySQL 方案的启动与停止命令。  
  Updated the README and local troubleshooting docs to document Docker MySQL startup and shutdown commands.
- 将当前 Homebrew MySQL 中的 `personal_travel_daily` 数据导出并导入到 Docker MySQL 容器，切换后验证 `bootstrap` 数据链路仍然正常。  
  Exported the existing `personal_travel_daily` data from Homebrew MySQL and imported it into Docker MySQL, then verified the bootstrap data flow still works after the switch.

### Verified / 已验证

- `npm run dev:all:docker`
- `docker compose ps`
- `GET /api/app/bootstrap`

### PR 待定 / TBD `db: 引入首份 Prisma migration 历史 / Introduce the first Prisma migration history`

### Added / 新增

- 新增 `server/prisma/migrations/20260422_init/migration.sql`，将当前 MySQL 主数据 schema 固化为首份正式 Prisma migration。  
  Added `server/prisma/migrations/20260422_init/migration.sql` to capture the current MySQL app-data schema as the first formal Prisma migration.

### Changed / 变更

- 更新 `package.json`，新增 `db:migrate:deploy` 与 `db:migrate:status`，让开发/部署流程显式区分 migration 管理与快速实验同步。  
  Updated `package.json` with `db:migrate:deploy` and `db:migrate:status` to distinguish formal migration workflows from quick schema sync.
- 更新 README 与 MySQL 迁移设计稿，将 Prisma 工作流从默认 `db:push` 切换为默认 `db:migrate`。  
  Updated the README and MySQL migration design doc to make `db:migrate` the default Prisma workflow instead of `db:push`.

### Verified / 已验证

- `npx prisma migrate resolve --applied 20260422_init --schema server/prisma/schema.prisma`
- `npm run db:migrate:status`
- `npm run build`

### PR 待定 / TBD `docs/tooling: 增加一键联调脚本与环境排查文档 / Add one-click dev tooling and troubleshooting docs`

### Added / 新增

- 新增 `scripts/start-local-dev.sh` 与 `scripts/stop-local-dev.sh`，用于在 macOS / Linux 下串起 MySQL、`guide-api`、`app-api` 与前端 dev server。  
  Added `scripts/start-local-dev.sh` and `scripts/stop-local-dev.sh` to orchestrate MySQL, `guide-api`, `app-api`, and the frontend dev server on macOS / Linux.
- 新增 `docs/technical/local-dev-troubleshooting.md`，覆盖 MySQL、Prisma、端口占用、双后端联调与日志定位。  
  Added `docs/technical/local-dev-troubleshooting.md` covering MySQL, Prisma, port conflicts, dual-backend local debugging, and log locations.

### Changed / 变更

- 更新 `package.json`，增加 `dev:all` 与 `dev:stop`。  
  Updated `package.json` with `dev:all` and `dev:stop`.
- 更新 README、docs 索引与 MySQL 迁移设计稿，补齐联调脚本和环境排查文档入口，并将 `PR-12` 进度写回设计稿。  
  Updated the README, docs index, and MySQL migration design doc to include the new tooling and mark `PR-12` progress.

### Verified / 已验证

- `npm run build`

### PR 待定 / TBD `docs/test: 收尾数据库迁移文档与 repository 测试 / Finish migration document and repository coverage`

### Added / 新增

- 新增 `server/__tests__/appApiRepositories.spec.ts`，覆盖账户、旅伴、记录、收藏和搜索历史 repository 的关键 Prisma 调用契约。  
  Added `server/__tests__/appApiRepositories.spec.ts` to cover core Prisma call contracts for account, companion, marker, saved-guide, and guide-history repositories.

### Changed / 变更

- 更新 `.env.example`，补齐 MySQL / App API / Frontend / Guide API 分组说明。  
  Updated `.env.example` with clearer sections for MySQL, App API, frontend, and Guide API settings.
- 更新 `README.md` 与 `mysql-upgrade-design.md`，收尾数据库迁移文档中的剩余未完成项，并补充 Homebrew MySQL 启动方式、本期能力边界与后续待办。  
  Updated `README.md` and `mysql-upgrade-design.md` to finish the remaining migration-document items and add Homebrew MySQL setup, scope boundaries, and follow-up tasks.

### Verified / 已验证

- `npm run test -- --run server/__tests__/appApiRepositories.spec.ts`
- `npm run build`

### PR 待定 / TBD `test: 补齐前端 API client 与细粒度 CRUD 测试 / Add API client and fine-grained CRUD tests`

### Added / 新增

- 新增 `src/lib/api/__tests__/httpClient.spec.ts`，覆盖主业务 API client 的 base url 推导、query 拼接、JSON body、404 回退与错误消息提取。  
  Added `src/lib/api/__tests__/httpClient.spec.ts` to cover app API client base-url resolution, query serialization, JSON bodies, 404 fallback, and backend error extraction.
- 新增 `src/lib/api/__tests__/apiModules.spec.ts`，覆盖 bootstrap、companions、markers、saved-guides、guide-search-histories 的模块级 path / payload 转发。  
  Added `src/lib/api/__tests__/apiModules.spec.ts` to cover path and payload forwarding for bootstrap, companions, markers, saved guides, and guide search histories.

### Changed / 变更

- 扩展 `server/__tests__/appApiRoutes.spec.ts`，补齐旅伴更新、记录更新/删除、收藏查询过滤/删除、搜索历史创建等更细粒度的 CRUD 路由测试。  
  Expanded `server/__tests__/appApiRoutes.spec.ts` with finer CRUD route tests for companion updates, marker updates/deletes, saved-guide filter/delete flows, and guide-history creation.
- 更新 MySQL 设计稿中的测试清单与当前进度，将前端 API client 测试和记录 CRUD 测试标记为完成。  
  Updated the MySQL design doc to mark API client coverage and marker CRUD tests as completed.

### Verified / 已验证

- `npm run test -- --run src/lib/api/__tests__/httpClient.spec.ts src/lib/api/__tests__/apiModules.spec.ts server/__tests__/appApiRoutes.spec.ts`
- `npm run build`

### PR 待定 / TBD `test: 补齐主业务 API 与前端远端主链路回归测试 / Add regression coverage for app API and remote data flow`

### Added / 新增

- 新增 `server/__tests__/appApiRoutes.spec.ts`，覆盖主业务 API 的 bootstrap、旅伴校验、记录错误格式、攻略收藏与搜索历史路由级测试。  
  Added `server/__tests__/appApiRoutes.spec.ts` to cover bootstrap, companion validation, marker error formatting, saved guide, and guide history route-level tests for the application API.
- 更新 `src/modules/__tests__/App.spec.tsx`，将 `App` 主链路测试切到远端仓库模式，并校验远端 bootstrap 与搜索历史回写。  
  Updated `src/modules/__tests__/App.spec.tsx` to use the remote repository flow and verify remote bootstrap plus search-history writes.
- 更新 `DataSync` 与 `GuideSearchPanel` 相关回归测试，使其与云端主数据版本的真实行为保持一致。  
  Updated regression tests around `DataSync` and `GuideSearchPanel` so they match the cloud-first data flow.

### Verified / 已验证

- `npm run test -- --run server/__tests__/appApiRoutes.spec.ts src/modules/__tests__/App.spec.tsx src/components/__tests__/GuideSearchPanel.spec.tsx src/components/__tests__/DataSync.spec.tsx`
- `npm run build`

### PR 待定 / TBD `docs: 补齐主业务 API Contract 与文档索引 / Add app API contract and document index entries`

### Added / 新增

- 新增 `docs/technical/app-api-contract.md`，系统化说明主业务 API 的健康检查、bootstrap、旅伴、记录、攻略收藏与搜索历史接口契约。  
  Added `docs/technical/app-api-contract.md` to document health, bootstrap, companions, markers, saved guides, and guide search history contracts for the application API.

### Changed / 变更

- 更新 README、`docs/README.md` 与 MySQL 设计稿中的文档入口和开发清单，补齐 `PR-8`、`PR-9` 当前进度。  
  Updated the README, `docs/README.md`, and the MySQL design doc with document entry points and the latest `PR-8` / `PR-9` progress.

### PR 待定 / TBD `feat: 收口云端版 DataSync 与文档说明 / Refine cloud-mode DataSync and documentation`

### Changed / 变更

- 调整 `DataSync` 为云端版形态，仅保留导出当前聚合快照的能力，暂停应用内 JSON 导入恢复入口。  
  Refined `DataSync` for cloud mode by keeping export-only backup snapshots and disabling the in-app JSON restore entry.
- 将 `App.tsx`、`useTravelStoreActions.ts` 与 `GuideSearchPanel` 的主数据写入链路切到主业务 API，并同步收口“数据备份与恢复”相关文案。  
  Switched the main data write flow in `App.tsx`, `useTravelStoreActions.ts`, and `GuideSearchPanel` to the application API, and aligned backup-related copy with the cloud-first model.
- 更新 README 与 MySQL 技术设计文档，明确当前版本以 MySQL 主数据为准、JSON 仅作人工备份。  
  Updated the README and MySQL design document to clarify that MySQL is now the source of truth and JSON exports are manual backups only.

### Verified / 已验证

- `npm run build`

### PR 待定 / TBD `feat: 搭建 MySQL 应用 API 基础设施 / Bootstrap MySQL app API infrastructure`

### Added / 新增

- 新增 `server/appApiServer.ts` 与 `server/appApi/*` 骨架，提供独立的主业务 API 入口和健康检查路由。  
  Added `server/appApiServer.ts` and the `server/appApi/*` scaffold as the dedicated application API entry with health routes.
- 新增 `server/prisma/schema.prisma` 与 `server/prisma/seed.ts`，初始化 MySQL 数据模型和默认账户 seed。  
  Added `server/prisma/schema.prisma` and `server/prisma/seed.ts` to bootstrap the MySQL data model and default account seed.
- 新增 `docker-compose.yml`，提供本地 MySQL 8 与 Adminer 启动能力。  
  Added `docker-compose.yml` to provision local MySQL 8 and Adminer.
- 新增 `tsconfig.server.json` 与服务端 TypeScript 环境配置。  
  Added `tsconfig.server.json` and the TypeScript setup for the new server-side code.

### Changed / 变更

- 扩展 `package.json` 脚本和依赖，加入 `Fastify`、`Prisma`、`mysql2`、`tsx`、`zod` 与数据库初始化命令。  
  Expanded `package.json` scripts and dependencies with `Fastify`, `Prisma`, `mysql2`, `tsx`, `zod`, and database bootstrap commands.
- 更新 `.env.example`、README 和文档索引，补充主业务 API 与 MySQL 本地启动说明。  
  Updated `.env.example`, the README, and docs entry points with local startup guidance for the main API and MySQL.

### Verified / 已验证

- `npm run db:generate`
- `npm run build`

### PR [#11](https://github.com/louzhedong/personal_travel_daily/pull/11) `feat: 优化攻略搜索体验与权限边界 / Refine guide search experience and permission boundary`

### Added / 新增

- 新增主页面右下角“回到顶部”按钮，仅在主页面离开顶部后显示。  
  Added a bottom-right “back to top” button for the main page that only appears after the page scrolls away from the top.
- 新增京都官网与穷游论坛站点级正文适配测试，并补充主页面回顶按钮测试。  
  Added site-specific extraction tests for Kyoto Travel and Qyer Forum, plus a test for the main-page back-to-top button.

### Changed / 变更

- 优化攻略搜索阅读体验：支持目录、原文视图、主页面回顶入口，并调整搜索面板滚动与吸顶反馈。  
  Improved the guide-search reading experience with an outline, original view, main-page back-to-top entry, and refined panel scroll/sticky behavior.
- 强化攻略搜索与收藏联动，合并 `main` 新结构后继续保留自动搜索与权限边界逻辑。  
  Tightened guide-search and saved-guide integration, preserving auto-search and permission boundaries after adopting the new `main` structure.
- 针对 `kyoto.travel` 与穷游论坛增加站点级正文白名单/降级策略，让正文提取更稳定。  
  Added site-specific whitelisting and fallback strategies for `kyoto.travel` and Qyer Forum to stabilize article extraction.

### Fixed / 修复

- 修复攻略搜索中他人旅行记录仍可出现“解除关联”或“关联到当前记录”的权限边界问题。  
  Fixed permission-boundary regressions where other users' markers could still expose unlink or relink actions in the guide flow.
- 修复攻略面板原文阅读的滚动、置顶反馈与回顶入口可用性问题。  
  Fixed guide-panel original-reading issues around scrolling, sticky feedback, and top-return affordances.

### Verified / 已验证

- `vite build`
- `vitest run --environment jsdom --run src/modules/__tests__/App.spec.tsx src/components/__tests__/GuideSearchPanel.spec.tsx`

## 2026-04-21

### PR [#10](https://github.com/louzhedong/personal_travel_daily/pull/10) `Add trip timeline, refactor app architecture, and refresh docs / 新增行程时间线、重构应用架构并刷新文档`

### Added / 新增

- 新增行程时间线面板，支持按当前用户生成时间线、按年份筛选、按国内/国际筛选，并与地图和详情面板联动。  
  Added the new trip timeline panel with year filtering, domestic/international filtering, and map/detail linking.
- 新增 `useMapContext.ts`，统一地图范围、区域列表、选区和当前范围 marker 派生。  
  Added `useMapContext.ts` to centralize map scope, region options, selected region, and scope-level marker derivation.
- 新增 `useTravelStoreActions.ts`，统一 TravelStore 写操作。  
  Added `useTravelStoreActions.ts` to centralize TravelStore write actions.
- 新增 `AppHero.tsx`、`AppContent.tsx`、`AppOverlays.tsx`，拆分页面组合层。  
  Added `AppHero.tsx`, `AppContent.tsx`, and `AppOverlays.tsx` to split page composition out of `App.tsx`.
- 新增 `markerNavigation.ts`，统一按记录 ID 定位并打开详情的联动行为。  
  Added `markerNavigation.ts` to unify “focus marker by id and open detail” flows.
- 新增 `useLockedModal.ts`，统一弹窗 body lock 和 `Escape` 关闭逻辑。  
  Added `useLockedModal.ts` to unify body locking and `Escape` handling for modals.
- 新增 `docs/README.md` 作为文档索引页。  
  Added `docs/README.md` as the docs index.
- 新增 `docs/technical/future-roadmap.md` 作为后续功能规划文档。  
  Added `docs/technical/future-roadmap.md` as the agreed future roadmap.
- 新增 `CHANGELOG.md` 作为项目长期变更记录。  
  Added `CHANGELOG.md` as a durable project history file.

### Changed / 变更

- 将数据备份与恢复从侧栏常驻模块调整为由旅行记录模块触发的弹窗交互。  
  Moved backup and restore into a modal launched from the travel records module.
- 优化时间线筛选文案、下拉样式、隐藏滚动条和边缘渐隐效果。  
  Refined the timeline filter copy, dropdown styling, hidden scrollbar behavior, and edge fade treatment.
- 调整旅行记录详情头部布局，稳定“国内旅行 / 国际旅行”标签的位置。  
  Refined the marker detail header layout and stabilized the placement of the travel scope tag.
- 优化旅行记录模块中的旅伴筛选控件样式。  
  Restyled the travel companion filter in the records module.
- 将样式系统从单一超大 `src/styles/index.css` 拆分为 `base.css`、`layout.css`、`home.css`、`responsive.css` 和 `components/*.css`。  
  Split the style system from the old monolithic `src/styles/index.css` into `base.css`, `layout.css`, `home.css`, `responsive.css`, and `components/*.css`.
- 重构 `App.tsx`，通过提取页面组合层、travel store actions 和地图上下文，让其更接近容器层。  
  Refactored `App.tsx` into a thinner container by extracting page composition, travel store actions, and map context handling.
- 刷新 README 与 `docs/` 文档，使其与当前功能、代码结构和本地 Node 20 工作流保持一致。  
  Refreshed README and the docs set so they match the current product, code structure, and local Node 20 workflow.
- 扩展未来功能路线图，并将“数据库升级到 MySQL”提升为最优先事项。  
  Expanded the roadmap and promoted “migrate the database to MySQL” to the top future priority.

### Fixed / 修复

- 修复时间线渐隐效果不明显的问题。  
  Fixed timeline fade behavior so the scroll affordance is visible.
- 修复旅行记录详情中范围标签位置不稳定的问题。  
  Fixed unstable placement of the travel scope badge in the marker detail panel.
- 修复本地启动说明与实际 Node.js 20 要求不一致的问题。  
  Fixed local startup guidance so it reflects the actual Node.js 20 requirement.

### Verified / 已验证

- `vite build`

### Changed / 变更

- 合并 PR [#9](https://github.com/louzhedong/personal_travel_daily/pull/9) `[codex] Align project docs and prompts`。  
  Merged PR [#9](https://github.com/louzhedong/personal_travel_daily/pull/9) `[codex] Align project docs and prompts`.
- 刷新 README，并补充项目总览文档。  
  Refreshed the README and added a project overview document.
- 重写攻略功能说明与设计文档，使其与当时的产品能力保持一致。  
  Rewrote the guide feature and design docs to match the product surface at that point.
- 更新项目级与攻略专项 prompt，补齐攻略收藏、关联规则与使用方式说明。  
  Updated project and guide prompts to reflect saved guides, linking rules, and prompt usage.

## 2026-04-20

### Added / 新增

- 合并 PR [#6](https://github.com/louzhedong/personal_travel_daily/pull/6) `feat: 数据备份恢复与导入预览 / Add data backup restore and import preview`。  
  Merged PR [#6](https://github.com/louzhedong/personal_travel_daily/pull/6) `feat: 数据备份恢复与导入预览 / Add data backup restore and import preview`.
- 新增 `DataSync`，支持 JSON 导出、导入预览、按 ID 合并恢复和 CSV 预览导出。  
  Added `DataSync` with JSON export, import preview, merge-by-id restore, and CSV export for previews.
- 新增存储层导入校验、归一化、合并统计和合并辅助能力。  
  Added storage-side validation, normalization, merge stats, and merge helpers for data restore.
- 新增数据备份与恢复相关测试覆盖。  
  Added tests for storage merge logic and the `DataSync` flow.
- 合并 PR [#7](https://github.com/louzhedong/personal_travel_daily/pull/7) `feat: add saved guide sidebar and travel guide linking`。  
  Merged PR [#7](https://github.com/louzhedong/personal_travel_daily/pull/7) `feat: add saved guide sidebar and travel guide linking`.
- 新增统一的攻略收藏侧栏，支持筛选、查看原文和定位到对应旅行记录。  
  Added a unified saved guides sidebar with filters, source links, and jump-to-record behavior.
- 新增攻略收藏、取消收藏、关联到旅行记录与解除关联能力。  
  Added save, unsave, link, and unlink actions for guides.
- 在旅行记录详情中新增相关攻略展示。  
  Added related guide rendering inside marker detail.

### Changed / 变更

- 增强 `guideRepository`，补齐查询、按 marker 过滤、排序与 upsert 去重能力。  
  Enhanced `guideRepository` with lookup helpers, marker filtering, sorting, and upsert deduplication.
- 优化收藏抽屉、滚动阴影提示与详情头部操作区交互。  
  Polished drawer interactions, scroll shadow hints, and detail header actions around the guide workflow.

## 2026-04-18

### Added / 新增

- 合并 PR [#4](https://github.com/louzhedong/personal_travel_daily/pull/4) `feat: add guide search and crawling workflow`。  
  Merged PR [#4](https://github.com/louzhedong/personal_travel_daily/pull/4) `feat: add guide search and crawling workflow`.
- 新增攻略搜索前端主流程，包括本地历史与缓存、远程 provider 回退、结构化摘要与正文片段展示。  
  Added the full guide search frontend flow with local history/cache, remote provider fallback, summaries, and snippets.
- 新增本地攻略聚合服务，包括适配器、文件缓存、Geoapify POI 接入和国内 POI fallback。  
  Added the local guide aggregation service with adapters, file cache, Geoapify POI integration, and domestic POI fallback data.
- 支持从首页和记录详情打开攻略搜索。  
  Added entry points to open guide search from both the homepage and the record detail panel.

### Changed / 变更

- 搜索历史改为按规范化关键词去重。  
  Deduplicated search history by normalized keyword.
- 对本地整理内容隐藏误导性的“查看原文”入口。  
  Hid misleading “view original” links for locally curated entries.
- 当实时 POI 未命中时，自动回退到本地目的地数据。  
  Added fallback behavior when realtime POI results are empty.

### Documentation / 文档

- 合并 PR [#5](https://github.com/louzhedong/personal_travel_daily/pull/5) `docs: add guide search docs and prompt packs`。  
  Merged PR [#5](https://github.com/louzhedong/personal_travel_daily/pull/5) `docs: add guide search docs and prompt packs`.
- 补充攻略搜索文档与可复用 Prompt 文档。  
  Added guide search docs and reusable prompt packs.
- 更新 README 与项目 Prompt，使其反映攻略搜索架构。  
  Updated README and project prompts to reflect the guide search architecture.

## 2026-04-17

### Added / 新增

- 合并 PR [#3](https://github.com/louzhedong/personal_travel_daily/pull/3) `feat: 实现旅行记录详情面板及编辑功能`。  
  Merged PR [#3](https://github.com/louzhedong/personal_travel_daily/pull/3) `feat: 实现旅行记录详情面板及编辑功能`.
- 新增旅行记录详情面板，支持多图预览和全屏灯箱。  
  Added the travel record detail panel with multi-image preview and fullscreen lightbox.
- 新增旅行记录编辑能力，支持修改描述和图片链接。  
  Added inline editing for notes and image links.
- 新增 `MarkerDetailPanel` 与 `MarkerList` 测试。  
  Added tests for `MarkerDetailPanel` and `MarkerList`.

### Changed / 变更

- 隔离详情面板滚动，避免底层页面滚动串联。  
  Isolated detail-panel scrolling to avoid background scroll chaining.
- 增加更清晰的删除权限提示。  
  Added clearer permission hints for delete actions.
- 统一详情面板幽灵按钮样式。  
  Unified ghost-button styling for record detail actions.

## 2026-04-14

### Added / 新增

- 合并 PR [#1](https://github.com/louzhedong/personal_travel_daily/pull/1) `feat: refactor persistence and enrich map journey UX`。  
  Merged PR [#1](https://github.com/louzhedong/personal_travel_daily/pull/1) `feat: refactor persistence and enrich map journey UX`.
- 引入 repository 分层，重构前端持久化方案。  
  Introduced the repository layer for client-side persistence.
- 将 IndexedDB schema 拆分为独立 object store，并补齐仓库层测试。  
  Split the IndexedDB schema into dedicated object stores and added repository-level tests.
- 新增地图旅途轨迹、方向箭头与 hover 路线信息展示。  
  Added map journey arcs, direction arrows, and route hover information.

### Changed / 变更

- App 初始化改为支持异步 store 加载。  
  Refactored app initialization to support asynchronous store loading.
- 保持对旧版数据的向后兼容迁移。  
  Kept backward compatibility with legacy data migration.
- 地图区块 hover 提示从简单计数升级为轻量记录预览。  
  Improved region hover previews from plain counts to lightweight record summaries.

### Documentation / 文档

- 合并 PR [#2](https://github.com/louzhedong/personal_travel_daily/pull/2) `docs: add reusable AI prompt docs for project collaboration`。  
  Merged PR [#2](https://github.com/louzhedong/personal_travel_daily/pull/2) `docs: add reusable AI prompt docs for project collaboration`.
- 新增 `system-prompt.md`、`task-prompt.md`、`design-prompt.md` 与 `project-ai-prompt.md`。  
  Added `system-prompt.md`, `task-prompt.md`, `design-prompt.md`, and `project-ai-prompt.md`.
- 在 README 中加入 Prompt 文档入口。  
  Updated the README documentation index with prompt entries.
