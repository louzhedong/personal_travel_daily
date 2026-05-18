import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  assignOrganizationMarkersToTrip,
  featureOrganizationPhotos,
  getOrganizationWorkbenchSources,
  listOwnedOrganizationImages,
  listOwnedOrganizationMarkers,
  updateOrganizationMarkerTags,
  updateOrganizationPhotoCaptions,
} from '../repositories/organizationRepository.js';
import { findActiveTripById } from '../repositories/tripRepository.js';
import type { OrganizationActionBody } from '../schemas/organization.js';
import { serializeOrganizationWorkbench } from '../serializers/organizationSerializer.js';
import type { OrganizationActionPreviewDto, OrganizationActionResultDto } from '../types.js';

function assertUnique(values: string[], fieldName: string) {
  if (new Set(values).size !== values.length) {
    throw createValidationError(`${fieldName} values must be unique`);
  }
}

function normalizeTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function titleForMarker(marker: { scopeName: string; city: string }) {
  return `${marker.scopeName} · ${marker.city}`;
}

function draftCaptionForImage(image: { marker: { scopeName: string; city: string; visitedStartAt: Date } }) {
  const date = image.marker.visitedStartAt.toISOString().slice(0, 10);
  return `${image.marker.scopeName} · ${image.marker.city} 的旅行片刻（${date}）`;
}

async function buildPreview(accountId: string, action: OrganizationActionBody): Promise<OrganizationActionPreviewDto> {
  const prisma = getPrismaClient();

  if (action.type === 'assignMarkersToTrip') {
    assertUnique(action.markerIds, 'markerId');
    const [trip, markers] = await Promise.all([
      findActiveTripById(prisma, accountId, action.tripId),
      listOwnedOrganizationMarkers(prisma, accountId, action.markerIds),
    ]);
    if (!trip) {
      throw createNotFoundError('trip not found');
    }
    if (markers.length !== action.markerIds.length) {
      throw createNotFoundError('marker not found');
    }
    return {
      actionType: action.type,
      dryRun: true,
      changeCount: markers.length,
      changes: markers.map((marker) => ({
        targetId: marker.id,
        targetTitle: titleForMarker(marker),
        before: marker.trip?.name ?? '未归入行程',
        after: trip.name,
      })),
    };
  }

  if (action.type === 'addTagsToMarkers') {
    assertUnique(action.markerIds, 'markerId');
    const markers = await listOwnedOrganizationMarkers(prisma, accountId, action.markerIds);
    if (markers.length !== action.markerIds.length) {
      throw createNotFoundError('marker not found');
    }
    return {
      actionType: action.type,
      dryRun: true,
      changeCount: markers.length,
      changes: markers.map((marker) => {
        const currentTags = normalizeTags(marker.tags);
        const nextTags = [...new Set([...currentTags, ...action.tags])];
        return {
          targetId: marker.id,
          targetTitle: titleForMarker(marker),
          before: currentTags.length > 0 ? currentTags.join(', ') : '无标签',
          after: nextTags.join(', '),
        };
      }),
    };
  }

  if (action.type === 'featurePhotos') {
    assertUnique(action.imageIds, 'imageId');
    const images = await listOwnedOrganizationImages(prisma, accountId, action.imageIds);
    if (images.length !== action.imageIds.length) {
      throw createNotFoundError('photo not found');
    }
    return {
      actionType: action.type,
      dryRun: true,
      changeCount: images.length,
      changes: images.map((image) => ({
        targetId: image.id,
        targetTitle: titleForMarker(image.marker),
        before: image.isFeatured ? '已精选' : '未精选',
        after: '已精选',
      })),
    };
  }

  assertUnique(action.imageIds, 'imageId');
  const images = await listOwnedOrganizationImages(prisma, accountId, action.imageIds);
  if (images.length !== action.imageIds.length) {
    throw createNotFoundError('photo not found');
  }
  return {
    actionType: action.type,
    dryRun: true,
    changeCount: images.length,
    changes: images.map((image) => ({
      targetId: image.id,
      targetTitle: titleForMarker(image.marker),
      before: image.caption?.trim() || '无说明',
      after: draftCaptionForImage(image),
    })),
  };
}

export async function getOrganizationWorkbench(accountId: string) {
  const prisma = getPrismaClient();
  const sources = await getOrganizationWorkbenchSources(prisma, accountId);
  return serializeOrganizationWorkbench(sources);
}

export async function previewOrganizationAction(accountId: string, action: OrganizationActionBody) {
  return buildPreview(accountId, action);
}

export async function applyOrganizationAction(
  accountId: string,
  action: OrganizationActionBody,
): Promise<OrganizationActionResultDto> {
  const preview = await buildPreview(accountId, action);
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    if (action.type === 'assignMarkersToTrip') {
      await assignOrganizationMarkersToTrip(tx, action.markerIds, action.tripId);
      return;
    }

    if (action.type === 'addTagsToMarkers') {
      const markers = await listOwnedOrganizationMarkers(tx, accountId, action.markerIds);
      await updateOrganizationMarkerTags(
        tx,
        markers.map((marker) => ({
          markerId: marker.id,
          tags: [...new Set([...normalizeTags(marker.tags), ...action.tags])],
        })),
      );
      return;
    }

    if (action.type === 'featurePhotos') {
      await featureOrganizationPhotos(tx, action.imageIds);
      return;
    }

    const images = await listOwnedOrganizationImages(tx, accountId, action.imageIds);
    await updateOrganizationPhotoCaptions(
      tx,
      images.map((image) => ({ imageId: image.id, caption: draftCaptionForImage(image) })),
    );
  });

  return {
    ...preview,
    dryRun: false,
    applied: true,
    workbench: await getOrganizationWorkbench(accountId),
  };
}

