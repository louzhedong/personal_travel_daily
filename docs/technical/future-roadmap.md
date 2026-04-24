# 未来 Roadmap / TODO

这份文档用于约束后续功能迭代方向。新增功能优先从这里选题，避免需求发散；当一个阶段性功能完成后，也需要同步刷新这里的“当前产品基线”和推荐顺序。

## 当前产品基线

截至当前版本，项目已经具备这些核心能力：

- 地图选区与旅行记录录入，支持国内 / 国际范围切换。
- 多旅伴切换、颜色区分和“仅本人可编辑/删除本人记录”的权限边界。
- 旅行记录详情、游记编辑、多图查看、日期区间维护和攻略关联。
- 旅行记录服务端全文搜索与组合筛选，支持回车触发搜索、跨范围定位详情和搜索行为后台记录。
- Server-side marker full-text search and combined filters are available, with Enter-to-submit search, cross-scope detail focusing, and admin-visible search behavior logs.
- 国内地图记录会汇总到世界地图“中国”区域，避免国内 / 世界视角数据割裂。
- Domestic markers are aggregated into the China region on the world map, keeping domestic and global map views consistent.
- 攻略搜索、正文阅读增强、搜索历史、收藏、关联到记录与回跳。
- 行程集合一期：创建行程、记录归属、时间线聚合、后端 Trip API 和后台展示。
- MySQL / Prisma 主数据层，覆盖账号、旅伴、行程、旅行记录、图片、攻略收藏和搜索历史。
- 登录注册、Cookie Session、会话恢复、退出登录和管理员只读后台。
- 管理员后台支持查看账号维度的旅行记录搜索行为，包括关键词、筛选范围、结果数和分页上下文。
- The admin console shows account-level marker search behavior, including keyword, filter scope, result count, and pagination context.
- Docker MySQL + Adminer 本地联调、一键 Windows 启动脚本和 Prisma migration 工作流。
- 本地数据备份、导出、导入与恢复作为兜底能力。
- IndexedDB 攻略缓存，以及前端第一轮模块拆分和纯逻辑测试补强。

这意味着后续不适合再重复补基础 CRUD，而更适合补“结构化回看、可检索性、可运营性和长期可维护性”。

## 优先级说明

- `P1`: 建议优先做，能明显放大现有数据价值。
- `P2`: 值得做，但依赖前面能力收口后推进更稳。
- `P3`: 中长期增强项，适合后续版本继续演进。

## 已完成里程碑

### 数据库升级到 MySQL

- 状态：已完成第一版。
- 已落地范围：
  - 服务端 MySQL / Prisma 数据模型覆盖账号、旅伴、行程、旅行记录、图片、攻略收藏和搜索历史。
  - App API 主路径接入服务端持久化，前端通过 bootstrap / mutation 接口同步 `TravelStore`。
  - 软删除、外键关系、归属校验、基础错误处理和正式 migration 工作流。
  - Docker MySQL 本地运行方案和一键启动脚本。
- 后续增强：
  - 更完整的数据迁移向导。
  - 跨设备同步策略、冲突处理和会话治理。
  - 更细的后台审计、运营筛选和数据修复工具。

### 认证与管理员后台

- 状态：已完成第一版。
- 已落地范围：
  - 登录、注册、Cookie Session、会话恢复和退出登录。
  - 默认账号 seed、账号角色和管理员鉴权。
  - `/admin` 只读后台，可查看账号、旅伴、行程、旅行记录、收藏攻略和搜索历史。
- 后续增强：
  - 账号设置、修改密码、多设备会话管理。
  - 管理员筛选、审计日志和数据修复动作。

### 行程集合 / Trip Collection

- 状态：已完成第一版。
- 已落地范围：
  - MySQL `Trip` 数据模型、`visit_markers.trip_id` 归属字段和 `/api/trips` 创建 / 更新 / 删除接口。
  - 前端创建行程入口已收进弹窗，新增和编辑旅行记录时可归属或解除归属。
  - 时间线支持按行程聚合展示，未归入行程保留独立分组。
  - 后台管理页支持查看行程统计、行程列表，以及旅行记录所属行程。
- 后续增强：
  - 前端行程编辑 / 删除入口。
  - 行程封面选择或从记录图片自动生成封面。
  - 行程详情页，集中展示记录、照片和关联攻略。
  - 批量把已有旅行记录归属到某个行程。

### 攻略搜索与阅读

- 状态：已完成可用版。
- 已落地范围：
  - 本地 mock / 远程攻略 API provider。
  - 多来源适配器、文档缓存、正文摘要展示和回到顶部体验。
  - 攻略收藏、关联旅行记录、解除关联和搜索历史。
- 后续增强：
  - 来源质量治理、去重、失效监控和结果质量评分。
  - 将收藏攻略沉淀为行前清单或行程准备内容。

### 架构瘦身与测试补强

- 状态：已完成第一轮。
- 已落地范围：
  - 抽取日期、排序、地图弧线、攻略正文视图、后台展示模型等纯逻辑。
  - 抽取 store action helper、地图上下文和详情定位辅助。
  - 为关键模块补充组件、API 和服务端测试。
- 后续增强：
  - 继续抽离 `useGuideSearchState`、`useMarkerDetailState`。
  - 为复杂联动 hook 和跨模块流程补更细的集成测试。

### 旅行记录服务端全文搜索与筛选 / Server-Side Marker Full-Text Search and Filters

- 状态 / Status：已完成第一版 / First version completed.
- 已落地范围 / Completed scope：
  - 为 `visit_markers(scope_name, city, note)` 建立 MySQL FULLTEXT 索引，MySQL 8.4 环境使用 ngram parser 支持中文关键词。
  - Added a MySQL FULLTEXT index for `visit_markers(scope_name, city, note)`; MySQL 8.4 uses the ngram parser for Chinese keyword support.
  - 新增 `GET /api/markers/search`，支持关键词、旅伴、范围、年份、分页组合筛选。
  - Added `GET /api/markers/search` with keyword, companion, scope, year, and pagination filters.
  - 查询限定当前登录账号与未删除记录；关键词优先使用 `MATCH ... AGAINST`，超短词使用受限 LIKE 兜底。
  - Queries are scoped to the current account and non-deleted markers; keywords use `MATCH ... AGAINST` first, with a constrained LIKE fallback for very short terms.
  - 前端旅行记录列表接入服务端搜索，搜索框改为按 Enter 发起请求，筛选项变更复用已提交关键词刷新结果。
  - The marker list now uses server search; the keyword box submits on Enter, while filter changes reuse the submitted keyword.
  - 搜索结果点击复用详情定位流程；跨国内 / 国际范围结果会先切换地图范围再打开详情。
  - Search results reuse the detail focusing flow; cross-scope results switch map scope before opening details.
  - 国内旅行记录会聚合到世界地图“中国”区域，保持世界视角统计直觉一致。
  - Domestic markers aggregate into China on the world map to keep global-view counts intuitive.
  - 新增 `marker_search_events` 行为记录，管理员后台可查看账号维度的记录搜索行为。
  - Added `marker_search_events` so admins can inspect account-level marker search behavior.
- 后续增强 / Follow-up enhancements：
  - 搜索结果分页加载更多。
  - Add paginated "load more" for search results.
  - 搜索建议、历史关键词快捷入口和高亮命中片段。
  - Add search suggestions, historical keyword shortcuts, and highlighted snippets.
  - 后台按时间范围 / 关键词统计搜索行为趋势。
  - Add admin analytics by time range and keyword.

## TODO Top 9

### 1. 行程统计中心 / Trip Statistics Center

- 优先级 / Priority：`P1`
- 为什么值得做：现在已有基础 `StatsPanel`，但还没有把“记录”转成更有成就感和回顾价值的数据视图。
- Why it matters: the app has a basic `StatsPanel`, but marker data has not yet become a richer achievement and retrospective view.
- 建议范围 / Suggested scope：
  - 总旅行天数、城市数、地区数、国家数。
  - Total travel days, city count, region count, and country count.
  - 年度统计与月度分布。
  - Yearly statistics and monthly distribution.
  - 最常访问地区 / 最活跃旅伴。
  - Most visited regions and most active companions.
  - 可作为首页第二屏或独立面板。
  - Can live as a second homepage section or standalone panel.

### 2. 记录标签系统

- 优先级：`P1`
- 为什么值得做：标签会显著提升搜索、筛选和内容组织能力，也能为后续 AI 或推荐能力打基础。
- 建议范围：
  - 给旅行记录添加标签。
  - 系统预置标签与自定义标签并存。
  - 支持按标签筛选时间线、列表、服务端搜索和统计。

### 3. 行程集合二期 UI 增强

- 优先级：`P1`
- 为什么值得做：后端基础 CRUD 已经具备，下一步应把行程从“分组”升级成可管理、可回看的核心对象。
- 建议范围：
  - 前端支持编辑 / 删除行程。
  - 支持设置行程封面，或从记录图片自动选封面。
  - 支持批量把已有旅行记录归属到某个行程。
  - 增加行程详情页，展示记录、照片、关联攻略和基础统计。

### 4. 攻略卡片沉淀与行前清单

- 优先级：`P2`
- 为什么值得做：攻略搜索已经可用，但现在更多是“查过、存过”，还没有转成真正可执行的旅行准备内容。
- 建议范围：
  - 从收藏攻略中提取“必去点 / 注意事项 / 交通提示”。
  - 支持用户勾选或手动整理成清单。
  - 清单可绑定到某个行程。

### 5. 地图回放模式

- 优先级：`P2`
- 为什么值得做：现有地图、轨迹、时间线已经具备基础，差一步就能形成非常强的回看体验。
- 建议范围：
  - 按时间顺序播放旅行记录。
  - 地图依次高亮地区与轨迹。
  - 可切换播放速度。
  - 与时间线保持同步高亮。

### 6. 分享页 / 旅行故事页

- 优先级：`P2`
- 为什么值得做：当前数据主要停留在“自己看”，分享能力会明显提升产品表达力。
- 建议范围：
  - 将单次行程或年度回顾生成可阅读页面。
  - 展示封面、时间线、照片和关联攻略。
  - 第一阶段可先做本地只读页，不必急着上真正公网分享。

### 7. 账号设置、会话治理与跨设备同步

- 优先级：`P2`
- 为什么值得做：基础登录注册已经完成，但长期使用会自然需要账号设置、多设备登录态和更完整同步策略。
- 建议范围：
  - 修改密码 / 账号设置。
  - 多设备登录态与会话治理。
  - 云端同步状态说明、冲突处理和最近修改优先策略。
  - 保留本地导出作为兜底。

### 8. 攻略质量治理与来源管理

- 优先级：`P3`
- 为什么值得做：攻略搜索已经可用，但随着适配器和数据量增加，结果质量、来源可信度和重复内容会成为问题。
- 建议范围：
  - 来源优先级配置。
  - 相似攻略合并或去重。
  - 结果质量打分。
  - 失效来源与抓取失败监控。

### 9. 架构层继续拆分与状态测试补强

- 优先级：`P3`
- 为什么值得做：前端已经完成第一轮瘦身，但继续上新功能时仍需要防止状态逻辑回流到页面容器层。
- 建议范围：
  - 抽离 `useGuideSearchState`。
  - 抽离 `useMarkerDetailState`。
  - 增加 hook 层单测。
  - 为关键联动流程补集成测试。

## 推荐执行顺序 / Recommended Execution Order

建议按下面顺序推进：
Recommended order:

1. 行程统计中心 / Trip Statistics Center
2. 记录标签系统 / Marker Tag System
3. 行程集合二期 UI 增强 / Trip Collection Phase 2 UI Enhancements
4. 攻略卡片沉淀与行前清单 / Guide Card Curation and Pre-Trip Checklist
5. 地图回放模式 / Map Replay Mode
6. 分享页 / 旅行故事页 / Share Page / Travel Story Page
7. 账号设置、会话治理与跨设备同步 / Account Settings, Session Governance, and Cross-Device Sync
8. 攻略质量治理与来源管理 / Guide Quality Governance and Source Management
9. 架构层继续拆分与状态测试补强 / Continued Architecture Splitting and State/Test Coverage

## 选题原则

以后如果要从这份清单中挑一个功能开做，优先满足这三个条件：

1. 能复用已有地图、时间线、攻略、MySQL 或存储能力
2. 能显著提升“回看价值”或“整理效率”
3. 不会把业务规则重新塞回页面容器层
