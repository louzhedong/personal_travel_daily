# 项目总览 / Project Overview

这份文档是对当前仓库所有已落地模块的总览，按"产品能力 → 模块职责 → 分层与关键文件 → 约束与规范"四段展开。读完本文即可定位任何一个模块的入口，再按链接深入对应的专项设计文档。

This document gives a full overview of every shipped module in the repository. It is organized as Product capabilities → Module responsibilities → Layering and key files → Constraints and conventions. After reading this, you can locate the entry point of any module and then drill into the feature-specific design docs.

---

## 1. 产品能力 / Product Capabilities

### 1.1 地图与记录录入 / Map and Marker Capture

- 国内 / 国际双范围切换、区域 hover 反馈与图例说明。
- 地图区域点击打开记录弹窗，城市列表自动填充。
- 记录表单支持日期区间、游记描述、多图上传，以及标签、心情、天气、交通方式、预算级别等轻量元数据。

Summary: The homepage map supports domestic / international switching, region hover, legend guidance, and a click-to-capture marker creation flow.

### 1.2 旅行记录列表与详情 / Marker List and Detail

- 当前范围下的记录列表，支持按旅伴筛选。
- 仅当前活跃用户可编辑 / 删除自己的记录。
- 详情面板支持游记、图片、标签、轻量元数据、关联攻略、所属行程的轻量查看与编辑。

Summary: Marker list and detail panel provide per-scope browsing, permission-aware editing, and trip / guide cross-linking.

### 1.3 旅伴管理 / Companion Management

- 新增旅伴、切换当前记录用户、以颜色区分不同旅伴。
- 当前版本只开放新增与更新，删除能力留到后续归档策略完善后再开放。
- `/companions/:id/memories` 已提供旅伴共同回忆页，把某位旅伴相关的记录、年度节奏、共同地点、主题、行程、照片、攻略和里程碑整理成私密纪念册。

Summary: Companions are first-class entities that control coloring and ownership, with create / update but no delete for now; companion memories now provide a private retrospective page for one companion.

### 1.4 时间线 / Timeline

- 基于当前活跃用户聚合，按年份、按国内 / 国际筛选。
- 支持多选旅行记录批量归属到行程，或移出行程。
- 点击时间线条目联动地图与详情面板。

Summary: Timeline aggregates the current companion's markers, supports filtering, batch trip assignment, and cross-module linking.

### 1.5 行程集合（Trip Collection 二期）/ Trip Collections (Phase 2)

- 行程作为独立对象，支持创建、编辑、删除，并可从时间线批量整理记录归属。
- 支持封面设置、备注编辑与日期修改。
- 独立行程详情页 `/trips/:id` 提供总览、记录、照片、关联攻略与旅伴摘要的轻编辑回看。

Summary: Trip Collection is a true content container with create / edit / delete, batch marker assignment, cover management, and a dedicated detail page.

### 1.5B 攻略提炼为行前清单 / Guide-to-Checklist Workflow

- 支持从攻略搜索结果直接发起“生成行前清单”，不要求先收藏。
- 自动优先基于攻略正文提炼 `出发前 / 旅途中 / 已完成` 三段清单项，提炼失败时回退到摘要版生成。
- 清单绑定到某个行程，在 `/trips/:id` 中内嵌展示，并可在 `/trips/:id/checklist` 独立放大查看。
- 用户可手动新增、编辑、删除与切换清单项阶段。

Summary: Guide-to-checklist turns search results into trip-bound checklist items with automatic extraction, manual editing, and both embedded and expanded views.

### 1.5C 行前规划工作台 / Trip Planning Workspace

- `/trips/:id` 内新增“行前规划”Tab，管理 trip-bound 愿望地点、攻略来源、备注、优先级、预计日期和状态。
- 规划项绑定 `accountId + tripId + createdByCompanionId`，只属于已存在行程；可手动新增、从攻略搜索加入，也可从全局愿望地图导入。
- 攻略搜索结果支持“加入行程规划”，与“生成行前清单”并存，分别承接“想去地点”和“准备事项”两种语义。
- 从愿望地图导入规划项会写入 `sourceWishlistId`，用于在愿望项上展示“已导入”的行程标记。
- 旅行结束后可把未转换规划项转为正式 `VisitMarker`，服务端写入 `convertedMarkerId` 并阻止重复转换。
- 管理后台只读巡检规划项统计和明细，不提供新增、编辑、删除或代用户转记录。

Summary: Trip Planning Workspace adds a trip-bound pre-travel planning loop for desired places, guide-source context, priorities, planned dates, and post-trip conversion into visit markers.

### 1.5D 愿望地图 / Wishlist Map

- 愿望地图是账号级长期目的地池，`WishlistItem` 绑定账号、创建旅伴、地点、备注、优先级、目标年份和可选攻略来源。
- 首页地图区域和攻略搜索结果都可加入愿望地图；前端会先做同旅伴、同地点去重提示，服务端也会用 `409 CONFLICT` 兜底。
- 愿望面板支持按优先级、国内 / 国际筛选，并可按最近加入、优先级和目标年份排序。
- 愿望项可编辑标题、城市、备注、优先级和目标年份，也可一键转成新行程并自动创建首条行前规划。
- 首页地图区分已访问、仅愿望和两者都有的区域；hover 提示会列出愿望城市，提供比区域高亮更细的城市级表达。

Summary: Wishlist Map is the account-level long-range planning pool that connects map selection, guide search, trip planning import, and one-click trip creation.

### 1.5E Story Studio / Trip Story

- `/trips/:id/story` 将单次行程整理为私有 Story Studio，自动组合封面、精选瞬间、故事摘要、故事徽章、智能序言、路线回放海报、时间线、照片、攻略摘录和行前清单回顾。
- 故事页复用 `GET /api/trips/:id/detail`，不新增 story 专用接口或独立持久化；精选照片元数据由行程详情“素材”Tab 批量维护。
- 支持杂志风 / 纪念册 / 明信片模板切换、动态 SVG 长图导出、方形 / 竖版分享卡导出、浏览器原生打印 / PDF 导出，并提供 print 专用样式。

Summary: `/trips/:id/story` turns one trip into a private Story Studio with story badges, a route replay poster, featured-photo composition, share-card SVG export, long-image export, and print/PDF output.

### 1.5F 影像编辑台 / Photo Curation Hub

- `/photos` 提供账号级影像编辑台，集中整理所有旅行记录图片。
- 支持按行程、旅伴、年份、精选状态和说明状态筛选照片。
- 支持标记 / 取消精选与补充照片说明，结果复用 `VisitMarkerImage.isFeatured/caption/curatedSortOrder`。
- 首页、行程详情“素材”Tab、年度回顾照片墙和 Story Studio 都提供入口。

Summary: `/photos` provides an account-level photo curation desk for filtering, featuring, and captioning travel photos that power trip detail, annual review, Story Studio, and companion memories.

### 1.6 统计中心 / Stats Center

- 独立统计中心 `/stats`，覆盖总览 KPI、旅行成就、年度趋势、月度分布、地区 / 城市 / 旅伴 / 行程排行、区域热力图、标签 / 心情 / 交通 / 预算级别排行与行程明细。
- 国内使用中国省级地图热力，国际使用世界地图热力。
- 可从统计中心一键钻取到行程详情。
- 成就按当前筛选实时计算状态、进度与证据；默认全量视图会持久化首次解锁时间。

Summary: `/stats` centralizes filtered stats, achievements, rankings, trends, and heatmaps with drill-down into trip detail.

### 1.7 年度回顾 / Annual Review

- `/yearbook/:year` 独立年度回顾页，按年份生成私有年鉴式回看。
- 汇总年度摘要、高光、年度成就、月度节奏、热力分布、照片与关联攻略，并支持浏览器原生打印 / PDF 导出；照片列表优先使用精选照片，缺省时保持日期流回退。
- 支持从年度回顾继续钻取到单次行程详情。

Summary: `/yearbook/:year` provides a private yearbook-style retrospective per year, including annual achievements and links through to individual trip details.

### 1.8 地图回放 / Map Replay (Phase 1)

- 在首页地图卡片内嵌入回放控制条：上一步、播放 / 暂停、下一步、结束与速度选择。
- 回放序列按时间升序生成，用移动圆点与当前停留点标签展示。
- 自动播放与手动步进都会沿旅途轨迹移动；世界地图下国内城市自动归属到"中国"，与国际记录一起形成国家级路径。

Summary: The map replay phase-one feature adds in-card replay controls over existing journey arcs, with unified country-level mapping for world view.

### 1.9 攻略搜索 / 收藏 / 关联 / Guide Search, Save, Link

- 支持本地 mock / 远程 API 双 provider，可切换；远程路径会进一步适配本地 Ollama LLM 模式。
- 搜索结果摘要、正文阅读增强、搜索历史、收藏、关联到旅行记录、解除关联完整闭环。
- 收藏与关联是两种不同语义，分别独立去重。

Summary: Guide search / save / link ship as an end-to-end loop, with pluggable local or remote providers and optional on-device LLM enhancement.

### 1.10 数据备份 / Data Backup

- 保留"导出当前聚合快照为 JSON"能力，作为人工备份。
- 应用内的 JSON 导入恢复入口已下线，云端数据以 MySQL 为准。

Summary: Data backup is reduced to a manual JSON snapshot export; the source of truth now lives in MySQL.

### 1.11 认证与会话 / Auth and Session

- `/login` 与 `/register` 独立路由，旧 `/auth` 自动兼容到 `/login`。
- 使用 Cookie Session，浏览器持有原始 token，数据库只存 SHA-256 hash。
- 注册后立即自动登录；刷新页面可通过 `GET /api/auth/session` 恢复。
- `/settings` 已提供账号资料、昵称修改、密码修改、多设备会话管理和数据导出入口。
- 账号角色只有 `admin` 与 `member` 两种；默认种子账号 `demo` 为 `admin`。

Summary: Auth uses Cookie Session with hash-only storage, and `/settings` now provides profile, password, session, and data-export governance. Only `admin` and `member` roles exist, and the default seed account is admin.

### 1.12 管理员后台 / Admin Backoffice

- 独立 `/admin` 后台页，仅 `admin` 可进入；后端 `GET /api/admin/overview` 做最终权限裁决。
- 后台只读展示账户、旅伴、旅行记录、行前规划、收藏攻略与搜索历史的系统级概览。
- 后台已新增质量巡检摘要，覆盖记录缺图、未归行程、行程缺封面、照片缺说明、过期规划、攻略未关联、来源异常、搜索失败升高和旅伴回忆快照过期。
- 后台二期新增质量问题筛选、详情抽屉、只读定位跳转、应用内提醒和管理员审计日志，仍不在后台直接修复业务数据。

Summary: `/admin` is an admin-only read-only operations page for accounts, companions, markers, planning items, saved guides, search history, quality issues, in-app reminders, and audit logs; permissions are ultimately enforced by the backend.

---

## 2. 模块职责与关键文件 / Module Responsibilities and Key Files

### 2.1 前端应用壳 / Frontend App Shell

- `src/modules/App.tsx`：应用顶层容器。会话恢复、路由分流（`/login`、`/register`、`/admin`、`/`、`/photos`、`/trips/:id`、`/trips/:id/story`、`/trips/:id/checklist`、`/stats`、`/yearbook/:year` 等）、根据角色决定进入主应用或后台。
- `src/modules/settings/AccountSettingsPage.tsx`：账号设置页，承接资料、密码、会话治理和数据导出。
- `src/modules/app/AppHero.tsx` / `AppContent.tsx` / `AppOverlays.tsx`：页面组合层。
- `src/modules/app/useMapContext.ts`：地图范围、区域列表、选区、当前范围 marker 派生。
- `src/modules/app/useTravelStoreActions.ts`：TravelStore 写操作（远端写入 + 本地回填）。
- `src/modules/app/travelStoreActionHelpers.ts`：store 写操作公共辅助逻辑（活跃用户保持、搜索历史去重等）。
- `src/modules/app/markerNavigation.ts`：按记录 ID 聚焦地图并打开详情。
- `src/modules/app/useLockedModal.ts`：弹窗的 body lock 与 `Escape` 关闭。
- `src/components/ui/Dialog.tsx`：通用弹窗，负责打开期间锁定页面滚动并隔离弹窗内部滚动穿透。

Summary: The frontend shell separates routing, page composition, map state, store actions, helpers, navigation, and modal locking.

### 2.2 业务组件 / Business Components

- `src/components/TravelMap.tsx`：地图主体，承载国内 / 国际切换、hover、轨迹弧线、回放控制条与移动圆点标签。
- `src/components/MarkerList.tsx` / `MarkerDetailPanel.tsx`：旅行记录的列表与详情。
- `src/components/TripTimelinePanel.tsx`：时间线面板，兼任"整理模式"与行程管理台。
- `src/components/GuideSearchPanel.tsx`：攻略搜索、收藏、关联、“生成行前清单”与“加入行程规划”面板。
- `src/components/trips/TripPlanningBoard.tsx`：行程详情“行前规划”Tab 的共享工作台，承接新增、编辑、删除、愿望导入、优先级筛选和转旅行记录。
- `src/components/trips/TripChecklistBoard.tsx`：行前清单的共享展示与编辑组件，供行程详情页和放大页复用。
- `src/components/DataSync.tsx`：数据备份（仅导出）。

Summary: Components follow module-scoped responsibilities; cross-feature flows use shared helpers instead of ad-hoc wiring.

### 2.3 纯逻辑与展示模型 / Pure Logic and View Models

- `src/lib/date.ts`：日期区间、年份、天数工具。
- `src/lib/markerSorting.ts`：旅行记录访问时间排序。
- `src/lib/mapJourneyArcs.ts`：地图旅程弧线的纯计算。
- `src/lib/mapReplay.ts`：地图回放序列生成与状态文案。
- `src/lib/guides/guideDocumentView.tsx`：攻略正文视图、高亮、HTML 清洗。
- `src/modules/admin/adminPageModel.ts`：后台管理页的展示模型、汇总统计、质量筛选、定位目标和审计标签。
- `src/components/admin/AdminQualitySummaryPanel.tsx` / `AdminQualityIssueList.tsx` / `AdminAccountQualityPanel.tsx` / `AdminQualityFiltersPanel.tsx` / `AdminQualityIssueDrawer.tsx` / `AdminQualityReminderPanel.tsx` / `AdminAuditTrailPanel.tsx`：后台质量巡检、筛选钻取、提醒和审计展示。
- `src/modules/stats/TripStatsCenter.tsx`：统计中心页面主体，包含筛选、摘要、成就、排行、热力图与成就详情弹窗。
- `src/modules/companions/CompanionMemoriesPage.tsx` / `companionMemoriesPageModel.ts`：旅伴共同回忆页与展示模型，从 companion memory DTO 派生页面文案、KPI、年度轨迹和照片 alt。
- `src/modules/photos/PhotoCurationPage.tsx` / `photoCurationPageModel.ts`：影像编辑台页面与展示模型，从全局照片整理 DTO 派生筛选、预览、待整理清单和照片 alt。
- `src/modules/trips/tripStoryPageModel.ts` / `tripStoryExport.ts`：旅行故事页展示模型与 SVG 导出 helper，从 `TripDetailResponseDto` 派生故事徽章、路线回放海报、分享卡模型、长图和分享卡导出内容。
- `src/modules/yearbook/AnnualReviewPage.tsx`：年度回顾页面主体，包含年度成就板块。

Summary: Pure logic is pulled out of components into `src/lib` and per-module view models so that rendering stays shallow.

### 2.4 前端数据层 / Frontend Data Layer

- `src/lib/api/httpClient.ts`：主业务 API 客户端基础能力，默认携带 `credentials`，本地开发优先走同源 `/api` 代理。
- `src/lib/api/authApi.ts`：`register` / `login` / `fetchSession` / `logout`。
- `src/lib/api/*Api.ts`：`bootstrap`、`companions`、`markers`、`savedGuides`、`guideSearchHistory`、`trips`、`stats`、`photoCuration` 等领域客户端，其中 `tripsApi.ts` 继续承接 checklist 与 planning 子资源。
- `src/lib/api/accountSettingsApi.ts`：账号设置、密码修改和会话治理客户端。
- `src/lib/repositories/remoteTravelStoreRepository.ts`：组合多个 API 调用，为页面层提供稳定边界。
- `src/lib/repositories/*`：IndexedDB 仅保留攻略缓存与本地辅助状态，不再作为主数据持久化。

Summary: The frontend talks to the backend through typed API modules and a remote repository; IndexedDB is no longer the source of truth.

### 2.5 主业务 API（app-api）/ Main Business API

- `server/appApiServer.ts`：Fastify 入口。
- `server/appApi/routes/*`：`auth` / `bootstrap` / `companions` / `markers` / `savedGuides` / `guideSearchHistories` / `trips` / `photoCuration` / `stats` / `admin` 等路由。
- `server/appApi/routes/accountSettings.ts`：账号设置、密码修改和会话治理路由。
- `server/appApi/services/companionMemoryService.ts`：旅伴共同回忆聚合、24 小时快照命中、过期重建和强制刷新。
- `server/appApi/services/admin/qualityReport.ts`：后台质量巡检规则，按严重程度生成只读问题清单。
- `server/appApi/services/adminAuditService.ts`：后台治理动作审计日志的写入、查询和 DTO 序列化。
- `server/appApi/services/tripChecklistService.ts` / `tripPlanningService.ts` / `tripChecklistGenerationService.ts` / `guideDocumentService.ts`：行前清单查询、规划项写操作、转记录规则、攻略正文提炼与回退策略。
- `server/appApi/services/*`：业务规则（注册 / 登录、bootstrap 聚合、stats 聚合、成就解锁持久化、trip detail、photo curation、admin overview 等）。
- `server/appApi/auth/*`：`requestAuth`（恢复 / 鉴权）、`session`（token、cookie 序列化）、`password`（hash / verify）。
- `server/appApi/services/accountSettingsService.ts`：昵称、密码和多设备会话治理规则。
- `server/appApi/repositories/*`：Prisma 查询封装。
- `server/appApi/serializers/*`：DB 模型 → 前端模型。
- `server/appApi/errors.ts`：统一业务错误。
- `server/prisma/schema.prisma`：MySQL 数据模型，包括成就首次解锁记录 `AchievementUnlock` 与行程规划项 `TripPlanningItem`。
- `server/prisma/migrations/*`：正式 migration 历史。
- `server/prisma/seed.ts`：默认演示账号与 demo 数据。

Summary: The app-api service uses a clear routes → schemas → services → repositories → serializers → errors stack on top of Prisma.

### 2.6 攻略搜索服务（guide-api）/ Guide Search Service

- `server/guideApiServer.mjs`：HTTP 入口。
- `server/guideSearchEngine.mjs`：搜索与排序逻辑。
- `server/guideFileStore.mjs`：文档缓存。
- `server/adapters/*`：外部站点与 POI 数据适配器。
- 可选地通过 Ollama LLM 进行语义搜索、重排和摘要增强。

Summary: The guide-api is a standalone Node service for search, POI adapters, file cache, and optional local-LLM augmentation.

### 2.7 样式体系 / Style System

- `src/styles/base.css`：全局变量与基础样式（含全局隐藏滚动条等硬约束）。
- `src/styles/layout.css`：壳层布局与弹窗。
- `src/styles/home.css`：首页头部视觉。
- `src/styles/responsive.css`：响应式覆盖。
- `src/styles/components/*.css`：按业务模块拆分的组件样式。
- `src/styles/index.css` 仅负责聚合导入。

Summary: Styles are modular per feature; global invariants like hidden scrollbars live in `base.css` and should not be altered casually.

---

## 3. 分层与边界 / Layering and Boundaries

### 3.1 前端层次 / Frontend Layering

1. 页面容器层：`App.tsx`、页面级路由分流。
2. 页面组合层：`AppHero` / `AppContent` / `AppOverlays` 与各 Page 组件。
3. 交互与业务组件层：地图、时间线、详情面板、攻略面板、数据备份等。
4. 状态与动作层：`useMapContext`、`useTravelStoreActions`、`useLockedModal`、`travelStoreActionHelpers`。
5. 数据客户端层：`httpClient` + 领域 API + `remoteTravelStoreRepository`。
6. 纯逻辑层：`src/lib/*` 与 `src/modules/**/<module>Model.ts` 展示模型。

Summary: Frontend is pushed from containers down to pure logic, so rendering and persistence never mix.

### 3.2 后端层次 / Backend Layering

1. HTTP 入口：`appApiServer.ts` / `guideApiServer.mjs`。
2. 路由层：`routes/*`，负责入参校验、错误封装、Set-Cookie。
3. 服务层：`services/*`，承接业务规则与事务。
4. 鉴权层：`auth/requestAuth.ts`，统一恢复账号、普通鉴权、管理员鉴权。
5. 仓储层：`repositories/*`，封装 Prisma 查询。
6. 序列化层：`serializers/*`，把 DB 模型转换为前端所需 DTO。
7. 持久化层：Prisma / MySQL + 正式 migration 历史。

Summary: Backend follows a clean Routes → Services → Auth → Repositories → Serializers → Prisma pipeline.

### 3.3 数据边界 / Data Boundaries

- 主业务数据：MySQL 为单一事实源，前端通过主业务 API 读写。
- 攻略缓存：保留本地缓存仓库与 guide-api 的文件缓存。
- 本地 JSON 导出：仅作人工备份快照，不再是应用内恢复入口。
- 管理员权限：前端做体验回退，最终裁决在 `requestAuth.ts`。

Summary: MySQL is the only source of truth; caches are auxiliary; admin permission is enforced server-side.

---

## 4. 约束与规范 / Constraints and Conventions

- 中英双语规范：中文在前，英文跟随。PR 标题、正文、CHANGELOG 与协作文档必须保持双语。
- 全局硬约束：隐藏滚动条等全局视觉约束保留在 `src/styles/base.css`，不要在模块样式内覆盖。
- 样式组织：新增样式放到对应 `src/styles/components/*.css`，避免回堆到单文件。
- 通用纯逻辑：优先放到 `src/lib/*`；页面级展示模型放到对应 `src/modules/*`；组件内尽量只保留 UI、交互与必要的局部状态。
- 导航复用：新增"按记录跳转"入口优先复用 `markerNavigation.ts`；新增地图状态优先扩展 `useMapContext.ts`。
- 写操作：store 写操作优先走 `useTravelStoreActions.ts` 与其 helper，不要在 UI 层再做重复去重或活跃用户维持逻辑。
- 权限：后台能力必须先经过 `requireAdminAccount()`；前端不要自行判权。
- 文档：新增技术文档优先写在 `docs/technical/`；AI 协作材料写在 `docs/prompts/`，并视为辅助素材而非事实源。
- 每次 PR：同步 `CHANGELOG.md` 与涉及的 `docs/` 说明，保持 README 为入口级信息。
- PR 默认直接创建为 Ready for review；除非明确要求 Draft。

Summary: The project enforces bilingual docs, strict layering, and a single source of truth to keep long-term maintenance cost low.

---

## 5. 延伸阅读 / Further Reading

- [认证与会话技术方案（含附录架构图与时序图）](./auth-technical-design.md)
- [登录注册交互手册](./auth-login-register.md)
- [主业务 API Contract](./app-api-contract.md)
- [攻略搜索功能说明](./guide-search-feature.md)
- [攻略搜索 / 收藏 / 关联设计](./travel-guide-search-design.md)
- [Guide Search API Contract](./guide-search-api-contract.md)
- [地图渲染与 Hover 性能说明](./map-rendering-and-hover-performance.md)
- [地图回放模式](./map-replay-mode.md)
- [本地联调排查文档](./local-dev-troubleshooting.md)
- [未来 Roadmap](./future-roadmap.md)
- 历史档案：[MySQL 升级技术方案（归档）](./archived/mysql-upgrade-design.md)

Summary: Use this section as a jump table into feature-specific specs; start here and drill further only when you need the details.
