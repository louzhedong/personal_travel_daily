import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { recordFxSnapshot } from './financeService.js';

/**
 * F5 · FX service / 汇率快照服务
 * 通过环境开关 FX_AUTO_FETCH 决定是否对外发起请求；默认 false（私密前提）。
 * Wraps an opt-in fetch loop. Without external fetch, exposes a manual record path.
 */

const FX_AUTO_FETCH = (process.env.FX_AUTO_FETCH ?? 'false').toLowerCase() === 'true';
const FX_PROVIDER_URL =
  process.env.FX_PROVIDER_URL ?? 'https://api.exchangerate.host/latest';
const FX_FETCH_TIMEOUT_MS = Number(process.env.FX_FETCH_TIMEOUT_MS ?? 5000);

export interface SyncFxOptions {
  baseCurrency: string;
  quoteCurrencies: string[];
}

export async function isFxAutoFetchEnabled() {
  return FX_AUTO_FETCH;
}

export async function syncFxFromProvider(
  account: AuthenticatedAccount,
  options: SyncFxOptions,
) {
  if (!FX_AUTO_FETCH) {
    return { fetched: false, reason: 'fx_auto_fetch_disabled' as const, snapshots: [] };
  }
  const params = new URLSearchParams({
    base: options.baseCurrency.toUpperCase(),
    symbols: options.quoteCurrencies.map((c) => c.toUpperCase()).join(','),
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FX_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${FX_PROVIDER_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return { fetched: false, reason: 'provider_error' as const, snapshots: [] };
    }
    const json = (await response.json()) as { rates?: Record<string, number> };
    const rates = json.rates ?? {};
    const takenAt = new Date().toISOString();
    const snapshots = [] as Awaited<ReturnType<typeof recordFxSnapshot>>[];
    for (const [quote, rate] of Object.entries(rates)) {
      if (typeof rate !== 'number' || Number.isNaN(rate)) continue;
      const snap = await recordFxSnapshot(account, {
        baseCurrency: options.baseCurrency,
        quoteCurrency: quote,
        rate,
        source: 'exchangerate-host',
        takenAt,
      });
      snapshots.push(snap);
    }
    return { fetched: true as const, snapshots };
  } catch {
    return { fetched: false, reason: 'fetch_failed' as const, snapshots: [] };
  } finally {
    clearTimeout(timer);
  }
}
