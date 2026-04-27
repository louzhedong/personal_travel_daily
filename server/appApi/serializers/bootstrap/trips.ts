// bootstrap serializer - trips / 行程序列化。
// bootstrap serializer - trip collection serialization.
import type { Trip } from '@prisma/client';
import type { TripDto } from '../../types.js';
import { toDateOnlyString, toIsoString } from './shared.js';

export function serializeTrip(trip: Trip): TripDto {
  return {
    id: trip.id,
    name: trip.name,
    coverImageUrl: trip.coverImageUrl ?? undefined,
    note: trip.note,
    startsAt: toDateOnlyString(trip.startsAt),
    endsAt: toDateOnlyString(trip.endsAt),
    createdAt: toIsoString(trip.createdAt),
  };
}
