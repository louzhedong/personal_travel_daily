import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  AcceptContributionInboxBodyDto,
  ContributionDropBoxListResponseDto,
  ContributionDropBoxWithTokenDto,
  ContributionInboxActionResponseDto,
  ContributionInboxListResponseDto,
  ContributionPublicMetaDto,
  ContributionPublicSubmitBodyDto,
  ContributionPublicSubmitResponseDto,
  CreateContributionDropBoxBodyDto,
} from './dto/contribution';

/**
 * G4 · Companion Contribution Drop-Box API client / 旅伴匿名贡献 API 客户端
 * 私有路由 + 公开 /c/:slug/* 路由（绕过 /api 前缀，直连 origin）。
 */

// ── 私有：dropbox 管理 ──────────────────────────────────────────────────────
export async function createContributionDropBox(body: CreateContributionDropBoxBodyDto) {
  return httpClient.post<ContributionDropBoxWithTokenDto>(
    getResourceBaseUrl(),
    '/contribution/drops',
    body,
  );
}

export async function listContributionDropBoxes() {
  return httpClient.get<ContributionDropBoxListResponseDto>(
    getResourceBaseUrl(),
    '/contribution/drops',
  );
}

export async function revokeContributionDropBox(dropBoxId: string) {
  return httpClient.delete<{ ok: true }>(
    getResourceBaseUrl(),
    `/contribution/drops/${dropBoxId}`,
  );
}

// ── 私有：inbox 审核 ────────────────────────────────────────────────────────
export async function listContributionInbox() {
  return httpClient.get<ContributionInboxListResponseDto>(
    getResourceBaseUrl(),
    '/contribution/inbox',
  );
}

export async function acceptContributionInboxItem(
  itemId: string,
  body: AcceptContributionInboxBodyDto,
) {
  return httpClient.post<ContributionInboxActionResponseDto>(
    getResourceBaseUrl(),
    `/contribution/inbox/${itemId}/accept`,
    body,
  );
}

export async function rejectContributionInboxItem(itemId: string) {
  return httpClient.post<ContributionInboxActionResponseDto>(
    getResourceBaseUrl(),
    `/contribution/inbox/${itemId}/reject`,
    {},
  );
}

export function buildContributionInboxImageUrl(itemId: string) {
  return `${getResourceBaseUrl()}/contribution/inbox/${itemId}/image`;
}

// ── 公开：旅伴投稿（write-only） ────────────────────────────────────────────
function getPublicOrigin() {
  // resourceBaseUrl 通常类似 "/api"，公开页路径走 "/c/*"，故剥离 "/api" 后缀。
  const base = getResourceBaseUrl();
  return base.replace(/\/api\/?$/, '');
}

export async function fetchContributionPublicMeta(slug: string) {
  return httpClient.get<ContributionPublicMetaDto>(
    getPublicOrigin(),
    `/c/${slug}/meta`,
  );
}

export async function submitContributionPublic(
  slug: string,
  body: ContributionPublicSubmitBodyDto,
) {
  return httpClient.post<ContributionPublicSubmitResponseDto>(
    getPublicOrigin(),
    `/c/${slug}/submit`,
    body,
  );
}
