import { z } from 'zod';

export const adminOverviewQuerySchema = z.object({}).strict();

export const adminAuditActions = [
  'quality_issue_viewed',
  'quality_issue_context_copied',
  'quality_issue_navigated',
  'quality_issue_auto_fix_previewed',
  'quality_issue_auto_fixed',
  'quality_issue_list_filtered',
  'audit_trail_viewed',
] as const;

export const adminAuditLogBodySchema = z.object({
  action: z.enum(adminAuditActions),
  targetKind: z.string().trim().max(80).optional(),
  targetId: z.string().trim().max(191).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const adminAuditLogQuerySchema = z
  .object({
    action: z.enum(adminAuditActions).optional(),
    targetKind: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const adminQualityAutoFixBodySchema = z
  .object({
    issueId: z.string().trim().min(1).max(240),
    dryRun: z.boolean().optional().default(true),
  })
  .strict();

export type AdminAuditLogBody = z.infer<typeof adminAuditLogBodySchema>;
export type AdminAuditLogQuery = z.infer<typeof adminAuditLogQuerySchema>;
export type AdminQualityAutoFixBody = z.infer<typeof adminQualityAutoFixBodySchema>;
