import { normalizeChinaName } from '../geo/loader';
import type { Scope, VisitMarker } from '../types';

const INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX: Record<string, string> = {
  jp: '日本',
  kr: '韩国',
  fr: '法国',
  it: '意大利',
  ch: '瑞士',
  us: '美国',
  ca: '加拿大',
  au: '澳大利亚',
  nz: '新西兰',
  th: '泰国',
  vn: '越南',
  sg: '新加坡',
  my: '马来西亚',
  id: '印度尼西亚',
  in: '印度',
  gb: '英国',
  de: '德国',
  es: '西班牙',
  pt: '葡萄牙',
  gr: '希腊',
  tr: '土耳其',
  ru: '俄罗斯',
  br: '巴西',
  ar: '阿根廷',
  mx: '墨西哥',
  cn: '中国',
  hk: '中国',
  mo: '中国',
  tw: '中国',
};

interface RegionIdentityInput {
  scope: Scope;
  scopeId: string;
  scopeName: string;
}

function resolveInternationalRegionName(scopeId: string, scopeName: string) {
  const prefix = scopeId.split('-')[0]?.toLowerCase() ?? scopeId.toLowerCase();
  return INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX[prefix] ?? scopeName;
}

export function resolveMapRegionId(input: RegionIdentityInput, mapScope: Scope) {
  if (mapScope === 'domestic') {
    return normalizeChinaName(input.scopeName);
  }

  if (input.scope === 'domestic') {
    return '中国';
  }

  return resolveInternationalRegionName(input.scopeId, input.scopeName);
}

export function resolveMarkerMapRegionId(marker: VisitMarker, mapScope: Scope) {
  return resolveMapRegionId(marker, mapScope);
}
