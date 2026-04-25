import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchGuideDocumentsSemantically } from '../llm/guideSemanticSearch.mjs';

let tempDir = '';

const baseConfig = {
  enabled: true,
  baseUrl: 'http://127.0.0.1:11434',
  chatModel: 'qwen2.5:3b',
  embedModel: 'embeddinggemma',
  timeoutMs: 12000,
  defaultSearchMode: 'smart',
  indexTtlHours: 168,
  get indexDir() {
    return path.join(tempDir, 'llm-index');
  },
};

const guides = [
  {
    id: 'hangzhou-easy',
    scope: 'domestic',
    title: '杭州轻松西湖路线',
    summary: '适合带老人慢慢走，包含西湖游船、灵隐寺和低强度散步。',
    sourceName: 'Local Guide',
    sourceUrl: 'https://example.com/hangzhou-easy',
    destinationLabel: '杭州',
    tags: ['老人', '轻松', '西湖'],
    publishedAt: '2026-04-01',
  },
  {
    id: 'kyoto-sakura',
    scope: 'international',
    title: '京都春日散步攻略',
    summary: '三日赏樱路线，节奏舒缓，覆盖哲学之道和岚山。',
    sourceName: 'Local Guide',
    sourceUrl: 'https://example.com/kyoto-sakura',
    destinationLabel: '京都',
    tags: ['赏樱', '三日'],
    publishedAt: '2026-03-01',
  },
];

function createClient() {
  const embed = vi.fn(async (text) => {
    const normalized = `${text}`;
    if (normalized.includes('杭州') || normalized.includes('老人') || normalized.includes('轻松')) {
      return [1, 0, 0];
    }
    if (normalized.includes('京都') || normalized.includes('赏樱')) {
      return [0, 1, 0];
    }
    return [0, 0, 1];
  });

  return {
    embed,
    chatJson: vi.fn(async () => ({
      destination: '杭州',
      preferences: ['老人', '轻松'],
      season: '',
      activities: ['西湖'],
      synonyms: ['低强度'],
      summary: '杭州 老人 轻松 西湖',
    })),
  };
}

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'guide-llm-'));
});

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

describe('guideSemanticSearch', () => {
  it('returns null when llm search is disabled or keyword mode is requested', async () => {
    await expect(
      searchGuideDocumentsSemantically(guides, { keyword: '杭州', searchMode: 'smart' }, {
        config: { ...baseConfig, enabled: false },
        client: createClient(),
      }),
    ).resolves.toBeNull();

    await expect(
      searchGuideDocumentsSemantically(guides, { keyword: '杭州', searchMode: 'keyword' }, {
        config: baseConfig,
        client: createClient(),
      }),
    ).resolves.toBeNull();
  });

  it('filters by scope, reranks by semantic similarity, and paginates results', async () => {
    const client = createClient();
    const response = await searchGuideDocumentsSemantically(
      guides,
      { keyword: '带老人杭州轻松路线', scope: 'domestic', page: 1, pageSize: 1, searchMode: 'smart' },
      { config: baseConfig, client, now: Date.parse('2026-04-25T00:00:00.000Z') },
    );

    expect(response?.provider).toBe('guide-api-local-llm');
    expect(response?.items).toHaveLength(1);
    expect(response?.items[0]?.id).toBe('hangzhou-easy');
    expect(response?.items[0]?.matchReason).toContain('杭州');
    expect(response?.hasMore).toBe(false);
  });

  it('reuses cached guide embeddings on later searches', async () => {
    const firstClient = createClient();
    await searchGuideDocumentsSemantically(guides, { keyword: '带老人杭州轻松路线' }, {
      config: baseConfig,
      client: firstClient,
      now: Date.parse('2026-04-25T00:00:00.000Z'),
    });

    const secondClient = createClient();
    await searchGuideDocumentsSemantically(guides, { keyword: '带老人杭州轻松路线' }, {
      config: baseConfig,
      client: secondClient,
      now: Date.parse('2026-04-25T00:10:00.000Z'),
    });

    expect(firstClient.embed).toHaveBeenCalledTimes(3);
    expect(secondClient.embed).toHaveBeenCalledTimes(1);
  });

  it('sanitizes query interpretation when the llm drifts away from the original query', async () => {
    const client = {
      embed: vi.fn(async (text) => {
        const normalized = `${text}`;
        return normalized.includes('京都') ? [0, 1, 0] : [0, 0, 1];
      }),
      chatJson: vi.fn(async () => ({
        destination: '丽江',
        preferences: ['自然景观'],
        season: '秋季',
        activities: ['美食'],
        synonyms: ['秋游'],
        summary: '寻找关于丽江秋季旅行的攻略，包括自然景观欣赏、历史文化探索以及美食体验活动。',
      })),
    };

    const response = await searchGuideDocumentsSemantically(
      guides,
      { keyword: '京都 赏樱 三日 不赶路', scope: 'international', page: 1, pageSize: 5, searchMode: 'smart' },
      { config: baseConfig, client, now: Date.parse('2026-04-25T00:00:00.000Z') },
    );

    expect(response?.items[0]?.queryInterpretation).toContain('京都');
    expect(response?.items[0]?.queryInterpretation).not.toContain('丽江');
    expect(response?.items[0]?.matchReason).toContain('京都');
  });
});
