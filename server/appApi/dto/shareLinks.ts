import type {
  AnnualReviewResponseDto,
} from './stats.js';
import type {
  CompanionMemoryResponseDto,
} from './companions.js';
import type {
  MemoryCapsuleDetailDto,
} from './memoryCapsules.js';
import type {
  TripDetailResponseDto,
} from './trips.js';

export type PrivateShareResourceTypeDto = 'trip_story' | 'annual_review' | 'companion_memory' | 'memory_capsule';
export type PrivateShareStatusDto = 'active' | 'expired' | 'revoked' | 'depleted';

export interface PrivateShareLinkDto {
  id: string;
  resourceType: PrivateShareResourceTypeDto;
  resourceId: string;
  title: string;
  status: PrivateShareStatusDto;
  url?: string;
  tokenPreview: string;
  passwordProtected: boolean;
  expiresAt?: string;
  maxAccessCount?: number;
  accessCount: number;
  lastAccessedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateShareAccessLogDto {
  id: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  accessedAt: string;
}

export interface PrivateShareLinkListResponseDto {
  links: PrivateShareLinkDto[];
}

export interface PrivateShareLinkDetailResponseDto {
  link: PrivateShareLinkDto;
}

export interface PublicShareResourceDto {
  kind: PrivateShareResourceTypeDto;
  title: string;
  generatedAt: string;
  tripStory?: TripDetailResponseDto;
  annualReview?: AnnualReviewResponseDto;
  companionMemory?: CompanionMemoryResponseDto;
  memoryCapsule?: MemoryCapsuleDetailDto;
}

export interface PublicShareAccessResponseDto {
  passwordRequired?: boolean;
  link?: Pick<
    PrivateShareLinkDto,
    'id' | 'resourceType' | 'resourceId' | 'title' | 'expiresAt' | 'accessCount' | 'maxAccessCount' | 'createdAt'
  >;
  resource?: PublicShareResourceDto;
}
