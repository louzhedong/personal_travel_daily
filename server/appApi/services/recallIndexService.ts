import { randomUUID } from 'node:crypto';
import type { Prisma, RecallEventIndex } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { getPrismaClient } from '../prisma.js';
import type {
  RecallEventDto,
  RecallEventKindDto,
  RecallFacetCountDto,
  RecallFacetsDto,
  RecallQueryResponseDto,
  RecallRebuildResponseDto,
} from '../dto/recall.js';
import type { RecallQueryBody } from '../schemas/recall.js';

/**
 * G3 · Event-Centric Recall Service / 事件维度回想服务
 * Derives a unified event index from markers / photos / expenses / journals / guides.
 * Pure derived-table; rebuildable from source data, no FTS / vector dependencies.
 */

interface RawSourceRow {
  kind: RecallEventKindDto;
  sourceId: string;
  eventDate: Date;
  tripId: string | null;
  companionIds: string[];
  weather: string | null;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  tagSlugs: string[];
  title: string | null;
  city: string | null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

async function collectMarkerRows(accountId: string): Promise<RawSourceRow[]> {
  const prisma = getPrismaClient();
  const markers = await prisma.visitMarker.findMany({
    where: { accountId, isDeleted: false },
    select: {
      id: true,
      tripId: true,
      companionId: true,
      city: true,
      scopeName: true,
      visitedStartAt: true,
      mood: true,
      weather: true,
      latitude: true,
      longitude: true,
      tags: true,
      images: { select: { id: true, sortOrder: true, createdAt: true } },
    },
  });
  const rows: RawSourceRow[] = [];
  for (const marker of markers) {
    const companions = marker.companionId ? [marker.companionId] : [];
    rows.push({
      kind: 'marker',
      sourceId: marker.id,
      eventDate: marker.visitedStartAt,
      tripId: marker.tripId,
      companionIds: companions,
      weather: marker.weather,
      mood: marker.mood,
      latitude: marker.latitude ? Number(marker.latitude) : null,
      longitude: marker.longitude ? Number(marker.longitude) : null,
      tagSlugs: asStringArray(marker.tags),
      title: marker.scopeName,
      city: marker.city,
    });
    for (const image of marker.images) {
      rows.push({
        kind: 'photo',
        sourceId: image.id,
        eventDate: image.createdAt,
        tripId: marker.tripId,
        companionIds: companions,
        weather: marker.weather,
        mood: marker.mood,
        latitude: marker.latitude ? Number(marker.latitude) : null,
        longitude: marker.longitude ? Number(marker.longitude) : null,
        tagSlugs: asStringArray(marker.tags),
        title: marker.scopeName,
        city: marker.city,
      });
    }
  }
  return rows;
}

async function collectExpenseRows(accountId: string): Promise<RawSourceRow[]> {
  const prisma = getPrismaClient();
  const expenses = await prisma.tripExpense.findMany({
    where: { accountId, isDeleted: false },
    select: {
      id: true,
      tripId: true,
      companionId: true,
      title: true,
      category: true,
      spentAt: true,
    },
  });
  return expenses.map((expense) => ({
    kind: 'expense' as const,
    sourceId: expense.id,
    eventDate: expense.spentAt,
    tripId: expense.tripId,
    companionIds: expense.companionId ? [expense.companionId] : [],
    weather: null,
    mood: null,
    latitude: null,
    longitude: null,
    tagSlugs: expense.category ? [expense.category] : [],
    title: expense.title,
    city: null,
  }));
}

async function collectJournalRows(accountId: string): Promise<RawSourceRow[]> {
  const prisma = getPrismaClient();
  const entries = await prisma.journalEntry.findMany({
    where: { accountId },
    select: {
      id: true,
      tripId: true,
      bodyMd: true,
      entryDate: true,
      mood: true,
      weather: true,
    },
  });
  return entries.map((entry) => ({
    kind: 'journal' as const,
    sourceId: entry.id,
    eventDate: entry.entryDate,
    tripId: entry.tripId,
    companionIds: [],
    weather: entry.weather ?? null,
    mood: entry.mood ?? null,
    latitude: null,
    longitude: null,
    tagSlugs: [],
    title: entry.bodyMd ? entry.bodyMd.slice(0, 80) : null,
    city: null,
  }));
}

async function collectGuideRows(accountId: string): Promise<RawSourceRow[]> {
  const prisma = getPrismaClient();
  const guides = await prisma.savedGuide.findMany({
    where: { accountId, isDeleted: false },
    select: {
      id: true,
      savedByCompanionId: true,
      guideTitle: true,
      guideDestinationLabel: true,
      savedAt: true,
      marker: { select: { tripId: true } },
    },
  });
  return guides.map((guide) => ({
    kind: 'guide' as const,
    sourceId: guide.id,
    eventDate: guide.savedAt,
    tripId: guide.marker?.tripId ?? null,
    companionIds: guide.savedByCompanionId ? [guide.savedByCompanionId] : [],
    weather: null,
    mood: null,
    latitude: null,
    longitude: null,
    tagSlugs: [],
    title: guide.guideTitle,
    city: guide.guideDestinationLabel,
  }));
}

export async function rebuildRecallIndex(accountId: string): Promise<RecallRebuildResponseDto> {
  const prisma = getPrismaClient();
  const [markerRows, expenseRows, journalRows, guideRows] = await Promise.all([
    collectMarkerRows(accountId),
    collectExpenseRows(accountId),
    collectJournalRows(accountId),
    collectGuideRows(accountId),
  ]);
  const all = [...markerRows, ...expenseRows, ...journalRows, ...guideRows];
  await prisma.recallEventIndex.deleteMany({ where: { accountId } });
  if (all.length === 0) {
    return { rebuiltCount: 0, generatedAt: new Date().toISOString() };
  }
  const now = new Date();
  await prisma.recallEventIndex.createMany({
    data: all.map((row) => ({
      id: randomUUID(),
      accountId,
      eventDate: row.eventDate,
      kind: row.kind,
      sourceId: row.sourceId,
      tripId: row.tripId ?? null,
      companionIds: row.companionIds as unknown as Prisma.InputJsonValue,
      weather: row.weather,
      mood: row.mood,
      latitude: row.latitude,
      longitude: row.longitude,
      tagSlugs: row.tagSlugs as unknown as Prisma.InputJsonValue,
      title: row.title,
      city: row.city,
    })),
  });
  return { rebuiltCount: all.length, generatedAt: now.toISOString() };
}

function deserializeEvent(row: RecallEventIndex, tripName: string | null): RecallEventDto {
  return {
    id: row.id,
    kind: row.kind as RecallEventKindDto,
    sourceId: row.sourceId,
    eventDate: row.eventDate.toISOString(),
    tripId: row.tripId ?? null,
    tripName,
    title: row.title ?? null,
    city: row.city ?? null,
    weather: row.weather ?? null,
    mood: row.mood ?? null,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    companionIds: asStringArray(row.companionIds),
    tagSlugs: asStringArray(row.tagSlugs),
  };
}

function buildFacets(rows: RecallEventIndex[], companionLabels: Map<string, string>): RecallFacetsDto {
  const companions = new Map<string, number>();
  const weathers = new Map<string, number>();
  const moods = new Map<string, number>();
  const tags = new Map<string, number>();
  const cities = new Map<string, number>();
  for (const row of rows) {
    for (const companionId of asStringArray(row.companionIds)) {
      companions.set(companionId, (companions.get(companionId) ?? 0) + 1);
    }
    if (row.weather) weathers.set(row.weather, (weathers.get(row.weather) ?? 0) + 1);
    if (row.mood) moods.set(row.mood, (moods.get(row.mood) ?? 0) + 1);
    for (const tag of asStringArray(row.tagSlugs)) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
    if (row.city) cities.set(row.city, (cities.get(row.city) ?? 0) + 1);
  }
  function sortFacet(map: Map<string, number>, labelOf: (key: string) => string): RecallFacetCountDto[] {
    return Array.from(map.entries())
      .map(([value, count]) => ({ value, label: labelOf(value), count }))
      .sort((a, b) => b.count - a.count);
  }
  return {
    companions: sortFacet(companions, (id) => companionLabels.get(id) ?? id),
    weathers: sortFacet(weathers, (v) => v),
    moods: sortFacet(moods, (v) => v),
    tags: sortFacet(tags, (v) => v),
    cities: sortFacet(cities, (v) => v),
  };
}

export async function queryRecall(
  account: AuthenticatedAccount,
  filters: RecallQueryBody,
): Promise<RecallQueryResponseDto> {
  const prisma = getPrismaClient();
  const indexCount = await prisma.recallEventIndex.count({ where: { accountId: account.id } });
  if (indexCount === 0) {
    await rebuildRecallIndex(account.id);
  }
  const where: Prisma.RecallEventIndexWhereInput = { accountId: account.id };
  if (filters.kinds && filters.kinds.length > 0) {
    where.kind = { in: filters.kinds };
  }
  if (filters.startDate || filters.endDate) {
    where.eventDate = {};
    if (filters.startDate) where.eventDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.eventDate.lte = new Date(filters.endDate);
  }
  if (filters.weathers && filters.weathers.length > 0) {
    where.weather = { in: filters.weathers };
  }
  if (filters.moods && filters.moods.length > 0) {
    where.mood = { in: filters.moods };
  }
  if (filters.cities && filters.cities.length > 0) {
    where.city = { in: filters.cities };
  }
  if (filters.searchKeyword) {
    where.OR = [
      { title: { contains: filters.searchKeyword } },
      { city: { contains: filters.searchKeyword } },
    ];
  }
  const limit = filters.limit ?? 200;
  const rawRows = await prisma.recallEventIndex.findMany({
    where,
    orderBy: [{ eventDate: 'desc' }],
    take: limit * 2,
  });
  const filteredRows = rawRows.filter((row) => {
    if (filters.companionIds && filters.companionIds.length > 0) {
      const ids = asStringArray(row.companionIds);
      if (!filters.companionIds.some((c) => ids.includes(c))) return false;
    }
    if (filters.tagSlugs && filters.tagSlugs.length > 0) {
      const tags = asStringArray(row.tagSlugs);
      if (!filters.tagSlugs.some((t) => tags.includes(t))) return false;
    }
    return true;
  });
  const limited = filteredRows.slice(0, limit);

  const tripIds = Array.from(new Set(limited.map((r) => r.tripId).filter((v): v is string => !!v)));
  const companionIds = Array.from(
    new Set(filteredRows.flatMap((r) => asStringArray(r.companionIds))),
  );
  const [trips, companions] = await Promise.all([
    tripIds.length > 0
      ? prisma.trip.findMany({ where: { id: { in: tripIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    companionIds.length > 0
      ? prisma.travelCompanion.findMany({
          where: { id: { in: companionIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as Array<{ id: string; name: string }>),
  ]);
  const tripById = new Map(trips.map((t) => [t.id, t.name]));
  const companionById = new Map(companions.map((c) => [c.id, c.name]));

  const events = limited.map((row) =>
    deserializeEvent(row, row.tripId ? tripById.get(row.tripId) ?? null : null),
  );

  const monthCounts = new Map<string, number>();
  for (const row of limited) {
    const key = row.eventDate.toISOString().slice(0, 7);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const groupsByMonth = Array.from(monthCounts.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, count]) => ({ month, count }));

  return {
    total: filteredRows.length,
    events,
    facets: buildFacets(filteredRows, companionById),
    groupsByMonth,
  };
}
