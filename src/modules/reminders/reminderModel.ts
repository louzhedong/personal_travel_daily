import type { ReminderDto, ReminderPreferenceDto, ReminderSeverityDto, ReminderTypeDto } from '../../lib/api/types';

export const REMINDER_TYPE_LABELS: Record<ReminderTypeDto, string> = {
  planning_overdue: '过期规划',
  trip_missing_cover: '行程缺封面',
  photo_missing_caption: '照片缺说明',
  anomalous_login: '登录异常',
  guide_source_degraded: '攻略来源异常',
  guide_search_error_spike: '搜索失败升高',
  companion_memory_snapshot_stale: '回忆快照过期',
};

export const REMINDER_SEVERITY_LABELS: Record<ReminderSeverityDto, string> = {
  critical: '严重',
  warning: '提醒',
  info: '提示',
};

export function formatReminderDate(value?: string) {
  if (!value) return '未设置';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isReminderMuted(reminder: ReminderDto, now = new Date()) {
  const mutedUntil = reminder.mutedUntil ?? reminder.typeMutedUntil;
  if (!mutedUntil) return false;
  const date = new Date(mutedUntil);
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime();
}

export function getReminderStatusLabel(reminder: ReminderDto) {
  if (reminder.status === 'resolved') return '已处理';
  if (isReminderMuted(reminder)) return '已静音';
  return '待处理';
}

export function getReminderPreferenceLabel(preference: ReminderPreferenceDto) {
  if (!preference.mutedUntil) return '未静音';
  return `静音至 ${formatReminderDate(preference.mutedUntil)}`;
}

export function sortReminders(reminders: ReminderDto[]) {
  const severityRank: Record<ReminderSeverityDto, number> = { critical: 0, warning: 1, info: 2 };
  return [...reminders].sort((left, right) => {
    const statusDiff = Number(left.status === 'resolved') - Number(right.status === 'resolved');
    if (statusDiff !== 0) return statusDiff;
    const severityDiff = severityRank[left.severity] - severityRank[right.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(right.detectedAt).getTime() - new Date(left.detectedAt).getTime();
  });
}
