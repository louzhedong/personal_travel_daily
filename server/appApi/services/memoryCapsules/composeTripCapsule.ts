import { getTripDetail } from '../tripDetailService.js';
import type { MemoryCapsuleContentDto } from '../../types.js';

function formatRange(start?: string, end?: string) {
  if (!start) return undefined;
  return end && end !== start ? `${start} - ${end}` : start;
}

export async function composeTripCapsule(accountId: string, tripId: string): Promise<MemoryCapsuleContentDto> {
  const data = await getTripDetail(accountId, tripId);
  const dateRange = formatRange(data.trip.startsAt, data.trip.endsAt);
  const photos = data.photos.map((photo) => ({
    imageId: photo.imageId,
    markerId: photo.markerId,
    imageUrl: photo.imageUrl,
    title: photo.markerTitle,
    caption: photo.caption,
    visitedStartAt: photo.visitedStartAt,
  }));
  const route = data.markers.map((marker) => ({
    id: marker.id,
    date: marker.visitedStartAt,
    title: `${marker.scopeName} · ${marker.city}`,
    description: marker.note || `${marker.companionName} 留下的旅行记录`,
  }));

  return {
    hero: {
      eyebrow: 'Trip Capsule',
      title: data.trip.name,
      subtitle: data.trip.note || `这次旅行覆盖 ${data.summary.cityCount} 座城市，留下 ${data.summary.photoCount} 张照片。`,
      coverImageUrl: data.trip.coverImageUrl ?? photos[0]?.imageUrl,
      dateRange,
    },
    metrics: [
      { label: '旅行天数', value: String(data.summary.travelDays), description: '按日期去重后的行程天数' },
      { label: '旅行记录', value: String(data.summary.markerCount), description: '这次行程里的足迹数量' },
      { label: '覆盖城市', value: String(data.summary.cityCount), description: '这次行程经过的城市' },
      { label: '精选照片', value: String(data.photos.filter((photo) => photo.isFeatured).length), description: '已整理的精选瞬间' },
    ],
    badges: [
      { id: 'route', label: '路线', value: `${data.summary.cityCount} 城`, description: '用城市串起这次旅行的主线' },
      { id: 'companions', label: '同行', value: `${data.summary.companionCount} 位`, description: '共同参与这次行程的旅伴' },
      { id: 'guides', label: '攻略', value: `${data.summary.guideCount} 篇`, description: '与行程关联的攻略素材' },
    ],
    sections: [
      {
        id: 'brief',
        title: '胶囊序言',
        eyebrow: 'Brief',
        body: data.trip.note || `从 ${route[0]?.title ?? '起点'} 出发，把 ${data.summary.markerCount} 段记录整理成一枚旅行胶囊。`,
        enabled: true,
        sortOrder: 0,
      },
      {
        id: 'route',
        title: '路线回放',
        eyebrow: 'Route',
        body: route.length > 0 ? route.map((item) => item.title).join(' / ') : '这次行程还没有旅行记录。',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'materials',
        title: '素材整理',
        eyebrow: 'Materials',
        body: `照片 ${data.summary.photoCount} 张，攻略 ${data.summary.guideCount} 篇，清单完成 ${data.checklistSummary.doneCount}/${data.checklistSummary.total}。`,
        enabled: true,
        sortOrder: 2,
      },
    ],
    route,
    timeline: route,
    photos,
    guides: data.guides.map((guide) => ({
      id: guide.id,
      title: guide.result.title,
      summary: guide.result.summary,
      sourceName: guide.result.sourceName,
      sourceUrl: guide.result.sourceUrl,
    })),
    checklist: data.checklistGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: item.id,
        date: item.updatedAt,
        title: item.title,
        description: item.note || group.title,
      })),
    ),
    achievements: [],
    sourceLinks: [{ label: '打开行程详情', path: `/trips/${encodeURIComponent(tripId)}` }],
    emptyStates: [
      ...(data.markers.length === 0 ? ['这枚行程胶囊还没有旅行记录。'] : []),
      ...(data.photos.length === 0 ? ['这枚行程胶囊还没有照片素材。'] : []),
      ...(data.guides.length === 0 ? ['这枚行程胶囊还没有攻略摘录。'] : []),
    ],
  };
}
