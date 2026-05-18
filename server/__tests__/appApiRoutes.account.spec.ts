// @vitest-environment node

import { expect, it } from 'vitest';
import { AppApiError } from '../appApi/errors.js';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('account and auth', () => {
  it('supports account settings routes for authenticated accounts', async () => {
    mocks.getAccountSettingsMock.mockResolvedValue({
      account: currentAccount,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    });
    mocks.updateAccountProfileMock.mockResolvedValue({
      account: { ...currentAccount, name: '新昵称' },
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    });
    mocks.changeAccountPasswordMock.mockResolvedValue({ success: true });
    mocks.listAccountSessionsMock.mockResolvedValue({
      sessions: [
        {
          id: 'session-current',
          isCurrent: true,
          deviceLabel: 'Mac 浏览器',
          createdAt: '2026-05-01T00:00:00.000Z',
          lastSeenAt: '2026-05-08T00:00:00.000Z',
          expiresAt: '2026-05-15T00:00:00.000Z',
        },
      ],
    });
    mocks.revokeAccountSessionMock.mockResolvedValue({ success: true });
    mocks.logoutAllAccountSessionsMock.mockResolvedValue({ success: true });

    const app = await buildApp();
    try {
      const settingsResponse = await app.inject({ method: 'GET', url: '/api/account/settings' });
      expect(settingsResponse.statusCode).toBe(200);
      expect(mocks.getAccountSettingsMock).toHaveBeenCalledWith(currentAccount.id);

      const profileResponse = await app.inject({
        method: 'PATCH',
        url: '/api/account/profile',
        payload: { name: '新昵称' },
      });
      expect(profileResponse.statusCode).toBe(200);
      expect(mocks.updateAccountProfileMock).toHaveBeenCalledWith(currentAccount.id, { name: '新昵称' });

      const passwordResponse = await app.inject({
        method: 'PATCH',
        url: '/api/account/password',
        headers: { cookie: 'voyage_atlas_session=raw-token' },
        payload: { currentPassword: 'old-password', nextPassword: 'new-password' },
      });
      expect(passwordResponse.statusCode).toBe(200);
      expect(mocks.changeAccountPasswordMock).toHaveBeenCalledWith(currentAccount.id, 'raw-token', {
        currentPassword: 'old-password',
        nextPassword: 'new-password',
      });

      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/account/sessions',
        headers: { cookie: 'voyage_atlas_session=raw-token' },
      });
      expect(sessionsResponse.statusCode).toBe(200);
      expect(mocks.listAccountSessionsMock).toHaveBeenCalledWith(currentAccount.id, 'raw-token');

      const revokeResponse = await app.inject({
        method: 'DELETE',
        url: '/api/account/sessions/session-other',
        headers: { cookie: 'voyage_atlas_session=raw-token' },
      });
      expect(revokeResponse.statusCode).toBe(200);
      expect(mocks.revokeAccountSessionMock).toHaveBeenCalledWith(currentAccount.id, 'session-other', 'raw-token');

      const logoutAllResponse = await app.inject({
        method: 'POST',
        url: '/api/account/sessions/logout-all',
      });
      expect(logoutAllResponse.statusCode).toBe(200);
      expect(logoutAllResponse.headers['set-cookie']).toContain('voyage_atlas_session=');
      expect(mocks.logoutAllAccountSessionsMock).toHaveBeenCalledWith(currentAccount.id);
    } finally {
      await app.close();
    }
  });

  it('registers an account and writes a session cookie', async () => {
    mocks.registerAccountMock.mockResolvedValue({
      account: currentAccount,
      sessionToken: 'token',
      expiresAt: new Date('2026-04-29T00:00:00.000Z'),
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          nickname: 'Voyage Atlas',
          username: 'demo',
          password: 'demo123456',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.cookies[0]?.name).toBe('voyage_atlas_session');
      expect(mocks.registerAccountMock).toHaveBeenCalledWith(
        {
          nickname: 'Voyage Atlas',
          username: 'demo',
          password: 'demo123456',
        },
        {
          userAgent: 'lightMyRequest',
          ipAddress: '127.0.0.1',
        },
      );
    } finally {
      await app.close();
    }
  });

  it('returns UNAUTHORIZED when protected routes are accessed without a session', async () => {
    mocks.requireAuthenticatedAccountMock.mockRejectedValueOnce(
      new AppApiError('UNAUTHORIZED', 'authentication required', 401),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/saved-guides',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'authentication required',
        },
      });
    } finally {
      await app.close();
    }
  });
});
