// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  refreshCompanionMemoryMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/services/companionMemoryService.js', () => ({
  refreshCompanionMemory: mocks.refreshCompanionMemoryMock,
}));

import { repairAdminQualityIssue } from '../appApi/services/adminQualityAutoFixService.js';

describe('adminQualityAutoFixService', () => {
  beforeEach(() => {
    mocks.getPrismaClientMock.mockReset();
    mocks.refreshCompanionMemoryMock.mockReset();
  });

  it('previews and applies a trip cover generated from the first trip photo', async () => {
    const updateMock = vi.fn();
    const prisma = {
      trip: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'trip-1',
          name: '江南春游',
          coverImageUrl: null,
          markers: [
            {
              images: [
                {
                  id: 'image-1',
                  imageUrl: 'https://example.com/cover.jpg',
                },
              ],
            },
          ],
        }),
        update: updateMock,
      },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const preview = await repairAdminQualityIssue({ issueId: 'trip_missing_cover:trip-1', dryRun: true });
    const applied = await repairAdminQualityIssue({ issueId: 'trip_missing_cover:trip-1', dryRun: false });

    expect(preview).toMatchObject({
      status: 'preview',
      repairable: true,
      changes: [{ field: 'coverImageUrl', before: null, after: 'https://example.com/cover.jpg' }],
    });
    expect(applied.status).toBe('applied');
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'trip-1' },
      data: { coverImageUrl: 'https://example.com/cover.jpg' },
    });
  });

  it('previews and applies a generated photo caption', async () => {
    const updateMock = vi.fn();
    const prisma = {
      visitMarkerImage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'image-1',
          markerId: 'marker-1',
          caption: null,
          marker: {
            isDeleted: false,
            scopeName: '浙江',
            city: '杭州',
          },
        }),
        findMany: vi.fn().mockResolvedValue([
          { id: 'image-1', caption: null },
          { id: 'image-2', caption: '' },
          { id: 'image-3', caption: '已有说明' },
        ]),
        update: updateMock,
      },
      $transaction: vi.fn(async (operations) => Promise.all(operations)),
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const preview = await repairAdminQualityIssue({ issueId: 'photo_missing_caption:image-1', dryRun: true });
    const applied = await repairAdminQualityIssue({ issueId: 'photo_missing_caption:image-1', dryRun: false });

    expect(preview).toMatchObject({
      status: 'preview',
      description: '将为同一条记录下 2 张缺说明照片补充说明。',
      changes: [
        { field: 'caption #1', before: null, after: '浙江 · 杭州' },
        { field: 'caption #2', before: null, after: '浙江 · 杭州' },
      ],
    });
    expect(applied.status).toBe('applied');
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'image-1' },
      data: { caption: '浙江 · 杭州' },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'image-2' },
      data: { caption: '浙江 · 杭州' },
    });
  });

  it('previews and applies assigning an unassigned marker to the nearest trip', async () => {
    const updateMock = vi.fn();
    const prisma = {
      visitMarker: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'marker-1',
          accountId: 'acct-1',
          tripId: null,
          scopeName: '江苏',
          city: '南京',
          visitedStartAt: new Date('2026-05-02T00:00:00.000Z'),
        }),
        update: updateMock,
      },
      trip: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'trip-1',
            name: '江南春游',
            startsAt: new Date('2026-05-01T00:00:00.000Z'),
            endsAt: new Date('2026-05-05T00:00:00.000Z'),
            createdAt: new Date('2026-04-01T00:00:00.000Z'),
          },
        ]),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const preview = await repairAdminQualityIssue({ issueId: 'marker_unassigned_trip:marker-1', dryRun: true });
    const applied = await repairAdminQualityIssue({ issueId: 'marker_unassigned_trip:marker-1', dryRun: false });

    expect(preview).toMatchObject({
      status: 'preview',
      changes: [{ field: 'tripId', before: null, after: 'trip-1' }],
    });
    expect(applied.status).toBe('applied');
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'marker-1' },
      data: { tripId: 'trip-1' },
    });
  });

  it('previews and applies postponing overdue planning items', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:00:00.000Z'));
    const updateMock = vi.fn();
    const prisma = {
      tripPlanningItem: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'planning-1',
          title: '灵隐寺',
          status: 'planned',
          plannedDate: new Date('2026-05-01T00:00:00.000Z'),
        }),
        update: updateMock,
      },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const preview = await repairAdminQualityIssue({ issueId: 'planning_overdue:planning-1', dryRun: true });
    const applied = await repairAdminQualityIssue({ issueId: 'planning_overdue:planning-1', dryRun: false });

    expect(preview).toMatchObject({
      status: 'preview',
      changes: [
        {
          field: 'plannedDate',
          before: '2026-05-01T00:00:00.000Z',
          after: '2026-05-17T00:00:00.000Z',
        },
      ],
    });
    expect(applied.status).toBe('applied');
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'planning-1' },
      data: { plannedDate: new Date('2026-05-17T00:00:00.000Z') },
    });
    vi.useRealTimers();
  });

  it('previews and applies resetting degraded guide source health', async () => {
    const updateMock = vi.fn();
    const prisma = {
      guideSourceHealth: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'source-1',
          sourceName: '示例来源',
          recentFailure: 4,
          lastFailureReason: 'timeout',
        }),
        update: updateMock,
      },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const preview = await repairAdminQualityIssue({ issueId: 'guide_source_degraded:source-1', dryRun: true });
    const applied = await repairAdminQualityIssue({ issueId: 'guide_source_degraded:source-1', dryRun: false });

    expect(preview).toMatchObject({
      status: 'preview',
      changes: [
        { field: 'recentFailure', before: '4', after: '0' },
        { field: 'lastFailureReason', before: 'timeout', after: null },
      ],
    });
    expect(applied.status).toBe('applied');
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'source-1' },
      data: {
        recentFailure: 0,
        lastFailureAt: null,
        lastFailureReason: null,
      },
    });
  });

  it('previews and applies refreshing stale companion memory snapshots', async () => {
    const prisma = {
      companionMemorySnapshot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'snapshot-1',
          sourceMarkerCount: 1,
          sourcePhotoCount: 0,
          sourceGuideCount: 1,
          expiresAt: new Date('2026-05-01T00:00:00.000Z'),
        }),
      },
      travelCompanion: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'companion-1',
          name: '小悠',
        }),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.refreshCompanionMemoryMock.mockResolvedValue({
      snapshot: {
        sourceMarkerCount: 2,
        sourcePhotoCount: 3,
        sourceGuideCount: 1,
        expiresAt: '2026-05-11T00:00:00.000Z',
      },
    });

    const preview = await repairAdminQualityIssue({
      issueId: 'companion_memory_snapshot_stale:acct-1:companion-1',
      dryRun: true,
    });
    const applied = await repairAdminQualityIssue({
      issueId: 'companion_memory_snapshot_stale:acct-1:companion-1',
      dryRun: false,
    });

    expect(preview).toMatchObject({
      status: 'preview',
      title: '刷新回忆快照',
    });
    expect(applied).toMatchObject({
      status: 'applied',
      changes: expect.arrayContaining([
        { field: 'sourceMarkerCount', before: '1', after: '2' },
        { field: 'sourcePhotoCount', before: '0', after: '3' },
      ]),
    });
    expect(mocks.refreshCompanionMemoryMock).toHaveBeenCalledWith('acct-1', 'companion-1');
  });

  it('rejects issue types outside the optional auto-fix allowlist', async () => {
    const result = await repairAdminQualityIssue({ issueId: 'marker_missing_photo:marker-1', dryRun: true });

    expect(result).toMatchObject({
      repairable: false,
      status: 'not_repairable',
      description: '该问题类型不在可选自动修复白名单中。',
    });
  });
});
