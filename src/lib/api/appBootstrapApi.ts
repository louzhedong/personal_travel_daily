import { httpClient, getBootstrapBaseUrl } from './httpClient';
import type { BootstrapResponseDto } from './types';

export async function fetchAppBootstrap() {
  return httpClient.get<BootstrapResponseDto>(getBootstrapBaseUrl(), '/bootstrap');
}
