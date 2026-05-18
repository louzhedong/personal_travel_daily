// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('reminders', () => {
  it('supports reminder routes for authenticated accounts and admins', async () => {
    const listResponsePayload = {
      reminders: [
        {
          id: 'planning_overdue:planning-1',
          fingerprint: 'planning_overdue:planning-1',
          type: 'planning_overdue',
          severity: 'warning',
          title: '行前规划已过期',
          description: '灵隐寺 的预计日期已过。',
          targetKind: 'planningItem',
          targetId: 'planning-1',
          targetLabel: '灵隐寺',
          detectedAt: '2026-05-01T00:00:00.000Z',
          suggestedAction: '进入清单确认。',
          navigation: { kind: 'tripChecklist', path: '/trips/trip-1/checklist', canNavigate: true },
          status: 'open',
        },
      ],
      preferences: [{ type: 'planning_overdue', enabled: true }],
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
    mocks.listAccountRemindersMock.mockResolvedValue(listResponsePayload);
    mocks.resolveAccountReminderMock.mockResolvedValue({ success: true, reminder: listResponsePayload.reminders[0] });
    mocks.muteAccountReminderTypeMock.mockResolvedValue({
      success: true,
      preference: { type: 'planning_overdue', enabled: true, mutedUntil: '2026-05-19T00:00:00.000Z' },
    });
    mocks.unmuteAccountReminderTypeMock.mockResolvedValue({
      success: true,
      preference: { type: 'planning_overdue', enabled: true },
    });
    mocks.getAdminReminderTrendsMock.mockResolvedValue({
      trends: [{ type: 'planning_overdue', label: '过期规划', totalCount: 1, activeCount: 1, mutedCount: 0, resolvedCount: 0, criticalCount: 0, accountCount: 1 }],
      generatedAt: '2026-05-12T00:00:00.000Z',
    });

    const app = await buildApp();
    try {
      const reminders = await app.inject({ method: 'GET', url: '/api/reminders' });
      expect(reminders.statusCode).toBe(200);
      expect(mocks.listAccountRemindersMock).toHaveBeenCalledWith(currentAccount);

      await app.inject({ method: 'POST', url: '/api/reminders/planning_overdue%3Aplanning-1/resolve' });
      expect(mocks.resolveAccountReminderMock).toHaveBeenCalledWith(currentAccount, 'planning_overdue:planning-1');

      await app.inject({
        method: 'POST',
        url: '/api/reminders/preferences/planning_overdue/mute',
        payload: { mutedUntil: '2026-05-19T00:00:00.000Z' },
      });
      expect(mocks.muteAccountReminderTypeMock).toHaveBeenCalledWith(
        currentAccount,
        'planning_overdue',
        new Date('2026-05-19T00:00:00.000Z'),
      );

      await app.inject({ method: 'DELETE', url: '/api/reminders/preferences/planning_overdue/mute' });
      expect(mocks.unmuteAccountReminderTypeMock).toHaveBeenCalledWith(currentAccount, 'planning_overdue');

      const trends = await app.inject({ method: 'GET', url: '/api/admin/reminders/trends' });
      expect(trends.statusCode).toBe(200);
      expect(mocks.getAdminReminderTrendsMock).toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
