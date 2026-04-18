# Voyage Atlas / 旅迹地图

`旅迹地图` 是一个基于 React + Vite + TypeScript 的个人旅行记录产品原型。它围绕“地图足迹 + 旅行相册 + 多人记录”展开，支持国内/世界地图切换、点击区域弹出录入、旅伴管理、图片上传到免费图床，以及基于 `IndexedDB` 的前端持久化存储。

## 功能特性

- `Hero` 首屏品牌区，包含地图线稿底纹、经纬网格、航线点亮动效
- 国内 / 世界两套地图视图切换，支持平滑滑块式视图切换按钮
- 点击地图区域弹出录入表单，自动带入省份 / 国家
- 支持城市录入、日期范围、旅行描述、图片上传
- 图片上传到 `ImgBB`，保存公网图片链接并支持多图预览
- 多用户 / 旅伴管理，支持独立颜色、当前用户切换和新增旅伴
- 旅行记录列表支持按用户筛选、图片预览、仅当前用户删除自己的记录
- 新增攻略搜索面板，支持关键词搜索、最近搜索词、结构化正文片段与原文跳转
- 地图支持缩放、平移、hover 提示、标签阈值显示与性能优化
- 响应式布局，兼容桌面端与移动端浏览

## 项目结构

```text
.
├── index.html
├── package.json
├── .env.example
├── server
│   ├── guideApiServer.mjs
│   ├── guideSearchEngine.mjs
│   └── adapters/
├── src
│   ├── components
│   │   ├── GuideSearchPanel.tsx
│   │   ├── MapToggle.tsx
│   │   ├── MarkerForm.tsx
│   │   ├── MarkerList.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── TravelIcon.tsx
│   │   ├── TravelMap.tsx
│   │   ├── UserManager.tsx
│   │   └── __tests__/
│   ├── data
│   │   └── regions.ts
│   ├── lib
│   │   ├── imageUpload.ts
│   │   ├── guides/
│   │   ├── repositories/
│   │   └── storage.ts
│   ├── test
│   │   └── setup.ts
│   ├── modules
│   │   └── App.tsx
│   ├── styles
│   │   └── index.css
│   ├── main.tsx
│   ├── types.ts
│   └── vite-env.d.ts
├── docs
│   ├── design-tokens.md
│   └── design-tokens.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

## 数据设计

### 用户

```ts
interface UserProfile {
  id: string;
  name: string;
  color: string;
}
```

### 旅行标记

```ts
interface VisitMarker {
  id: string;
  userId: string;
  scope: 'domestic' | 'international';
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}
```

### 本地存储

```ts
interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

- 当前主存储：`IndexedDB`
- 兼容迁移：若检测到旧版 `localStorage` 数据，会在首次读取时自动迁移

## 启动方式

```bash
npm install
npm run dev
```

如需联调真实攻略搜索服务，请额外启动：

```bash
npm run dev:guide-api
```

如需开启图片上传，请在本地配置：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填写：

```bash
VITE_IMGBB_API_KEY=your_imgbb_api_key
VITE_GUIDE_SEARCH_PROVIDER=remote
VITE_GUIDE_SEARCH_API_BASE_URL=/api/guides
VITE_GUIDE_SEARCH_API_KEY=
VITE_GUIDE_CONTENT_MODE=summary
GUIDE_POI_GEOAPIFY_API_KEY=your_geoapify_api_key
```

开发地址默认是：

- `http://localhost:5173/`
- 攻略服务默认监听：`http://localhost:8787/`

## 打包构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可直接部署到任意静态托管平台。

## 测试

```bash
npm run test
```

当前已覆盖：

- `TravelMap` 缩放阈值标签显示与点击选择
- `UserManager` 用户切换与新增用户交互
- `GuideSearchPanel` 搜索、结果渲染与正文片段查看
- 攻略搜索 service / repository / server engine 的基础能力

## 设计 Token

- 视觉 Token 文档：`docs/design-tokens.md`
- 说明了卡片、标题、按钮、弹窗和地图动态变量对应的 UI 组件

## 地图技术文档

- 地图绘制与 hover 性能优化：`docs/map-rendering-and-hover-performance.md`
- 说明了 GeoJSON 加载、投影渲染、标签策略、原生事件代理和性能优化演进

## 使用说明

1. 进入页面后可在地图模块头部切换 `国内地图 / 世界地图`
2. 点击地图任意区域，会弹出录入表单并自动带入对应省份或国家
3. 录入城市、旅行时间段、描述，可按需上传多张旅行图片
4. 在 `旅伴管理` 模块中切换当前记录者，或新增旅伴并设置地图颜色
5. 在记录列表中按当前模式查看旅行记录，支持按用户筛选、预览图片和删除自己的记录
6. 点击首页 `搜索旅游攻略`，或在旅行记录详情中点击 `查找攻略` 打开攻略搜索面板
7. 输入目的地、季节或玩法关键词后执行搜索，查看摘要、标签、来源与正文片段

## 技术说明

- 前端框架：React 19
- 构建工具：Vite 7
- 语言：TypeScript
- 地图实现：SVG 区域示意图 + `d3-geo`
- 数据存储：浏览器 `IndexedDB`（兼容旧 `localStorage` 迁移）
- 国内地图：本地静态文件 `public/maps/china-provinces.json`
- 国外地图：本地静态文件 `public/maps/world-countries.json`
- 图片上传：ImgBB API（读取 `VITE_IMGBB_API_KEY`）
- 攻略搜索：前端 `GuideSearchPanel` + provider 抽象 + 本地 `guide-api` 服务
- 单元测试：Vitest + Testing Library

## 当前界面形态

- 首页 `Hero`：品牌标题、旅行亮点 chips、地图线稿底纹、经纬网格、航线点亮动画
- 统计区：品牌化目的地卡片，带图标、轻文案和 hover 浮起
- 地图模块：品牌化标题区、segmented header、滑块式视图切换、品牌化缩放工具
- 旅伴管理：头像首字母徽章、在线光点、颜色主题名、品牌表单条
- 记录列表：旅行内容卡片、多图网格、图片原图预览
- 攻略搜索：右侧抽屉式搜索面板，支持列表结果与结构化正文片段联动

## 文档索引

- 视觉 Token 文档：`docs/design-tokens.md`
- 地图渲染与 hover 性能文档：`docs/map-rendering-and-hover-performance.md`
- 攻略搜索功能说明：`docs/guide-search-feature.md`
- 攻略搜索专项 Prompt：`docs/guide-search-prompt.md`
- 攻略搜索前端实现 Prompt：`docs/guide-search-frontend-prompt.md`
- 攻略搜索后端 Adapter Prompt：`docs/guide-search-adapter-prompt.md`
- 攻略搜索 API 合同：`docs/guide-search-api-contract.md`
- 攻略搜索设计文档：`docs/travel-guide-search-design.md`
- AI System Prompt：`docs/system-prompt.md`
- AI Task Prompt：`docs/task-prompt.md`
- AI Design Prompt：`docs/design-prompt.md`
- AI 项目总览 Prompt：`docs/project-ai-prompt.md`

## 后续可扩展方向

- 替换为真实 GeoJSON / TopoJSON 地图数据
- 增加游记详情页、图片灯箱和筛选标签
- 支持 JSON 导入导出
- 增加云端同步与多端数据管理
