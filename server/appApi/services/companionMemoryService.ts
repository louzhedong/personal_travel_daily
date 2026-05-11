import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  findCompanionMemorySnapshot,
  findCompanionMemorySource,
  upsertCompanionMemorySnapshot,
} from '../repositories/companionMemoryRepository.js';
import {
  COMPANION_MEMORY_SNAPSHOT_VERSION,
  parseCompanionMemorySnapshotPayload,
  serializeCompanionMemory,
  type CompanionMemoryModel,
} from '../serializers/companionMemorySerializer.js';
import {
  normalizeMarkerBudgetLevel,
  normalizeMarkerMood,
  normalizeMarkerTags,
  normalizeMarkerTransport,
} from '../serializers/bootstrap/markers.js';
import type { CompanionMemoryResponseDto } from '../types.js';

export const COMPANION_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;

type CompanionMemorySource = NonNullable<Awaited<ReturnType<typeof findCompanionMemorySource>>>;
type CompanionMemoryMarker = CompanionMemorySource['markers'][number];
type CompanionMemoryGuide = CompanionMemorySource['guides'][number] | CompanionMemoryMarker['savedGuides'][number];

const TAG_LABELS: Record<string, string> = {
  food: '美食',
  hiking: '徒步',
  beach: '海边',
  museum: '博物馆',
  photography: '摄影',
  family: '亲子',
  weekend: '周末',
  business: '出差',
  nature: '自然风景',
  citywalk: '城市漫游',
};

const MOOD_LABELS: Record<string, string> = {
  relaxed: '松弛',
  excited: '兴奋',
  tired: '疲惫',
  surprised: '惊喜',
  peaceful: '平静',
};

const TRANSPORT_LABELS: Record<string, string> = {
  walk: '步行',
  car: '自驾',
  train: '火车',
  plane: '飞机',
  metro: '地铁',
  bus: '巴士',
};

const BUDGET_LABELS: Record<string, string> = {
  low: '轻预算',
  medium: '舒适预算',
  high: '高预算',
};

function enumerateDateKeys(startAt: Date, endAt: Date) {
  const start = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()));
  const end = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth(), endAt.getUTCDate()));
  const keys: string[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    keys.push(cursor.toISOString().slice(0, 10));
  }

  return keys;
}

function countTravelDays(markers: CompanionMemoryMarker[]) {
  const days = new Set<string>();
  markers.forEach((marker) => {
    enumerateDateKeys(marker.visitedStartAt, marker.visitedEndAt).forEach((day) => days.add(day));
  });
  return days.size;
}

function getYear(value: Date) {
  return value.toISOString().slice(0, 4);
}

function getPhotoCount(markers: CompanionMemoryMarker[]) {
  return markers.reduce((total, marker) => total + marker.images.length, 0);
}

function sortByCountThenLabel<T extends { markerCount: number }>(items: T[], getLabel: (item: T) => string) {
  return [...items].sort((left, right) => {
    if (right.markerCount !== left.markerCount) {
      return right.markerCount - left.markerCount;
    }
    return getLabel(left).localeCompare(getLabel(right));
  });
}

function buildYearlySeries(markers: CompanionMemoryMarker[]): CompanionMemoryModel['yearlySeries'] {
  const years = new Map<string, { year: string; markerCount: number; photoCount: number; markers: CompanionMemoryMarker[] }>();
  markers.forEach((marker) => {
    const year = getYear(marker.visitedStartAt);
    const current = years.get(year) ?? { year, markerCount: 0, photoCount: 0, markers: [] };
    current.markerCount += 1;
    current.photoCount += marker.images.length;
    current.markers.push(marker);
    years.set(year, current);
  });

  return Array.from(years.values())
    .sort((left, right) => left.year.localeCompare(right.year))
    .map((item) => ({
      year: item.year,
      markerCount: item.markerCount,
      photoCount: item.photoCount,
      travelDays: countTravelDays(item.markers),
    }));
}

function buildTopRegions(markers: CompanionMemoryMarker[]): CompanionMemoryModel['topRegions'] {
  const regions = new Map<string, CompanionMemoryModel['topRegions'][number]>();
  markers.forEach((marker) => {
    const key = `${marker.scope}:${marker.scopeId}`;
    const current = regions.get(key) ?? {
      scope: marker.scope,
      scopeId: marker.scopeId,
      scopeName: marker.scopeName,
      markerCount: 0,
    };
    current.markerCount += 1;
    regions.set(key, current);
  });

  return sortByCountThenLabel(Array.from(regions.values()), (item) => item.scopeName).slice(0, 8);
}

function buildTopCities(markers: CompanionMemoryMarker[]): CompanionMemoryModel['topCities'] {
  const cities = new Map<string, CompanionMemoryModel['topCities'][number]>();
  markers.forEach((marker) => {
    const key = `${marker.scope}:${marker.scopeId}:${marker.city}`;
    const current = cities.get(key) ?? {
      scope: marker.scope,
      scopeId: marker.scopeId,
      scopeName: marker.scopeName,
      city: marker.city,
      markerCount: 0,
    };
    current.markerCount += 1;
    cities.set(key, current);
  });

  return sortByCountThenLabel(Array.from(cities.values()), (item) => `${item.scopeName}${item.city}`).slice(0, 10);
}

function bumpTheme(
  counts: Map<string, CompanionMemoryModel['themes'][number]>,
  type: CompanionMemoryModel['themes'][number]['type'],
  value: string | undefined,
  labels: Record<string, string>,
) {
  if (!value) {
    return;
  }
  const key = `${type}:${value}`;
  const current = counts.get(key) ?? {
    type,
    value,
    label: labels[value] ?? value,
    markerCount: 0,
  };
  current.markerCount += 1;
  counts.set(key, current);
}

function buildThemes(markers: CompanionMemoryMarker[]): CompanionMemoryModel['themes'] {
  const counts = new Map<string, CompanionMemoryModel['themes'][number]>();
  markers.forEach((marker) => {
    normalizeMarkerTags(marker.tags)?.forEach((tag) => bumpTheme(counts, 'tag', tag, TAG_LABELS));
    bumpTheme(counts, 'mood', normalizeMarkerMood(marker.mood), MOOD_LABELS);
    bumpTheme(counts, 'transport', normalizeMarkerTransport(marker.transport), TRANSPORT_LABELS);
    bumpTheme(counts, 'budgetLevel', normalizeMarkerBudgetLevel(marker.budgetLevel), BUDGET_LABELS);
  });

  return sortByCountThenLabel(Array.from(counts.values()), (item) => item.label).slice(0, 10);
}

function buildTrips(markers: CompanionMemoryMarker[]): CompanionMemoryModel['trips'] {
  const trips = new Map<string, CompanionMemoryModel['trips'][number] & { latestAt: Date }>();
  markers.forEach((marker) => {
    if (!marker.trip || marker.trip.isDeleted) {
      return;
    }
    const current = trips.get(marker.trip.id) ?? {
      tripId: marker.trip.id,
      tripName: marker.trip.name,
      startsAt: marker.trip.startsAt,
      endsAt: marker.trip.endsAt,
      coverImageUrl: marker.trip.coverImageUrl ?? undefined,
      note: marker.trip.note,
      markerCount: 0,
      photoCount: 0,
      latestAt: marker.visitedStartAt,
    };
    current.markerCount += 1;
    current.photoCount += marker.images.length;
    if (marker.visitedStartAt > current.latestAt) {
      current.latestAt = marker.visitedStartAt;
    }
    if (!current.coverImageUrl) {
      current.coverImageUrl = marker.images[0]?.imageUrl;
    }
    trips.set(marker.trip.id, current);
  });

  return Array.from(trips.values())
    .sort((left, right) => {
      if (right.markerCount !== left.markerCount) {
        return right.markerCount - left.markerCount;
      }
      return right.latestAt.getTime() - left.latestAt.getTime();
    })
    .slice(0, 8)
    .map(({ latestAt: _latestAt, ...trip }) => trip);
}

function buildPhotos(markers: CompanionMemoryMarker[]): CompanionMemoryModel['photos'] {
  return markers
    .flatMap((marker) =>
      marker.images.map((image) => ({
        imageId: image.id,
        markerId: marker.id,
        imageUrl: image.imageUrl,
        markerTitle: `${marker.scopeName} · ${marker.city}`,
        scopeName: marker.scopeName,
        city: marker.city,
        visitedStartAt: marker.visitedStartAt,
        isFeatured: image.isFeatured,
        caption: image.caption ?? undefined,
        curatedSortOrder: image.curatedSortOrder,
        sortOrder: image.sortOrder,
      })),
    )
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }
      const leftCurated = left.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      const rightCurated = right.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      if (leftCurated !== rightCurated) {
        return leftCurated - rightCurated;
      }
      const dateCompare = right.visitedStartAt.getTime() - left.visitedStartAt.getTime();
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return left.sortOrder - right.sortOrder;
    })
    .slice(0, 12)
    .map(({ curatedSortOrder: _curatedSortOrder, sortOrder: _sortOrder, ...photo }) => photo);
}

function serializeGuide(guide: CompanionMemoryGuide): CompanionMemoryModel['guides'][number] {
  return {
    id: guide.id,
    markerId: guide.markerId ?? undefined,
    keyword: guide.keyword,
    title: guide.guideTitle,
    summary: guide.guideSummary,
    sourceName: guide.guideSourceName,
    sourceUrl: guide.guideSourceUrl,
    coverImageUrl: guide.guideCoverImageUrl ?? undefined,
    savedAt: guide.savedAt,
  };
}

function buildGuides(source: CompanionMemorySource): CompanionMemoryModel['guides'] {
  const guides = new Map<string, CompanionMemoryModel['guides'][number]>();
  const allGuides = [
    ...source.guides,
    ...source.markers.flatMap((marker) => marker.savedGuides),
  ];

  allGuides.forEach((guide) => {
    const key = `${guide.guideIdentity}:${guide.saveContextKey}`;
    const serialized = serializeGuide(guide);
    const current = guides.get(key);
    if (!current || serialized.savedAt.getTime() > current.savedAt.getTime()) {
      guides.set(key, serialized);
    }
  });

  return Array.from(guides.values())
    .sort((left, right) => right.savedAt.getTime() - left.savedAt.getTime())
    .slice(0, 8);
}

function countSourceGuides(source: CompanionMemorySource) {
  if (source.guides.length > 0) {
    return source.guides.length;
  }

  return new Set(
    source.markers
      .flatMap((marker) => marker.savedGuides)
      .map((guide) => `${guide.guideIdentity}:${guide.saveContextKey}`),
  ).size;
}

function buildHeadline(source: CompanionMemorySource, markers: CompanionMemoryMarker[], topCities: CompanionMemoryModel['topCities']) {
  if (markers.length === 0) {
    return `还没有和 ${source.name} 留下旅行记录，下一次出发后这里会自动整理共同回忆。`;
  }

  const topCity = topCities[0];
  if (topCity) {
    return `你们一起留下了 ${markers.length} 段旅行记忆，最常出现的地方是 ${topCity.city}。`;
  }

  return `你们一起留下了 ${markers.length} 段旅行记忆，正在慢慢长成一本共同旅行册。`;
}

function buildMilestones(
  source: CompanionMemorySource,
  markers: CompanionMemoryMarker[],
  yearlySeries: CompanionMemoryModel['yearlySeries'],
  topCities: CompanionMemoryModel['topCities'],
): CompanionMemoryModel['milestones'] {
  if (markers.length === 0) {
    return [
      {
        id: 'empty-start',
        title: '共同回忆等待开启',
        description: `和 ${source.name} 的第一段旅行记录会出现在这里。`,
      },
    ];
  }

  const firstMarker = markers[0];
  const latestMarker = markers[markers.length - 1];
  const busiestYear = [...yearlySeries].sort((left, right) => right.markerCount - left.markerCount)[0];
  const topCity = topCities[0];
  const milestones: CompanionMemoryModel['milestones'] = [
    {
      id: 'first-shared-memory',
      title: '第一段共同记忆',
      description: `从 ${firstMarker.scopeName} · ${firstMarker.city} 开始，你们的同行故事被记录下来。`,
      happenedAt: firstMarker.visitedStartAt,
    },
  ];

  if (busiestYear) {
    milestones.push({
      id: 'busiest-year',
      title: `${busiestYear.year} 是最密集的一年`,
      description: `这一年一起留下 ${busiestYear.markerCount} 条记录，覆盖 ${busiestYear.travelDays} 天。`,
    });
  }

  if (topCity) {
    milestones.push({
      id: 'favorite-city',
      title: `最常一起出现的城市是 ${topCity.city}`,
      description: `这里累计出现 ${topCity.markerCount} 条共同记录，是你们共同地图上的高频坐标。`,
    });
  }

  milestones.push({
    id: 'latest-shared-memory',
    title: '最近一次同行',
    description: `最近一段共同记忆停在 ${latestMarker.scopeName} · ${latestMarker.city}。`,
    happenedAt: latestMarker.visitedStartAt,
  });

  return milestones;
}

function buildCompanionMemoryModel(source: CompanionMemorySource, generatedAt: Date, expiresAt: Date): CompanionMemoryModel {
  const markers = source.markers;
  const photos = buildPhotos(markers);
  const guides = buildGuides(source);
  const sourceGuideCount = countSourceGuides(source);
  const topCities = buildTopCities(markers);
  const yearlySeries = buildYearlySeries(markers);
  const regions = buildTopRegions(markers);
  const sourcePhotoCount = getPhotoCount(markers);
  const firstMarker = markers[0];
  const latestMarker = markers[markers.length - 1];

  return {
    companion: {
      id: source.id,
      name: source.name,
      color: source.color,
    },
    summary: {
      markerCount: markers.length,
      travelDays: countTravelDays(markers),
      tripCount: new Set(markers.filter((marker) => marker.trip && !marker.trip.isDeleted).map((marker) => marker.tripId)).size,
      cityCount: new Set(markers.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)).size,
      regionCount: new Set(markers.map((marker) => `${marker.scope}:${marker.scopeId}`)).size,
      photoCount: sourcePhotoCount,
      guideCount: sourceGuideCount,
      firstSharedAt: firstMarker?.visitedStartAt,
      latestSharedAt: latestMarker?.visitedStartAt,
      headline: buildHeadline(source, markers, topCities),
    },
    yearlySeries,
    topRegions: regions,
    topCities,
    themes: buildThemes(markers),
    trips: buildTrips(markers),
    photos,
    guides,
    milestones: buildMilestones(source, markers, yearlySeries, topCities),
    snapshot: {
      generatedAt,
      expiresAt,
      stale: false,
      sourceMarkerCount: markers.length,
      sourcePhotoCount,
      sourceGuideCount,
    },
  };
}

function withSnapshotMeta(
  response: CompanionMemoryResponseDto,
  snapshot: {
    generatedAt: Date;
    expiresAt: Date;
    sourceMarkerCount: number;
    sourcePhotoCount: number;
    sourceGuideCount: number;
  },
): CompanionMemoryResponseDto {
  return {
    ...response,
    snapshot: {
      generatedAt: snapshot.generatedAt.toISOString(),
      expiresAt: snapshot.expiresAt.toISOString(),
      stale: false,
      sourceMarkerCount: snapshot.sourceMarkerCount,
      sourcePhotoCount: snapshot.sourcePhotoCount,
      sourceGuideCount: snapshot.sourceGuideCount,
    },
  };
}

async function rebuildCompanionMemory(accountId: string, companionId: string, now = new Date()) {
  const prisma = getPrismaClient();
  const source = await findCompanionMemorySource(prisma, accountId, companionId);
  if (!source) {
    throw createNotFoundError('companion not found');
  }

  const expiresAt = new Date(now.getTime() + COMPANION_MEMORY_TTL_MS);
  const response = serializeCompanionMemory(buildCompanionMemoryModel(source, now, expiresAt));
  await upsertCompanionMemorySnapshot(prisma, {
    id: randomUUID(),
    accountId,
    companionId,
    snapshotVersion: COMPANION_MEMORY_SNAPSHOT_VERSION,
    payloadJson: response as unknown as Prisma.InputJsonValue,
    sourceMarkerCount: response.snapshot.sourceMarkerCount,
    sourcePhotoCount: response.snapshot.sourcePhotoCount,
    sourceGuideCount: response.snapshot.sourceGuideCount,
    generatedAt: now,
    expiresAt,
  });

  return response;
}

export async function getCompanionMemory(accountId: string, companionId: string) {
  const prisma = getPrismaClient();
  const now = new Date();
  const snapshot = await findCompanionMemorySnapshot(prisma, accountId, companionId);

  if (snapshot && snapshot.snapshotVersion === COMPANION_MEMORY_SNAPSHOT_VERSION && snapshot.expiresAt > now) {
    const parsed = parseCompanionMemorySnapshotPayload(snapshot.payloadJson);
    if (parsed) {
      return withSnapshotMeta(parsed, snapshot);
    }
  }

  return rebuildCompanionMemory(accountId, companionId, now);
}

export async function refreshCompanionMemory(accountId: string, companionId: string) {
  return rebuildCompanionMemory(accountId, companionId);
}
