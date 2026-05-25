import { z } from 'zod';

export const contributionAcceptKindSchema = z.enum(['photo', 'note', 'both']);
export const contributionInboxKindSchema = z.enum(['photo', 'note']);
export const contributionAcceptedAsTypeSchema = z.enum(['marker', 'photo', 'journal']);

export const contributionDropBoxParamsSchema = z.object({
  dropBoxId: z.string().min(1),
});

export const contributionInboxParamsSchema = z.object({
  itemId: z.string().min(1),
});

export const contributionPublicSlugParamsSchema = z.object({
  slug: z.string().min(1).max(120),
});

export const createContributionDropBoxBodySchema = z.object({
  title: z.string().min(1).max(120),
  tripId: z.string().min(1).optional(),
  acceptKind: contributionAcceptKindSchema.optional(),
  expiresInDays: z.number().int().min(1).max(60).optional(),
  maxUploads: z.number().int().min(1).max(200).optional(),
  note: z.string().max(2000).optional(),
});

export const contributionPublicSubmitBodySchema = z
  .object({
    kind: contributionInboxKindSchema,
    noteText: z.string().min(1).max(4000).optional(),
    submitterDisplayName: z.string().max(80).optional(),
    eventDate: z.string().min(1).max(40).optional(),
    imageDataUrl: z.string().min(1).optional(),
  })
  .refine(
    (value) => (value.kind === 'photo' ? !!value.imageDataUrl : !!value.noteText),
    {
      message: 'photo submissions require imageDataUrl, note submissions require noteText',
    },
  );

export const acceptContributionInboxBodySchema = z.object({
  acceptedAsType: contributionAcceptedAsTypeSchema,
  tripId: z.string().min(1).optional(),
  title: z.string().min(1).max(160).optional(),
  city: z.string().min(1).max(80).optional(),
  visitedAt: z.string().min(1).max(40).optional(),
});

export type CreateContributionDropBoxBody = z.infer<typeof createContributionDropBoxBodySchema>;
export type ContributionPublicSubmitBody = z.infer<typeof contributionPublicSubmitBodySchema>;
export type AcceptContributionInboxBody = z.infer<typeof acceptContributionInboxBodySchema>;
