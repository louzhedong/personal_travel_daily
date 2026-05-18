// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  getOrganizationWorkbenchSourcesMock: vi.fn(),
  listOwnedOrganizationMarkersMock: vi.fn(),
  listOwnedOrganizationImagesMock: vi.fn(),
  assignOrganizationMarkersToTripMock: vi.fn(),
  updateOrganizationMarkerTagsMock: vi.fn(),
  featureOrganizationPhotosMock: vi.fn(),
  updateOrganizationPhotoCaptionsMock: vi.fn(),
  findActiveTripByIdMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({ getPrismaClient: mocks.getPrismaClientMock }));
vi.mock('../appApi/repositories/organizationRepository.js', () => ({
  getOrganizationWorkbenchSources: mocks.getOrganizationWorkbenchSourcesMock,
  listOwnedOrganizationMarkers: mocks.listOwnedOrganizationMarkersMock,
  listOwnedOrganizationImages: mocks.listOwnedOrganizationImagesMock,
  assignOrganizationMarkersToTrip: mocks.assignOrganizationMarkersToTripMock,
  updateOrganizationMarkerTags: mocks.updateOrganizationMarkerTagsMock,
  featureOrganizationPhotos: mocks.featureOrganizationPhotosMock,
  updateOrganizationPhotoCaptions: mocks.updateOrganizationPhotoCaptionsMock,
}));
vi.mock('../appApi/repositories/tripRepository.js', () => ({
  findActiveTripById: mocks.findActiveTripByIdMock,
}));

import {
  applyOrganizationAction,
  getOrganizationWorkbench,
  previewOrganizationAction,
} from '../appApi/services/organizationWorkbenchService.js';

const tx = { tx: true };
const prisma = { $transaction: vi.fn((fn) => fn(tx)) };
const trip = { id: 'trip-1', name: '杭州周末', startsAt: new Date('2026-05-01'), endsAt: new Date('2026-05-03') };
const marker = {
  id: 'marker-1',
  scopeName: '浙江',
  city: '杭州',
  note: '西湖晚风',
  tags: [],
  visitedStartAt: new Date('2026-05-01T00:00:00.000Z'),
  trip: null,
};
const image = {
  id: 'image-1',
  imageUrl: 'https://example.com/a.jpg',
  isFeatured: false,
  caption: null,
  marker,
};

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  prisma.$transaction.mockClear();
  mocks.getPrismaClientMock.mockReturnValue(prisma);
  mocks.findActiveTripByIdMock.mockResolvedValue(trip);
  mocks.listOwnedOrganizationMarkersMock.mockResolvedValue([marker]);
  mocks.listOwnedOrganizationImagesMock.mockResolvedValue([image]);
  mocks.getOrganizationWorkbenchSourcesMock.mockResolvedValue({
    trips: [trip],
    markers: [marker],
    images: [image],
    guides: [{ id: 'guide-1', guideTitle: '西湖攻略', guideSummary: '', guideSourceName: '站点', savedAt: new Date('2026-05-02'), marker: null }],
  });
});

describe('organizationWorkbenchService', () => {
  it('aggregates workbench issues for the current account', async () => {
    const result = await getOrganizationWorkbench('acct-1');

    expect(mocks.getOrganizationWorkbenchSourcesMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(result.summary.totalIssues).toBe(5);
    expect(result.sections.unassignedMarkers[0].targetId).toBe('marker-1');
    expect(result.sections.missingPhotoCaptions[0].targetId).toBe('image-1');
    expect(result.sections.unlinkedGuides[0].targetId).toBe('guide-1');
  });

  it('returns dry-run preview without writing', async () => {
    const result = await previewOrganizationAction('acct-1', {
      type: 'assignMarkersToTrip',
      markerIds: ['marker-1'],
      tripId: 'trip-1',
    });

    expect(result).toMatchObject({ actionType: 'assignMarkersToTrip', dryRun: true, changeCount: 1 });
    expect(mocks.assignOrganizationMarkersToTripMock).not.toHaveBeenCalled();
  });

  it('applies action after preview and returns refreshed workbench', async () => {
    const result = await applyOrganizationAction('acct-1', {
      type: 'featurePhotos',
      imageIds: ['image-1'],
    });

    expect(mocks.featureOrganizationPhotosMock).toHaveBeenCalledWith(tx, ['image-1']);
    expect(result.applied).toBe(true);
    expect(result.workbench.summary.readyTrips).toBe(1);
  });

  it('rejects duplicate target ids', async () => {
    await expect(
      previewOrganizationAction('acct-1', {
        type: 'featurePhotos',
        imageIds: ['image-1', 'image-1'],
      }),
    ).rejects.toMatchObject<AppApiError>({ statusCode: 400, code: 'INVALID_REQUEST' });
  });
});

