# 旅伴共同回忆 / Companion Shared Memories

## 背景 / Background

旅伴在当前产品中已经承担归属、筛选、颜色和权限边界，但还没有成为可被单独回看的“共同经历”对象。本功能新增 `/companions/:id/memories`，把某位旅伴相关的记录、行程、照片、攻略和主题整理成私密纪念册。

Companions already represent ownership, filtering, color identity, and permission boundaries, but they are not yet a standalone retrospective object. This feature adds `/companions/:id/memories` to turn one companion's markers, trips, photos, guides, and themes into a private shared-memory album.

## 用户体验 / User Experience

- 中文：从统计中心“旅伴排行”和行程详情“旅伴参与”都可以进入同一个旅伴回忆页。
- English: Users can enter the same companion memories page from the stats companion ranking and the trip-detail companion participation cards.
- 中文：页面以“共同记忆封面、同行摘要、年度同行轨迹、共同去过的地方、共同主题、代表行程、精选照片、共同攻略、记忆里程碑”组织信息。
- English: The page is organized into a shared-memory hero, summary KPIs, yearly rhythm, shared places, shared themes, representative trips, featured photos, shared guides, and memory milestones.
- 中文：页面文案不暴露“快照、TTL、payload”等技术词，只展示“最近整理于”。
- English: The UI avoids technical terms such as snapshot, TTL, and payload; it only shows a human-facing “last organized at” timestamp.
- 中文：“刷新回忆”是显式操作，成功或失败都通过全局 `AppToast` 反馈。
- English: “Refresh memories” is an explicit operation, and both success and failure use the global `AppToast` feedback pattern.

## 数据模型 / Data Model

新增 `CompanionMemorySnapshot`：

Added `CompanionMemorySnapshot`:

- 中文：每个 `accountId + companionId` 只保存一份最新快照。
- English: Each `accountId + companionId` keeps only one latest snapshot.
- 中文：`payloadJson` 保存已序列化的页面 DTO，源数据仍以 `VisitMarker`、`VisitMarkerImage`、`SavedGuide`、`Trip` 为事实源。
- English: `payloadJson` stores the serialized page DTO, while `VisitMarker`, `VisitMarkerImage`, `SavedGuide`, and `Trip` remain the source of truth.
- 中文：`snapshotVersion` 用于未来 DTO 结构升级；版本不匹配时服务端会重建。
- English: `snapshotVersion` supports future DTO upgrades; mismatched versions trigger a rebuild.
- 中文：`generatedAt` 与 `expiresAt` 控制按需重建，当前窗口为 24 小时。
- English: `generatedAt` and `expiresAt` control on-demand rebuilds, currently using a 24-hour window.

## API / 接口

### `GET /api/companions/:id/memories`

- 中文：读取某位旅伴的回忆快照；如果快照缺失、过期或版本不匹配，服务端同步重建后返回。
- English: Reads a companion memory snapshot. If the snapshot is missing, expired, or version-mismatched, the server rebuilds it synchronously before returning.
- 中文：需要登录，只能读取当前账号下未删除旅伴。
- English: Requires authentication and only reads active companions under the current account.

### `POST /api/companions/:id/memories/refresh`

- 中文：无视过期时间，强制重建该旅伴的共同回忆。
- English: Forces a rebuild regardless of the current expiration time.
- 中文：前端“刷新回忆”按钮调用该接口，并用 `AppToast` 展示结果。
- English: The frontend “Refresh memories” button calls this endpoint and displays the result with `AppToast`.

## 响应结构 / Response Shape

核心响应字段：

Core response fields:

- `companion`：旅伴身份、名称和颜色。
- `summary`：共同记录、同行天数、行程数、城市数、照片数、攻略数和 headline。
- `yearlySeries`：年度记录数、同行天数和照片数。
- `topRegions` / `topCities`：共同去过的区域和城市。
- `themes`：从标签、心情、交通和预算提炼出的共同主题。
- `trips`：代表行程。
- `photos`：优先精选照片的共同照片墙。
- `guides`：共同收藏或关联攻略。
- `milestones`：第一段共同记忆、最密集年份、高频城市和最近同行等节点。
- `snapshot`：最近整理时间、过期时间和源数据计数。

## 边界 / Boundaries

- 中文：一期不做真实邀请协作、跨账号共享、公开分享链接或旅伴删除策略变更。
- English: Phase 1 does not add real invitation collaboration, cross-account sharing, public share links, or companion deletion policy changes.
- 中文：一期不把旅伴回忆并入 `/stats` 聚合，避免统计 DTO 继续膨胀。
- English: Phase 1 does not merge companion memories into `/stats`, avoiding further growth of the stats DTO.
- 中文：一期不新增后台管理面板；如未来要巡检快照健康度，再单独设计后台只读面板。
- English: Phase 1 does not add an admin panel; snapshot health inspection can be designed separately later.

## 测试策略 / Testing

- 中文：`companionMemoryService.spec.ts` 覆盖快照命中、缺失重建、强制刷新和非本人旅伴。
- English: `companionMemoryService.spec.ts` covers snapshot hits, missing-snapshot rebuilds, forced refresh, and unauthorized companion ownership.
- 中文：`companionMemorySerializer.spec.ts` 覆盖日期序列化和非法 payload 兜底。
- English: `companionMemorySerializer.spec.ts` covers date serialization and invalid payload fallback.
- 中文：`appApiRoutes.spec.ts` 覆盖 `GET /memories` 与 `POST /refresh` 路由转发。
- English: `appApiRoutes.spec.ts` covers route forwarding for `GET /memories` and `POST /refresh`.
- 中文：前端测试覆盖页面渲染、刷新 Toast、统计入口、行程详情入口和 App 路由。
- English: Frontend tests cover page rendering, refresh toast, stats entry, trip-detail entry, and App routing.
