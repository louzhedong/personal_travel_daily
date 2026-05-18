import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  ReminderActionResponseDto,
  ReminderAdminTrendsResponseDto,
  ReminderListResponseDto,
  ReminderTypeDto,
} from './types';

const remindersBaseUrl = getResourceBaseUrl();

export function fetchReminders() {
  return httpClient.get<ReminderListResponseDto>(remindersBaseUrl, '/reminders');
}

export function resolveReminder(fingerprint: string) {
  return httpClient.post<ReminderActionResponseDto>(
    remindersBaseUrl,
    `/reminders/${encodeURIComponent(fingerprint)}/resolve`,
  );
}

export function muteReminderType(type: ReminderTypeDto, mutedUntil?: string) {
  return httpClient.post<ReminderActionResponseDto>(remindersBaseUrl, `/reminders/preferences/${type}/mute`, {
    mutedUntil,
  });
}

export function unmuteReminderType(type: ReminderTypeDto) {
  return httpClient.delete<ReminderActionResponseDto>(remindersBaseUrl, `/reminders/preferences/${type}/mute`);
}

export function fetchAdminReminderTrends() {
  return httpClient.get<ReminderAdminTrendsResponseDto>(remindersBaseUrl, '/admin/reminders/trends');
}
