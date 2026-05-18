import type { MapReplayStoryResponseDto } from '../../lib/api/types';

export function getMapReplayStoryProgressText(data: MapReplayStoryResponseDto, index: number) {
  if (data.replay.length === 0) {
    return '等待第一段旅行轨迹';
  }
  return `${Math.min(index + 1, data.replay.length)} / ${data.replay.length}`;
}

export function getMapReplayStoryCurrentItem(data: MapReplayStoryResponseDto, index: number) {
  if (data.replay.length === 0) {
    return undefined;
  }
  return data.replay[Math.min(Math.max(index, 0), data.replay.length - 1)];
}

export function getMapReplayStoryHeroText(data: MapReplayStoryResponseDto) {
  if (data.summary.markerCount === 0) {
    return data.emptyStates[0] ?? '当前范围还没有旅行记录。';
  }
  return `${data.summary.markerCount} 段记录 · ${data.summary.cityCount} 座城市 · ${data.summary.photoCount} 张照片`;
}

export function getMapReplayStoryFeaturedPhotos(data: MapReplayStoryResponseDto, limit = 6) {
  return data.photos.slice(0, limit);
}
