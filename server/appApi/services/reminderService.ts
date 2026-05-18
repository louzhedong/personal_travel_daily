import { randomUUID } from 'node:crypto';
import type { AuthSession, GuideSourceHealth, ReminderPreference, ReminderState } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  ReminderActionResponseDto,
  ReminderAdminTrendsResponseDto,
  ReminderDto,
  ReminderListResponseDto,
  ReminderPreferenceDto,
  ReminderTypeDto,
} from '../types.js';
import {
  getReminderSourceAccount,
  listGuideSourceHealthForReminders,
  listRecentGuideSearchStatus,
  listReminderPreferences,
  listReminderStates,
  resolveReminderState,
  upsertReminderPreference,
  upsertReminderState,
} from '../repositories/reminderRepository.js';
import {
  buildReminderSummary,
  serializeReminder,
  serializeReminderPreference,
  type GeneratedReminder,
} from '../serializers/reminderSerializer.js';

const REMINDER_TYPES: ReminderTypeDto[] = [
  'planning_overdue',
  'trip_missing_cover',
  'photo_missing_caption',
  'anomalous_login',
  'guide_source_degraded',
  'guide_search_error_spike',
  'companion_memory_snapshot_stale',
];

const REMINDER_LABELS: Record<ReminderTypeDto, string> = {
  planning_overdue: '过期规划',
  trip_missing_cover: '行程缺封面',
  photo_missing_caption: '照片缺说明',
  anomalous_login: '登录异常',
  guide_source_degraded: '攻略来源异常',
  guide_search_error_spike: '搜索失败升高',
  companion_memory_snapshot_stale: '回忆快照过期',
};

const GUIDE_SEARCH_ERROR_SPIKE_THRESHOLD = 3;

type ReminderSourceAccount = NonNullable<Awaited<ReturnType<typeof getReminderSourceAccount>>>;

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildPath(kind: GeneratedReminder['navigation']['kind'], payload: Record<string, string | number | undefined>) {
  if (kind === 'tripDetail' && payload.tripId) return `/trips/${encodeURIComponent(String(payload.tripId))}`;
  if (kind === 'tripChecklist' && payload.tripId) return `/trips/${encodeURIComponent(String(payload.tripId))}/checklist`;
  if (kind === 'photoCuration') {
    const params = new URLSearchParams();
    if (payload.tripId) params.set('tripId', String(payload.tripId));
    if (payload.companionId) params.set('companionId', String(payload.companionId));
    if (payload.year) params.set('year', String(payload.year));
    const query = params.toString();
    return query ? `/photos?${query}` : '/photos';
  }
  if (kind === 'companionMemories' && payload.companionId) {
    return `/companions/${encodeURIComponent(String(payload.companionId))}/memories`;
  }
  if (kind === 'settings') return '/settings';
  return undefined;
}

function createNavigation(kind: GeneratedReminder['navigation']['kind'], payload: Record<string, string | number | undefined> = {}) {
  const path = buildPath(kind, payload);
  return {
    kind,
    payload,
    path,
    canNavigate: !!path,
  };
}

function generateAccountReminders(account: ReminderSourceAccount, now: Date): GeneratedReminder[] {
  const reminders: GeneratedReminder[] = [];

  for (const trip of account.trips) {
    if (!trip.coverImageUrl) {
      reminders.push({
        fingerprint: `trip_missing_cover:${trip.id}`,
        type: 'trip_missing_cover',
        severity: 'info',
        title: '行程缺少封面',
        description: `${trip.name} 还没有设置封面图。`,
        targetKind: 'trip',
        targetId: trip.id,
        targetLabel: trip.name,
        detectedAt: normalizeDate(trip.updatedAt) ?? now,
        suggestedAction: '进入行程详情，选择一张代表性照片作为封面。',
        navigation: createNavigation('tripDetail', { tripId: trip.id }),
      });
    }

    for (const item of trip.planningItems) {
      const plannedDate = normalizeDate(item.plannedDate);
      if (item.status === 'planned' && plannedDate && plannedDate.getTime() < now.getTime()) {
        reminders.push({
          fingerprint: `planning_overdue:${item.id}`,
          type: 'planning_overdue',
          severity: 'warning',
          title: '行前规划已过期',
          description: `${item.title} 的预计日期已过，但仍未转为旅行记录。`,
          targetKind: 'planningItem',
          targetId: item.id,
          targetLabel: item.title,
          detectedAt: plannedDate,
          suggestedAction: '进入清单确认是否转为记录，或顺延规划日期。',
          navigation: createNavigation('tripChecklist', { tripId: trip.id }),
        });
      }
    }

    for (const marker of trip.markers) {
      for (const image of marker.images) {
        if (!image.caption?.trim()) {
          reminders.push({
            fingerprint: `photo_missing_caption:${image.id}`,
            type: 'photo_missing_caption',
            severity: 'info',
            title: '照片缺少说明',
            description: `${marker.scopeName} · ${marker.city} 有照片还没有说明。`,
            targetKind: 'photo',
            targetId: image.id,
            targetLabel: `${marker.scopeName} · ${marker.city}`,
            detectedAt: normalizeDate(image.createdAt) ?? normalizeDate(marker.createdAt) ?? now,
            suggestedAction: '进入影像整理台补充照片说明。',
            navigation: createNavigation('photoCuration', { tripId: trip.id, photoId: image.id }),
          });
        }
      }
    }
  }

  const recentSession = account.sessions.find((session) => isSessionAnomalous(session, now));
  if (recentSession) {
    reminders.push({
      fingerprint: `anomalous_login:${recentSession.id}`,
      type: 'anomalous_login',
      severity: 'warning',
      title: '近期有新的活跃登录',
      description: `${recentSession.ipAddress ?? '未知 IP'} · ${(recentSession.userAgent ?? '未知浏览器').slice(0, 80)}`,
      targetKind: 'session',
      targetId: recentSession.id,
      targetLabel: recentSession.ipAddress ?? '未知 IP',
      detectedAt: recentSession.lastSeenAt,
      suggestedAction: '进入账号设置核对设备，不认识的设备请退出会话并修改密码。',
      navigation: createNavigation('settings'),
    });
  }

  for (const companion of account.companions) {
    for (const snapshot of companion.memorySnapshots) {
      if (snapshot.expiresAt.getTime() < now.getTime()) {
        reminders.push({
          fingerprint: `companion_memory_snapshot_stale:${companion.id}`,
          type: 'companion_memory_snapshot_stale',
          severity: 'info',
          title: '旅伴回忆快照需要刷新',
          description: `${companion.name} 的共同回忆快照已过期。`,
          targetKind: 'snapshot',
          targetId: snapshot.id,
          targetLabel: companion.name,
          detectedAt: snapshot.expiresAt,
          suggestedAction: '进入旅伴回忆页刷新快照。',
          navigation: createNavigation('companionMemories', { companionId: companion.id }),
        });
      }
    }
  }

  return reminders;
}

function isSessionAnomalous(session: AuthSession, now: Date) {
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return session.lastSeenAt.getTime() >= oneDayAgo && session.createdAt.getTime() >= sevenDaysAgo;
}

function generateGlobalReminders(
  sourceHealth: GuideSourceHealth[],
  statusBreakdown: Awaited<ReturnType<typeof listRecentGuideSearchStatus>>,
  now: Date,
): GeneratedReminder[] {
  const reminders: GeneratedReminder[] = [];

  for (const source of sourceHealth) {
    const degraded =
      source.recentFailure > source.recentSuccess ||
      (!!source.lastFailureReason && !source.lastSuccessAt);
    if (!degraded) continue;
    reminders.push({
      fingerprint: `guide_source_degraded:${source.id}`,
      type: 'guide_source_degraded',
      severity: 'critical',
      title: '攻略来源异常',
      description: `${source.sourceName} 最近失败 ${source.recentFailure} 次，成功 ${source.recentSuccess} 次。`,
      targetKind: 'guideSource',
      targetId: source.id,
      targetLabel: source.sourceName,
      detectedAt: source.lastFailureAt ?? source.updatedAt ?? now,
      suggestedAction: '管理员需要检查来源适配器或调整来源优先级。',
      navigation: createNavigation('adminOnly'),
    });
  }

  const getCount = (status: string) => statusBreakdown.find((item) => item.status === status)?._count._all ?? 0;
  const errorCount = getCount('error');
  const successCount = getCount('success');
  const emptyCount = getCount('empty');
  if (errorCount >= GUIDE_SEARCH_ERROR_SPIKE_THRESHOLD && errorCount >= successCount + emptyCount) {
    reminders.push({
      fingerprint: 'guide_search_error_spike:recent-30-days',
      type: 'guide_search_error_spike',
      severity: 'critical',
      title: '攻略搜索失败升高',
      description: `最近 30 天攻略搜索失败 ${errorCount} 次。`,
      targetKind: 'guideSource',
      targetLabel: '攻略搜索',
      detectedAt: now,
      suggestedAction: '管理员需要检查 guide-api、来源健康度和错误日志。',
      navigation: createNavigation('adminOnly'),
    });
  }

  return reminders;
}

async function generateRemindersForAccount(accountId: string, now: Date) {
  const prisma = getPrismaClient();
  const createdAtGte = new Date(now);
  createdAtGte.setDate(createdAtGte.getDate() - 30);
  const [account, sourceHealth, statusBreakdown] = await Promise.all([
    getReminderSourceAccount(prisma, accountId),
    listGuideSourceHealthForReminders(prisma),
    listRecentGuideSearchStatus(prisma, createdAtGte),
  ]);
  if (!account) {
    throw createNotFoundError('account not found');
  }
  return [...generateAccountReminders(account, now), ...generateGlobalReminders(sourceHealth, statusBreakdown, now)];
}

function mapsByKey(preferences: ReminderPreference[], states: ReminderState[]) {
  return {
    preferenceByType: new Map(preferences.map((item) => [item.type as ReminderTypeDto, item])),
    stateByFingerprint: new Map(states.map((item) => [item.fingerprint, item])),
  };
}

export async function listAccountReminders(account: AuthenticatedAccount): Promise<ReminderListResponseDto> {
  const prisma = getPrismaClient();
  const now = new Date();
  const [generated, preferences, states] = await Promise.all([
    generateRemindersForAccount(account.id, now),
    listReminderPreferences(prisma, account.id),
    listReminderStates(prisma, account.id),
  ]);
  await Promise.all(
    generated.map((reminder) =>
      upsertReminderState(prisma, {
        id: randomUUID(),
        accountId: account.id,
        fingerprint: reminder.fingerprint,
        lastSeenAt: now,
      }),
    ),
  );
  const refreshedStates = await listReminderStates(prisma, account.id);
  const { preferenceByType, stateByFingerprint } = mapsByKey(preferences, refreshedStates);
  const reminders = generated
    .map((reminder) =>
      serializeReminder(reminder, stateByFingerprint.get(reminder.fingerprint), preferenceByType.get(reminder.type)),
    )
    .sort((left, right) => new Date(right.detectedAt).getTime() - new Date(left.detectedAt).getTime());
  const serializedPreferences = REMINDER_TYPES.map((type) => serializeReminderPreference(type, preferenceByType.get(type)));
  return {
    reminders,
    preferences: serializedPreferences,
    summary: buildReminderSummary(reminders, now),
    generatedAt: now.toISOString(),
  };
}

export async function resolveAccountReminder(
  account: AuthenticatedAccount,
  fingerprint: string,
): Promise<ReminderActionResponseDto> {
  const prisma = getPrismaClient();
  const now = new Date();
  await resolveReminderState(prisma, {
    id: randomUUID(),
    accountId: account.id,
    fingerprint,
    resolvedAt: now,
  });
  const response = await listAccountReminders(account);
  return {
    success: true,
    reminder: response.reminders.find((item) => item.fingerprint === fingerprint),
  };
}

export async function muteAccountReminderType(
  account: AuthenticatedAccount,
  type: ReminderTypeDto,
  mutedUntil?: Date,
): Promise<ReminderActionResponseDto> {
  const prisma = getPrismaClient();
  const fallbackMutedUntil = new Date();
  fallbackMutedUntil.setDate(fallbackMutedUntil.getDate() + 7);
  const preference = await upsertReminderPreference(prisma, {
    id: randomUUID(),
    accountId: account.id,
    type,
    enabled: true,
    mutedUntil: mutedUntil ?? fallbackMutedUntil,
  });
  return {
    success: true,
    preference: serializeReminderPreference(type, preference),
  };
}

export async function unmuteAccountReminderType(
  account: AuthenticatedAccount,
  type: ReminderTypeDto,
): Promise<ReminderActionResponseDto> {
  const prisma = getPrismaClient();
  const preference = await upsertReminderPreference(prisma, {
    id: randomUUID(),
    accountId: account.id,
    type,
    enabled: true,
    mutedUntil: null,
  });
  return {
    success: true,
    preference: serializeReminderPreference(type, preference),
  };
}

export async function getAdminReminderTrends(): Promise<ReminderAdminTrendsResponseDto> {
  const prisma = getPrismaClient();
  const now = new Date();
  const accounts = await prisma.account.findMany({ select: { id: true } });
  const lists = await Promise.all(accounts.map((account) => listAccountReminders({ id: account.id, name: '', username: '', role: 'member' })));
  const rows = new Map<ReminderTypeDto, ReminderDto[]>();
  for (const type of REMINDER_TYPES) rows.set(type, []);
  for (const list of lists) {
    for (const reminder of list.reminders) {
      rows.get(reminder.type)?.push(reminder);
    }
  }
  return {
    trends: REMINDER_TYPES.map((type) => {
      const reminders = rows.get(type) ?? [];
      const active = reminders.filter((item) => item.status !== 'resolved' && !item.mutedUntil && !item.typeMutedUntil);
      return {
        type,
        label: REMINDER_LABELS[type],
        totalCount: reminders.length,
        activeCount: active.length,
        mutedCount: reminders.filter((item) => item.status !== 'resolved' && (item.mutedUntil || item.typeMutedUntil)).length,
        resolvedCount: reminders.filter((item) => item.status === 'resolved').length,
        criticalCount: reminders.filter((item) => item.severity === 'critical' && item.status !== 'resolved').length,
        accountCount: new Set(reminders.map((item) => item.id.split(':').slice(1).join(':')).filter(Boolean)).size,
      };
    }).filter((item) => item.totalCount > 0),
    generatedAt: now.toISOString(),
  };
}

export function getReminderTypeLabels() {
  return REMINDER_LABELS;
}

export function getReminderDefaultPreferences(): ReminderPreferenceDto[] {
  return REMINDER_TYPES.map((type) => serializeReminderPreference(type));
}
