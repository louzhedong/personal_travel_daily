// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAppApiEnvMock: vi.fn(),
}));

vi.mock('../appApi/env.js', () => ({
  getAppApiEnv: mocks.getAppApiEnvMock,
}));

import { getGuideDocumentBySourceUrl } from '../appApi/services/guideDocumentService.js';

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
}

describe('guideDocumentService', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    mocks.getAppApiEnvMock.mockReset();
    mocks.getAppApiEnvMock.mockReturnValue({
      GUIDE_API_BASE_URL: 'http://127.0.0.1:8383',
    });
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to the guide document endpoint and returns valid payloads', async () => {
    const payload = {
      id: 'guide-1',
      title: '京都散步',
      summary: '一路慢慢走',
      sourceName: 'Qyer',
      sourceUrl: 'https://example.com/guide',
      fetchedAt: '2026-04-01T00:00:00.000Z',
      blocks: [{ id: 'b1', type: 'paragraph', text: '正文' }],
      aiSummary: {
        highlights: ['鸭川'],
        routeTips: ['路线'],
        transportTips: ['交通'],
        warnings: ['预约'],
      },
    };
    fetchMock.mockResolvedValueOnce(createJsonResponse(payload));

    const result = await getGuideDocumentBySourceUrl('https://example.com/guide');

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8383/api/guides/document', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sourceUrl: 'https://example.com/guide' }),
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual(payload);
  });

  it('returns null for 404, non-ok responses, and invalid payloads', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({}, { status: 404 }));
    await expect(getGuideDocumentBySourceUrl('https://example.com/404')).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(createJsonResponse({}, { status: 500 }));
    await expect(getGuideDocumentBySourceUrl('https://example.com/500')).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 'bad',
        title: '缺字段',
      }),
    );
    await expect(getGuideDocumentBySourceUrl('https://example.com/bad')).resolves.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    await expect(getGuideDocumentBySourceUrl('https://example.com/error')).resolves.toBeNull();
  });
});
