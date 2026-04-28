# 攻略提炼为行前清单 / Guide-to-Checklist Workflow

这份文档用于系统记录“攻略提炼为行前清单”一期闭环的设计和实现。它的目标不是再做一个孤立待办组件，而是把攻略搜索、正文阅读、行程详情和出发前准备组织成一条真正可执行的产品链路。

This document records the first-phase design and implementation of the guide-to-checklist workflow. The goal is not to add yet another standalone todo widget, but to connect guide search, document reading, trip detail, and pre-departure organization into a truly actionable product flow.

## 目标与范围 / Goals and Scope

- 一期目标：把“看攻略”升级成“把攻略变成可执行的行前准备材料”。
- 一期覆盖：从搜索结果直接生成、绑定到行程、三段状态管理、手动增删改、行程详情内嵌和独立放大页。
- 一期不做：收藏攻略入口、拖拽排序、多攻略合并清单、多人协作清单、自定义状态。

- Phase-one goal: upgrade guide reading into an actionable trip-preparation workflow.
- Phase-one scope: direct generation from search results, trip-bound checklist management, three fixed stages, manual CRUD, embedded trip-detail display, and an expanded checklist page.
- Out of scope for phase one: generation from saved guides, drag-and-drop ordering, multi-guide merge flows, collaborative checklists, and custom states.

## 用户流 / User Flow

1. 用户在攻略搜索结果中点击“生成行前清单”。
2. 用户选择一个已有行程作为目标容器。
3. 系统优先拉取攻略正文，尝试自动提炼 3~8 条清单项。
4. 如果正文不可用，则回退到搜索摘要生成简化清单。
5. 生成结果直接写入目标行程，并按 `出发前 / 旅途中 / 已完成` 三段分组。
6. 用户随后可在行程详情页内嵌面板或 `/trips/:id/checklist` 放大页继续编辑。

1. The user clicks “Generate trip checklist” from a guide search result.
2. The user chooses an existing trip as the target container.
3. The system fetches the guide document and tries to extract 3–8 checklist items automatically.
4. If document extraction is unavailable, it falls back to the search summary.
5. The generated items are written into the target trip and grouped into `pre_departure / in_transit / done`.
6. The user can then continue editing from the embedded trip-detail panel or the expanded `/trips/:id/checklist` page.

## 数据模型 / Data Model

- 新增 `TripChecklistItem`，并绑定到 `Trip`。
- `stage` 固定为三段：
  - `pre_departure`
  - `in_transit`
  - `done`
- 每条 item 会记录：
  - 文案 `title`
  - 备注 `note`
  - 来源 `origin`
  - 来源攻略 identity / 标题 / sourceName / sourceUrl
  - 触发生成的片段 `sourceSnippet`
  - 组内顺序 `sortOrder`
  - 发起旅伴 `createdByCompanionId`

- `TripChecklistItem` is a new trip-bound model.
- `stage` is fixed to three values:
  - `pre_departure`
  - `in_transit`
  - `done`
- Each item records:
  - `title`
  - `note`
  - `origin`
  - guide identity / title / source name / source URL
  - the generating snippet `sourceSnippet`
  - intra-group order `sortOrder`
  - the initiating companion `createdByCompanionId`

## 生成策略 / Generation Strategy

- 正文优先：服务端通过 `guide-api` 拉取 `GuideDocument`。
- 提炼优先级：
  1. `aiSummary.warnings`
  2. `aiSummary.transportTips`
  3. `aiSummary.routeTips`
  4. `aiSummary.highlights`
  5. `blocks`
  6. 搜索摘要 `guide.summary`
- 一期不引入新的异步任务或外部 LLM 服务；提炼规则保持同步、确定性和可回退。

- Document-first generation: the backend fetches `GuideDocument` from `guide-api`.
- Extraction priority:
  1. `aiSummary.warnings`
  2. `aiSummary.transportTips`
  3. `aiSummary.routeTips`
  4. `aiSummary.highlights`
  5. `blocks`
  6. search summary `guide.summary`
- Phase one does not introduce a new async job system or external LLM integration; extraction stays synchronous, deterministic, and fallback-friendly.

## 页面落点 / UI Surfaces

### 攻略搜索面板 / Guide Search Panel

- 在搜索结果卡片新增“生成行前清单”按钮。
- 点击后先选择行程，再发起生成。
- 生成成功后给出反馈，并提供“查看行程详情 / 打开行前清单”快捷入口。

### 行程详情页 / Trip Detail Page

- 新增固定高度的“行前清单”内嵌面板。
- 与记录、照片、关联攻略并列，强调它是 trip-bound 资源而不是全局工具。
- 支持手动新增、编辑、删除和切换阶段。

### 放大页 / Expanded Checklist Page

- 新增 `/trips/:id/checklist`
- 面向长清单和更完整的整理视图。
- 与行程详情共享同一套 checklist board 组件，避免 UI 行为分叉。

### Guide Search Panel

- Adds a “Generate trip checklist” button on each search-result card.
- The user chooses a trip before generation starts.
- Success feedback offers direct links to trip detail or the expanded checklist page.

### Trip Detail Page

- Adds a fixed-height embedded checklist panel.
- It sits alongside markers, photos, and linked guides to reinforce that checklist data is trip-bound.
- Supports manual create, edit, delete, and stage switching.

### Expanded Checklist Page

- Adds `/trips/:id/checklist`
- Acts as the more spacious management view for longer lists.
- Reuses the same checklist board component as trip detail to keep behavior consistent.

## 去重与回退 / Dedupe and Fallback

- 同一行程内，系统按“来源攻略 + 标准化标题”去重。
- 如果再次从同一篇攻略生成，不会重复灌入相同事项。
- 正文提炼失败时自动回退到摘要提炼，避免用户空手而归。

- Within the same trip, deduplication uses `source guide + normalized title`.
- Re-generating from the same guide will not blindly duplicate the same items.
- If document extraction fails, the system automatically falls back to summary-based generation so the user still gets an editable result.

## 关键接口 / Key APIs

- `GET /api/trips/:id/detail`
- `GET /api/trips/:id/checklist`
- `POST /api/trips/:id/checklist/generate`
- `POST /api/trips/:id/checklist/items`
- `PATCH /api/trips/:id/checklist/items/:itemId`
- `DELETE /api/trips/:id/checklist/items/:itemId`

## 验证重点 / Verification Focus

- 从搜索结果直接生成 trip-bound checklist。
- 正文优先生成与摘要回退都可用。
- 行程详情页和放大页保持同源数据。
- 手动增删改与阶段切换刷新后仍能保持。

- Direct generation from search results into trip-bound checklist data.
- Both document-first extraction and summary fallback remain usable.
- Trip detail and the expanded page stay in sync.
- Manual CRUD and stage changes persist after reload.
