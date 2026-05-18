import { describe, expect, it } from 'vitest';
import type { ReminderDto } from '../../lib/api/types';
import { getReminderStatusLabel, isReminderMuted, sortReminders } from '../reminders/reminderModel';

const baseReminder: ReminderDto = {
  id: 'reminder-1',
  fingerprint: 'planning_overdue:planning-1',
  type: 'planning_overdue',
  severity: 'warning',
  title: '行前规划已过期',
  description: '预计日期已过。',
  targetKind: 'planningItem',
  targetLabel: '灵隐寺',
  detectedAt: '2026-05-01T00:00:00.000Z',
  suggestedAction: '进入清单确认。',
  navigation: { kind: 'tripChecklist', canNavigate: true, path: '/trips/trip-1/checklist' },
  status: 'open',
};

describe('reminderModel', () => {
  it('detects muted reminders and labels their status', () => {
    const muted = { ...baseReminder, mutedUntil: '2026-05-20T00:00:00.000Z' };

    expect(isReminderMuted(muted, new Date('2026-05-12T00:00:00.000Z'))).toBe(true);
    expect(getReminderStatusLabel(muted)).toBe('已静音');
    expect(getReminderStatusLabel({ ...baseReminder, status: 'resolved' })).toBe('已处理');
  });

  it('sorts open critical reminders before resolved items', () => {
    const items = sortReminders([
      { ...baseReminder, fingerprint: 'resolved', id: 'resolved', status: 'resolved', severity: 'critical' },
      { ...baseReminder, fingerprint: 'critical', id: 'critical', severity: 'critical' },
      { ...baseReminder, fingerprint: 'info', id: 'info', severity: 'info' },
    ]);

    expect(items.map((item) => item.fingerprint)).toEqual(['critical', 'info', 'resolved']);
  });
});
