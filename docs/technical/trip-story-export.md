# 旅行故事页与 PDF 导出 / Trip Story and PDF Export

这份文档记录 `/trips/:id/story` 的产品化范围。故事页是登录态私有页面，复用行程详情聚合数据，不新增数据库表、不新增后端接口。

This document records the phase-one productization scope for `/trips/:id/story`. The story page is a private authenticated page that reuses trip-detail aggregate data without adding database tables or backend endpoints.

## 产品定位 / Product Positioning

旅行故事页把单次行程整理成一页可回看的成果页。它不是新的内容编辑器，而是从已有行程记录中自动生成：

- 封面、故事摘要与智能序言
- 路线胶片
- 时间线叙事
- 照片段落
- 攻略摘录
- 行前清单回顾

The trip story page turns one trip into a reviewable artifact. It is not a new editor; it automatically composes the page from existing trip data.

## 数据来源 / Data Source

故事页继续调用 `GET /api/trips/:id/detail`，使用同一份权限、404 和数据聚合语义。

The story page continues to call `GET /api/trips/:id/detail` and inherits the same permission, 404, and aggregation semantics.

当前不会新增：

- Prisma model
- migration
- public share token
- standalone story API
- exported file storage

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
- `/trips/:id/story` 提供模板切换、“导出长图”、“导出 PDF / 打印”和“返回行程详情”。
- 首页、统计中心和年度回顾暂不新增直接入口，避免一期入口过散。

## 空态 / Empty States

故事页不要求行程必须有完整素材。以下情况都应可打开并导出：

- 无旅行记录：展示待补充记录提示。
- 无照片：照片段落展示轻量空态。
- 无攻略：攻略摘录展示轻量空态。
- 无清单：行前清单回顾展示轻量空态。

## 验证范围 / Validation

当前测试覆盖：

- 故事页加载后展示主要区块。
- 点击“导出 PDF / 打印”调用 `window.print()`。
- 点击“导出长图”生成 SVG Blob 并触发下载。
- 重型照片导出会生成超过固定基线的动态高度，包含照片段落和真实 `<image href>`。
- 模板切换会更新故事页视觉模式。
- 文档标题使用行程名，供打印/PDF 标题使用。
- 缺少照片、攻略、清单、记录时空态稳定。
- 行程不存在或无权访问时展示错误态，且不展示打印入口。

## 年度回顾导出 / Annual Review Export

`/yearbook/:year` 也支持浏览器原生打印 / PDF 导出。年度回顾导出复用当前年度聚合页面，不新增后端接口；打印标题使用 `${year} 年度旅行回顾`，打印样式会隐藏操作按钮和轮播分页点。
