import { describe, expect, it } from 'vitest';
import { buildAtlasMonthOptions, getAtlasCurrentReplayItem, getAtlasProgressText } from '../atlasPageModel';

describe('atlasPageModel', () => {
  it('builds month filter options', () => {
    expect(buildAtlasMonthOptions()).toHaveLength(13);
    expect(buildAtlasMonthOptions()[1]).toEqual({ value: '01', label: '1 月' });
  });

  it('resolves current replay item and progress text safely', () => {
    const replay = [{ id: 'one' }, { id: 'two' }] as never;
    expect(getAtlasCurrentReplayItem(replay, 20)).toEqual({ id: 'two' });
    expect(getAtlasProgressText(replay, 0)).toBe('1 / 2');
    expect(getAtlasProgressText([], 0)).toBe('等待第一段旅行轨迹');
  });
});
