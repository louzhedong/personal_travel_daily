# 影像编辑台 / Photo Curation Hub

## 1. 目标 / Goal

影像编辑台是账号级照片整理入口，路由为 `/photos`。它复用旅行记录图片已有的精选、说明和排序字段，把散落在行程详情、年度回顾、Story Studio 和旅伴回忆中的照片素材集中整理。

The Photo Curation Hub is an account-level photo curation surface at `/photos`. It reuses the existing featured, caption, and curated-order fields on visit-marker images, centralizing photo material that feeds trip detail, annual review, Story Studio, and companion memories.

本功能不是通用相册，也不新增媒体库表。一期只解决“哪些照片被精选、哪些缺少说明、如何按行程 / 旅伴 / 年份快速整理”。

This feature is not a generic album and does not add a media-library table. Phase one only answers which photos are featured, which photos miss captions, and how to organize them by trip, companion, and year.

## 2. 数据模型 / Data Model

后端继续使用 `VisitMarkerImage`：

The backend continues to use `VisitMarkerImage`:

```prisma
isFeatured       Boolean
caption          String?
curatedSortOrder Int?
```

这些字段已经被行程详情、年度回顾、Story Studio 和旅伴回忆消费，因此全局整理会直接反哺现有回看页面。

These fields are already consumed by trip detail, annual review, Story Studio, and companion memories, so global curation directly improves existing retrospective pages.

## 3. API / API

### GET `/api/photos/curation`

查询当前登录账号下、未删除旅行记录关联的全部照片。

Lists all photos owned by the current authenticated account and attached to non-deleted markers.

Query:

```ts
{
  tripId?: string;
  companionId?: string;
  year?: number;
  featured?: 'all' | 'featured' | 'unfeatured';
  caption?: 'all' | 'withCaption' | 'missingCaption';
  limit?: number;
}
```

Response:

```ts
{
  summary: {
    totalPhotos: number;
    featuredPhotos: number;
    missingCaptionPhotos: number;
    tripCount: number;
    companionCount: number;
    yearCount: number;
  };
  filters: {
    trips: Array<{ id: string; name: string; photoCount: number }>;
    companions: Array<{ id: string; name: string; color: string; photoCount: number }>;
    years: Array<{ year: number; photoCount: number }>;
  };
  sections: {
    featured: PhotoCurationItemDto[];
    missingCaptions: PhotoCurationItemDto[];
    recent: PhotoCurationItemDto[];
  };
  items: PhotoCurationItemDto[];
}
```

### PATCH `/api/photos/curation`

批量更新当前账号拥有的照片整理字段。

Batch-updates curation fields for photos owned by the current account.

Body:

```ts
{
  items: Array<{
    imageId: string;
    isFeatured?: boolean;
    caption?: string | null;
    curatedSortOrder?: number | null;
  }>;
}
```

服务端会拒绝重复 `imageId`，并把非当前账号照片视为 `NOT_FOUND`。

The service rejects duplicate `imageId` values and treats photos outside the current account as `NOT_FOUND`.

## 4. 分层 / Layering

- `server/appApi/routes/photoCuration.ts`：HTTP 路由与鉴权。
- `server/appApi/schemas/photoCuration.ts`：query 与 body 校验。
- `server/appApi/services/photoCurationService.ts`：筛选、去重、归属校验和更新编排。
- `server/appApi/repositories/photoCurationRepository.ts`：Prisma 查询与批量更新。
- `server/appApi/serializers/photoCurationSerializer.ts`：数据库模型到 DTO 的转换。
- `src/lib/api/photoCurationApi.ts`：前端 API 客户端。
- `src/modules/photos/PhotoCurationPage.tsx`：`/photos` 页面容器。
- `src/modules/photos/photoCurationPageModel.ts`：筛选选项、日期和 alt 文案 helper。
- `src/styles/features/photo-curation.css`：影像编辑台样式。

Summary: The feature follows the existing routes → schemas → services → repositories → serializers stack on the backend and keeps frontend API, page, view-model helpers, and styles separated.

## 5. 入口 / Entry Points

- 首页 Hero：`整理照片`。
- 行程详情“素材”Tab：`打开影像编辑台`，跳转 `/photos?tripId=...`。
- 年度回顾照片墙：`整理年度照片`，跳转 `/photos?year=...`。
- Story Studio：有照片但未手动精选时展示 `去整理照片`，跳转 `/photos?tripId=...`。

Entry points:

- Homepage hero: `整理照片`.
- Trip detail Assets tab: `打开影像编辑台`, linking to `/photos?tripId=...`.
- Annual review photo wall: `整理年度照片`, linking to `/photos?year=...`.
- Story Studio: `去整理照片` when the trip has photos but no manually featured shots, linking to `/photos?tripId=...`.

## 6. 约束 / Constraints

- 一期不新增 Prisma 模型或 migration。
- 一期不做图片上传、压缩、归档、哈希去重或坏链探测。
- 一期不引入拖拽排序。
- 页面筛选必须使用 `FancySelect`，不使用原生 `select`。
- 保存反馈统一使用 `AppToast`。
- 文案保持短，视觉保持轻量编辑台而非后台网格。

Constraints:

- Phase one adds no Prisma model or migration.
- Phase one does not include upload, compression, archival, hash-based dedupe, or broken-link detection.
- Phase one does not introduce drag-and-drop sorting.
- Page filters must use `FancySelect`, not native `select`.
- Save feedback goes through `AppToast`.
- Copy stays short, and the visual style remains a lightweight editorial desk rather than an admin grid.

## 7. 测试 / Tests

- `server/__tests__/photoCurationService.spec.ts`：服务层筛选、归属、去重和更新。
- `server/__tests__/appApiRoutes.spec.ts`：HTTP 路由、鉴权、成功和错误返回。
- `src/modules/__tests__/PhotoCurationPage.spec.tsx`：页面渲染、筛选、更新、Toast 和空态。
- `src/modules/__tests__/App.spec.tsx`：`/photos` 路由与首页入口。
- `src/modules/__tests__/TripDetailPage.spec.tsx`、`AnnualReviewPage.spec.tsx`、`TripStoryPage.spec.tsx`：跨页面入口。

Tests cover the service, HTTP routes, page behavior, app routing, and cross-surface entry points.
