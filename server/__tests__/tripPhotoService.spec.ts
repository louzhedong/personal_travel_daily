// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  getTripDetailMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/services/tripDetailService.js', () => ({
  getTripDetail: mocks.getTripDetailMock,
}));

import { updateTripPhotoCuration } from '../appApi/services/tripPhotoService.js';

describe('tripPhotoService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getTripDetailMock.mockResolvedValue({ photos: [{ imageId: 'image-1', isFeatured: true }] });
  });

  it('updates curation only after every image is resolved inside the trip', async () => {
    const updateMock = vi.fn((input) => ({ update: input }));
    const transactionMock = vi.fn(async (operations) => operations);
    const prisma = {
      visitMarkerImage: {
        findMany: vi.fn().mockResolvedValue([{ id: 'image-1' }, { id: 'image-2' }]),
        update: updateMock,
      },
      $transaction: transactionMock,
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const result = await updateTripPhotoCuration('acct-1', 'trip-1', {
      items: [
        { imageId: 'image-1', isFeatured: true, caption: '封面候选', curatedSortOrder: 0 },
        { imageId: 'image-2', isFeatured: false, caption: null, curatedSortOrder: 1 },
      ],
    });

    expect(prisma.visitMarkerImage.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['image-1', 'image-2'],
        },
        marker: {
          accountId: 'acct-1',
          tripId: 'trip-1',
          isDeleted: false,
          trip: {
            accountId: 'acct-1',
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
      },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'image-1' },
      data: { isFeatured: true, caption: '封面候选', curatedSortOrder: 0 },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'image-2' },
      data: { isFeatured: false, caption: null, curatedSortOrder: 1 },
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(mocks.getTripDetailMock).toHaveBeenCalledWith('acct-1', 'trip-1');
    expect(result.photos[0].imageId).toBe('image-1');
  });

  it('rejects duplicate image ids before writing', async () => {
    mocks.getPrismaClientMock.mockReturnValue({
      visitMarkerImage: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    });

    await expect(
      updateTripPhotoCuration('acct-1', 'trip-1', {
        items: [
          { imageId: 'image-1', isFeatured: true },
          { imageId: 'image-1', curatedSortOrder: 1 },
        ],
      }),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 400, code: 'INVALID_REQUEST' });
  });

  it('rejects images outside the account or trip', async () => {
    mocks.getPrismaClientMock.mockReturnValue({
      visitMarkerImage: {
        findMany: vi.fn().mockResolvedValue([{ id: 'image-1' }]),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    });

    await expect(
      updateTripPhotoCuration('acct-1', 'trip-1', {
        items: [
          { imageId: 'image-1', isFeatured: true },
          { imageId: 'other-trip-image', curatedSortOrder: 1 },
        ],
      }),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 404, code: 'NOT_FOUND' });
  });
});
