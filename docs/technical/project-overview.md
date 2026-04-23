# 项目总览

## 产品定位

这是一个面向个人与小团队的旅行足迹记录原型，核心体验是：

1. 在地图上选中地区
2. 用当前旅伴身份记录一次旅行
3. 补充图片、游记和时间信息
4. 搜索、收藏并关联目的地攻略
5. 通过时间线回看自己的旅程
6. 通过导出/导入维护本地数据

## 已实现模块

### 地图与记录录入

- 国内 / 国际双范围切换
- 地图区域点击后直接打开记录弹窗
- 区域对应城市列表自动填充
- 记录表单支持日期区间、描述、多图上传

### 旅行记录列表与详情

- 当前范围下的记录列表
- 按旅伴筛选列表
- 仅当前活跃用户可删除自己的记录
- 详情面板支持编辑游记和图片

### 旅伴管理

- 新增旅伴
- 切换当前记录用户
- 以颜色区分不同旅伴的记录

### 攻略搜索与关联

- 本地 mock / 远程 API 双 provider
- 搜索结果摘要展示
- 搜索历史
- 收藏到“我的收藏”
- 关联到某条旅行记录
- 从收藏或记录中移除攻略

### 时间线

- 基于当前活跃用户生成
- 按年份筛选
- 按国内/国际筛选
- 点击时间线条目，联动地图与详情面板

### 数据持久化与备份

- `IndexedDB` 存储旅行数据与攻略缓存
- 自动迁移旧版 `localStorage`
- 导出数据快照
- 导入后按 ID 合并已有数据

## 目录职责

### `src/components`

通用和业务组件，例如地图、记录列表、详情、时间线、攻略搜索面板。

### `src/modules`

页面模块与容器层。

- `App.tsx`：应用顶层容器
- `app/`：页面组合组件与 hook
- `admin/`：后台管理页与展示模型

### `src/lib`

前端基础设施和数据层。

- `storage.ts`：TravelStore 持久化与迁移
- `date.ts`：日期区间、年份和天数等通用日期工具
- `markerSorting.ts`：旅行记录访问时间排序工具
- `mapJourneyArcs.ts`：地图旅程弧线纯计算
- `guides/`：攻略搜索、正文服务、正文视图和 HTML 清洗
- `repositories/`：IndexedDB 仓库和缓存层

### `server`

本地攻略 API 与适配器。

- `guideApiServer.mjs`：HTTP 入口
- `guideSearchEngine.mjs`：搜索与排序逻辑
- `guideFileStore.mjs`：文档缓存
- `adapters/`：外部站点与 POI 数据适配器

## 当前前端分层

### 页面容器

- `App.tsx`

### 页面组合层

- `AppHero.tsx`
- `AppContent.tsx`
- `AppOverlays.tsx`

### 状态与动作 hook

- `useMapContext.ts`
- `useTravelStoreActions.ts`
- `useLockedModal.ts`
- `travelStoreActionHelpers.ts`

### 跨模块导航辅助

- `markerNavigation.ts`

### 纯计算与展示模型

- `src/lib/date.ts`
- `src/lib/markerSorting.ts`
- `src/lib/mapJourneyArcs.ts`
- `src/lib/guides/guideDocumentView.tsx`
- `src/modules/admin/adminPageModel.ts`

## 当前样式结构

- `base.css`：全局变量与基础样式
- `layout.css`：壳层布局与弹窗
- `home.css`：首页头部视觉
- `responsive.css`：响应式覆盖
- `components/*.css`：按业务模块拆分的组件样式

## 建议的新增开发原则

- 通用纯逻辑优先放入 `src/lib/`，页面级展示模型优先放入对应 `src/modules/*` 目录，不要散落在组件 JSX 内
- store 写操作的公共逻辑优先复用 `travelStoreActionHelpers.ts`
- 新的“按记录跳转”入口优先复用 `markerNavigation.ts`
- 新的地图相关状态优先扩展 `useMapContext.ts`
- 新的文档优先写在 `docs/`，README 保持入口级信息
