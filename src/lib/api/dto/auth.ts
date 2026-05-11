import type { AuthAccount } from '../../../types';

export interface AuthResponseDto {
  account: AuthAccount;
}

export interface SessionResponseDto {
  account: AuthAccount | null;
}
