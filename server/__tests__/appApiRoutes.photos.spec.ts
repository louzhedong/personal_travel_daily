// @vitest-environment node

import { expect, it } from 'vitest';
import { AppApiError } from '../appApi/errors.js';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('photos', () => {
  it('returns smart photo albums for authenticated accounts', async () => {
    mocks.getPhotoAlbumsMock.mockResolvedValue({
      summary: {
        albumCount: 1,
        coverCandidateCount: 1,
        pinnedCoverCount: 0,
        issueCount: 0,
      },
      albums: [
        {
          id: 'trip-cover-trip-1',
          kind: 'tripCover',
          targetKind: 'trip',
          targetId: 'trip-1',
          title: '杭州周末封面候选',
          subtitle: 'Story Studio 共用封面排序',
          metricLabel: '1 张照片',
          photoCount: 1,
          coverCandidates: [],
        },
      ],
      issues: [],
      preferences: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/photo-albums',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getPhotoAlbumsMock).toHaveBeenCalledWith(currentAccount);
      expect(response.json().summary.albumCount).toBe(1);
    } finally {
      await app.close();
    }
  });

  it('updates smart photo album preferences', async () => {
    mocks.updatePhotoAlbumPreferencesMock.mockResolvedValue({
      summary: {
        albumCount: 1,
        coverCandidateCount: 1,
        pinnedCoverCount: 1,
        issueCount: 0,
      },
      albums: [],
      issues: [],
      preferences: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/photo-albums/preferences',
        payload: {
          preferences: [
            {
              targetKind: 'trip',
              targetId: 'trip-1',
              pinnedImageIds: ['image-1'],
              sortOrder: ['image-1', 'image-2'],
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updatePhotoAlbumPreferencesMock).toHaveBeenCalledWith(currentAccount, {
        preferences: [
          {
            targetKind: 'trip',
            targetId: 'trip-1',
            pinnedImageIds: ['image-1'],
            sortOrder: ['image-1', 'image-2'],
          },
        ],
      });
      expect(response.json().summary.pinnedCoverCount).toBe(1);
    } finally {
      await app.close();
    }
  });

  it('returns global photo curation payload for authenticated accounts', async () => {
    mocks.listPhotoCurationResourceMock.mockResolvedValue({
      summary: {
        totalPhotos: 2,
        featuredPhotos: 1,
        missingCaptionPhotos: 1,
        tripCount: 1,
        companionCount: 1,
        yearCount: 1,
      },
      filters: {
        trips: [{ id: 'trip-1', name: '杭州周末', photoCount: 2 }],
        companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', photoCount: 2 }],
        years: [{ year: 2026, photoCount: 2 }],
      },
      sections: {
        featured: [],
        missingCaptions: [],
        recent: [],
      },
      items: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/photos/curation?tripId=trip-1&companionId=user-alice&year=2026&featured=featured&caption=withCaption&limit=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.listPhotoCurationResourceMock).toHaveBeenCalledWith(currentAccount.id, {
        tripId: 'trip-1',
        companionId: 'user-alice',
        year: 2026,
        featured: 'featured',
        caption: 'withCaption',
        limit: 20,
      });
      expect(response.json().summary.totalPhotos).toBe(2);
    } finally {
      await app.close();
    }
  });

  it('updates global photo curation metadata', async () => {
    mocks.updatePhotoCurationResourceMock.mockResolvedValue({
      summary: {
        totalPhotos: 1,
        featuredPhotos: 1,
        missingCaptionPhotos: 0,
        tripCount: 1,
        companionCount: 1,
        yearCount: 1,
      },
      filters: {
        trips: [{ id: 'trip-1', name: '杭州周末', photoCount: 1 }],
        companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', photoCount: 1 }],
        years: [{ year: 2026, photoCount: 1 }],
      },
      sections: {
        featured: [],
        missingCaptions: [],
        recent: [],
      },
      items: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/photos/curation?tripId=trip-1',
        payload: {
          items: [
            {
              imageId: 'image-1',
              isFeatured: true,
              caption: '西湖晚风',
              curatedSortOrder: 0,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updatePhotoCurationResourceMock).toHaveBeenCalledWith(
        currentAccount.id,
        {
          items: [
            {
              imageId: 'image-1',
              isFeatured: true,
              caption: '西湖晚风',
              curatedSortOrder: 0,
            },
          ],
        },
        {
          tripId: 'trip-1',
          featured: 'all',
          caption: 'all',
          limit: 120,
        },
      );
      expect(response.json().summary.featuredPhotos).toBe(1);
    } finally {
      await app.close();
    }
  });

  it('returns NOT_FOUND when global photo curation updates include inaccessible images', async () => {
    mocks.updatePhotoCurationResourceMock.mockRejectedValueOnce(
      new AppApiError('NOT_FOUND', 'photo not found', 404),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/photos/curation',
        payload: {
          items: [{ imageId: 'not-owned-image', isFeatured: true }],
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'photo not found',
        },
      });
    } finally {
      await app.close();
    }
  });

  it('returns UNAUTHORIZED for global photo curation when no session is available', async () => {
    mocks.requireAuthenticatedAccountMock.mockRejectedValueOnce(
      new AppApiError('UNAUTHORIZED', 'authentication required', 401),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/photos/curation',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'authentication required',
        },
      });
    } finally {
      await app.close();
    }
  });
});
