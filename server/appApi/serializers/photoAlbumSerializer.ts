import type {
  PhotoAlbumCandidateDto,
  PhotoAlbumDto,
  PhotoAlbumIssueDto,
  PhotoAlbumIssueKindDto,
  PhotoAlbumPreferenceDto,
  PhotoAlbumsResponseDto,
} from '../types.js';
import { serializePhotoCurationItem } from './photoCurationSerializer.js';

export interface PhotoAlbumImageSource {
  id: string;
  imageUrl: string;
  isFeatured: boolean;
  caption: string | null;
  curatedSortOrder: number | null;
  marker: {
    id: string;
    scopeName: string;
    city: string;
    visitedStartAt: Date;
    companion: {
      id: string;
      name: string;
      color: string;
    };
    trip: {
      id: string;
      name: string;
    } | null;
  };
}

export interface PhotoAlbumPreferenceSource {
  id: string;
  targetKind: string;
  targetId: string;
  pinnedImageIds: unknown;
  sortOrderJson: unknown;
  updatedAt: Date;
}

export function normalizeJsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

function preferenceKey(targetKind: string, targetId: string) {
  return `${targetKind}:${targetId}`;
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
  } catch {
    return false;
  }
}

function getIssueKinds(source: PhotoAlbumImageSource, duplicateUrlSet: Set<string>): PhotoAlbumIssueKindDto[] {
  const issues: PhotoAlbumIssueKindDto[] = [];
  if (duplicateUrlSet.has(source.imageUrl)) {
    issues.push('duplicateUrl');
  }
  if (!isValidImageUrl(source.imageUrl)) {
    issues.push('invalidUrl');
  }
  if (!source.caption?.trim()) {
    issues.push('missingCaption');
  }
  return issues;
}

function scoreCandidate(
  source: PhotoAlbumImageSource,
  pinnedImageIds: Set<string>,
  sortOrder: string[],
  issueKinds: PhotoAlbumIssueKindDto[],
) {
  const manualRank = sortOrder.indexOf(source.id);
  const manualScore = manualRank >= 0 ? 40 - manualRank : 0;
  const featuredScore = source.isFeatured ? 28 : 0;
  const captionScore = source.caption?.trim() ? 12 : 0;
  const issuePenalty = issueKinds.length * 12;
  const curatedScore = source.curatedSortOrder === null ? 0 : Math.max(0, 16 - source.curatedSortOrder);
  const dateScore = Math.min(12, Math.max(0, new Date(source.marker.visitedStartAt).getFullYear() - 2014));
  const pinnedScore = pinnedImageIds.has(source.id) ? 60 : 0;
  return Math.max(0, pinnedScore + manualScore + featuredScore + captionScore + curatedScore + dateScore - issuePenalty);
}

function buildCandidate(
  source: PhotoAlbumImageSource,
  preference: PhotoAlbumPreferenceDto | undefined,
  duplicateUrlSet: Set<string>,
): PhotoAlbumCandidateDto {
  const issueKinds = getIssueKinds(source, duplicateUrlSet);
  const pinnedImageIds = new Set(preference?.pinnedImageIds ?? []);
  const sortOrder = preference?.sortOrder ?? [];
  return {
    ...serializePhotoCurationItem(source),
    score: scoreCandidate(source, pinnedImageIds, sortOrder, issueKinds),
    isPinned: pinnedImageIds.has(source.id),
    issueKinds,
  };
}

function compareCandidates(left: PhotoAlbumCandidateDto, right: PhotoAlbumCandidateDto) {
  if (left.isPinned !== right.isPinned) {
    return left.isPinned ? -1 : 1;
  }
  if (left.score !== right.score) {
    return right.score - left.score;
  }
  return new Date(right.visitedStartAt).getTime() - new Date(left.visitedStartAt).getTime();
}

function createAlbum(
  input: Omit<PhotoAlbumDto, 'coverCandidates' | 'photoCount'> & {
    sources: PhotoAlbumImageSource[];
    preferencesByTarget: Map<string, PhotoAlbumPreferenceDto>;
    duplicateUrlSet: Set<string>;
  },
): PhotoAlbumDto {
  const preference = input.preferencesByTarget.get(preferenceKey(input.targetKind, input.targetId));
  const coverCandidates = input.sources
    .map((source) => buildCandidate(source, preference, input.duplicateUrlSet))
    .sort(compareCandidates)
    .slice(0, 8);

  return {
    id: input.id,
    kind: input.kind,
    targetKind: input.targetKind,
    targetId: input.targetId,
    title: input.title,
    subtitle: input.subtitle,
    metricLabel: input.metricLabel,
    photoCount: input.sources.length,
    coverCandidates,
  };
}

function buildAlbums(
  sources: PhotoAlbumImageSource[],
  preferencesByTarget: Map<string, PhotoAlbumPreferenceDto>,
  duplicateUrlSet: Set<string>,
) {
  const albums: PhotoAlbumDto[] = [];
  const byYear = new Map<number, PhotoAlbumImageSource[]>();
  const byCity = new Map<string, PhotoAlbumImageSource[]>();
  const byCompanion = new Map<string, PhotoAlbumImageSource[]>();
  const byTrip = new Map<string, PhotoAlbumImageSource[]>();

  sources.forEach((source) => {
    const year = source.marker.visitedStartAt.getFullYear();
    byYear.set(year, [...(byYear.get(year) ?? []), source]);
    byCity.set(source.marker.city, [...(byCity.get(source.marker.city) ?? []), source]);
    byCompanion.set(source.marker.companion.id, [...(byCompanion.get(source.marker.companion.id) ?? []), source]);
    if (source.marker.trip) {
      byTrip.set(source.marker.trip.id, [...(byTrip.get(source.marker.trip.id) ?? []), source]);
    }
  });

  [...byYear.entries()]
    .sort((left, right) => right[0] - left[0])
    .forEach(([year, yearSources]) => {
      albums.push(
        createAlbum({
          id: `annual-${year}`,
          kind: 'annual',
          targetKind: 'annual',
          targetId: String(year),
          title: `${year} 年度精选`,
          subtitle: '按时间与精选权重生成的年度封面候选',
          metricLabel: `${yearSources.length} 张照片`,
          sources: yearSources,
          preferencesByTarget,
          duplicateUrlSet,
        }),
      );
    });

  [...byCity.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .slice(0, 12)
    .forEach(([city, citySources]) => {
      albums.push(
        createAlbum({
          id: `city-${city}`,
          kind: 'city',
          targetKind: 'city',
          targetId: city,
          title: `${city} 城市精选`,
          subtitle: '按地点聚合的可复用城市封面',
          metricLabel: `${citySources.length} 张照片`,
          sources: citySources,
          preferencesByTarget,
          duplicateUrlSet,
        }),
      );
    });

  [...byCompanion.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .forEach(([companionId, companionSources]) => {
      albums.push(
        createAlbum({
          id: `companion-${companionId}`,
          kind: 'companion',
          targetKind: 'companion',
          targetId: companionId,
          title: `${companionSources[0]?.marker.companion.name ?? '旅伴'}精选`,
          subtitle: '旅伴回忆与胶囊可共享的封面候选',
          metricLabel: `${companionSources.length} 张照片`,
          sources: companionSources,
          preferencesByTarget,
          duplicateUrlSet,
        }),
      );
    });

  [...byTrip.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .forEach(([tripId, tripSources]) => {
      albums.push(
        createAlbum({
          id: `trip-cover-${tripId}`,
          kind: 'tripCover',
          targetKind: 'trip',
          targetId: tripId,
          title: `${tripSources[0]?.marker.trip?.name ?? '行程'}封面候选`,
          subtitle: 'Story Studio、行程详情与胶囊共用的封面排序',
          metricLabel: `${tripSources.length} 张照片`,
          sources: tripSources,
          preferencesByTarget,
          duplicateUrlSet,
        }),
      );
    });

  return albums;
}

function buildDuplicateUrlSet(sources: PhotoAlbumImageSource[]) {
  const counts = new Map<string, number>();
  sources.forEach((source) => counts.set(source.imageUrl, (counts.get(source.imageUrl) ?? 0) + 1));
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([url]) => url));
}

function buildIssues(candidates: PhotoAlbumCandidateDto[]): PhotoAlbumIssueDto[] {
  const issueMeta: Record<PhotoAlbumIssueKindDto, { title: string; description: string }> = {
    duplicateUrl: { title: '重复图片', description: '检测到重复 URL，可在整理工作台合并或替换。' },
    invalidUrl: { title: '坏链风险', description: '第一阶段按 URL 格式识别，不发起远程探测。' },
    missingCaption: { title: '缺少说明', description: '补充说明后可提升故事、年度回顾和胶囊质量。' },
  };

  return (Object.keys(issueMeta) as PhotoAlbumIssueKindDto[])
    .map((kind) => ({
      kind,
      ...issueMeta[kind],
      photos: candidates.filter((candidate) => candidate.issueKinds.includes(kind)).slice(0, 12),
    }))
    .filter((issue) => issue.photos.length > 0);
}

export function serializePhotoAlbumPreference(source: PhotoAlbumPreferenceSource): PhotoAlbumPreferenceDto {
  return {
    id: source.id,
    targetKind: source.targetKind as PhotoAlbumPreferenceDto['targetKind'],
    targetId: source.targetId,
    pinnedImageIds: normalizeJsonStringArray(source.pinnedImageIds),
    sortOrder: normalizeJsonStringArray(source.sortOrderJson),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export function serializePhotoAlbumsResponse(
  sources: PhotoAlbumImageSource[],
  preferenceSources: PhotoAlbumPreferenceSource[],
): PhotoAlbumsResponseDto {
  const duplicateUrlSet = buildDuplicateUrlSet(sources);
  const preferences = preferenceSources.map(serializePhotoAlbumPreference);
  const preferencesByTarget = new Map(
    preferences.map((preference) => [preferenceKey(preference.targetKind, preference.targetId), preference]),
  );
  const albums = buildAlbums(sources, preferencesByTarget, duplicateUrlSet);
  const candidatesById = new Map<string, PhotoAlbumCandidateDto>();
  albums.forEach((album) => {
    album.coverCandidates.forEach((candidate) => candidatesById.set(candidate.imageId, candidate));
  });
  const allCandidates = [...candidatesById.values()].sort(compareCandidates);
  const issues = buildIssues(allCandidates);

  return {
    summary: {
      albumCount: albums.length,
      coverCandidateCount: allCandidates.length,
      pinnedCoverCount: allCandidates.filter((candidate) => candidate.isPinned).length,
      issueCount: issues.reduce((total, issue) => total + issue.photos.length, 0),
    },
    albums,
    issues,
    preferences,
  };
}
