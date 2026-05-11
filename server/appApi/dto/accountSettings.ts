import type { CurrentAccountDto } from './common.js';

export interface AccountSettingsDto {
  account: CurrentAccountDto;
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
