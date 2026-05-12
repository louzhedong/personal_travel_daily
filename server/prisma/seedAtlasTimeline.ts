import '../loadServerEnv.js';
import { AccountRole, GuideSearchScope, PrismaClient, TravelScope } from '@prisma/client';
import { hashPassword } from '../appApi/auth/password.js';
import { getAppApiEnv } from '../appApi/env.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseDateTime(value: string) {
  return new Date(value);
}

function imageUrls(seed: string, count: number) {
  return Array.from({ length: count }, (_, index) => `https://picsum.photos/seed/atlas-${seed}-${index + 1}/1400/1000`);
}

async function ensureDefaultAccount(prisma: PrismaClient) {
  const env = getAppApiEnv();
  const passwordHash = await hashPassword(env.APP_DEFAULT_ACCOUNT_PASSWORD);
  await prisma.account.upsert({
    where: { id: env.APP_DEFAULT_ACCOUNT_ID },
    update: {
      name: env.APP_DEFAULT_ACCOUNT_NAME,
      username: env.APP_DEFAULT_ACCOUNT_USERNAME,
      role: AccountRole.admin,
      passwordHash,
    },
    create: {
      id: env.APP_DEFAULT_ACCOUNT_ID,
      name: env.APP_DEFAULT_ACCOUNT_NAME,
      username: env.APP_DEFAULT_ACCOUNT_USERNAME,
      role: AccountRole.admin,
      passwordHash,
    },
  });
  return env.APP_DEFAULT_ACCOUNT_ID;
}

const companions = [
  { id: 'atlas-companion-lin', name: '林间', color: '#0f172a', sortOrder: 10 },
  { id: 'atlas-companion-yu', name: '小屿', color: '#64748b', sortOrder: 11 },
  { id: 'atlas-companion-mori', name: 'Mori', color: '#475569', sortOrder: 12 },
] as const;

const trips = [
  {
    id: 'atlas-trip-jiangnan-spring-2026',
    name: 'Atlas · 江南春日线',
    note: '用于验证地图时间机器的国内多城市、多旅伴、春季路线回放。',
    coverSeed: 'jiangnan-cover',
    startsAt: '2026-03-12',
    endsAt: '2026-03-17',
    createdAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'atlas-trip-japan-sakura-2026',
    name: 'Atlas · 日本赏樱线',
    note: '用于验证国际多地区、飞机与步行混合交通、城市索引聚合。',
    coverSeed: 'japan-cover',
    startsAt: '2026-04-04',
    endsAt: '2026-04-11',
    createdAt: '2026-03-20T08:00:00.000Z',
  },
  {
    id: 'atlas-trip-europe-rail-2025',
    name: 'Atlas · 欧洲铁路线',
    note: '用于验证跨国家年份对比、长线铁路旅行和国际范围筛选。',
    coverSeed: 'europe-cover',
    startsAt: '2025-09-06',
    endsAt: '2025-09-17',
    createdAt: '2025-08-10T08:00:00.000Z',
  },
  {
    id: 'atlas-trip-southwest-drive-2024',
    name: 'Atlas · 西南自驾线',
    note: '用于验证历史年份、国内自驾、自然风景和预算筛选。',
    coverSeed: 'southwest-cover',
    startsAt: '2024-10-02',
    endsAt: '2024-10-11',
    createdAt: '2024-09-16T08:00:00.000Z',
  },
] as const;

const markers = [
  {
    id: 'atlas-marker-hangzhou-westlake',
    tripId: 'atlas-trip-jiangnan-spring-2026',
    companionId: 'atlas-companion-lin',
    scope: TravelScope.domestic,
    scopeId: 'zj',
    scopeName: '浙江',
    city: '杭州',
    note: '西湖边从白堤走到孤山，适合验证时间轴首站与地图热区。',
    tags: ['citywalk', 'photography'],
    mood: 'peaceful',
    weather: 'cloudy',
    transport: 'walk',
    budgetLevel: 'low',
    visitedStartAt: '2026-03-12',
    visitedEndAt: '2026-03-13',
    createdAt: '2026-03-13T09:00:00.000Z',
    photos: imageUrls('hangzhou-westlake', 4),
  },
  {
    id: 'atlas-marker-suzhou-garden',
    tripId: 'atlas-trip-jiangnan-spring-2026',
    companionId: 'atlas-companion-yu',
    scope: TravelScope.domestic,
    scopeId: 'js',
    scopeName: '江苏',
    city: '苏州',
    note: '园林、平江路与夜色，验证同一行程内城市切换。',
    tags: ['museum', 'weekend'],
    mood: 'relaxed',
    weather: 'sunny',
    transport: 'train',
    budgetLevel: 'medium',
    visitedStartAt: '2026-03-14',
    visitedEndAt: '2026-03-15',
    createdAt: '2026-03-15T09:00:00.000Z',
    photos: imageUrls('suzhou-garden', 3),
  },
  {
    id: 'atlas-marker-nanjing-river',
    tripId: null,
    companionId: 'atlas-companion-lin',
    scope: TravelScope.domestic,
    scopeId: 'js',
    scopeName: '江苏',
    city: '南京',
    note: '未归入行程的江边短停，验证未归行程筛选。',
    tags: ['citywalk', 'weekend'],
    mood: 'surprised',
    weather: 'windy',
    transport: 'metro',
    budgetLevel: 'low',
    visitedStartAt: '2026-03-18',
    visitedEndAt: '2026-03-18',
    createdAt: '2026-03-18T21:00:00.000Z',
    photos: imageUrls('nanjing-river', 2),
  },
  {
    id: 'atlas-marker-kyoto-sakura',
    tripId: 'atlas-trip-japan-sakura-2026',
    companionId: 'atlas-companion-mori',
    scope: TravelScope.international,
    scopeId: 'jp-kyoto',
    scopeName: '京都府',
    city: '京都',
    note: '哲学之道樱花线，验证国际范围与摄影标签。',
    tags: ['photography', 'nature'],
    mood: 'excited',
    weather: 'sunny',
    transport: 'walk',
    budgetLevel: 'high',
    visitedStartAt: '2026-04-04',
    visitedEndAt: '2026-04-06',
    createdAt: '2026-04-06T09:00:00.000Z',
    photos: imageUrls('kyoto-sakura', 5),
  },
  {
    id: 'atlas-marker-osaka-food',
    tripId: 'atlas-trip-japan-sakura-2026',
    companionId: 'atlas-companion-yu',
    scope: TravelScope.international,
    scopeId: 'jp-osaka',
    scopeName: '大阪府',
    city: '大阪',
    note: '道顿堀夜食和中之岛散步，验证美食标签和夜间照片。',
    tags: ['food', 'citywalk'],
    mood: 'excited',
    weather: 'rainy',
    transport: 'metro',
    budgetLevel: 'medium',
    visitedStartAt: '2026-04-07',
    visitedEndAt: '2026-04-08',
    createdAt: '2026-04-08T22:00:00.000Z',
    photos: imageUrls('osaka-food', 4),
  },
  {
    id: 'atlas-marker-tokyo-museum',
    tripId: 'atlas-trip-japan-sakura-2026',
    companionId: 'atlas-companion-lin',
    scope: TravelScope.international,
    scopeId: 'jp-tokyo',
    scopeName: '东京都',
    city: '东京',
    note: '上野、美术馆和浅草，用于验证同一国家多地区聚合。',
    tags: ['museum', 'photography'],
    mood: 'relaxed',
    weather: 'cloudy',
    transport: 'train',
    budgetLevel: 'high',
    visitedStartAt: '2026-04-09',
    visitedEndAt: '2026-04-11',
    createdAt: '2026-04-11T09:00:00.000Z',
    photos: imageUrls('tokyo-museum', 4),
  },
  {
    id: 'atlas-marker-paris-river',
    tripId: 'atlas-trip-europe-rail-2025',
    companionId: 'atlas-companion-lin',
    scope: TravelScope.international,
    scopeId: 'fr',
    scopeName: '法国',
    city: '巴黎',
    note: '塞纳河、左岸和夜间书店，验证跨年对比中的国际首站。',
    tags: ['citywalk', 'museum'],
    mood: 'peaceful',
    weather: 'sunny',
    transport: 'plane',
    budgetLevel: 'high',
    visitedStartAt: '2025-09-06',
    visitedEndAt: '2025-09-08',
    createdAt: '2025-09-08T09:00:00.000Z',
    photos: imageUrls('paris-river', 4),
  },
  {
    id: 'atlas-marker-zurich-lake',
    tripId: 'atlas-trip-europe-rail-2025',
    companionId: 'atlas-companion-mori',
    scope: TravelScope.international,
    scopeId: 'ch',
    scopeName: '瑞士',
    city: '苏黎世',
    note: '湖边和铁路中转，验证火车交通筛选。',
    tags: ['nature', 'photography'],
    mood: 'relaxed',
    weather: 'cloudy',
    transport: 'train',
    budgetLevel: 'high',
    visitedStartAt: '2025-09-09',
    visitedEndAt: '2025-09-11',
    createdAt: '2025-09-11T09:00:00.000Z',
    photos: imageUrls('zurich-lake', 3),
  },
  {
    id: 'atlas-marker-rome-walk',
    tripId: 'atlas-trip-europe-rail-2025',
    companionId: 'atlas-companion-yu',
    scope: TravelScope.international,
    scopeId: 'it',
    scopeName: '意大利',
    city: '罗马',
    note: '古迹、广场和傍晚步行，验证长线终点。',
    tags: ['museum', 'citywalk'],
    mood: 'tired',
    weather: 'sunny',
    transport: 'walk',
    budgetLevel: 'medium',
    visitedStartAt: '2025-09-14',
    visitedEndAt: '2025-09-17',
    createdAt: '2025-09-17T09:00:00.000Z',
    photos: imageUrls('rome-walk', 5),
  },
  {
    id: 'atlas-marker-chengdu-food',
    tripId: 'atlas-trip-southwest-drive-2024',
    companionId: 'atlas-companion-yu',
    scope: TravelScope.domestic,
    scopeId: 'sc',
    scopeName: '四川',
    city: '成都',
    note: '出发前的火锅和街巷，验证 2024 年国内记录。',
    tags: ['food', 'weekend'],
    mood: 'excited',
    weather: 'rainy',
    transport: 'car',
    budgetLevel: 'medium',
    visitedStartAt: '2024-10-02',
    visitedEndAt: '2024-10-03',
    createdAt: '2024-10-03T09:00:00.000Z',
    photos: imageUrls('chengdu-food', 3),
  },
  {
    id: 'atlas-marker-kangding-road',
    tripId: 'atlas-trip-southwest-drive-2024',
    companionId: 'atlas-companion-lin',
    scope: TravelScope.domestic,
    scopeId: 'sc',
    scopeName: '四川',
    city: '康定',
    note: '折多山前后的公路与云层，验证自然标签和自驾轨迹。',
    tags: ['nature', 'hiking'],
    mood: 'surprised',
    weather: 'windy',
    transport: 'car',
    budgetLevel: 'medium',
    visitedStartAt: '2024-10-04',
    visitedEndAt: '2024-10-06',
    createdAt: '2024-10-06T09:00:00.000Z',
    photos: imageUrls('kangding-road', 4),
  },
  {
    id: 'atlas-marker-daocheng-hike',
    tripId: 'atlas-trip-southwest-drive-2024',
    companionId: 'atlas-companion-mori',
    scope: TravelScope.domestic,
    scopeId: 'sc',
    scopeName: '四川',
    city: '稻城',
    note: '高原徒步与草甸，验证徒步标签和多日旅行天数。',
    tags: ['hiking', 'nature'],
    mood: 'tired',
    weather: 'snowy',
    transport: 'car',
    budgetLevel: 'high',
    visitedStartAt: '2024-10-07',
    visitedEndAt: '2024-10-10',
    createdAt: '2024-10-10T09:00:00.000Z',
    photos: imageUrls('daocheng-hike', 5),
  },
] as const;

async function seedAtlasTimelineMockData(prisma: PrismaClient) {
  const accountId = await ensureDefaultAccount(prisma);

  for (const companion of companions) {
    await prisma.travelCompanion.upsert({
      where: { id: companion.id },
      update: {
        accountId,
        name: companion.name,
        color: companion.color,
        sortOrder: companion.sortOrder,
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        id: companion.id,
        accountId,
        name: companion.name,
        color: companion.color,
        sortOrder: companion.sortOrder,
      },
    });
  }

  for (const trip of trips) {
    await prisma.trip.upsert({
      where: { id: trip.id },
      update: {
        accountId,
        name: trip.name,
        note: trip.note,
        coverImageUrl: `https://picsum.photos/seed/atlas-${trip.coverSeed}/1400/840`,
        startsAt: parseDateOnly(trip.startsAt),
        endsAt: parseDateOnly(trip.endsAt),
        createdAt: parseDateTime(trip.createdAt),
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        id: trip.id,
        accountId,
        name: trip.name,
        note: trip.note,
        coverImageUrl: `https://picsum.photos/seed/atlas-${trip.coverSeed}/1400/840`,
        startsAt: parseDateOnly(trip.startsAt),
        endsAt: parseDateOnly(trip.endsAt),
        createdAt: parseDateTime(trip.createdAt),
      },
    });
  }

  for (const marker of markers) {
    await prisma.visitMarker.upsert({
      where: { id: marker.id },
      update: {
        accountId,
        companionId: marker.companionId,
        tripId: marker.tripId,
        scope: marker.scope,
        scopeId: marker.scopeId,
        scopeName: marker.scopeName,
        city: marker.city,
        note: marker.note,
        tags: marker.tags,
        mood: marker.mood,
        weather: marker.weather,
        transport: marker.transport,
        budgetLevel: marker.budgetLevel,
        visitedStartAt: parseDateOnly(marker.visitedStartAt),
        visitedEndAt: parseDateOnly(marker.visitedEndAt),
        createdAt: parseDateTime(marker.createdAt),
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        id: marker.id,
        accountId,
        companionId: marker.companionId,
        tripId: marker.tripId,
        scope: marker.scope,
        scopeId: marker.scopeId,
        scopeName: marker.scopeName,
        city: marker.city,
        note: marker.note,
        tags: marker.tags,
        mood: marker.mood,
        weather: marker.weather,
        transport: marker.transport,
        budgetLevel: marker.budgetLevel,
        visitedStartAt: parseDateOnly(marker.visitedStartAt),
        visitedEndAt: parseDateOnly(marker.visitedEndAt),
        createdAt: parseDateTime(marker.createdAt),
      },
    });

    await prisma.visitMarkerImage.deleteMany({ where: { markerId: marker.id } });
    await prisma.visitMarkerImage.createMany({
      data: marker.photos.map((imageUrl, index) => ({
        id: `${marker.id}-image-${index + 1}`,
        markerId: marker.id,
        imageUrl,
        sortOrder: index,
        isFeatured: index === 0,
        caption: `${marker.city} · Atlas Mock #${index + 1}`,
        curatedSortOrder: index,
        createdAt: parseDateTime(marker.createdAt),
      })),
    });
  }

  const guideRecords = markers.slice(0, 8).map((marker, index) => ({
    id: `atlas-guide-${marker.id}`,
    markerId: marker.id,
    companionId: marker.companionId,
    keyword: `${marker.city} Atlas 路线`,
    title: `${marker.city} 地图时间机器攻略`,
    summary: `为 ${marker.city} 的 Atlas mock 记录准备的路线摘要。`,
    sourceName: index % 2 === 0 ? 'Qyer' : 'Wikivoyage',
    sourceUrl: `https://example.com/atlas-guides/${marker.city.toLowerCase()}-${index + 1}`,
    destinationLabel: marker.city,
    savedAt: `${marker.visitedEndAt}T12:00:00.000Z`,
  }));

  for (const guide of guideRecords) {
    await prisma.savedGuide.upsert({
      where: { id: guide.id },
      update: {
        accountId,
        savedByCompanionId: guide.companionId,
        markerId: guide.markerId,
        saveContextKey: `marker:${guide.markerId}`,
        keyword: guide.keyword,
        guideIdentity: guide.sourceUrl,
        guideTitle: guide.title,
        guideSummary: guide.summary,
        guideSourceName: guide.sourceName,
        guideSourceUrl: guide.sourceUrl,
        guideDestinationLabel: guide.destinationLabel,
        guidePayloadJson: guide,
        savedAt: parseDateTime(guide.savedAt),
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        id: guide.id,
        accountId,
        savedByCompanionId: guide.companionId,
        markerId: guide.markerId,
        saveContextKey: `marker:${guide.markerId}`,
        keyword: guide.keyword,
        guideIdentity: guide.sourceUrl,
        guideTitle: guide.title,
        guideSummary: guide.summary,
        guideSourceName: guide.sourceName,
        guideSourceUrl: guide.sourceUrl,
        guideDestinationLabel: guide.destinationLabel,
        guidePayloadJson: guide,
        savedAt: parseDateTime(guide.savedAt),
      },
    });
  }

  const searchEvents = [
    { id: 'atlas-search-2026-japan', companionId: 'atlas-companion-mori', keyword: '日本 樱花 地图路线', scope: GuideSearchScope.international, year: '2026', resultCount: 24, createdAt: '2026-03-25T10:00:00.000Z' },
    { id: 'atlas-search-2025-europe', companionId: 'atlas-companion-lin', keyword: '欧洲 铁路 多城市', scope: GuideSearchScope.international, year: '2025', resultCount: 18, createdAt: '2025-08-20T10:00:00.000Z' },
    { id: 'atlas-search-2024-drive', companionId: 'atlas-companion-yu', keyword: '川西 自驾 徒步', scope: GuideSearchScope.domestic, year: '2024', resultCount: 16, createdAt: '2024-09-20T10:00:00.000Z' },
  ] as const;

  for (const event of searchEvents) {
    await prisma.markerSearchEvent.upsert({
      where: { id: event.id },
      update: {
        accountId,
        companionId: event.companionId,
        keyword: event.keyword,
        scope: event.scope,
        year: event.year,
        resultCount: event.resultCount,
        page: 1,
        pageSize: 20,
        createdAt: parseDateTime(event.createdAt),
      },
      create: {
        id: event.id,
        accountId,
        companionId: event.companionId,
        keyword: event.keyword,
        scope: event.scope,
        year: event.year,
        resultCount: event.resultCount,
        page: 1,
        pageSize: 20,
        createdAt: parseDateTime(event.createdAt),
      },
    });
  }

  console.log(`[atlas seed] ensured ${companions.length} companions, ${trips.length} trips, ${markers.length} markers, ${markers.reduce((sum, marker) => sum + marker.photos.length, 0)} photos for account ${accountId}`);
}

const prisma = new PrismaClient();

void seedAtlasTimelineMockData(prisma)
  .catch((error) => {
    console.error('[atlas seed] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
