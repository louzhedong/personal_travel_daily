import type {
  PhotoAlbumCandidateDto,
  PhotoAlbumDto,
  PhotoAlbumIssueDto,
  PhotoAlbumsResponseDto,
} from '../../lib/api/types';

export function getPrimaryPhotoAlbum(data: PhotoAlbumsResponseDto | null) {
  return data?.albums.find((album) => album.coverCandidates.length > 0) ?? data?.albums[0] ?? null;
}

export function getFeaturedPhotoAlbums(data: PhotoAlbumsResponseDto | null) {
  return (data?.albums ?? []).filter((album) => album.coverCandidates.length > 0).slice(0, 6);
}

export function getAlbumCover(album: PhotoAlbumDto) {
  return album.coverCandidates[0] ?? null;
}

export function getAlbumIssueText(issue: PhotoAlbumIssueDto) {
  if (issue.kind === 'duplicateUrl') return '重复';
  if (issue.kind === 'invalidUrl') return '坏链';
  return '说明';
}

export function getCandidateBadge(candidate: PhotoAlbumCandidateDto) {
  if (candidate.isPinned) return '已钉选';
  if (candidate.issueKinds.length > 0) return '需整理';
  return `${candidate.score} 分`;
}

export function buildPhotoAlbumAlt(candidate: PhotoAlbumCandidateDto) {
  return `${candidate.scopeName} ${candidate.city} 的封面候选`;
}
