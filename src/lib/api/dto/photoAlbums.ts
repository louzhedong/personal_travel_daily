import type { PhotoCurationItemDto } from './photos';

export type PhotoAlbumKindDto = 'annual' | 'city' | 'companion' | 'tripCover';
export type PhotoAlbumPreferenceTargetKindDto = 'annual' | 'city' | 'companion' | 'trip' | 'capsule';
export type PhotoAlbumIssueKindDto = 'duplicateUrl' | 'invalidUrl' | 'missingCaption';

export interface PhotoAlbumCandidateDto extends PhotoCurationItemDto {
  score: number;
  isPinned: boolean;
  issueKinds: PhotoAlbumIssueKindDto[];
}

export interface PhotoAlbumDto {
  id: string;
  kind: PhotoAlbumKindDto;
  targetKind: PhotoAlbumPreferenceTargetKindDto;
  targetId: string;
  title: string;
  subtitle: string;
  metricLabel: string;
  photoCount: number;
  coverCandidates: PhotoAlbumCandidateDto[];
}

export interface PhotoAlbumIssueDto {
  kind: PhotoAlbumIssueKindDto;
  title: string;
  description: string;
  photos: PhotoAlbumCandidateDto[];
}

export interface PhotoAlbumPreferenceDto {
  id: string;
  targetKind: PhotoAlbumPreferenceTargetKindDto;
  targetId: string;
  pinnedImageIds: string[];
  sortOrder: string[];
  updatedAt: string;
}

export interface PhotoAlbumsResponseDto {
  summary: {
    albumCount: number;
    coverCandidateCount: number;
    pinnedCoverCount: number;
    issueCount: number;
  };
  albums: PhotoAlbumDto[];
  issues: PhotoAlbumIssueDto[];
  preferences: PhotoAlbumPreferenceDto[];
}

export interface UpdatePhotoAlbumPreferenceInput {
  targetKind: PhotoAlbumPreferenceTargetKindDto;
  targetId: string;
  pinnedImageIds?: string[];
  sortOrder?: string[];
}

export interface UpdatePhotoAlbumPreferencesInput {
  preferences: UpdatePhotoAlbumPreferenceInput[];
}
