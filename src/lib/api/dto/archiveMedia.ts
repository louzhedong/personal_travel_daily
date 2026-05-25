/**
 * F1 · Archive media DTOs / 离线纪念册 DTO（前端镜像）
 */
export interface ArchiveMediaManifestEntryDto {
  id: string;
  sha256: string;
  path: string;
  sourceUrl: string;
  fetchedAt: string;
  byteSize: number;
  mimeType: string | null;
}

export interface ArchiveMediaPrepareResponseDto {
  enabled: boolean;
  manifest: ArchiveMediaManifestEntryDto[];
}

export interface ArchiveMediaStatusDto {
  enabled: boolean;
  maxMb: number;
}
