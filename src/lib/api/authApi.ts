import { getResourceBaseUrl, httpClient } from './httpClient';
import type { AuthResponseDto, SessionResponseDto } from './types';

const authBaseUrl = getResourceBaseUrl();

export function fetchSession() {
  return httpClient.get<SessionResponseDto>(authBaseUrl, '/auth/session');
}

export function login(input: { username: string; password: string }) {
  return httpClient.post<AuthResponseDto>(authBaseUrl, '/auth/login', input);
}

export function register(input: { nickname: string; username: string; password: string }) {
  return httpClient.post<AuthResponseDto>(authBaseUrl, '/auth/register', input);
}

export function logout() {
  return httpClient.post<{ success: true }>(authBaseUrl, '/auth/logout');
}
