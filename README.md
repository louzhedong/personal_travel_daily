# Voyage Atlas / 旅迹地图

`旅迹地图` 是一个基于 React + Vite + TypeScript 的旅行记录产品原型。它围绕“地图足迹、多人记录、旅行相册、攻略搜索与本地持久化”展开，当前以浏览器端体验为主，强调轻量、直观和可持续迭代。

## 当前能力

- 国内 / 世界地图双视图切换，支持点击区域录入旅行记录
- 旅行记录支持城市、日期范围、旅行印象与多图上传
- 多旅伴视角切换，不同用户以不同颜色区分旅行足迹
- 旅行记录详情面板，支持图片预览、编辑、查看同目的地攻略
- 攻略搜索抽屉，支持关键词搜索、范围筛选、搜索历史、结构化正文片段
- 攻略收藏与记录关联，支持在侧栏集中查看当前用户的收藏内容
- 浏览器 `IndexedDB` 持久化，并兼容旧版 `localStorage` 数据迁移
- 数据备份 / 恢复能力，便于导入导出本地快照

## 技术栈

- React 19
- TypeScript 5
- Vite 7
- Vitest + Testing Library
- `d3-geo`
- IndexedDB

## 快速开始

```bash
npm install
npm run dev
```

前端默认地址：

- `http://localhost:5173/`

如果需要联调真实攻略搜索服务，再额外启动：

```bash
npm run dev:guide-api
```

服务默认地址：

- `http://localhost:8787/health`
- `http://localhost:8787/api/guides/search`
- `http://localhost:8787/api/guides/document`

## 环境变量

先创建本地配置：

```bash
cp .env.example .env.local
```

常用变量如下：

```bash
VITE_IMGBB_API_KEY=your_imgbb_api_key
VITE_GUIDE_SEARCH_PROVIDER=remote
VITE_GUIDE_SEARCH_API_BASE_URL=/api/guides
VITE_GUIDE_SEARCH_API_KEY=
VITE_GUIDE_CONTENT_MODE=summary
GUIDE_POI_GEOAPIFY_API_KEY=your_geoapify_api_key
```

说明：

- `VITE_GUIDE_SEARCH_PROVIDER=mock` 时，前端使用内置 mock 数据，适合本地 UI 联调
- `VITE_GUIDE_SEARCH_PROVIDER=remote` 时，前端会调用本地或远程攻略服务
- `VITE_GUIDE_CONTENT_MODE` 当前建议保持 `summary`

## 项目结构

```text
.
├── docs
├── public
├── server
│   ├── adapters
│   ├── cache
│   ├── guideApiServer.mjs
│   ├── guideFileStore.mjs
│   ├── guideSearchEngine.mjs
│   └── guideSeedData.mjs
├── src
│   ├── components
│   ├── data
│   ├── geo
│   ├── lib
│   │   ├── guides
│   │   └── repositories
│   ├── modules
│   ├── styles
│   └── test
├── package.json
└── vitest.config.ts
```

更详细的模块说明见 [docs/project-overview.md](docs/project-overview.md)。

## 数据模型

核心状态保存在 `TravelStore`：

```ts
interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

说明：

- `users` 管理旅伴身份与颜色
- `markers` 保存旅行记录主体
- `savedGuides` 保存攻略收藏和与记录的关联关系
- `guideSearchHistory` 保存攻略搜索历史

## 测试

```bash
npm run test
```

当前测试主要覆盖：

- 地图交互与缩放标签策略
- 旅伴切换与新增交互
- 攻略搜索结果、正文片段与收藏/关联相关交互
- 本地 repository 与服务端搜索引擎基础能力

## 文档索引

- [项目总览](docs/project-overview.md)
- [攻略搜索功能说明](docs/guide-search-feature.md)
- [攻略搜索 / 收藏 / 关联设计文档](docs/travel-guide-search-design.md)
- [Guide Search API Contract](docs/guide-search-api-contract.md)
- [视觉 Token 说明](docs/design-tokens.md)
- [地图绘制与 Hover 性能优化](docs/map-rendering-and-hover-performance.md)
- [项目 AI Prompt](docs/project-ai-prompt.md)
- [System Prompt](docs/system-prompt.md)
- [Task Prompt](docs/task-prompt.md)
- [Design Prompt](docs/design-prompt.md)

## 当前注意点

- 仓库已经支持攻略收藏与记录关联，但这部分的权限边界和去重规则仍在收敛中
- 文档层面已经把预期行为和实现边界单独整理在设计文档中，后续改动建议先对齐 [docs/travel-guide-search-design.md](docs/travel-guide-search-design.md)
- 如果要继续扩展攻略功能，优先复用现有 `GuideSearchPanel`、`guideRepository` 和 provider 抽象，而不是旁路新增状态流
