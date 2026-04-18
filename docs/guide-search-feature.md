# 攻略搜索功能说明

本文档描述当前仓库里已经落地的“搜索攻略”功能，重点覆盖用户入口、启动方式、环境变量、接口约定、缓存机制和当前能力边界。

## 1. 功能概览

当前版本已经支持：

- 在首页 Hero 区打开“搜索旅游攻略”面板
- 在旅行记录详情面板中，基于 `scopeName + city + 攻略` 一键发起搜索
- 按关键词搜索攻略，支持 `全部 / 国内 / 国际` 范围切换
- 展示攻略列表，包括标题、摘要、封面、来源、发布时间、标签
- 查看结构化正文片段
- 跳转原始来源页面
- 记录最近搜索词到本地 `IndexedDB`
- 缓存搜索结果与正文片段，减少重复请求

当前版本暂未开放：

- 从地图区域直接发起攻略搜索
- 在 UI 中收藏攻略或将攻略关联到某条旅行记录
- 分页“加载更多”
- 复杂 AI 摘要、行程生成或全文离线搜索

说明：
代码层已经预留了 `savedGuides` 等数据结构与仓储能力，但前端界面暂未提供对应操作入口。

## 2. 用户入口

当前有两个入口：

1. 首页 Hero 区按钮
   - 位置：页面顶部右侧
   - 行为：打开攻略搜索面板，初始关键词为空，范围为 `all`

2. 旅行记录详情面板按钮
   - 位置：`MarkerDetailPanel`
   - 行为：自动以 `${scopeName} ${city} 攻略` 作为关键词打开搜索面板
   - 范围：沿用该记录的 `scope`

涉及文件：

- [src/modules/App.tsx](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/modules/App.tsx)
- [src/components/GuideSearchPanel.tsx](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/components/GuideSearchPanel.tsx)
- [src/components/MarkerDetailPanel.tsx](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/components/MarkerDetailPanel.tsx)

## 3. 使用方式

### 3.1 基本搜索

1. 打开攻略搜索面板
2. 输入目的地、季节或玩法关键词
3. 选择搜索范围：`全部 / 国内 / 国际`
4. 点击“搜索”或按回车
5. 在左侧结果列表中选择攻略
6. 在右侧查看结构化正文片段

推荐关键词示例：

- `京都 樱花 攻略`
- `云南 自驾 攻略`
- `首尔 美食 攻略`
- `杭州 周末 攻略`

### 3.2 最近搜索词

- 面板会显示最近 6 条搜索词
- 点击历史词条会自动带入关键词和范围，并重新搜索
- 搜索历史保存在浏览器 `IndexedDB`

### 3.3 正文片段与外链

- “查看片段”会请求结构化正文内容
- “查看原文 / 查看来源”会新开页面跳转到原始链接
- 如果服务端没有对应正文，面板会继续展示摘要，并给出提示

## 4. 启动与配置

### 4.1 前端启动

```bash
npm install
npm run dev
```

默认前端地址：

- `http://localhost:5173/`

### 4.2 攻略服务启动

如果希望使用真实的远程 provider，而不是 mock 数据，还需要单独启动本地攻略服务：

```bash
npm run dev:guide-api
```

默认服务地址：

- `http://localhost:8787/health`
- `http://localhost:8787/api/guides/search`
- `http://localhost:8787/api/guides/document`

### 4.3 环境变量

参考 [`.env.example`](C:/Users/Administrator/Desktop/personal_travel_daily-main/.env.example)：

```bash
VITE_GUIDE_SEARCH_PROVIDER=remote
VITE_GUIDE_SEARCH_API_BASE_URL=/api/guides
VITE_GUIDE_SEARCH_API_KEY=
VITE_GUIDE_CONTENT_MODE=summary
GUIDE_POI_GEOAPIFY_API_KEY=your_geoapify_api_key
```

字段说明：

- `VITE_GUIDE_SEARCH_PROVIDER`
  - `mock`：使用前端内置假数据，适合本地联调和 UI 开发
  - `remote`：调用本地或远程攻略服务
- `VITE_GUIDE_SEARCH_API_BASE_URL`
  - 默认值是 `/api/guides`
  - 当前前端 provider 会优先尝试：
    - `http://当前主机:8787/api/guides`
    - `http://127.0.0.1:8787/api/guides`
    - `http://localhost:8787/api/guides`
    - 最后才使用配置值本身
- `VITE_GUIDE_SEARCH_API_KEY`
  - 可选，存在时会以 `Authorization: Bearer <token>` 发送
- `VITE_GUIDE_CONTENT_MODE`
  - 当前建议保持 `summary`
  - 表示前端按“摘要 + 结构化片段”的方式展示，不做第三方全文镜像
- `GUIDE_POI_GEOAPIFY_API_KEY`
  - 供服务端 POI adapter 使用

## 5. 前端实现说明

### 5.1 组件职责

- `GuideSearchPanel`
  - 管理关键词、范围、结果列表、选中文档、加载态和错误态
- `guideSearchService`
  - 负责搜索接口调用与搜索结果缓存
- `guideContentService`
  - 负责正文片段接口调用与正文缓存
- `guideRepository`
  - 负责搜索历史、搜索缓存、正文缓存等 `IndexedDB` 读写

对应文件：

- [src/components/GuideSearchPanel.tsx](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/components/GuideSearchPanel.tsx)
- [src/lib/guides/guideSearchService.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/lib/guides/guideSearchService.ts)
- [src/lib/guides/guideContentService.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/lib/guides/guideContentService.ts)
- [src/lib/repositories/guideRepository.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/lib/repositories/guideRepository.ts)

### 5.2 本地缓存策略

- 搜索结果缓存 TTL：30 分钟
- 正文片段缓存 TTL：24 小时
- 最近搜索词默认读取最近 20 条，面板中展示最近 6 条
- 搜索缓存键格式：
  - `v3:${scope}:${keyword}:${page}:${pageSize}`
- 正文缓存键：
  - `sourceUrl.trim().toLowerCase()`

### 5.3 IndexedDB 存储

当前攻略相关 object store：

- `savedGuides`
- `guideSearchHistory`
- `guideSearchCache`
- `guideDocumentCache`

数据库版本：

- `DB_VERSION = 3`

说明：
虽然 `savedGuides` 已存在，但当前界面还没有“收藏攻略”入口。

## 6. 服务端接口说明

服务端入口文件：

- [server/guideApiServer.mjs](C:/Users/Administrator/Desktop/personal_travel_daily-main/server/guideApiServer.mjs)

### 6.1 健康检查

- `GET /health`

返回当前服务状态、可用 adapter 和已缓存文档数量。

### 6.2 搜索接口

- `POST /api/guides/search`

请求体示例：

```json
{
  "keyword": "京都 樱花 攻略",
  "scope": "international",
  "page": 1,
  "pageSize": 8
}
```

返回字段包括：

- `items`
- `page`
- `pageSize`
- `hasMore`
- `provider`
- `fetchedAt`

### 6.3 正文接口

- `POST /api/guides/document`

请求体示例：

```json
{
  "sourceUrl": "https://example.com/guide"
}
```

返回结构化文档，包括：

- `title`
- `summary`
- `sourceName`
- `sourceUrl`
- `tags`
- `blocks`
- `fetchedAt`

### 6.4 数据来源优先级

当前服务端会组合以下来源：

- 本地 seed 数据
- 本地缓存文档
- adapter 注册表中的静态入口
- adapter 的实时搜索/抓取结果

当前仓库已包含多个 adapter，例如：

- `zh-wikivoyage`
- `zh-wikipedia`
- `kyoto-travel-cn`
- `geoapify-poi`
- `domestic-poi-starter`

API 详细约定可继续参考：

- [docs/guide-search-api-contract.md](C:/Users/Administrator/Desktop/personal_travel_daily-main/docs/guide-search-api-contract.md)

## 7. 测试覆盖

当前已覆盖的攻略搜索相关测试包括：

- [src/components/__tests__/GuideSearchPanel.spec.tsx](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/components/__tests__/GuideSearchPanel.spec.tsx)
- [src/lib/guides/__tests__/guideSearchService.spec.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/lib/guides/__tests__/guideSearchService.spec.ts)
- [src/lib/repositories/__tests__/guideRepository.spec.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/src/lib/repositories/__tests__/guideRepository.spec.ts)
- [server/__tests__/guideSearchEngine.spec.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/server/__tests__/guideSearchEngine.spec.ts)
- [server/__tests__/guideFileStore.spec.ts](C:/Users/Administrator/Desktop/personal_travel_daily-main/server/__tests__/guideFileStore.spec.ts)

运行方式：

```bash
npm run test
```

## 8. 已知限制

- 目前地图区域上还没有直接搜索攻略的快捷入口
- 搜索面板当前以单页列表展示为主，尚未开放“加载更多”
- 收藏攻略、攻略与旅行记录关联的数据结构已预留，但 UI 未接通
- 远程 provider 依赖本地攻略服务或外部数据源，可用性受 adapter 和网络情况影响
- 当前默认展示“摘要 + 结构化片段”，不提供第三方页面全文镜像

## 9. 相关文档

- [docs/travel-guide-search-design.md](C:/Users/Administrator/Desktop/personal_travel_daily-main/docs/travel-guide-search-design.md)
- [docs/guide-search-api-contract.md](C:/Users/Administrator/Desktop/personal_travel_daily-main/docs/guide-search-api-contract.md)
