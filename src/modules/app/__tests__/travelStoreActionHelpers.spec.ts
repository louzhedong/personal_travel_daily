import { describe, expect, it } from 'vitest';
import {
  getActionErrorMessage,
  keepCurrentActiveUser,
  upsertRecentSearchHistory,
} from '../travelStoreActionHelpers';

describe('travelStoreActionHelpers', () => {
  it('keeps the current active user when replacing store data', () => {
    expect(
      keepCurrentActiveUser(
        {
          users: [{ id: 'u2', name: '阿泽', color: '#f97316' }],
          activeUserId: 'u2',
          trips: [],
          markers: [],
          savedGuides: [],
          guideSearchHistory: [],
        },
        {
          users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
          activeUserId: 'u1',
          trips: [],
          markers: [],
          savedGuides: [],
          guideSearchHistory: [],
        },
      ),
    ).toMatchObject({ activeUserId: 'u1' });
  });

  it('prefers error messages from Error instances and falls back otherwise', () => {
    expect(getActionErrorMessage(new Error('网络异常'), '兜底提示')).toBe('网络异常');
    expect(getActionErrorMessage('not-an-error', '兜底提示')).toBe('兜底提示');
  });

  it('deduplicates recent history by normalized scope and keyword while enforcing the limit', () => {
    const history = [
      { id: '1', keyword: ' Kyoto ', scope: 'international' as const, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: '2', keyword: '大阪', scope: 'international' as const, createdAt: '2026-01-02T00:00:00.000Z' },
      { id: '3', keyword: '奈良', scope: 'international' as const, createdAt: '2026-01-03T00:00:00.000Z' },
    ];

    const updated = upsertRecentSearchHistory(
      history,
      { id: '4', keyword: 'kyoto', scope: 'international', createdAt: '2026-02-01T00:00:00.000Z' },
      3,
    );

    expect(updated).toEqual([
      { id: '4', keyword: 'kyoto', scope: 'international', createdAt: '2026-02-01T00:00:00.000Z' },
      { id: '2', keyword: '大阪', scope: 'international', createdAt: '2026-01-02T00:00:00.000Z' },
      { id: '3', keyword: '奈良', scope: 'international', createdAt: '2026-01-03T00:00:00.000Z' },
    ]);
  });
});
