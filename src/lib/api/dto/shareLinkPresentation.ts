/**
 * F4 · Public Share v3 DTOs / 公开分享 v3 DTO（前端镜像）
 */
export type ShareTemplateDto = 'magazine' | 'postcard' | 'minimal' | 'polaroid';

export interface ShareLinkPresentationDto {
  id: string;
  shareLinkId: string;
  template: ShareTemplateDto;
  slug: string;
  ogTitle: string | null;
  ogSubtitle: string | null;
  ogCoverUrl: string | null;
  themeColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShareTemplatePreviewDto {
  template: ShareTemplateDto;
  label: string;
  description: string;
  themeColor: string;
}

export interface ShareTemplateListDto {
  items: ShareTemplatePreviewDto[];
}

export interface UpsertShareLinkPresentationBodyDto {
  shareLinkId: string;
  template: ShareTemplateDto;
  slug: string;
  ogTitle?: string;
  ogSubtitle?: string;
  ogCoverUrl?: string;
  themeColor?: string;
}
