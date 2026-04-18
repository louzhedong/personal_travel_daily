import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let tempDir = '';

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'guide-cache-'));
  process.env.GUIDE_CACHE_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.GUIDE_CACHE_DIR;
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

describe('guideFileStore', () => {
  it('persists fetched documents into the local cache library', async () => {
    vi.resetModules();
    const { loadCachedGuideCatalog, loadCachedGuideDocument, saveCachedGuideDocument } = await import(
      '../guideFileStore.mjs'
    );

    const document = {
      id: 'zh-wikivoyage-beijing',
      scope: 'all',
      title: '北京 | 维基导游',
      summary: '北京的中文旅行指南',
      sourceName: '维基导游',
      sourceUrl: 'https://zh.wikivoyage.org/wiki/%E5%8C%97%E4%BA%AC',
      destinationLabel: '北京',
      tags: ['中文攻略'],
      blocks: [
        { id: 'b1', type: 'section-title', text: '到达' },
        { id: 'b2', type: 'paragraph', text: '北京有多座火车站和国际机场。' },
      ],
      fetchedAt: '2026-04-17T12:00:00.000Z',
    };

    await saveCachedGuideDocument(document);

    const catalog = await loadCachedGuideCatalog();
    const restored = await loadCachedGuideDocument(document.sourceUrl);

    expect(catalog).toHaveLength(1);
    expect(catalog[0]?.sourceUrl).toBe(document.sourceUrl);
    expect(restored?.title).toBe(document.title);
  });
});
