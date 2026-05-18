# 日程化行前规划 / Calendar-Based Trip Planning

日程化行前规划把既有 `TripPlanningItem.plannedDate` 从“预计日期”升级为按天行程视图，帮助用户在行程详情内同时管理未排期池、当天计划和愿望地图导入。

Calendar-Based Trip Planning upgrades the existing `TripPlanningItem.plannedDate` field from a loose expected date into a day-by-day itinerary view inside trip detail, covering the unscheduled pool, dated plans, and wishlist imports.

## 已落地范围 / Delivered Scope

- 在 `/trips/:id` 行前规划 Tab 中新增日程视图，按日期聚合规划项。
  Adds a schedule view under the `/trips/:id` planning tab and groups planning items by date.
- 保留未排期池，支持把规划项移动到某一天或移回未排期状态。
  Keeps an unscheduled pool and supports moving planning items onto a day or back to unscheduled.
- 支持从愿望地图批量导入到指定日期，并保留 `sourceWishlistId` 关系。
  Supports importing wishlist items into a selected date while preserving the `sourceWishlistId` relationship.
- 当天辅助区展示行前清单提示，但不新增清单日期字段。
  Shows day-level checklist hints without adding a new checklist date field.

## API 与数据 / APIs and Data

- `GET /api/trips/:id/planning/schedule`
- `PATCH /api/trips/:id/planning/items/:itemId/schedule`
- `POST /api/trips/:id/planning/schedule/import-wishlist`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/tripPlanningScheduleService.ts`
- `src/components/trips/TripPlanningCalendarBoard.tsx`
- `src/modules/trips/tripPlanningCalendarModel.ts`
- `src/styles/features/trip-planning-calendar.css`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/tripPlanningScheduleService.spec.ts`
- `server/__tests__/appApiRoutes.trips.spec.ts`
- `src/modules/trips/__tests__/tripPlanningCalendarModel.spec.ts`
- `src/modules/__tests__/TripDetailPage.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
