# 攻略搜索增强与来源治理 / Guide Search Enhancement and Source Governance

本轮迭代把攻略搜索从“能搜到”推进到“更可复查、更可管理、更可观察”的阶段，重点不在新增复杂写操作，而在于把搜索结果质量、来源健康度和用户整理效率串成闭环。

This iteration moves guide search from "it can retrieve" to "it can be reviewed, governed, and observed." The emphasis is not on heavy new mutations, but on building a closed loop around result quality, source health, and user organization efficiency.

## 目标 / Goals

- 用户搜索时可继续沿当前结果往下翻页，而不是一次只看首屏。
- Users can continue paging through results instead of being limited to the first batch.
- 搜索结果会对命中关键词做高亮，降低扫读成本。
- Search results now highlight matched keywords to reduce scanning cost.
- 搜索历史不只是回看记录，也能反向提供“猜你想搜”的建议入口。
- Search history is no longer only archival; it now powers lightweight "you may want to search" suggestions.
- 每次搜索都会落一条日志，后台可查看关键词趋势、状态分布和来源健康度。
- Every search now writes a log so the admin backend can surface keyword trends, status breakdowns, and source health snapshots.
- 来源异常不直接阻断用户主链路，但会被后台记录并在前台以轻提醒方式暴露。
- Source instability does not block the main user flow, but it is recorded in admin views and gently exposed in the frontend.

## 数据模型 / Data Model

### `GuideSearchHistory`

- 新增 `lastResultCount`，用于记录最近一次该关键词命中的结果数量。
- Added `lastResultCount` to store how many results the latest search returned for that keyword.
- 历史记录仍按 `(companionId, keywordNormalized, scope, isDeleted)` 去重。
- History records still deduplicate on `(companionId, keywordNormalized, scope, isDeleted)`.

### `GuideSearchLog`

- 新增独立日志表，记录每次真实搜索行为。
- Added a dedicated log table for each real search event.
- 核心字段：
  - `keyword`, `keywordNormalized`, `scope`
  - `provider`, `page`, `pageSize`
  - `resultCount`, `hasMore`, `durationMs`
  - `status`: `success | empty | error`
  - `errorCode`, `sourceName`, `sourceDomain`
- Core fields:
  - `keyword`, `keywordNormalized`, `scope`
  - `provider`, `page`, `pageSize`
  - `resultCount`, `hasMore`, `durationMs`
  - `status`: `success | empty | error`
  - `errorCode`, `sourceName`, `sourceDomain`

### `GuideSourceHealth`

- 新增来源健康度快照表，用于按来源聚合近期成功 / 失败情况。
- Added a source-health snapshot table to aggregate recent success/failure signals by source.
- 当前采用“累计最近成功 / 失败次数 + 最近一次成功 / 失败时间”的轻量快照模式。
- The current model is a lightweight snapshot of cumulative recent successes/failures plus latest success/failure timestamps.

## 后端链路 / Backend Flow

### 搜索历史 / Search History

- `POST /api/guide-search-histories` 现在支持可选字段 `lastResultCount`。
- `POST /api/guide-search-histories` now accepts optional `lastResultCount`.
- 命中重复历史时会刷新 `createdAt` 与 `lastResultCount`，保持最近使用排序。
- When a duplicate history is found, the service refreshes `createdAt` and `lastResultCount` to preserve recent-first ordering.

### 搜索日志 / Search Logs

- 新增 `POST /api/guide-search-logs`。
- Added `POST /api/guide-search-logs`.
- 路由要求已登录账号，并校验 `companionId` 属于当前账号。
- The route requires an authenticated account and validates that the `companionId` belongs to that account.
- 如果请求包含 `sourceName + sourceDomain`，服务端会同步 upsert `GuideSourceHealth`。
- If the payload includes `sourceName + sourceDomain`, the service also upserts `GuideSourceHealth`.

### 来源健康度 / Source Health

- 新增 `GET /api/guide-source-health?limit=20`。
- Added `GET /api/guide-source-health?limit=20`.
- 该接口面向已登录用户，只返回只读快照，不暴露任何后台写能力。
- The endpoint is available to authenticated users and returns a read-only snapshot only.

### 管理后台聚合 / Admin Aggregation

- `GET /api/admin/overview` 现在额外返回：
  - `guideSearchTrends`
  - `guideSearchStatusBreakdown`
  - `guideSourceHealth`
- `GET /api/admin/overview` now additionally returns:
  - `guideSearchTrends`
  - `guideSearchStatusBreakdown`
  - `guideSourceHealth`
- 趋势默认回看最近 30 天，状态分布与来源健康度用于后台巡检。
- Trends cover the latest 30 days by default, while status breakdown and source health support admin inspections.

## 前端体验 / Frontend Experience

### 搜索结果增强 / Search Result Enhancements

- 支持“加载更多”分页按钮。
- Added a "load more" pagination button.
- 标题、摘要、命中原因会对搜索关键词做高亮。
- Titles, summaries, and match reasons now highlight matched search keywords.
- 若某来源近期失败数高于成功数，会展示“来源波动”轻提示徽章。
- If a source has more recent failures than successes, a "source unstable" badge is shown as a soft warning.

### 搜索建议 / Search Suggestions

- 输入中的关键词会基于最近搜索历史生成建议列表。
- In-progress input now produces suggestions based on recent search history.
- 建议项会带上最近一次结果数量，帮助用户快速判断该关键词是否值得继续点开。
- Each suggestion includes the latest result count, helping users judge whether the keyword is worth retrying.

### 操作反馈 / Feedback

- 面板内新增 `AppToast`，用于展示搜索失败、无结果、翻页结束、加入愿望地图、加入行程规划和生成清单等即时反馈。
- The panel now includes `AppToast` for search errors, empty states, end-of-pagination, wishlist import, trip planning import, checklist generation, and similar immediate feedback.
- 收藏相似攻略时会先提醒用户检查重复收藏。
- When saving a potentially similar guide, users first receive a duplicate-warning hint.

## 管理后台面板 / Admin Panels

- 新增“攻略搜索趋势”面板，展示按日期聚合的总量、成功 / 无结果 / 失败以及高频关键词。
- Added the "Guide Search Trends" panel showing per-day totals, success/empty/error counts, and top keywords.
- 新增“来源健康度”面板，展示来源域名、近期成功 / 失败次数和最近失败原因。
- Added the "Source Health" panel showing source domains, recent success/failure counts, and the latest failure reason.
- 两个面板均保持只读，不在本轮提供后台修复按钮。
- Both panels remain read-only; this iteration does not add any admin repair tools.

## 已验证 / Verified

- `npx prisma generate --schema server/prisma/schema.prisma`
- `npx tsc -p tsconfig.server.json --noEmit`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run test -- --run src/components/__tests__/GuideSearchPanel.spec.tsx`
- `npm run test -- --run server/__tests__/guideSearchLogService.spec.ts server/__tests__/bootstrapGuidesSerializer.spec.ts server/__tests__/adminService.spec.ts server/__tests__/appApiRoutes.spec.ts`

## 后续可继续增强 / Follow-up Opportunities

- 把来源健康度从“累计快照”升级为时间窗统计，避免长期运行后历史值过重。
- Upgrade source health from cumulative snapshots to time-window statistics so older data does not dominate forever.
- 为搜索建议加入目的地分组、语义别名和更强的去重策略。
- Add destination grouping, semantic aliases, and stronger deduplication to search suggestions.
- 后台增加“失败关键词明细”和“失效来源列表”，再决定是否需要修复类写操作。
- Add admin-facing failed-keyword details and invalid-source lists before deciding whether admin repair mutations are necessary.
