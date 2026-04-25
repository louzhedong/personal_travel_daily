# Map Recording Prompt

当任务涉及首页地图、区域选择、记录录入入口、国内/国际视角切换或地图上的区域语义时，请优先遵循本 Prompt。

## 适用范围

- `src/components/TravelMap.tsx`
- `src/components/MapToggle.tsx`
- `src/components/MarkerForm.tsx`
- `src/modules/app/useMapContext.ts`
- 地图区域选择、快速新增记录、范围切换、区域高亮

## 先看这些文档

- [项目总览](../technical/project-overview.md)
- [地图渲染与 Hover 性能说明](../technical/map-rendering-and-hover-performance.md)
- [地图回放模式](../technical/map-replay-mode.md)
- [App API Contract](../technical/app-api-contract.md)

## 关键代码入口

- `src/components/TravelMap.tsx`
- `src/components/MarkerForm.tsx`
- `src/modules/app/useMapContext.ts`
- `src/modules/app/useTravelStoreActions.ts`
- `src/modules/app/markerNavigation.ts`
- `src/lib/mapRegionResolver.ts`
- `src/geo/*`

## 硬约束

1. 地图必须同时支持国内 / 国际两种视角。
2. 地图区域语义必须统一走 `mapRegionResolver.ts`，不要在 UI 里自己拼国家/省份映射。
3. 地图选区状态优先放在 `useMapContext.ts`，不要把新的地图业务状态散落进多个组件。
4. 点击区域后的新增记录入口，必须和当前地图选区语义一致。
5. 世界地图里的国内记录统一归属到“中国”，不要在世界地图里保留省级语义。
6. 地图相关改动必须兼顾 hover、缩放、移动端和图例遮挡关系。

## 执行原则

1. 优先保持“选区 -> 快速录入 -> 记录联动”的主链路简洁直接。
2. 新增地图派生数据时，优先抽成 `useMemo` 或 `src/lib/*` 纯函数。
3. 地图上的信息层级必须克制，不要把地图做成表单和卡片的堆叠容器。
4. 如果功能需要新的地图控件，优先考虑工具条式交互，而不是大型浮层。
5. 如果世界地图和国内地图行为不同，要先定义清楚“语义差异”，再写实现。

## 禁止事项

- 不要在 JSX 内硬编码新的国家/省份映射规则。
- 不要让地图功能依赖“用户先做一个不直观的前置筛选”。
- 不要为了实现局部功能打破现有缩放、拖拽和 hover 的基础交互。
- 不要让地图底部或右下角的辅助卡片互相遮挡。

## 推荐改动路径

### 地图视角、区域和选区联动

- `src/modules/app/useMapContext.ts`
- `src/lib/mapRegionResolver.ts`
- `src/components/TravelMap.tsx`

### 从地图直接录入记录

- `src/components/MarkerForm.tsx`
- `src/modules/app/useTravelStoreActions.ts`
- `src/modules/app/AppOverlays.tsx`

### 世界地图国家级归属

- `src/lib/mapRegionResolver.ts`
- `src/lib/mapReplay.ts`
- `src/lib/mapJourneyArcs.ts`

## 完成后检查

- 国内 / 国际切换是否仍正常
- 区域点击、清除筛选、快速新增是否仍正常
- 世界地图中的国内记录是否仍归属到中国
- 新增控件是否遮挡图例、缩放控件或地图主体
- 相关测试是否需要更新：
  - `src/components/__tests__/TravelMap.spec.tsx`
  - `src/modules/__tests__/App.spec.tsx`
