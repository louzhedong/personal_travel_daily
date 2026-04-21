# Changelog / 更新日志

本文件同时记录已经合并到 `main` 的历史变更，以及当前分支尚未合并的工作内容。  
This file tracks both the changes already merged into `main` and the current branch work that has not been merged yet.

## Unreleased / 未发布

### Added / 新增

- 新增行程时间线面板，支持按当前用户生成时间线、按年份筛选、按国内/国际筛选，并与地图和详情面板联动。  
  Added the new trip timeline panel with year filtering, domestic/international filtering, and map/detail linking.
- 新增 `useMapContext.ts`，统一地图范围、区域列表、选区和当前范围 marker 派生。  
  Added `useMapContext.ts` to centralize map scope, region options, selected region, and scope-level marker derivation.
- 新增 `useTravelStoreActions.ts`，统一 TravelStore 写操作。  
  Added `useTravelStoreActions.ts` to centralize TravelStore write actions.
- 新增 `AppHero.tsx`、`AppContent.tsx`、`AppOverlays.tsx`，拆分页面组合层。  
  Added `AppHero.tsx`, `AppContent.tsx`, and `AppOverlays.tsx` to split page composition out of `App.tsx`.
- 新增 `markerNavigation.ts`，统一按记录 ID 定位并打开详情的联动行为。  
  Added `markerNavigation.ts` to unify “focus marker by id and open detail” flows.
- 新增 `useLockedModal.ts`，统一弹窗 body lock 和 `Escape` 关闭逻辑。  
  Added `useLockedModal.ts` to unify body locking and `Escape` handling for modals.
- 新增 `docs/README.md` 作为文档索引页。  
  Added `docs/README.md` as the docs index.
- 新增 `docs/future-roadmap.md` 作为后续功能规划文档。  
  Added `docs/future-roadmap.md` as the agreed future roadmap.
- 新增 `CHANGELOG.md` 作为项目长期变更记录。  
  Added `CHANGELOG.md` as a durable project history file.

### Changed / 变更

- 将数据备份与恢复从侧栏常驻模块调整为由旅行记录模块触发的弹窗交互。  
  Moved backup and restore into a modal launched from the travel records module.
- 优化时间线筛选文案、下拉样式、隐藏滚动条和边缘渐隐效果。  
  Refined the timeline filter copy, dropdown styling, hidden scrollbar behavior, and edge fade treatment.
- 调整旅行记录详情头部布局，稳定“国内旅行 / 国际旅行”标签的位置。  
  Refined the marker detail header layout and stabilized the placement of the travel scope tag.
- 优化旅行记录模块中的旅伴筛选控件样式。  
  Restyled the travel companion filter in the records module.
- 将样式系统从单一超大 `src/styles/index.css` 拆分为 `base.css`、`layout.css`、`home.css`、`responsive.css` 和 `components/*.css`。  
  Split the style system from the old monolithic `src/styles/index.css` into `base.css`, `layout.css`, `home.css`, `responsive.css`, and `components/*.css`.
- 重构 `App.tsx`，通过提取页面组合层、travel store actions 和地图上下文，让其更接近容器层。  
  Refactored `App.tsx` into a thinner container by extracting page composition, travel store actions, and map context handling.
- 刷新 README 与 `docs/` 文档，使其与当前功能、代码结构和本地 Node 20 工作流保持一致。  
  Refreshed README and the docs set so they match the current product, code structure, and local Node 20 workflow.
- 扩展未来功能路线图，并将“数据库升级到 MySQL”提升为最优先事项。  
  Expanded the roadmap and promoted “migrate the database to MySQL” to the top future priority.

### Fixed / 修复

- 修复时间线渐隐效果不明显的问题。  
  Fixed timeline fade behavior so the scroll affordance is visible.
- 修复旅行记录详情中范围标签位置不稳定的问题。  
  Fixed unstable placement of the travel scope badge in the marker detail panel.
- 修复本地启动说明与实际 Node.js 20 要求不一致的问题。  
  Fixed local startup guidance so it reflects the actual Node.js 20 requirement.

### Verified / 已验证

- `vite build`

## 2026-04-21

### Changed / 变更

- 合并 PR [#9](https://github.com/louzhedong/personal_travel_daily/pull/9) `[codex] Align project docs and prompts`。  
  Merged PR [#9](https://github.com/louzhedong/personal_travel_daily/pull/9) `[codex] Align project docs and prompts`.
- 刷新 README，并补充项目总览文档。  
  Refreshed the README and added a project overview document.
- 重写攻略功能说明与设计文档，使其与当时的产品能力保持一致。  
  Rewrote the guide feature and design docs to match the product surface at that point.
- 更新项目级与攻略专项 prompt，补齐攻略收藏、关联规则与使用方式说明。  
  Updated project and guide prompts to reflect saved guides, linking rules, and prompt usage.

## 2026-04-20

### Added / 新增

- 合并 PR [#6](https://github.com/louzhedong/personal_travel_daily/pull/6) `feat: 数据备份恢复与导入预览 / Add data backup restore and import preview`。  
  Merged PR [#6](https://github.com/louzhedong/personal_travel_daily/pull/6) `feat: 数据备份恢复与导入预览 / Add data backup restore and import preview`.
- 新增 `DataSync`，支持 JSON 导出、导入预览、按 ID 合并恢复和 CSV 预览导出。  
  Added `DataSync` with JSON export, import preview, merge-by-id restore, and CSV export for previews.
- 新增存储层导入校验、归一化、合并统计和合并辅助能力。  
  Added storage-side validation, normalization, merge stats, and merge helpers for data restore.
- 新增数据备份与恢复相关测试覆盖。  
  Added tests for storage merge logic and the `DataSync` flow.
- 合并 PR [#7](https://github.com/louzhedong/personal_travel_daily/pull/7) `feat: add saved guide sidebar and travel guide linking`。  
  Merged PR [#7](https://github.com/louzhedong/personal_travel_daily/pull/7) `feat: add saved guide sidebar and travel guide linking`.
- 新增统一的攻略收藏侧栏，支持筛选、查看原文和定位到对应旅行记录。  
  Added a unified saved guides sidebar with filters, source links, and jump-to-record behavior.
- 新增攻略收藏、取消收藏、关联到旅行记录与解除关联能力。  
  Added save, unsave, link, and unlink actions for guides.
- 在旅行记录详情中新增相关攻略展示。  
  Added related guide rendering inside marker detail.

### Changed / 变更

- 增强 `guideRepository`，补齐查询、按 marker 过滤、排序与 upsert 去重能力。  
  Enhanced `guideRepository` with lookup helpers, marker filtering, sorting, and upsert deduplication.
- 优化收藏抽屉、滚动阴影提示与详情头部操作区交互。  
  Polished drawer interactions, scroll shadow hints, and detail header actions around the guide workflow.

## 2026-04-18

### Added / 新增

- 合并 PR [#4](https://github.com/louzhedong/personal_travel_daily/pull/4) `feat: add guide search and crawling workflow`。  
  Merged PR [#4](https://github.com/louzhedong/personal_travel_daily/pull/4) `feat: add guide search and crawling workflow`.
- 新增攻略搜索前端主流程，包括本地历史与缓存、远程 provider 回退、结构化摘要与正文片段展示。  
  Added the full guide search frontend flow with local history/cache, remote provider fallback, summaries, and snippets.
- 新增本地攻略聚合服务，包括适配器、文件缓存、Geoapify POI 接入和国内 POI fallback。  
  Added the local guide aggregation service with adapters, file cache, Geoapify POI integration, and domestic POI fallback data.
- 支持从首页和记录详情打开攻略搜索。  
  Added entry points to open guide search from both the homepage and the record detail panel.

### Changed / 变更

- 搜索历史改为按规范化关键词去重。  
  Deduplicated search history by normalized keyword.
- 对本地整理内容隐藏误导性的“查看原文”入口。  
  Hid misleading “view original” links for locally curated entries.
- 当实时 POI 未命中时，自动回退到本地目的地数据。  
  Added fallback behavior when realtime POI results are empty.

### Documentation / 文档

- 合并 PR [#5](https://github.com/louzhedong/personal_travel_daily/pull/5) `docs: add guide search docs and prompt packs`。  
  Merged PR [#5](https://github.com/louzhedong/personal_travel_daily/pull/5) `docs: add guide search docs and prompt packs`.
- 补充攻略搜索文档与可复用 Prompt 文档。  
  Added guide search docs and reusable prompt packs.
- 更新 README 与项目 Prompt，使其反映攻略搜索架构。  
  Updated README and project prompts to reflect the guide search architecture.

## 2026-04-17

### Added / 新增

- 合并 PR [#3](https://github.com/louzhedong/personal_travel_daily/pull/3) `feat: 实现旅行记录详情面板及编辑功能`。  
  Merged PR [#3](https://github.com/louzhedong/personal_travel_daily/pull/3) `feat: 实现旅行记录详情面板及编辑功能`.
- 新增旅行记录详情面板，支持多图预览和全屏灯箱。  
  Added the travel record detail panel with multi-image preview and fullscreen lightbox.
- 新增旅行记录编辑能力，支持修改描述和图片链接。  
  Added inline editing for notes and image links.
- 新增 `MarkerDetailPanel` 与 `MarkerList` 测试。  
  Added tests for `MarkerDetailPanel` and `MarkerList`.

### Changed / 变更

- 隔离详情面板滚动，避免底层页面滚动串联。  
  Isolated detail-panel scrolling to avoid background scroll chaining.
- 增加更清晰的删除权限提示。  
  Added clearer permission hints for delete actions.
- 统一详情面板幽灵按钮样式。  
  Unified ghost-button styling for record detail actions.

## 2026-04-14

### Added / 新增

- 合并 PR [#1](https://github.com/louzhedong/personal_travel_daily/pull/1) `feat: refactor persistence and enrich map journey UX`。  
  Merged PR [#1](https://github.com/louzhedong/personal_travel_daily/pull/1) `feat: refactor persistence and enrich map journey UX`.
- 引入 repository 分层，重构前端持久化方案。  
  Introduced the repository layer for client-side persistence.
- 将 IndexedDB schema 拆分为独立 object store，并补齐仓库层测试。  
  Split the IndexedDB schema into dedicated object stores and added repository-level tests.
- 新增地图旅途轨迹、方向箭头与 hover 路线信息展示。  
  Added map journey arcs, direction arrows, and route hover information.

### Changed / 变更

- App 初始化改为支持异步 store 加载。  
  Refactored app initialization to support asynchronous store loading.
- 保持对旧版数据的向后兼容迁移。  
  Kept backward compatibility with legacy data migration.
- 地图区块 hover 提示从简单计数升级为轻量记录预览。  
  Improved region hover previews from plain counts to lightweight record summaries.

### Documentation / 文档

- 合并 PR [#2](https://github.com/louzhedong/personal_travel_daily/pull/2) `docs: add reusable AI prompt docs for project collaboration`。  
  Merged PR [#2](https://github.com/louzhedong/personal_travel_daily/pull/2) `docs: add reusable AI prompt docs for project collaboration`.
- 新增 `system-prompt.md`、`task-prompt.md`、`design-prompt.md` 与 `project-ai-prompt.md`。  
  Added `system-prompt.md`, `task-prompt.md`, `design-prompt.md`, and `project-ai-prompt.md`.
- 在 README 中加入 Prompt 文档入口。  
  Updated the README documentation index with prompt entries.
