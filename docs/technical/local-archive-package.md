# 本地归档与离线纪念包 / Local Archive and Offline Keepsake Package

本地归档与离线纪念包在浏览器端为行程故事、年度回顾和旅行胶囊生成可迁移 ZIP，包含 manifest、结构化 JSON、Markdown 摘要、SVG 预览和图片 URL 清单。

Local Archive and Offline Keepsake Package creates browser-side portable ZIP files for trip stories, annual reviews, and memory capsules, including manifests, structured JSON, Markdown summaries, SVG previews, and image URL lists.

## 已落地范围 / Delivered Scope

- 导出入口接入行程故事、年度回顾和胶囊详情页。
  Adds export entries to Trip Story, Annual Review, and Memory Capsule detail pages.
- 归档包包含 `manifest.json`、`summary.md`、`content/*.json`、`images/image-urls.md` 和 `exports/*.svg`。
  Packages include `manifest.json`, `summary.md`, `content/*.json`, `images/image-urls.md`, and `exports/*.svg`.
- 仅保存远程图片 URL 引用，不下载、不代理、不内联原图。
  Keeps remote image URLs as references only; it does not download, proxy, or inline originals.
- 不新增服务端文件存储，全部通过浏览器 `Blob` 生成。
  Adds no server-side file storage; everything is generated with browser `Blob` APIs.

## API 与数据 / APIs and Data

- 无新增后端 API / No new backend API

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `src/modules/archive/archivePackage.ts`
- `src/modules/archive/archiveManifestModel.ts`
- `src/modules/yearbook/annualReviewArchive.ts`
- `src/modules/capsules/memoryCapsuleExport.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `src/modules/archive/__tests__/localArchive.spec.ts`
- `src/modules/capsules/__tests__/memoryCapsuleExport.spec.ts`
- `src/modules/__tests__/TripStoryPage.spec.tsx`
- `src/modules/__tests__/AnnualReviewPage.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
