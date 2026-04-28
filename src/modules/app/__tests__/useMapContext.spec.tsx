import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapContext } from '../useMapContext';

const mocks = vi.hoisted(() => ({
  loadGeoForScopeMock: vi.fn(),
  getRegionsByScopeMock: vi.fn(),
}));

vi.mock('../../../geo/loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../geo/loader')>();
  return {
    ...actual,
    loadGeoForScope: mocks.loadGeoForScopeMock,
  };
});

vi.mock('../../../data/regions', () => ({
  getRegionsByScope: mocks.getRegionsByScopeMock,
}));

describe('useMapContext', () => {
  const setMessage = vi.fn();
  const setMarkerModalOpen = vi.fn();
  const markers = [
    {
      id: 'marker-1',
      userId: 'u1',
      scope: 'domestic' as const,
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖',
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-01',
      createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'marker-2',
      userId: 'u1',
      scope: 'international' as const,
      scopeId: 'jp-tokyo',
      scopeName: '日本',
      city: '东京',
      note: '浅草寺',
      visitedStartAt: '2026-05-01',
      visitedEndAt: '2026-05-01',
      createdAt: '2026-05-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    setMessage.mockReset();
    setMarkerModalOpen.mockReset();
    mocks.loadGeoForScopeMock.mockReset();
    mocks.getRegionsByScopeMock.mockReset();
    mocks.getRegionsByScopeMock.mockImplementation((scope: 'domestic' | 'international') =>
      scope === 'domestic'
        ? [{ id: 'zhejiang', name: '浙江', cities: ['杭州', '宁波'] }]
        : [{ id: 'japan', name: '日本', cities: ['东京', '大阪'] }],
    );
    mocks.loadGeoForScopeMock.mockImplementation(async (scope: 'domestic' | 'international') =>
      scope === 'domestic' ? [{ name: '浙江' }] : [{ name: '日本' }],
    );
  });

  it('loads region options, filters visible markers, and drives region selection messages', async () => {
    const { result } = renderHook(() =>
      useMapContext({
        markers,
        setMessage,
        setMarkerModalOpen,
      }),
    );

    await waitFor(() => {
      expect(result.current.regionOptions).toEqual([{ id: '浙江', name: '浙江', cities: ['杭州', '宁波'] }]);
    });

    expect(result.current.currentMarkers.map((item) => item.id)).toEqual(['marker-1']);
    expect(result.current.visibleMarkers.map((item) => item.id)).toEqual(['marker-1']);

    act(() => {
      result.current.handleSelectRegion({ id: '浙江', name: '浙江', cities: ['杭州', '宁波'] });
    });

    expect(result.current.selectedRegionId).toBe('浙江');
    expect(result.current.selectedRegion).toEqual({ id: '浙江', name: '浙江', cities: ['杭州', '宁波'] });
    expect(setMarkerModalOpen).toHaveBeenCalledWith(false);
    expect(setMessage).toHaveBeenCalledWith('已按 浙江 筛选当前地图与记录列表。');
    expect(result.current.visibleMarkers.map((item) => item.id)).toEqual(['marker-1']);

    act(() => {
      result.current.handleOpenSelectedRegionComposer();
    });
    expect(setMarkerModalOpen).toHaveBeenCalledWith(true);
    expect(setMessage).toHaveBeenCalledWith('已选择 浙江，请在弹窗中完成城市和描述填写。');

    act(() => {
      result.current.handleClearSelectedRegion();
    });
    expect(result.current.selectedRegionId).toBe('');
    expect(setMessage).toHaveBeenCalledWith('已清除区域筛选。');
  });

  it('resets selection and modal state when scope changes or selected region becomes invalid', async () => {
    const { result } = renderHook(() =>
      useMapContext({
        markers,
        setMessage,
        setMarkerModalOpen,
      }),
    );

    await waitFor(() => {
      expect(result.current.regionOptions).toHaveLength(1);
    });

    act(() => {
      result.current.handleSelectRegion({ id: '浙江', name: '浙江', cities: ['杭州', '宁波'] });
    });
    expect(result.current.selectedRegionId).toBe('浙江');

    act(() => {
      result.current.handleScopeChange('international');
    });

    await waitFor(() => {
      expect(result.current.regionOptions).toEqual([{ id: '日本', name: '日本', cities: ['东京', '大阪'] }]);
    });

    expect(result.current.scope).toBe('international');
    expect(result.current.selectedRegionId).toBe('');
    expect(result.current.currentMarkers.map((item) => item.id)).toEqual(['marker-2']);
    expect(result.current.visibleMarkers.map((item) => item.id)).toEqual(['marker-2']);
    expect(setMarkerModalOpen).toHaveBeenCalledWith(false);

    act(() => {
      result.current.setSelectedRegionId('不存在');
    });

    await waitFor(() => {
      expect(result.current.selectedRegionId).toBe('');
    });
    expect(setMarkerModalOpen).toHaveBeenCalledWith(false);
  });

  it('falls back to empty region options on loader failure and blocks composer without selection', async () => {
    mocks.loadGeoForScopeMock.mockRejectedValueOnce(new Error('地图加载失败'));

    const { result } = renderHook(() =>
      useMapContext({
        markers,
        setMessage,
        setMarkerModalOpen,
      }),
    );

    await waitFor(() => {
      expect(result.current.regionOptions).toEqual([]);
    });

    act(() => {
      result.current.handleOpenSelectedRegionComposer();
    });

    expect(setMarkerModalOpen).not.toHaveBeenCalledWith(true);
    expect(setMessage).toHaveBeenCalledWith('请先在地图上选择一个区域，再新增旅行记录。');
  });
});
