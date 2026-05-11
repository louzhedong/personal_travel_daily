# 管理后台与质量巡检 / Admin Quality Operations

## 1. 目标 / Goal

管理后台与质量巡检把 `/admin` 从“系统用户总览”升级为默认只读的质量运营台。管理员可以在一个页面看到数据健康、内容整理缺口、攻略来源异常和旅伴回忆快照状态，并对可修复白名单问题执行“预览后确认”的可选修复。

Admin Quality Operations upgrades `/admin` from a system-user overview into a read-by-default quality operations desk. Admins can inspect data health, curation gaps, guide-source issues, and companion-memory snapshot status in one place, with optional preview-then-confirm repair for allowlisted issues.

默认流程仍只发现问题，不直接修改业务数据。自动修复只覆盖白名单，必须先生成预览，再由管理员确认执行，并写入审计日志。

The default flow still detects issues without changing business data. Auto repair only covers an allowlist, requires preview before admin confirmation, and writes audit logs.

## 2. API / API

继续复用 `GET /api/admin/overview`，新增 `quality` 字段。

The feature continues to use `GET /api/admin/overview` and adds a `quality` field.

```ts
interface AdminQualityReportDto {
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    affectedAccountCount: number;
    checkedAt: string;
  };
  issues: AdminQualityIssueDto[];
}
```

问题项包含严重程度、类型、定位对象、账号、检测时间和建议操作。

Each issue includes severity, type, target, account context, detection time, and suggested action.

新增 `POST /api/admin/quality-issues/auto-fix`，请求体包含 `issueId` 与 `dryRun`。`dryRun=true` 只返回变更预览，`dryRun=false` 才执行确认后的修复。

Added `POST /api/admin/quality-issues/auto-fix`. The body includes `issueId` and `dryRun`; `dryRun=true` returns a change preview only, while `dryRun=false` applies the confirmed repair.

## 3. 巡检规则 / Inspection Rules

- `marker_missing_photo`：旅行记录缺少照片。
- `marker_unassigned_trip`：旅行记录未归入行程。
- `trip_missing_cover`：行程缺少封面。
- `photo_missing_caption`：照片缺少说明。
- `planning_overdue`：行前规划已过预计日期但仍未转记录。
- `saved_guide_unlinked`：收藏攻略未关联旅行记录。
- `guide_source_degraded`：攻略来源近期失败高于成功，或只有失败没有成功。
- `guide_search_error_spike`：最近 30 天攻略搜索失败升高。
- `companion_memory_snapshot_stale`：旅伴回忆快照过期或源数据规模已变化。

Inspection rules:

- `marker_missing_photo`: a travel marker has no photos.
- `marker_unassigned_trip`: a travel marker is not assigned to a trip.
- `trip_missing_cover`: a trip has no cover image.
- `photo_missing_caption`: a photo has no caption.
- `planning_overdue`: a planning item is past its planned date but still not converted.
- `saved_guide_unlinked`: a saved guide is not linked to a marker.
- `guide_source_degraded`: a guide source has more recent failures than successes, or only failures.
- `guide_search_error_spike`: guide-search errors rise in the recent 30-day window.
- `companion_memory_snapshot_stale`: a companion-memory snapshot is expired or no longer matches source counts.

## 4. 可选修复 / Optional Repair

自动修复开放白名单：

- `trip_missing_cover`：从该行程已有旅行照片中选择第一张作为封面。
- `photo_missing_caption`：使用照片所属记录的“地区 · 城市”生成说明，并补齐同记录下所有缺说明照片。
- `marker_unassigned_trip`：按记录日期匹配最合适的现有行程。
- `planning_overdue`：将过期规划顺延 7 天，保留规划内容。
- `guide_source_degraded`：确认排障后清空来源失败计数与失败原因。
- `companion_memory_snapshot_stale`：重新生成旅伴回忆快照。

The auto-repair allowlist covers:

- `trip_missing_cover`: choose the first existing trip photo as the trip cover.
- `photo_missing_caption`: generate captions from the photo marker's "region · city" for all uncaptained photos in the same marker.
- `marker_unassigned_trip`: assign the marker to the best matching existing trip by date.
- `planning_overdue`: postpone the overdue planning item by seven days while preserving its content.
- `guide_source_degraded`: clear source failure counts and failure reasons after admins confirm remediation.
- `companion_memory_snapshot_stale`: regenerate the companion-memory snapshot.

`marker_missing_photo`、`saved_guide_unlinked` 与 `guide_search_error_spike` 继续只展示建议、定位和上下文复制，不执行伪修复。

`marker_missing_photo`, `saved_guide_unlinked`, and `guide_search_error_spike` still provide suggestions, navigation, and context copy only; they do not run pseudo repairs.

## 5. 严重程度 / Severity

- `critical`：来源异常、搜索失败升高、回忆快照过期。
- `warning`：记录缺图、未归行程、规划过期。
- `info`：行程缺封面、照片缺说明、攻略未关联。

Severity:

- `critical`: source degradation, search error spikes, stale memory snapshots.
- `warning`: missing marker photos, unassigned markers, overdue planning items.
- `info`: missing trip covers, missing photo captions, unlinked saved guides.

## 6. 分层 / Layering

- `server/appApi/repositories/adminQualityRepository.ts`：读取旅伴回忆快照健康数据。
- `server/appApi/services/admin/qualityReport.ts`：纯函数生成质量报告。
- `server/appApi/services/adminQualityAutoFixService.ts`：执行白名单修复预览与确认写入。
- `server/appApi/services/adminService.ts`：聚合账号树、搜索日志、来源健康和快照健康。
- `server/appApi/types.ts` / `src/lib/api/types.ts`：同步质量报告 DTO。
- `src/modules/admin/adminPageModel.ts`：质量巡检标签、账号过滤和 Top issues。
- `src/components/admin/AdminQualitySummaryPanel.tsx`：全局质量摘要与问题列表。
- `src/components/admin/AdminQualityIssueList.tsx`：问题列表展示。
- `src/components/admin/AdminAccountQualityPanel.tsx`：账号级问题面板。

Summary: Backend rules stay in service-layer pure functions, optional repair writes are isolated in `adminQualityAutoFixService`, and frontend components consume typed DTOs through lightweight view-model helpers.

## 7. 页面 / UI

后台首屏新增“质量巡检”区域，展示严重、注意、建议、影响账号数，并列出 Top 问题。

The admin page adds a “质量巡检” section near the top, showing critical, warning, info, affected-account counts, and top issues.

账号详情新增“账号质量”区域，切换账号时只展示当前账号相关问题。

The account detail area adds “账号质量”, showing only issues related to the selected account.

空态只显示 `暂无质量问题`。

The empty state only shows `暂无质量问题`.

可修复问题的详情抽屉显示“可选修复”区块，管理员先点击“预览修复”查看字段变更，再点击“确认修复”执行。

Repairable issue drawers show an optional repair block. Admins click "预览修复" to inspect field changes, then click "确认修复" to apply the change.

## 8. 测试 / Tests

- `server/__tests__/adminQualityReport.spec.ts`：覆盖所有巡检规则、排序和 80 条截断。
- `server/__tests__/adminQualityAutoFixService.spec.ts`：覆盖低/中/高风险修复预览、确认写入和非白名单拒绝。
- `server/__tests__/adminService.spec.ts`：覆盖后台聚合服务接入质量报告。
- `server/__tests__/adminSerializer.spec.ts`：覆盖照片元数据序列化。
- `src/modules/__tests__/AdminPage.spec.tsx`：覆盖质量摘要、全局问题、账号问题、账号切换和确认式修复入口。

Tests cover the rule engine, auto-fix service, service integration, photo metadata serialization, page rendering, account-level filtering, and confirmed repair UI.

## 9. 边界 / Boundaries

- 默认后台巡检仍保持只读，只有白名单问题支持确认式写入。
- 不新增 Prisma 模型或 migration。
- 不做坏图真实 HTTP 探测。
- 不做定时任务或告警推送。
- 不做批量一键修复或非白名单自动修复。

Boundaries:

- Admin inspection remains read-by-default; only allowlisted issues support confirmed writes.
- No new Prisma model or migration.
- No real HTTP probing for broken images.
- No cron jobs or alert delivery.
- No bulk one-click repair or non-allowlisted automatic repair.
