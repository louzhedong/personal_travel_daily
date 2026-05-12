import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { getStatsOverviewSource } from '../repositories/statsRepository.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { AtlasTimelineResponseDto } from '../types.js';
import type { AtlasTimelineQuery } from '../schemas/atlas.js';
import { applyAtlasFilters } from './atlas/filters.js';
import { buildAtlasReplayItems } from './atlas/replay.js';
import { buildAtlasPlaceIndex } from './atlas/placeIndex.js';
import { buildAtlasCompare } from './atlas/compare.js';
import { buildAvailableYears, toDateOnlyString, type RawCompanion, type RawTrip } from './stats/aggregator.js';
import { serializeAtlasTimelineResponse } from '../serializers/atlasSerializer.js';

function assertCompanionExists(companions: RawCompanion[], companionId?: string) {
  if (!companionId) return;
  if (!companions.some((companion) => companion.id === companionId)) {
    throw createNotFoundError('companion not found');
  }
}

function assertTripExists(trips: RawTrip[], tripId?: string) {
  if (!tripId || tripId === 'unassigned') return;
  if (!trips.some((trip) => trip.id === tripId)) {
    throw createNotFoundError('trip not found');
  }
}

export async function getAtlasTimeline(
  account: AuthenticatedAccount,
  query: AtlasTimelineQuery,
): Promise<AtlasTimelineResponseDto> {
  const prisma = getPrismaClient();
  const source = await getStatsOverviewSource(prisma, account.id);

  if (!source) {
    throw createNotFoundError('account not found');
  }

  assertCompanionExists(source.companions, query.companionId);
  assertTripExists(source.trips, query.tripId);

  const filteredMarkers = applyAtlasFilters(source.markers, query);
  const replay = buildAtlasReplayItems(filteredMarkers, source.companions, source.trips);
  const placeIndex = buildAtlasPlaceIndex(filteredMarkers);
  const compare = buildAtlasCompare(filteredMarkers, source.companions);

  return serializeAtlasTimelineResponse({
    query,
    availableYears: buildAvailableYears(source.markers),
    companions: source.companions.map((companion) => ({
      id: companion.id,
      name: companion.name,
      color: companion.color,
    })),
    trips: source.trips.map((trip) => ({
      id: trip.id,
      name: trip.name,
      startsAt: toDateOnlyString(trip.startsAt),
      endsAt: toDateOnlyString(trip.endsAt),
    })),
    markers: filteredMarkers,
    replay,
    placeIndex,
    compare,
    generatedAt: new Date(),
  });
}
