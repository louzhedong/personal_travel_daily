import { getPrismaClient } from '../prisma.js';
import { refreshCompanionMemory } from './companionMemoryService.js';
import type { AdminQualityAutoFixResultDto, AdminQualityIssueTypeDto } from '../types.js';

type SupportedAutoFixType = Extract<
  AdminQualityIssueTypeDto,
  | 'trip_missing_cover'
  | 'photo_missing_caption'
  | 'marker_unassigned_trip'
  | 'planning_overdue'
  | 'guide_source_degraded'
  | 'companion_memory_snapshot_stale'
>;

const SUPPORTED_AUTO_FIX_TYPES = new Set<SupportedAutoFixType>([
  'trip_missing_cover',
  'photo_missing_caption',
  'marker_unassigned_trip',
  'planning_overdue',
  'guide_source_degraded',
  'companion_memory_snapshot_stale',
]);

interface RepairAdminQualityIssueInput {
  issueId: string;
  dryRun?: boolean;
}

function parseIssueId(issueId: string): { type: AdminQualityIssueTypeDto; targetId: string } | undefined {
  const separatorIndex = issueId.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex === issueId.length - 1) {
    return undefined;
  }

  return {
    type: issueId.slice(0, separatorIndex) as AdminQualityIssueTypeDto,
    targetId: issueId.slice(separatorIndex + 1),
  };
}

function toNullableString(value: Date | string | number | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createNotRepairableResult(
  issueId: string,
  issueType: AdminQualityIssueTypeDto,
  targetKind: AdminQualityAutoFixResultDto['targetKind'],
  targetId: string | undefined,
  description: string,
): AdminQualityAutoFixResultDto {
  return {
    issueId,
    issueType,
    targetKind,
    targetId,
    repairable: false,
    status: 'not_repairable',
    title: '暂不支持自动修复',
    description,
    changes: [],
  };
}

async function repairTripMissingCover(
  issueId: string,
  tripId: string,
  dryRun: boolean,
): Promise<AdminQualityAutoFixResultDto> {
  const prisma = getPrismaClient();
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      isDeleted: false,
    },
    include: {
      markers: {
        where: {
          isDeleted: false,
        },
        orderBy: [{ visitedStartAt: 'asc' }, { createdAt: 'asc' }],
        include: {
          images: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
  });

  if (!trip) {
    return createNotRepairableResult(issueId, 'trip_missing_cover', 'trip', tripId, '目标行程不存在或已删除。');
  }

  if (trip.coverImageUrl?.trim()) {
    return {
      issueId,
      issueType: 'trip_missing_cover',
      targetKind: 'trip',
      targetId: tripId,
      repairable: false,
      status: 'already_resolved',
      title: '行程封面已存在',
      description: `${trip.name} 已经有封面，无需修复。`,
      changes: [],
    };
  }

  const candidateImage = trip.markers.flatMap((marker) => marker.images).find((image) => image.imageUrl.trim());
  if (!candidateImage) {
    return createNotRepairableResult(
      issueId,
      'trip_missing_cover',
      'trip',
      tripId,
      '该行程下没有可用旅行照片，无法自动设置封面。',
    );
  }

  if (!dryRun) {
    await prisma.trip.update({
      where: {
        id: tripId,
      },
      data: {
        coverImageUrl: candidateImage.imageUrl,
      },
    });
  }

  return {
    issueId,
    issueType: 'trip_missing_cover',
    targetKind: 'trip',
    targetId: tripId,
    repairable: true,
    status: dryRun ? 'preview' : 'applied',
    title: '自动设置行程封面',
    description: `将使用 ${trip.name} 下第一张旅行照片作为封面。`,
    changes: [
      {
        field: 'coverImageUrl',
        before: null,
        after: candidateImage.imageUrl,
      },
    ],
    appliedAt: dryRun ? undefined : new Date().toISOString(),
  };
}

async function repairPhotoMissingCaption(
  issueId: string,
  photoId: string,
  dryRun: boolean,
): Promise<AdminQualityAutoFixResultDto> {
  const prisma = getPrismaClient();
  const image = await prisma.visitMarkerImage.findUnique({
    where: {
      id: photoId,
    },
    include: {
      marker: true,
    },
  });

  if (!image || image.marker.isDeleted) {
    return createNotRepairableResult(issueId, 'photo_missing_caption', 'photo', photoId, '目标照片不存在或记录已删除。');
  }

  if (image.caption?.trim()) {
    return {
      issueId,
      issueType: 'photo_missing_caption',
      targetKind: 'photo',
      targetId: photoId,
      repairable: false,
      status: 'already_resolved',
      title: '照片说明已存在',
      description: '该照片已经有说明，无需修复。',
      changes: [],
    };
  }

  const nextCaption = `${image.marker.scopeName} · ${image.marker.city}`;
  const markerImages = await prisma.visitMarkerImage.findMany({
    where: {
      markerId: image.markerId,
    },
    select: {
      id: true,
      caption: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const missingCaptionImages = markerImages.filter((item) => !item.caption?.trim());

  if (!dryRun) {
    await prisma.$transaction(
      missingCaptionImages.map((item) =>
        prisma.visitMarkerImage.update({
          where: {
            id: item.id,
          },
          data: {
            caption: nextCaption,
          },
        }),
      ),
    );
  }

  return {
    issueId,
    issueType: 'photo_missing_caption',
    targetKind: 'photo',
    targetId: photoId,
    repairable: true,
    status: dryRun ? 'preview' : 'applied',
    title: '自动补充照片说明',
    description:
      missingCaptionImages.length > 1
        ? `将为同一条记录下 ${missingCaptionImages.length} 张缺说明照片补充说明。`
        : '将使用照片所属记录的地区与城市生成说明。',
    changes: missingCaptionImages.map((item, index) => ({
      field: missingCaptionImages.length > 1 ? `caption #${index + 1}` : 'caption',
      before: item.caption?.trim() ? item.caption : null,
      after: nextCaption,
    })),
    appliedAt: dryRun ? undefined : new Date().toISOString(),
  };
}

async function repairMarkerUnassignedTrip(
  issueId: string,
  markerId: string,
  dryRun: boolean,
): Promise<AdminQualityAutoFixResultDto> {
  const prisma = getPrismaClient();
  const marker = await prisma.visitMarker.findFirst({
    where: {
      id: markerId,
      isDeleted: false,
    },
  });

  if (!marker) {
    return createNotRepairableResult(issueId, 'marker_unassigned_trip', 'marker', markerId, '目标记录不存在或已删除。');
  }

  if (marker.tripId) {
    return {
      issueId,
      issueType: 'marker_unassigned_trip',
      targetKind: 'marker',
      targetId: markerId,
      repairable: false,
      status: 'already_resolved',
      title: '记录已归入行程',
      description: '该记录已经有归属行程，无需修复。',
      changes: [],
    };
  }

  const trips = await prisma.trip.findMany({
    where: {
      accountId: marker.accountId,
      isDeleted: false,
    },
    orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
  });
  const containingTrips = trips.filter(
    (trip) => trip.startsAt.getTime() <= marker.visitedStartAt.getTime() && trip.endsAt.getTime() >= marker.visitedStartAt.getTime(),
  );
  const candidateTrip =
    containingTrips[0] ??
    [...trips].sort((left, right) => {
      const leftDistance = Math.abs(left.startsAt.getTime() - marker.visitedStartAt.getTime());
      const rightDistance = Math.abs(right.startsAt.getTime() - marker.visitedStartAt.getTime());
      return leftDistance - rightDistance;
    })[0];

  if (!candidateTrip) {
    return createNotRepairableResult(issueId, 'marker_unassigned_trip', 'marker', markerId, '当前账号下没有可归入的行程。');
  }

  if (!dryRun) {
    await prisma.visitMarker.update({
      where: {
        id: markerId,
      },
      data: {
        tripId: candidateTrip.id,
      },
    });
  }

  return {
    issueId,
    issueType: 'marker_unassigned_trip',
    targetKind: 'marker',
    targetId: markerId,
    repairable: true,
    status: dryRun ? 'preview' : 'applied',
    title: '自动归入行程',
    description: `将 ${marker.scopeName} · ${marker.city} 归入 ${candidateTrip.name}。`,
    changes: [
      {
        field: 'tripId',
        before: null,
        after: candidateTrip.id,
      },
    ],
    appliedAt: dryRun ? undefined : new Date().toISOString(),
  };
}

async function repairPlanningOverdue(
  issueId: string,
  planningItemId: string,
  dryRun: boolean,
): Promise<AdminQualityAutoFixResultDto> {
  const prisma = getPrismaClient();
  const item = await prisma.tripPlanningItem.findFirst({
    where: {
      id: planningItemId,
      isDeleted: false,
    },
  });

  if (!item) {
    return createNotRepairableResult(issueId, 'planning_overdue', 'planningItem', planningItemId, '目标规划不存在或已删除。');
  }

  const now = new Date();
  if (item.status !== 'planned' || !item.plannedDate || item.plannedDate.getTime() >= now.getTime()) {
    return {
      issueId,
      issueType: 'planning_overdue',
      targetKind: 'planningItem',
      targetId: planningItemId,
      repairable: false,
      status: 'already_resolved',
      title: '行前规划已处理',
      description: '该规划已转换或日期未过期，无需修复。',
      changes: [],
    };
  }

  const nextPlannedDate = addDays(now, 7);
  if (!dryRun) {
    await prisma.tripPlanningItem.update({
      where: {
        id: planningItemId,
      },
      data: {
        plannedDate: nextPlannedDate,
      },
    });
  }

  return {
    issueId,
    issueType: 'planning_overdue',
    targetKind: 'planningItem',
    targetId: planningItemId,
    repairable: true,
    status: dryRun ? 'preview' : 'applied',
    title: '顺延规划日期',
    description: `将 ${item.title} 的预计日期顺延到 7 天后。`,
    changes: [
      {
        field: 'plannedDate',
        before: item.plannedDate.toISOString(),
        after: nextPlannedDate.toISOString(),
      },
    ],
    appliedAt: dryRun ? undefined : new Date().toISOString(),
  };
}

async function repairGuideSourceDegraded(
  issueId: string,
  sourceId: string,
  dryRun: boolean,
): Promise<AdminQualityAutoFixResultDto> {
  const prisma = getPrismaClient();
  const source = await prisma.guideSourceHealth.findUnique({
    where: {
      id: sourceId,
    },
  });

  if (!source) {
    return createNotRepairableResult(issueId, 'guide_source_degraded', 'guideSource', sourceId, '目标攻略来源不存在。');
  }

  if (source.recentFailure === 0 && !source.lastFailureReason) {
    return {
      issueId,
      issueType: 'guide_source_degraded',
      targetKind: 'guideSource',
      targetId: sourceId,
      repairable: false,
      status: 'already_resolved',
      title: '来源健康已恢复',
      description: '该来源没有待处理失败计数，无需修复。',
      changes: [],
    };
  }

  if (!dryRun) {
    await prisma.guideSourceHealth.update({
      where: {
        id: sourceId,
      },
      data: {
        recentFailure: 0,
        lastFailureAt: null,
        lastFailureReason: null,
      },
    });
  }

  return {
    issueId,
    issueType: 'guide_source_degraded',
    targetKind: 'guideSource',
    targetId: sourceId,
    repairable: true,
    status: dryRun ? 'preview' : 'applied',
    title: '重置来源健康',
    description: `确认 ${source.sourceName} 已排障后，将清空失败计数与失败原因。`,
    changes: [
      {
        field: 'recentFailure',
        before: String(source.recentFailure),
        after: '0',
      },
      {
        field: 'lastFailureReason',
        before: source.lastFailureReason,
        after: null,
      },
    ],
    appliedAt: dryRun ? undefined : new Date().toISOString(),
  };
}

async function repairCompanionMemorySnapshotStale(
  issueId: string,
  targetId: string,
  dryRun: boolean,
): Promise<AdminQualityAutoFixResultDto> {
  const [accountId, companionId] = targetId.split(':');
  if (!accountId || !companionId) {
    return createNotRepairableResult(issueId, 'companion_memory_snapshot_stale', 'snapshot', targetId, '快照问题缺少账号或旅伴定位。');
  }

  const prisma = getPrismaClient();
  const snapshot = await prisma.companionMemorySnapshot.findUnique({
    where: {
      accountId_companionId: {
        accountId,
        companionId,
      },
    },
  });
  const companion = await prisma.travelCompanion.findFirst({
    where: {
      id: companionId,
      accountId,
      isDeleted: false,
    },
  });

  if (!companion) {
    return createNotRepairableResult(issueId, 'companion_memory_snapshot_stale', 'snapshot', targetId, '目标旅伴不存在或已删除。');
  }

  const nextExpiresAt = addDays(new Date(), 1);
  if (dryRun) {
    return {
      issueId,
      issueType: 'companion_memory_snapshot_stale',
      targetKind: 'snapshot',
      targetId: snapshot?.id ?? targetId,
      repairable: true,
      status: 'preview',
      title: '刷新回忆快照',
      description: `将重新生成 ${companion.name} 的旅伴回忆快照。`,
      changes: [
        {
          field: 'expiresAt',
          before: toNullableString(snapshot?.expiresAt),
          after: nextExpiresAt.toISOString(),
        },
      ],
    };
  }

  const response = await refreshCompanionMemory(accountId, companionId);
  return {
    issueId,
    issueType: 'companion_memory_snapshot_stale',
    targetKind: 'snapshot',
    targetId: snapshot?.id ?? targetId,
    repairable: true,
    status: 'applied',
    title: '刷新回忆快照',
    description: `已重新生成 ${companion.name} 的旅伴回忆快照。`,
    changes: [
      {
        field: 'sourceMarkerCount',
        before: toNullableString(snapshot?.sourceMarkerCount),
        after: String(response.snapshot.sourceMarkerCount),
      },
      {
        field: 'sourcePhotoCount',
        before: toNullableString(snapshot?.sourcePhotoCount),
        after: String(response.snapshot.sourcePhotoCount),
      },
      {
        field: 'sourceGuideCount',
        before: toNullableString(snapshot?.sourceGuideCount),
        after: String(response.snapshot.sourceGuideCount),
      },
      {
        field: 'expiresAt',
        before: toNullableString(snapshot?.expiresAt),
        after: response.snapshot.expiresAt,
      },
    ],
    appliedAt: new Date().toISOString(),
  };
}

export async function repairAdminQualityIssue({
  issueId,
  dryRun = true,
}: RepairAdminQualityIssueInput): Promise<AdminQualityAutoFixResultDto> {
  const parsed = parseIssueId(issueId);
  if (!parsed || !SUPPORTED_AUTO_FIX_TYPES.has(parsed.type as SupportedAutoFixType)) {
    return createNotRepairableResult(
      issueId,
      parsed?.type ?? 'guide_search_error_spike',
      'snapshot',
      parsed?.targetId,
      '该问题类型不在可选自动修复白名单中。',
    );
  }

  if (parsed.type === 'trip_missing_cover') {
    return repairTripMissingCover(issueId, parsed.targetId, dryRun);
  }

  if (parsed.type === 'photo_missing_caption') {
    return repairPhotoMissingCaption(issueId, parsed.targetId, dryRun);
  }

  if (parsed.type === 'marker_unassigned_trip') {
    return repairMarkerUnassignedTrip(issueId, parsed.targetId, dryRun);
  }

  if (parsed.type === 'planning_overdue') {
    return repairPlanningOverdue(issueId, parsed.targetId, dryRun);
  }

  if (parsed.type === 'guide_source_degraded') {
    return repairGuideSourceDegraded(issueId, parsed.targetId, dryRun);
  }

  return repairCompanionMemorySnapshotStale(issueId, parsed.targetId, dryRun);
}
