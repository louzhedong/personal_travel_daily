// bootstrap serializer - companions / 旅伴序列化。
// bootstrap serializer - companion (traveler) serialization.
import type { TravelCompanion } from '@prisma/client';
import type { UserProfileDto } from '../../types.js';

export function serializeCompanion(companion: TravelCompanion): UserProfileDto {
  return {
    id: companion.id,
    name: companion.name,
    color: companion.color,
  };
}
