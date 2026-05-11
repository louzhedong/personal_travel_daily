import type { CurrentAccountDto } from './common.js';

export interface AuthResponseDto {
  account: CurrentAccountDto;
}

export interface SessionResponseDto {
  account: CurrentAccountDto | null;
}
