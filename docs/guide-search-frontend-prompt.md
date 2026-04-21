# Guide Search Frontend Prompt

如果你要开发或调整前端攻略搜索体验，请优先考虑以下内容：

## 组件范围

- `GuideSearchPanel.tsx`
- `SavedGuidesPanel.tsx`
- `MarkerDetailPanel.tsx`
- `TripTimelinePanel.tsx` 与记录详情的联动入口

## 当前体验要求

- 支持从首页和记录详情进入搜索
- 支持查看摘要化正文
- 支持收藏、关联、移除
- 支持从已保存攻略回到对应记录

## 状态流要求

- 面板开关和查询上下文由 `App.tsx` 负责编排
- 写操作通过 `useTravelStoreActions.ts`
- 记录定位跳转通过 `markerNavigation.ts`

## 视觉要求

- 搜索结果卡片信息层级清楚
- 收藏与已关联状态容易识别
- 不要让长段摘要把列表节奏拖得过重
- 保持与时间线、记录列表同一套卡片语言
