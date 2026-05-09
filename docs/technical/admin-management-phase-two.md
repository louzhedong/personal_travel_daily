# 后台管理二期 / Admin Management Phase Two

## 1. 目标 / Goal

后台管理二期把 `/admin` 从“一期只读质量巡检”升级为“只读治理台”。管理员可以筛选质量问题、查看问题详情、跳转到业务页面处理，并通过审计日志追踪后台治理动作。

Admin Management Phase Two upgrades `/admin` from a phase-one read-only quality inspection page into a read-only governance console. Admins can filter quality issues, inspect issue details, jump to business pages for remediation, and track governance actions through audit logs.

本阶段继续坚持后台只读原则：后台页面不直接修复业务数据，不新增批量修复写操作，不绕过业务页面权限边界。

This phase keeps the backoffice read-only: the admin page does not directly repair business data, does not add bulk repair mutations, and does not bypass business-page permission boundaries.

## 2. 能力范围 / Scope

已落地范围：

- 质量问题筛选：按严重程度、问题类型、账号和关键词过滤。
- 质量问题详情：通过抽屉展示账号、目标、检测时间、说明和建议动作。
- 只读跳转：质量问题可跳转到行程详情、行前清单、影像编辑台或旅伴回忆页。
- 应用内提醒：基于严重问题、注意项和巡检时间展示后台提醒。
- 审计日志：记录查看问题、复制上下文、定位问题、筛选问题和查看审计等治理动作。
- 审计展示：后台展示最近审计日志，并支持按动作过滤。

Delivered scope:

- Quality filters by severity, issue type, account, and keyword.
- Quality issue drawer with account, target, detected time, description, and suggested action.
- Read-only navigation to trip detail, checklist, photo curation, or companion memories.
- In-app reminders based on critical issues, warning issues, and inspection freshness.
- Audit logs for viewing issues, copying context, navigating to targets, filtering lists, and viewing audit trails.
- Audit trail display with lightweight action filtering.

不在本阶段范围：

- 后台直接修复业务数据。
- 批量修复或批量写操作。
- 外部通知、邮件、Webhook 或飞书告警。
- 定时任务调度系统。
- 坏图真实 HTTP 探测。

Out of scope:

- Direct business-data repair from the backoffice.
- Bulk repair or bulk write operations.
- External notifications, email, webhooks, or Lark alerts.
- A scheduled job system.
- Real HTTP probing for broken images.

## 3. 数据模型 / Data Model

新增 `AdminAuditLog`：

```prisma
model AdminAuditLog {
  id             String   @id
  adminAccountId String   @map("admin_account_id")
  action         String
  targetKind     String?  @map("target_kind")
  targetId       String?  @map("target_id")
  metadataJson   Json?    @map("metadata_json")
  createdAt      DateTime @default(now()) @map("created_at")
  adminAccount   Account  @relation("AdminAuditLogsByAccount", fields: [adminAccountId], references: [id])
}
```

`metadataJson` 只保存 issue id、issue type、跳转路径等治理上下文，不保存密码、Cookie、session token 或完整 user agent。

`metadataJson` stores only governance context such as issue id, issue type, and navigation path. It does not store passwords, cookies, session tokens, or full user agents.

## 4. API / API

新增后台审计接口：

```http
GET  /api/admin/audit-logs?action=&targetKind=&limit=
POST /api/admin/audit-logs
```

新增 admin audit endpoints:

```http
GET  /api/admin/audit-logs?action=&targetKind=&limit=
POST /api/admin/audit-logs
```

所有接口继续通过 `requireAdminAccount()` 保护，普通用户返回 `403`。

All endpoints continue to be protected by `requireAdminAccount()`, and member accounts receive `403`.

`POST /api/admin/audit-logs` 只接受白名单 action：

```ts
type AdminAuditActionDto =
  | 'quality_issue_viewed'
  | 'quality_issue_context_copied'
  | 'quality_issue_navigated'
  | 'quality_issue_list_filtered'
  | 'audit_trail_viewed';
```

`POST /api/admin/audit-logs` only accepts allowlisted actions:

```ts
type AdminAuditActionDto =
  | 'quality_issue_viewed'
  | 'quality_issue_context_copied'
  | 'quality_issue_navigated'
  | 'quality_issue_list_filtered'
  | 'audit_trail_viewed';
```

## 5. 质量问题定位 / Quality Issue Navigation

`AdminQualityIssueDto` 新增结构化定位字段：

```ts
interface AdminQualityIssueDto {
  navigationKind: 'tripDetail' | 'tripChecklist' | 'photoCuration' | 'companionMemories' | 'adminOnly';
  navigationPayload?: {
    tripId?: string;
    companionId?: string;
    year?: number;
    markerId?: string;
    photoId?: string;
    guideId?: string;
  };
  canNavigate: boolean;
}
```

`AdminQualityIssueDto` now includes structured navigation fields:

```ts
interface AdminQualityIssueDto {
  navigationKind: 'tripDetail' | 'tripChecklist' | 'photoCuration' | 'companionMemories' | 'adminOnly';
  navigationPayload?: {
    tripId?: string;
    companionId?: string;
    year?: number;
    markerId?: string;
    photoId?: string;
    guideId?: string;
  };
  canNavigate: boolean;
}
```

定位规则：

- `trip_missing_cover`：跳转 `/trips/:tripId`。
- `photo_missing_caption`：跳转 `/photos`，优先带 `tripId`，否则带 `companionId`。
- `marker_missing_photo`：有行程时跳转 `/trips/:tripId`，否则仅展示后台详情。
- `marker_unassigned_trip`：仅展示后台详情，提示去时间线整理模式处理。
- `planning_overdue`：跳转 `/trips/:tripId/checklist`。
- `saved_guide_unlinked`：当前无稳定 guide 深链，仅展示后台详情。
- `guide_source_degraded` / `guide_search_error_spike`：展示后台趋势和来源健康上下文。
- `companion_memory_snapshot_stale`：跳转 `/companions/:companionId/memories`。

Navigation rules:

- `trip_missing_cover`: navigates to `/trips/:tripId`.
- `photo_missing_caption`: navigates to `/photos`, preferring `tripId` and falling back to `companionId`.
- `marker_missing_photo`: navigates to `/trips/:tripId` when assigned to a trip; otherwise stays in the admin detail view.
- `marker_unassigned_trip`: stays in the admin detail view and suggests using timeline organization mode.
- `planning_overdue`: navigates to `/trips/:tripId/checklist`.
- `saved_guide_unlinked`: stays in the admin detail view because no stable guide deep link exists yet.
- `guide_source_degraded` / `guide_search_error_spike`: stays in the admin trend and source-health context.
- `companion_memory_snapshot_stale`: navigates to `/companions/:companionId/memories`.

## 6. 前端结构 / Frontend Structure

关键文件：

- `src/modules/admin/AdminPage.tsx`：后台容器，承接质量筛选、抽屉、提醒、审计日志和跳转。
- `src/modules/admin/adminPageModel.ts`：质量筛选、跳转目标、上下文序列化、提醒和审计标签等纯逻辑。
- `src/components/admin/AdminQualityFiltersPanel.tsx`：质量筛选面板。
- `src/components/admin/AdminQualityIssueDrawer.tsx`：质量问题详情抽屉。
- `src/components/admin/AdminQualityReminderPanel.tsx`：应用内提醒。
- `src/components/admin/AdminAuditTrailPanel.tsx`：审计日志展示。
- `src/lib/api/adminApi.ts`：后台总览与审计 API client。

Key files:

- `src/modules/admin/AdminPage.tsx`: admin container for filters, drawer, reminders, audit logs, and navigation.
- `src/modules/admin/adminPageModel.ts`: pure logic for quality filters, navigation targets, context serialization, reminders, and audit labels.
- `src/components/admin/AdminQualityFiltersPanel.tsx`: quality filter panel.
- `src/components/admin/AdminQualityIssueDrawer.tsx`: issue detail drawer.
- `src/components/admin/AdminQualityReminderPanel.tsx`: in-app reminder panel.
- `src/components/admin/AdminAuditTrailPanel.tsx`: audit trail panel.
- `src/lib/api/adminApi.ts`: admin overview and audit API client.

## 7. 测试 / Tests

覆盖范围：

- `server/__tests__/adminAuditService.spec.ts`：审计日志创建、查询和序列化。
- `server/__tests__/adminQualityReport.spec.ts`：质量问题规则、排序、截断和结构化定位。
- `server/__tests__/appApiRoutes.spec.ts`：后台审计接口、action 白名单和管理员权限。
- `src/modules/__tests__/AdminPage.spec.tsx`：后台渲染、质量筛选入口、详情抽屉、定位跳转和审计写入。
- `src/modules/__tests__/App.spec.tsx`：管理员 `/admin` 入口和普通用户回退。

Coverage:

- `server/__tests__/adminAuditService.spec.ts`: audit-log creation, listing, and serialization.
- `server/__tests__/adminQualityReport.spec.ts`: quality rules, sorting, truncation, and structured navigation.
- `server/__tests__/appApiRoutes.spec.ts`: audit endpoints, action allowlist, and admin permissions.
- `src/modules/__tests__/AdminPage.spec.tsx`: admin rendering, filter entry, issue drawer, navigation, and audit writes.
- `src/modules/__tests__/App.spec.tsx`: admin `/admin` entry and member fallback.

## 8. 验证 / Verification

```bash
npm run db:generate
```

```bash
npm run test -- server/__tests__/adminAuditService.spec.ts server/__tests__/adminQualityReport.spec.ts server/__tests__/adminService.spec.ts server/__tests__/appApiRoutes.spec.ts
```

```bash
npm run test -- src/modules/__tests__/AdminPage.spec.tsx src/modules/__tests__/App.spec.tsx
```

```bash
npm run build
```
