# 项目总览

本文档用于快速梳理当前仓库的产品形态、核心模块、状态结构和文档入口，帮助后续开发、测试和 AI 协作都能基于同一套上下文工作。

## 1. 项目定位

`旅迹地图 / Voyage Atlas` 是一个旅行记录产品原型，当前聚焦四条主线：

- 地图足迹：在国内 / 世界地图上记录去过的地区
- 多人记录：多个旅伴共享同一份本地数据，但各自保留身份和颜色
- 旅行相册：每条记录可以补充多张图片
- 攻略辅助：围绕目的地搜索、收藏和回看攻略

它不是后台管理系统，也不是内容社区。当前产品更像一个带攻略辅助能力的个人旅行日志工具。

## 2. 当前页面结构

### 2.1 首页与主工作区

- Hero 区：品牌标题、产品介绍和攻略搜索入口
- 地图区：国内 / 世界地图切换、缩放平移、点击区域录入
- 旅伴管理：切换当前用户、新增旅伴
- 我的攻略收藏：查看当前用户收藏和已关联内容
- 数据同步：导出 / 恢复本地快照
- 记录列表：按当前地图范围展示旅行记录

### 2.2 弹层与面板

- `MarkerForm`：新增旅行记录
- `MarkerDetailPanel`：查看 / 编辑旅行记录详情
- `GuideSearchPanel`：搜索攻略、查看摘要和正文片段

## 3. 核心模块

### 3.1 前端模块

- `src/modules/App.tsx`
  - 应用级状态汇总
  - 地图范围、当前用户、记录详情、攻略搜索抽屉的总入口
- `src/components/TravelMap.tsx`
  - 地图渲染、hover 与点击交互
- `src/components/MarkerList.tsx`
  - 当前范围下的旅行记录列表
- `src/components/MarkerDetailPanel.tsx`
  - 记录详情、编辑、图片预览、相关攻略展示
- `src/components/GuideSearchPanel.tsx`
  - 攻略搜索、结果列表、正文片段、收藏 / 关联操作
- `src/components/SavedGuidesPanel.tsx`
  - 当前用户的攻略收藏侧栏
- `src/components/DataSync.tsx`
  - 本地快照导出与恢复

### 3.2 前端数据层

- `src/lib/storage.ts`
  - 默认数据、状态归一化、快照读写、创建用户 / 记录 / 收藏对象
- `src/lib/repositories/travelStoreRepository.ts`
  - `TravelStore` 快照读写
- `src/lib/repositories/guideRepository.ts`
  - 搜索历史、搜索缓存、正文缓存、攻略收藏读写
- `src/lib/guides/*`
  - 搜索 service、正文 service、provider 抽象与实现

### 3.3 服务端模块

- `server/guideApiServer.mjs`
  - 本地攻略服务入口
- `server/guideSearchEngine.mjs`
  - 搜索聚合和 provider 组合
- `server/adapters/*`
  - 不同来源的 adapter
- `server/guideFileStore.mjs`
  - 文档缓存与落盘

## 4. 状态模型

应用级核心状态：

```ts
interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

其中：

- `users`：旅伴信息
- `markers`：旅行记录主体
- `savedGuides`：攻略收藏与关联关系
- `guideSearchHistory`：搜索历史

攻略收藏的最关键字段：

```ts
interface SavedGuide {
  id: string;
  markerId?: string;
  savedByUserId: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
  savedAt: string;
}
```

理解方式：

- `markerId` 为空时，表示“独立收藏”
- `markerId` 有值时，表示“挂到某条旅行记录上的攻略”
- `savedByUserId` 表示这条收藏 / 关联是谁创建的

## 5. 当前文档分层

建议按下面方式理解仓库内文档：

- 总览文档
  - [README](../README.md)
  - [项目总览](./project-overview.md)
- 功能文档
  - [攻略搜索功能说明](./guide-search-feature.md)
- 设计 / 约束文档
  - [攻略搜索 / 收藏 / 关联设计文档](./travel-guide-search-design.md)
  - [Guide Search API Contract](./guide-search-api-contract.md)
- 技术专题
  - [地图绘制与 Hover 性能优化](./map-rendering-and-hover-performance.md)
  - [视觉 Token 说明](./design-tokens.md)
- AI 协作 Prompt
  - `project-ai-prompt.md`
  - `system-prompt.md`
  - `task-prompt.md`
  - `design-prompt.md`
  - `guide-search-*.md`

## 6. 当前实现和文档的重点风险

结合最近一轮 review，和攻略收藏 / 关联相关的后续迭代需要重点关注：

- 记录归属和攻略归属的权限边界
- 收藏去重与关联去重的单一判定规则
- UI 层和 repository 层不要重复维护同一套身份逻辑

这些约束已经单独整理在 [攻略搜索 / 收藏 / 关联设计文档](./travel-guide-search-design.md) 中，后续如果要修复实现或补测试，建议先从那份文档开始。
