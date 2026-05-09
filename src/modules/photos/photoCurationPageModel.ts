import type {
  PhotoCurationCaptionFilterDto,
  PhotoCurationFeaturedFilterDto,
  PhotoCurationItemDto,
  PhotoCurationResponseDto,
} from '../../lib/api/types';

export const PHOTO_FEATURED_FILTER_OPTIONS: Array<{ value: PhotoCurationFeaturedFilterDto; label: string }> = [
  { value: 'all', label: '全部照片' },
  { value: 'featured', label: '已精选' },
  { value: 'unfeatured', label: '待精选' },
];

export const PHOTO_CAPTION_FILTER_OPTIONS: Array<{ value: PhotoCurationCaptionFilterDto; label: string }> = [
  { value: 'all', label: '全部说明' },
  { value: 'withCaption', label: '已有说明' },
  { value: 'missingCaption', label: '待补说明' },
];

export function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function buildPhotoCurationAlt(photo: PhotoCurationItemDto) {
  return `${photo.scopeName} ${photo.city} 的旅行照片`;
}

export function getHeroPhotos(data: PhotoCurationResponseDto) {
  const source = data.sections.featured.length > 0 ? data.sections.featured : data.sections.recent;
  return source.slice(0, 5);
}

export function getWorklistPhotos(data: PhotoCurationResponseDto) {
  const missingCaptionIds = new Set(data.sections.missingCaptions.map((item) => item.imageId));
  const merged = [
    ...data.sections.missingCaptions,
    ...data.items.filter((item) => !item.isFeatured || !item.caption?.trim()),
  ];
  const seen = new Set<string>();

  return merged
    .filter((item) => {
      if (seen.has(item.imageId)) {
        return false;
      }
      seen.add(item.imageId);
      return true;
    })
    .sort((left, right) => {
      const leftPriority = missingCaptionIds.has(left.imageId) ? 0 : 1;
      const rightPriority = missingCaptionIds.has(right.imageId) ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return new Date(right.visitedStartAt).getTime() - new Date(left.visitedStartAt).getTime();
    })
    .slice(0, 24);
}

export function getPhotoCurationEmptyText() {
  return '暂无照片素材';
}
