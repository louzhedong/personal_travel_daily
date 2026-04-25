# Docs Index

这个目录保存项目的设计说明、接口约定和 AI 协作文档，现已按用途拆分目录：

- `technical/`：技术方案、接口契约、时序图、架构图、联调与性能文档
- `design/`：设计资料，例如设计 token
- `prompts/`：AI 协作、任务与专项 Prompt

推荐按下面的路径查阅。

## 开发入口

- [项目总览](technical/project-overview.md)
- [README 主页](../README.md)
- [Changelog](../CHANGELOG.md)

## 功能与设计

- [未来 Roadmap / TODO](technical/future-roadmap.md)
- [登录注册 + 会话 + 管理员权限技术方案](technical/auth-technical-design.md)
- [认证模块架构图](technical/auth-architecture-diagram.md)
- [登录注册与会话管理时序图](technical/auth-sequence-diagrams.md)
- [MySQL 升级技术方案](technical/mysql-upgrade-design.md)
- [App API Contract](technical/app-api-contract.md)
- [本地联调排查文档](technical/local-dev-troubleshooting.md)
- [攻略搜索功能说明](technical/guide-search-feature.md)
- [攻略搜索 / 收藏 / 关联设计](technical/travel-guide-search-design.md)
- [Guide Search API Contract](technical/guide-search-api-contract.md)
- [地图渲染与 Hover 性能说明](technical/map-rendering-and-hover-performance.md)
- [地图回放模式](technical/map-replay-mode.md)
- [视觉 Token 说明](design/design-tokens.md)

## AI 协作文档

- [项目 AI Prompt](prompts/project-ai-prompt.md)
- [System Prompt](prompts/system-prompt.md)
- [Task Prompt](prompts/task-prompt.md)
- [Design Prompt](prompts/design-prompt.md)

## 业务专项 Prompt

- [Auth Prompt](prompts/auth-prompt.md)
- [Admin Backoffice Prompt](prompts/admin-backoffice-prompt.md)
- [App API Prompt](prompts/app-api-prompt.md)
- [Prisma MySQL Prompt](prompts/prisma-mysql-prompt.md)
- [Local Dev Prompt](prompts/local-dev-prompt.md)

## 功能专项 Prompt

- [Map Recording Prompt](prompts/map-recording-prompt.md)
- [Record Management Prompt](prompts/record-management-prompt.md)
- [Companion Management Prompt](prompts/companion-management-prompt.md)
- [Trip Collection Prompt](prompts/trip-collection-prompt.md)
- [Timeline Prompt](prompts/timeline-prompt.md)
- [Stats Center Prompt](prompts/stats-center-prompt.md)
- [Map Replay Prompt](prompts/map-replay-prompt.md)
- [Data Sync Prompt](prompts/data-sync-prompt.md)

## 攻略专项 Prompt

- [Guide Search Prompt](prompts/guide-search-prompt.md)
- [Guide Search Frontend Prompt](prompts/guide-search-frontend-prompt.md)
- [Guide Search Adapter Prompt](prompts/guide-search-adapter-prompt.md)

## 阅读建议

如果你是第一次进入这个仓库，推荐顺序是：

1. 先看 [README 主页](../README.md)
2. 再看 [项目总览](technical/project-overview.md)
3. 如果要规划功能，先看 [未来 Roadmap / TODO](technical/future-roadmap.md)
4. 如果准备推进数据库主线开发，直接看 [MySQL 升级技术方案](technical/mysql-upgrade-design.md)
5. 如果要做功能开发，再进入对应设计文档
6. 如果要让 AI 持续协作，再看 Prompt 文档
