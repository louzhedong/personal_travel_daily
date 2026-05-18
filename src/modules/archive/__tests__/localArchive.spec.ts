import { describe, expect, it } from 'vitest';
import {
  buildImageUrlList,
  buildLocalArchiveManifest,
  createStoredZipBlob,
  sanitizeArchiveFilename,
  uniqueImageUrls,
} from '../localArchive';

async function readBlobBytes(blob: Blob) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(new Uint8Array(reader.result as ArrayBuffer)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsArrayBuffer(blob);
  });
}

describe('localArchive', () => {
  it('builds a portable manifest with normalized files and unique image URLs', () => {
    const files = [{ path: 'content\\story.json', content: '{}' }];
    const manifest = buildLocalArchiveManifest(
      {
        packageType: 'trip',
        sourceId: 'trip-1',
        title: '江南春游',
        generatedAt: '2026-05-12T00:00:00.000Z',
        imageUrls: ['https://example.com/a.jpg', 'https://example.com/a.jpg', ''],
      },
      files,
    );

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.files).toEqual(['content/story.json']);
    expect(manifest.imageUrls).toEqual(['https://example.com/a.jpg']);
  });

  it('creates an uncompressed zip blob that contains central directory filenames', async () => {
    const blob = createStoredZipBlob([
      { path: 'manifest.json', content: '{"schemaVersion":1}' },
      { path: 'summary.md', content: '# Summary' },
    ]);
    const bytes = await readBlobBytes(blob);
    const zipText = new TextDecoder().decode(bytes);

    expect(blob.type).toBe('application/zip');
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(zipText).toContain('manifest.json');
    expect(zipText).toContain('summary.md');
  });

  it('sanitizes filenames and formats image URL lists', () => {
    expect(sanitizeArchiveFilename('江南/春游:2026')).toBe('江南-春游-2026');
    expect(uniqueImageUrls(['https://example.com/a.jpg', ' https://example.com/a.jpg '])).toEqual(['https://example.com/a.jpg']);
    expect(buildImageUrlList([])).toContain('No remote image URLs');
  });
});
