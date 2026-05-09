import type {
  PhotoCurationCompanionFilterOptionDto,
  PhotoCurationFilterOptionDto,
  PhotoCurationItemDto,
  PhotoCurationResponseDto,
  PhotoCurationYearFilterOptionDto,
} from '../types.js';

interface PhotoCurationImageSource {
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

function getYear(value: Date) {
  return value.getFullYear();
}

function comparePhotoCurationItems(left: PhotoCurationItemDto, right: PhotoCurationItemDto) {
  if (left.isFeatured !== right.isFeatured) {
    return left.isFeatured ? -1 : 1;
  }

  const leftOrder = left.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return new Date(right.visitedStartAt).getTime() - new Date(left.visitedStartAt).getTime();
}

export function serializePhotoCurationItem(source: PhotoCurationImageSource): PhotoCurationItemDto {
  return {
    imageId: source.id,
    imageUrl: source.imageUrl,
    markerId: source.marker.id,
    markerTitle: `${source.marker.scopeName} · ${source.marker.city}`,
    tripId: source.marker.trip?.id,
    tripName: source.marker.trip?.name,
    companionId: source.marker.companion.id,
    companionName: source.marker.companion.name,
    companionColor: source.marker.companion.color,
    scopeName: source.marker.scopeName,
    city: source.marker.city,
    visitedStartAt: source.marker.visitedStartAt.toISOString(),
    isFeatured: source.isFeatured,
    caption: source.caption ?? undefined,
    curatedSortOrder: source.curatedSortOrder ?? undefined,
  };
}

function buildTripFilters(items: PhotoCurationItemDto[]): PhotoCurationFilterOptionDto[] {
  const trips = new Map<string, PhotoCurationFilterOptionDto>();

  items.forEach((item) => {
    if (!item.tripId || !item.tripName) {
      return;
    }

    const current = trips.get(item.tripId) ?? {
      id: item.tripId,
      name: item.tripName,
      photoCount: 0,
    };
    trips.set(item.tripId, {
      ...current,
      photoCount: current.photoCount + 1,
    });
  });

  return [...trips.values()].sort((left, right) => right.photoCount - left.photoCount);
}

function buildCompanionFilters(items: PhotoCurationItemDto[]): PhotoCurationCompanionFilterOptionDto[] {
  const companions = new Map<string, PhotoCurationCompanionFilterOptionDto>();

  items.forEach((item) => {
    const current = companions.get(item.companionId) ?? {
      id: item.companionId,
      name: item.companionName,
      color: item.companionColor,
      photoCount: 0,
    };
    companions.set(item.companionId, {
      ...current,
      photoCount: current.photoCount + 1,
    });
  });

  return [...companions.values()].sort((left, right) => right.photoCount - left.photoCount);
}

function buildYearFilters(items: PhotoCurationItemDto[]): PhotoCurationYearFilterOptionDto[] {
  const years = new Map<number, PhotoCurationYearFilterOptionDto>();

  items.forEach((item) => {
    const year = getYear(new Date(item.visitedStartAt));
    const current = years.get(year) ?? {
      year,
      photoCount: 0,
    };
    years.set(year, {
      ...current,
      photoCount: current.photoCount + 1,
    });
  });

  return [...years.values()].sort((left, right) => right.year - left.year);
}

export function serializePhotoCurationResponse(
  sources: PhotoCurationImageSource[],
  filteredItems: PhotoCurationItemDto[],
): PhotoCurationResponseDto {
  const allItems = sources.map(serializePhotoCurationItem).sort(comparePhotoCurationItems);
  const sortedItems = [...filteredItems].sort(comparePhotoCurationItems);
  const missingCaptionPhotos = allItems.filter((item) => !item.caption?.trim()).length;

  return {
    summary: {
      totalPhotos: allItems.length,
      featuredPhotos: allItems.filter((item) => item.isFeatured).length,
      missingCaptionPhotos,
      tripCount: buildTripFilters(allItems).length,
      companionCount: buildCompanionFilters(allItems).length,
      yearCount: buildYearFilters(allItems).length,
    },
    filters: {
      trips: buildTripFilters(allItems),
      companions: buildCompanionFilters(allItems),
      years: buildYearFilters(allItems),
    },
    sections: {
      featured: allItems.filter((item) => item.isFeatured).slice(0, 8),
      missingCaptions: allItems.filter((item) => !item.caption?.trim()).slice(0, 8),
      recent: [...allItems]
        .sort((left, right) => new Date(right.visitedStartAt).getTime() - new Date(left.visitedStartAt).getTime())
        .slice(0, 8),
    },
    items: sortedItems,
  };
}
