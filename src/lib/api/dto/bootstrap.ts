import type { AuthAccount, TravelStore } from '../../../types';

export interface BootstrapResponseDto {
  store: TravelStore;
  meta: {
    accountId: string;
    account: AuthAccount;
    fetchedAt: string;
  };
}
