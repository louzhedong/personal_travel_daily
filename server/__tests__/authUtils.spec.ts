// @vitest-environment node

import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  deleteExpiredAuthSessionsMock: vi.fn(),
  findAuthSessionByTokenHashMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/authSessionRepository.js', () => ({
  deleteExpiredAuthSessions: mocks.deleteExpiredAuthSessionsMock,
  findAuthSessionByTokenHash: mocks.findAuthSessionByTokenHashMock,
}));

import { createForbiddenError, createUnauthorizedError } from '../appApi/errors.js';
import {
  getAuthenticatedAccount,
  requireAdminAccount,
  requireAuthenticatedAccount,
} from '../appApi/auth/requestAuth.js';
import { hashPassword, verifyPassword } from '../appApi/auth/password.js';
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
  readCookieValue,
  serializeSessionCookie,
  serializeSessionCookieClear,
} from '../appApi/auth/session.js';

describe('auth utilities', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('hashes and verifies passwords, including invalid hash branches', async () => {
    const hash = await hashPassword('super-secret');
    expect(hash).toContain(':');
    await expect(verifyPassword('super-secret', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-secret', hash)).resolves.toBe(false);
    await expect(verifyPassword('super-secret', 'invalid-format')).resolves.toBe(false);
    await expect(verifyPassword('super-secret', 'salt:abcd')).resolves.toBe(false);
  });

  it('creates, hashes, serializes, clears, and reads session cookies', () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThan(10);
    expect(hashSessionToken('abc')).toBe(createHash('sha256').update('abc').digest('hex'));

    const expiresAt = getSessionExpiresAt(new Date('2026-04-01T00:00:00.000Z'));
    expect(expiresAt.toISOString()).toBe('2026-04-08T00:00:00.000Z');

    const serialized = serializeSessionCookie('token value', expiresAt);
    expect(serialized).toContain(`${SESSION_COOKIE_NAME}=token%20value`);
    expect(serializeSessionCookieClear()).toContain(`${SESSION_COOKIE_NAME}=;`);

    expect(readCookieValue(`${SESSION_COOKIE_NAME}=token%20value; theme=dark`, SESSION_COOKIE_NAME)).toBe(
      'token value',
    );
    expect(readCookieValue(undefined, SESSION_COOKIE_NAME)).toBeNull();
    expect(readCookieValue('theme=dark', SESSION_COOKIE_NAME)).toBeNull();
  });

  it('returns null when no valid authenticated session exists', async () => {
    const prisma = {};
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    await expect(getAuthenticatedAccount({ headers: {} } as never)).resolves.toBeNull();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T00:00:00.000Z'));
    mocks.findAuthSessionByTokenHashMock.mockResolvedValueOnce(null);
    await expect(
      getAuthenticatedAccount({
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=plain-token`,
        },
      } as never),
    ).resolves.toBeNull();
    expect(mocks.deleteExpiredAuthSessionsMock).toHaveBeenCalledWith(prisma, new Date('2026-04-02T00:00:00.000Z'));

    mocks.findAuthSessionByTokenHashMock.mockResolvedValueOnce({
      expiresAt: new Date('2026-04-01T23:59:59.000Z'),
      account: { id: 'acct-1', name: 'Atlas', username: 'demo', role: 'member' },
    });
    await expect(
      getAuthenticatedAccount({
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=plain-token`,
        },
      } as never),
    ).resolves.toBeNull();
    vi.useRealTimers();
  });

  it('returns authenticated accounts and enforces member/admin guards', async () => {
    const prisma = {};
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.findAuthSessionByTokenHashMock.mockResolvedValue({
      expiresAt: new Date('2099-04-10T00:00:00.000Z'),
      account: { id: 'acct-1', name: 'Atlas', username: 'demo', role: 'admin' },
    });

    await expect(
      getAuthenticatedAccount({
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=plain-token`,
        },
      } as never),
    ).resolves.toEqual({
      id: 'acct-1',
      name: 'Atlas',
      username: 'demo',
      role: 'admin',
    });

    await expect(
      requireAuthenticatedAccount({
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=plain-token`,
        },
      } as never),
    ).resolves.toEqual({
      id: 'acct-1',
      name: 'Atlas',
      username: 'demo',
      role: 'admin',
    });

    mocks.findAuthSessionByTokenHashMock.mockResolvedValueOnce({
      expiresAt: new Date('2099-04-10T00:00:00.000Z'),
      account: { id: 'acct-2', name: 'Traveler', username: 'member', role: 'member' },
    });
    await expect(
      requireAdminAccount({
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=plain-token`,
        },
      } as never),
    ).rejects.toMatchObject(createForbiddenError('admin access required'));

    mocks.findAuthSessionByTokenHashMock.mockResolvedValueOnce(null);
    await expect(requireAuthenticatedAccount({ headers: {} } as never)).rejects.toMatchObject(
      createUnauthorizedError('authentication required'),
    );
  });
});
