# 地图渲染与 Hover 性能说明

## 当前目标

在 React + SVG 地图场景下，保持以下体验：

- 国内 / 国际地图切换顺滑
- 区域 hover 和选中状态反馈明确
- 点击区域可稳定打开记录弹窗
- 地图上用户标记与颜色区分清晰

## 当前实现基础

- 地图数据通过 `src/geo/loader.ts` 按范围加载
- 几何投影逻辑集中在 `src/geo/projection.ts`
- 地图组件为 `src/components/TravelMap.tsx`
- 地图范围、区域选中与当前范围 marker 过滤由 `src/modules/app/useMapContext.ts` 提供

## 性能策略

### 1. 范围级加载

只在 `scope` 改变时加载对应 Geo 数据，而不是一次性加载全部地图资源。

### 2. 派生数据 memo 化

当前范围下的 marker 列表、选中区域等派生结果通过 `useMemo` 处理，减少不必要的重复计算。

### 3. 交互状态集中管理

`scope`、`selectedRegionId` 和 `regionOptions` 统一收敛到 `useMapContext.ts`，避免多个组件各自持有局部版本导致重复刷新。

### 4. 统一导航行为

时间线、攻略收藏和地图详情跳转统一通过 `markerNavigation.ts` 聚焦记录，减少多套实现造成的额外状态抖动。

## Hover 交互建议

- hover 态只做轻量视觉反馈，不触发昂贵的数据请求
- 需要展示复杂信息时，优先交给点击后的面板或弹窗
- 选中态应与 hover 态明确区分，避免颜色过近造成误读

## 继续优化时的观察指标

- 切换国内 / 国际范围时的首次绘制耗时
- marker 数量增多时的地图重绘频率
- hover 频繁移动时的 React rerender 次数
- 列表、时间线、详情联动时是否造成地图整块重绘

## 推荐优化顺序

1. 保持地图数据加载与页面状态分离
2. 优化地图 path 和 marker 渲染粒度
3. 如记录量继续增大，再考虑更细的 memo 或局部渲染拆分
