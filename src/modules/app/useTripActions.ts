import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import { keepCurrentActiveUser } from './travelStoreActionHelpers';
import type { UseTravelStoreActionsArgs } from './useTravelStoreActions';

/**
 * Trip-domain actions extracted from the store actions hook.
 * 行程域动作：负责创建、编辑、删除行程，以及批量归属记录到行程。
 */
export function useTripActions({ store, setStore, setMessage }: UseTravelStoreActionsArgs) {
  const handleCreateTrip = async (input: {
    name: string;
    startsAt: string;
    endsAt: string;
    note?: string;
    coverImageUrl?: string;
  }) => {
    try {
      const nextStore = await remoteTravelStoreRepository.createTrip(input);
      setStore((current) => keepCurrentActiveUser(nextStore, current));
      setMessage(`已创建行程「${input.name}」，新增旅行记录时可以归入这个行程。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建行程失败，请稍后重试。');
    }
  };

  const handleUpdateTrip = async (
    tripId: string,
    input: {
      name?: string;
      startsAt?: string;
      endsAt?: string;
      note?: string;
      coverImageUrl?: string | null;
    },
  ) => {
    const currentTrip = store.trips?.find((item) => item.id === tripId);

    try {
      const nextStore = await remoteTravelStoreRepository.updateTrip(tripId, input);
      setStore((current) => keepCurrentActiveUser(nextStore, current));
      setMessage(`已更新行程「${input.name ?? currentTrip?.name ?? '当前行程'}」。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新行程失败，请稍后重试。');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const currentTrip = store.trips?.find((item) => item.id === tripId);

    try {
      const nextStore = await remoteTravelStoreRepository.deleteTrip(tripId);
      setStore((current) => keepCurrentActiveUser(nextStore, current));
      setMessage(`已删除行程「${currentTrip?.name ?? '当前行程'}」，相关记录已移回未归入行程。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除行程失败，请稍后重试。');
    }
  };

  const handleBulkAssignMarkersToTrip = async (markerIds: string[], tripId?: string | null) => {
    if (markerIds.length === 0) {
      setMessage('请先选择要整理的旅行记录。');
      return;
    }

    const targetTrip = tripId ? store.trips?.find((item) => item.id === tripId) : undefined;

    try {
      const nextStore = await remoteTravelStoreRepository.batchUpdateMarkersTrip({
        markerIds,
        tripId,
      });
      setStore((current) => keepCurrentActiveUser(nextStore, current));
      setMessage(
        tripId
          ? `已将 ${markerIds.length} 条记录归入行程「${targetTrip?.name ?? '当前行程'}」。`
          : `已将 ${markerIds.length} 条记录移回未归入行程。`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '批量整理行程失败，请稍后重试。');
    }
  };

  return {
    handleCreateTrip,
    handleUpdateTrip,
    handleDeleteTrip,
    handleBulkAssignMarkersToTrip,
  };
}
