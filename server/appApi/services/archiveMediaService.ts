import { randomUUID, createHash } from 'node:crypto';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPrismaClient } from '../prisma.js';

/**
 * F1 · Archive Media Fetcher / 离线纪念册原图抓取
 * Downloads remote photo URLs into a local cache (SHA256 dedup) so that exported ZIPs
 * can include actual image bytes instead of URL references only.
 *
 * F1 · 把行程纪念册中的远端图片 URL 真正下载落盘并按 SHA256 去重，
 * 使导出 ZIP 包从"指针包"升级为"真离线纪念册"。
 */

const DEFAULT_CACHE_DIR = process.env.ARCHIVE_MEDIA_CACHE_DIR ?? 'var/archive-cache';
const DEFAULT_FETCH_TIMEOUT_MS = Number(process.env.ARCHIVE_MEDIA_TIMEOUT_MS ?? 15000);
const DEFAULT_MEDIA_MAX_MB = Number(process.env.ARCHIVE_MEDIA_MAX_MB ?? 500);

export function isMediaArchiveEnabled() {
  const flag = process.env.ARCHIVE_INCLUDE_MEDIA;
  if (flag === undefined) return true;
  return flag.toLowerCase() !== 'false' && flag !== '0';
}

export interface ArchiveMediaItem {
  id: string;
  sourceUrl: string;
  sha256: string;
  byteSize: number;
  mimeType: string | null;
  localPath: string;
  fetchedAt: Date;
  bytes: Uint8Array;
}

async function ensureCacheDir(accountId: string) {
  const dir = join(DEFAULT_CACHE_DIR, accountId);
  await mkdir(dir, { recursive: true });
  return dir;
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`media fetch failed: ${response.status} ${response.statusText}`);
    }
    const buffer = new Uint8Array(await response.arrayBuffer());
    const mime = response.headers.get('content-type');
    return { buffer, mime };
  } finally {
    clearTimeout(timer);
  }
}

function sha256Hex(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

export interface FetchMediaOptions {
  accountId: string;
  timeoutMs?: number;
  maxBytes?: number;
}

export async function fetchAndCacheMedia(
  sourceUrl: string,
  options: FetchMediaOptions,
): Promise<ArchiveMediaItem | null> {
  if (!isMediaArchiveEnabled()) {
    return null;
  }
  const prisma = getPrismaClient();
  const trimmedUrl = sourceUrl.trim();
  if (!trimmedUrl) return null;

  const cached = await prisma.archiveMediaCache.findFirst({
    where: { accountId: options.accountId, sourceUrl: trimmedUrl },
    orderBy: { fetchedAt: 'desc' },
  });

  if (cached) {
    try {
      await stat(cached.localPath);
      await prisma.archiveMediaCache.update({
        where: { id: cached.id },
        data: { lastUsedAt: new Date() },
      });
      const { readFile } = await import('node:fs/promises');
      const bytes = await readFile(cached.localPath);
      return {
        id: cached.id,
        sourceUrl: cached.sourceUrl,
        sha256: cached.sha256,
        byteSize: cached.byteSize,
        mimeType: cached.mimeType,
        localPath: cached.localPath,
        fetchedAt: cached.fetchedAt,
        bytes: new Uint8Array(bytes),
      };
    } catch {
      // cache file missing → re-fetch
    }
  }

  const { buffer, mime } = await fetchWithTimeout(
    trimmedUrl,
    options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS,
  );
  const maxBytes = (options.maxBytes ?? DEFAULT_MEDIA_MAX_MB) * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    throw new Error(`media exceeds quota (${buffer.byteLength} > ${maxBytes})`);
  }

  const sha = sha256Hex(buffer);
  const dir = await ensureCacheDir(options.accountId);
  const ext = mime?.includes('png')
    ? 'png'
    : mime?.includes('webp')
      ? 'webp'
      : mime?.includes('gif')
        ? 'gif'
        : 'jpg';
  const localPath = join(dir, `${sha}.${ext}`);
  await writeFile(localPath, buffer);

  const existingBySha = await prisma.archiveMediaCache.findFirst({
    where: { accountId: options.accountId, sha256: sha },
  });
  const fetchedAt = new Date();
  const record = existingBySha
    ? await prisma.archiveMediaCache.update({
        where: { id: existingBySha.id },
        data: {
          sourceUrl: trimmedUrl,
          byteSize: buffer.byteLength,
          mimeType: mime,
          localPath,
          fetchedAt,
          lastUsedAt: fetchedAt,
        },
      })
    : await prisma.archiveMediaCache.create({
        data: {
          id: randomUUID(),
          accountId: options.accountId,
          sourceUrl: trimmedUrl,
          sha256: sha,
          byteSize: buffer.byteLength,
          mimeType: mime,
          localPath,
          fetchedAt,
          lastUsedAt: fetchedAt,
        },
      });

  return {
    id: record.id,
    sourceUrl: record.sourceUrl,
    sha256: record.sha256,
    byteSize: record.byteSize,
    mimeType: record.mimeType,
    localPath: record.localPath,
    fetchedAt: record.fetchedAt,
    bytes: buffer,
  };
}

export interface ManifestMediaEntry {
  id: string;
  sha256: string;
  path: string;
  sourceUrl: string;
  fetchedAt: string;
  byteSize: number;
  mimeType: string | null;
}

export async function buildArchiveMediaBundle(accountId: string, urls: string[]) {
  if (!isMediaArchiveEnabled()) {
    return { included: false as const, items: [] as ArchiveMediaItem[], manifest: [] as ManifestMediaEntry[] };
  }
  const unique = Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean)));
  const items: ArchiveMediaItem[] = [];
  for (const url of unique) {
    try {
      const item = await fetchAndCacheMedia(url, { accountId });
      if (item) items.push(item);
    } catch (error) {
      // log-only; never block archive generation if a single URL fails
      // eslint-disable-next-line no-console
      console.warn('[archive-media] fetch failed', url, error);
    }
  }
  const manifest: ManifestMediaEntry[] = items.map((item) => ({
    id: item.id,
    sha256: item.sha256,
    path: `media/photos/${item.sha256}.${item.mimeType?.includes('png') ? 'png' : item.mimeType?.includes('webp') ? 'webp' : 'jpg'}`,
    sourceUrl: item.sourceUrl,
    fetchedAt: item.fetchedAt.toISOString(),
    byteSize: item.byteSize,
    mimeType: item.mimeType,
  }));
  return { included: true as const, items, manifest };
}
