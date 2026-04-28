import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import { generateTripChecklist } from '../../lib/api/tripsApi';
import type { GuideSearchResult } from '../../types';
import { upsertRecentSearchHistory } from './travelStoreActionHelpers';
import type { UseTravelStoreActionsArgs } from './useTravelStoreActions';

/**
 * Guide-domain actions extracted from the store actions hook.
 * 攻略域动作：负责收藏、关联、移除攻略，以及保存攻略搜索历史。
 */
export function useGuideActions({ store, setStore, setMessage, showToast }: UseTravelStoreActionsArgs) {
  const handleSaveGuide = async (guide: GuideSearchResult, keyword: string) => {
    try {
      const response = await remoteTravelStoreRepository.createSavedGuide({
        savedByUserId: store.activeUserId,
        keyword,
        result: guide,
      });

      if (response.deduplicated) {
        showToast('这篇攻略已经收藏过了。', 'info');
        return;
      }

      setStore((current) => ({
        ...current,
        savedGuides: [response.item, ...current.savedGuides],
      }));
      showToast(`已收藏攻略《${guide.title}》。`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '收藏攻略失败，请稍后重试。', 'error');
    }
  };

  const handleAttachGuideToMarker = async (guide: GuideSearchResult, keyword: string, markerId: string) => {
    const targetMarker = store.markers.find((item) => item.id === markerId);

    if (!targetMarker) {
      setMessage('当前旅行记录不存在，暂时无法关联攻略。');
      return;
    }

    try {
      const response = await remoteTravelStoreRepository.createSavedGuide({
        savedByUserId: store.activeUserId,
        markerId,
        keyword,
        result: guide,
      });

      if (response.deduplicated) {
        showToast(`《${guide.title}》已经关联到这条旅行记录。`, 'info');
        return;
      }

      setStore((current) => ({
        ...current,
        savedGuides: [response.item, ...current.savedGuides],
      }));
      showToast(`已将《${guide.title}》关联到 ${targetMarker.scopeName} · ${targetMarker.city}。`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '关联攻略失败，请稍后重试。', 'error');
    }
  };

  const handleRemoveSavedGuide = async (savedGuideId: string) => {
    const targetGuide = store.savedGuides.find((item) => item.id === savedGuideId);
    if (!targetGuide) {
      return;
    }

    try {
      await remoteTravelStoreRepository.deleteSavedGuide(savedGuideId);
      setStore((current) => ({
        ...current,
        savedGuides: current.savedGuides.filter((item) => item.id !== savedGuideId),
      }));
      showToast(
        targetGuide.markerId
          ? `已解除攻略《${targetGuide.result.title}》与旅行记录的关联。`
          : `已取消收藏攻略《${targetGuide.result.title}》。`,
        'success',
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : '移除攻略失败，请稍后重试。', 'error');
    }
  };

  const handleSaveSearchHistory = async (keyword: string, scope: 'all' | 'domestic' | 'international') => {
    try {
      const response = await remoteTravelStoreRepository.createGuideSearchHistory({
        companionId: store.activeUserId,
        keyword,
        scope,
      });

      setStore((current) => ({
        ...current,
        guideSearchHistory: upsertRecentSearchHistory(current.guideSearchHistory, response.item),
      }));

      return upsertRecentSearchHistory(store.guideSearchHistory, response.item);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存搜索历史失败，请稍后重试。');
      return store.guideSearchHistory.slice(0, 6);
    }
  };

  const handleGenerateTripChecklist = async (tripId: string, guide: GuideSearchResult) => {
    try {
      const response = await generateTripChecklist(tripId, {
        companionId: store.activeUserId,
        guide: {
          title: guide.title,
          summary: guide.summary,
          sourceName: guide.sourceName,
          sourceUrl: guide.sourceUrl,
        },
      });

      const createdCount = response.createdCount;
      const deduplicatedCount = response.deduplicatedCount;
      if (createdCount > 0) {
        showToast(
          deduplicatedCount > 0
            ? `已生成 ${createdCount} 条行前清单，另外跳过了 ${deduplicatedCount} 条重复项。`
            : `已生成 ${createdCount} 条行前清单。`,
          'success',
        );
      } else {
        showToast('这篇攻略对应的清单项已经生成过了。', 'info');
      }

      return response;
    } catch (error) {
      showToast(error instanceof Error ? error.message : '生成行前清单失败，请稍后重试。', 'error');
      throw error;
    }
  };

  return {
    handleSaveGuide,
    handleAttachGuideToMarker,
    handleRemoveSavedGuide,
    handleSaveSearchHistory,
    handleGenerateTripChecklist,
  };
}
