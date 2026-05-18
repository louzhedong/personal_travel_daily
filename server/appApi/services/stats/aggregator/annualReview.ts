import type { AnnualReviewResponseDto } from '../../../types.js';
import type { StatsOverviewModel } from '../../../serializers/statsSerializer.js';
import { countTravelDays, getYear, toDateOnlyString } from './dates.js';
import { buildTripHighlights } from './rankings.js';
import type { RawMarker } from './types.js';

export function toIsoString(value: Date) {
  return value.toISOString();
}

export function buildPhotos(markers: RawMarker[]): AnnualReviewResponseDto['photos'] {
  return markers
    .flatMap((marker) =>
      marker.images.map((image) => ({
        imageId: image.id,
        markerId: marker.id,
        markerTitle: `${marker.scopeName} 路 ${marker.city}`,
        imageUrl: image.imageUrl,
        visitedStartAt: toDateOnlyString(marker.visitedStartAt),
        scopeName: marker.scopeName,
        city: marker.city,
        isFeatured: image.isFeatured,
        caption: image.caption ?? undefined,
        curatedSortOrder: image.curatedSortOrder ?? undefined,
        originalSortOrder: image.sortOrder,
      })),
    )
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }
      const leftCurated = left.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      const rightCurated = right.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      if (leftCurated !== rightCurated) {
        return leftCurated - rightCurated;
      }
      const dateCompare = left.visitedStartAt.localeCompare(right.visitedStartAt);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return left.originalSortOrder - right.originalSortOrder;
    })
    .map(({ originalSortOrder, ...photo }) => photo);
}

export function buildAnnualGuides(markers: RawMarker[]): AnnualReviewResponseDto['guides'] {
  const guides = new Map<string, AnnualReviewResponseDto['guides'][number]>();

  markers.forEach((marker) => {
    marker.savedGuides.forEach((guide) => {
      const current = guides.get(guide.guideIdentity);
      const item = {
        id: guide.id,
        markerId: guide.markerId ?? undefined,
        keyword: guide.keyword,
        savedAt: toIsoString(guide.savedAt),
        title: guide.guideTitle,
        summary: guide.guideSummary,
        sourceName: guide.guideSourceName,
        sourceUrl: guide.guideSourceUrl,
      };

      if (!current || item.savedAt > current.savedAt) {
        guides.set(guide.guideIdentity, item);
      }
    });
  });

  return Array.from(guides.values()).sort((left, right) => right.savedAt.localeCompare(left.savedAt)).slice(0, 8);
}

export function serializeAnnualMarker(marker: RawMarker): AnnualReviewResponseDto['firstMarker'] {
  return {
    id: marker.id,
    tripId: marker.tripId ?? undefined,
    companionId: marker.companionId,
    companionName: marker.companion.name,
    companionColor: marker.companion.color,
    scope: marker.scope,
    scopeId: marker.scopeId,
    scopeName: marker.scopeName,
    city: marker.city,
    note: marker.note,
    visitedStartAt: toDateOnlyString(marker.visitedStartAt),
    visitedEndAt: toDateOnlyString(marker.visitedEndAt),
  };
}

export function buildAnnualTripHighlights(
  monthlyDistribution: AnnualReviewResponseDto['monthlyDistribution'],
  companionRanking: AnnualReviewResponseDto['companionRanking'],
  tripDetails: StatsOverviewModel['tripDetails'],
  topRegions: AnnualReviewResponseDto['topRegions'],
  topCities: AnnualReviewResponseDto['topCities'],
) {
  const baseHighlights = buildTripHighlights(tripDetails);
  const busiestMonth = [...monthlyDistribution].sort((left, right) => {
    if (right.markerCount !== left.markerCount) {
      return right.markerCount - left.markerCount;
    }
    if (right.travelDays !== left.travelDays) {
      return right.travelDays - left.travelDays;
    }
    return left.month.localeCompare(right.month);
  })[0];

  return {
    ...baseHighlights,
    busiestMonth: busiestMonth && busiestMonth.markerCount > 0 ? busiestMonth : undefined,
    topCompanion: companionRanking[0],
    topRegion: topRegions[0],
    topCity: topCities[0],
  };
}

export function buildAvailableYears(markers: RawMarker[]) {
  return Array.from(new Set(markers.map((marker) => getYear(marker.visitedStartAt)))).sort((left, right) =>
    right.localeCompare(left),
  );
}
