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

- 状态：增强版已完成。
- 已落地范围：
  - 多来源攻略搜索、正文摘要、正文阅读增强与缓存。
  - 收藏、搜索历史、关联到记录与回跳链路。
  - 搜索结果支持分页加载更多、命中高亮和基于历史的“猜你想搜”建议。
  - 搜索历史会记录最近一次结果数量，便于前端建议与快捷入口复用。
  - 前端每次搜索都会写入 `guide-search-logs`，后台可查看关键词趋势、状态分布和来源健康度。
  - 搜索结果会按来源健康度展示轻提示徽章，后台新增搜索趋势与来源健康度面板。
- 后续增强：
  - 更强的结果质量评分与来源优先级。
  - 后续如要加入后台修复能力，再单独设计权限与审计。

Summary: Guide search, reading, save, and linking are now production-ready with pagination, highlighting, suggestion chips, search logging, and source-governance visibility.

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
  - `/trips/:id` 行程详情页新增“行前规划”Tab，支持规划项新增、编辑、删除、愿望导入、优先级筛选和转旅行记录。
  - `TripPlanningItem` 绑定账号、行程和创建旅伴，保存地点、备注、优先级、预计日期、来源攻略、排序、状态和软删除时间。
  - 攻略搜索结果可直接加入目标行程规划，与“生成行前清单”并存。
  - 转旅行记录时复用 marker 创建规则，要求补充访问日期，写入 `convertedMarkerId` 并阻止重复转换。
  - 管理后台只读展示规划项统计和明细，不提供后台写操作。
- 后续增强：
  - 拖拽排序、按天分组、从规划批量生成清单。
  - 照片精选、行程故事页和更强日程视图进一步联动。

Summary: Trip Planning Workspace now ships as a first-phase trip-bound planning loop from guide search to desired-place management and post-trip conversion into markers.

### 愿望地图 / Wishlist Map

- 状态：已完成第一阶段闭环。
- 已落地范围：
  - 新增 `WishlistItem` 主数据模型，绑定账号、创建旅伴、地点、备注、优先级、目标年份和来源攻略。
  - 首页地图区域支持愿望态，区分仅愿望、已访问和两者都有的区域。
  - 地图选区和攻略搜索结果都可加入愿望地图。
  - 愿望项支持编辑备注、优先级和目标年份，并可按优先级、目标年份、国内 / 国际筛选排序。
  - 加入愿望时提供去重提示，服务端也会拒绝重复地点。
  - 行程详情“行前规划”Tab 支持从愿望地图导入规划项，保留原愿望项作为长期池，并在愿望面板显示“已导入”标记。
  - 愿望项可一键转成新行程，并自动创建首条行前规划。
  - 首页地图 hover 提示展示愿望城市，补足区域高亮之外的城市级表达。
- 后续增强：
  - 批量整理、批量转行程、日历视图和真实地理编码后的城市点位表达。

Summary: Wishlist Map now ships as the planning counterpart to visited-map records, connecting map selection, guide search, and trip planning.

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

- 状态：进阶版已完成。
- 已落地范围：
  - `/stats` 返回并展示 14 个成就：12 个账号级成就 + 2 个连续年度成就，覆盖足迹、节奏、旅伴、内容、风格与 streak 分组。
  - 成就 DTO 已扩展 `group`、`periodType`、`rarity`、`streakYears` 和 `nextHint`，并同步到前后端共享类型。
  - 默认全量统计视图会分别持久化 `global` 与 `streak` 首次解锁时间；筛选态视图只做实时计算。
  - `/yearbook/:year` 展示 6 个年度限定成就，并按 `annual:${year}` 持久化首次解锁时间。
  - 已新增独立成就总览页 `/achievements`，支持按分组、稀有度和状态筛选浏览所有账号级、年度和 streak 成就。
  - 成就详情已支持私有 SVG 分享卡导出，并统一通过全局 Toast 反馈结果。
  - 统计中心、年度回顾和成就总览已复用共享卡片与详情弹窗，弹窗滚动不会穿透到页面背景。
- 后续增强：
  - 更强的故事化解释与成就之间的叙事串联。
  - 如果未来引入公开分享，再单独设计权限与可见性模型。

Summary: Travel achievements now ship across stats, annual review, and a standalone atlas page, with rarity, streaks, next hints, share-card export, and period-aware first-unlock persistence.

### Story Studio 与旅行故事导出增强 / Story Studio and Trip Story Export Enhancements

- 状态：已完成 Story Studio 阶段。
- 已落地范围：
  - `/trips/:id/story` 将单次行程自动整理为私有 Story Studio。
  - 复用行程详情聚合数据，展示封面、摘要、故事徽章、路线回放海报、时间线、照片、攻略摘录和行前清单回顾。
  - 支持浏览器原生打印 / 保存 PDF，并提供 print 专用样式。
  - 支持杂志风 / 纪念册 / 明信片模板切换、智能故事序言、SVG 长图导出、方形分享卡和竖版分享卡导出。
  - Story Studio 导出逻辑已拆到 `tripStoryExport.ts`，页面展示模型由 `tripStoryPageModel.ts` 纯函数派生。
  - `/yearbook/:year` 支持浏览器原生打印 / 保存 PDF。
  - 行程详情页保留“查看故事页”入口。
- 后续增强：
  - 公开分享链接、访问权限、图片离线归档和真实地图截图。

Summary: Story Studio and annual reviews now support private printable/exportable artifacts without new backend persistence.

### 旅行胶囊 / Travel Memory Capsules

- 状态：完整大版本已完成。
- 已落地范围：
  - 新增 `/capsules` 私密胶囊中心，统一管理行程、年度和旅伴三类胶囊。
  - 新增 `MemoryCapsule` 持久化模型，保存模板、标题、章节、照片、徽章和导出偏好配置。
  - 新增 `/capsules/:id` 胶囊详情页，支持杂志化预览、深度编辑、PDF/打印、SVG 长图、方形分享卡和竖版分享卡导出。
  - 首页、行程详情、年度回顾和旅伴共同回忆均提供胶囊入口。
- 后续增强：
  - 如果未来引入公开分享，需要单独设计 token、过期、撤销、匿名访问和隐私策略。

Summary: Travel Memory Capsules now ship as a private capsule center for trip, annual, and companion retrospectives with saved configuration, editorial preview, deep editing, and local exports.

### 旅伴共同回忆 / Companion Shared Memories

- 状态：一期已完成。
- 已落地范围：
  - 新增 `/companions/:id/memories` 旅伴共同回忆页，把某位旅伴相关的记录、年度节奏、共同城市、主题、行程、精选照片、攻略和里程碑整理成私密纪念册。
  - 从 `/stats` 的“旅伴排行”和 `/trips/:id` 的“旅伴参与”双入口进入同一页面。
  - 新增 `CompanionMemorySnapshot`，按 `accountId + companionId` 保存最新展示快照，并使用 24 小时按需重建窗口。
  - 提供 `GET /api/companions/:id/memories` 与 `POST /api/companions/:id/memories/refresh`，刷新结果统一通过全局 `AppToast` 反馈。
- 后续增强：
  - 可继续补旅伴回忆分享卡、后台快照健康巡检和更强的叙事模板。
  - 如果未来引入真实协作邀请，需要单独设计跨账号权限模型。

Summary: Companion Shared Memories now ships as a private companion retrospective page with stats/trip-detail entry points, a 24-hour on-demand snapshot cache, and explicit refresh feedback.

### 照片与媒体整理 / Photo and Media Curation

- 状态：一期已完成。
- 已落地范围：
  - 新增 `/photos` 影像编辑台，作为账号级照片整理入口。
  - 支持按行程、旅伴、年份、精选状态和说明状态筛选照片。
  - 支持标记 / 取消精选与补充照片说明，复用 `VisitMarkerImage.isFeatured/caption/curatedSortOrder`。
  - 从首页、行程详情“素材”Tab、年度回顾照片墙和 Story Studio 接入。
  - 提供 `GET /api/photos/curation` 与 `PATCH /api/photos/curation`，并保持当前账号归属校验。
- 后续增强：
  - 图片缺失、坏链、重复图片的轻量检测。
  - 相册导出、本地图片归档和更细的封面候选策略。

Summary: Photo and media curation now ships as `/photos`, an account-level desk for filtering, featuring, and captioning travel photos that feed trip detail, annual review, Story Studio, and companion memories.

### 管理后台与质量巡检 / Admin Quality Operations

- 状态：二期已完成。
- 已落地范围：
  - `/admin` 新增默认只读质量巡检摘要，展示严重、注意、建议和受影响账号数。
  - 质量问题覆盖记录缺图、未归行程、行程缺封面、照片缺说明、过期规划、攻略未关联、来源异常、搜索失败升高和旅伴回忆快照过期。
  - 账号详情展示当前账号相关质量问题。
  - 后台二期新增质量问题筛选、详情抽屉、只读定位跳转和应用内提醒。
  - 新增 `AdminAuditLog`，记录查看问题、复制上下文、定位问题、筛选问题和查看审计等后台治理动作。
  - 新增低风险白名单自动修复能力：`trip_missing_cover` 可从行程照片设置封面，`photo_missing_caption` 可生成照片说明。
  - 自动修复必须先预览字段变更，再由管理员确认执行，并记录 `quality_issue_auto_fix_previewed` / `quality_issue_auto_fixed` 审计动作。
  - 继续复用 `GET /api/admin/overview`，并新增 `POST /api/admin/quality-issues/auto-fix` 承载确认式修复。
  - 新增 `GET /api/admin/audit-logs` 与 `POST /api/admin/audit-logs`，仅用于审计日志查询和写入。
- 后续增强：
  - 外部告警推送、定时巡检快照和坏图真实 HTTP 探测。
  - 更细的规则阈值配置和跨版本质量趋势。

Summary: Admin Quality Operations now ships as a read-by-default governance desk inside `/admin`, adding filtering, drill-down, navigation, reminders, audit logs, and preview-then-confirm repair for low-risk allowlisted issues.

### 账号设置与会话治理 / Account Settings and Session Governance

- 状态：一期已完成。
- 已落地范围：
  - 新增 `/settings` 账号设置页。
  - 支持查看账号资料、修改昵称和修改密码。
  - `AuthSession` 新增设备与活跃时间元数据，支持会话列表、退出其他设备和退出全部设备。
  - 修改密码后保留当前 session，撤销其他 sessions。
  - 数据导出入口正式收敛到账号设置页。
- 后续增强：
  - 找回密码、二次验证、设备地理位置解析和异常登录告警。

Summary: Account Settings and Session Governance now ships `/settings` for profile, password, session, and data-export management on top of hash-only Cookie Sessions.


### Roadmap 全量收口：规划、整理、表达与治理 / Roadmap Full Closure: Planning, Organization, Expression, and Governance

- 状态：已完成 Phase 1-12 收口。
- 已落地范围：
  - 架构硬化与测试深水区：DTO 目录化边界、Stats 聚合拆分、登录态路由分发表、后端 route spec 按领域拆分，以及冒烟清单文档。
  - 日程化行前规划：`/trips/:id` 内支持未排期池、按天排期、愿望地图导入到指定日期和当天清单提示。
  - 整理工作台：`/organize` 聚合未归行程记录、缺说明照片、未关联攻略、待精选照片和弱标签记录，批量整理采用预览确认。
  - 智能相册与封面策展：`/photos` 提供年度、城市、旅伴和行程封面候选，并支持精选相册 SVG 导出。
  - 标签治理与自定义词表：`/tags` 支持账号级自定义标签、隐藏、排序、同义合并、批量替换和跨模块筛选。
  - 攻略质量评分与来源优先级：搜索结果新增质量解释，后台支持来源优先级和降权建议。
  - 私密分享链接治理：行程故事、年度回顾、旅伴回忆和旅行胶囊支持可撤销、可过期、可选密码的只读分享。
  - 本地归档与离线纪念包：行程故事、年度回顾和胶囊可导出 ZIP，包含 manifest、JSON、Markdown、SVG 和图片 URL 清单。
  - 旅行预算与消费洞察：新增 `TripExpense`，联动行程详情、统计中心和年度回顾展示私密消费复盘。
  - 地图回放故事页二期：行程、年份和旅伴均可生成路线叙事页面，并支持 SVG 长图导出。
  - 主动提醒与异常告警：`/reminders` 聚合过期规划、缺封面、缺照片说明、异常登录和攻略来源异常，并支持静音、处理和跳转定位。
- 后续增强：
  - 当前推荐队列已清空；后续新功能应重新评审价值、权限、数据模型和测试成本后再进入下一版 roadmap。

Summary: The previous 11-item roadmap is now complete, covering architecture hardening, scheduled planning, organization, smart albums, tag governance, guide quality, private sharing, archive packages, expense insights, replay stories, reminders, and Phase 12 bilingual documentation closure.

## 当前产品基线 / Current Product Baseline

截至当前版本，项目已经具备这些核心能力：

- 主页地图支持国内 / 国际切换、区域 hover、图例说明、区域点击联动筛选与快速新增记录。
- The homepage map supports domestic/global switching, hover feedback, legend guidance, region-driven filtering, and quick record entry.
- 旅行记录支持城市、起止日期、描述、多图上传、详情查看、编辑、删除和攻略关联。
- 多旅伴切换、颜色区分以及"仅本人可编辑/删除本人记录"的权限边界已经落地。
- 行程集合二期已完成，支持创建 / 编辑 / 删除行程、批量归属记录、封面管理与独立详情页回看。
- Trip Collection Phase 2 is available with full CRUD, batch marker assignment, cover management, a dedicated detail page, and a private Story Studio page.
- 行程详情页已提供 trip-bound 行前规划工作台，支持攻略搜索加入规划、规划项 CRUD、优先级筛选、预计日期和转旅行记录。
- Trip detail now includes a trip-bound planning workspace with guide-search intake, planning-item CRUD, priority filtering, planned dates, and marker conversion.
- 旅行记录已支持标签、心情、天气、交通方式与预算级别等轻量元数据，并已接入时间线、行程详情、统计中心与服务端搜索。
- Travel markers now support tags, mood, weather, transport, and budget metadata, and those fields are wired into the timeline, trip detail, stats center, and backend search.
- 独立统计中心 `/stats` 已完成，支持筛选、排行、趋势、国内中国地图 / 国际世界地图热力图，以及从统计钻取到行程详情。
- A standalone `/stats` center is available with filters, rankings, trends, China/world map heatmaps, and drill-down into trip details.
- 年度回顾页 `/yearbook/:year` 已上线，支持按年份生成私有年鉴式回看，并继续钻取到单次行程详情。
- The `/yearbook/:year` annual review page is live, offering a private yearbook-style retrospective with continued drill-down into trip details.
- 影像编辑台 `/photos` 已上线，支持跨行程、跨旅伴、跨年份整理精选照片与照片说明。
- The `/photos` Photo Curation Hub is live for organizing featured photos and captions across trips, companions, and years.
- 旅行成就系统已接入统计中心、年度回顾与独立总览页，支持稀有度、连续年度、下一步提示、分享卡和首次解锁时间。
- Travel achievements now span stats, annual review, and a standalone atlas page with rarity, streaks, next hints, share cards, and first-unlock moments.
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

当前推荐执行队列已完成并迁移到“已完成里程碑”。本节暂不保留新的活动条目，避免把已交付能力继续误判为待办事项。

The active recommended execution queue is complete and has been moved into Completed Milestones. This section intentionally keeps no new active items so shipped capabilities are not mistaken for pending work.

## 推荐执行顺序 / Recommended Execution Order

- 当前无活动推荐队列。
- 后续新增 roadmap 应先完成需求评审、权限边界、数据模型、测试策略和双语文档计划。

Summary: The roadmap is intentionally empty until a new product direction is approved.

## 选题原则 / Feature Selection Rules

以后如果从这份清单里挑一个功能开做，优先满足这五个条件：

1. 能复用已有地图、行程、统计、成就、攻略、照片或 MySQL 主数据能力。
2. 能显著提升"回看价值""行前规划""表达能力"或"整理效率"。
3. 用户能在 10 秒内感知到价值，不是只有后台数据变多。
4. 能保持私密个人工具的气质，不把产品强行推向公开社交。
5. 不把复杂业务规则重新塞回页面容器层或单个 service 文件。
