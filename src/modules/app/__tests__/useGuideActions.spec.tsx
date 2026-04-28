import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGuideActions } from '../useGuideActions';
import type { TravelStore } from '../../../types';

const { generateTripChecklistMock, remoteTravelStoreRepositoryMock } = vi.hoisted(() => ({
  generateTripChecklistMock: vi.fn(),
  remoteTravelStoreRepositoryMock: {
    createSavedGuide: vi.fn(),
    createGuideSearchHistory: vi.fn(),
    deleteSavedGuide: vi.fn(),
  },
}));

vi.mock('../../../lib/api/tripsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api/tripsApi')>();
  return {
    ...actual,
    generateTripChecklist: generateTripChecklistMock,
  };
});

vi.mock('../../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: remoteTravelStoreRepositoryMock,
}));

const store: TravelStore = {
  users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
  activeUserId: 'u1',
  markers: [],
  savedGuides: [
    {
      id: 'saved-1',
      savedByUserId: 'u1',
      keyword: '京都',
      savedAt: '2026-03-02T00:00:00.000Z',
      result: {
        id: 'guide-1',
        title: '京都春日路线',
        summary: '适合第一次去京都的三天行程。',
        sourceName: 'Mock Guide',
        sourceUrl: 'https://example.com/guides/kyoto',
      },
    },
  ],
  guideSearchHistory: [],
};

describe('useGuideActions', () => {
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
    generateTripChecklistMock.mockReset();
    Object.values(remoteTravelStoreRepositoryMock).forEach((mock) => mock.mockReset());
  });

  it('shows a success toast after saving a guide', async () => {
    remoteTravelStoreRepositoryMock.createSavedGuide.mockResolvedValue({
      deduplicated: false,
      item: {
        id: 'saved-1',
        savedByUserId: 'u1',
        keyword: '京都',
        savedAt: '2026-03-02T00:00:00.000Z',
        result: {
          id: 'guide-1',
          title: '京都春日路线',
          summary: '适合第一次去京都的三天行程。',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://example.com/guides/kyoto',
        },
      },
    });

    const { result } = renderHook(() =>
      useGuideActions({
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
      await result.current.handleSaveGuide(
        {
          id: 'guide-1',
          title: '京都春日路线',
          summary: '适合第一次去京都的三天行程。',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://example.com/guides/kyoto',
        },
        '京都',
      );
    });

    expect(showToast).toHaveBeenCalledWith('已收藏攻略《京都春日路线》。', 'success');
  });

  it('shows a success toast after attaching a guide to a marker', async () => {
    remoteTravelStoreRepositoryMock.createSavedGuide.mockResolvedValue({
      deduplicated: false,
      item: {
        id: 'saved-2',
        savedByUserId: 'u1',
        markerId: 'marker-1',
        keyword: '杭州',
        savedAt: '2026-03-02T00:00:00.000Z',
        result: {
          id: 'guide-2',
          title: '西湖散步攻略',
          summary: '半日散步路线。',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://example.com/guides/hangzhou',
        },
      },
    });

    const storeWithMarker: TravelStore = {
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
      ],
    };

    const { result } = renderHook(() =>
      useGuideActions({
        store: storeWithMarker,
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
      await result.current.handleAttachGuideToMarker(
        {
          id: 'guide-2',
          title: '西湖散步攻略',
          summary: '半日散步路线。',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://example.com/guides/hangzhou',
        },
        '杭州',
        'marker-1',
      );
    });

    expect(showToast).toHaveBeenCalledWith('已将《西湖散步攻略》关联到 浙江 · 杭州。', 'success');
  });

  it('shows a success toast after generating checklist items', async () => {
    generateTripChecklistMock.mockResolvedValue({
      createdCount: 3,
      deduplicatedCount: 1,
      items: [],
    });

    const { result } = renderHook(() =>
      useGuideActions({
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
      await result.current.handleGenerateTripChecklist('trip-1', {
        id: 'guide-1',
        title: '京都春日路线',
        summary: '适合第一次去京都的三天行程。',
        sourceName: 'Mock Guide',
        sourceUrl: 'https://example.com/guides/kyoto',
      });
    });

    expect(showToast).toHaveBeenCalledWith('已生成 3 条行前清单，另外跳过了 1 条重复项。', 'success');
  });

  it('shows a success toast after removing a saved guide', async () => {
    remoteTravelStoreRepositoryMock.deleteSavedGuide.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useGuideActions({
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
      await result.current.handleRemoveSavedGuide('saved-1');
    });

    expect(showToast).toHaveBeenCalledWith('已取消收藏攻略《京都春日路线》。', 'success');
  });

  it('shows a success toast after detaching a guide from a marker', async () => {
    remoteTravelStoreRepositoryMock.deleteSavedGuide.mockResolvedValue(undefined);

    const storeWithAttachedGuide: TravelStore = {
      ...store,
      savedGuides: [
        {
          id: 'saved-2',
          savedByUserId: 'u1',
          markerId: 'marker-1',
          keyword: '杭州',
          savedAt: '2026-03-02T00:00:00.000Z',
          result: {
            id: 'guide-2',
            title: '西湖散步攻略',
            summary: '半日散步路线。',
            sourceName: 'Mock Guide',
            sourceUrl: 'https://example.com/guides/hangzhou',
          },
        },
      ],
    };

    const { result } = renderHook(() =>
      useGuideActions({
        store: storeWithAttachedGuide,
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
      await result.current.handleRemoveSavedGuide('saved-2');
    });

    expect(showToast).toHaveBeenCalledWith('已解除攻略《西湖散步攻略》与旅行记录的关联。', 'success');
  });

  it('shows an error toast when checklist generation fails', async () => {
    generateTripChecklistMock.mockRejectedValue(new Error('生成失败'));

    const { result } = renderHook(() =>
      useGuideActions({
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

    await expect(
      result.current.handleGenerateTripChecklist('trip-1', {
        id: 'guide-1',
        title: '京都春日路线',
        summary: '适合第一次去京都的三天行程。',
        sourceName: 'Mock Guide',
        sourceUrl: 'https://example.com/guides/kyoto',
      }),
    ).rejects.toThrow('生成失败');

    expect(showToast).toHaveBeenCalledWith('生成失败', 'error');
  });
});
