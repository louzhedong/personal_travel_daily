import type {
  AdminAccountNodeDto,
  AdminQualityIssueDto,
  AdminQualityReportDto,
  GuideSearchStatusBreakdownDto,
  GuideSourceHealthDto,
} from '../../types.js';
import type { CompanionMemorySnapshotHealth } from '../../repositories/adminQualityRepository.js';

const MAX_QUALITY_ISSUES = 80;
const GUIDE_SEARCH_ERROR_SPIKE_THRESHOLD = 3;

const SEVERITY_RANK: Record<AdminQualityIssueDto['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

interface BuildAdminQualityReportInput {
  accounts: AdminAccountNodeDto[];
  statusBreakdown: GuideSearchStatusBreakdownDto[];
  sourceHealth: GuideSourceHealthDto[];
  snapshotHealth: CompanionMemorySnapshotHealth[];
  now?: Date;
}

function toIsoString(value: Date) {
  return value.toISOString();
}

function toDate(value?: string | Date | null) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getIssueDate(value: string | Date | undefined, fallback: Date) {
  return toIsoString(toDate(value) ?? fallback);
}

function createAccountIssueBase(account: AdminAccountNodeDto) {
  return {
    accountId: account.id,
    accountName: account.name,
  };
}

function sortIssues(issues: AdminQualityIssueDto[]) {
  return [...issues].sort((left, right) => {
    const severityDiff = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    const timeDiff = new Date(right.detectedAt).getTime() - new Date(left.detectedAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return left.title.localeCompare(right.title, 'zh-CN');
  });
}

function getCompanionSourceCounts(account: AdminAccountNodeDto, companionId: string) {
  const companion = account.companions.find((item) => item.id === companionId);
  if (!companion) {
    return undefined;
  }

  return {
    markerCount: companion.markers.length,
    photoCount: companion.markers.reduce((sum, marker) => sum + (marker.images?.length ?? marker.imageUrls?.length ?? 0), 0),
    guideCount: companion.savedGuides.length,
  };
}

function buildSnapshotIssue(
  accounts: AdminAccountNodeDto[],
  snapshot: CompanionMemorySnapshotHealth,
  now: Date,
): AdminQualityIssueDto | undefined {
  const account = accounts.find((item) => item.id === snapshot.accountId);
  const sourceCounts = account ? getCompanionSourceCounts(account, snapshot.companionId) : undefined;
  const expired = snapshot.expiresAt.getTime() < now.getTime();
  const sourceChanged =
    !!sourceCounts &&
    (sourceCounts.markerCount !== snapshot.sourceMarkerCount ||
      sourceCounts.photoCount !== snapshot.sourcePhotoCount ||
      sourceCounts.guideCount !== snapshot.sourceGuideCount);

  if (!expired && !sourceChanged && sourceCounts) {
    return undefined;
  }

  const accountName = account?.name ?? snapshot.account.name;
  const reason = expired ? '快照已过期' : sourceCounts ? '源数据规模已变化' : '源旅伴已不可见';

  return {
    id: `companion_memory_snapshot_stale:${snapshot.accountId}:${snapshot.companionId}`,
    severity: 'critical',
    type: 'companion_memory_snapshot_stale',
    title: '回忆快照需要刷新',
    description: `${snapshot.companion.name} 的旅伴回忆${reason}。`,
    accountId: snapshot.accountId,
    accountName,
    targetKind: 'snapshot',
    targetId: snapshot.id,
    targetLabel: snapshot.companion.name,
    detectedAt: getIssueDate(snapshot.expiresAt, now),
    suggestedAction: '进入旅伴回忆页刷新快照。',
  };
}

export function buildAdminQualityReport(input: BuildAdminQualityReportInput): AdminQualityReportDto {
  const now = input.now ?? new Date();
  const issues: AdminQualityIssueDto[] = [];

  for (const account of input.accounts) {
    for (const trip of account.trips) {
      if (!trip.coverImageUrl) {
        issues.push({
          id: `trip_missing_cover:${trip.id}`,
          severity: 'info',
          type: 'trip_missing_cover',
          title: '行程缺少封面',
          description: `${trip.name} 还没有封面图。`,
          ...createAccountIssueBase(account),
          targetKind: 'trip',
          targetId: trip.id,
          targetLabel: trip.name,
          detectedAt: getIssueDate(trip.createdAt, now),
          suggestedAction: '在行程详情中设置封面。',
        });
      }
    }

    for (const companion of account.companions) {
      for (const marker of companion.markers) {
        const images = marker.images ?? [];
        if (images.length === 0 && (!marker.imageUrls || marker.imageUrls.length === 0)) {
          issues.push({
            id: `marker_missing_photo:${marker.id}`,
            severity: 'warning',
            type: 'marker_missing_photo',
            title: '记录缺少照片',
            description: `${marker.scopeName} · ${marker.city} 没有关联照片。`,
            ...createAccountIssueBase(account),
            targetKind: 'marker',
            targetId: marker.id,
            targetLabel: `${marker.scopeName} · ${marker.city}`,
            detectedAt: getIssueDate(marker.createdAt, now),
            suggestedAction: '在记录详情中补充照片。',
          });
        }

        if (!marker.tripId) {
          issues.push({
            id: `marker_unassigned_trip:${marker.id}`,
            severity: 'warning',
            type: 'marker_unassigned_trip',
            title: '记录未归入行程',
            description: `${marker.scopeName} · ${marker.city} 还没有归属行程。`,
            ...createAccountIssueBase(account),
            targetKind: 'marker',
            targetId: marker.id,
            targetLabel: `${marker.scopeName} · ${marker.city}`,
            detectedAt: getIssueDate(marker.createdAt, now),
            suggestedAction: '在时间线整理模式中归入行程。',
          });
        }

        for (const image of images) {
          if (!image.caption?.trim()) {
            issues.push({
              id: `photo_missing_caption:${image.id}`,
              severity: 'info',
              type: 'photo_missing_caption',
              title: '照片缺少说明',
              description: `${marker.scopeName} · ${marker.city} 有照片还没有说明。`,
              ...createAccountIssueBase(account),
              targetKind: 'photo',
              targetId: image.id,
              targetLabel: `${marker.scopeName} · ${marker.city}`,
              detectedAt: getIssueDate(marker.createdAt, now),
              suggestedAction: '在影像编辑台补充照片说明。',
            });
          }
        }
      }

      for (const guide of companion.savedGuides) {
        if (!guide.markerId) {
          issues.push({
            id: `saved_guide_unlinked:${guide.id}`,
            severity: 'info',
            type: 'saved_guide_unlinked',
            title: '攻略未关联记录',
            description: `${guide.result.title} 还没有关联旅行记录。`,
            ...createAccountIssueBase(account),
            targetKind: 'guide',
            targetId: guide.id,
            targetLabel: guide.result.title,
            detectedAt: getIssueDate(guide.savedAt, now),
            suggestedAction: '在记录详情或攻略面板中建立关联。',
          });
        }
      }

      for (const item of companion.planningItems ?? []) {
        const plannedDate = toDate(item.plannedDate);
        if (item.status === 'planned' && plannedDate && plannedDate.getTime() < now.getTime()) {
          issues.push({
            id: `planning_overdue:${item.id}`,
            severity: 'warning',
            type: 'planning_overdue',
            title: '行前规划已过期',
            description: `${item.title} 的预计日期已过，但仍未转为旅行记录。`,
            ...createAccountIssueBase(account),
            targetKind: 'planningItem',
            targetId: item.id,
            targetLabel: item.title,
            detectedAt: getIssueDate(item.plannedDate, now),
            suggestedAction: '在行程详情中确认是否转为记录。',
          });
        }
      }
    }
  }

  for (const source of input.sourceHealth) {
    const degraded =
      source.recentFailure > source.recentSuccess ||
      (!!source.lastFailureReason && !source.lastSuccessAt);
    if (degraded) {
      issues.push({
        id: `guide_source_degraded:${source.id}`,
        severity: 'critical',
        type: 'guide_source_degraded',
        title: '攻略来源异常',
        description: `${source.sourceName} 最近失败 ${source.recentFailure} 次，成功 ${source.recentSuccess} 次。`,
        targetKind: 'guideSource',
        targetId: source.id,
        targetLabel: source.sourceName,
        detectedAt: getIssueDate(source.lastFailureAt, now),
        suggestedAction: '检查来源适配器或降级该来源权重。',
      });
    }
  }

  const errorCount = input.statusBreakdown.find((item) => item.status === 'error')?.count ?? 0;
  const successCount = input.statusBreakdown.find((item) => item.status === 'success')?.count ?? 0;
  const emptyCount = input.statusBreakdown.find((item) => item.status === 'empty')?.count ?? 0;
  if (errorCount >= GUIDE_SEARCH_ERROR_SPIKE_THRESHOLD && errorCount >= successCount + emptyCount) {
    issues.push({
      id: 'guide_search_error_spike:recent-30-days',
      severity: 'critical',
      type: 'guide_search_error_spike',
      title: '攻略搜索失败升高',
      description: `最近 30 天攻略搜索失败 ${errorCount} 次。`,
      targetKind: 'guideSource',
      targetLabel: '攻略搜索',
      detectedAt: toIsoString(now),
      suggestedAction: '检查 guide-api、来源健康度和错误日志。',
    });
  }

  for (const snapshot of input.snapshotHealth) {
    const issue = buildSnapshotIssue(input.accounts, snapshot, now);
    if (issue) {
      issues.push(issue);
    }
  }

  const sortedIssues = sortIssues(issues).slice(0, MAX_QUALITY_ISSUES);
  const affectedAccountIds = new Set(sortedIssues.map((issue) => issue.accountId).filter(Boolean));

  return {
    summary: {
      criticalCount: sortedIssues.filter((issue) => issue.severity === 'critical').length,
      warningCount: sortedIssues.filter((issue) => issue.severity === 'warning').length,
      infoCount: sortedIssues.filter((issue) => issue.severity === 'info').length,
      affectedAccountCount: affectedAccountIds.size,
      checkedAt: toIsoString(now),
    },
    issues: sortedIssues,
  };
}
