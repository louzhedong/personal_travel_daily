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
  - 行前准备清单与结构化提炼。

Summary: Guide search, reading, save, and linking are all production-ready.

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

## 当前产品基线 / Current Product Baseline

截至当前版本，项目已经具备这些核心能力：

- 主页地图支持国内 / 国际切换、区域 hover、图例说明、区域点击联动筛选与快速新增记录。
- The homepage map supports domestic/global switching, hover feedback, legend guidance, region-driven filtering, and quick record entry.
- 旅行记录支持城市、起止日期、描述、多图上传、详情查看、编辑、删除和攻略关联。
- 多旅伴切换、颜色区分以及"仅本人可编辑/删除本人记录"的权限边界已经落地。
- 行程集合二期已完成，支持创建 / 编辑 / 删除行程、批量归属记录、封面管理与独立详情页回看。
- Trip Collection Phase 2 is available with full CRUD, batch marker assignment, cover management, and a dedicated detail page.
- 独立统计中心 `/stats` 已完成，支持筛选、排行、趋势、国内中国地图 / 国际世界地图热力图，以及从统计钻取到行程详情。
- A standalone `/stats` center is available with filters, rankings, trends, China/world map heatmaps, and drill-down into trip details.
- 年度回顾页 `/yearbook/:year` 已上线，支持按年份生成私有年鉴式回看，并继续钻取到单次行程详情。
- The `/yearbook/:year` annual review page is live, offering a private yearbook-style retrospective with continued drill-down into trip details.
- 地图回放一期已上线，首页地图卡片内嵌回放控制条、移动圆点与国家级路径回放。
- Map Replay Phase 1 is shipped inside the homepage map card with inline controls, moving dot labels, and country-level path replay.
- 攻略搜索、正文阅读增强、搜索历史、收藏、关联到旅行记录与返回链路已经打通。
- 登录注册、Cookie Session、管理员只读后台、搜索行为日志和 MySQL / Prisma 持久化主链路已经可用。
- Docker MySQL + Adminer、本地 seed、`db:prepare-demo`、迁移工作流与关键前后端测试已经具备。

这意味着接下来的 roadmap 适合围绕这些"已有数据资产"继续做产品升级，而不是回头补通用型表单功能。

This means the next roadmap should amplify the value of existing data assets instead of circling back to generic form features.

## 产品方向 / Product Direction

下一阶段建议围绕 4 条主线推进：

1. **更强的旅行回看**
   Turn raw records into memorable retrospectives, yearly reviews, and replayable stories.
2. **更强的整理效率**
   Help users organize records, trips, photos, guides, and future plans with less friction.
3. **更强的表达与分享**
   Make the product feel more like a personal travel journal and less like a private database.
4. **更强的长期留存**
   Add features that encourage repeat visits after a trip is over.

## 优先级说明 / Priority Legend

- `P1`: 建议优先做，能直接放大当前数据价值。
- `P2`: 很有趣且值得做，但依赖前一阶段收口后推进更稳。
- `P3`: 中长期方向，适合在产品表达更成熟后继续演进。

## 下一阶段路线图 / Next-Phase Roadmap

### 1. 记录标签 + 轻量元数据 / Marker Tags and Lightweight Metadata

- 优先级：`P1`
- 为什么值得做：
  - 这是后续回顾、搜索、推荐、AI 整理能力的基础设施。
- 建议范围：
  - 记录标签系统：美食、徒步、海边、出差、周末等。
  - 轻量元数据：预算级别、天气、心情、交通方式。
  - 支持按标签和元数据筛选时间线、统计页和服务端搜索。
  - 支持统计"最常出现的旅行主题"。

### 2. 攻略提炼为行前清单 / Guide-to-Checklist Workflow

- 优先级：`P1`
- 为什么值得做：
  - 当前攻略已经"可查、可读、可存"，但还没有变成真正可执行的准备材料。
- 建议范围：
  - 从收藏攻略中提取"必做事项 / 交通提示 / 注意事项"。
  - 手动整理为清单。
  - 清单绑定某个行程。
  - 支持标记完成状态，区分"出发前 / 旅途中 / 已完成"。

### 3. 旅行故事页 / Travel Story Page

- 优先级：`P2`
- 为什么值得做：
  - 当前产品更像个人数据工具，故事页会让它更像旅行内容产品。
- 建议范围：
  - 将单次行程渲染为可阅读故事页。
  - 自动组合封面、时间线、照片、攻略摘录和地图路径。
  - 支持"杂志风"和"纪念册风"两种模板。
  - 第一阶段先做本地只读页。

### 4. 城市愿望清单 / Wishlist Map

- 优先级：`P2`
- 为什么值得做：
  - 当前地图只记录"去过哪里"，还没有承接"想去哪里"。
  - 这会让地图从回顾工具变成计划工具。
- 建议范围：
  - 增加"想去城市 / 想去国家"清单。
  - 地图上区分"去过 / 想去"两种状态。
  - 可从攻略搜索结果一键加入愿望清单。
  - 后续可与行程规划联动。

### 5. 旅行成就系统 / Travel Achievement System

- 优先级：`P2`
- 为什么值得做：
  - 这是最容易提升趣味性和长期留存的功能之一。
- 建议范围：
  - 勋章示例：首次出国、跨越 10 座城市、连续三个月有旅行记录、和 3 位不同旅伴同行。
  - 在统计页或年度回顾页展示。
  - 成就支持时间维度和里程碑解释。

### 6. 搜索增强 / Search Enhancements

- 优先级：`P2`
- 为什么值得做：
  - 搜索主链路已经有了，现在适合补"更像产品"的细节。
- 建议范围：
  - 搜索建议、历史关键词快捷入口。
  - 命中片段高亮。
  - 搜索结果分页加载更多。
  - 后台按关键词和时间范围查看搜索趋势。

### 7. 旅伴协作与共同回忆 / Companion Collaboration

- 优先级：`P2`
- 为什么值得做：
  - 当前"旅伴"更多是归属和颜色维度，还不是协作实体。
- 建议范围：
  - 某次行程内的共同回忆摘要。
  - 同一行程下不同旅伴的视角统计。
  - 未来可扩展到真实邀请协作，但第一阶段可先做"共同回忆聚合"。

### 8. 账号设置与同步治理 / Account Settings and Sync Governance

- 优先级：`P3`
- 为什么值得做：
  - 长期使用后，设置、多设备登录与数据同步会成为稳定性重点。
- 建议范围：
  - 修改密码、账号设置。
  - 最近登录设备、会话治理。
  - 冲突策略和同步状态提示。

### 9. 来源治理与内容质量评分 / Source Governance and Content Quality

- 优先级：`P3`
- 为什么值得做：
  - 攻略搜索越做越深，质量问题会越来越明显。
- 建议范围：
  - 去重与合并。
  - 来源优先级。
  - 结果质量评分。
  - 失效内容与抓取异常监控。

### 10. 架构继续瘦身 / Continued Architecture Slimming

- 优先级：`P3`
- 为什么值得做：
  - 现在功能已经跨越地图、统计、行程、详情、攻略多个模块，后续继续上功能前需要持续防止容器层膨胀。
- 建议范围：
  - 继续抽离复杂状态 hook。
  - 为地图联动、统计筛选与详情回看补更细的集成测试。
  - 为服务端聚合接口补更多契约测试。

## 推荐执行顺序 / Recommended Execution Order

建议按下面顺序推进（已完成项已挪到文档开头）：

1. 记录标签 + 轻量元数据 / Marker Tags and Lightweight Metadata
2. 攻略提炼为行前清单 / Guide-to-Checklist Workflow
3. 旅行故事页 / Travel Story Page
4. 城市愿望清单 / Wishlist Map
5. 旅行成就系统 / Travel Achievement System
6. 搜索增强 / Search Enhancements
7. 旅伴协作与共同回忆 / Companion Collaboration
8. 账号设置与同步治理 / Account Settings and Sync Governance
9. 来源治理与内容质量评分 / Source Governance and Content Quality
10. 架构继续瘦身 / Continued Architecture Slimming

## 选题原则 / Feature Selection Rules

以后如果从这份清单里挑一个功能开做，优先满足这四个条件：

1. 能复用已有地图、行程、统计、攻略或 MySQL 主数据能力。
2. 能显著提升"回看价值""表达能力"或"整理效率"。
3. 用户能在 10 秒内感知到价值，不是只有后台数据变多。
4. 不把复杂业务规则重新塞回页面容器层。
