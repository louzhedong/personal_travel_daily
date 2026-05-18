# 整理工作台 / Organization Workbench

整理工作台把后台质量巡检的信号转化为普通用户可执行的私密整理任务，集中处理未归行程记录、缺说明照片、未关联攻略、待精选照片和弱标签记录。

The Organization Workbench turns admin quality signals into private user-facing cleanup tasks for unassigned markers, missing photo captions, unlinked guides, photos to curate, and weak marker tags.

## 已落地范围 / Delivered Scope

- 新增 `/organize` 页面，聚合当前账号的数据整理建议。
  Adds the `/organize` page for account-scoped organization suggestions.
- 支持批量归行程、批量补标签、批量标记精选与说明草稿生成。
  Supports batch trip assignment, tag updates, featured-photo marking, and caption draft generation.
- 所有写操作遵循 `preview -> apply` 二阶段确认，避免误批量修改。
  All writes follow a `preview -> apply` two-step confirmation flow to prevent accidental bulk changes.
- 面向普通用户只返回当前账号数据，不暴露后台跨账号上下文。
  Returns only current-account data to normal users and does not expose cross-account admin context.

## API 与数据 / APIs and Data

- `GET /api/organization/workbench`
- `POST /api/organization/actions/preview`
- `POST /api/organization/actions/apply`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/organizationWorkbenchService.ts`
- `server/appApi/repositories/organizationRepository.ts`
- `src/modules/organize/OrganizationWorkbenchPage.tsx`
- `src/modules/organize/organizationWorkbenchModel.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/organizationWorkbenchService.spec.ts`
- `server/__tests__/appApiRoutes.organization.spec.ts`
- `src/modules/__tests__/OrganizationWorkbenchPage.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
