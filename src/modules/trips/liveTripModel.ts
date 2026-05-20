import type { TripDetailResponseDto } from '../../lib/api/types';

export function getLiveTripLabel(trip: TripDetailResponseDto['trip']) {
  const start = new Date(trip.startsAt);
  const end = new Date(trip.endsAt);
  const today = new Date();
  const total = Math.max(1, Math.floor((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86400000) + 1);
  const current = Math.min(total, Math.max(1, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86400000) + 1));
  return `Day ${current} of ${total}`;
}
