# Changelog / 更新日志

本文件按日期与 PR 直接追加记录，不使用 `Unreleased` 聚合区。每次创建 PR 时，同步补充对应条目。  
This file is appended directly by date and PR. It does not use an `Unreleased` section, and each PR should add its own entry.

## 2026-04-22

### PR [#11](https://github.com/louzhedong/personal_travel_daily/pull/11) `feat: 优化攻略搜索体验与权限边界 / Refine guide search experience and permission boundary`

### Added / 新增

- 新增主页面右下角“回到顶部”按钮，仅在主页面离开顶部后显示。  
  Added a bottom-right “back to top” button for the main page that only appears after the page scrolls away from the top.
- 新增京都官网与穷游论坛站点级正文适配测试，并补充主页面回顶按钮测试。  
  Added site-specific extraction tests for Kyoto Travel and Qyer Forum, plus a test for the main-page back-to-top button.

### Changed / 变更

- 优化攻略搜索阅读体验：支持目录、原文视图、主页面回顶入口，并调整搜索面板滚动与吸顶反馈。  
  Improved the guide-search reading experience with an outline, original view, main-page back-to-top entry, and refined panel scroll/sticky behavior.
- 强化攻略搜索与收藏联动，合并 `main` 新结构后继续保留自动搜索与权限边界逻辑。  
  Tightened guide-search and saved-guide integration, preserving auto-search and permission boundaries after adopting the new `main` structure.
- 针对 `kyoto.travel` 与穷游论坛增加站点级正文白名单/降级策略，让正文提取更稳定。  
  Added site-specific whitelisting and fallback strategies for `kyoto.travel` and Qyer Forum to stabilize article extraction.

### Fixed / 修复

- 修复攻略搜索中他人旅行记录仍可出现“解除关联”或“关联到当前记录”的权限边界问题。  
  Fixed permission-boundary regressions where other users' markers could still expose unlink or relink actions in the guide flow.
- 修复攻略面板原文阅读的滚动、置顶反馈与回顶入口可用性问题。  
  Fixed guide-panel original-reading issues around scrolling, sticky feedback, and top-return affordances.

### Verified / 已验证

- `vite build`
- `vitest run --environment jsdom --run src/modules/__tests__/App.spec.tsx src/components/__tests__/GuideSearchPanel.spec.tsx`

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
