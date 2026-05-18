import { z } from 'zod';

export const reminderTypes = [
  'planning_overdue',
  'trip_missing_cover',
  'photo_missing_caption',
  'anomalous_login',
  'guide_source_degraded',
  'guide_search_error_spike',
  'companion_memory_snapshot_stale',
] as const;

export const reminderParamsSchema = z
  .object({
    fingerprint: z.string().trim().min(1).max(191),
  })
  .strict();

export const reminderPreferenceParamsSchema = z
  .object({
    type: z.enum(reminderTypes),
  })
  .strict();

export const muteReminderBodySchema = z
  .object({
    mutedUntil: z.coerce.date().optional(),
  })
  .strict();

export type ReminderParams = z.infer<typeof reminderParamsSchema>;
export type ReminderPreferenceParams = z.infer<typeof reminderPreferenceParamsSchema>;
export type MuteReminderBody = z.infer<typeof muteReminderBodySchema>;
