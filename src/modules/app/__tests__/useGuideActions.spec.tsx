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

  it('shows an info toast when saving a duplicate guide', async () => {
    remoteTravelStoreRepositoryMock.createSavedGuide.mockResolvedValue({
      deduplicated: true,
      item: {
        id: 'saved-duplicate',
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

    expect(setStore).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('这篇攻略已经收藏过了。', 'info');
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

  it('shows a message when attaching a guide to a missing marker', async () => {
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
      await result.current.handleAttachGuideToMarker(
        {
          id: 'guide-2',
          title: '西湖散步攻略',
          summary: '半日散步路线。',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://example.com/guides/hangzhou',
        },
        '杭州',
        'missing-marker',
      );
    });

    expect(remoteTravelStoreRepositoryMock.createSavedGuide).not.toHaveBeenCalled();
    expect(setMessage).toHaveBeenCalledWith('当前旅行记录不存在，暂时无法关联攻略。');
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

  it('shows an info toast when checklist items are already generated', async () => {
    generateTripChecklistMock.mockResolvedValue({
      createdCount: 0,
      deduplicatedCount: 2,
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

    expect(showToast).toHaveBeenCalledWith('这篇攻略对应的清单项已经生成过了。', 'info');
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

  it('saves guide search history and returns the updated list', async () => {
    remoteTravelStoreRepositoryMock.createGuideSearchHistory.mockResolvedValue({
      item: {
        id: 'history-1',
        keyword: 'Kyoto',
        scope: 'international',
        createdAt: '2026-05-05T00:00:00.000Z',
      },
      deduplicated: false,
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

    let histories: unknown;
    await act(async () => {
      histories = await result.current.handleSaveSearchHistory('Kyoto', 'international');
    });

    expect(remoteTravelStoreRepositoryMock.createGuideSearchHistory).toHaveBeenCalledWith({
      companionId: 'u1',
      keyword: 'Kyoto',
      scope: 'international',
    });
    expect(setStore).toHaveBeenCalledOnce();
    expect(histories).toEqual([
      {
        id: 'history-1',
        keyword: 'Kyoto',
        scope: 'international',
        createdAt: '2026-05-05T00:00:00.000Z',
      },
    ]);
  });

  it('returns fallback history and sets message when saving search history fails', async () => {
    const storeWithHistory: TravelStore = {
      ...store,
      guideSearchHistory: Array.from({ length: 7 }, (_, index) => ({
        id: `history-${index}`,
        keyword: `keyword-${index}`,
        scope: 'all',
        createdAt: `2026-05-0${(index % 5) + 1}T00:00:00.000Z`,
      })),
    };
    remoteTravelStoreRepositoryMock.createGuideSearchHistory.mockRejectedValue('unknown');

    const { result } = renderHook(() =>
      useGuideActions({
        store: storeWithHistory,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    let histories: unknown;
    await act(async () => {
      histories = await result.current.handleSaveSearchHistory('Kyoto', 'all');
    });

    expect(setMessage).toHaveBeenCalledWith('保存搜索历史失败，请稍后重试。');
    expect(histories).toEqual(storeWithHistory.guideSearchHistory.slice(0, 6));
  });
});
