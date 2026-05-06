// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  listAdminOverviewAccountsMock: vi.fn(),
  listRecentGuideSearchLogsMock: vi.fn(),
  aggregateGuideSearchStatusBreakdownMock: vi.fn(),
  listGuideSourceHealthSnapshotMock: vi.fn(),
  serializeAdminOverviewMock: vi.fn(),
  serializeGuideSearchTrendsMock: vi.fn(),
  serializeGuideSearchStatusBreakdownMock: vi.fn(),
  serializeGuideSourceHealthSnapshotMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/adminOverviewRepository.js', () => ({
  listAdminOverviewAccounts: mocks.listAdminOverviewAccountsMock,
}));

vi.mock('../appApi/repositories/guideSearchLogRepository.js', () => ({
  listRecentGuideSearchLogs: mocks.listRecentGuideSearchLogsMock,
  aggregateGuideSearchStatusBreakdown: mocks.aggregateGuideSearchStatusBreakdownMock,
}));

vi.mock('../appApi/repositories/guideSourceHealthRepository.js', () => ({
  listGuideSourceHealthSnapshot: mocks.listGuideSourceHealthSnapshotMock,
}));

vi.mock('../appApi/serializers/adminSerializer.js', () => ({
  serializeAdminOverview: mocks.serializeAdminOverviewMock,
  serializeGuideSearchTrends: mocks.serializeGuideSearchTrendsMock,
  serializeGuideSearchStatusBreakdown: mocks.serializeGuideSearchStatusBreakdownMock,
  serializeGuideSourceHealthSnapshot: mocks.serializeGuideSourceHealthSnapshotMock,
}));

import { getAdminOverview } from '../appApi/services/adminService.js';

describe('adminService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('loads admin overview accounts and serializes them', async () => {
    const prisma = { prisma: true };
    const accounts = [{ id: 'acct-1' }];
    const logs = [{ id: 'log-1' }];
    const statusBreakdown = [{ status: 'success', _count: { _all: 3 } }];
    const sourceHealth = [{ id: 'health-1' }];
    const serialized = { accounts: [{ id: 'acct-1' }], meta: { accountCount: 1 } };
    const serializedTrends = [{ date: '2026-05-06', totalCount: 3 }];
    const serializedStatus = [{ status: 'success', count: 3 }];
    const serializedHealth = [{ id: 'health-1', sourceName: 'Qyer', sourceDomain: 'qyer.com' }];

    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listAdminOverviewAccountsMock.mockResolvedValue(accounts);
    mocks.listRecentGuideSearchLogsMock.mockResolvedValue(logs);
    mocks.aggregateGuideSearchStatusBreakdownMock.mockResolvedValue(statusBreakdown);
    mocks.listGuideSourceHealthSnapshotMock.mockResolvedValue(sourceHealth);
    mocks.serializeAdminOverviewMock.mockReturnValue(serialized);
    mocks.serializeGuideSearchTrendsMock.mockReturnValue(serializedTrends);
    mocks.serializeGuideSearchStatusBreakdownMock.mockReturnValue(serializedStatus);
    mocks.serializeGuideSourceHealthSnapshotMock.mockReturnValue(serializedHealth);

    const result = await getAdminOverview();

    expect(mocks.listAdminOverviewAccountsMock).toHaveBeenCalledWith(prisma);
    expect(mocks.serializeAdminOverviewMock).toHaveBeenCalledWith(accounts);
    expect(mocks.serializeGuideSearchTrendsMock).toHaveBeenCalledWith(logs);
    expect(mocks.serializeGuideSearchStatusBreakdownMock).toHaveBeenCalledWith(statusBreakdown);
    expect(mocks.serializeGuideSourceHealthSnapshotMock).toHaveBeenCalledWith(sourceHealth);
    expect(result).toEqual({
      ...serialized,
      guideSearchTrends: serializedTrends,
      guideSearchStatusBreakdown: serializedStatus,
      guideSourceHealth: serializedHealth,
    });
  });
});
