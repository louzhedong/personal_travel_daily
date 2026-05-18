// @vitest-environment node

import { afterEach, beforeEach, describe, vi } from 'vitest';
import { getAppApiRouteMocks } from './appApiRoutes.mocks.js';

export const mocks = getAppApiRouteMocks();

export const currentAccount = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};

export function describeAppApiRoutesDomain(name: string, registerTests: () => void) {
  describe(`app api routes - ${name}`, () => {
    beforeEach(() => {
      process.env.APP_API_HOST = '127.0.0.1';
      process.env.APP_API_PORT = '8788';
      process.env.APP_API_CORS_ORIGIN = '*';
      process.env.APP_DEFAULT_ACCOUNT_ID = 'acct_default';
      process.env.APP_DEFAULT_ACCOUNT_NAME = 'Voyage Atlas';
      process.env.APP_DEFAULT_ACCOUNT_USERNAME = 'demo';
      process.env.APP_DEFAULT_ACCOUNT_PASSWORD = 'demo123456';
      process.env.DATABASE_URL = 'mysql://travel_app:travel_app_password@127.0.0.1:3306/personal_travel_daily';

      Object.values(mocks).forEach((mock) => mock.mockReset());
      mocks.requireAuthenticatedAccountMock.mockResolvedValue(currentAccount);
      mocks.requireAdminAccountMock.mockResolvedValue(currentAccount);
      mocks.getAuthenticatedAccountMock.mockResolvedValue(currentAccount);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    registerTests();
  });
}
