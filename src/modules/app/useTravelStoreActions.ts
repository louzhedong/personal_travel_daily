import type { Dispatch, SetStateAction } from 'react';
import type { MarkerFormValue } from '../../components/MarkerForm';
import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import type { GuideSearchResult, TravelStore, UserProfile } from '../../types';

interface UseTravelStoreActionsArgs {
  store: TravelStore;
  setStore: Dispatch<SetStateAction<TravelStore>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setSelectedRegionId: Dispatch<SetStateAction<string>>;
  setMarkerModalOpen: Dispatch<SetStateAction<boolean>>;
  setDetailMarkerId: Dispatch<SetStateAction<string | null>>;
}

export function useTravelStoreActions({
  store,
  setStore,
  setMessage,
  setSaving,
  setSelectedRegionId,
  setMarkerModalOpen,
  setDetailMarkerId,
}: UseTravelStoreActionsArgs) {
  const activeUser = store.users.find((item) => item.id === store.activeUserId) ?? store.users[0];

  const handleSwitchUser = (userId: string) => {
    setStore((current) => ({ ...current, activeUserId: userId }));
    const user = store.users.find((item) => item.id === userId);
    if (user) {
      setMessage(`当前记录用户已切换为 ${user.name}。`);
    }
  };

  const handleCreateUser = async ({ name, color }: { name: string; color: string }) => {
    try {
      const nextStore = await remoteTravelStoreRepository.createCompanion({ name, color });
      const nextUser = nextStore.users.find((item) => item.name === name && item.color === color) ?? nextStore.users[0];

      setStore({
        ...nextStore,
        activeUserId: nextUser?.id ?? nextStore.activeUserId,
      });
      setMessage(`已新增用户 ${name}，现在可以使用该用户记录旅行。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '新增用户失败，请稍后重试。');
    }
  };

  const handleCreateTrip = async (input: {
    name: string;
    startsAt: string;
    endsAt: string;
    note?: string;
    coverImageUrl?: string;
  }) => {
    try {
      const nextStore = await remoteTravelStoreRepository.createTrip(input);
      setStore((current) => ({
        ...nextStore,
        activeUserId: current.activeUserId,
      }));
      setMessage(`已创建行程「${input.name}」，新增旅行记录时可以归入这个行程。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建行程失败，请稍后重试。');
    }
  };

  const handleSubmitMarker = async (value: MarkerFormValue) => {
    if (!activeUser) {
      return;
    }

    setSaving(true);
    try {
      const nextStore = await remoteTravelStoreRepository.createMarker({
        companionId: activeUser.id,
        tripId: value.tripId,
        scope: value.scope,
        scopeId: value.scopeId,
        scopeName: value.scopeName,
        city: value.city,
        note: value.note,
        imageUrls: value.imageUrls,
        visitedStartAt: value.visitedStartAt,
        visitedEndAt: value.visitedEndAt,
      });

      setStore((current) => ({
        ...nextStore,
        activeUserId: current.activeUserId,
      }));
      setSelectedRegionId(value.scopeId);
      setMarkerModalOpen(false);
      setMessage(`已保存 ${activeUser.name} 在 ${value.scopeName} · ${value.city} 的旅行记录。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存旅行记录失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    const target = store.markers.find((item) => item.id === markerId);
    if (!target || target.userId !== store.activeUserId) {
      return;
    }

    try {
      const nextStore = await remoteTravelStoreRepository.deleteMarker(markerId);
      setStore((current) => ({
        ...nextStore,
        activeUserId: current.activeUserId,
      }));
      setDetailMarkerId((current) => (current === markerId ? null : current));
      setMessage(`已删除 ${target.scopeName} · ${target.city} 的旅行记录。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除旅行记录失败，请稍后重试。');
    }
  };

  const handleUpdateMarker = async (
    markerId: string,
    updates: { note: string; imageUrls?: string[]; tripId?: string | null },
  ) => {
    const target = store.markers.find((item) => item.id === markerId);
    if (!target || target.userId !== store.activeUserId) {
      return;
    }

    try {
      const nextStore = await remoteTravelStoreRepository.updateMarker(markerId, {
        note: updates.note,
        imageUrls: updates.imageUrls,
        tripId: updates.tripId,
      });
      setStore((current) => ({
        ...nextStore,
        activeUserId: current.activeUserId,
      }));
      setMessage(`已更新 ${target.scopeName} · ${target.city} 的旅行记录。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新旅行记录失败，请稍后重试。');
    }
  };

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

      setStore((current) => {
        const remaining = current.guideSearchHistory.filter(
          (item) =>
            !(
              item.scope === response.item.scope &&
              item.keyword.trim().toLowerCase() === response.item.keyword.trim().toLowerCase()
            ),
        );

        return {
          ...current,
          guideSearchHistory: [response.item, ...remaining].slice(0, 6),
        };
      });

      return [
        response.item,
        ...store.guideSearchHistory.filter(
          (item) =>
            !(
              item.scope === response.item.scope &&
              item.keyword.trim().toLowerCase() === response.item.keyword.trim().toLowerCase()
            ),
        ),
      ].slice(0, 6);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存搜索历史失败，请稍后重试。');
      return store.guideSearchHistory.slice(0, 6);
    }
  };

  return {
    activeUser: activeUser as UserProfile | undefined,
    handleSwitchUser,
    handleCreateUser,
    handleCreateTrip,
    handleSubmitMarker,
    handleDeleteMarker,
    handleUpdateMarker,
    handleSaveGuide,
    handleAttachGuideToMarker,
    handleRemoveSavedGuide,
    handleSaveSearchHistory,
  };
}
