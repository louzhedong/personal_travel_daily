import type { AuthAccount } from '../../types';
import type { AppRoute } from './router';

export function shouldShowAuthPage(account: AuthAccount | null, route: AppRoute) {
  return !account || route.kind === 'login' || route.kind === 'register';
}

export function canOpenAdmin(account: AuthAccount) {
  return account.role === 'admin';
}
