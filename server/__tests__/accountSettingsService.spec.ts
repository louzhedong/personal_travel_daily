// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  findAccountSettingsByIdMock: vi.fn(),
  updateAccountNameMock: vi.fn(),
  updateAccountPasswordHashMock: vi.fn(),
  listActiveAccountSessionsMock: vi.fn(),
  findAccountSessionByIdMock: vi.fn(),
  deleteAccountSessionByIdMock: vi.fn(),
  deleteAccountSessionsExceptTokenHashMock: vi.fn(),
  deleteAllAccountSessionsMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  hashSessionTokenMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/auth/password.js', () => ({
  verifyPassword: mocks.verifyPasswordMock,
  hashPassword: mocks.hashPasswordMock,
}));

vi.mock('../appApi/auth/session.js', () => ({
  hashSessionToken: mocks.hashSessionTokenMock,
}));

vi.mock('../appApi/repositories/accountSettingsRepository.js', () => ({
  findAccountSettingsById: mocks.findAccountSettingsByIdMock,
  updateAccountName: mocks.updateAccountNameMock,
  updateAccountPasswordHash: mocks.updateAccountPasswordHashMock,
  listActiveAccountSessions: mocks.listActiveAccountSessionsMock,
  findAccountSessionById: mocks.findAccountSessionByIdMock,
  deleteAccountSessionById: mocks.deleteAccountSessionByIdMock,
  deleteAccountSessionsExceptTokenHash: mocks.deleteAccountSessionsExceptTokenHashMock,
  deleteAllAccountSessions: mocks.deleteAllAccountSessionsMock,
}));

import {
  changeAccountPassword,
  getAccountSettings,
  listAccountSessions,
  logoutAllAccountSessions,
  revokeAccountSession,
  updateAccountProfile,
} from '../appApi/services/accountSettingsService.js';
import { AppApiError } from '../appApi/errors.js';

const prisma = {
  $transaction: async (callback: (tx: object) => Promise<unknown>) => callback({ tx: true }),
};

const account = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
  passwordHash: 'old-hash',
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-02T00:00:00.000Z'),
};

describe('accountSettingsService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.findAccountSettingsByIdMock.mockResolvedValue(account);
    mocks.updateAccountNameMock.mockResolvedValue({ ...account, name: '新昵称' });
    mocks.verifyPasswordMock.mockResolvedValue(true);
    mocks.hashPasswordMock.mockResolvedValue('next-hash');
    mocks.hashSessionTokenMock.mockReturnValue('current-hash');
  });

  it('returns current account settings', async () => {
    const result = await getAccountSettings('acct-1');

    expect(result).toEqual({
      account: {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'admin',
      },
      preference: {
        locale: 'zh-CN',
        mapStyle: 'magazine',
        defaultCurrency: 'CNY',
        commonCurrencies: ['CNY', 'JPY', 'USD', 'EUR'],
        exchangeRateSource: 'exchangerate-host',
      },
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    });
  });

  it('updates the account profile name', async () => {
    const result = await updateAccountProfile('acct-1', { name: ' 新昵称 ' });

    expect(mocks.updateAccountNameMock).toHaveBeenCalledWith(prisma, 'acct-1', '新昵称');
    expect(result.account.name).toBe('新昵称');
  });

  it('changes password and removes other sessions', async () => {
    await changeAccountPassword('acct-1', 'raw-token', {
      currentPassword: 'old-password',
      nextPassword: 'new-password',
    });

    expect(mocks.verifyPasswordMock).toHaveBeenCalledWith('old-password', 'old-hash');
    expect(mocks.updateAccountPasswordHashMock).toHaveBeenCalledWith({ tx: true }, 'acct-1', 'next-hash');
    expect(mocks.deleteAccountSessionsExceptTokenHashMock).toHaveBeenCalledWith(
      { tx: true },
      'acct-1',
      'current-hash',
    );
  });

  it('rejects invalid current password', async () => {
    mocks.verifyPasswordMock.mockResolvedValue(false);

    await expect(
      changeAccountPassword('acct-1', 'raw-token', {
        currentPassword: 'wrong',
        nextPassword: 'new-password',
      }),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 401, code: 'UNAUTHORIZED' });
  });

  it('lists sessions with current marker and device labels', async () => {
    mocks.listActiveAccountSessionsMock.mockResolvedValue([
      {
        id: 'session-current',
        tokenHash: 'current-hash',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        lastSeenAt: new Date('2026-05-08T00:00:00.000Z'),
        expiresAt: new Date('2026-05-15T00:00:00.000Z'),
      },
    ]);

    const result = await listAccountSessions('acct-1', 'raw-token');

    expect(result.sessions).toEqual([
      expect.objectContaining({
        id: 'session-current',
        isCurrent: true,
        deviceLabel: 'Mac 浏览器',
        ipAddress: '127.0.0.1',
      }),
    ]);
  });

  it('revokes another session but rejects current session', async () => {
    mocks.findAccountSessionByIdMock.mockResolvedValueOnce({
      id: 'session-other',
      tokenHash: 'other-hash',
    });

    await expect(revokeAccountSession('acct-1', 'session-other', 'raw-token')).resolves.toEqual({ success: true });
    expect(mocks.deleteAccountSessionByIdMock).toHaveBeenCalledWith(prisma, 'acct-1', 'session-other');

    mocks.findAccountSessionByIdMock.mockResolvedValueOnce({
      id: 'session-current',
      tokenHash: 'current-hash',
    });

    await expect(revokeAccountSession('acct-1', 'session-current', 'raw-token')).rejects.toMatchObject<AppApiError>({
      statusCode: 400,
      code: 'INVALID_REQUEST',
    });
  });

  it('logs out all sessions for the account', async () => {
    await expect(logoutAllAccountSessions('acct-1')).resolves.toEqual({ success: true });
    expect(mocks.deleteAllAccountSessionsMock).toHaveBeenCalledWith(prisma, 'acct-1');
  });
});
