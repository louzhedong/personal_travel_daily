import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMarkerActions } from '../useMarkerActions';
import type { TravelStore } from '../../../types';

const { remoteTravelStoreRepositoryMock } = vi.hoisted(() => ({
  remoteTravelStoreRepositoryMock: {
    createMarker: vi.fn(),
    updateMarker: vi.fn(),
    deleteMarker: vi.fn(),
  },
}));

vi.mock('../../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: remoteTravelStoreRepositoryMock,
}));

const store: TravelStore = {
  users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
  activeUserId: 'u1',
  markers: [
    {
      id: 'marker-1',
      userId: 'u1',
      scope: 'domestic',
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖',
      tags: ['nature'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      visitedStartAt: '2026-05-01',
      visitedEndAt: '2026-05-01',
      createdAt: '2026-05-01T00:00:00.000Z',
    },
  ],
  savedGuides: [],
  guideSearchHistory: [],
};

describe('useMarkerActions', () => {
  const setStore = vi.fn();
  const setMessage = vi.fn();
  const setSaving = vi.fn();
  const setSelectedRegionId = vi.fn();
  const setMarkerModalOpen = vi.fn();
  const setDetailMarkerId = vi.fn();

  beforeEach(() => {
    setStore.mockReset();
    setMessage.mockReset();
    setSaving.mockReset();
    setSelectedRegionId.mockReset();
    setMarkerModalOpen.mockReset();
    setDetailMarkerId.mockReset();
    Object.values(remoteTravelStoreRepositoryMock).forEach((mock) => mock.mockReset());
    remoteTravelStoreRepositoryMock.createMarker.mockResolvedValue(store);
    remoteTravelStoreRepositoryMock.updateMarker.mockResolvedValue(store);
  });

  it('forwards metadata fields when creating a marker', async () => {
    const { result } = renderHook(() =>
      useMarkerActions({
        store,
        setStore,
        setMessage,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleSubmitMarker({
        scope: 'international',
        scopeId: 'jp-kyoto',
        scopeName: '京都府',
        city: '京都',
        note: '春天赏樱',
        tags: ['citywalk', 'photography'],
        mood: 'excited',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-05',
        tripId: 'trip-1',
      });
    });

    expect(remoteTravelStoreRepositoryMock.createMarker).toHaveBeenCalledWith({
      companionId: 'u1',
      tripId: 'trip-1',
      scope: 'international',
      scopeId: 'jp-kyoto',
      scopeName: '京都府',
      city: '京都',
      note: '春天赏樱',
      tags: ['citywalk', 'photography'],
      mood: 'excited',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      imageUrls: undefined,
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-05',
    });
  });

  it('forwards metadata fields when updating a marker', async () => {
    const { result } = renderHook(() =>
      useMarkerActions({
        store,
        setStore,
        setMessage,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleUpdateMarker('marker-1', {
        note: '更新备注',
        tags: ['food', 'weekend'],
        mood: 'peaceful',
        weather: 'cloudy',
        transport: 'train',
        budgetLevel: 'high',
        imageUrls: ['https://example.com/1.jpg'],
        tripId: 'trip-2',
      });
    });

    expect(remoteTravelStoreRepositoryMock.updateMarker).toHaveBeenCalledWith('marker-1', {
      note: '更新备注',
      tags: ['food', 'weekend'],
      mood: 'peaceful',
      weather: 'cloudy',
      transport: 'train',
      budgetLevel: 'high',
      imageUrls: ['https://example.com/1.jpg'],
      tripId: 'trip-2',
    });
  });
});
