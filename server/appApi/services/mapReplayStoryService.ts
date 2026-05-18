import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { getStatsOverviewSource } from '../repositories/statsRepository.js';
import { serializeMapReplayStory } from '../serializers/mapReplayStorySerializer.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { MapReplayStoryResponseDto } from '../types.js';
import type { RawCompanion, RawMarker, RawTrip } from './stats/aggregator.js';

function assertSource<T>(value: T | undefined | null, message: string): asserts value is T {
  if (!value) {
    throw createNotFoundError(message);
  }
}

function yearOf(marker: RawMarker) {
  return String(marker.visitedStartAt.getFullYear());
}

function tripSubtitle(trip: RawTrip) {
  return `${trip.startsAt.toISOString().slice(0, 10)} - ${trip.endsAt.toISOString().slice(0, 10)}`;
}

async function getReplaySource(account: AuthenticatedAccount) {
  const source = await getStatsOverviewSource(getPrismaClient(), account.id);
  assertSource(source, 'account not found');
  return source;
}

export async function getTripMapReplayStory(
  account: AuthenticatedAccount,
  tripId: string,
): Promise<MapReplayStoryResponseDto> {
  const source = await getReplaySource(account);
  const trip = source.trips.find((item) => item.id === tripId);
  assertSource(trip, 'trip not found');
  const markers = source.markers.filter((marker) => marker.tripId === tripId);

  return serializeMapReplayStory({
    target: {
      type: 'trip',
      id: trip.id,
      label: trip.name,
      subtitle: tripSubtitle(trip),
    },
    markers,
    companions: source.companions,
    trips: source.trips,
    sourceLinks: [{ label: '打开行程故事', path: `/trips/${encodeURIComponent(tripId)}/story` }],
    generatedAt: new Date(),
  });
}

export async function getYearMapReplayStory(
  account: AuthenticatedAccount,
  year: string,
): Promise<MapReplayStoryResponseDto> {
  if (!/^\d{4}$/.test(year)) {
    throw createNotFoundError('year not found');
  }
  const source = await getReplaySource(account);
  const markers = source.markers.filter((marker) => yearOf(marker) === year);

  return serializeMapReplayStory({
    target: {
      type: 'year',
      id: year,
      label: `${year} 年度回放`,
      subtitle: `${account.name} 的年度地图回放故事`,
    },
    markers,
    companions: source.companions,
    trips: source.trips,
    sourceLinks: [{ label: '打开年度回顾', path: `/yearbook/${encodeURIComponent(year)}` }],
    generatedAt: new Date(),
  });
}

export async function getCompanionMapReplayStory(
  account: AuthenticatedAccount,
  companionId: string,
): Promise<MapReplayStoryResponseDto> {
  const source = await getReplaySource(account);
  const companion = source.companions.find((item) => item.id === companionId);
  assertSource(companion, 'companion not found');
  const markers = source.markers.filter((marker) => marker.companionId === companionId);

  return serializeMapReplayStory({
    target: {
      type: 'companion',
      id: companion.id,
      label: `和 ${companion.name} 的地图回放`,
      subtitle: '共同旅行路线与回忆素材',
    },
    markers,
    companions: source.companions,
    trips: source.trips,
    sourceLinks: [{ label: '打开共同回忆', path: `/companions/${encodeURIComponent(companionId)}/memories` }],
    generatedAt: new Date(),
  });
}
