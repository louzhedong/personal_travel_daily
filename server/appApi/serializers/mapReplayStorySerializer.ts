import type { MapReplayStoryResponseDto, MapReplayStoryTargetDto } from '../types.js';
import { serializeAtlasSummary } from './atlasSerializer.js';
import { buildAtlasPlaceIndex } from '../services/atlas/placeIndex.js';
import { buildAtlasReplayItems } from '../services/atlas/replay.js';
import { toDateOnlyString, type RawCompanion, type RawMarker, type RawTrip } from '../services/stats/aggregator.js';

function uniqueGuides(markers: RawMarker[]): MapReplayStoryResponseDto['guides'] {
  const guides = new Map<string, MapReplayStoryResponseDto['guides'][number]>();
  markers.forEach((marker) => {
    marker.savedGuides.forEach((guide) => {
      if (!guides.has(guide.id)) {
        const legacyGuide = guide as typeof guide & {
          title?: string;
          summary?: string;
          sourceName?: string | null;
          sourceUrl?: string | null;
        };
        const payload =
          guide.guidePayloadJson && typeof guide.guidePayloadJson === 'object' && !Array.isArray(guide.guidePayloadJson)
            ? (guide.guidePayloadJson as Record<string, unknown>)
            : {};
        guides.set(guide.id, {
          id: guide.id,
          title: guide.guideTitle ?? legacyGuide.title ?? '',
          summary: guide.guideSummary ?? legacyGuide.summary ?? '',
          sourceName: guide.guideSourceName ?? legacyGuide.sourceName ?? '',
          sourceUrl: guide.guideSourceUrl ?? legacyGuide.sourceUrl ?? (typeof payload.sourceUrl === 'string' ? payload.sourceUrl : ''),
        });
      }
    });
  });
  return Array.from(guides.values());
}

function buildPhotos(markers: RawMarker[]): MapReplayStoryResponseDto['photos'] {
  return markers.flatMap((marker) =>
    marker.images.map((image) => ({
      imageId: image.id,
      markerId: marker.id,
      imageUrl: image.imageUrl,
      title: `${marker.scopeName} · ${marker.city}`,
      caption: image.caption ?? undefined,
      visitedStartAt: toDateOnlyString(marker.visitedStartAt),
    })),
  );
}

function buildChapters(markers: RawMarker[], target: MapReplayStoryTargetDto): MapReplayStoryResponseDto['chapters'] {
  const sorted = [...markers].sort((left, right) => left.visitedStartAt.getTime() - right.visitedStartAt.getTime());
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  return [
    {
      id: 'opening',
      eyebrow: 'Opening',
      title: `${target.label} 的回放开场`,
      body: first
        ? `从 ${first.scopeName} · ${first.city} 开始，这段地图回放把 ${markers.length} 段旅行记录串成一条可阅读的路线。`
        : '还没有足迹可以播放，补充旅行记录后这里会自动生成回放开场。',
    },
    {
      id: 'route',
      eyebrow: 'Route',
      title: '路线节奏',
      body: sorted.length > 0
        ? sorted.slice(0, 8).map((marker) => `${marker.scopeName} · ${marker.city}`).join(' / ')
        : '当前范围暂无路线节点。',
    },
    {
      id: 'closing',
      eyebrow: 'Closing',
      title: '最后一帧',
      body: latest
        ? `${toDateOnlyString(latest.visitedStartAt)}，回放停在 ${latest.scopeName} · ${latest.city}。`
        : '等待第一段可以回看的旅行记忆。',
    },
  ];
}

function buildExportModel(
  target: MapReplayStoryTargetDto,
  markers: RawMarker[],
  replay: MapReplayStoryResponseDto['replay'],
): MapReplayStoryResponseDto['exportModel'] {
  const featuredPhoto = markers.flatMap((marker) => marker.images).find((image) => image.isFeatured) ?? markers.flatMap((marker) => marker.images)[0];
  return {
    filenameSlug: `${target.type}-${target.id}`.replace(/[^a-zA-Z0-9-_]/g, '-'),
    posterTitle: `${target.label} 地图回放故事`,
    posterSubtitle: target.subtitle ?? `${markers.length} 段记录 · ${new Set(markers.map((marker) => marker.city)).size} 座城市`,
    routeTitle: replay.length > 0 ? `${replay[0].title} → ${replay[replay.length - 1].title}` : '等待第一段旅行轨迹',
    featuredPhotoUrl: featuredPhoto?.imageUrl,
  };
}

export function serializeMapReplayStory(input: {
  target: MapReplayStoryTargetDto;
  markers: RawMarker[];
  companions: RawCompanion[];
  trips: RawTrip[];
  sourceLinks: Array<{ label: string; path: string }>;
  generatedAt: Date;
}): MapReplayStoryResponseDto {
  const markers = [...input.markers].sort((left, right) => left.visitedStartAt.getTime() - right.visitedStartAt.getTime());
  const replay = buildAtlasReplayItems(markers, input.companions, input.trips);
  return {
    target: input.target,
    summary: serializeAtlasSummary(markers),
    replay,
    placeIndex: buildAtlasPlaceIndex(markers),
    photos: buildPhotos(markers),
    guides: uniqueGuides(markers),
    chapters: buildChapters(markers, input.target),
    exportModel: buildExportModel(input.target, markers, replay),
    sourceLinks: input.sourceLinks,
    emptyStates: markers.length === 0 ? [`${input.target.label} 还没有可回放的旅行记录。`] : [],
    generatedAt: input.generatedAt.toISOString(),
  };
}
