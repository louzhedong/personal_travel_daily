# 项目 AI Prompt

本文档用于给 AI 助手提供当前项目的统一上下文，帮助其理解产品目标、技术栈、核心模块、数据模型与开发约束。

## 项目定位

项目名为 `旅迹地图 / Voyage Atlas`。

这是一个“个人旅行记录产品原型”，核心目标不是通用后台系统，而是一个具有旅行品牌感的地图记录产品。

产品围绕以下主线展开：

- 地图足迹：用国内 / 世界地图记录旅行区域
- 旅行相册：每条记录可带多张图片
- 多人记录：支持多个旅伴用户，以不同颜色区分足迹
- 时间线轨迹：在地图上按时间顺序串联同一用户的旅行路径
- 品牌体验：整体风格偏轻、克制、旅行产品化，而不是后台管理系统

## 当前核心功能

### 1. 首页品牌区

- 顶部 Hero 已完成品牌化设计
- 包含：
  - 品牌标题 `旅迹地图`
  - 抽象地图线稿底纹
  - 经纬线网格
  - 航线点亮动效
  - 品牌色 chips 和旅行提示卡

### 2. 地图模块

- 支持国内 / 世界地图切换
- 地图使用 SVG + `d3-geo` 渲染
- 支持：
  - hover 区域高亮
  - 点击区域弹出旅行记录表单
  - 地图缩放 / 平移
  - tooltip hover 信息展示
  - 标签显示阈值优化
- 地图头部采用品牌化 segmented header
- 当前地图中支持“旅途轨迹”功能：
  - 默认关闭
  - 可通过开关显示
  - 只展示当前选中用户的轨迹
  - 同一用户按时间顺序生成弧线
  - 弧线带方向箭头
  - hover 弧线显示“起点 → 终点 + 时间”提示
- 地区 hover 卡片展示：
  - 地区名
  - 记录总数
  - 最近 1-2 条简要旅行记录

### 3. 旅行记录

- 点击地图区域后弹出录入表单
- 支持字段：
  - `scope / scopeId / scopeName`
  - `city`
  - `note`
  - `visitedStartAt`
  - `visitedEndAt`
  - `imageUrls`
- 支持上传多张图片到 ImgBB
- 记录列表支持：
  - 多图网格展示
  - 查看原图
  - 当前用户删除自己的记录
  - 卡片式旅行内容呈现

### 4. 旅伴管理

- 多用户模块已品牌化为“旅伴管理”
- 支持：
  - 切换当前用户
  - 新增用户
  - 为用户设置颜色
- 当前 UI 已包含：
  - 首字母头像徽章
  - 当前用户在线 / 激活状态
  - 颜色主题名
  - 品牌化表单条布局

## 技术栈

- React 19
- TypeScript
- Vite 7
- CSS（集中在 `src/styles/index.css`）
- `d3-geo`
- Vitest + Testing Library
- ImgBB API（图片上传）
- IndexedDB（主存储）
- `localStorage`（仅兼容旧数据迁移 / fallback）

## 当前数据模型

```ts
type Scope = 'domestic' | 'international';

interface UserProfile {
  id: string;
  name: string;
  color: string;
}

interface VisitMarker {
  id: string;
  userId: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}

interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
}
```

## 当前存储架构

项目已从旧的单一 `localStorage` 存储重构到 IndexedDB repository 层。

### IndexedDB schema

- `users`
- `markers`
- `meta`

### 当前分层

- `src/lib/repositories/travelStoreRepository.ts`
  - 负责 IndexedDB schema、升级、读写
- `src/lib/storage.ts`
  - 负责默认 store、数据归一化、旧数据迁移、`createUser / createMarker`
- `src/modules/App.tsx`
  - 负责异步加载持久化数据和保存状态

### 存储要求

- 保持向后兼容
- 不能破坏旧 `localStorage` 数据迁移能力
- 新增数据结构时优先考虑 migration

## 关键文件

### 入口模块

- `src/modules/App.tsx`

### 地图相关

- `src/components/TravelMap.tsx`
- `src/components/MapToggle.tsx`
- `src/geo/loader.ts`
- `src/geo/projection.ts`

### 记录相关

- `src/components/MarkerForm.tsx`
- `src/components/MarkerList.tsx`

### 用户相关

- `src/components/UserManager.tsx`

### 视觉系统

- `src/components/TravelIcon.tsx`
- `src/styles/index.css`

### 存储层

- `src/lib/storage.ts`
- `src/lib/repositories/travelStoreRepository.ts`

### 测试

- `src/components/__tests__/TravelMap.spec.tsx`
- `src/components/__tests__/UserManager.spec.tsx`
- `src/lib/repositories/__tests__/travelStoreRepository.spec.ts`

## UI / 设计约束

你在修改 UI 时，必须遵循当前项目已经形成的品牌风格：

### 风格关键词

- 轻
- 克制
- 旅行品牌感
- 不要后台系统感

### 避免

- 过重边框
- 太强烈的黑色描边
- 控件层层套边框
- 太“工具化”的勾选感

### 倾向

- 柔和背景分层
- 品牌蓝 / 青 / 橙色体系
- 轻阴影
- 轻 hover
- 内容卡片化
- 地图 / 旅途语义优先

## 开发要求

当你继续开发这个项目时，请遵循：

1. 优先理解现有模块，不要粗暴重写
2. 如果改存储层，必须考虑：
   - IndexedDB schema
   - migration
   - 测试覆盖
3. 如果改地图模块，必须考虑：
   - 缩放下的表现
   - hover 和 tooltip 的稳定性
   - 不要让新交互遮挡地图主体
4. 如果改 UI，必须延续现有品牌语言
5. 新增逻辑后，优先补最小必要测试
6. 改完后至少执行：
   - `npm run test`
   - `npm run build`

## 输出代码时的期望

- 优先做最小可维护改动
- 保持命名清晰
- 不引入无必要的新依赖
- 如果要新增模块，请说明它在当前架构中的职责
- 如果涉及状态流或存储迁移，请明确说明数据流变化
- 如果涉及 UI 改动，请说明为什么符合当前产品风格

## 当前 AI 的工作上下文

你正在一个已经具有以下状态的项目中工作：

- 品牌化首页已完成
- 地图模块已具备较完整交互
- 旅伴管理已完成品牌化重构
- 存储层已切换到 IndexedDB repository 架构
- 项目已有测试基建和部分单元测试

你的任务应该建立在这些现状之上，而不是退回到更简单的实现。
