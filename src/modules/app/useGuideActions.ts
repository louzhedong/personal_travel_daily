import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import type { GuideSearchResult } from '../../types';
import { upsertRecentSearchHistory } from './travelStoreActionHelpers';
import type { UseTravelStoreActionsArgs } from './useTravelStoreActions';

/**
 * Guide-domain actions extracted from the store actions hook.
 * 攻略域动作：负责收藏、关联、移除攻略，以及保存攻略搜索历史。
 */
export function useGuideActions({ store, setStore, setMessage }: UseTravelStoreActionsArgs) {
  const handleSaveGuide = async (guide: GuideSearchResult, keyword: string) => {
    try {
      const response = await remoteTravelStoreRepository.createSavedGuide({
        savedByUserId: store.activeUserId,
        keyword,
        result: guide,
      });

      if (response.deduplicated) {
        setMessage('这篇攻略已经收藏过了。');
        return;
      }

      setStore((current) => ({
        ...current,
        savedGuides: [response.item, ...current.savedGuides],
      }));
      setMessage(`已收藏攻略《${guide.title}》。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '收藏攻略失败，请稍后重试。');
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
        setMessage(`《${guide.title}》已经关联到这条旅行记录。`);
        return;
      }

      setStore((current) => ({
        ...current,
        savedGuides: [response.item, ...current.savedGuides],
      }));
      setMessage(`已将《${guide.title}》关联到 ${targetMarker.scopeName} · ${targetMarker.city}。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '关联攻略失败，请稍后重试。');
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
      setMessage(
        targetGuide.markerId
          ? `已解除攻略《${targetGuide.result.title}》与旅行记录的关联。`
          : `已取消收藏攻略《${targetGuide.result.title}》。`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '移除攻略失败，请稍后重试。');
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

  return {
    handleSaveGuide,
    handleAttachGuideToMarker,
    handleRemoveSavedGuide,
    handleSaveSearchHistory,
  };
}
