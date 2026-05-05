import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpClient } from '../httpClient';

describe('httpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not retry alternate hosts after a backend HTTP response', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ message: 'Route GET:/api/wishlist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(httpClient.get('/api', '/wishlist')).rejects.toThrow('Route GET:/api/wishlist not found');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/wishlist', expect.any(Object));
  });
});
