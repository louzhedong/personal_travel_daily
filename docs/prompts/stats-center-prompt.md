# Stats Center Prompt

当任务涉及 `/stats` 统计中心、排行、趋势、热力图、统计筛选或从统计中心钻取到行程详情时，请优先遵循本 Prompt。

## 适用范围

- `src/modules/stats/*`
- `src/components/stats/*`
- `GET /api/stats/overview`
- 排行、趋势、热力图、钻取

## 先看这些文档

- [未来 Roadmap](../technical/future-roadmap.md)
- [项目总览](../technical/project-overview.md)
- [App API Contract](../technical/app-api-contract.md)

## 关键代码入口

- `src/modules/stats/StatsPage.tsx`
- `src/modules/stats/TripStatsCenter.tsx`
- `src/modules/stats/statsCenterModel.ts`
- `src/components/stats/*`
- `src/lib/api/statsApi.ts`
- `server/appApi/routes/stats.ts`

## 硬约束

1. 统计中心是独立页面，不要再把复杂统计堆回首页主体。
2. 筛选条件必须统一作用于概览、排行、趋势、热力图和钻取。
3. 统计中心的地图热力图要和主地图语义一致：国内用中国地图，国际用世界地图。
4. 从统计中心钻取到行程详情必须保持稳定。

## 执行原则

1. 统计页面优先服务对比、扫描和钻取，不要做成营销式大视觉页面。
2. 新增统计字段时，优先更新展示模型和 API 契约，再改 UI。
3. 热力图、排行和概览之间要共享同一份过滤语义。

## 禁止事项

- 不要在多个统计组件里重复实现同一套过滤和聚合逻辑。
- 不要让统计中心和行程详情用不一致的数据口径。
- 不要把统计页面的地图样式和主地图割裂成两套语义。

## 推荐改动路径

- 前端页与模型：`src/modules/stats/*`
- 统计组件：`src/components/stats/*`
- 接口与契约：`src/lib/api/statsApi.ts`、`server/appApi/routes/stats.ts`

## 完成后检查

- 所有筛选是否正确影响各个统计模块
- 热力图与列表/排行数据口径是否一致
- 行程钻取是否仍然正常
