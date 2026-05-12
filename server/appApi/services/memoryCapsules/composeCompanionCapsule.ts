import { getCompanionMemory } from '../companionMemoryService.js';
import type { MemoryCapsuleContentDto } from '../../types.js';

export async function composeCompanionCapsule(accountId: string, companionId: string): Promise<MemoryCapsuleContentDto> {
  const data = await getCompanionMemory(accountId, companionId);
  const photos = data.photos.map((photo) => ({
    imageId: photo.imageId,
    markerId: photo.markerId,
    imageUrl: photo.imageUrl,
    title: photo.markerTitle,
    caption: photo.caption,
    visitedStartAt: photo.visitedStartAt,
  }));
  const timeline = data.milestones.map((milestone) => ({
    id: milestone.id,
    date: milestone.happenedAt ?? data.snapshot.generatedAt,
    title: milestone.title,
    description: milestone.description,
  }));

  return {
    hero: {
      eyebrow: 'Companion Capsule',
      title: `和 ${data.companion.name} 的旅行胶囊`,
      subtitle: data.summary.headline,
      coverImageUrl: photos[0]?.imageUrl,
      dateRange: data.summary.firstSharedAt && data.summary.latestSharedAt ? `${data.summary.firstSharedAt} - ${data.summary.latestSharedAt}` : undefined,
    },
    metrics: [
      { label: '共同记录', value: String(data.summary.markerCount), description: '一起留下的旅行记录' },
      { label: '同行天数', value: String(data.summary.travelDays), description: '按日期去重后的同行天数' },
      { label: '共同城市', value: String(data.summary.cityCount), description: '一起到达的城市' },
      { label: '共同照片', value: String(data.summary.photoCount), description: '共同回忆中的照片' },
    ],
    badges: [
      { id: 'first-memory', label: '第一段记忆', value: data.summary.firstSharedAt ?? '待补充', description: '共同旅行的起点' },
      { id: 'regions', label: '共同地区', value: `${data.summary.regionCount} 个`, description: '一起覆盖的地区' },
      { id: 'guides', label: '共同攻略', value: `${data.summary.guideCount} 篇`, description: '共同沉淀的攻略素材' },
    ],
    sections: [
      {
        id: 'brief',
        title: '共同序言',
        eyebrow: 'Brief',
        body: data.summary.headline,
        enabled: true,
        sortOrder: 0,
      },
      {
        id: 'years',
        title: '这些年的节奏',
        eyebrow: 'Years',
        body: data.yearlySeries.map((item) => `${item.year} 年 ${item.markerCount} 段`).join(' / ') || '暂无年度节奏。',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'themes',
        title: '共同主题',
        eyebrow: 'Themes',
        body: data.themes.slice(0, 6).map((item) => item.label).join(' / ') || '暂无共同主题。',
        enabled: true,
        sortOrder: 2,
      },
    ],
    route: data.topCities.slice(0, 8).map((city) => ({
      id: `${city.scopeId}-${city.city}`,
      date: '',
      title: `${city.scopeName} · ${city.city}`,
      description: `${city.markerCount} 段共同记录`,
    })),
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
    achievements: [],
    sourceLinks: [{ label: '打开共同回忆', path: `/companions/${encodeURIComponent(companionId)}/memories` }],
    emptyStates: data.summary.markerCount === 0 ? ['这位旅伴还没有共同旅行记录。'] : [],
  };
}
