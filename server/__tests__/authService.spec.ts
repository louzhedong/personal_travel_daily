// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  findAccountByUsernameMock: vi.fn(),
  createAccountMock: vi.fn(),
  createInitialAccountStateMock: vi.fn(),
  createAuthSessionMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
  createSessionTokenMock: vi.fn(),
  getSessionExpiresAtMock: vi.fn(),
  hashSessionTokenMock: vi.fn(),
  deleteAuthSessionByTokenHashMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/accountRepository.js', () => ({
  findAccountByUsername: mocks.findAccountByUsernameMock,
  createAccount: mocks.createAccountMock,
}));

vi.mock('../appApi/services/appContextService.js', () => ({
  createInitialAccountState: mocks.createInitialAccountStateMock,
}));

vi.mock('../appApi/repositories/authSessionRepository.js', () => ({
  createAuthSession: mocks.createAuthSessionMock,
  deleteAuthSessionByTokenHash: mocks.deleteAuthSessionByTokenHashMock,
}));

vi.mock('../appApi/auth/password.js', () => ({
  hashPassword: mocks.hashPasswordMock,
  verifyPassword: mocks.verifyPasswordMock,
}));

vi.mock('../appApi/auth/session.js', () => ({
  createSessionToken: mocks.createSessionTokenMock,
  getSessionExpiresAt: mocks.getSessionExpiresAtMock,
  hashSessionToken: mocks.hashSessionTokenMock,
}));

import { registerAccount } from '../appApi/services/authService.js';

describe('authService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('creates a single default companion using the registration nickname', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: async (callback: (tx: object) => Promise<unknown>) => callback(tx),
    });
    mocks.findAccountByUsernameMock.mockResolvedValue(null);
    mocks.hashPasswordMock.mockResolvedValue('hashed-password');
    mocks.createAccountMock.mockResolvedValue({
      id: 'acct-2',
      name: '小明的旅行档案',
      username: 'xiaoming',
      role: 'member',
    });
    mocks.createInitialAccountStateMock.mockResolvedValue(undefined);
    mocks.createSessionTokenMock.mockReturnValue('session-token');
    mocks.getSessionExpiresAtMock.mockReturnValue(new Date('2026-05-01T00:00:00.000Z'));
    mocks.hashSessionTokenMock.mockReturnValue('hashed-token');
    mocks.createAuthSessionMock.mockResolvedValue(undefined);

    await registerAccount({
      nickname: '小明的旅行档案',
      username: 'xiaoming',
      password: 'demo123456',
    });

    expect(mocks.createInitialAccountStateMock).toHaveBeenCalledWith(
      tx,
      'acct-2',
      {
        primaryCompanionName: '小明的旅行档案',
        singleCompanion: true,
      },
    );
  });
});
