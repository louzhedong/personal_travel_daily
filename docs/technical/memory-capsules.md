# 旅行胶囊 / Travel Memory Capsules

旅行胶囊新增 `/capsules` 私密胶囊中心，把行程故事、年度回顾和旅伴共同回忆收束成可保存配置、可编辑结构、可导出的旅行出版物。

Travel Memory Capsules add the private `/capsules` center, turning trip stories, annual reviews, and companion memories into configurable, editable, and exportable travel publications.

## 1. 产品定位 / Product Positioning

胶囊不是公开社交页，也不是重型 CMS。它是私密的旅行出版台，面向三类回看对象：

Capsules are not public social pages or a heavy CMS. They are a private travel publishing desk for three retrospective sources:

- 行程胶囊：从单次行程详情、照片、攻略、清单和路线生成。
- Trip capsules: generated from one trip's detail, photos, guides, checklist, and route.
- 年度胶囊：从年度回顾、年度成就、照片和代表行程生成。
- Annual capsules: generated from annual review data, annual achievements, photos, and representative trips.
- 旅伴胶囊：从旅伴共同回忆、年度节奏、共同城市、主题和照片生成。
- Companion capsules: generated from companion memories, yearly rhythm, shared cities, themes, and photos.

## 2. 数据模型 / Data Model

`MemoryCapsule` 保存胶囊配置，不保存完整内容快照。内容每次从源数据实时派生，避免行程、照片、攻略或回忆快照变化后出现双源冲突。

`MemoryCapsule` stores capsule configuration rather than a full content snapshot. Content is derived from source data at read time to avoid conflicts when trips, photos, guides, or memory snapshots change.

关键字段：

Key fields:

- `type`: `trip` / `annual` / `companion`
- `targetId`: 行程 ID、四位年份或旅伴 ID
- `template`: `editorial` / `memoir` / `postcard` / `atlas`
- `status`: `draft` / `ready` / `archived`
- `configJson`: 封面、章节、照片、徽章与导出偏好

## 3. API / API

新增登录态接口：

New authenticated endpoints:

- `GET /api/memory-capsules`
- `POST /api/memory-capsules`
- `GET /api/memory-capsules/:id`
- `PATCH /api/memory-capsules/:id`
- `POST /api/memory-capsules/:id/duplicate`
- `POST /api/memory-capsules/:id/archive`

所有接口只允许当前账号访问自己的胶囊。归档是软状态，不做硬删除。

All endpoints only allow the current account to access its own capsules. Archiving is a soft state and does not hard-delete records.

## 4. 前端页面 / Frontend Pages

新增页面：

New pages:

- `/capsules`: 胶囊中心，展示统计、筛选、创建、复制、归档和打开详情。
- `/capsules`: Capsule center for stats, filtering, creation, duplication, archiving, and opening details.
- `/capsules/:id`: 胶囊详情，提供杂志化预览、深度编辑和导出。
- `/capsules/:id`: Capsule detail page with editorial preview, deep editing, and exports.

首页提供“旅行胶囊”入口，行程详情、年度回顾和旅伴共同回忆提供创建胶囊入口。

The homepage exposes a "旅行胶囊" entry point, while trip detail, annual review, and companion memories expose capsule creation entry points.

## 5. 编辑与导出 / Editing and Export

详情页支持编辑标题、副标题、模板、章节开关、章节排序、照片显示、徽章开关和导出偏好。

The detail page supports editing title, subtitle, template, section toggles, section order, photo visibility, badge toggles, and export preset.

导出沿用私密 SVG 策略：

Exports use the existing private SVG strategy:

- PDF / 打印：浏览器原生 `window.print()`。
- PDF / print: native browser `window.print()`.
- SVG 长图：动态高度，保留图片 URL。
- SVG long image: dynamic height with source image URLs.
- 方形分享卡与竖版分享卡：生成本地 SVG，不上传文件。
- Square and vertical share cards: local SVG generation without uploads.
- 本地归档包：浏览器端生成 ZIP，包含 `manifest.json`、`summary.md`、`content/capsule.json`、`images/image-urls.md` 和 `exports/capsule-long-image.svg`。
- Local archive package: browser-generated ZIP with `manifest.json`, `summary.md`, `content/capsule.json`, `images/image-urls.md`, and `exports/capsule-long-image.svg`.

本阶段不做公开分享链接、服务端截图、图片代理、原图下载或 base64 内联；本地归档包仅保留远程图片 URL 清单。

This phase does not add public share links, server-side screenshots, image proxying, original-image downloads, or base64 inlining; local archive packages only preserve remote image URL lists.

## 6. 视觉规范 / Visual Rules

胶囊中心应像旅行杂志目录页，胶囊详情应像编辑台与杂志内页预览。避免 Web 卡片堆叠，使用细线、留白、强字号层级和紧凑按钮。

The capsule center should feel like an editorial table of contents, and the detail page should feel like an editing desk plus magazine-spread preview. Avoid stacked web cards; use hairlines, whitespace, strong type hierarchy, and compact buttons.
