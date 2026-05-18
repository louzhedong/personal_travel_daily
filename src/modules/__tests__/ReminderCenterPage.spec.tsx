import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchReminders,
  muteReminderType,
  resolveReminder,
  unmuteReminderType,
} from '../../lib/api/remindersApi';
import ReminderCenterPage from '../reminders/ReminderCenterPage';

vi.mock('../../lib/api/remindersApi', () => ({
  fetchReminders: vi.fn(),
  resolveReminder: vi.fn(),
  muteReminderType: vi.fn(),
  unmuteReminderType: vi.fn(),
}));

const reminderPayload = {
  reminders: [
    {
      id: 'planning_overdue:planning-1',
      fingerprint: 'planning_overdue:planning-1',
      type: 'planning_overdue' as const,
      severity: 'warning' as const,
      title: '行前规划已过期',
      description: '灵隐寺 的预计日期已过。',
      targetKind: 'planningItem',
      targetId: 'planning-1',
      targetLabel: '灵隐寺',
      detectedAt: '2026-05-01T00:00:00.000Z',
      suggestedAction: '进入清单确认。',
      navigation: { kind: 'tripChecklist' as const, path: '/trips/trip-1/checklist', canNavigate: true },
      status: 'open' as const,
    },
  ],
  preferences: [{ type: 'planning_overdue' as const, enabled: true }],
  summary: {
    totalCount: 1,
    activeCount: 1,
    mutedCount: 0,
    resolvedCount: 0,
    criticalCount: 0,
    warningCount: 1,
    infoCount: 0,
  },
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('ReminderCenterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchReminders).mockResolvedValue(reminderPayload);
    vi.mocked(resolveReminder).mockResolvedValue({ success: true });
    vi.mocked(muteReminderType).mockResolvedValue({
      success: true,
      preference: { type: 'planning_overdue', enabled: true, mutedUntil: '2026-05-19T00:00:00.000Z' },
    });
    vi.mocked(unmuteReminderType).mockResolvedValue({ success: true });
  });

  it('renders reminders and supports navigation plus resolving', async () => {
    const user = userEvent.setup();
    const onNavigateToPath = vi.fn();
    render(
      <ReminderCenterPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' }}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
        onNavigateToPath={onNavigateToPath}
      />,
    );

    expect(await screen.findByRole('heading', { name: '低打扰旅行运营提醒' })).toBeInTheDocument();
    expect(screen.getByText('行前规划已过期')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '跳转定位' }));
    expect(onNavigateToPath).toHaveBeenCalledWith('/trips/trip-1/checklist');

    await user.click(screen.getByRole('button', { name: '标记已处理' }));
    expect(resolveReminder).toHaveBeenCalledWith('planning_overdue:planning-1');
  });

  it('toggles reminder type mute from the preference list', async () => {
    const user = userEvent.setup();
    render(
      <ReminderCenterPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' }}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
        onNavigateToPath={vi.fn()}
      />,
    );

    await screen.findByText('类型静音');
    await user.click(screen.getByRole('button', { name: /过期规划/ }));
    expect(muteReminderType).toHaveBeenCalledWith('planning_overdue');
  });
});
