# 未来 Roadmap / Product Roadmap

这份文档用于在"当前已完成能力"的基础上，重新定义下一阶段迭代方向。目标不再是继续补基础 CRUD，而是围绕"回看价值、故事表达、整理效率和长期留存"做更有趣的功能规划。

This document redefines the next iteration plan based on what the product already ships today. The goal is no longer basic CRUD expansion, but a more interesting roadmap around retrospective value, storytelling, organization efficiency, and long-term retention.

## 已完成里程碑 / Completed Milestones

本章节集中记录"已经落地、不再列入未来 roadmap 推进队列"的能力，便于快速查阅历史进展。新增能力完成后应从下面的"下一阶段路线图"迁移到这里。

This section summarizes capabilities that have already shipped and are no longer on the active roadmap queue. Newly delivered items should be moved here from the "Next-Phase Roadmap" section.

### 地图记录主链路 / Core Map and Marker Flow

- 状态：已完成可用版。
- 已落地范围：
  - 主页地图支持国内 / 国际视角切换。
  - 地图区域支持 hover、点击联动筛选与快速录入。
  - 国内记录汇总到世界视角中的"中国"区域，避免国内 / 世界语义割裂。
  - `mapRegionResolver` 已统一标准化编码与地图区域映射。
- 后续增强：
  - 点击区域后的多维筛选联动可以继续深化到更多模块。

Summary: Map and marker capture is shipped and unified across domestic / global views.

### 独立统计中心与行程详情 / Stats Center and Trip Detail

- 状态：已完成第一版闭环。
- 已落地范围：
  - 独立统计中心 `/stats`，支持筛选、排行、摘要、趋势和地图热力图。
  - 国内统计热力图使用中国省级地图，国际热力图使用世界地图。
  - 行程详情页 `/trips/:id` 已支持总览、记录、照片和关联攻略的只读回看。
  - 统计中心与行程详情页之间的跳转链路已打通。
- 后续增强：
  - 更强的年度回顾和故事化表达。

Summary: The stats center and trip detail loop ships with drill-through and map heatmaps.

### 攻略搜索与阅读 / Guide Search and Reading

- 状态：已完成可用版。
- 已落地范围：
  - 多来源攻略搜索、正文摘要、正文阅读增强与缓存。
  - 收藏、搜索历史、关联到记录与回跳链路。
- 后续增强：
  - 攻略质量治理。
  - 攻略质量治理后的来源治理与质量评分。

Summary: Guide search, reading, save, and linking are all production-ready.

### 攻略提炼为行前清单 / Guide-to-Checklist Workflow

- 状态：已完成第一阶段闭环。
- 已落地范围：
  - 支持从攻略搜索结果即刻生成绑定到某个行程的行前清单，不要求先收藏。
  - 自动优先基于攻略正文提炼 3~8 条清单项，失败时会回退到搜索摘要。
  - 清单按 `出发前 / 旅途中 / 已完成` 三段分组，并支持手动新增、编辑、删除和切换阶段。
  - 行程详情页 `/trips/:id` 已内嵌清单面板，同时提供独立放大页 `/trips/:id/checklist`。
- 后续增强：
  - 支持从收藏攻略发起生成。
  - 引入更强的来源治理、拖拽排序与多攻略合并整理。

Summary: Guide-to-checklist now ships as a first-phase loop from search-result generation through trip-bound checklist management and an expanded checklist page.

### 行前规划工作台 / Trip Planning Workspace

- 状态：已完成第一阶段闭环。
- 已落地范围：
  - `/trips/:id` 行程详情页新增“规划”Tab，支持规划项新增、编辑、删除、优先级筛选和转旅行记录。
  - `TripPlanningItem` 绑定账号、行程和创建旅伴，保存地点、备注、优先级、预计日期、来源攻略、排序、状态和软删除时间。
  - 攻略搜索结果可直接加入目标行程规划，与“生成行前清单”并存。
  - 转旅行记录时复用 marker 创建规则，要求补充访问日期，写入 `convertedMarkerId` 并阻止重复转换。
  - 管理后台只读展示规划项统计和明细，不提供后台写操作。
- 后续增强：
  - 拖拽排序、按天分组、从规划批量生成清单。
  - 与愿望地图、照片精选和行程故事页进一步联动。

Summary: Trip Planning Workspace now ships as a first-phase trip-bound planning loop from guide search to desired-place management and post-trip conversion into markers.

### 认证、后台与主数据层 / Auth, Admin, and Persistent Data

- 状态：已完成第一版。
- 已落地范围：
  - 登录、注册、Cookie Session、管理员只读后台。
  - MySQL / Prisma 主数据层、migration 工作流和 demo seed。
  - 关键 API、组件和服务端测试补强。
- 后续增强：
  - 账号设置、多设备会话治理、后台分析和修复工具。

Summary: Auth, admin, and the MySQL-based data layer are all shipped and tested.

### 年度回顾页 / Annual Review Page

- 状态：已完成第一版。
- 已落地范围：
  - 提供 `/yearbook/:year` 独立年度回顾页。
  - 汇总年度摘要、高光、月度节奏、热力分布、照片和关联攻略。
  - 支持从年度回顾继续钻取到单次行程详情。
- 后续增强：
  - 年度一句话总结和更强的故事化模板。
  - 分享态和导出态的表达优化。

Summary: `/yearbook/:year` is live as a standalone retrospective page.

### 行程集合二期 / Trip Collection Phase 2

- 状态：已完成。
- 已落地范围：
  - 行程前端编辑 / 删除入口。
  - 行程封面选择与自动封面。
  - 从时间线批量把记录归属到某个行程，或移出行程。
  - 行程详情页支持总览、记录、照片、攻略与旅伴摘要的轻量编辑回看。
- 后续增强：
  - 行程照片精选、"封面故事"区块与行程内的地图回放入口。

Summary: Trip Collection Phase 2 ships with editable trips, cover management, batch marker assignment, and a richer detail page.

### 地图回放一期 / Map Replay Phase 1

- 状态：已完成并上线首页地图卡片。
- 已落地范围：
  - 首页地图卡片内嵌回放控制条，支持上一步、播放 / 暂停、下一步、结束与速度选择。
  - 回放序列按时间升序生成，并在地图上用移动圆点标签展示当前停留点。
  - 自动播放和手动步进都会沿旅途轨迹移动；手动步进时会临时显示两地间过渡轨迹。
  - 世界地图回放不依赖手动选中国家，国内城市会自动归属到中国，再与国际记录一起形成国家级路径。
  - 回放和旅途轨迹共享同一套区域归属逻辑，保持世界地图上的国家语义一致。
- 后续增强：
  - 行程内的回放入口与 "按年份 / 按行程" 切换。
  - 回放故事页与导出能力。

Summary: Map Replay Phase 1 is shipped inside the homepage map card with unified country-level mapping for the world view.

### 记录标签与轻量元数据 / Marker Tags and Lightweight Metadata

- 状态：已完成第一阶段闭环。
- 已落地范围：
  - `VisitMarker` 已扩展标签、心情、天气、交通方式、预算级别等轻量元数据字段。
  - `MarkerForm` 与 `MarkerDetailPanel` 已打通录入、查看和轻编辑链路。
  - 时间线、行程详情页和统计中心已显示元数据摘要，并支持按这些字段做筛选与排行。
  - 服务端 marker 搜索与统计聚合已支持标签和元数据过滤。
- 后续增强：
  - 标签治理后台、可配置词表与自定义标签能力。
  - 基于标签的旅行故事页、AI 整理与推荐链路。

Summary: Marker tags and lightweight metadata now ship as a first-phase closed loop across capture, edit, timeline/detail display, stats filtering, and backend search.

### 旅行成就系统 / Travel Achievement System

- 状态：二 / 三 / 四期合并完成。
- 已落地范围：
  - `/stats` 返回并展示 12 个固定旅行成就，覆盖足迹、节奏、旅伴、内容与风格分类。
  - 成就状态按当前统计筛选实时计算，支持 `unlocked / close / locked`、进度、剩余量和达成证据。
  - 默认全量统计视图会持久化首次解锁时间，筛选视图只做临时计算。
  - `/yearbook/:year` 展示年度成就，并按年份持久化首次解锁时间。
  - 成就卡片支持展开全部 / 收起和详情弹窗，弹窗内部滚动不会穿透到页面背景。
- 后续增强：
  - 成就分组页、稀有度、分享图和更强的故事化解释。

Summary: Travel achievements now ship across stats and annual review, with live progress, evidence, first-unlock persistence, and detail dialogs.

### 旅行故事页与导出增强 / Trip Story Export Enhancements

- 状态：已完成产品化增强。
- 已落地范围：
  - `/trips/:id/story` 将单次行程自动整理为私有故事页。
  - 复用行程详情聚合数据，展示封面、摘要、路线胶片、时间线、照片、攻略摘录和行前清单回顾。
  - 支持浏览器原生打印 / 保存 PDF，并提供 print 专用样式。
  - 支持杂志风 / 纪念册模板切换、智能故事序言和 SVG 长图导出。
  - `/yearbook/:year` 支持浏览器原生打印 / 保存 PDF。
  - 行程详情页保留“查看故事页”入口。
- 后续增强：
  - 公开分享链接、访问权限、图片精选优先级和地图回放截图占位。

Summary: Trip stories and annual reviews now support private printable/exportable artifacts without new backend persistence.

## 当前产品基线 / Current Product Baseline

截至当前版本，项目已经具备这些核心能力：

- 主页地图支持国内 / 国际切换、区域 hover、图例说明、区域点击联动筛选与快速新增记录。
- The homepage map supports domestic/global switching, hover feedback, legend guidance, region-driven filtering, and quick record entry.
- 旅行记录支持城市、起止日期、描述、多图上传、详情查看、编辑、删除和攻略关联。
- 多旅伴切换、颜色区分以及"仅本人可编辑/删除本人记录"的权限边界已经落地。
- 行程集合二期已完成，支持创建 / 编辑 / 删除行程、批量归属记录、封面管理与独立详情页回看。
- Trip Collection Phase 2 is available with full CRUD, batch marker assignment, cover management, a dedicated detail page, and a private printable story page.
- 行程详情页已提供 trip-bound 行前规划工作台，支持攻略搜索加入规划、规划项 CRUD、优先级筛选、预计日期和转旅行记录。
- Trip detail now includes a trip-bound planning workspace with guide-search intake, planning-item CRUD, priority filtering, planned dates, and marker conversion.
- 旅行记录已支持标签、心情、天气、交通方式与预算级别等轻量元数据，并已接入时间线、行程详情、统计中心与服务端搜索。
- Travel markers now support tags, mood, weather, transport, and budget metadata, and those fields are wired into the timeline, trip detail, stats center, and backend search.
- 独立统计中心 `/stats` 已完成，支持筛选、排行、趋势、国内中国地图 / 国际世界地图热力图，以及从统计钻取到行程详情。
- A standalone `/stats` center is available with filters, rankings, trends, China/world map heatmaps, and drill-down into trip details.
- 年度回顾页 `/yearbook/:year` 已上线，支持按年份生成私有年鉴式回看，并继续钻取到单次行程详情。
- The `/yearbook/:year` annual review page is live, offering a private yearbook-style retrospective with continued drill-down into trip details.
- 旅行成就系统已接入统计中心与年度回顾，支持实时进度、达成证据和首次解锁时间。
- Travel achievements are now wired into stats and annual review with live progress, evidence, and first-unlock moments.
- 地图回放一期已上线，首页地图卡片内嵌回放控制条、移动圆点与国家级路径回放。
- Map Replay Phase 1 is shipped inside the homepage map card with inline controls, moving dot labels, and country-level path replay.
- 攻略搜索、正文阅读增强、搜索历史、收藏、关联到旅行记录与返回链路已经打通。
- 攻略搜索结果已支持直接生成绑定到行程的行前清单，并在行程详情、独立清单页与故事页回顾中持续复用。
- 登录注册、Cookie Session、管理员只读后台、搜索行为日志和 MySQL / Prisma 持久化主链路已经可用。
- Docker MySQL + Adminer、本地 seed、`db:prepare-demo`、迁移工作流与关键前后端测试已经具备。

这意味着接下来的 roadmap 适合围绕这些"已有数据资产"继续做产品升级，而不是回头补通用型表单功能。

This means the next roadmap should amplify the value of existing data assets instead of circling back to generic form features.

## 产品方向 / Product Direction

从最新状态看，项目已经不缺“记录入口”，真正值得继续投入的是把已有数据变成更完整的旅行生命周期：出发前能计划，旅途中能整理，回来后能回看、表达和沉淀。

Given the current product baseline, the product no longer lacks capture surfaces. The next iteration should turn existing data into a fuller travel lifecycle: plan before departure, organize during the trip, and review, express, and preserve memories afterward.

下一阶段建议围绕 5 条主线推进：

1. **更强的旅行回看**
   Turn trips, stats, achievements, photos, guides, and map replay into memorable retrospectives.
2. **更强的行前规划**
   Extend the shipped planning workspace into wishlist maps, scheduling, and richer guide/checklist organization.
3. **更强的整理效率**
   Help users batch organize records, photos, guides, tags, companions, and trip-level assets with less friction.
4. **更强的表达与分享**
   Make selected memories exportable, shareable, and visually coherent without turning the private app into a social feed.
5. **更强的长期治理**
   Keep accounts, source quality, migrations, tests, and admin observability healthy as the product grows.

## 优先级说明 / Priority Legend

- `P1`: 建议优先做，能直接放大当前数据价值。
- `P2`: 很有趣且值得做，但依赖前一阶段收口后推进更稳。
- `P3`: 中长期方向，适合在产品表达更成熟后继续演进。

## 下一阶段路线图 / Next-Phase Roadmap

### 1. 愿望地图 / Wishlist Map

- 优先级：`P1`
- 为什么值得做：
  - 地图目前主要表达“去过哪里”，愿望地图能承接“想去哪里”，让首页地图从回顾工具升级为计划工具。
- 建议范围：
  - 增加“想去城市 / 想去国家 / 想去区域”清单。
  - 地图上区分 `visited / wishlist / both` 三种状态。
  - 可从攻略搜索结果、行程规划工作台和地图区域点击加入愿望清单。
  - 愿望项可关联攻略、备注、优先级和目标年份。

Summary: Wishlist map is the natural planning counterpart to the current visited-map experience.

### 2. 旅行故事页进阶 / Trip Story Evolution

- 优先级：`P2`
- 为什么值得做：
  - 故事页导出增强已经可用，下一步可以把它从“私有导出页面”升级为更有表达力的旅行作品。
- 建议范围：
  - 增加更多模板和移动端分享卡。
  - 引入精选照片优先级、成就片段和地图回放截图占位。
  - 探索真正的 AI 故事文案润色，但必须保留本地生成 fallback。
  - 后续再考虑公开分享链接和访问权限。

Summary: Trip story evolution should focus on stronger templates, share cards, and richer story composition.

### 3. 成就系统进阶 / Achievement System Evolution

- 优先级：`P2`
- 为什么值得做：
  - 成就一期已经打通统计中心、年度回顾、证据和首次解锁；下一步可以增强长期留存和表达，而不是继续堆固定 badge。
- 建议范围：
  - 成就分组页：按足迹、节奏、旅伴、内容、风格查看全部成就。
  - 成就稀有度、年度限定成就、连续年度成就和“下一步建议”。
  - 成就分享卡：生成单张可保存图片，复用成就证据和首次解锁时间。
  - 后台配置暂缓；二期仍以代码内固定规则为主，避免引入复杂运营系统。

Summary: Achievement evolution should deepen motivation and explainability without prematurely building a badge-management CMS.

### 4. 攻略搜索增强与来源治理 / Guide Search Enhancement and Source Governance

- 优先级：`P2`
- 为什么值得做：
  - 攻略搜索已经进入“能用”阶段，下一步瓶颈会从功能有无转向结果质量、可复查性和整理效率。
- 建议范围：
  - 搜索建议、历史关键词快捷入口、命中片段高亮、分页加载更多。
  - 收藏攻略去重增强：同源 URL、标题相似度和目的地维度的合并提示。
  - 来源优先级、结果质量评分、失效内容标记和抓取异常记录。
  - 管理员后台增加关键词趋势、失败率和来源健康度只读报表。

Summary: Guide search should evolve from retrieval into a governed content pipeline.

### 5. 照片与媒体整理 / Photo and Media Curation

- 优先级：`P2`
- 为什么值得做：
  - 照片已经进入记录、行程详情、年度回顾和成就，接下来需要更好的精选、排序和复用能力。
- 建议范围：
  - 行程级照片墙，支持封面候选、精选标记和排序。
  - 年度回顾和故事页优先使用精选照片。
  - 图片缺失、坏链、重复图片的轻量检测。
  - 后续再考虑相册导出和本地图片归档，不在一期引入重型媒体库。

Summary: Media curation improves every retrospective surface that already depends on photos.

### 6. 旅伴共同回忆 / Companion Shared Memories

- 优先级：`P2`
- 为什么值得做：
  - 当前旅伴是归属、筛选和权限维度，还没有变成“共同经历”的表达对象。
- 建议范围：
  - 行程内共同回忆摘要：同行次数、共同城市、共同照片、共同攻略。
  - 同一行程下不同旅伴视角统计。
  - 旅伴详情页：与某位旅伴一起去过哪里、常见主题、年度同行记录。
  - 第一阶段仍不做真实邀请协作，避免牵引权限模型大改。

Summary: Shared memories make companions emotionally meaningful while preserving the current single-account model.

### 7. 管理后台与质量巡检 / Admin Quality Operations

- 优先级：`P2`
- 为什么值得做：
  - 主数据和聚合功能变多后，需要后台能看见数据健康、接口异常和内容质量，而不是只看账号树。
- 建议范围：
  - 后台增加数据健康面板：记录数量、缺失图片、无行程记录、坏攻略链接、搜索失败率。
  - 增加迁移状态、最近错误、关键聚合接口响应概览。
  - 保持只读优先；修复工具等写能力单独设计权限和审计。

Summary: Admin operations should help detect data and integration problems before they become user-facing regressions.

### 8. 账号设置与会话治理 / Account Settings and Session Governance

- 优先级：`P3`
- 为什么值得做：
  - 当前认证链路已可用，但长期使用后，账户安全和多设备会话会成为基础体验。
- 建议范围：
  - 修改密码、账号资料、退出所有设备。
  - 最近登录设备和会话列表。
  - Cookie Session 过期提示与重新登录体验。
  - 数据导出入口收敛到账号设置，而不是散落在首页能力区。

Summary: Account settings are not flashy, but they matter once the app becomes a long-term personal archive.

### 9. 架构硬化与测试深水区 / Architecture Hardening and Test Depth

- 优先级：`P3`
- 为什么值得做：
  - 功能已经跨越地图、统计、行程、详情、攻略、成就、年度回顾和后台，后续继续上功能前需要持续防止容器层和聚合层变厚。
- 建议范围：
  - 继续抽离复杂状态 hook 和纯展示模型，特别是统计中心、年度回顾、行程详情和攻略面板。
  - 为地图联动、统计筛选、年度回顾、成就解锁和行程详情回看补更细的集成测试。
  - 为 Prisma migration、聚合 DTO 和错误码增加契约测试。
  - 增加关键页面的浏览器级冒烟检查：登录、统计中心、成就弹窗、行程详情、年度回顾。

Summary: Architecture hardening keeps future feature work from becoming slower and riskier.

## 推荐执行顺序 / Recommended Execution Order

建议按下面顺序推进（已完成项已挪到文档开头）：

1. 愿望地图 / Wishlist Map
2. 旅行故事页进阶 / Trip Story Evolution
3. 成就系统进阶 / Achievement System Evolution
4. 攻略搜索增强与来源治理 / Guide Search Enhancement and Source Governance
5. 照片与媒体整理 / Photo and Media Curation
6. 旅伴共同回忆 / Companion Shared Memories
7. 管理后台与质量巡检 / Admin Quality Operations
8. 账号设置与会话治理 / Account Settings and Session Governance
9. 架构硬化与测试深水区 / Architecture Hardening and Test Depth

## 选题原则 / Feature Selection Rules

以后如果从这份清单里挑一个功能开做，优先满足这五个条件：

1. 能复用已有地图、行程、统计、成就、攻略、照片或 MySQL 主数据能力。
2. 能显著提升"回看价值""行前规划""表达能力"或"整理效率"。
3. 用户能在 10 秒内感知到价值，不是只有后台数据变多。
4. 能保持私密个人工具的气质，不把产品强行推向公开社交。
5. 不把复杂业务规则重新塞回页面容器层或单个 service 文件。
