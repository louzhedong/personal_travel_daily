// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  listAdminOverviewAccountsMock: vi.fn(),
  serializeAdminOverviewMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/adminOverviewRepository.js', () => ({
  listAdminOverviewAccounts: mocks.listAdminOverviewAccountsMock,
}));

vi.mock('../appApi/serializers/adminSerializer.js', () => ({
  serializeAdminOverview: mocks.serializeAdminOverviewMock,
}));

import { getAdminOverview } from '../appApi/services/adminService.js';

describe('adminService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('loads admin overview accounts and serializes them', async () => {
    const prisma = { prisma: true };
    const accounts = [{ id: 'acct-1' }];
    const serialized = { accounts: [{ id: 'acct-1' }], meta: { accountCount: 1 } };

    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listAdminOverviewAccountsMock.mockResolvedValue(accounts);
    mocks.serializeAdminOverviewMock.mockReturnValue(serialized);

    const result = await getAdminOverview();

    expect(mocks.listAdminOverviewAccountsMock).toHaveBeenCalledWith(prisma);
    expect(mocks.serializeAdminOverviewMock).toHaveBeenCalledWith(accounts);
    expect(result).toEqual(serialized);
  });
});
