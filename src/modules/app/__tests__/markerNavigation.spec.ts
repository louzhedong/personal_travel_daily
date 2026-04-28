import { describe, expect, it, vi } from 'vitest';
import { focusMarkerById } from '../markerNavigation';

describe('focusMarkerById', () => {
  it('focuses the target marker and runs callbacks in order', () => {
    const setScope = vi.fn();
    const setSelectedRegionId = vi.fn();
    const setMarkerModalOpen = vi.fn();
    const setDetailMarkerId = vi.fn();
    const onBeforeFocus = vi.fn();
    const onFocused = vi.fn();

    const marker = {
      id: 'marker-1',
      userId: 'u1',
      scope: 'domestic' as const,
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖',
      tags: ['food'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-01',
      createdAt: '2026-04-01T00:00:00.000Z',
    };

    const result = focusMarkerById({
      markerId: 'marker-1',
      markers: [marker],
      setScope,
      setSelectedRegionId,
      setMarkerModalOpen,
      setDetailMarkerId,
      onBeforeFocus,
      onFocused,
    });

    expect(result).toEqual(marker);
    expect(onBeforeFocus).toHaveBeenCalledOnce();
    expect(setScope).toHaveBeenCalledWith('domestic');
    expect(setSelectedRegionId).toHaveBeenCalledWith('浙江');
    expect(setMarkerModalOpen).toHaveBeenCalledWith(false);
    expect(setDetailMarkerId).toHaveBeenCalledWith('marker-1');
    expect(onFocused).toHaveBeenCalledWith(marker);
  });

  it('returns null and only runs missing callback when marker does not exist', () => {
    const setScope = vi.fn();
    const setSelectedRegionId = vi.fn();
    const setMarkerModalOpen = vi.fn();
    const setDetailMarkerId = vi.fn();
    const onMissing = vi.fn();

    const result = focusMarkerById({
      markerId: 'missing',
      markers: [],
      setScope,
      setSelectedRegionId,
      setMarkerModalOpen,
      setDetailMarkerId,
      onMissing,
    });

    expect(result).toBeNull();
    expect(onMissing).toHaveBeenCalledOnce();
    expect(setScope).not.toHaveBeenCalled();
    expect(setSelectedRegionId).not.toHaveBeenCalled();
    expect(setMarkerModalOpen).not.toHaveBeenCalled();
    expect(setDetailMarkerId).not.toHaveBeenCalled();
  });
});
