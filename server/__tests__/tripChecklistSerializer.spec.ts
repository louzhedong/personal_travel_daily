// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildTripChecklistGroups,
  buildTripChecklistSummary,
  serializeGenerateTripChecklistResult,
  serializeTripChecklistResponse,
} from '../appApi/serializers/tripChecklistSerializer.js';

function createChecklistItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'item-1',
    accountId: 'acct-1',
    tripId: 'trip-1',
    createdByCompanionId: 'user-1',
    title: '提前预约景点',
    note: '避开高峰',
    stage: 'pre_departure',
    sortOrder: 0,
    origin: 'generated',
    sourceGuideIdentity: 'guide-1',
    sourceGuideTitle: '杭州周末攻略',
    sourceGuideSourceName: 'Qyer',
    sourceGuideSourceUrl: 'https://example.com/guide',
    sourceSnippet: '建议提前预约',
    isDeleted: false,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    deletedAt: null,
    createdByCompanion: {
      id: 'user-1',
      accountId: 'acct-1',
      name: '小悠',
      color: '#2563eb',
      sortOrder: 0,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      deletedAt: null,
      isDeleted: false,
    },
    ...overrides,
  } as never;
}

describe('tripChecklistSerializer', () => {
  it('builds summary counts for each checklist stage', () => {
    const items = [
      createChecklistItem(),
      createChecklistItem({ id: 'item-2', stage: 'in_transit', title: '查看列车时刻' }),
      createChecklistItem({ id: 'item-3', stage: 'done', title: '酒店已确认' }),
    ];

    expect(buildTripChecklistSummary(items)).toEqual({
      total: 3,
      preDepartureCount: 1,
      inTransitCount: 1,
      doneCount: 1,
    });
  });

  it('groups checklist items in fixed stage order with localized meta', () => {
    const items = [
      createChecklistItem({ id: 'item-2', stage: 'done', title: '酒店已确认' }),
      createChecklistItem({ id: 'item-1', stage: 'pre_departure', title: '提前预约景点' }),
    ];

    const groups = buildTripChecklistGroups(items);

    expect(groups.map((group) => group.stage)).toEqual(['pre_departure', 'in_transit', 'done']);
    expect(groups[0]).toMatchObject({
      stage: 'pre_departure',
      title: '出发前准备',
      description: '把预约、路线、装备和行前确认放在这里。',
      itemCount: 1,
      items: [
        {
          id: 'item-1',
          companionId: 'user-1',
          companionName: '小悠',
          companionColor: '#2563eb',
          title: '提前预约景点',
          stage: 'pre_departure',
          origin: 'generated',
          sourceGuideTitle: '杭州周末攻略',
        },
      ],
    });
    expect(groups[1]).toMatchObject({
      stage: 'in_transit',
      title: '旅途中留意',
      itemCount: 0,
      items: [],
    });
    expect(groups[2]).toMatchObject({
      stage: 'done',
      title: '已经完成',
      itemCount: 1,
    });
  });

  it('serializes checklist response and generated results', () => {
    const manualItem = createChecklistItem({
      id: 'item-manual',
      title: '带上身份证',
      stage: 'done',
      origin: 'manual',
      sourceGuideIdentity: null,
      sourceGuideTitle: null,
      sourceGuideSourceName: null,
      sourceGuideSourceUrl: null,
      sourceSnippet: null,
    });

    expect(serializeTripChecklistResponse([])).toEqual({
      summary: {
        total: 0,
        preDepartureCount: 0,
        inTransitCount: 0,
        doneCount: 0,
      },
      groups: [
        {
          stage: 'pre_departure',
          title: '出发前准备',
          description: '把预约、路线、装备和行前确认放在这里。',
          itemCount: 0,
          items: [],
        },
        {
          stage: 'in_transit',
          title: '旅途中留意',
          description: '把路上节奏、交通衔接和现场提醒收在这里。',
          itemCount: 0,
          items: [],
        },
        {
          stage: 'done',
          title: '已经完成',
          description: '完成的事项会沉淀到这一组，方便回看。',
          itemCount: 0,
          items: [],
        },
      ],
    });

    expect(
      serializeGenerateTripChecklistResult({
        createdCount: 2,
        deduplicatedCount: 1,
        items: [manualItem],
      }),
    ).toEqual({
      createdCount: 2,
      deduplicatedCount: 1,
      items: [
        {
          id: 'item-manual',
          companionId: 'user-1',
          companionName: '小悠',
          companionColor: '#2563eb',
          title: '带上身份证',
          note: '避开高峰',
          stage: 'done',
          sortOrder: 0,
          origin: 'manual',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
    });
  });
});
