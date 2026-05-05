# 旅行故事页与 PDF 导出 / Trip Story and PDF Export

这份文档记录 `/trips/:id/story` 的产品化范围。故事页是登录态私有页面，复用行程详情聚合数据；故事页本身不新增独立后端接口，照片精选数据来自行程素材区的图片整理能力。

This document records the productized scope for `/trips/:id/story`. The story page is a private authenticated page that reuses trip-detail aggregate data; it does not introduce a standalone story API, and its curated-photo behavior comes from trip-level asset curation.

## 产品定位 / Product Positioning

旅行故事页把单次行程整理成一页可回看的成果页。它不是新的内容编辑器，而是从已有行程记录中自动生成：

- 封面、故事摘要与智能序言
- 精选瞬间
- 路线胶片
- 时间线叙事
- 照片段落
- 攻略摘录
- 行前清单回顾

The trip story page turns one trip into a reviewable artifact. It is not a new editor; it automatically composes the page from existing trip data.

## 数据来源 / Data Source

故事页继续调用 `GET /api/trips/:id/detail`，使用同一份权限、404 和数据聚合语义。详情响应中的 `photos` 会携带图片 ID、精选状态、说明文字和人工排序，用于故事页和长图导出。

The story page continues to call `GET /api/trips/:id/detail` and inherits the same permission, 404, and aggregation semantics. The `photos` payload carries image IDs, featured flags, captions, and curated ordering for story rendering and long-image export.

故事页当前不会新增：

- Prisma model
- public share token
- standalone story API
- exported file storage

照片精选元数据保存在 `VisitMarkerImage` 上，由行程详情“素材”Tab 通过 `PATCH /api/trips/:id/photos/curation` 批量维护。接口会校验图片属于当前账号且属于当前行程；如果图片所在记录之后被移出行程，精选元数据会保留在图片上，但自然不再进入该行程的故事数据。

Curated photo metadata is stored on `VisitMarkerImage` and maintained from the trip detail Assets tab through `PATCH /api/trips/:id/photos/curation`. The backend verifies that each image belongs to the current account and trip. If a marker later leaves the trip, the image keeps its metadata but no longer appears in that trip story.

## 精选照片驱动的故事组合 / Featured-Photo Story Composition

照片排序规则统一为：

1. 精选照片优先。
2. 精选照片内部按 `curatedSortOrder` 升序。
3. 没有人工排序时按访问日期、记录内原图顺序兜底。

行程详情页 `/trips/:id` 在概览区展示“封面故事”区块，用行程封面和最多 5 张精选照片构成故事入口。若行程没有显式封面，优先使用第一张精选照片作为视觉候选；若没有精选照片，则回退到当前照片流中的首图。

故事页 `/trips/:id/story` 在路线胶片前展示“精选瞬间”。该区块优先消费精选照片，并使用图片说明 `caption` 作为主文案；没有说明时回退到记录标题。若没有任何精选照片，故事页不会显示精选区块，照片段落继续按日期照片流展示。

长图导出沿用同一套模型：有精选照片时导出“精选瞬间”区块，并在照片段落中保留精选标记和说明；无精选照片时保持原有日期分组，避免老行程导出结果变空。

Photo ordering is consistent across the trip detail, trip story, annual review, and export surfaces: featured first, curated order second, then visit date and original marker-image order as fallback.

The trip detail page renders a cover-story block that uses the explicit trip cover when available, otherwise the first featured photo, otherwise the first normal photo. The story page renders a featured-moments block before the route strip only when curated photos exist. Captions take precedence over marker titles in story copy.

## 模板与智能文案 / Templates and Smart Copy

故事页支持两种本地模板：

- `杂志风`：默认模板，偏清爽、适合浏览器阅读和 PDF。
- `纪念册`：更温暖的纸张感模板，适合回忆型故事。

智能序言完全基于现有行程聚合数据生成，不调用外部模型。当前会综合首末地点、同行旅伴、旅行天数、城市数、照片和攻略数量，生成一段可导出的旅行序言。

The smart narrative is generated from existing aggregate data only. It does not call an external model.

## 导出方式 / Export Behavior

当前支持两种导出：

- 浏览器原生 `window.print()`：让用户通过系统打印面板保存 PDF。
- SVG 长图导出：生成一张内容驱动高度的私有故事长图，包含标题、日期、摘要、智能序言、完整路线、时间线、照片段落、攻略摘录和行前清单回顾。
- 当存在精选照片时，SVG 长图会在路线前加入“精选瞬间”，并在照片段落里保留精选标记与说明文字。

实现约束：

- 打印标题使用行程名：`${trip.name} · 旅行故事`。
- 打印样式隐藏操作按钮和外部链接。
- 打印样式固定白底，并尽量避免卡片、照片和段落被分页切断。
- 图片按浏览器现有能力打印；不做跨域图片代理或长图截图。
- 长图导出不引入截图依赖，不把图片嵌入 SVG，避免跨域图片污染导出链路；照片以 `<image href="...">` 写入 SVG，并使用 `clipPath`、固定画幅和底部字幕层保持重型图库下的布局稳定。
- SVG 高度会随内容增长，不再使用固定 1800px 画布；段落之间保留显式间距，避免照片、路线、时间线和清单在长内容下互相重叠。
- 若图片源禁止外链、需要登录、跨域策略限制 SVG 加载，或本地 SVG 查看器不加载网络图片，长图中的图片可能显示为空白；导出文件仍会保留原始图片 URL，后续若需要离线完整图片可另行引入受控图片代理或 base64 内联策略。

Summary: Long-image export is a dynamic SVG layout with real image references, not a screenshot or an offline media archive.

## 入口 / Entry Points

- `/trips/:id` 行程详情页保留“查看故事页”入口。
- `/trips/:id` 行程详情页概览区展示“封面故事”，素材 Tab 支持精选、说明和排序。
- `/trips/:id/story` 提供模板切换、“导出长图”、“导出 PDF / 打印”和“返回行程详情”。
- 首页、统计中心和年度回顾暂不新增直接入口，避免一期入口过散。

## 空态 / Empty States

故事页不要求行程必须有完整素材。以下情况都应可打开并导出：

- 无旅行记录：展示待补充记录提示。
- 无照片：照片段落展示轻量空态。
- 无精选照片：隐藏精选瞬间，继续使用按日期照片流。
- 无攻略：攻略摘录展示轻量空态。
- 无清单：行前清单回顾展示轻量空态。

## 验证范围 / Validation

当前测试覆盖：

- 故事页加载后展示主要区块。
- 点击“导出 PDF / 打印”调用 `window.print()`。
- 点击“导出长图”生成 SVG Blob 并触发下载。
- 重型照片导出会生成超过固定基线的动态高度，包含照片段落和真实 `<image href>`。
- 精选照片会驱动封面故事、故事页“精选瞬间”、长图导出“精选瞬间”和照片段落说明。
- 模板切换会更新故事页视觉模式。
- 文档标题使用行程名，供打印/PDF 标题使用。
- 缺少照片、攻略、清单、记录时空态稳定。
- 行程不存在或无权访问时展示错误态，且不展示打印入口。

## 年度回顾导出 / Annual Review Export

`/yearbook/:year` 也支持浏览器原生打印 / PDF 导出。年度回顾导出复用当前年度聚合页面，不新增后端接口；打印标题使用 `${year} 年度旅行回顾`，打印样式会隐藏操作按钮和轮播分页点。
