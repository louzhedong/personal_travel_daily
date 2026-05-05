import { fetchSession } from '../../lib/api/authApi';
import type { UpdateWishlistItemInput } from '../../lib/api/types';
import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import type { GuideSearchResult, Scope, WishlistItem, WishlistPriority } from '../../types';
import type { UseTravelStoreActionsArgs } from './useTravelStoreActions';

interface WishlistDraft {
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority?: WishlistPriority;
  targetYear?: string | null;
}

type WishlistUpdate = UpdateWishlistItemInput;

function isSameWishlistPlace(item: WishlistItem, draft: WishlistDraft, activeUserId: string) {
  return (
    item.companionId === activeUserId &&
    item.scope === draft.scope &&
    item.scopeId === draft.scopeId &&
    item.city.trim().toLowerCase() === draft.city.trim().toLowerCase()
  );
}

export function useWishlistActions({ store, setStore, showToast }: UseTravelStoreActionsArgs) {
  const handleWishlistError = (error: unknown, fallbackMessage: string) => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    showToast(message, 'error');
  };

  const handleCreateWishlistItem = async (draft: WishlistDraft, guide?: GuideSearchResult) => {
    try {
      const session = await fetchSession();
      if (!session.account) {
        showToast('登录状态已失效，请重新登录后再试。', 'error');
        return undefined;
      }

      const duplicate = (store.wishlistItems ?? []).find((item) => isSameWishlistPlace(item, draft, store.activeUserId));
      if (duplicate) {
        showToast(`愿望地图里已经有 ${duplicate.scopeName} · ${duplicate.city}。`, 'info');
        return duplicate;
      }

      const item = await remoteTravelStoreRepository.createWishlistItem({
        companionId: store.activeUserId,
        title: draft.title,
        scope: draft.scope,
        scopeId: draft.scopeId,
        scopeName: draft.scopeName,
        city: draft.city,
        note: draft.note,
        priority: draft.priority ?? 'medium',
        targetYear: draft.targetYear ?? null,
        guide: guide
          ? {
              identity: guide.sourceUrl,
              title: guide.title,
              sourceName: guide.sourceName,
              sourceUrl: guide.sourceUrl,
            }
          : undefined,
      });

      setStore((current) => ({
        ...current,
        wishlistItems: [item, ...(current.wishlistItems ?? [])],
      }));
      showToast(`已加入愿望地图：${item.scopeName} · ${item.city}。`, 'success');
      return item;
    } catch (error) {
      handleWishlistError(error, '加入愿望地图失败，请稍后重试。');
      throw error;
    }
  };

  const handleUpdateWishlistItem = async (wishlistId: string, input: WishlistUpdate) => {
    try {
      const updated = await remoteTravelStoreRepository.updateWishlistItem(wishlistId, input);
      setStore((current) => ({
        ...current,
        wishlistItems: (current.wishlistItems ?? []).map((item) => (item.id === wishlistId ? updated : item)),
      }));
      showToast(`已更新愿望：${updated.scopeName} · ${updated.city}。`, 'success');
      return updated;
    } catch (error) {
      handleWishlistError(error, '更新愿望失败，请稍后重试。');
      throw error;
    }
  };

  const handleConvertWishlistItemToTrip = async (wishlistId: string) => {
    const target = store.wishlistItems?.find((item) => item.id === wishlistId);
    if (!target) {
      return undefined;
    }

    try {
      const response = await remoteTravelStoreRepository.convertWishlistToTrip(wishlistId);
      setStore(response.store);
      showToast(`已创建行程：${target.title}。`, 'success');
      return response.tripId;
    } catch (error) {
      handleWishlistError(error, '从愿望创建行程失败，请稍后重试。');
      throw error;
    }
  };

  const handleDeleteWishlistItem = async (wishlistId: string) => {
    const target = store.wishlistItems?.find((item) => item.id === wishlistId);
    if (!target) {
      return;
    }

    try {
      await remoteTravelStoreRepository.deleteWishlistItem(wishlistId);
      setStore((current) => ({
        ...current,
        wishlistItems: (current.wishlistItems ?? []).filter((item) => item.id !== wishlistId),
      }));
      showToast(`已从愿望地图移除 ${target.scopeName} · ${target.city}。`, 'success');
    } catch (error) {
      handleWishlistError(error, '移除愿望失败，请稍后重试。');
    }
  };

  return {
    handleCreateWishlistItem,
    handleUpdateWishlistItem,
    handleConvertWishlistItemToTrip,
    handleDeleteWishlistItem,
  };
}
