// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('smoke', () => {
  it('returns bootstrap payload from the app bootstrap route', async () => {
    mocks.getBootstrapPayloadMock.mockResolvedValue({
      store: {
        users: [{ id: 'user-alice', name: '小悠', color: '#2563eb' }],
        markers: [],
        activeUserId: 'user-alice',
        savedGuides: [],
        guideSearchHistory: [],
      },
      meta: {
        accountId: 'acct-1',
        account: currentAccount,
        fetchedAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/app/bootstrap',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().meta.account.username).toBe('demo');
      expect(mocks.getBootstrapPayloadMock).toHaveBeenCalledWith(currentAccount);
    } finally {
      await app.close();
    }
  });

  it('returns the current session account when logged in', async () => {
    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        account: currentAccount,
      });
    } finally {
      await app.close();
    }
  });
});
