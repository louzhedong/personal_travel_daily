import type { OrganizationIssueDto, OrganizationWorkbenchResponseDto } from '../../lib/api/types';

export const ORGANIZATION_SECTION_LABELS = {
  unassignedMarkers: '未归行程记录',
  missingPhotoCaptions: '缺说明照片',
  unlinkedGuides: '未关联攻略',
  unfeaturedPhotos: '待精选照片',
  weakMarkerTags: '弱标签记录',
} as const;

export const ORGANIZATION_TAG_OPTIONS = [
  { value: 'photography', label: '摄影' },
  { value: 'citywalk', label: '城市漫步' },
  { value: 'food', label: '美食' },
  { value: 'nature', label: '自然' },
  { value: 'family', label: '同行' },
] as const;

export function getPrimaryIssues(data: OrganizationWorkbenchResponseDto): OrganizationIssueDto[] {
  return [
    ...data.sections.unassignedMarkers,
    ...data.sections.missingPhotoCaptions,
    ...data.sections.unfeaturedPhotos,
    ...data.sections.weakMarkerTags,
    ...data.sections.unlinkedGuides,
  ].slice(0, 18);
}

export function formatOrganizationDate(value?: string) {
  if (!value) {
    return '待整理';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function buildOrganizationProgressText(data: OrganizationWorkbenchResponseDto) {
  if (data.summary.totalIssues === 0) {
    return '当前素材已整理完毕';
  }
  return `${data.summary.totalIssues} 项待整理 · ${data.summary.readyTrips} 个可归档行程`;
}

