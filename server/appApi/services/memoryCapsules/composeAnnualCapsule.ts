import type { AuthenticatedAccount } from '../../auth/requestAuth.js';
import { getAnnualReview } from '../statsService.js';
import type { MemoryCapsuleContentDto } from '../../types.js';

export async function composeAnnualCapsule(account: AuthenticatedAccount, year: string): Promise<MemoryCapsuleContentDto> {
  const data = await getAnnualReview(account, { year });
  const photos = data.photos.map((photo) => ({
    imageId: photo.imageId,
    markerId: photo.markerId,
    imageUrl: photo.imageUrl,
    title: photo.markerTitle,
    caption: photo.caption,
    visitedStartAt: photo.visitedStartAt,
  }));
  const timeline = [data.firstMarker, data.lastMarker]
    .filter((marker): marker is NonNullable<typeof marker> => !!marker)
    .map((marker) => ({
      id: marker.id,
      date: marker.visitedStartAt,
      title: `${marker.scopeName} · ${marker.city}`,
      description: marker.note || '年度旅行记录',
    }));

  return {
    hero: {
      eyebrow: 'Year Capsule',
      title: `${year} 年度旅行胶囊`,
      subtitle: `${data.summary.totalMarkers} 段记录，${data.summary.totalCities} 座城市，${data.summary.photoCount} 张照片。`,
      coverImageUrl: data.representativePhoto?.imageUrl ?? photos[0]?.imageUrl,
      dateRange: year,
    },
    metrics: [
      { label: '旅行天数', value: String(data.summary.totalTravelDays), description: '年度累计旅行天数' },
      { label: '旅行记录', value: String(data.summary.totalMarkers), description: '这一年的足迹数量' },
      { label: '覆盖城市', value: String(data.summary.totalCities), description: '这一年到达的城市' },
      { label: '年度照片', value: String(data.summary.photoCount), description: '这一年沉淀的照片' },
    ],
    badges: [
      data.tripHighlights.longestTrip
        ? { id: 'longest-trip', label: '最长行程', value: data.tripHighlights.longestTrip.tripName, description: `${data.tripHighlights.longestTrip.days} 天` }
        : { id: 'longest-trip', label: '最长行程', value: '待补充', description: '还没有形成年度最长行程' },
      data.tripHighlights.busiestMonth
        ? { id: 'busiest-month', label: '高峰月份', value: `${Number(data.tripHighlights.busiestMonth.month)}月`, description: `${data.tripHighlights.busiestMonth.markerCount} 条记录` }
        : { id: 'busiest-month', label: '高峰月份', value: '待补充', description: '还没有足够的月度记录' },
      data.tripHighlights.topCompanion
        ? { id: 'top-companion', label: '最常同行', value: data.tripHighlights.topCompanion.companionName, description: `${data.tripHighlights.topCompanion.travelDays} 天同行` }
        : { id: 'top-companion', label: '最常同行', value: '待补充', description: '还没有形成同行排行' },
    ],
    sections: [
      {
        id: 'brief',
        title: '年度序言',
        eyebrow: 'Brief',
        body: `${year} 年，${account.name} 留下 ${data.summary.totalMarkers} 段旅行记录，覆盖 ${data.summary.totalRegions} 个地区。`,
        enabled: true,
        sortOrder: 0,
      },
      {
        id: 'rhythm',
        title: '年度节奏',
        eyebrow: 'Rhythm',
        body: data.monthlyDistribution.map((item) => `${Number(item.month)}月 ${item.markerCount} 条`).join(' / ') || '暂无月度节奏。',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'trips',
        title: '代表行程',
        eyebrow: 'Trips',
        body: data.trips.slice(0, 5).map((trip) => trip.tripName).join(' / ') || '暂无代表行程。',
        enabled: true,
        sortOrder: 2,
      },
    ],
    route: timeline,
    timeline,
    photos,
    guides: data.guides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      summary: guide.summary,
      sourceName: guide.sourceName,
      sourceUrl: guide.sourceUrl,
    })),
    checklist: [],
    achievements: data.achievements.slice(0, 6).map((achievement) => ({
      id: achievement.id,
      label: achievement.title,
      value: achievement.status === 'unlocked' ? '已解锁' : `${achievement.progressValue}/${achievement.progressTarget}`,
      description: achievement.description,
    })),
    sourceLinks: [{ label: '打开年度回顾', path: `/yearbook/${encodeURIComponent(year)}` }],
    emptyStates: data.summary.totalMarkers === 0 ? [`${year} 年还没有旅行记录。`] : [],
  };
}
