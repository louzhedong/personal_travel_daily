/**
 * G4 · Companion Contribution Drop-Box DTOs / 旅伴匿名只写贡献链接 DTO
 */
export type ContributionAcceptKindDto = 'photo' | 'note' | 'both';
export type ContributionInboxKindDto = 'photo' | 'note';
export type ContributionInboxStatusDto = 'pending' | 'accepted' | 'rejected';
export type ContributionAcceptedAsTypeDto = 'marker' | 'photo' | 'journal';

export interface ContributionDropBoxDto {
  id: string;
  tripId: string | null;
  tripName: string | null;
  title: string;
  slug: string;
  tokenPreview: string;
  acceptKind: ContributionAcceptKindDto;
  expiresAt: string;
  revokedAt: string | null;
  maxUploads: number;
  usedCount: number;
  pendingInboxCount: number;
  note: string | null;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContributionDropBoxWithTokenDto extends ContributionDropBoxDto {
  token: string;
}

export interface ContributionInboxItemDto {
  id: string;
  dropBoxId: string;
  dropBoxTitle: string;
  submittedAt: string;
  kind: ContributionInboxKindDto;
  imageUrl: string | null;
  imageByteSize: number | null;
  noteText: string | null;
  submitterDisplayName: string | null;
  eventDate: string | null;
  status: ContributionInboxStatusDto;
  acceptedAsType: ContributionAcceptedAsTypeDto | null;
  reviewedAt: string | null;
}

export interface CreateContributionDropBoxBodyDto {
  title: string;
  tripId?: string;
  acceptKind?: ContributionAcceptKindDto;
  expiresInDays?: number;
  maxUploads?: number;
  note?: string;
}

export interface ContributionDropBoxListResponseDto {
  dropBoxes: ContributionDropBoxDto[];
}

export interface ContributionInboxListResponseDto {
  items: ContributionInboxItemDto[];
}

export interface ContributionPublicMetaDto {
  title: string;
  acceptKind: ContributionAcceptKindDto;
  remainingUploads: number;
  expiresAt: string;
  active: boolean;
  note: string | null;
}

export interface ContributionPublicSubmitBodyDto {
  kind: ContributionInboxKindDto;
  noteText?: string;
  submitterDisplayName?: string;
  eventDate?: string;
  imageDataUrl?: string;
}

export interface ContributionPublicSubmitResponseDto {
  ok: true;
  remainingUploads: number;
}

export interface AcceptContributionInboxBodyDto {
  acceptedAsType: ContributionAcceptedAsTypeDto;
  tripId?: string;
  title?: string;
  city?: string;
  visitedAt?: string;
}

export interface ContributionInboxActionResponseDto {
  item: ContributionInboxItemDto;
}
