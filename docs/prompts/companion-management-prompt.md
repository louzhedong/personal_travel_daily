# Companion Management Prompt

当任务涉及旅伴创建、当前活跃旅伴切换、颜色区分、旅伴相关筛选或旅伴与记录归属关系时，请优先遵循本 Prompt。

## 适用范围

- `src/components/UserManager.tsx`
- 当前活跃旅伴切换
- 旅伴颜色管理
- 与地图、时间线、统计中心相关的旅伴筛选

## 先看这些文档

- [项目总览](../technical/project-overview.md)
- [App API Contract](../technical/app-api-contract.md)

## 关键代码入口

- `src/components/UserManager.tsx`
- `src/modules/app/useTravelStoreActions.ts`
- `src/modules/app/travelStoreActionHelpers.ts`
- `src/lib/api/types.ts`

## 硬约束

1. 活跃旅伴切换会影响记录录入归属、时间线、地图轨迹和统计视角。
2. 旅伴颜色是跨地图、列表、时间线和图例的统一识别语义。
3. 新增或修改旅伴时，要兼顾既有记录和 UI 图例显示。
4. 不要把“活跃用户”和“可编辑权限”混成两个概念之外的第三套逻辑。

## 执行原则

1. 旅伴管理应优先服务“当前是谁在记录”这个核心动作。
2. 新增旅伴相关功能时，先检查地图、时间线和统计是否需要同步响应。
3. 颜色选择和展示要稳定、可识别，避免和热力图、地图主题冲突。

## 禁止事项

- 不要让旅伴颜色只在单一模块生效。
- 不要新增一套与 `activeUserId` 平行但不一致的当前旅伴状态。
- 不要在 UI 里手写旅伴归属推断逻辑。

## 推荐改动路径

- `src/components/UserManager.tsx`
- `src/modules/app/useTravelStoreActions.ts`
- `src/modules/app/AppContent.tsx`
- `src/components/TravelMap.tsx`
- `src/components/TripTimelinePanel.tsx`

## 完成后检查

- 活跃旅伴切换后，地图、时间线、回放、统计是否同步更新
- 旅伴颜色在图例、地图标记和列表中是否一致
- 新增旅伴是否可立即用于记录创建
