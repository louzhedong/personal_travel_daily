// visitMarker 批量路径 / Visit marker batch mutations.
// 批量更新 trip 归属等操作。
// Batch updates such as re-assigning markers to a trip.
import type { PrismaExecutor } from './types.js';

export async function updateMarkersTripId(
  prisma: PrismaExecutor,
  markerIds: string[],
  tripId: string | null,
) {
  if (markerIds.length === 0) {
    return { count: 0 };
  }

  return prisma.visitMarker.updateMany({
    where: {
      id: {
        in: markerIds,
      },
      isDeleted: false,
    },
    data: {
      tripId,
    },
  });
}
