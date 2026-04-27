# 记录标签与轻量元数据 / Marker Tags and Lightweight Metadata

这份文档用于系统说明“记录标签与轻量元数据”一期闭环的设计与实现范围。重点不是单纯为 `VisitMarker` 多加几个字段，而是把录入、编辑、展示、统计、搜索和文档一起收口成可持续迭代的事实源。

This document explains the first-phase implementation of marker tags and lightweight metadata. The goal is not merely to add fields onto `VisitMarker`, but to close the loop across capture, edit, display, statistics, search, and documentation as a sustainable source of truth.

## 目标与范围 / Goals and Scope

- 一期目标：为旅行记录补充可复用、可统计、可搜索的轻量结构化语义。
- 一期覆盖：记录录入、详情轻编辑、时间线摘要、行程详情摘要、统计筛选与排行、服务端搜索与 API 契约。
- 一期不做：自定义标签、标签颜色治理、后台可配置词表、AI 自动打标签、基于标签的故事页生成。

- Phase-one goal: add reusable, searchable, and aggregatable structured semantics to travel markers.
- Phase-one scope: marker capture, detail editing, timeline summaries, trip-detail summaries, stats filters and rankings, backend search, and API-contract updates.
- Out of scope for phase one: custom tags, color governance, backoffice vocabulary management, AI auto-tagging, and tag-driven story generation.

## 固定词表 / Fixed Vocabulary

### 标签 / Tags

- `food` - 美食 / Food
- `hiking` - 徒步 / Hiking
- `beach` - 海边 / Beach
- `museum` - 博物馆 / Museum
- `photography` - 摄影 / Photography
- `family` - 亲子 / Family
- `weekend` - 周末 / Weekend
- `business` - 出差 / Business
- `nature` - 自然风景 / Nature
- `citywalk` - 城市漫游 / Citywalk

### 心情 / Mood

- `relaxed` - 放松 / Relaxed
- `excited` - 兴奋 / Excited
- `tired` - 疲惫 / Tired
- `surprised` - 惊喜 / Surprised
- `peaceful` - 平静 / Peaceful

### 天气 / Weather

- `sunny` - 晴 / Sunny
- `cloudy` - 多云 / Cloudy
- `rainy` - 雨 / Rainy
- `snowy` - 雪 / Snowy
- `windy` - 大风 / Windy

### 交通方式 / Transport

- `walk` - 步行 / Walk
- `car` - 自驾 / Car
- `train` - 火车 / Train
- `plane` - 飞机 / Plane
- `metro` - 地铁 / Metro
- `bus` - 公交/大巴 / Bus

### 预算级别 / Budget Level

- `low` - 低预算 / Low
- `medium` - 中预算 / Medium
- `high` - 高预算 / High

## 数据模型 / Data Model

- `VisitMarker.tags` 使用 `Json` 数组存储多选标签，例如 `["food", "citywalk"]`。
- `VisitMarker.mood`、`weather`、`transport`、`budgetLevel` 使用可空字符串枚举值。
- 词表值域统一收口到 `shared/markerMetadata.ts`，前端显示文案统一收口到 `src/lib/markerMetadata.ts`。

- `VisitMarker.tags` uses a `Json` array to store multi-select tags, for example `["food", "citywalk"]`.
- `VisitMarker.mood`, `weather`, `transport`, and `budgetLevel` are stored as nullable string enums.
- The shared value domain lives in `shared/markerMetadata.ts`, while frontend labels are centralized in `src/lib/markerMetadata.ts`.

## 前后端闭环 / Frontend and Backend Loop

### 录入与编辑 / Capture and Edit

- `src/components/MarkerForm.tsx` 负责录入标签与轻量元数据。
- `src/components/MarkerDetailPanel.tsx` 负责查看态与轻编辑态的统一承载。
- 标签支持多选，其余元数据为单选可空字段。

- `src/components/MarkerForm.tsx` captures tags and lightweight metadata.
- `src/components/MarkerDetailPanel.tsx` hosts both read mode and lightweight edit mode.
- Tags are multi-select, while the other metadata fields are nullable single-select values.

### 展示 / Display

- `src/components/timeline/TimelineMarkerButton.tsx` 在时间线中展示最多 2 个标签加 1 条元数据摘要。
- `src/modules/trips/TripDetailPage.tsx` 在行程详情的记录卡片中展示同类摘要。
- 详情侧板保留完整字段，避免时间线列表变得过重。

- `src/components/timeline/TimelineMarkerButton.tsx` shows up to two tags plus one metadata summary string in the timeline.
- `src/modules/trips/TripDetailPage.tsx` reuses the same summary concept inside trip-detail marker cards.
- The detail panel keeps the full field set so the timeline stays compact.

### 搜索与统计 / Search and Stats

- `GET /api/markers/search` 支持 `tag / mood / weather / transport / budgetLevel` 查询参数。
- 标签筛选采用“命中任一标签”语义，其余元数据采用精确匹配。
- `GET /api/stats/overview` 支持相同筛选参数，并返回 `topTags / topMoods / topWeather / topTransports / topBudgetLevels` 聚合结果。

- `GET /api/markers/search` supports `tag / mood / weather / transport / budgetLevel` query parameters.
- Tag filtering uses match-any semantics, while the other metadata filters use exact matching.
- `GET /api/stats/overview` supports the same filters and returns `topTags / topMoods / topWeather / topTransports / topBudgetLevels` aggregations.

## 数据流 / Data Flow

1. 前端表单与详情侧板从 `src/lib/markerMetadata.ts` 读取选项与文案。
2. 前端 API 类型通过 `src/lib/api/types.ts` 把字段传入 marker create/update/search 与 stats 查询。
3. 后端 `server/appApi/schemas/markers.ts` 和 `server/appApi/schemas/stats.ts` 做入参校验。
4. `server/appApi/services/markerService.ts` 与 `server/appApi/services/statsService.ts` 编排 marker 与 stats 逻辑。
5. `server/appApi/repositories/visitMarker/search.ts` 负责 metadata 搜索 SQL，`services/stats/aggregator.ts` 负责 metadata 排行聚合。
6. `server/appApi/serializers/*` 把数据库与聚合结果转换为前端可消费 DTO。

1. The form and detail panel read options and labels from `src/lib/markerMetadata.ts`.
2. Frontend API types pass the fields into marker create/update/search and stats requests through `src/lib/api/types.ts`.
3. `server/appApi/schemas/markers.ts` and `server/appApi/schemas/stats.ts` validate incoming data.
4. `server/appApi/services/markerService.ts` and `server/appApi/services/statsService.ts` orchestrate marker and statistics behavior.
5. `server/appApi/repositories/visitMarker/search.ts` handles metadata search SQL, while `services/stats/aggregator.ts` computes metadata rankings.
6. `server/appApi/serializers/*` translate database and aggregation results into frontend DTOs.

## 边界与取舍 / Boundaries and Tradeoffs

- 之所以让 `tags` 使用 `Json` 数组，是为了在一期先快速闭环，而不是提前引入标签维表和 join table。
- 之所以使用固定枚举，是为了保证筛选、统计、搜索和文档约束的一致性。
- 之所以把时间线展示压缩成摘要，而不是完整字段铺开，是为了维持“旅行杂志”风格下的紧凑密度。

- `tags` uses a `Json` array so phase one can close the loop quickly without introducing a dedicated tag dimension table and join table too early.
- Fixed vocabularies were chosen to keep filtering, ranking, search, and documentation constraints consistent.
- Timeline display is intentionally compressed into summaries rather than full-field rendering so the interface keeps its travel-magazine density.

## 后续演进 / Future Extensions

- 自定义标签与标签治理后台。
- 基于标签的故事页、年度回顾主题切片与 AI 整理能力。
- 更强的搜索建议、同义词扩展和标签推荐。

- Custom tags and a tag-governance backoffice.
- Tag-driven story pages, annual-review theme slices, and AI organization flows.
- Stronger search suggestions, synonym expansion, and metadata recommendation.
