import { z } from 'zod';

export const photoAlbumPreferenceTargetKindSchema = z.enum(['annual', 'city', 'companion', 'trip', 'capsule']);

export const updatePhotoAlbumPreferencesBodySchema = z.object({
  preferences: z
    .array(
      z.object({
        targetKind: photoAlbumPreferenceTargetKindSchema,
        targetId: z.string().trim().min(1, 'targetId is required'),
        pinnedImageIds: z.array(z.string().trim().min(1)).max(12).optional(),
        sortOrder: z.array(z.string().trim().min(1)).max(80).optional(),
      }),
    )
    .min(1, 'preferences are required')
    .max(40),
});

export type UpdatePhotoAlbumPreferencesBody = z.infer<typeof updatePhotoAlbumPreferencesBodySchema>;
