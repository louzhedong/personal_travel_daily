import { randomUUID } from 'node:crypto';
import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { HomeDashboardCardDto, HomeDashboardCardIdDto, HomeDashboardResponseDto, UpdateHomeDashboardPreferenceInputDto } from '../types.js';

const DEFAULT_LAYOUT: HomeDashboardCardIdDto[] = ['live-trip', 'latest-trip', 'next-trip', 'pending-materials', 'recent-achievement'];

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getTripStatus(trip: { startsAt: Date; endsAt: Date }, now = new Date()) {
  const today = toDateOnly(now);
  const start = toDateOnly(trip.startsAt);
  const end = toDateOnly(trip.endsAt);
  if (today < start) return 'upcoming';
  if (today > end) return 'ended';
  return 'live';
}

function diffDays(left: Date, right: Date) {
  const ms = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate()) - Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate());
  return Math.floor(ms / 86400000);
}

function buildCards(input: {
  latestTrip?: { id: string; name: string; startsAt: Date; endsAt: Date } | null;
  nextTrip?: { id: string; name: string; startsAt: Date; endsAt: Date } | null;
  liveTrip?: { id: string; name: string; startsAt: Date; endsAt: Date } | null;
  pendingMaterialCount: number;
  achievementCount: number;
}): HomeDashboardCardDto[] {
  return [
    input.liveTrip
      ? {
          id: 'live-trip',
          eyebrow: '旅途进行时',
          title: input.liveTrip.name,
          description: `Day ${diffDays(new Date(), input.liveTrip.startsAt) + 1} of ${Math.max(1, diffDays(input.liveTrip.endsAt, input.liveTrip.startsAt) + 1)}`,
          path: `/trips/${encodeURIComponent(input.liveTrip.id)}/today`,
          metricLabel: '当前行程',
          metricValue: 'Live',
        }
      : {
          id: 'live-trip',
          eyebrow: '旅途进行时',
          title: '今天没有进行中的行程',
          description: '下一次出发前，这里会变成当天清单与快速记录入口。',
          path: input.nextTrip ? `/trips/${encodeURIComponent(input.nextTrip.id)}` : '/stats',
          metricLabel: '状态',
          metricValue: 'Standby',
        },
    {
      id: 'latest-trip',
      eyebrow: '最近回看',
      title: input.latestTrip?.name ?? '还没有可回看的行程',
      description: input.latestTrip ? '继续整理故事页、照片与路线回放。' : '完成一次行程后，这里会出现你的最新旅行。',
      path: input.latestTrip ? `/trips/${encodeURIComponent(input.latestTrip.id)}/story` : '/stats',
      metricLabel: '回看',
      metricValue: input.latestTrip ? 'Story' : 'Empty',
    },
    {
      id: 'next-trip',
      eyebrow: '下一段计划',
      title: input.nextTrip?.name ?? '暂无计划中的行程',
      description: input.nextTrip ? '打开行前规划，安排今天该做什么。' : '从愿望地图或攻略搜索创建下一段计划。',
      path: input.nextTrip ? `/trips/${encodeURIComponent(input.nextTrip.id)}` : '/organize',
      metricLabel: '计划',
      metricValue: input.nextTrip ? toDateOnly(input.nextTrip.startsAt) : '待定',
    },
    {
      id: 'pending-materials',
      eyebrow: '待整理素材',
      title: `${input.pendingMaterialCount} 项需要整理`,
      description: '汇总缺说明照片、未归行程记录和待处理提醒。',
      path: '/organize',
      metricLabel: '待办',
      metricValue: String(input.pendingMaterialCount),
    },
    {
      id: 'recent-achievement',
      eyebrow: '成就与年鉴',
      title: `${input.achievementCount} 个成就已点亮`,
      description: '继续查看旅行成就、年度回顾和全局故事时间轴。',
      path: '/achievements',
      metricLabel: 'Atlas',
      metricValue: String(input.achievementCount),
    },
  ];
}

export async function getHomeDashboard(account: AuthenticatedAccount): Promise<HomeDashboardResponseDto> {
  const prisma = getPrismaClient();
  const now = new Date();
  const [preference, trips, missingCaptionPhotos, openReminders, achievementCount] = await Promise.all([
    prisma.homeDashboardPreference.findUnique({ where: { accountId: account.id } }),
    prisma.trip.findMany({ where: { accountId: account.id, isDeleted: false }, orderBy: [{ startsAt: 'desc' }] }),
    prisma.visitMarkerImage.count({ where: { caption: null, marker: { accountId: account.id, isDeleted: false } } }),
    prisma.reminderState.count({ where: { accountId: account.id, status: 'open' } }),
    prisma.achievementUnlock.count({ where: { accountId: account.id } }),
  ]);

  const latestTrip = trips.find((trip) => getTripStatus(trip, now) === 'ended') ?? trips[0] ?? null;
  const nextTrip = [...trips].reverse().find((trip) => getTripStatus(trip, now) === 'upcoming') ?? null;
  const liveTrip = trips.find((trip) => getTripStatus(trip, now) === 'live') ?? null;
  const pendingMaterialCount = missingCaptionPhotos + openReminders;
  const pref = {
    layout: (Array.isArray(preference?.layoutJson) ? preference?.layoutJson : DEFAULT_LAYOUT) as HomeDashboardCardIdDto[],
    hiddenCardIds: (Array.isArray(preference?.hiddenCardIdsJson) ? preference?.hiddenCardIdsJson : []) as HomeDashboardCardIdDto[],
  };
  const cardsById = new Map(buildCards({ latestTrip, nextTrip, liveTrip, pendingMaterialCount, achievementCount }).map((card) => [card.id, card]));
  const cards = pref.layout.map((id) => cardsById.get(id)).filter((card): card is HomeDashboardCardDto => !!card && !pref.hiddenCardIds.includes(card.id));

  return {
    suggestions: cards.slice(0, 5).map((card) => ({
      id: `dashboard:${card.id}`,
      title: card.title,
      description: card.description,
      actionLabel: '打开',
      path: card.path ?? '/',
      tone: card.id === 'pending-materials' && pendingMaterialCount > 0 ? 'warning' : 'info',
      source: card.id === 'pending-materials' ? 'organize' : card.id === 'recent-achievement' ? 'achievement' : 'trip',
    })),
    cards,
    preference: pref,
    generatedAt: now.toISOString(),
  };
}

export async function updateHomeDashboardPreference(account: AuthenticatedAccount, input: UpdateHomeDashboardPreferenceInputDto) {
  const prisma = getPrismaClient();
  await prisma.homeDashboardPreference.upsert({
    where: { accountId: account.id },
    create: { id: randomUUID(), accountId: account.id, layoutJson: input.layout, hiddenCardIdsJson: input.hiddenCardIds },
    update: { layoutJson: input.layout, hiddenCardIdsJson: input.hiddenCardIds },
  });
  return getHomeDashboard(account);
}
