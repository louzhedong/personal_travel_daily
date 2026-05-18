# 标签治理与自定义词表 / Tag Governance and Custom Vocabulary

标签治理把固定标签枚举升级为系统词表 + 账号级自定义词表，继续兼容已有 `VisitMarker.tags` JSON 字段，并让统计、Atlas、搜索和整理工作台共享同一套标签解释。

Tag Governance evolves fixed marker-tag enums into a system vocabulary plus account-level custom vocabulary, while keeping the existing `VisitMarker.tags` JSON field compatible across stats, Atlas, search, and organization.

## 已落地范围 / Delivered Scope

- 新增 `/tags` 标签治理页，管理常用、隐藏、排序和自定义标签。
  Adds the `/tags` governance page for frequent, hidden, ordered, and custom tags.
- 服务端保留系统标签，并允许账号级自定义标签写入。
  Keeps system tags on the server and allows account-level custom tags.
- 支持同义标签合并和批量替换，降低历史标签噪声。
  Supports alias merging and batch replacement to reduce historical tag noise.
- 统计中心、Atlas、记录列表和整理工作台接入自定义标签筛选。
  Wires custom-tag filtering into stats, Atlas, marker lists, and the Organization Workbench.

## API 与数据 / APIs and Data

- `GET /api/marker-tags/vocabulary`
- `POST /api/marker-tags/vocabulary`
- `PATCH /api/marker-tags/vocabulary/:value`
- `DELETE /api/marker-tags/vocabulary/:value`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/tagVocabularyService.ts`
- `shared/markerMetadata.ts`
- `src/modules/tag-governance/TagGovernancePage.tsx`
- `src/lib/api/tagVocabularyApi.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/tagVocabularyService.spec.ts`
- `server/__tests__/appApiRoutes.tagVocabulary.spec.ts`
- `src/modules/__tests__/TagGovernancePage.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
