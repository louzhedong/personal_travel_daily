# Record Management Prompt

当任务涉及旅行记录列表、记录详情、记录编辑、图片管理、游记文本或记录级攻略关联时，请优先遵循本 Prompt。

## 适用范围

- `src/components/MarkerList.tsx`
- `src/components/MarkerDetailPanel.tsx`
- `src/components/MarkerForm.tsx`
- 记录创建、编辑、删除
- 图片上传与记录详情展示
- 记录级攻略关联入口

## 先看这些文档

- [项目总览](../technical/project-overview.md)
- [App API Contract](../technical/app-api-contract.md)
- [旅行攻略搜索设计](../technical/travel-guide-search-design.md)

## 关键代码入口

- `src/components/MarkerList.tsx`
- `src/components/MarkerDetailPanel.tsx`
- `src/components/MarkerForm.tsx`
- `src/modules/app/useTravelStoreActions.ts`
- `src/modules/app/travelStoreActionHelpers.ts`
- `src/modules/app/guideActions.ts`

## 硬约束

1. 记录编辑和删除权限必须尊重“仅当前活跃用户可修改自己的记录”。
2. 记录写操作优先复用 `useTravelStoreActions.ts`，不要在组件内直接拼复杂 store 写入。
3. 图片、游记、日期区间、城市和地区字段必须保持现有数据结构兼容。
4. 删除、登出等敏感操作继续使用二次确认。
5. 记录详情与地图、时间线、攻略关联之间的跳转要保持闭环。

## 执行原则

1. 详情面板应优先服务“看清一条记录”而不是展示所有业务状态。
2. 记录表单新增字段时，要同步考虑详情展示、列表摘要和导入导出兼容性。
3. 图片管理要优先保证顺序、预览和删除反馈清晰。
4. 详情与列表的视觉语言要统一，不要做成两套产品。

## 禁止事项

- 不要在 `MarkerDetailPanel.tsx` 中重复实现仓储或去重逻辑。
- 不要绕开 `guideActions.ts` 自己维护攻略收藏/关联状态。
- 不要只改表单，不改详情和列表摘要，导致记录信息不完整。

## 推荐改动路径

### 创建 / 编辑 / 删除记录

- `src/components/MarkerForm.tsx`
- `src/modules/app/useTravelStoreActions.ts`
- `src/modules/app/travelStoreActionHelpers.ts`

### 记录详情和图片

- `src/components/MarkerDetailPanel.tsx`
- `src/styles/components/*.css`

### 列表筛选与摘要

- `src/components/MarkerList.tsx`
- `src/modules/app/useMapContext.ts`

## 完成后检查

- 当前活跃用户权限是否仍然正确
- 记录创建、编辑、删除是否都能闭环
- 图片预览、删除、游记编辑是否正常
- 记录级攻略关联是否仍正常
