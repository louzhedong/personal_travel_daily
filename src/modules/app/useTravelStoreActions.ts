import type { Dispatch, SetStateAction } from 'react';
import type { MarkerFormValue } from '../../components/MarkerForm';
import { createMarker, createUser } from '../../lib/storage';
import type { GuideSearchResult, TravelStore, UserProfile } from '../../types';
import {
  attachGuideToMarkerInStore,
  removeSavedGuideFromStore,
  saveGuideToStore,
} from './guideActions';

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

  const handleCreateUser = ({ name, color }: { name: string; color: string }) => {
    const nextUser = createUser(name, color);
    setStore((current) => ({
      ...current,
      users: [...current.users, nextUser],
      activeUserId: nextUser.id,
    }));
    setMessage(`已新增用户 ${name}，现在可以使用该用户记录旅行。`);
  };

  const handleSubmitMarker = async (value: MarkerFormValue) => {
    if (!activeUser) {
      return;
    }

    setSaving(true);
    try {
      const nextMarker = createMarker({
        ...value,
        userId: activeUser.id,
      });

      setStore((current) => ({
        ...current,
        markers: [nextMarker, ...current.markers],
      }));
      setSelectedRegionId(value.scopeId);
      setMarkerModalOpen(false);
      setMessage(`已保存 ${activeUser.name} 在 ${value.scopeName} · ${value.city} 的旅行记录。`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMarker = (markerId: string) => {
    const target = store.markers.find((item) => item.id === markerId);
    if (!target || target.userId !== store.activeUserId) {
      return;
    }

    setStore((current) => ({
      ...current,
      markers: current.markers.filter((item) => item.id !== markerId),
      savedGuides: current.savedGuides.filter((item) => item.markerId !== markerId),
    }));
    setDetailMarkerId((current) => (current === markerId ? null : current));
    setMessage(`已删除 ${target.scopeName} · ${target.city} 的旅行记录。`);
  };

  const handleUpdateMarker = async (
    markerId: string,
    updates: { note: string; imageUrls?: string[] },
  ) => {
    const target = store.markers.find((item) => item.id === markerId);
    if (!target || target.userId !== store.activeUserId) {
      return;
    }

    setStore((current) => ({
      ...current,
      markers: current.markers.map((item) =>
        item.id === markerId
          ? {
              ...item,
              note: updates.note,
              imageUrls: updates.imageUrls,
            }
          : item,
      ),
    }));
    setMessage(`已更新 ${target.scopeName} · ${target.city} 的旅行记录。`);
  };

  const handleSaveGuide = (guide: GuideSearchResult, keyword: string) => {
    const { alreadySaved, nextSavedGuide } = saveGuideToStore(setStore, guide, keyword);

    if (alreadySaved) {
      setMessage('这篇攻略已经收藏过了。');
      return;
    }

    if (nextSavedGuide) {
      setMessage(`已收藏攻略《${guide.title}》。`);
    }
  };

  const handleAttachGuideToMarker = (guide: GuideSearchResult, keyword: string, markerId: string) => {
    const { alreadyAttached, nextSavedGuide, targetMarker } = attachGuideToMarkerInStore(
      store,
      setStore,
      guide,
      keyword,
      markerId,
    );

    if (!targetMarker) {
      setMessage('当前旅行记录不存在，暂时无法关联攻略。');
      return;
    }

    if (alreadyAttached) {
      setMessage(`《${guide.title}》已经关联到这条旅行记录。`);
      return;
    }

    if (nextSavedGuide) {
      setMessage(`已将《${guide.title}》关联到 ${targetMarker.scopeName} · ${targetMarker.city}。`);
    }
  };

  const handleRemoveSavedGuide = (savedGuideId: string) => {
    const targetGuide = removeSavedGuideFromStore(store, setStore, savedGuideId);
    if (!targetGuide) {
      return;
    }

    setMessage(
      targetGuide.markerId
        ? `已解除攻略《${targetGuide.result.title}》与旅行记录的关联。`
        : `已取消收藏攻略《${targetGuide.result.title}》。`,
    );
  };

  const handleRestoreStore = (restoredStore: TravelStore) => {
    setStore(restoredStore);
    setMessage('数据导入成功，已按 ID 合并现有数据。');
  };

  return {
    activeUser: activeUser as UserProfile | undefined,
    handleSwitchUser,
    handleCreateUser,
    handleSubmitMarker,
    handleDeleteMarker,
    handleUpdateMarker,
    handleSaveGuide,
    handleAttachGuideToMarker,
    handleRemoveSavedGuide,
    handleRestoreStore,
  };
}
