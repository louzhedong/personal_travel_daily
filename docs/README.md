# 文档导航首页 / Documentation Index

这份文档是当前仓库所有文档的统一入口。按"读者视角"组织，方便快速定位到需要的材料。

This index is the single entry point to every document in the repository. It is organized around reader goals, not folder layout.

---

## 1. Start Here / 读者入口

先读这两份：

- [项目总览 / Project Overview](./technical/project-overview.md)
  - 全量模块、分层与约束的总入口。
- [未来 Roadmap / Product Roadmap](./technical/future-roadmap.md)
  - 已完成里程碑与下一阶段方向。

Summary: Start with the project overview and the roadmap to understand both "what exists today" and "what comes next".

## 2. Product / 项目与产品定位

- [项目总览 / Project Overview](./technical/project-overview.md)
  - 产品能力、模块职责、分层与规范。
- [未来 Roadmap / Product Roadmap](./technical/future-roadmap.md)
  - 已完成里程碑、下一阶段路线图与选题原则。

Summary: Product-oriented context lives in the overview and roadmap; read these before suggesting new work.

## 3. Architecture / 架构

- [架构硬化深度分析 / Architecture Hardening Analysis](./technical/architecture-hardening-analysis.md)
  - 当前架构风险、技术债路线和首批 DTO 边界硬化策略。
- [前端架构 / Frontend Architecture](./technical/frontend-architecture.md)
  - `App` 路由、`TravelApp` 容器、大组件拆分与样式组织约定。
- [后端架构 / Backend Architecture](./technical/backend-architecture.md)
  - `routes/services/repositories/schemas/serializers/shared` 分层与近期重构点。
- [项目总览 / Project Overview](./technical/project-overview.md)
  - 产品能力、关键文件与全局约束的总入口。

Summary: The architecture section now includes hardening analysis plus dedicated frontend and backend docs, with the project overview remaining the cross-cutting map.

## 4. Feature Docs / 按能力拆分的设计

- [认证与会话技术方案（含附录架构图与时序图）/ Auth Technical Design](./technical/auth-technical-design.md)
- [登录注册交互手册 / Auth Quick Reference](./technical/auth-login-register.md)
- [行程集合二期 / Trip Collection Phase Two](./technical/trip-collection-phase-two.md)
- [行前规划工作台 / Trip Planning Workspace](./technical/trip-planning-workspace.md)
- [愿望地图 / Wishlist Map](./technical/wishlist-map.md)
- [Story Studio 与旅行故事导出 / Story Studio and Trip Story Export](./technical/trip-story-export.md)
- [旅行胶囊 / Travel Memory Capsules](./technical/memory-capsules.md)
- [旅伴共同回忆 / Companion Shared Memories](./technical/companion-shared-memories.md)
- [影像编辑台 / Photo Curation Hub](./technical/photo-curation-hub.md)
- [管理后台与质量巡检 / Admin Quality Operations](./technical/admin-quality-operations.md)
- [后台管理二期 / Admin Management Phase Two](./technical/admin-management-phase-two.md)
- [账号设置与会话治理 / Account Settings and Session Governance](./technical/account-settings-session-governance.md)
- [旅行成就系统 / Travel Achievements](./technical/travel-achievements.md)
- [攻略搜索功能说明 / Guide Search Feature](./technical/guide-search-feature.md)
- [攻略搜索 / 收藏 / 关联设计 / Travel Guide Search Design](./technical/travel-guide-search-design.md)
- [攻略搜索增强与来源治理 / Guide Search Enhancement and Source Governance](./technical/guide-search-governance.md)
- [地图渲染与 Hover 性能 / Map Rendering and Hover Performance](./technical/map-rendering-and-hover-performance.md)
- [地图回放模式 / Map Replay Mode](./technical/map-replay-mode.md)
- [设计 Token / Design Tokens](./design/design-tokens.md)

Summary: Feature docs focus on one capability at a time, including the shipped trip-collection phase-two workflow.

## 5. API Contracts / 接口契约

- [App API Contract](./technical/app-api-contract.md)
  - 主业务 API 契约（认证、bootstrap、旅伴、记录、收藏、行程、统计、后台）。
- [Guide Search API Contract](./technical/guide-search-api-contract.md)
  - 攻略搜索服务契约。

Summary: Check these contracts before consuming or changing any HTTP endpoint.

## 6. Operations / 本地开发与部署

- [本地联调排查文档 / Local Dev Troubleshooting](./technical/local-dev-troubleshooting.md)
  - Docker Compose、端口占用、`DATABASE_URL`、Prisma 连接错误等常见问题排查。
- 根目录 [README.md](../README.md)
  - 一键启动、常用脚本与默认端口。
- 根目录 [CHANGELOG.md](../CHANGELOG.md)
  - 版本 / PR 级变更日志。

Summary: Use these for day-to-day development, local debugging, and release tracking.

## 7. AI Prompts（可选）/ AI Collaboration Materials (Optional)

> 免责声明 / Disclaimer
>
> `docs/prompts/*` 是 AI 协作素材（prompt、角色设定、风格约束），不是最新的事实源。任何与 `docs/technical/` 下文档冲突的描述都应以 `docs/technical/` 为准。
>
> `docs/prompts/*` contains AI collaboration materials (prompts, persona definitions, style rules). They are NOT the authoritative source of truth. Whenever the prompts disagree with anything under `docs/technical/`, the technical docs always win.

常用 prompt：

- [项目 AI Prompt / Project AI Prompt](./prompts/project-ai-prompt.md)
- [任务 Prompt / Task Prompt](./prompts/task-prompt.md)
- [系统 Prompt / System Prompt](./prompts/system-prompt.md)
- [App API Prompt](./prompts/app-api-prompt.md)
- [Auth Prompt](./prompts/auth-prompt.md)
- [管理员后台 Prompt / Admin Backoffice Prompt](./prompts/admin-backoffice-prompt.md)
- [地图记录 Prompt / Map Recording Prompt](./prompts/map-recording-prompt.md)
- [地图回放 Prompt / Map Replay Prompt](./prompts/map-replay-prompt.md)
- [记录管理 Prompt / Record Management Prompt](./prompts/record-management-prompt.md)
- [时间线 Prompt / Timeline Prompt](./prompts/timeline-prompt.md)
- [行程集合 Prompt / Trip Collection Prompt](./prompts/trip-collection-prompt.md)
- [统计中心 Prompt / Stats Center Prompt](./prompts/stats-center-prompt.md)
- [攻略搜索 Prompt 系列 / Guide Search Prompt Series](./prompts/guide-search-prompt.md)
- [攻略搜索前端 Prompt / Guide Search Frontend Prompt](./prompts/guide-search-frontend-prompt.md)
- [攻略搜索适配器 Prompt / Guide Search Adapter Prompt](./prompts/guide-search-adapter-prompt.md)
- [数据同步 Prompt / Data Sync Prompt](./prompts/data-sync-prompt.md)
- [Prisma / MySQL Prompt](./prompts/prisma-mysql-prompt.md)
- [设计 Prompt / Design Prompt](./prompts/design-prompt.md)
- [本地开发 Prompt / Local Dev Prompt](./prompts/local-dev-prompt.md)
- [旅伴管理 Prompt / Companion Management Prompt](./prompts/companion-management-prompt.md)

Summary: Prompts are reference-only; defer to `docs/technical/` whenever there is any conflict.

---

## 历史档案 / Historical Archive

- [MySQL 升级技术方案（已归档）/ MySQL Upgrade Design (Archived)](./technical/archived/mysql-upgrade-design.md)
  - 本地存储 → MySQL 升级已在 v1.x 完成；档案仅供参考。

Summary: Archived docs are kept for historical context only; they are not the current source of truth.
