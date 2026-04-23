import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'voyage_atlas_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiresAt(now = new Date()) {
  return new Date(now.getTime() + SESSION_DURATION_MS);
}

export function serializeSessionCookie(token: string, expiresAt: Date) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`;
}

export function serializeSessionCookieClear() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(0).toUTCString()}`;
}

export function readCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const segments = cookieHeader.split(';');
  for (const segment of segments) {
    const [rawKey, ...rest] = segment.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}
