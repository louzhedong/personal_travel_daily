# Guide Search Prompt

当任务涉及攻略搜索功能时，请围绕以下目标展开：

## 目标

- 让用户快速找到与目的地相关的攻略
- 把攻略与旅行记录建立稳定关系
- 保持收藏、关联和缓存语义清晰

## 关注点

- 搜索参数：`keyword`、`scope`、分页
- provider：`mock` 与 `remote`
- 搜索历史存储
- 搜索结果缓存与正文缓存
- 收藏与记录关联的去重规则

## 前端入口

- `GuideSearchPanel.tsx`
- `SavedGuidesPanel.tsx`
- `MarkerDetailPanel.tsx`

## 数据层入口

- `src/lib/guides/*`
- `src/lib/repositories/guideRepository.ts`
- `src/modules/app/guideActions.ts`
- `src/modules/app/useTravelStoreActions.ts`

## 关键约束

- 收藏与关联是两种不同语义
- 不要在组件里手写另一套去重逻辑
- 删除记录时要同步清理该记录下的关联攻略
