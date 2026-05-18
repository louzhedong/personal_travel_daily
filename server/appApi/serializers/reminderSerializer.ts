import type { ReminderPreference, ReminderState } from '@prisma/client';
import type {
  ReminderDto,
  ReminderPreferenceDto,
  ReminderSummaryDto,
  ReminderTypeDto,
} from '../types.js';

export interface GeneratedReminder {
  fingerprint: string;
  type: ReminderTypeDto;
  severity: ReminderDto['severity'];
  title: string;
  description: string;
  targetKind: string;
  targetId?: string;
  targetLabel: string;
  detectedAt: Date;
  suggestedAction: string;
  navigation: ReminderDto['navigation'];
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function isFuture(value: Date | null | undefined, now: Date) {
  return !!value && value.getTime() > now.getTime();
}

export function serializeReminderPreference(
  type: ReminderTypeDto,
  preference?: Pick<ReminderPreference, 'enabled' | 'mutedUntil'>,
): ReminderPreferenceDto {
  return {
    type,
    enabled: preference?.enabled ?? true,
    mutedUntil: toIso(preference?.mutedUntil),
  };
}

export function serializeReminder(
  reminder: GeneratedReminder,
  state: Pick<ReminderState, 'status' | 'resolvedAt' | 'mutedUntil'> | undefined,
  preference: Pick<ReminderPreference, 'enabled' | 'mutedUntil'> | undefined,
): ReminderDto {
  return {
    id: reminder.fingerprint,
    fingerprint: reminder.fingerprint,
    type: reminder.type,
    severity: reminder.severity,
    title: reminder.title,
    description: reminder.description,
    targetKind: reminder.targetKind,
    targetId: reminder.targetId,
    targetLabel: reminder.targetLabel,
    detectedAt: reminder.detectedAt.toISOString(),
    suggestedAction: reminder.suggestedAction,
    navigation: reminder.navigation,
    status: state?.status === 'resolved' ? 'resolved' : 'open',
    resolvedAt: toIso(state?.resolvedAt),
    mutedUntil: toIso(state?.mutedUntil),
    typeMutedUntil: toIso(preference?.mutedUntil),
  };
}

export function buildReminderSummary(reminders: ReminderDto[], now: Date): ReminderSummaryDto {
  return {
    totalCount: reminders.length,
    activeCount: reminders.filter(
      (item) =>
        item.status !== 'resolved' &&
        !isFuture(item.mutedUntil ? new Date(item.mutedUntil) : undefined, now) &&
        !isFuture(item.typeMutedUntil ? new Date(item.typeMutedUntil) : undefined, now),
    ).length,
    mutedCount: reminders.filter(
      (item) =>
        item.status !== 'resolved' &&
        (isFuture(item.mutedUntil ? new Date(item.mutedUntil) : undefined, now) ||
          isFuture(item.typeMutedUntil ? new Date(item.typeMutedUntil) : undefined, now)),
    ).length,
    resolvedCount: reminders.filter((item) => item.status === 'resolved').length,
    criticalCount: reminders.filter((item) => item.severity === 'critical' && item.status !== 'resolved').length,
    warningCount: reminders.filter((item) => item.severity === 'warning' && item.status !== 'resolved').length,
    infoCount: reminders.filter((item) => item.severity === 'info' && item.status !== 'resolved').length,
  };
}
