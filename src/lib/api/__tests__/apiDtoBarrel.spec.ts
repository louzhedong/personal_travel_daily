import { describe, expect, it } from 'vitest';

import { APP_API_ERROR_CODE } from '../types';

import type {
  AccountSettingsDto,
  AdminOverviewResponseDto,
  BootstrapResponseDto,
  PhotoCurationResponseDto,
  StatsOverviewResponseDto,
  TripDetailResponseDto,
} from '../types';

describe('frontend api dto barrel', () => {
  it('keeps shared error codes available through the compatibility barrel', () => {
    expect(APP_API_ERROR_CODE.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(APP_API_ERROR_CODE.FORBIDDEN).toBe('FORBIDDEN');
  });

  it('keeps representative domain DTOs importable from the compatibility barrel', () => {
    const _samples = null as unknown as {
      bootstrap: BootstrapResponseDto;
      settings: AccountSettingsDto;
      admin: AdminOverviewResponseDto;
      stats: StatsOverviewResponseDto;
      trip: TripDetailResponseDto;
      photos: PhotoCurationResponseDto;
    };

    expect(_samples).toBeNull();
  });
});
