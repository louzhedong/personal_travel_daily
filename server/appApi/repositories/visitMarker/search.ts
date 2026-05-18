// visitMarker 搜索路径 / Visit marker full-text search.
// 使用 MySQL 全文索引 + LIKE fallback，返回分页结果。
// Uses MySQL fulltext index with a LIKE fallback; returns paginated search results.
import { Prisma } from '@prisma/client';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
  type MarkerBudgetLevel,
  type MarkerMood,
  type MarkerTag,
  type MarkerTransport,
  type MarkerWeather,
} from '../../../../shared/markerMetadata.js';
import type { MarkerSearchRow, PrismaExecutor } from './types.js';

export type { MarkerSearchRow } from './types.js';

export async function searchActiveMarkersByAccountId(
  prisma: PrismaExecutor,
  input: {
    accountId: string;
    keyword?: string;
    companionId?: string;
    scope?: 'domestic' | 'international' | 'all';
    year?: string;
    tag?: MarkerTag;
    mood?: MarkerMood;
    weather?: MarkerWeather;
    transport?: MarkerTransport;
    budgetLevel?: MarkerBudgetLevel;
    page: number;
    pageSize: number;
  },
) {
  const offset = (input.page - 1) * input.pageSize;
  const normalizedKeyword = input.keyword?.trim() ?? '';
  const hasKeyword = normalizedKeyword.length > 0;
  const usesLikeFallback = normalizedKeyword.length > 0 && normalizedKeyword.length < 2;
  const likeKeyword = `%${normalizedKeyword.replace(/[%_\\]/g, '\\$&')}%`;
  const startOfYear = input.year ? new Date(`${input.year}-01-01T00:00:00.000Z`) : null;
  const startOfNextYear = input.year ? new Date(`${Number(input.year) + 1}-01-01T00:00:00.000Z`) : null;

  const whereParts: Prisma.Sql[] = [
    Prisma.sql`m.account_id = ${input.accountId}`,
    Prisma.sql`m.is_deleted = false`,
  ];

  if (input.companionId) {
    whereParts.push(Prisma.sql`m.companion_id = ${input.companionId}`);
  }

  if (input.scope && input.scope !== 'all') {
    whereParts.push(Prisma.sql`m.scope = ${input.scope}`);
  }

  if (startOfYear && startOfNextYear) {
    whereParts.push(Prisma.sql`m.visited_start_at >= ${startOfYear}`);
    whereParts.push(Prisma.sql`m.visited_start_at < ${startOfNextYear}`);
  }

  if (input.tag && /^[a-z0-9][a-z0-9_-]{1,31}$/.test(input.tag)) {
    whereParts.push(
      Prisma.sql`JSON_SEARCH(COALESCE(m.tags, JSON_ARRAY()), 'one', ${input.tag}) IS NOT NULL`,
    );
  }

  if (input.mood && MARKER_MOODS.includes(input.mood)) {
    whereParts.push(Prisma.sql`m.mood = ${input.mood}`);
  }

  if (input.weather && MARKER_WEATHERS.includes(input.weather)) {
    whereParts.push(Prisma.sql`m.weather = ${input.weather}`);
  }

  if (input.transport && MARKER_TRANSPORTS.includes(input.transport)) {
    whereParts.push(Prisma.sql`m.transport = ${input.transport}`);
  }

  if (input.budgetLevel && MARKER_BUDGET_LEVELS.includes(input.budgetLevel)) {
    whereParts.push(Prisma.sql`m.budget_level = ${input.budgetLevel}`);
  }

  if (hasKeyword) {
    whereParts.push(
      usesLikeFallback
        ? Prisma.sql`(m.scope_name LIKE ${likeKeyword} ESCAPE '\\' OR m.city LIKE ${likeKeyword} ESCAPE '\\' OR m.note LIKE ${likeKeyword} ESCAPE '\\')`
        : Prisma.sql`MATCH(m.scope_name, m.city, m.note) AGAINST (${normalizedKeyword} IN NATURAL LANGUAGE MODE)`,
    );
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`;
  const scoreSelect =
    hasKeyword && !usesLikeFallback
      ? Prisma.sql`MATCH(m.scope_name, m.city, m.note) AGAINST (${normalizedKeyword} IN NATURAL LANGUAGE MODE) AS searchScore`
      : Prisma.sql`0 AS searchScore`;

  const items = await prisma.$queryRaw<MarkerSearchRow[]>(
    Prisma.sql`
      SELECT
        m.id,
        m.account_id AS accountId,
        m.companion_id AS companionId,
        m.trip_id AS tripId,
        m.scope,
        m.scope_id AS scopeId,
        m.scope_name AS scopeName,
        m.city,
        m.note,
        m.tags,
        m.mood,
        m.weather,
        m.transport,
        m.budget_level AS budgetLevel,
        m.is_deleted AS isDeleted,
        m.visited_start_at AS visitedStartAt,
        m.visited_end_at AS visitedEndAt,
        m.created_at AS createdAt,
        m.updated_at AS updatedAt,
        m.deleted_at AS deletedAt,
        ${scoreSelect}
      FROM visit_markers m
      ${whereClause}
      ORDER BY searchScore DESC, m.visited_start_at DESC, m.created_at DESC
      LIMIT ${input.pageSize}
      OFFSET ${offset}
    `,
  );

  const countRows = await prisma.$queryRaw<Array<{ total: bigint }>>(
    Prisma.sql`
      SELECT COUNT(*) AS total
      FROM visit_markers m
      ${whereClause}
    `,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const markerIds = items.map((item) => item.id);
  const images =
    markerIds.length > 0
      ? await prisma.visitMarkerImage.findMany({
          where: {
            markerId: {
              in: markerIds,
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        })
      : [];
  const imagesByMarkerId = new Map<string, typeof images>();
  images.forEach((image) => {
    const markerImages = imagesByMarkerId.get(image.markerId) ?? [];
    markerImages.push(image);
    imagesByMarkerId.set(image.markerId, markerImages);
  });

  return {
    items: items.map((item) => ({
      ...item,
      images: imagesByMarkerId.get(item.id) ?? [],
    })),
    total,
  };
}
