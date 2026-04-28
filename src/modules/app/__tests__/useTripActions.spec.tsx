import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTripActions } from '../useTripActions';
import type { TravelStore } from '../../../types';

const { remoteTravelStoreRepositoryMock } = vi.hoisted(() => ({
  remoteTravelStoreRepositoryMock: {
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
    batchUpdateMarkersTrip: vi.fn(),
  },
}));

vi.mock('../../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: remoteTravelStoreRepositoryMock,
}));

const store: TravelStore = {
  users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
  activeUserId: 'u1',
  markers: [],
  savedGuides: [],
  guideSearchHistory: [],
  trips: [
    {
      id: 'trip-1',
      name: '京都春日行',
      note: '',
      startsAt: '2026-04-01',
      endsAt: '2026-04-05',
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ],
};

describe('useTripActions', () => {
  const setStore = vi.fn();
  const setMessage = vi.fn();
  const showToast = vi.fn();
  const setSaving = vi.fn();
  const setSelectedRegionId = vi.fn();
  const setMarkerModalOpen = vi.fn();
  const setDetailMarkerId = vi.fn();

  beforeEach(() => {
    setStore.mockReset();
    setMessage.mockReset();
    showToast.mockReset();
    setSaving.mockReset();
    setSelectedRegionId.mockReset();
    setMarkerModalOpen.mockReset();
    setDetailMarkerId.mockReset();
    Object.values(remoteTravelStoreRepositoryMock).forEach((mock) => mock.mockReset());
    remoteTravelStoreRepositoryMock.createTrip.mockResolvedValue(store);
    remoteTravelStoreRepositoryMock.updateTrip.mockResolvedValue(store);
    remoteTravelStoreRepositoryMock.deleteTrip.mockResolvedValue(store);
    remoteTravelStoreRepositoryMock.batchUpdateMarkersTrip.mockResolvedValue(store);
  });

  it('shows a success toast after creating a trip', async () => {
    const { result } = renderHook(() =>
      useTripActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleCreateTrip({
        name: '北海道雪国行',
        startsAt: '2026-01-10',
        endsAt: '2026-01-16',
      });
    });

    expect(showToast).toHaveBeenCalledWith('已创建行程「北海道雪国行」，新增旅行记录时可以归入这个行程。', 'success');
  });

  it('shows an error toast when creating a trip fails', async () => {
    remoteTravelStoreRepositoryMock.createTrip.mockRejectedValue('unknown');

    const { result } = renderHook(() =>
      useTripActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleCreateTrip({
        name: '北海道雪国行',
        startsAt: '2026-01-10',
        endsAt: '2026-01-16',
      });
    });

    expect(showToast).toHaveBeenCalledWith('创建行程失败，请稍后重试。', 'error');
  });

  it('shows a success toast after updating a trip', async () => {
    const { result } = renderHook(() =>
      useTripActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleUpdateTrip('trip-1', {
        name: '京都赏樱行',
      });
    });

    expect(showToast).toHaveBeenCalledWith('已更新行程「京都赏樱行」。', 'success');
  });

  it('falls back to the current trip name or generic label on update success and error', async () => {
    const { result, rerender } = renderHook(
      ({ currentStore }) =>
        useTripActions({
          store: currentStore,
          setStore,
          setMessage,
          showToast,
          setSaving,
          setSelectedRegionId,
          setMarkerModalOpen,
          setDetailMarkerId,
        }),
      {
        initialProps: { currentStore: store },
      },
    );

    await act(async () => {
      await result.current.handleUpdateTrip('trip-1', {});
    });
    expect(showToast).toHaveBeenCalledWith('已更新行程「京都春日行」。', 'success');

    remoteTravelStoreRepositoryMock.updateTrip.mockRejectedValueOnce('unknown');
    rerender({
      currentStore: {
        ...store,
        trips: [],
      },
    });
    await act(async () => {
      await result.current.handleUpdateTrip('missing-trip', {});
    });
    expect(showToast).toHaveBeenCalledWith('更新行程失败，请稍后重试。', 'error');
  });

  it('shows a success toast after bulk assigning markers to a trip', async () => {
    const storeWithMarkers: TravelStore = {
      ...store,
      markers: [
        {
          id: 'marker-1',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖',
          tags: [],
          mood: undefined,
          weather: undefined,
          transport: undefined,
          budgetLevel: undefined,
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-01',
          createdAt: '2026-05-01T00:00:00.000Z',
        },
        {
          id: 'marker-2',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'js',
          scopeName: '江苏',
          city: '苏州',
          note: '平江路',
          tags: [],
          mood: undefined,
          weather: undefined,
          transport: undefined,
          budgetLevel: undefined,
          visitedStartAt: '2026-05-02',
          visitedEndAt: '2026-05-02',
          createdAt: '2026-05-02T00:00:00.000Z',
        },
      ],
    };

    const { result } = renderHook(() =>
      useTripActions({
        store: storeWithMarkers,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleBulkAssignMarkersToTrip(['marker-1', 'marker-2'], 'trip-1');
    });

    expect(showToast).toHaveBeenCalledWith('已将 2 条记录归入行程「京都春日行」。', 'success');
  });

  it('shows a success toast after deleting a trip', async () => {
    const { result } = renderHook(() =>
      useTripActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleDeleteTrip('trip-1');
    });

    expect(showToast).toHaveBeenCalledWith('已删除行程「京都春日行」，相关记录已移回未归入行程。', 'success');
  });

  it('shows a generic trip label when deleting an unknown trip and handles delete failure', async () => {
    const { result, rerender } = renderHook(
      ({ currentStore }) =>
        useTripActions({
          store: currentStore,
          setStore,
          setMessage,
          showToast,
          setSaving,
          setSelectedRegionId,
          setMarkerModalOpen,
          setDetailMarkerId,
        }),
      {
        initialProps: { currentStore: { ...store, trips: [] as TravelStore['trips'] } },
      },
    );

    await act(async () => {
      await result.current.handleDeleteTrip('missing');
    });
    expect(showToast).toHaveBeenCalledWith('已删除行程「当前行程」，相关记录已移回未归入行程。', 'success');

    remoteTravelStoreRepositoryMock.deleteTrip.mockRejectedValueOnce(new Error('删除失败'));
    rerender({ currentStore: store });
    await act(async () => {
      await result.current.handleDeleteTrip('trip-1');
    });
    expect(showToast).toHaveBeenCalledWith('删除失败', 'error');
  });

  it('shows a success toast after bulk moving markers back to unassigned', async () => {
    const storeWithMarkers: TravelStore = {
      ...store,
      markers: [
        {
          id: 'marker-1',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖',
          tags: [],
          mood: undefined,
          weather: undefined,
          transport: undefined,
          budgetLevel: undefined,
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-01',
          createdAt: '2026-05-01T00:00:00.000Z',
        },
        {
          id: 'marker-2',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'js',
          scopeName: '江苏',
          city: '苏州',
          note: '平江路',
          tags: [],
          mood: undefined,
          weather: undefined,
          transport: undefined,
          budgetLevel: undefined,
          visitedStartAt: '2026-05-02',
          visitedEndAt: '2026-05-02',
          createdAt: '2026-05-02T00:00:00.000Z',
        },
      ],
    };

    const { result } = renderHook(() =>
      useTripActions({
        store: storeWithMarkers,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleBulkAssignMarkersToTrip(['marker-1', 'marker-2'], null);
    });

    expect(showToast).toHaveBeenCalledWith('已将 2 条记录移回未归入行程。', 'success');
  });

  it('asks for marker selection before batch assignment and handles repository errors', async () => {
    const { result } = renderHook(() =>
      useTripActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleBulkAssignMarkersToTrip([], 'trip-1');
    });
    expect(setMessage).toHaveBeenCalledWith('请先选择要整理的旅行记录。');
    expect(remoteTravelStoreRepositoryMock.batchUpdateMarkersTrip).not.toHaveBeenCalled();

    remoteTravelStoreRepositoryMock.batchUpdateMarkersTrip.mockRejectedValueOnce('unknown');
    await act(async () => {
      await result.current.handleBulkAssignMarkersToTrip(['marker-1'], 'trip-1');
    });
    expect(showToast).toHaveBeenCalledWith('批量整理行程失败，请稍后重试。', 'error');
  });
});
