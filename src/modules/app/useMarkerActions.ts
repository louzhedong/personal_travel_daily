import type { MarkerFormValue } from '../../components/MarkerForm';
import { resolveMapRegionId } from '../../lib/mapRegionResolver';
import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import { keepCurrentActiveUser } from './travelStoreActionHelpers';
import type { UseTravelStoreActionsArgs } from './useTravelStoreActions';

/**
 * Marker-domain actions extracted from the store actions hook.
 * 旅行记录域动作：负责新增、更新、删除旅行记录，并维护地图聚焦与面板状态。
 */
export function useMarkerActions({
  store,
  setStore,
  setMessage,
  setSaving,
  setSelectedRegionId,
  setMarkerModalOpen,
  setDetailMarkerId,
}: UseTravelStoreActionsArgs) {
  const activeUser = store.users.find((item) => item.id === store.activeUserId) ?? store.users[0];

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

      setStore((current) => keepCurrentActiveUser(nextStore, current));
      setSelectedRegionId(
        resolveMapRegionId(
          {
            scope: value.scope,
            scopeId: value.scopeId,
            scopeName: value.scopeName,
          },
          value.scope,
        ),
      );
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
      setStore((current) => keepCurrentActiveUser(nextStore, current));
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
      setStore((current) => keepCurrentActiveUser(nextStore, current));
      setMessage(`已更新 ${target.scopeName} · ${target.city} 的旅行记录。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新旅行记录失败，请稍后重试。');
    }
  };

  return {
    handleSubmitMarker,
    handleDeleteMarker,
    handleUpdateMarker,
  };
}
