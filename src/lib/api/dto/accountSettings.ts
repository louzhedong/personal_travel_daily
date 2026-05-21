import type { CurrentAccountDto } from './common.js';

export interface AccountSettingsDto {
  account: CurrentAccountDto;
  preference: AccountPreferenceDto;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPreferenceDto {
  locale: 'zh-CN' | 'en-US';
  mapStyle: 'minimal' | 'magazine' | 'old-map';
  defaultCurrency: string;
  commonCurrencies: string[];
  exchangeRateSource: string;
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

export interface UpdateAccountPreferenceInputDto {
  locale?: AccountPreferenceDto['locale'];
  mapStyle?: AccountPreferenceDto['mapStyle'];
  defaultCurrency?: string;
  commonCurrencies?: string[];
  exchangeRateSource?: string;
}
