import '../loadServerEnv.js';
import { AccountRole, GuideSearchScope, PrismaClient, TravelScope } from '@prisma/client';
import { defaultCompanions } from '../appApi/defaultCompanions.js';
import { hashPassword } from '../appApi/auth/password.js';
import { getAppApiEnv } from '../appApi/env.js';
import { createInitialAccountState } from '../appApi/services/appContextService.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseDateTime(value: string) {
  return new Date(value);
}

function buildImageUrls(seedBase: string, count: number) {
  return Array.from({ length: count }, (_, index) => `https://picsum.photos/seed/${seedBase}-${index + 1}/1200/900`);
}

function normalizeKeyword(value: string) {
  return value.trim().toLocaleLowerCase('zh-CN');
}

async function hasTable(prisma: PrismaClient, tableName: string) {
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, string>>>(
    `SHOW TABLES LIKE '${tableName.replace(/'/g, "''")}'`,
  );
  return rows.length > 0;
}

async function seedTripDetailShowcaseData(prisma: PrismaClient, accountId: string) {
  const companions = await prisma.travelCompanion.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const primaryCompanion = companions[0];
  const secondaryCompanion = companions[1] ?? companions[0];

  if (!primaryCompanion) {
    return;
  }

  const baseTrips = [
    {
      id: 'trip-demo-jiangnan-spring',
      name: '江南春游示例',
      note: '适合验证统计中心跳转与行程详情页展示的国内样例。',
      coverImageUrl: 'https://picsum.photos/seed/trip-jiangnan-cover/1200/720',
      startsAt: '2026-03-14',
      endsAt: '2026-03-17',
      createdAt: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'trip-demo-kansai-sakura',
      name: '京阪樱花行示例',
      note: '用于本地联调国际行程详情页、照片区和攻略区的展示样例。',
      coverImageUrl: 'https://picsum.photos/seed/trip-kansai-cover/1200/720',
      startsAt: '2026-04-05',
      endsAt: '2026-04-09',
      createdAt: '2026-03-20T08:00:00.000Z',
    },
  ] as const;

  const bulkTripTemplates = [
    {
      id: 'trip-demo-shandong-coast',
      name: '山东海岸线示例',
      note: '用于补齐更多国内行程卡片和城市分布。',
      coverSeed: 'trip-shandong-coast',
      startsAt: '2025-06-11',
      endsAt: '2025-06-15',
      createdAt: '2025-05-20T08:00:00.000Z',
      stops: [
        { id: 'qingdao', scope: TravelScope.domestic, scopeId: 'sd', scopeName: '山东', city: '青岛', days: 2, companionId: primaryCompanion.id, note: '栈桥和八大关，适合验证海边照片密度。 ', photoCount: 4 },
        { id: 'yantai', scope: TravelScope.domestic, scopeId: 'sd', scopeName: '山东', city: '烟台', days: 1, companionId: secondaryCompanion.id, note: '滨海路和日落视角，适合验证同省多城市。', photoCount: 3 },
        { id: 'weihai', scope: TravelScope.domestic, scopeId: 'sd', scopeName: '山东', city: '威海', days: 2, companionId: primaryCompanion.id, note: '沿海骑行路线，用于增加详情页长列表。', photoCount: 4 },
      ],
      guide: { keyword: '山东海岸线', title: '山东沿海慢游参考', summary: '青岛、烟台、威海串联的轻量路线。', sourceName: 'Qyer', sourceUrl: 'https://example.com/guides/shandong-coast', destinationLabel: '山东' },
    },
    {
      id: 'trip-demo-yunnan-loop',
      name: '滇西环线示例',
      note: '用于本地观察多日行程、山地风景图和更长的记录列表。',
      coverSeed: 'trip-yunnan-loop',
      startsAt: '2025-09-18',
      endsAt: '2025-09-24',
      createdAt: '2025-08-29T08:00:00.000Z',
      stops: [
        { id: 'dali', scope: TravelScope.domestic, scopeId: 'yn', scopeName: '云南', city: '大理', days: 2, companionId: primaryCompanion.id, note: '洱海骑行与古城散步。', photoCount: 4 },
        { id: 'lijiang', scope: TravelScope.domestic, scopeId: 'yn', scopeName: '云南', city: '丽江', days: 2, companionId: secondaryCompanion.id, note: '古城夜景和雪山远眺。', photoCount: 4 },
        { id: 'shangri-la', scope: TravelScope.domestic, scopeId: 'yn', scopeName: '云南', city: '香格里拉', days: 3, companionId: primaryCompanion.id, note: '高原草甸和松赞林寺。', photoCount: 4 },
      ],
      guide: { keyword: '滇西环线', title: '滇西环线行前参考', summary: '大理、丽江、香格里拉的串联路线建议。', sourceName: 'Wikivoyage', sourceUrl: 'https://example.com/guides/yunnan-loop', destinationLabel: '云南' },
    },
    {
      id: 'trip-demo-beijing-winter',
      name: '京津冬日示例',
      note: '用于观察跨城市短途行程与照片卡片密度。',
      coverSeed: 'trip-beijing-winter',
      startsAt: '2025-12-20',
      endsAt: '2025-12-24',
      createdAt: '2025-12-01T08:00:00.000Z',
      stops: [
        { id: 'beijing', scope: TravelScope.domestic, scopeId: 'bj', scopeName: '北京', city: '北京', days: 2, companionId: primaryCompanion.id, note: '胡同、故宫和夜间街景。', photoCount: 5 },
        { id: 'tianjin', scope: TravelScope.domestic, scopeId: 'tj', scopeName: '天津', city: '天津', days: 2, companionId: secondaryCompanion.id, note: '意风区和海河夜景。', photoCount: 4 },
      ],
      guide: { keyword: '京津冬日', title: '京津周末路线建议', summary: '适合本地验证两城切换与多图展示。', sourceName: 'Qyer', sourceUrl: 'https://example.com/guides/beijing-winter', destinationLabel: '北京 / 天津' },
    },
    {
      id: 'trip-demo-seoul-foodie',
      name: '首尔觅食示例',
      note: '用于验证国际中短途行程和城市照片流。',
      coverSeed: 'trip-seoul-foodie',
      startsAt: '2026-01-10',
      endsAt: '2026-01-14',
      createdAt: '2025-12-26T08:00:00.000Z',
      stops: [
        { id: 'myeongdong', scope: TravelScope.international, scopeId: 'kr-seoul', scopeName: '首尔特别市', city: '首尔', days: 2, companionId: primaryCompanion.id, note: '明洞和乙支路夜间街区。', photoCount: 4 },
        { id: 'hongdae', scope: TravelScope.international, scopeId: 'kr-seoul', scopeName: '首尔特别市', city: '首尔', days: 1, companionId: secondaryCompanion.id, note: '弘大演出和街头气氛。', photoCount: 3 },
        { id: 'bukchon', scope: TravelScope.international, scopeId: 'kr-seoul', scopeName: '首尔特别市', city: '首尔', days: 1, companionId: primaryCompanion.id, note: '北村与景福宫周边。', photoCount: 3 },
      ],
      guide: { keyword: '首尔觅食', title: '首尔城市慢游参考', summary: '适合联调国际城市单一地区多点位展示。', sourceName: 'Wikivoyage', sourceUrl: 'https://example.com/guides/seoul-foodie', destinationLabel: '首尔' },
    },
    {
      id: 'trip-demo-tokyo-week',
      name: '东京一周示例',
      note: '用于拉高国际行程数量和照片条目。',
      coverSeed: 'trip-tokyo-week',
      startsAt: '2026-02-11',
      endsAt: '2026-02-17',
      createdAt: '2026-01-20T08:00:00.000Z',
      stops: [
        { id: 'asakusa', scope: TravelScope.international, scopeId: 'jp-tokyo', scopeName: '东京都', city: '东京', days: 2, companionId: primaryCompanion.id, note: '浅草寺与隅田川沿线。', photoCount: 4 },
        { id: 'shibuya', scope: TravelScope.international, scopeId: 'jp-tokyo', scopeName: '东京都', city: '东京', days: 2, companionId: secondaryCompanion.id, note: '涩谷十字路口和代官山。', photoCount: 4 },
        { id: 'ueno', scope: TravelScope.international, scopeId: 'jp-tokyo', scopeName: '东京都', city: '东京', days: 2, companionId: primaryCompanion.id, note: '上野公园与美术馆。', photoCount: 4 },
      ],
      guide: { keyword: '东京一周', title: '东京一周城市节奏建议', summary: '浅草、涩谷、上野的串联安排。', sourceName: 'Qyer', sourceUrl: 'https://example.com/guides/tokyo-week', destinationLabel: '东京' },
    },
    {
      id: 'trip-demo-hk-citywalk',
      name: '港岛 Citywalk 示例',
      note: '用于验证密集城市步行记录和多张夜景照片。',
      coverSeed: 'trip-hk-citywalk',
      startsAt: '2026-03-01',
      endsAt: '2026-03-04',
      createdAt: '2026-02-10T08:00:00.000Z',
      stops: [
        { id: 'central', scope: TravelScope.international, scopeId: 'hk', scopeName: '香港', city: '中环', days: 1, companionId: primaryCompanion.id, note: '半山扶梯和中环街景。', photoCount: 5 },
        { id: 'wanchai', scope: TravelScope.international, scopeId: 'hk', scopeName: '香港', city: '湾仔', days: 1, companionId: secondaryCompanion.id, note: '电车与海边步道。', photoCount: 4 },
        { id: 'tsim-sha-tsui', scope: TravelScope.international, scopeId: 'hk', scopeName: '香港', city: '尖沙咀', days: 2, companionId: primaryCompanion.id, note: '维港夜景和海旁散步。', photoCount: 5 },
      ],
      guide: { keyword: '香港 Citywalk', title: '港岛漫步路线参考', summary: '适合测试单次行程内高密度照片与夜景卡片。', sourceName: 'Qyer', sourceUrl: 'https://example.com/guides/hk-citywalk', destinationLabel: '香港' },
    },
    {
      id: 'trip-demo-fujian-coast',
      name: '闽南海风示例',
      note: '用于增加另一组国内城市和照片瀑布压力。',
      coverSeed: 'trip-fujian-coast',
      startsAt: '2026-03-22',
      endsAt: '2026-03-27',
      createdAt: '2026-03-01T08:00:00.000Z',
      stops: [
        { id: 'xiamen', scope: TravelScope.domestic, scopeId: 'fj', scopeName: '福建', city: '厦门', days: 2, companionId: primaryCompanion.id, note: '鼓浪屿与沙坡尾。', photoCount: 4 },
        { id: 'quanzhou', scope: TravelScope.domestic, scopeId: 'fj', scopeName: '福建', city: '泉州', days: 2, companionId: secondaryCompanion.id, note: '古城、庙宇和老街。', photoCount: 3 },
        { id: 'zhangzhou', scope: TravelScope.domestic, scopeId: 'fj', scopeName: '福建', city: '漳州', days: 2, companionId: primaryCompanion.id, note: '沿海公路和土楼周边。', photoCount: 3 },
      ],
      guide: { keyword: '闽南海风', title: '闽南沿海短途参考', summary: '厦门、泉州、漳州的串联行程。', sourceName: 'Wikivoyage', sourceUrl: 'https://example.com/guides/fujian-coast', destinationLabel: '福建' },
    },
    {
      id: 'trip-demo-heavy-gallery',
      name: '重型画廊压测示例',
      note: '专门用于本地验证详情页在大量照片、长列表和多日期分组下的滚动与渲染表现。',
      coverSeed: 'trip-heavy-gallery',
      startsAt: '2026-05-10',
      endsAt: '2026-05-18',
      createdAt: '2026-04-18T08:00:00.000Z',
      stops: [
        { id: 'shanghai-bund', scope: TravelScope.domestic, scopeId: 'sh', scopeName: '上海', city: '上海', days: 1, companionId: primaryCompanion.id, note: '外滩和苏州河夜景。', photoCount: 6 },
        { id: 'hangzhou-tea', scope: TravelScope.domestic, scopeId: 'zj', scopeName: '浙江', city: '杭州', days: 1, companionId: secondaryCompanion.id, note: '龙井和茶园步道。', photoCount: 6 },
        { id: 'ningbo-port', scope: TravelScope.domestic, scopeId: 'zj', scopeName: '浙江', city: '宁波', days: 1, companionId: primaryCompanion.id, note: '港口与老外滩。', photoCount: 6 },
        { id: 'fukuoka-bay', scope: TravelScope.international, scopeId: 'jp-fukuoka', scopeName: '福冈县', city: '福冈', days: 1, companionId: secondaryCompanion.id, note: '海边与城市夜景。', photoCount: 6 },
        { id: 'busan-coast', scope: TravelScope.international, scopeId: 'kr-busan', scopeName: '釜山广域市', city: '釜山', days: 1, companionId: primaryCompanion.id, note: '海云台与甘川。', photoCount: 6 },
        { id: 'nagasaki-port', scope: TravelScope.international, scopeId: 'jp-nagasaki', scopeName: '长崎县', city: '长崎', days: 1, companionId: secondaryCompanion.id, note: '港口和山顶夜景。', photoCount: 6 },
        { id: 'sasebo-harbor', scope: TravelScope.international, scopeId: 'jp-nagasaki', scopeName: '长崎县', city: '佐世保', days: 1, companionId: primaryCompanion.id, note: '九十九岛巡航视角。', photoCount: 6 },
        { id: 'macau-lights', scope: TravelScope.international, scopeId: 'mo', scopeName: '澳门', city: '澳门', days: 2, companionId: secondaryCompanion.id, note: '老城区和夜间灯光，用于压测长图流。', photoCount: 8 },
      ],
      guide: { keyword: '重型画廊', title: '性能联调专用路线', summary: '为详情页和照片区性能联调准备的高密度样例。', sourceName: 'Internal Mock', sourceUrl: 'https://example.com/guides/heavy-gallery', destinationLabel: '性能联调' },
    },
    {
      id: 'trip-demo-europe-rail',
      name: '欧洲铁路示例',
      note: '用于联调跨国家、多城市、多日期的长线行程。',
      coverSeed: 'trip-europe-rail',
      startsAt: '2024-09-08',
      endsAt: '2024-09-18',
      createdAt: '2024-08-12T08:00:00.000Z',
      stops: [
        { id: 'paris', scope: TravelScope.international, scopeId: 'fr', scopeName: '法国', city: '巴黎', days: 2, companionId: primaryCompanion.id, note: '塞纳河与左岸咖啡馆。', photoCount: 5 },
        { id: 'zurich', scope: TravelScope.international, scopeId: 'ch', scopeName: '瑞士', city: '苏黎世', days: 2, companionId: secondaryCompanion.id, note: '湖边散步和中转停留。', photoCount: 4 },
        { id: 'milan', scope: TravelScope.international, scopeId: 'it', scopeName: '意大利', city: '米兰', days: 2, companionId: primaryCompanion.id, note: '教堂广场和城市街景。', photoCount: 4 },
        { id: 'rome', scope: TravelScope.international, scopeId: 'it', scopeName: '意大利', city: '罗马', days: 3, companionId: secondaryCompanion.id, note: '古迹路线和傍晚广场。', photoCount: 5 },
      ],
      guide: { keyword: '欧洲铁路', title: '欧洲铁路联程参考', summary: '巴黎、苏黎世、米兰、罗马的火车串联路线。', sourceName: 'Wikivoyage', sourceUrl: 'https://example.com/guides/europe-rail', destinationLabel: '欧洲' },
    },
    {
      id: 'trip-demo-southwest-drive',
      name: '西南自驾示例',
      note: '用于验证国内跨省长线、连续日期和多图分组展示。',
      coverSeed: 'trip-southwest-drive',
      startsAt: '2024-11-02',
      endsAt: '2024-11-10',
      createdAt: '2024-10-18T08:00:00.000Z',
      stops: [
        { id: 'chengdu', scope: TravelScope.domestic, scopeId: 'sc', scopeName: '四川', city: '成都', days: 2, companionId: primaryCompanion.id, note: '出发前的城市停留与补给。', photoCount: 4 },
        { id: 'kangding', scope: TravelScope.domestic, scopeId: 'sc', scopeName: '四川', city: '康定', days: 2, companionId: secondaryCompanion.id, note: '折多山前后的自驾路段。', photoCount: 5 },
        { id: 'daocheng', scope: TravelScope.domestic, scopeId: 'sc', scopeName: '四川', city: '稻城', days: 2, companionId: primaryCompanion.id, note: '高海拔风景与徒步视角。', photoCount: 5 },
        { id: 'lijiang', scope: TravelScope.domestic, scopeId: 'yn', scopeName: '云南', city: '丽江', days: 2, companionId: secondaryCompanion.id, note: '返程落脚和古城夜景。', photoCount: 4 },
      ],
      guide: { keyword: '西南自驾', title: '川滇自驾参考路线', summary: '成都、康定、稻城、丽江的长线自驾安排。', sourceName: 'Qyer', sourceUrl: 'https://example.com/guides/southwest-drive', destinationLabel: '四川 / 云南' },
    },
  ] as const;

  const generatedTrips = bulkTripTemplates.map((trip) => ({
    id: trip.id,
    name: trip.name,
    note: trip.note,
    coverImageUrl: `https://picsum.photos/seed/${trip.coverSeed}/1200/720`,
    startsAt: trip.startsAt,
    endsAt: trip.endsAt,
    createdAt: trip.createdAt,
  }));

  const trips = [...baseTrips, ...generatedTrips] as const;

  for (const trip of trips) {
    await prisma.trip.upsert({
      where: { id: trip.id },
      update: {
        accountId,
        name: trip.name,
        note: trip.note,
        coverImageUrl: trip.coverImageUrl,
        startsAt: parseDateOnly(trip.startsAt),
        endsAt: parseDateOnly(trip.endsAt),
        isDeleted: false,
        deletedAt: null,
        createdAt: parseDateTime(trip.createdAt),
      },
      create: {
        id: trip.id,
        accountId,
        name: trip.name,
        note: trip.note,
        coverImageUrl: trip.coverImageUrl,
        startsAt: parseDateOnly(trip.startsAt),
        endsAt: parseDateOnly(trip.endsAt),
        createdAt: parseDateTime(trip.createdAt),
      },
    });
  }

  const baseMarkers = [
    {
      id: 'marker-demo-hangzhou-westlake',
      companionId: primaryCompanion.id,
      tripId: 'trip-demo-jiangnan-spring',
      scope: TravelScope.domestic,
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖边散步到傍晚，适合验证详情页记录区与照片区首屏布局。',
      visitedStartAt: '2026-03-14',
      visitedEndAt: '2026-03-15',
      createdAt: '2026-03-15T08:00:00.000Z',
      imageUrls: [
        'https://picsum.photos/seed/hangzhou-westlake-1/1200/900',
        'https://picsum.photos/seed/hangzhou-westlake-2/1200/900',
      ],
    },
    {
      id: 'marker-demo-suzhou-pingjiang',
      companionId: secondaryCompanion.id,
      tripId: 'trip-demo-jiangnan-spring',
      scope: TravelScope.domestic,
      scopeId: 'js',
      scopeName: '江苏',
      city: '苏州',
      note: '平江路夜游和拙政园白天路线，适合验证多旅伴和多城市信息。',
      visitedStartAt: '2026-03-16',
      visitedEndAt: '2026-03-17',
      createdAt: '2026-03-17T08:00:00.000Z',
      imageUrls: ['https://picsum.photos/seed/suzhou-pingjiang-1/1200/900'],
    },
    {
      id: 'marker-demo-kyoto-philosopher',
      companionId: primaryCompanion.id,
      tripId: 'trip-demo-kansai-sakura',
      scope: TravelScope.international,
      scopeId: 'jp-kyoto',
      scopeName: '京都府',
      city: '京都',
      note: '哲学之道的樱花步道，适合验证国际范围统计和详情页攻略卡片展示。',
      visitedStartAt: '2026-04-05',
      visitedEndAt: '2026-04-06',
      createdAt: '2026-04-06T08:00:00.000Z',
      imageUrls: ['https://picsum.photos/seed/kyoto-philosopher-1/1200/900'],
    },
    {
      id: 'marker-demo-osaka-river',
      companionId: secondaryCompanion.id,
      tripId: 'trip-demo-kansai-sakura',
      scope: TravelScope.international,
      scopeId: 'jp-osaka',
      scopeName: '大阪府',
      city: '大阪',
      note: '道顿堀和中之岛夜景，用来验证详情页时间线与国际城市组合展示。',
      visitedStartAt: '2026-04-08',
      visitedEndAt: '2026-04-09',
      createdAt: '2026-04-09T08:00:00.000Z',
      imageUrls: ['https://picsum.photos/seed/osaka-river-1/1200/900'],
    },
  ] as const;

  const generatedMarkers = bulkTripTemplates.flatMap((trip, tripIndex) =>
    trip.stops.map((stop, stopIndex) => {
      const startDate = new Date(`${trip.startsAt}T00:00:00.000Z`);
      startDate.setUTCDate(startDate.getUTCDate() + stopIndex * 2);

      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + stop.days - 1);

      const startDateOnly = startDate.toISOString().slice(0, 10);
      const endDateOnly = endDate.toISOString().slice(0, 10);
      const createdAt = new Date(startDate);
      createdAt.setUTCHours(8, tripIndex, stopIndex, 0);

      return {
        id: `marker-demo-${trip.id}-${stop.id}`,
        companionId: stop.companionId,
        tripId: trip.id,
        scope: stop.scope,
        scopeId: stop.scopeId,
        scopeName: stop.scopeName,
        city: stop.city,
        note: stop.note,
        visitedStartAt: startDateOnly,
        visitedEndAt: endDateOnly,
        createdAt: createdAt.toISOString(),
        imageUrls: buildImageUrls(`${trip.id}-${stop.id}`, stop.photoCount),
      };
    }),
  );

  const markers = [...baseMarkers, ...generatedMarkers] as const;

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
        visitedStartAt: parseDateOnly(marker.visitedStartAt),
        visitedEndAt: parseDateOnly(marker.visitedEndAt),
        createdAt: parseDateTime(marker.createdAt),
      },
    });

    await prisma.visitMarkerImage.deleteMany({
      where: {
        markerId: marker.id,
      },
    });

    await prisma.visitMarkerImage.createMany({
      data: marker.imageUrls.map((imageUrl, index) => ({
        id: `${marker.id}-image-${index + 1}`,
        markerId: marker.id,
        imageUrl,
        sortOrder: index,
        createdAt: parseDateTime(marker.createdAt),
      })),
    });
  }

  const looseMarkers = [
    {
      id: 'marker-demo-loose-nanjing-weekend',
      companionId: primaryCompanion.id,
      scope: TravelScope.domestic,
      scopeId: 'js',
      scopeName: '江苏',
      city: '南京',
      note: '未归入行程的周末散步记录，方便联调“未归入行程”筛选。',
      visitedStartAt: '2026-06-12',
      visitedEndAt: '2026-06-12',
      createdAt: '2026-06-12T10:00:00.000Z',
      imageUrls: buildImageUrls('loose-nanjing-weekend', 3),
    },
    {
      id: 'marker-demo-loose-hsinchu-food',
      companionId: secondaryCompanion.id,
      scope: TravelScope.international,
      scopeId: 'tw',
      scopeName: '中国台湾',
      city: '新竹',
      note: '未归入行程的国际散点记录，方便联调国际单点热区。',
      visitedStartAt: '2025-08-19',
      visitedEndAt: '2025-08-20',
      createdAt: '2025-08-20T09:00:00.000Z',
      imageUrls: buildImageUrls('loose-hsinchu-food', 2),
    },
    {
      id: 'marker-demo-loose-shenzhen-night',
      companionId: primaryCompanion.id,
      scope: TravelScope.domestic,
      scopeId: 'gd',
      scopeName: '广东',
      city: '深圳',
      note: '夜景短停记录，用来拉高非行程类记录的密度。',
      visitedStartAt: '2024-07-05',
      visitedEndAt: '2024-07-05',
      createdAt: '2024-07-05T21:30:00.000Z',
      imageUrls: buildImageUrls('loose-shenzhen-night', 2),
    },
  ] as const;

  for (const marker of looseMarkers) {
    await prisma.visitMarker.upsert({
      where: { id: marker.id },
      update: {
        accountId,
        companionId: marker.companionId,
        tripId: null,
        scope: marker.scope,
        scopeId: marker.scopeId,
        scopeName: marker.scopeName,
        city: marker.city,
        note: marker.note,
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
        tripId: null,
        scope: marker.scope,
        scopeId: marker.scopeId,
        scopeName: marker.scopeName,
        city: marker.city,
        note: marker.note,
        visitedStartAt: parseDateOnly(marker.visitedStartAt),
        visitedEndAt: parseDateOnly(marker.visitedEndAt),
        createdAt: parseDateTime(marker.createdAt),
      },
    });

    await prisma.visitMarkerImage.deleteMany({
      where: {
        markerId: marker.id,
      },
    });

    await prisma.visitMarkerImage.createMany({
      data: marker.imageUrls.map((imageUrl, index) => ({
        id: `${marker.id}-image-${index + 1}`,
        markerId: marker.id,
        imageUrl,
        sortOrder: index,
        createdAt: parseDateTime(marker.createdAt),
      })),
    });
  }

  const baseGuides = [
    {
      id: 'saved-guide-demo-hangzhou',
      savedByCompanionId: primaryCompanion.id,
      markerId: 'marker-demo-hangzhou-westlake',
      keyword: '杭州周末',
      title: '杭州周末慢游攻略',
      summary: '西湖、灵隐寺与运河夜景的两日组合，适合第一次来杭州做轻量安排。',
      sourceName: 'Qyer',
      sourceUrl: 'https://example.com/guides/hangzhou-weekend',
      destinationLabel: '杭州',
      savedAt: '2026-03-18T09:00:00.000Z',
    },
    {
      id: 'saved-guide-demo-kyoto',
      savedByCompanionId: secondaryCompanion.id,
      markerId: 'marker-demo-kyoto-philosopher',
      keyword: '京都樱花',
      title: '京都樱花路线参考',
      summary: '哲学之道、冈崎与清水寺片区的步行顺序建议，方便验证国际行程详情页展示。',
      sourceName: 'Wikivoyage',
      sourceUrl: 'https://example.com/guides/kyoto-sakura',
      destinationLabel: '京都',
      savedAt: '2026-04-10T09:00:00.000Z',
    },
  ] as const;

  const generatedGuides = bulkTripTemplates.map((trip) => {
    const firstStop = trip.stops[0];
    const guide = trip.guide;
    return {
      id: `saved-guide-${trip.id}`,
      savedByCompanionId: firstStop.companionId,
      markerId: `marker-demo-${trip.id}-${firstStop.id}`,
      keyword: guide.keyword,
      title: guide.title,
      summary: guide.summary,
      sourceName: guide.sourceName,
      sourceUrl: guide.sourceUrl,
      destinationLabel: guide.destinationLabel,
      savedAt: new Date(`${trip.endsAt}T09:00:00.000Z`).toISOString(),
    };
  });

  const guides = [...baseGuides, ...generatedGuides] as const;

  for (const guide of guides) {
    await prisma.savedGuide.upsert({
      where: { id: guide.id },
      update: {
        accountId,
        savedByCompanionId: guide.savedByCompanionId,
        markerId: guide.markerId,
        saveContextKey: `marker:${guide.markerId}`,
        keyword: guide.keyword,
        guideIdentity: guide.sourceUrl,
        guideTitle: guide.title,
        guideSummary: guide.summary,
        guideSourceName: guide.sourceName,
        guideSourceUrl: guide.sourceUrl,
        guideDestinationLabel: guide.destinationLabel,
        guidePayloadJson: {
          id: guide.id,
          title: guide.title,
          summary: guide.summary,
          sourceName: guide.sourceName,
          sourceUrl: guide.sourceUrl,
          destinationLabel: guide.destinationLabel,
        },
        savedAt: parseDateTime(guide.savedAt),
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        id: guide.id,
        accountId,
        savedByCompanionId: guide.savedByCompanionId,
        markerId: guide.markerId,
        saveContextKey: `marker:${guide.markerId}`,
        keyword: guide.keyword,
        guideIdentity: guide.sourceUrl,
        guideTitle: guide.title,
        guideSummary: guide.summary,
        guideSourceName: guide.sourceName,
        guideSourceUrl: guide.sourceUrl,
        guideDestinationLabel: guide.destinationLabel,
        guidePayloadJson: {
          id: guide.id,
          title: guide.title,
          summary: guide.summary,
          sourceName: guide.sourceName,
          sourceUrl: guide.sourceUrl,
          destinationLabel: guide.destinationLabel,
        },
        savedAt: parseDateTime(guide.savedAt),
      },
    });
  }

  const guideSearchHistories = [
    {
      id: 'history-demo-kyoto-sakura',
      companionId: primaryCompanion.id,
      keyword: '京都 樱花',
      scope: GuideSearchScope.international,
      createdAt: '2026-04-01T08:30:00.000Z',
    },
    {
      id: 'history-demo-hangzhou-weekend',
      companionId: secondaryCompanion.id,
      keyword: '杭州 周末',
      scope: GuideSearchScope.domestic,
      createdAt: '2026-03-10T09:15:00.000Z',
    },
    {
      id: 'history-demo-macau-night',
      companionId: primaryCompanion.id,
      keyword: '澳门 夜景',
      scope: GuideSearchScope.international,
      createdAt: '2026-05-09T20:20:00.000Z',
    },
    {
      id: 'history-demo-roadtrip',
      companionId: secondaryCompanion.id,
      keyword: '稻城 自驾',
      scope: GuideSearchScope.domestic,
      createdAt: '2024-10-20T07:50:00.000Z',
    },
  ] as const;

  for (const history of guideSearchHistories) {
    await prisma.guideSearchHistory.upsert({
      where: { id: history.id },
      update: {
        accountId,
        companionId: history.companionId,
        keyword: history.keyword,
        keywordNormalized: normalizeKeyword(history.keyword),
        scope: history.scope,
        createdAt: parseDateTime(history.createdAt),
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        id: history.id,
        accountId,
        companionId: history.companionId,
        keyword: history.keyword,
        keywordNormalized: normalizeKeyword(history.keyword),
        scope: history.scope,
        createdAt: parseDateTime(history.createdAt),
      },
    });
  }

  if (await hasTable(prisma, 'marker_search_events')) {
    const markerSearchEvents = [
      {
        id: 'marker-search-demo-japan-2026',
        companionId: primaryCompanion.id,
        keyword: '日本 赏樱',
        scope: GuideSearchScope.international,
        year: '2026',
        resultCount: 28,
        page: 1,
        pageSize: 20,
        createdAt: '2026-03-01T11:00:00.000Z',
      },
      {
        id: 'marker-search-demo-yunnan-loop',
        companionId: secondaryCompanion.id,
        keyword: '云南 环线',
        scope: GuideSearchScope.domestic,
        year: '2025',
        resultCount: 18,
        page: 1,
        pageSize: 20,
        createdAt: '2025-08-28T10:10:00.000Z',
      },
      {
        id: 'marker-search-demo-macau-food',
        companionId: primaryCompanion.id,
        keyword: '澳门 美食',
        scope: GuideSearchScope.international,
        year: undefined,
        resultCount: 12,
        page: 2,
        pageSize: 20,
        createdAt: '2026-05-08T18:40:00.000Z',
      },
    ] as const;

    for (const event of markerSearchEvents) {
      await prisma.markerSearchEvent.upsert({
        where: { id: event.id },
        update: {
          accountId,
          companionId: event.companionId,
          keyword: event.keyword,
          scope: event.scope,
          year: event.year,
          resultCount: event.resultCount,
          page: event.page,
          pageSize: event.pageSize,
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
          page: event.page,
          pageSize: event.pageSize,
          createdAt: parseDateTime(event.createdAt),
        },
      });
    }
  } else {
    console.warn('[app-api seed] skipped marker_search_events because the table is missing. Run `npm run db:prepare-demo` to apply migrations and reseed demo data.');
  }
}

async function main() {
  const prisma = new PrismaClient();
  const env = getAppApiEnv();

  try {
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

    await createInitialAccountState(prisma, env.APP_DEFAULT_ACCOUNT_ID);
    await seedTripDetailShowcaseData(prisma, env.APP_DEFAULT_ACCOUNT_ID);

    console.log(
      `[app-api seed] ensured default account ${env.APP_DEFAULT_ACCOUNT_ID} (${env.APP_DEFAULT_ACCOUNT_NAME}) / ${env.APP_DEFAULT_ACCOUNT_USERNAME}, ${defaultCompanions.length} default companions, and trip-detail showcase data`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error('[app-api seed] failed:', error);
  process.exitCode = 1;
});
