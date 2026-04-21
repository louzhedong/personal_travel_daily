# 攻略搜索后端 Adapter Prompt

本文档提供一组专门面向“搜索攻略”后端 adapter / 聚合服务的 prompt，适合直接复制给 AI，用于新增 adapter、修复抓取逻辑、调整聚合策略、优化缓存和接口返回。

## 1. 适用范围

这套 prompt 主要适用于以下工作：

- 新增或修改 `server/adapters/*`
- 调整 adapter 的 `entries / search / getDocument`
- 调整 `server/guideApiServer.mjs`
- 调整 `server/guideSearchEngine.mjs`
- 调整 `server/guideFileStore.mjs`
- 调整抓取、解析、聚合、缓存落盘逻辑
- 补服务端测试、接口文档和 adapter 说明

不适用于：

- `GuideSearchPanel` 前端交互设计
- 前端状态流与样式优化
- IndexedDB 前端缓存或搜索历史交互

## 2. Adapter 上下文 Prompt

```md
你正在维护 `旅迹地图 / Voyage Atlas` 项目中的“搜索攻略”后端 adapter / 聚合服务。

请基于当前仓库已有实现继续工作，而不是重新设计一套新后端。

当前后端已知实现如下：

- 本地服务入口是 `server/guideApiServer.mjs`
- 当前公开接口为：
  - `GET /health`
  - `POST /api/guides/search`
  - `POST /api/guides/document`
- adapter 聚合入口为 `server/adapters/index.mjs`
- 单个 adapter 目前遵循以下能力模型：
  - `id`
  - `entries`
  - 可选 `search(params)`
  - `getDocument(sourceUrl)`
- 当前已存在的 adapter 包括：
  - `zhWikivoyageAdapter`
  - `zhWikipediaAdapter`
  - `kyotoTravelCnAdapter`
  - `qyerForumAdapter`
  - `geoapifyPoiAdapter`
  - `domesticPoiStarterAdapter`
- 目录搜索与排序由 `server/guideSearchEngine.mjs` 负责
- 文件缓存由 `server/guideFileStore.mjs` 负责
- 文档结构化解析可复用 `server/adapters/htmlGuideUtils.mjs`
- 前端当前消费边界是“搜索结果 + 结构化正文片段 + 原文跳转”，不是第三方全文镜像

后端工作要求：

1. 先阅读现有 adapter 和聚合链路，再做增量修改
2. 保持 `/api/guides/search` 与 `/api/guides/document` 合同稳定
3. 不要把 adapter 改成与现有聚合器不兼容的结构
4. 如涉及缓存、抓取、解析规则，明确说明影响
5. 不要默认扩大为第三方全文镜像或破坏当前版权 / 合规边界
5. 修改后给出必要验证结果
```

## 3. 新增 Adapter Prompt

```md
请为 `旅迹地图 / Voyage Atlas` 的“搜索攻略”服务新增一个 adapter。

开始前请先阅读：

- `server/adapters/index.mjs`
- `server/adapters/types.mjs`
- `server/adapters/htmlGuideUtils.mjs`
- 至少一个现有 adapter，例如：
  - `server/adapters/zhWikivoyageAdapter.mjs`
  - `server/adapters/kyotoTravelCnAdapter.mjs`
- `server/guideApiServer.mjs`
- `server/guideSearchEngine.mjs`

实现要求：

1. 新 adapter 必须兼容当前聚合器的使用方式
2. 至少说明以下内容：
   - 数据来源是什么
   - `entries` 是否提供静态入口
   - 是否实现 `search(params)`
   - 如何根据 `sourceUrl` 命中 `getDocument`
3. 返回的数据结构必须兼容现有搜索结果和文档结构
4. 如需解析 HTML，优先复用 `htmlGuideUtils.mjs`
5. 如需发起远程请求，保持错误格式与现有 adapter 一致
6. 不要破坏 `guideFileStore` 的缓存复用逻辑
7. 补最小必要测试

输出时请按以下结构：

1. 当前现状
2. 新 adapter 的职责
3. 接入方案
4. 风险点
5. 验证结果
```

## 4. Adapter 修复 Prompt

```md
请修复 `旅迹地图 / Voyage Atlas` 中某个攻略 adapter 的问题。

请优先沿以下链路排查：

1. adapter 是否被 `server/adapters/index.mjs` 正确注册
2. `search(params)` 是否返回了兼容 `createCatalogEntry` 的结构
3. `sourceUrl` 是否能被 `getDocument(sourceUrl)` 正确识别
4. HTML / JSON 解析逻辑是否仍适配目标站点
5. 失败时是否按现有约定抛出可识别错误
6. 是否影响：
   - `/api/guides/search`
   - `/api/guides/document`
   - `guideFileStore` 缓存落盘
   - `guideSearchEngine` 排序与过滤

请输出：

1. 确认过的链路
2. 根因判断
3. 最小修复方案
4. 验证方式
```

## 5. 聚合服务优化 Prompt

```md
请优化 `旅迹地图 / Voyage Atlas` 中“搜索攻略”后端聚合服务。

重点关注以下文件：

- `server/guideApiServer.mjs`
- `server/guideSearchEngine.mjs`
- `server/guideFileStore.mjs`
- `server/adapters/index.mjs`

请先判断这次改动主要属于哪一层：

- 路由层
- 聚合层
- 搜索排序层
- 文件缓存层
- adapter 编排层

优化时请遵循：

- 尽量保持接口合同稳定
- 优先做最小可维护改动
- 不要引入和当前项目体量不匹配的重框架
- 保持“搜索结果 + 结构化正文片段”的产品边界
- 不要把服务端变成第三方全文镜像系统

如果改动影响返回结构、缓存行为或 adapter 编排顺序，请明确说明。
```

## 6. Adapter 文档 Prompt

```md
请为 `旅迹地图 / Voyage Atlas` 的“搜索攻略”后端 adapter / 聚合服务补充文档。

请重点说明：

- 当前服务端接口
- adapter 的组织方式
- 单个 adapter 需要满足的最小能力
- `createCatalogEntry` 的作用
- `guideSearchEngine` 如何过滤和排序
- `guideFileStore` 如何缓存文档和目录索引
- 当前已接入的 adapter 列表
- 新增 adapter 时应遵循的约束
- 已知限制与风险边界

优先同步：

- `docs/guide-search-api-contract.md`
- `docs/guide-search-feature.md`
- `docs/guide-search-prompt.md`
- `docs/travel-guide-search-design.md`
- `README.md`
```

## 7. 后端测试 Prompt

```md
请为 `旅迹地图 / Voyage Atlas` 的“搜索攻略”后端 adapter / 聚合服务补充最小必要测试。

测试应优先覆盖：

- `guideSearchEngine` 的过滤与排序
- adapter 返回结构是否兼容
- `sourceUrl` 到 `getDocument` 的命中链路
- `guideFileStore` 的缓存读写
- 新增 adapter 的核心 happy path

要求：

- 优先补高价值测试
- 不要为了覆盖率而写低价值测试
- 如果是站点相关 adapter，尽量隔离外部依赖，不做脆弱的真实网络测试
```

## 8. 推荐参考文件

- [server/guideApiServer.mjs](../server/guideApiServer.mjs)
- [server/guideSearchEngine.mjs](../server/guideSearchEngine.mjs)
- [server/guideFileStore.mjs](../server/guideFileStore.mjs)
- [server/adapters/index.mjs](../server/adapters/index.mjs)
- [server/adapters/types.mjs](../server/adapters/types.mjs)
- [server/adapters/htmlGuideUtils.mjs](../server/adapters/htmlGuideUtils.mjs)
- [server/adapters/zhWikivoyageAdapter.mjs](../server/adapters/zhWikivoyageAdapter.mjs)
- [docs/guide-search-api-contract.md](./guide-search-api-contract.md)
