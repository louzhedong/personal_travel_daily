import type {
  OrganizationIssueDto,
  OrganizationTripOptionDto,
  OrganizationWorkbenchResponseDto,
} from '../types.js';

interface TripSource {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
}

interface MarkerSource {
  id: string;
  scopeName: string;
  city: string;
  note: string;
  tags: unknown;
  visitedStartAt: Date;
  trip: { id: string; name: string } | null;
}

interface ImageSource {
  id: string;
  imageUrl: string;
  isFeatured: boolean;
  caption: string | null;
  marker: MarkerSource;
}

interface GuideSource {
  id: string;
  guideTitle: string;
  guideSummary: string;
  guideSourceName: string;
  savedAt: Date;
  marker: unknown | null;
}

export interface OrganizationWorkbenchSources {
  trips: TripSource[];
  markers: MarkerSource[];
  images: ImageSource[];
  guides: GuideSource[];
}

function normalizeTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function markerTitle(marker: MarkerSource) {
  return `${marker.scopeName} · ${marker.city}`;
}

function serializeTripOption(trip: TripSource): OrganizationTripOptionDto {
  return {
    id: trip.id,
    name: trip.name,
    startsAt: trip.startsAt.toISOString(),
    endsAt: trip.endsAt.toISOString(),
  };
}

function serializeMarkerIssue(marker: MarkerSource, kind: 'unassignedMarker' | 'weakMarkerTags'): OrganizationIssueDto {
  const title = markerTitle(marker);
  return {
    id: `${kind}:${marker.id}`,
    kind,
    targetId: marker.id,
    markerId: marker.id,
    markerTitle: title,
    title,
    description:
      kind === 'unassignedMarker'
        ? '这条旅行记录还没有归入任何行程。'
        : '这条旅行记录缺少可用于统计、年鉴和故事的标签。',
    actionHint: kind === 'unassignedMarker' ? '批量归入行程' : '批量补标签',
    occurredAt: marker.visitedStartAt.toISOString(),
    tripId: marker.trip?.id,
    tripName: marker.trip?.name,
    tags: normalizeTags(marker.tags),
  };
}

function serializeImageIssue(image: ImageSource, kind: 'missingPhotoCaption' | 'unfeaturedPhoto'): OrganizationIssueDto {
  const title = markerTitle(image.marker);
  return {
    id: `${kind}:${image.id}`,
    kind,
    targetId: image.id,
    markerId: image.marker.id,
    markerTitle: title,
    title,
    description:
      kind === 'missingPhotoCaption'
        ? '这张照片还缺少一句可复用于故事的说明。'
        : '这张照片还没有进入精选素材池。',
    actionHint: kind === 'missingPhotoCaption' ? '生成说明草稿' : '标记为精选',
    occurredAt: image.marker.visitedStartAt.toISOString(),
    tripId: image.marker.trip?.id,
    tripName: image.marker.trip?.name,
    imageUrl: image.imageUrl,
  };
}

function serializeGuideIssue(guide: GuideSource): OrganizationIssueDto {
  return {
    id: `unlinkedGuide:${guide.id}`,
    kind: 'unlinkedGuide',
    targetId: guide.id,
    title: guide.guideTitle,
    description: '这条攻略收藏还没有关联到具体旅行记录。',
    actionHint: '稍后关联到记录',
    occurredAt: guide.savedAt.toISOString(),
    guideSourceName: guide.guideSourceName,
  };
}

export function serializeOrganizationWorkbench(
  sources: OrganizationWorkbenchSources,
  generatedAt = new Date(),
): OrganizationWorkbenchResponseDto {
  const unassignedMarkers = sources.markers
    .filter((marker) => !marker.trip)
    .map((marker) => serializeMarkerIssue(marker, 'unassignedMarker'));
  const missingPhotoCaptions = sources.images
    .filter((image) => !image.caption?.trim())
    .map((image) => serializeImageIssue(image, 'missingPhotoCaption'));
  const unlinkedGuides = sources.guides
    .filter((guide) => !guide.marker)
    .map(serializeGuideIssue);
  const unfeaturedPhotos = sources.images
    .filter((image) => !image.isFeatured)
    .map((image) => serializeImageIssue(image, 'unfeaturedPhoto'));
  const weakMarkerTags = sources.markers
    .filter((marker) => normalizeTags(marker.tags).length === 0)
    .map((marker) => serializeMarkerIssue(marker, 'weakMarkerTags'));

  return {
    summary: {
      totalIssues:
        unassignedMarkers.length +
        missingPhotoCaptions.length +
        unlinkedGuides.length +
        unfeaturedPhotos.length +
        weakMarkerTags.length,
      unassignedMarkers: unassignedMarkers.length,
      missingPhotoCaptions: missingPhotoCaptions.length,
      unlinkedGuides: unlinkedGuides.length,
      unfeaturedPhotos: unfeaturedPhotos.length,
      weakMarkerTags: weakMarkerTags.length,
      readyTrips: sources.trips.length,
    },
    tripOptions: sources.trips.map(serializeTripOption),
    sections: {
      unassignedMarkers,
      missingPhotoCaptions,
      unlinkedGuides,
      unfeaturedPhotos,
      weakMarkerTags,
    },
    generatedAt: generatedAt.toISOString(),
  };
}
