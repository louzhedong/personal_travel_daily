# 旅游攻略搜索能力设计实现文档

## 1. 背景与目标

`Voyage Atlas / 旅迹地图` 当前聚焦于“地图足迹 + 旅行记录 + 图片相册 + 多用户同行”。用户可以记录自己去过哪里，但还不能围绕一个目的地继续完成“去之前先做攻略”和“去过之后回看攻略”的闭环。

本次能力扩展的目标是为项目增加“搜索旅游攻略”的能力，并且保持以下原则：

- 不破坏现有地图记录主流程，攻略搜索是增强能力，不替代旅途记录。
- 与当前前端架构兼容，优先采用“前端 + 外部攻略搜索服务”的方案。
- 首版先解决“能搜、能看、能关联目的地、能做轻量保存”，不一次性做成复杂内容社区。
- 兼顾国内和国际目的地，支持根据当前地图范围与已选地区快速发起搜索。

## 2. 需求拆解

### 2.1 用户核心诉求

- 计划出行前，想快速搜索某个城市 / 国家 / 省份的旅游攻略。
- 浏览攻略时，希望看到标题、摘要、来源、封面、更新时间等基础信息。
- 希望搜索结果和当前地图上下文相关，例如在“日本”或“云南”详情中直接搜索。
- 希望将有价值的攻略和自己的旅行记录建立关联，方便以后回看。

### 2.2 首版能力范围

首版建议包含：

- 按关键词搜索旅游攻略。
- 支持从地区名、城市名、记录详情一键带入搜索词。
- 展示攻略列表、加载状态、空状态、错误状态。
- 支持查看攻略卡片详情信息与外链跳转。
- 支持把攻略收藏到本地，或挂到某条 `VisitMarker` 下。
- 对最近搜索词与最近结果做本地缓存，减少重复请求。

首版暂不包含：

- 攻略内容全文抓取与重排。
- 多平台账号授权。
- 评论、点赞、社交分享。
- 复杂 AI 总结、行程自动生成。
- 离线全文搜索。

## 3. 产品方案

### 3.1 入口设计

建议提供三个入口，形成统一体验：

1. 顶部 Hero 或主内容区增加“搜索旅游攻略”入口。
2. `TravelMap` 选中地区后，在现有地区交互附近增加“搜索该地区攻略”快捷动作。
3. `MarkerDetailPanel` 内增加“查找同目的地攻略”按钮，用 `scopeName + city` 自动发起搜索。

这样可以覆盖三种典型使用场景：

- 没有记录之前，直接搜目的地。
- 看地图时，围绕当前地区找攻略。
- 看历史记录时，围绕某一次旅行补充攻略参考。

### 3.2 页面与交互形态

建议首版采用“右侧抽屉 / 详情面板”而不是新页面，原因：

- 当前项目已经有 `MarkerDetailPanel` 这一类侧边详情交互，用户心智一致。
- 不需要额外引入路由，保持单页应用结构简单。
- 更容易从地图、列表、详情间来回切换。

建议新增一个 `GuideSearchPanel`，结构如下：

- 顶部搜索区
  - 搜索输入框
  - 范围切换：`国内攻略 / 国际攻略 / 全部`
  - 搜索按钮
  - 最近搜索词
- 中部结果区
  - 加载骨架
  - 攻略卡片列表
  - 分页 / 加载更多
- 右侧或卡片内操作
  - 打开原文
  - 收藏攻略
  - 关联到当前记录
- 底部状态区
  - 数据来源说明
  - 请求失败提示

### 3.3 攻略卡片字段

首版统一为标准卡片模型：

- `title`
- `summary`
- `coverImageUrl`
- `sourceName`
- `sourceUrl`
- `publishedAt`
- `destinationLabel`
- `tags`
- `authorName`

显示层优先展示：

- 封面
- 标题
- 2 到 3 行摘要
- 来源 + 发布时间
- 标签
- 操作按钮

## 4. 技术方案

### 4.1 总体架构

当前项目是纯前端应用，没有自建后端。为了尽快落地，建议采用以下分层：

1. UI 层
   - `GuideSearchPanel`
   - `GuideSearchBar`
   - `GuideResultList`
   - `GuideResultCard`
2. 业务状态层
   - 在 `App.tsx` 中托管抽屉开关、当前查询词、当前关联 marker
   - 抽离 `useGuideSearch` hook 管理搜索过程
3. 服务适配层
   - `src/lib/guides/guideSearchService.ts`
   - `src/lib/guides/providers/...`
4. 持久化层
   - IndexedDB repository 增加攻略收藏 / 搜索缓存 / 最近搜索词

### 4.1.1 面向“网上资料抓取”的新增结论

如果需求明确为“具体攻略内容来自网上资料抓取”，则首版不建议让浏览器直接抓取目标站点页面，而应采用：

1. 后端采集服务定时或按需抓取允许抓取的站点。
2. 服务端解析页面正文、摘要、图片、标签、发布时间等字段。
3. 服务端做清洗、去重、摘要截断、来源归一化。
4. 前端只消费结构化结果，不直接承担抓取逻辑。

原因：

- 纯前端无法稳定处理跨域、反爬、限频与 HTML 解析差异。
- 目标站点结构变化会非常频繁，必须由服务端统一适配。
- 如果未来要做缓存、内容质量过滤、人工审核或 AI 摘要，服务端链路更合理。
- 可以更好地控制版权边界，避免把第三方全文直接存到客户端。

### 4.2 推荐接入模式

建议不要在 UI 组件里直接请求第三方接口，而是统一经过 provider 适配层：

```ts
interface GuideSearchProvider {
  search(params: GuideSearchParams): Promise<GuideSearchResponse>;
}
```

好处：

- 第三方平台可替换。
- 未来可以同时接多个来源再聚合。
- UI 与数据源细节解耦。
- 更方便测试。

### 4.3 外部服务接入策略

首版建议预留两种模式，但只实现其中一种：

#### 模式 A：前端直连第三方搜索 API

适合：

- 已有可公开访问的搜索接口。
- 支持 CORS。
- 允许前端使用受限 token。

优点：

- 实现最快。
- 不需要自建服务端。

缺点：

- token 泄露风险较高。
- 对接口稳定性和限流控制较弱。

#### 模式 B：通过轻量代理服务访问第三方搜索

适合：

- 接口需要密钥保护。
- 需要统一做结果归一化、限流、缓存、审计。

优点：

- 安全性更高。
- 更容易聚合多个来源。
- 可以统一做质量过滤。

缺点：

- 需要额外部署代理。

#### 模式 C：自建抓取与内容聚合服务

适合：

- 目标是展示“具体攻略内容”，而不是只做搜索跳转。
- 希望把多个站点的数据清洗成统一结构。
- 需要控制更新频率、内容片段长度、去重与来源优先级。

优点：

- 可控性最高。
- 可以沉淀统一的攻略内容模型。
- 更容易做缓存、分词、标签、热门目的地推荐。

缺点：

- 成本最高。
- 需要持续维护站点解析规则。
- 需要显式处理 robots、版权、来源署名与下线机制。

### 4.4 结合当前项目的推荐决策

结合当前仓库现状，建议文档阶段先按“前端统一服务抽象 + provider 层”设计，实施阶段优先落地：

- 本地开发：可配置 mock provider。
- 首版线上：优先接“代理服务 provider”。

原因：

- 项目当前已经使用环境变量管理第三方能力，比如 `ImgBB`。
- 攻略搜索比图片上传更容易受到 token、限流、反爬与来源稳定性的约束。
- 后续如果要引入 AI 摘要或结果清洗，代理服务更自然。

如果目标升级为“抓取网上具体攻略内容”，则进一步建议：

- 前端仍然保留 `provider` 抽象。
- `remote provider` 的后端不再只是简单转发搜索，而是“搜索 + 抓取 + 清洗 + 聚合”服务。
- 前端展示以“标题、摘要、封面、来源、链接、少量结构化片段”为主。
- 全文抓取结果只在服务端保留，不默认下发全文到前端。

## 4.5 抓取链路设计

### 4.5.1 推荐抓取流程

建议把网上攻略抓取拆成 5 个阶段：

1. 种子发现
   - 来自搜索引擎结果、公开 sitemap、站内列表页、RSS、人工配置来源。
2. 合规过滤
   - 检查站点 `robots.txt`
   - 检查页面 `meta robots` / `X-Robots-Tag`
   - 过滤显式禁止抓取或禁止索引片段使用的页面
3. 页面抓取
   - 获取 HTML
   - 根据站点规则决定是否需要 Headless 渲染
4. 内容抽取
   - 提取标题、摘要、封面、正文段落、目录、小节标题、发布时间、作者、标签
5. 归一化与入库
   - 去重
   - 清洗噪声
   - 生成标准内容模型
   - 建立来源追踪信息

### 4.5.2 建议抓取来源类型

优先级从高到低建议如下：

1. 官方旅游局 / 文旅局 / 景区官方网站
2. 公开许可转载的目的地介绍站点
3. 有明确 robots 允许且内容结构稳定的攻略类站点
4. RSS / Sitemap 可公开消费的旅行博客

首版不建议优先抓取：

- 明确禁止爬虫抓取的商业平台详情页
- 登录后才能看的内容
- 需要复杂动态渲染且高频变动的社区帖
- 页面版权声明明确限制转载或二次分发的内容

### 4.5.3 合规边界

抓取方案必须遵守以下边界：

- 遵守目标站点 `robots.txt`。RFC 9309 将其定义为 Robots Exclusion Protocol 标准；Google 也说明爬虫会先抓取并解析 `robots.txt` 规则。[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309) [Google Search Central](https://developers.google.com/search/reference/robots_txt)
- 页面级索引规则与抓取规则不同；`robots.txt` 主要控制抓取，`meta name="robots"` / `X-Robots-Tag` 主要影响索引行为，这两层都要检查。[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/robots)
- 首版只展示结构化摘要、来源信息与跳转链接，不默认展示第三方全文。
- 为每条攻略保留明确来源、原文链接、抓取时间、站点标识。
- 支持来源下线和内容删除机制，避免无法响应站点方要求。

### 4.5.4 采集频率建议

为了降低风险和被封禁概率，建议：

- 单站点启用限速队列。
- 首版只做热门目的地的预采集。
- 对搜索型按需抓取设置缓存，例如 6 到 24 小时。
- 页面抓取失败进入重试队列，但限制最大重试次数。

### 4.5.5 全文展示策略

如果用户强调“具体攻略内容”，建议首版采用“摘要 + 结构化片段 + 原文跳转”而不是第三方全文镜像：

- 页面顶部展示标题、封面、目的地标签、来源。
- 中间展示 2 到 5 段清洗后的关键片段，例如“交通”“住宿”“最佳季节”“推荐路线”。
- 底部提供“查看原文”按钮。

这样既能满足用户看具体内容的诉求，也能控制版权与数据体积风险。

## 5. 数据模型设计

### 5.1 新增类型定义

建议在 `src/types.ts` 中新增如下结构：

```ts
export interface GuideSearchParams {
  keyword: string;
  scope?: Scope | 'all';
  page?: number;
  pageSize?: number;
  markerId?: string;
}

export interface GuideSearchResult {
  id: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  authorName?: string;
  publishedAt?: string;
  destinationLabel?: string;
  tags?: string[];
}

export interface GuideContentBlock {
  id: string;
  type: 'paragraph' | 'bullet-list' | 'section-title' | 'tips';
  text: string;
}

export interface GuideDocument {
  id: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  authorName?: string;
  publishedAt?: string;
  destinationLabel?: string;
  tags?: string[];
  blocks: GuideContentBlock[];
  fetchedAt: string;
}

export interface GuideSearchResponse {
  items: GuideSearchResult[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  provider: string;
  fetchedAt: string;
}

export interface SavedGuide {
  id: string;
  markerId?: string;
  savedByUserId: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
  savedAt: string;
}

export interface GuideSearchHistoryItem {
  id: string;
  keyword: string;
  scope: Scope | 'all';
  createdAt: string;
}
```

### 5.2 TravelStore 扩展建议

如果首版要求“收藏攻略”和“最近搜索词”本地持久化，建议扩展 `TravelStore`：

```ts
interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

### 5.3 是否把搜索结果整体入库

不建议把每一次完整搜索结果或抓取全文长期保存到 `TravelStore` 中。

建议拆分为两类：

- 长期数据：用户主动收藏的攻略、最近搜索词。
- 短期缓存：最近一次或最近几次查询结果，单独放在缓存 store。

原因：

- 搜索结果体积大，长期存储会让主 store 膨胀。
- 外部内容天然会过期，适合短 TTL 缓存。
- 当前 `persistStore` 是“全量覆盖写入”，大对象会放大读写成本。
- 如果把第三方正文完整写入本地 store，会明显放大 IndexedDB 体积和同步成本。

## 6. 持久化与迁移设计

### 6.1 IndexedDB schema 变更

当前 repository 中已有：

- `users`
- `markers`
- `meta`

建议新增：

- `savedGuides`
- `guideSearchHistory`
- `guideSearchCache`
- `guideDocumentCache`

其中：

- `savedGuides` 用于收藏或关联到 marker 的攻略。
- `guideSearchHistory` 用于最近搜索词。
- `guideSearchCache` 用于查询缓存，带 TTL。
- `guideDocumentCache` 用于短期缓存抓取后的结构化正文片段。

### 6.2 版本迁移策略

建议把 `DB_VERSION` 从 `2` 升到 `3`，在 `onupgradeneeded` 中增加新 store。

迁移原则：

- 只新增 store，不修改老 store keyPath。
- 当旧数据不存在时，使用空集合初始化。
- 不阻断当前 `users / markers / meta` 读写。

### 6.3 缓存键设计

建议缓存键为：

```ts
`${scope}:${keyword.trim().toLowerCase()}:${page}:${pageSize}`
```

缓存记录结构：

```ts
interface GuideSearchCacheRecord {
  key: string;
  params: GuideSearchParams;
  response: GuideSearchResponse;
  expiresAt: string;
}

interface GuideDocumentCacheRecord {
  key: string;
  document: GuideDocument;
  expiresAt: string;
}
```

### 6.4 TTL 策略

首版建议：

- 搜索结果缓存 TTL：6 小时
- 攻略正文片段缓存 TTL：24 小时
- 最近搜索词保留：最近 20 条
- 收藏攻略：长期保留

## 7. 组件与模块拆分建议

### 7.1 新增文件建议

建议新增以下模块：

```text
src/
  components/
    GuideSearchPanel.tsx
    GuideSearchBar.tsx
    GuideResultList.tsx
    GuideResultCard.tsx
    GuideSearchEntry.tsx
  lib/
    guides/
      guideSearchService.ts
      guideSearchCache.ts
      providers/
        mockGuideSearchProvider.ts
        remoteGuideSearchProvider.ts
      guideContentService.ts
  lib/repositories/
    guideRepository.ts
```

### 7.2 与现有模块的关系

- `App.tsx`
  - 管理攻略搜索面板的开关与上下文
  - 控制“从哪里打开搜索”
- `TravelMap.tsx`
  - 通过 `onOpenGuideSearch(region)` 把地区信息抛给 `App`
- `MarkerDetailPanel.tsx`
  - 增加“搜索同目的地攻略”“收藏到本次旅行”的协同入口
- `storage.ts`
  - 扩展默认 store、normalize 逻辑、兼容老数据
- `travelStoreRepository.ts`
  - 升级 schema 或拆出新的 `guideRepository.ts`

### 7.3 状态流建议

建议将搜索过程状态集中在 `GuideSearchPanel` + `useGuideSearch`：

- `query`
- `scope`
- `page`
- `items`
- `hasMore`
- `loading`
- `error`
- `provider`
- `linkedMarkerId`

避免把完整搜索结果塞回 `App.tsx` 的全局 store，减少无关组件重渲染。

## 8. 用户流程设计

### 8.1 从地图发起搜索

1. 用户在地图中点击某个地区。
2. 在地区相关浮层或快捷入口点击“搜索攻略”。
3. 打开 `GuideSearchPanel`。
4. 自动填入地区名，例如“云南 旅游攻略”或“Japan travel guide”。
5. 返回结果列表。
6. 用户可选择打开原文、收藏、关联到某次旅行记录。

### 8.2 从旅行记录详情发起搜索

1. 用户打开 `MarkerDetailPanel`。
2. 点击“查找同目的地攻略”。
3. 自动用 `scopeName + city` 组合关键词。
4. 若该记录已经收藏过攻略，优先展示已收藏状态。

### 8.3 直接搜索

1. 用户点击顶部“搜索旅游攻略”。
2. 手动输入关键词，例如“京都 秋天 攻略”。
3. 查看结果。
4. 若没有搜索结果，提示换词建议，如“只搜目的地 + 季节”。

## 9. UI 设计原则

要延续现有项目的品牌风格，不做成“工具后台”。

建议保持：

- 面板沿用现有 `MarkerDetailPanel` 的柔和卡片与抽屉语言。
- 搜索框和筛选控件使用品牌蓝 / 青 / 橙色强调。
- 卡片封面使用圆角与轻阴影，不引入重边框。
- 空状态文案继续使用旅行语义，例如“这条路线还没找到合适的灵感”。

避免：

- 像后台管理系统一样的表格搜索页。
- 过密的过滤器矩阵。
- 大量技术性字段直接暴露给用户。

## 10. API 与错误处理设计

### 10.1 环境变量

若实施远程 provider，建议预留：

```bash
VITE_GUIDE_SEARCH_PROVIDER=mock
VITE_GUIDE_SEARCH_API_BASE_URL=
VITE_GUIDE_SEARCH_API_KEY=
VITE_GUIDE_CONTENT_MODE=summary
```

其中：

- `mock` 用于本地开发与无网络场景。
- `remote` 用于真实查询。
- `VITE_GUIDE_CONTENT_MODE=summary` 表示前端默认只展示摘要和结构化片段，而不是全文镜像。

### 10.2 服务调用流程

```ts
GuideSearchPanel
  -> useGuideSearch
  -> guideSearchService.search()
  -> provider.search()
  -> normalize response
  -> cache response
  -> render items
```

若用户打开某篇攻略详情：

```ts
GuideSearchPanel
  -> guideContentService.getDocument(sourceUrl)
  -> remote provider / aggregator
  -> fetch parsed content blocks
  -> cache document
  -> render structured content
```

### 10.3 错误分级

建议至少区分三类错误：

1. 网络错误
   - 提示“网络连接失败，请稍后重试”
2. 限流或服务不可用
   - 提示“当前攻略搜索较繁忙，请稍后再试”
3. 空结果
   - 提示“暂时没有找到匹配攻略，试试更短的关键词”

### 10.4 降级策略

若远程 provider 失败：

- 优先回退到缓存结果。
- 若无缓存，提示失败状态。
- 本地开发环境可以回退到 mock provider。

## 11. 测试方案

### 11.1 单元测试

建议补充：

- `guideSearchService.spec.ts`
  - 正常搜索
  - provider 报错
  - 缓存命中
  - 缓存过期
- `guideContentService.spec.ts`
  - 正文片段查询成功
  - 抓取结果清洗
  - 内容缓存命中
  - 远程失败时回退摘要
- `guideRepository.spec.ts`
  - 保存收藏攻略
  - 删除收藏攻略
  - 保存最近搜索词
- `GuideSearchPanel.spec.tsx`
  - 输入搜索词并展示结果
  - 空状态
  - 错误状态
  - 关联 marker 的按钮行为

### 11.2 集成验证

至少验证以下场景：

- 从地图入口发起搜索。
- 从详情面板入口发起搜索。
- 收藏攻略后刷新页面仍能保留。
- 老用户数据升级后不影响已有 `markers` 与 `users`。

### 11.3 构建验证

实施阶段完成后，执行：

- `npm run test`
- `npm run build`

## 12. 分阶段实施建议

### Phase 1：基础搜索面板

目标：

- 完成 `GuideSearchPanel`
- 接入 mock provider
- 支持手动搜索与地区自动带词
- 支持点开单篇攻略的结构化摘要详情

不做：

- 本地收藏
- 与 marker 关联
- 持久化缓存
- 实站全文抓取

### Phase 2：真实数据接入

目标：

- 增加 remote provider
- 加入统一响应归一化
- 支持分页 / 加载更多
- 支持错误与降级策略
- 接入聚合服务返回“结构化内容片段”

### Phase 3：收藏与关联

目标：

- 支持收藏攻略
- 支持把攻略关联到某条 `VisitMarker`
- 增加最近搜索词
- 增加 IndexedDB 持久化与 migration
- 增加正文片段缓存

### Phase 4：体验增强

目标：

- 基于 marker 自动推荐攻略词
- 支持“季节 / 亲子 / 徒步 / 美食”等轻筛选
- 支持 AI 生成简要导读

## 13. 风险与决策点

### 13.1 最大风险

- 外部攻略来源稳定性不确定。
- 纯前端直连可能遇到 CORS、限流、鉴权问题。
- 搜索结果质量受第三方返回结构影响较大。
- 抓取规则会因目标站点 DOM 变化而失效。
- 若没有控制展示边界，存在较高版权和转载风险。

### 13.2 关键决策

实施前需要明确：

1. 首版是否允许接第三方外链跳转，而不是站内全文展示。
2. 是否接受“首版仅接一个搜索来源”。
3. 是否需要把攻略收藏与 `VisitMarker` 强绑定，还是允许独立收藏。
4. 是否只展示摘要与结构化片段，而不展示完整第三方正文。

当前建议：

- 首版允许外链跳转。
- 首版只接一个 provider。
- 收藏既支持独立保存，也支持关联到 marker。
- 首版优先展示摘要与结构化片段，不做第三方全文镜像。

## 14. 推荐实施顺序

建议按以下顺序落地：

1. 补类型定义与 mock provider。
2. 做 `GuideSearchPanel` 静态 UI 和基本状态流。
3. 从 `App.tsx`、`TravelMap.tsx`、`MarkerDetailPanel.tsx` 打通入口。
4. 接入 remote provider。
5. 增加收藏、历史、缓存。
6. 最后再做样式细节和体验优化。

## 15. 本文档对应的最小可行实现

如果下一步进入开发，最小可行版本建议只做：

- 新增 `GuideSearchPanel`
- 支持关键词搜索
- 支持 mock / remote provider 抽象
- 支持从地图和详情面板带入目的地
- 展示列表、加载、空状态、错误状态

这样可以先把“能在项目中搜索旅游攻略”跑通，再继续补持久化、收藏和 marker 关联能力。
