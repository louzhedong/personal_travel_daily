# Trip Collection Prompt

当任务涉及行程集合、行程详情页、记录归属到行程、行程级信息展示或从统计中心钻取到行程详情时，请优先遵循本 Prompt。

## 适用范围

- `src/modules/trips/*`
- `Trip Collection` 创建、展示、钻取
- 记录归属到行程
- 行程详情只读页

## 先看这些文档

- [未来 Roadmap](../technical/future-roadmap.md)
- [项目总览](../technical/project-overview.md)
- [App API Contract](../technical/app-api-contract.md)

## 关键代码入口

- `src/modules/trips/TripDetailPage.tsx`
- `src/modules/trips/tripDetailPageModel.ts`
- `src/components/TripTimelinePanel.tsx`
- `src/modules/stats/TripStatsCenter.tsx`
- `server/appApi/routes/trips.ts`
- `server/appApi/services/tripDetailService.ts`

## 硬约束

1. 行程是记录的聚合容器，不是替代记录本身的新实体层。
2. 从统计中心到行程详情页的钻取链路必须保持通畅。
3. 行程详情当前默认是只读展示页，除非任务明确要求，否则不要擅自扩展成大编辑器。
4. 行程级展示必须与记录、图片、攻略关联信息一致，不允许出现聚合结果和详情不一致。

## 执行原则

1. 行程功能优先围绕“聚合回看”展开，而不是堆新的表单字段。
2. 行程页面应像一个整理好的旅行容器，信息有层级但不过度卡片化。
3. 新增行程字段时，先检查是否真的需要进入数据库契约。

## 禁止事项

- 不要把行程页面做成另一个“记录列表页”。
- 不要在前端零散拼行程聚合结果，优先复用后端聚合接口或展示模型。
- 不要只改行程详情页，不同步统计钻取和时间线归属。

## 推荐改动路径

- 行程详情展示：`src/modules/trips/*`
- 行程与统计联动：`src/modules/stats/*`
- 行程归属写操作：`src/modules/app/useTravelStoreActions.ts`
- 服务端聚合：`server/appApi/routes/trips.ts` 及相关 service/repository

## 完成后检查

- 记录归属到行程后，时间线和统计是否正确聚合
- `/trips/:id` 是否仍能正常读取
- 从统计中心钻取到行程详情是否正常
