import type { AuthAccount } from '../../../types';

export interface AccountSettingsDto {
  account: AuthAccount;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSessionDto {
  id: string;
  isCurrent: boolean;
  userAgent?: string;
  deviceLabel: string;
  ipAddress?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface AccountSessionsResponseDto {
  sessions: AccountSessionDto[];
}

export interface UpdateAccountProfileInputDto {
  name: string;
}

export interface ChangePasswordInputDto {
  currentPassword: string;
  nextPassword: string;
}
