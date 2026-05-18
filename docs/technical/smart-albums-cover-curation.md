# 智能相册与封面策展 / Smart Albums and Cover Curation

智能相册与封面策展让 `/photos` 从编辑台升级为策展台，为行程、年度回顾、旅伴回忆和旅行胶囊提供统一的封面候选与精选相册表达。

Smart Albums and Cover Curation upgrades `/photos` from an editing desk into a curation desk, providing shared cover candidates and curated album sets for trips, annual reviews, companion memories, and capsules.

## 已落地范围 / Delivered Scope

- 新增年度、城市、旅伴和行程封面候选四类相册视角。
  Adds annual, city, companion, and trip-cover album views.
- 通过 `PhotoAlbumPreference` 保存账号级封面排序和人工 pin。
  Stores account-level cover ordering and manual pins through `PhotoAlbumPreference`.
- 轻量检测重复 URL、坏链格式和无说明图片，并与整理工作台联动。
  Lightly detects duplicate URLs, malformed links, and missing captions, with handoff into the Organization Workbench.
- 支持精选相册 SVG 导出，不做真实图片代理或截图。
  Supports curated album SVG export without real image proxying or screenshots.

## API 与数据 / APIs and Data

- `GET /api/photo-albums`
- `PATCH /api/photo-albums/preferences`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/photoAlbumService.ts`
- `server/appApi/repositories/photoAlbumRepository.ts`
- `src/modules/photos/photoAlbumModel.ts`
- `src/modules/photos/photoAlbumExport.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/photoAlbumService.spec.ts`
- `server/__tests__/appApiRoutes.photos.spec.ts`
- `src/modules/photos/__tests__/photoAlbumModel.spec.ts`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
