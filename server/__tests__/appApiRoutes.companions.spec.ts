// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('companions', () => {
  it('returns INVALID_REQUEST when companion payload fails validation', async () => {
    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/companions',
        payload: {
          name: '',
          color: 'blue',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'INVALID_REQUEST',
          message: 'name is required',
        },
      });
      expect(mocks.createCompanionRecordMock).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('forwards companion update params and payload to the service layer', async () => {
    mocks.updateCompanionRecordMock.mockResolvedValue({
      users: [],
      markers: [],
      activeUserId: 'user-alice',
      savedGuides: [],
      guideSearchHistory: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/companions/user-bob',
        payload: {
          color: '#ea580c',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateCompanionRecordMock).toHaveBeenCalledWith('acct-1', 'user-bob', {
        color: '#ea580c',
      });
    } finally {
      await app.close();
    }
  });

  it('returns companion memory payload for the authenticated account', async () => {
    mocks.getCompanionMemoryMock.mockResolvedValue({
      companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
      summary: {
        markerCount: 1,
        travelDays: 2,
        tripCount: 1,
        cityCount: 1,
        regionCount: 1,
        photoCount: 1,
        guideCount: 0,
        headline: '你们一起留下了 1 段旅行记忆。',
      },
      yearlySeries: [],
      topRegions: [],
      topCities: [],
      themes: [],
      trips: [],
      photos: [],
      guides: [],
      milestones: [],
      snapshot: {
        generatedAt: '2026-05-08T00:00:00.000Z',
        expiresAt: '2026-05-09T00:00:00.000Z',
        stale: false,
        sourceMarkerCount: 1,
        sourcePhotoCount: 1,
        sourceGuideCount: 0,
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/companions/user-alice/memories',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().companion.name).toBe('小悠');
      expect(mocks.getCompanionMemoryMock).toHaveBeenCalledWith('acct-1', 'user-alice');
    } finally {
      await app.close();
    }
  });

  it('refreshes companion memory payload explicitly', async () => {
    mocks.refreshCompanionMemoryMock.mockResolvedValue({
      companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
      summary: {
        markerCount: 0,
        travelDays: 0,
        tripCount: 0,
        cityCount: 0,
        regionCount: 0,
        photoCount: 0,
        guideCount: 0,
        headline: '还没有和小悠留下旅行记录。',
      },
      yearlySeries: [],
      topRegions: [],
      topCities: [],
      themes: [],
      trips: [],
      photos: [],
      guides: [],
      milestones: [],
      snapshot: {
        generatedAt: '2026-05-08T00:00:00.000Z',
        expiresAt: '2026-05-09T00:00:00.000Z',
        stale: false,
        sourceMarkerCount: 0,
        sourcePhotoCount: 0,
        sourceGuideCount: 0,
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/companions/user-alice/memories/refresh',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.refreshCompanionMemoryMock).toHaveBeenCalledWith('acct-1', 'user-alice');
    } finally {
      await app.close();
    }
  });
});
