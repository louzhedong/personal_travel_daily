import type {
  TripDetailGuideItemDto,
  TripDetailMarkerItemDto,
  TripDetailPhotoItemDto,
  TripDetailResponseDto,
} from '../../lib/api/types';
import { formatDateRange, formatVisitedRange } from '../../lib/date';

export interface TripMarkerGroup {
  date: string;
  items: TripDetailMarkerItemDto[];
}

export interface TripPhotoGroup {
  date: string;
  items: TripDetailPhotoItemDto[];
}

export interface TripCoverOption {
  value: string;
  label: string;
}

export interface TripChecklistSummaryCard {
  label: string;
  value: number;
  description: string;
}

export function buildTripDetailSummaryCards(data: TripDetailResponseDto) {
  return [
    { label: '旅行记录', value: data.summary.markerCount, description: '当前行程内的记录总数' },
    { label: '旅行天数', value: data.summary.travelDays, description: '按日期去重后的覆盖天数' },
    { label: '覆盖城市', value: data.summary.cityCount, description: '不同城市数量' },
    { label: '覆盖地区', value: data.summary.regionCount, description: '不同地区数量' },
    { label: '旅伴人数', value: data.summary.companionCount, description: '参与该行程的旅伴数' },
    { label: '关联攻略', value: data.summary.guideCount, description: '和行程记录相关的收藏攻略' },
    { label: '行程照片', value: data.summary.photoCount, description: '当前行程记录中带图的照片数' },
  ];
}

export function groupTripDetailMarkers(markers: TripDetailMarkerItemDto[]): TripMarkerGroup[] {
  const groups = new Map<string, TripDetailMarkerItemDto[]>();

  markers.forEach((marker) => {
    const current = groups.get(marker.visitedStartAt) ?? [];
    current.push(marker);
    groups.set(marker.visitedStartAt, current);
  });

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items,
  }));
}

export function groupTripDetailPhotos(photos: TripDetailPhotoItemDto[]): TripPhotoGroup[] {
  const groups = new Map<string, TripDetailPhotoItemDto[]>();

  photos.forEach((photo) => {
    const current = groups.get(photo.visitedStartAt) ?? [];
    current.push(photo);
    groups.set(photo.visitedStartAt, current);
  });

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items,
  }));
}

export function formatTripDetailDateRange(startAt: string, endAt: string) {
  return formatDateRange(startAt, endAt);
}

export function formatTripMarkerRange(marker: TripDetailMarkerItemDto) {
  return formatVisitedRange(marker);
}

export function buildTripPhotoAlt(photo: TripDetailPhotoItemDto) {
  return `${photo.markerTitle} ${photo.visitedStartAt}`;
}

export function buildTripCoverOptions(photos: TripDetailPhotoItemDto[]): TripCoverOption[] {
  const seen = new Set<string>();

  return photos.flatMap((photo) => {
    if (seen.has(photo.imageUrl)) {
      return [];
    }

    seen.add(photo.imageUrl);
    return [
      {
        value: photo.imageUrl,
        label: `${photo.markerTitle} · ${photo.visitedStartAt}`,
      },
    ];
  });
}

export function buildTripGuideMeta(guide: TripDetailGuideItemDto) {
  return `${guide.result.sourceName} · ${guide.savedAt.slice(0, 10)}`;
}

export function buildTripChecklistSummaryCards(data: TripDetailResponseDto): TripChecklistSummaryCard[] {
  return [
    { label: '总条目', value: data.checklistSummary.total, description: '这次行程的全部清单项数量' },
    { label: '出发前', value: data.checklistSummary.preDepartureCount, description: '行前准备和预约确认' },
    { label: '旅途中', value: data.checklistSummary.inTransitCount, description: '路上提醒和现场留意事项' },
    { label: '已完成', value: data.checklistSummary.doneCount, description: '已经完成的准备和行程事项' },
  ];
}

export function isTripDetailNotFoundError(message: string) {
  return /not found|不存在|无权访问/i.test(message);
}
