// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  listPhotoCurationImagesMock: vi.fn(),
  listOwnedPhotoImageIdsMock: vi.fn(),
  updatePhotoCurationImagesMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/photoCurationRepository.js', () => ({
  listPhotoCurationImages: mocks.listPhotoCurationImagesMock,
  listOwnedPhotoImageIds: mocks.listOwnedPhotoImageIdsMock,
  updatePhotoCurationImages: mocks.updatePhotoCurationImagesMock,
}));

import {
  listPhotoCurationResource,
  updatePhotoCurationResource,
} from '../appApi/services/photoCurationService.js';

const prisma = { marker: 'prisma' };

const photoSources = [
  {
    id: 'image-1',
    imageUrl: 'https://example.com/hangzhou.jpg',
    isFeatured: true,
    caption: '西湖晚风',
    curatedSortOrder: 0,
    marker: {
      id: 'marker-1',
      scopeName: '浙江',
      city: '杭州',
      visitedStartAt: new Date('2026-05-01T00:00:00.000Z'),
      companion: {
        id: 'user-alice',
        name: '小悠',
        color: '#2563eb',
      },
      trip: {
        id: 'trip-1',
        name: '杭州周末',
      },
    },
  },
  {
    id: 'image-2',
    imageUrl: 'https://example.com/kyoto.jpg',
    isFeatured: false,
    caption: null,
    curatedSortOrder: null,
    marker: {
      id: 'marker-2',
      scopeName: '京都',
      city: '京都',
      visitedStartAt: new Date('2025-10-02T00:00:00.000Z'),
      companion: {
        id: 'user-bob',
        name: '阿远',
        color: '#14b8a6',
      },
      trip: {
        id: 'trip-2',
        name: '京都秋日',
      },
    },
  },
];

describe('photoCurationService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listPhotoCurationImagesMock.mockResolvedValue(photoSources);
    mocks.listOwnedPhotoImageIdsMock.mockResolvedValue([{ id: 'image-1' }]);
    mocks.updatePhotoCurationImagesMock.mockResolvedValue(undefined);
  });

  it('aggregates global photo curation payload for the current account', async () => {
    const result = await listPhotoCurationResource('acct-1', {
      featured: 'all',
      caption: 'all',
      limit: 120,
    });

    expect(mocks.listPhotoCurationImagesMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(result.summary).toMatchObject({
      totalPhotos: 2,
      featuredPhotos: 1,
      missingCaptionPhotos: 1,
      tripCount: 2,
      companionCount: 2,
      yearCount: 2,
    });
    expect(result.filters.trips.map((trip) => trip.id)).toEqual(['trip-1', 'trip-2']);
    expect(result.items.map((item) => item.imageId)).toEqual(['image-1', 'image-2']);
  });

  it('filters photos by trip, companion, year, featured state, and caption state', async () => {
    const tripResult = await listPhotoCurationResource('acct-1', {
      tripId: 'trip-1',
      featured: 'all',
      caption: 'all',
      limit: 120,
    });
    expect(tripResult.items.map((item) => item.imageId)).toEqual(['image-1']);

    const companionResult = await listPhotoCurationResource('acct-1', {
      companionId: 'user-bob',
      featured: 'all',
      caption: 'all',
      limit: 120,
    });
    expect(companionResult.items.map((item) => item.imageId)).toEqual(['image-2']);

    const yearResult = await listPhotoCurationResource('acct-1', {
      year: 2026,
      featured: 'all',
      caption: 'all',
      limit: 120,
    });
    expect(yearResult.items.map((item) => item.imageId)).toEqual(['image-1']);

    const featuredResult = await listPhotoCurationResource('acct-1', {
      featured: 'featured',
      caption: 'all',
      limit: 120,
    });
    expect(featuredResult.items.map((item) => item.imageId)).toEqual(['image-1']);

    const missingCaptionResult = await listPhotoCurationResource('acct-1', {
      featured: 'all',
      caption: 'missingCaption',
      limit: 120,
    });
    expect(missingCaptionResult.items.map((item) => item.imageId)).toEqual(['image-2']);
  });

  it('rejects duplicate image ids before writing', async () => {
    await expect(
      updatePhotoCurationResource(
        'acct-1',
        {
          items: [
            { imageId: 'image-1', isFeatured: true },
            { imageId: 'image-1', caption: '重复' },
          ],
        },
        {
          featured: 'all',
          caption: 'all',
          limit: 120,
        },
      ),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 400, code: 'INVALID_REQUEST' });

    expect(mocks.updatePhotoCurationImagesMock).not.toHaveBeenCalled();
  });

  it('rejects photos outside the current account', async () => {
    mocks.listOwnedPhotoImageIdsMock.mockResolvedValue([{ id: 'image-1' }]);

    await expect(
      updatePhotoCurationResource(
        'acct-1',
        {
          items: [
            { imageId: 'image-1', isFeatured: true },
            { imageId: 'other-account-image', caption: '不可写' },
          ],
        },
        {
          featured: 'all',
          caption: 'all',
          limit: 120,
        },
      ),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 404, code: 'NOT_FOUND' });

    expect(mocks.updatePhotoCurationImagesMock).not.toHaveBeenCalled();
  });

  it('updates curation metadata and returns the refreshed filtered payload', async () => {
    const result = await updatePhotoCurationResource(
      'acct-1',
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
        caption: 'withCaption',
        limit: 120,
      },
    );

    expect(mocks.listOwnedPhotoImageIdsMock).toHaveBeenCalledWith(prisma, 'acct-1', ['image-1']);
    expect(mocks.updatePhotoCurationImagesMock).toHaveBeenCalledWith(prisma, [
      {
        imageId: 'image-1',
        isFeatured: true,
        caption: '西湖晚风',
        curatedSortOrder: 0,
      },
    ]);
    expect(result.items.map((item) => item.imageId)).toEqual(['image-1']);
  });
});
