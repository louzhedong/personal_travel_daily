import { randomUUID } from 'node:crypto';
import type { Prisma, RhythmPortraitSnapshot } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { getPrismaClient } from '../prisma.js';
import type {
  RhythmBudgetTierDto,
  RhythmPortraitActionResponseDto,
  RhythmPortraitDto,
  RhythmThemeMixDto,
  RhythmTopMonthDto,
  RhythmTopTransportDto,
} from '../dto/rhythmPortrait.js';

/**
 * G5 · Travel Rhythm Portrait Service / 旅行节奏画像服务
 * 纯统计学聚合：跨年度抽出旅行指纹，不调 LLM、不出网。
 */

const MIN_WINDOW_YEARS = 2;

const MONTH_LABELS_ZH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

interface AggregateInput {
  trips: Array<{ id: string; startsAt: Date; endsAt: Date }>;
  markers: Array<{
    id: string;
    transport: string | null;
    tags: Prisma.JsonValue;
    visitedStartAt: Date;
    companionId: string | null;
    budgetLevel: string | null;
  }>;
  expenses: Array<{ amountCents: number }>;
}

interface AggregateResult {
  windowYears: string;
  windowYearCount: number;
  topMonths: RhythmTopMonthDto[];
  topTransports: RhythmTopTransportDto[];
  avgTripDays: number;
  budgetTier: RhythmBudgetTierDto;
  themeMix: RhythmThemeMixDto;
  companionDiversityIndex: number;
  totalTripCount: number;
  totalMarkerCount: number;
}

function asTagSlugs(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function classifyTheme(tags: string[]): keyof RhythmThemeMixDto | null {
  const joined = tags.join(' ').toLowerCase();
  if (/食|吃|餐|coffee|food|cafe/i.test(joined)) return 'food';
  if (/景|view|风景|拍|photo|sunset/i.test(joined)) return 'scenery';
  if (/史|博物|古|history|temple|museum/i.test(joined)) return 'history';
  if (/疗|放松|spa|温泉|healing|rest/i.test(joined)) return 'healing';
  if (/山|海|湖|forest|nature|hike|户外/i.test(joined)) return 'nature';
  return null;
}

function pickBudgetTier(avgPerTripCents: number): RhythmBudgetTierDto {
  if (avgPerTripCents < 200_000) return 'frugal';
  if (avgPerTripCents < 800_000) return 'balanced';
  if (avgPerTripCents < 2_000_000) return 'comfort';
  return 'lavish';
}

function aggregate(input: AggregateInput): AggregateResult {
  const totalTripCount = input.trips.length;
  const totalMarkerCount = input.markers.length;

  // window
  const years = new Set<number>();
  for (const trip of input.trips) {
    years.add(trip.startsAt.getFullYear());
    years.add(trip.endsAt.getFullYear());
  }
  const sortedYears = Array.from(years).sort((a, b) => a - b);
  const windowYears =
    sortedYears.length === 0
      ? `${new Date().getFullYear()}`
      : `${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}`;
  const windowYearCount = sortedYears.length;

  // top months by markers visitedStartAt
  const monthCounts = new Array(12).fill(0);
  for (const marker of input.markers) {
    monthCounts[marker.visitedStartAt.getMonth()]++;
  }
  const totalMonthHits = monthCounts.reduce((a, b) => a + b, 0) || 1;
  const topMonths: RhythmTopMonthDto[] = monthCounts
    .map((count, idx) => ({
      month: idx + 1,
      label: MONTH_LABELS_ZH[idx],
      count,
      share: count / totalMonthHits,
    }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // top transports
  const transportCounts = new Map<string, number>();
  for (const marker of input.markers) {
    if (marker.transport) {
      transportCounts.set(marker.transport, (transportCounts.get(marker.transport) ?? 0) + 1);
    }
  }
  const totalTransport = Array.from(transportCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const topTransports: RhythmTopTransportDto[] = Array.from(transportCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([value, count]) => ({ value, label: value, count, share: count / totalTransport }));

  // avg trip days
  const avgTripDays =
    totalTripCount === 0
      ? 0
      : input.trips.reduce((acc, trip) => {
          const days = Math.max(
            1,
            Math.ceil((trip.endsAt.getTime() - trip.startsAt.getTime()) / (1000 * 60 * 60 * 24)),
          );
          return acc + days;
        }, 0) / totalTripCount;

  // budget tier
  const totalSpentCents = input.expenses.reduce((a, b) => a + b.amountCents, 0);
  const avgPerTripCents = totalTripCount === 0 ? 0 : totalSpentCents / totalTripCount;
  const budgetTier = pickBudgetTier(avgPerTripCents);

  // theme mix
  const themeAcc: Record<keyof RhythmThemeMixDto, number> = {
    food: 0,
    scenery: 0,
    history: 0,
    healing: 0,
    nature: 0,
  };
  let themeHits = 0;
  for (const marker of input.markers) {
    const tags = asTagSlugs(marker.tags);
    const theme = classifyTheme(tags);
    if (theme) {
      themeAcc[theme]++;
      themeHits++;
    }
  }
  const themeMix: RhythmThemeMixDto =
    themeHits === 0
      ? { food: 0, scenery: 0, history: 0, healing: 0, nature: 0 }
      : {
          food: themeAcc.food / themeHits,
          scenery: themeAcc.scenery / themeHits,
          history: themeAcc.history / themeHits,
          healing: themeAcc.healing / themeHits,
          nature: themeAcc.nature / themeHits,
        };

  // companion diversity Shannon entropy normalized
  const companionCounts = new Map<string, number>();
  for (const marker of input.markers) {
    if (marker.companionId) {
      companionCounts.set(marker.companionId, (companionCounts.get(marker.companionId) ?? 0) + 1);
    }
  }
  const total = Array.from(companionCounts.values()).reduce((a, b) => a + b, 0);
  let companionDiversityIndex = 0;
  if (total > 0 && companionCounts.size > 1) {
    const entropy = Array.from(companionCounts.values()).reduce((acc, n) => {
      const p = n / total;
      return acc - p * Math.log2(p);
    }, 0);
    const maxEntropy = Math.log2(companionCounts.size);
    companionDiversityIndex = maxEntropy === 0 ? 0 : entropy / maxEntropy;
  }

  return {
    windowYears,
    windowYearCount,
    topMonths,
    topTransports,
    avgTripDays: Number(avgTripDays.toFixed(2)),
    budgetTier,
    themeMix,
    companionDiversityIndex: Number(companionDiversityIndex.toFixed(4)),
    totalTripCount,
    totalMarkerCount,
  };
}

function buildSummary(result: AggregateResult): string {
  const lines: string[] = [];
  lines.push(`# 旅行节奏画像 / Travel Rhythm Portrait`);
  lines.push('');
  lines.push(`- 跨度 / Window: **${result.windowYears}** (${result.windowYearCount} years)`);
  lines.push(`- 行程总数 / Total trips: **${result.totalTripCount}**`);
  lines.push(`- 平均时长 / Avg duration: **${result.avgTripDays.toFixed(1)} days**`);
  lines.push(`- 预算档位 / Budget tier: **${result.budgetTier}**`);
  if (result.topMonths.length > 0) {
    lines.push('');
    lines.push('## 常去月份 / Top months');
    for (const m of result.topMonths) {
      lines.push(`- ${m.label}: ${(m.share * 100).toFixed(1)}% (${m.count})`);
    }
  }
  if (result.topTransports.length > 0) {
    lines.push('');
    lines.push('## 偏好交通 / Top transports');
    for (const t of result.topTransports) {
      lines.push(`- ${t.label}: ${(t.share * 100).toFixed(1)}% (${t.count})`);
    }
  }
  lines.push('');
  lines.push('## 主题混合 / Theme mix');
  for (const key of ['food', 'scenery', 'history', 'healing', 'nature'] as const) {
    lines.push(`- ${key}: ${((result.themeMix[key] ?? 0) * 100).toFixed(1)}%`);
  }
  return lines.join('\n');
}

async function fetchAggregateInput(accountId: string): Promise<AggregateInput> {
  const prisma = getPrismaClient();
  const [trips, markers, expenses] = await Promise.all([
    prisma.trip.findMany({
      where: { accountId, isDeleted: false },
      select: { id: true, startsAt: true, endsAt: true },
    }),
    prisma.visitMarker.findMany({
      where: { accountId, isDeleted: false },
      select: {
        id: true,
        transport: true,
        tags: true,
        visitedStartAt: true,
        companionId: true,
        budgetLevel: true,
      },
    }),
    prisma.tripExpense.findMany({
      where: { accountId, isDeleted: false, status: 'actual' },
      select: { amountCents: true },
    }),
  ]);
  return { trips, markers, expenses };
}

function snapshotToDto(
  snapshot: RhythmPortraitSnapshot,
  available: boolean,
  windowYearCount: number,
): RhythmPortraitDto {
  const topMonthsRaw = snapshot.topMonths as Prisma.JsonValue;
  const topTransportsRaw = snapshot.topTransports as Prisma.JsonValue;
  const themeMixRaw = snapshot.themeMix as Prisma.JsonValue;
  return {
    id: snapshot.id,
    generatedAt: snapshot.generatedAt.toISOString(),
    windowYears: snapshot.windowYears,
    available,
    windowYearCount,
    topMonths: Array.isArray(topMonthsRaw)
      ? (topMonthsRaw as unknown as RhythmTopMonthDto[])
      : [],
    topTransports: Array.isArray(topTransportsRaw)
      ? (topTransportsRaw as unknown as RhythmTopTransportDto[])
      : [],
    avgTripDays: Number(snapshot.avgTripDays),
    budgetTier: snapshot.budgetTier as RhythmBudgetTierDto,
    themeMix: (themeMixRaw && typeof themeMixRaw === 'object' && !Array.isArray(themeMixRaw)
      ? (themeMixRaw as unknown as RhythmThemeMixDto)
      : { food: 0, scenery: 0, history: 0, healing: 0, nature: 0 }) as RhythmThemeMixDto,
    companionDiversityIndex: Number(snapshot.companionDiversityIndex),
    totalTripCount: snapshot.totalTripCount,
    totalMarkerCount: snapshot.totalMarkerCount,
    summaryMarkdown: snapshot.summaryMarkdown,
    shareCardUrl: '/api/rhythm-portrait/share-card.svg',
  };
}

function emptyDto(windowYearCount: number): RhythmPortraitDto {
  return {
    id: null,
    generatedAt: null,
    windowYears: `${new Date().getFullYear()}`,
    available: false,
    windowYearCount,
    topMonths: [],
    topTransports: [],
    avgTripDays: 0,
    budgetTier: 'balanced',
    themeMix: { food: 0, scenery: 0, history: 0, healing: 0, nature: 0 },
    companionDiversityIndex: 0,
    totalTripCount: 0,
    totalMarkerCount: 0,
    summaryMarkdown: '再多走一段就能看到指纹 / Take a few more trips to reveal your rhythm.',
    shareCardUrl: '/api/rhythm-portrait/share-card.svg',
  };
}

export async function getRhythmPortrait(
  account: AuthenticatedAccount,
): Promise<RhythmPortraitActionResponseDto> {
  const prisma = getPrismaClient();
  const input = await fetchAggregateInput(account.id);
  const result = aggregate(input);
  if (result.windowYearCount < MIN_WINDOW_YEARS) {
    return { portrait: emptyDto(result.windowYearCount) };
  }
  let snapshot = await prisma.rhythmPortraitSnapshot.findUnique({
    where: { accountId: account.id },
  });
  if (!snapshot) {
    snapshot = await persistSnapshot(account.id, result);
  }
  return { portrait: snapshotToDto(snapshot, true, result.windowYearCount) };
}

async function persistSnapshot(
  accountId: string,
  result: AggregateResult,
): Promise<RhythmPortraitSnapshot> {
  const prisma = getPrismaClient();
  const summaryMarkdown = buildSummary(result);
  const now = new Date();
  const payload = {
    accountId,
    generatedAt: now,
    windowYears: result.windowYears,
    topMonths: result.topMonths as unknown as Prisma.InputJsonValue,
    topTransports: result.topTransports as unknown as Prisma.InputJsonValue,
    avgTripDays: result.avgTripDays as unknown as Prisma.Decimal,
    budgetTier: result.budgetTier,
    themeMix: result.themeMix as unknown as Prisma.InputJsonValue,
    companionDiversityIndex: result.companionDiversityIndex as unknown as Prisma.Decimal,
    totalTripCount: result.totalTripCount,
    totalMarkerCount: result.totalMarkerCount,
    summaryMarkdown,
  };
  return prisma.rhythmPortraitSnapshot.upsert({
    where: { accountId },
    create: { id: randomUUID(), ...payload },
    update: payload,
  });
}

export async function refreshRhythmPortrait(
  account: AuthenticatedAccount,
): Promise<RhythmPortraitActionResponseDto> {
  const input = await fetchAggregateInput(account.id);
  const result = aggregate(input);
  if (result.windowYearCount < MIN_WINDOW_YEARS) {
    return { portrait: emptyDto(result.windowYearCount) };
  }
  const snapshot = await persistSnapshot(account.id, result);
  return { portrait: snapshotToDto(snapshot, true, result.windowYearCount) };
}

export async function buildRhythmPortraitForRender(
  account: AuthenticatedAccount,
): Promise<RhythmPortraitDto> {
  const input = await fetchAggregateInput(account.id);
  const result = aggregate(input);
  const prisma = getPrismaClient();
  if (result.windowYearCount < MIN_WINDOW_YEARS) {
    return emptyDto(result.windowYearCount);
  }
  let snapshot = await prisma.rhythmPortraitSnapshot.findUnique({
    where: { accountId: account.id },
  });
  if (!snapshot) {
    snapshot = await persistSnapshot(account.id, result);
  }
  return snapshotToDto(snapshot, true, result.windowYearCount);
}
