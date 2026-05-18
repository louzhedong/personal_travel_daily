import { z } from 'zod';
import { MARKER_TAGS } from '../../../shared/markerMetadata.js';

const nonEmptyStringArray = z.array(z.string().trim().min(1)).min(1).max(200);

const assignMarkersToTripSchema = z.object({
  type: z.literal('assignMarkersToTrip'),
  markerIds: nonEmptyStringArray,
  tripId: z.string().trim().min(1, 'tripId is required'),
});

const addTagsToMarkersSchema = z.object({
  type: z.literal('addTagsToMarkers'),
  markerIds: nonEmptyStringArray,
  tags: z.array(z.enum(MARKER_TAGS)).min(1).max(10),
});

const featurePhotosSchema = z.object({
  type: z.literal('featurePhotos'),
  imageIds: nonEmptyStringArray,
});

const draftPhotoCaptionsSchema = z.object({
  type: z.literal('draftPhotoCaptions'),
  imageIds: nonEmptyStringArray,
});

export const organizationActionBodySchema = z.discriminatedUnion('type', [
  assignMarkersToTripSchema,
  addTagsToMarkersSchema,
  featurePhotosSchema,
  draftPhotoCaptionsSchema,
]);

export type OrganizationActionBody = z.infer<typeof organizationActionBodySchema>;

