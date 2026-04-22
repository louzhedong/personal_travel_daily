import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getBootstrapBaseUrl,
  getResourceBaseUrl,
  httpClient,
} from '../httpClient';

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
}

describe('httpClient', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv('VITE_APP_API_BASE_URL', '/api/app');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('derives bootstrap and resource base urls from VITE_APP_API_BASE_URL', () => {
    expect(getBootstrapBaseUrl()).toBe('/api/app');
    expect(getResourceBaseUrl()).toBe('/api');
  });

  it('builds GET requests with query params against the app api port', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ ok: true }));

    const response = await httpClient.get<{ ok: boolean }>('/api', '/guide-search-histories', {
      companionId: 'user-alice',
      limit: 6,
      ignored: undefined,
    });

    expect(response).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8788/api/guide-search-histories?companionId=user-alice&limit=6',
      {
        method: 'GET',
        credentials: 'include',
        headers: undefined,
        body: undefined,
      },
    );
  });

  it('sends JSON payloads for POST requests', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ saved: true }));

    const payload = {
      savedByUserId: 'user-alice',
      keyword: '京都',
    };

    const response = await httpClient.post<{ saved: boolean }>('/api', '/saved-guides', payload);

    expect(response).toEqual({ saved: true });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8788/api/saved-guides', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  });

  it('falls back across candidate base urls when earlier attempts return 404', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ error: { message: 'not found' } }, { status: 404 }))
      .mockResolvedValueOnce(createJsonResponse({ ok: true }));

    const response = await httpClient.get<{ ok: boolean }>('/api/app', '/bootstrap');

    expect(response).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8788/api/app/bootstrap');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://127.0.0.1:8788/api/app/bootstrap');
  });

  it('surfaces backend error messages for non-404 failures', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          error: {
            code: 'DATABASE_UNAVAILABLE',
            message: 'database is unavailable, please start MySQL and retry',
          },
        },
        { status: 503 },
      ),
    );

    await expect(httpClient.get('http://app-api.example/api/app', '/bootstrap')).rejects.toThrow(
      'database is unavailable, please start MySQL and retry',
    );
  });
});
