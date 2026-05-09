// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  createAdminAuditLogMock: vi.fn(),
  listAdminAuditLogsMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/adminAuditRepository.js', () => ({
  createAdminAuditLog: mocks.createAdminAuditLogMock,
  listAdminAuditLogs: mocks.listAdminAuditLogsMock,
}));

import { listAdminAuditTrail, recordAdminAuditLog } from '../appApi/services/adminAuditService.js';

const createdAt = new Date('2026-05-09T00:00:00.000Z');

const auditLog = {
  id: 'audit-1',
  adminAccountId: 'acct-admin',
  action: 'quality_issue_viewed',
  targetKind: 'marker',
  targetId: 'marker-1',
  metadataJson: {
    issueId: 'issue-1',
  },
  createdAt,
  adminAccount: {
    id: 'acct-admin',
    name: 'Voyage Atlas',
  },
};

describe('adminAuditService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('records an admin audit log and serializes it', async () => {
    const prisma = { prisma: true };
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.createAdminAuditLogMock.mockResolvedValue(auditLog);

    const result = await recordAdminAuditLog('acct-admin', {
      action: 'quality_issue_viewed',
      targetKind: 'marker',
      targetId: 'marker-1',
      metadata: {
        issueId: 'issue-1',
      },
    });

    expect(mocks.createAdminAuditLogMock).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        adminAccountId: 'acct-admin',
        action: 'quality_issue_viewed',
        targetKind: 'marker',
        targetId: 'marker-1',
        metadataJson: {
          issueId: 'issue-1',
        },
      }),
    );
    expect(result).toEqual({
      id: 'audit-1',
      adminAccountId: 'acct-admin',
      adminAccountName: 'Voyage Atlas',
      action: 'quality_issue_viewed',
      targetKind: 'marker',
      targetId: 'marker-1',
      metadata: {
        issueId: 'issue-1',
      },
      createdAt: '2026-05-09T00:00:00.000Z',
    });
  });

  it('lists admin audit logs with filters', async () => {
    const prisma = { prisma: true };
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listAdminAuditLogsMock.mockResolvedValue([auditLog]);

    const result = await listAdminAuditTrail({
      action: 'quality_issue_viewed',
      targetKind: 'marker',
      limit: 20,
    });

    expect(mocks.listAdminAuditLogsMock).toHaveBeenCalledWith(prisma, {
      action: 'quality_issue_viewed',
      targetKind: 'marker',
      limit: 20,
    });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0]?.adminAccountName).toBe('Voyage Atlas');
  });
});
