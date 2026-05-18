// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  listPhotoAlbumImagesMock: vi.fn(),
  listPhotoAlbumPreferencesMock: vi.fn(),
  listOwnedPhotoAlbumImageIdsMock: vi.fn(),
  upsertPhotoAlbumPreferencesMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/photoAlbumRepository.js', () => ({
  listPhotoAlbumImages: mocks.listPhotoAlbumImagesMock,
  listPhotoAlbumPreferences: mocks.listPhotoAlbumPreferencesMock,
  listOwnedPhotoAlbumImageIds: mocks.listOwnedPhotoAlbumImageIdsMock,
  upsertPhotoAlbumPreferences: mocks.upsertPhotoAlbumPreferencesMock,
}));

import { getPhotoAlbums, updatePhotoAlbumPreferences } from '../appApi/services/photoAlbumService.js';

const account = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};
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
      companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
      trip: { id: 'trip-1', name: '杭州周末' },
    },
  },
  {
    id: 'image-2',
    imageUrl: 'notaurl',
    isFeatured: false,
    caption: null,
    curatedSortOrder: null,
    marker: {
      id: 'marker-2',
      scopeName: '浙江',
      city: '杭州',
      visitedStartAt: new Date('2026-05-02T00:00:00.000Z'),
      companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
      trip: { id: 'trip-1', name: '杭州周末' },
    },
  },
];

describe('photoAlbumService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listPhotoAlbumImagesMock.mockResolvedValue(photoSources);
    mocks.listPhotoAlbumPreferencesMock.mockResolvedValue([
      {
        id: 'pref-1',
        targetKind: 'trip',
        targetId: 'trip-1',
        pinnedImageIds: ['image-2'],
        sortOrderJson: ['image-2', 'image-1'],
        updatedAt: new Date('2026-05-03T00:00:00.000Z'),
      },
    ]);
    mocks.listOwnedPhotoAlbumImageIdsMock.mockResolvedValue([{ id: 'image-1' }]);
    mocks.upsertPhotoAlbumPreferencesMock.mockResolvedValue(undefined);
  });

  it('builds smart albums, cover candidates, preferences, and issue buckets', async () => {
    const result = await getPhotoAlbums(account);

    expect(mocks.listPhotoAlbumImagesMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(result.summary.albumCount).toBeGreaterThanOrEqual(4);
    expect(result.albums.map((album) => album.kind)).toContain('annual');
    expect(result.albums.map((album) => album.kind)).toContain('city');
    expect(result.albums.map((album) => album.kind)).toContain('companion');
    expect(result.albums.map((album) => album.kind)).toContain('tripCover');
    expect(result.albums.find((album) => album.targetKind === 'trip')?.coverCandidates[0].imageId).toBe('image-2');
    expect(result.issues.map((issue) => issue.kind)).toEqual(expect.arrayContaining(['invalidUrl', 'missingCaption']));
  });

  it('updates account scoped preferences after validating referenced images', async () => {
    await updatePhotoAlbumPreferences(account, {
      preferences: [
        {
          targetKind: 'trip',
          targetId: 'trip-1',
          pinnedImageIds: ['image-1'],
          sortOrder: ['image-1'],
        },
      ],
    });

    expect(mocks.listOwnedPhotoAlbumImageIdsMock).toHaveBeenCalledWith(prisma, 'acct-1', ['image-1']);
    expect(mocks.upsertPhotoAlbumPreferencesMock).toHaveBeenCalledWith(
      prisma,
      expect.arrayContaining([
        expect.objectContaining({
          accountId: 'acct-1',
          targetKind: 'trip',
          targetId: 'trip-1',
          pinnedImageIds: ['image-1'],
          sortOrderJson: ['image-1'],
        }),
      ]),
    );
  });

  it('rejects duplicate preference targets', async () => {
    await expect(
      updatePhotoAlbumPreferences(account, {
        preferences: [
          { targetKind: 'trip', targetId: 'trip-1', pinnedImageIds: ['image-1'] },
          { targetKind: 'trip', targetId: 'trip-1', sortOrder: ['image-1'] },
        ],
      }),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 400, code: 'INVALID_REQUEST' });
  });

  it('rejects preference image ids outside the current account', async () => {
    mocks.listOwnedPhotoAlbumImageIdsMock.mockResolvedValue([]);

    await expect(
      updatePhotoAlbumPreferences(account, {
        preferences: [{ targetKind: 'trip', targetId: 'trip-1', pinnedImageIds: ['other-image'] }],
      }),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 404, code: 'NOT_FOUND' });
  });
});
