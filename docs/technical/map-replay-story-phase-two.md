# 地图回放故事页二期 / Map Replay Story Page Phase 2

地图回放故事页二期复用 Atlas 与地图回放底层表达，为行程、年份和旅伴生成可阅读、可导出的路线叙事模块。

Map Replay Story Page Phase 2 reuses Atlas and map-replay foundations to generate readable, exportable route narratives for trips, years, and companions.

## 已落地范围 / Delivered Scope

- 新增 `/replay/trip/:id`、`/replay/year/:year` 与 `/replay/companion/:id` 三类页面入口。
  Adds `/replay/trip/:id`, `/replay/year/:year`, and `/replay/companion/:id` page entries.
- 组合路线回放、照片、记录摘要和攻略摘录。
  Combines route replay, photos, marker summaries, and guide excerpts.
- 支持长图 SVG 导出，并在 Story Studio 与旅行胶囊中复用。
  Supports SVG long-image export and reuse inside Story Studio and memory capsules.
- 不做真实地图截图、不引入瓦片服务或地理编码。
  Does not introduce real map screenshots, tile services, or geocoding.

## API 与数据 / APIs and Data

- `GET /api/map-replay-stories/trip/:tripId`
- `GET /api/map-replay-stories/year/:year`
- `GET /api/map-replay-stories/companion/:companionId`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/mapReplayStoryService.ts`
- `server/appApi/serializers/mapReplayStorySerializer.ts`
- `src/modules/replay/MapReplayStoryPage.tsx`
- `src/modules/replay/mapReplayStoryExport.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/mapReplayStorySerializer.spec.ts`
- `server/__tests__/appApiRoutes.mapReplayStories.spec.ts`
- `src/modules/__tests__/MapReplayStoryPage.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
