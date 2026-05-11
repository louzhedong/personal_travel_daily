// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { buildAdminQualityReport } from '../appApi/services/admin/qualityReport.js';
import type { AdminAccountNodeDto } from '../appApi/types.js';
import type { CompanionMemorySnapshotHealth } from '../appApi/repositories/adminQualityRepository.js';

const baseAccount: AdminAccountNodeDto = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin',
  createdAt: '2026-05-01T00:00:00.000Z',
  trips: [
    {
      id: 'trip-1',
      name: '江南春游',
      note: '春天出行',
      startsAt: '2026-04-20',
      endsAt: '2026-04-22',
      createdAt: '2026-04-01T00:00:00.000Z',
    },
  ],
  markerSearchEvents: [],
  companions: [
    {
      id: 'companion-1',
      name: '小悠',
      color: '#2563eb',
      createdAt: '2026-03-01T00:00:00.000Z',
      markers: [
        {
          id: 'marker-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖散步',
          images: [],
          visitedStartAt: '2026-04-20',
          visitedEndAt: '2026-04-21',
          createdAt: '2026-04-20T00:00:00.000Z',
        },
        {
          id: 'marker-2',
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'js',
          scopeName: '江苏',
          city: '苏州',
          note: '园林午后',
          images: [
            {
              id: 'image-1',
              imageUrl: 'https://example.com/suzhou.jpg',
              isFeatured: false,
            },
          ],
          imageUrls: ['https://example.com/suzhou.jpg'],
          visitedStartAt: '2026-04-22',
          visitedEndAt: '2026-04-22',
          createdAt: '2026-04-22T00:00:00.000Z',
        },
      ],
      savedGuides: [
        {
          id: 'guide-1',
          keyword: '杭州',
          result: {
            id: 'guide-result-1',
            title: '杭州周末攻略',
            summary: '两天一夜',
            sourceName: '示例来源',
            sourceUrl: 'https://example.com/guide',
          },
          savedAt: '2026-04-18T00:00:00.000Z',
        },
      ],
      guideSearchHistory: [],
      planningItems: [
        {
          id: 'planning-1',
          tripId: 'trip-1',
          tripName: '江南春游',
          companionId: 'companion-1',
          companionName: '小悠',
          companionColor: '#2563eb',
          title: '灵隐寺',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          priority: 'high',
          plannedDate: '2026-04-10',
          status: 'planned',
          sortOrder: 0,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
    },
  ],
  stats: {
    tripCount: 1,
    companionCount: 1,
    markerCount: 2,
    savedGuideCount: 1,
    guideSearchHistoryCount: 0,
    markerSearchEventCount: 0,
    planningItemCount: 1,
    convertedPlanningItemCount: 0,
  },
};

function buildSnapshot(overrides: Partial<CompanionMemorySnapshotHealth> = {}): CompanionMemorySnapshotHealth {
  const now = new Date('2026-04-01T00:00:00.000Z');
  return {
    id: 'snapshot-1',
    accountId: 'acct-1',
    companionId: 'companion-1',
    snapshotVersion: 1,
    payloadJson: {},
    sourceMarkerCount: 1,
    sourcePhotoCount: 0,
    sourceGuideCount: 1,
    generatedAt: now,
    expiresAt: new Date('2026-04-15T00:00:00.000Z'),
    createdAt: now,
    updatedAt: now,
    account: {
      id: 'acct-1',
      name: 'Voyage Atlas',
    },
    companion: {
      id: 'companion-1',
      name: '小悠',
    },
    ...overrides,
  };
}

describe('buildAdminQualityReport', () => {
  it('builds quality issues from account data, source health, search status, and snapshots', () => {
    const report = buildAdminQualityReport({
      accounts: [baseAccount],
      statusBreakdown: [
        { status: 'error', count: 4 },
        { status: 'success', count: 1 },
      ],
      sourceHealth: [
        {
          id: 'source-1',
          sourceName: '示例来源',
          sourceDomain: 'example.com',
          recentSuccess: 1,
          recentFailure: 3,
          lastFailureAt: '2026-05-02T00:00:00.000Z',
          lastFailureReason: 'timeout',
        },
      ],
      snapshotHealth: [buildSnapshot()],
      now: new Date('2026-05-08T00:00:00.000Z'),
    });

    expect(report.issues.map((issue) => issue.type)).toEqual([
      'guide_search_error_spike',
      'guide_source_degraded',
      'companion_memory_snapshot_stale',
      'marker_missing_photo',
      'marker_unassigned_trip',
      'planning_overdue',
      'photo_missing_caption',
      'saved_guide_unlinked',
      'trip_missing_cover',
    ]);
    expect(report.summary).toMatchObject({
      criticalCount: 3,
      warningCount: 3,
      infoCount: 3,
      affectedAccountCount: 1,
    });
    expect(report.issues.find((issue) => issue.type === 'trip_missing_cover')).toMatchObject({
      navigationKind: 'tripDetail',
      navigationPayload: {
        tripId: 'trip-1',
      },
      canNavigate: true,
      autoFix: {
        repairable: true,
        label: '自动设置封面',
        riskLevel: 'low',
      },
    });
    expect(report.issues.find((issue) => issue.type === 'photo_missing_caption')).toMatchObject({
      navigationKind: 'photoCuration',
      navigationPayload: {
        tripId: 'trip-1',
        companionId: 'companion-1',
        photoId: 'image-1',
      },
      canNavigate: true,
      autoFix: {
        repairable: true,
        label: '自动补充说明',
        riskLevel: 'low',
      },
    });
    expect(report.issues.find((issue) => issue.type === 'marker_unassigned_trip')).toMatchObject({
      navigationKind: 'adminOnly',
      canNavigate: false,
      autoFix: {
        repairable: true,
        label: '自动归入行程',
        riskLevel: 'medium',
      },
    });
    expect(report.issues.find((issue) => issue.type === 'planning_overdue')).toMatchObject({
      autoFix: {
        repairable: true,
        label: '顺延规划日期',
        riskLevel: 'medium',
      },
    });
    expect(report.issues.find((issue) => issue.type === 'guide_source_degraded')).toMatchObject({
      autoFix: {
        repairable: true,
        label: '重置来源健康',
        riskLevel: 'high',
      },
    });
    expect(report.issues.find((issue) => issue.type === 'companion_memory_snapshot_stale')).toMatchObject({
      autoFix: {
        repairable: true,
        label: '刷新回忆快照',
        riskLevel: 'high',
      },
    });
  });

  it('returns a compact empty report when no issues are detected', () => {
    const healthyAccount: AdminAccountNodeDto = {
      ...baseAccount,
      trips: [{ ...baseAccount.trips[0], coverImageUrl: 'https://example.com/cover.jpg' }],
      companions: [
        {
          ...baseAccount.companions[0],
          markers: [
            {
              ...baseAccount.companions[0].markers[1],
              images: [
                {
                  id: 'image-1',
                  imageUrl: 'https://example.com/suzhou.jpg',
                  isFeatured: true,
                  caption: '园林午后',
                },
              ],
              imageUrls: ['https://example.com/suzhou.jpg'],
            },
          ],
          savedGuides: [{ ...baseAccount.companions[0].savedGuides[0], markerId: 'marker-2' }],
          planningItems: [{ ...baseAccount.companions[0].planningItems[0], status: 'converted' }],
        },
      ],
    };

    const report = buildAdminQualityReport({
      accounts: [healthyAccount],
      statusBreakdown: [{ status: 'success', count: 5 }],
      sourceHealth: [
        {
          id: 'source-1',
          sourceName: '示例来源',
          sourceDomain: 'example.com',
          recentSuccess: 5,
          recentFailure: 0,
        },
      ],
      snapshotHealth: [
        buildSnapshot({
          sourceMarkerCount: 1,
          sourcePhotoCount: 1,
          sourceGuideCount: 1,
          expiresAt: new Date('2026-06-01T00:00:00.000Z'),
        }),
      ],
      now: new Date('2026-05-08T00:00:00.000Z'),
    });

    expect(report.issues).toEqual([]);
    expect(report.summary).toEqual({
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      affectedAccountCount: 0,
      checkedAt: '2026-05-08T00:00:00.000Z',
    });
  });

  it('limits the returned issue list to 80 items', () => {
    const manyAccounts = Array.from({ length: 90 }, (_, index): AdminAccountNodeDto => ({
      ...baseAccount,
      id: `acct-${index}`,
      name: `账号 ${index}`,
      trips: [],
      companions: [
        {
          ...baseAccount.companions[0],
          id: `companion-${index}`,
          markers: [
            {
              ...baseAccount.companions[0].markers[0],
              id: `marker-${index}`,
            },
          ],
          savedGuides: [],
          planningItems: [],
        },
      ],
    }));

    const report = buildAdminQualityReport({
      accounts: manyAccounts,
      statusBreakdown: [],
      sourceHealth: [],
      snapshotHealth: [],
      now: new Date('2026-05-08T00:00:00.000Z'),
    });

    expect(report.issues).toHaveLength(80);
  });
});
