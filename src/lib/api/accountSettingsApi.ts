import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  AccountSessionsResponseDto,
  AccountSettingsDto,
  ChangePasswordInputDto,
  UpdateAccountProfileInputDto,
} from './types';

const accountBaseUrl = getResourceBaseUrl();

export function fetchAccountSettings() {
  return httpClient.get<AccountSettingsDto>(accountBaseUrl, '/account/settings');
}

export function updateAccountProfile(input: UpdateAccountProfileInputDto) {
  return httpClient.patch<AccountSettingsDto>(accountBaseUrl, '/account/profile', input);
}

export function changeAccountPassword(input: ChangePasswordInputDto) {
  return httpClient.patch<{ success: true }>(accountBaseUrl, '/account/password', input);
}

export function fetchAccountSessions() {
  return httpClient.get<AccountSessionsResponseDto>(accountBaseUrl, '/account/sessions');
}

export function revokeAccountSession(sessionId: string) {
  return httpClient.delete<{ success: true }>(
    accountBaseUrl,
    `/account/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function logoutAllAccountSessions() {
  return httpClient.post<{ success: true }>(accountBaseUrl, '/account/sessions/logout-all');
}
