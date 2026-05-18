import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  PrivateShareLinkDetailResponseDto,
  PrivateShareLinkListResponseDto,
  PrivateShareResourceTypeDto,
  PublicShareAccessResponseDto,
} from './types';

const shareLinksBaseUrl = getResourceBaseUrl();

export interface CreatePrivateShareLinkInput {
  resourceType: PrivateShareResourceTypeDto;
  resourceId: string;
  title?: string;
  expiresAt?: string;
  password?: string;
  maxAccessCount?: number;
}

export function listPrivateShareLinks() {
  return httpClient.get<PrivateShareLinkListResponseDto>(shareLinksBaseUrl, '/share-links');
}

export function createPrivateShareLink(input: CreatePrivateShareLinkInput) {
  return httpClient.post<PrivateShareLinkDetailResponseDto>(shareLinksBaseUrl, '/share-links', input);
}

export function revokePrivateShareLink(linkId: string) {
  return httpClient.post<PrivateShareLinkDetailResponseDto>(
    shareLinksBaseUrl,
    `/share-links/${encodeURIComponent(linkId)}/revoke`,
    {},
  );
}

export function accessPublicShareLink(token: string, password?: string) {
  return httpClient.post<PublicShareAccessResponseDto>(
    shareLinksBaseUrl,
    `/public/share-links/${encodeURIComponent(token)}/access`,
    password ? { password } : {},
  );
}
