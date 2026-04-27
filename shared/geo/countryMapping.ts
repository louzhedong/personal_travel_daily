// 事实源 / Source of truth:
// 该映射当前在 server/appApi/services/statsService.ts 中以 INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX 名义定义；
// 本文件为其跨端共享版本，供前后端共同引用。下一步后端拆分阶段会把 statsService 替换为引用本文件。
// This mapping is currently defined in server/appApi/services/statsService.ts as
// INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX; this file is the shared version consumed by both
// front-end and back-end. A subsequent refactor step will replace statsService's local copy.
//
// 纯常量 + 纯函数 / Pure constants and pure functions:
// - 禁止引入任何 runtime 依赖（React / Fastify / Prisma / @prisma/client 等）。
// - Must not introduce runtime dependencies so the module stays tree-shakable and isomorphic.

// 国家映射：key 为 scopeId 的小写前缀（"-" 之前部分），value 为归一化后的国家 scopeId / scopeName。
// Country mapping: key is the lower-cased scopeId prefix (portion before "-"),
// value is the normalized country { scopeId, scopeName }.
export const INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX: Record<string, { scopeId: string; scopeName: string }> = {
  jp: { scopeId: 'jp', scopeName: '日本' },
  kr: { scopeId: 'kr', scopeName: '韩国' },
  fr: { scopeId: 'fr', scopeName: '法国' },
  it: { scopeId: 'it', scopeName: '意大利' },
  ch: { scopeId: 'ch', scopeName: '瑞士' },
  us: { scopeId: 'us', scopeName: '美国' },
  ca: { scopeId: 'ca', scopeName: '加拿大' },
  au: { scopeId: 'au', scopeName: '澳大利亚' },
  nz: { scopeId: 'nz', scopeName: '新西兰' },
  th: { scopeId: 'th', scopeName: '泰国' },
  vn: { scopeId: 'vn', scopeName: '越南' },
  sg: { scopeId: 'sg', scopeName: '新加坡' },
  my: { scopeId: 'my', scopeName: '马来西亚' },
  id: { scopeId: 'id', scopeName: '印度尼西亚' },
  in: { scopeId: 'in', scopeName: '印度' },
  gb: { scopeId: 'gb', scopeName: '英国' },
  de: { scopeId: 'de', scopeName: '德国' },
  es: { scopeId: 'es', scopeName: '西班牙' },
  pt: { scopeId: 'pt', scopeName: '葡萄牙' },
  gr: { scopeId: 'gr', scopeName: '希腊' },
  tr: { scopeId: 'tr', scopeName: '土耳其' },
  ru: { scopeId: 'ru', scopeName: '俄罗斯' },
  br: { scopeId: 'br', scopeName: '巴西' },
  ar: { scopeId: 'ar', scopeName: '阿根廷' },
  mx: { scopeId: 'mx', scopeName: '墨西哥' },
  cn: { scopeId: 'cn', scopeName: '中国' },
  hk: { scopeId: 'cn', scopeName: '中国' },
  mo: { scopeId: 'cn', scopeName: '中国' },
  tw: { scopeId: 'cn', scopeName: '中国' },
};

// 根据 scopeId 提取用于查表的小写前缀（"-" 之前的部分，缺省为整个 scopeId）。
// Extract the lower-cased lookup prefix from a scopeId: the portion before the first "-",
// or the whole scopeId when no dash is present.
function extractScopePrefix(scopeId: string): string {
  return scopeId.split('-')[0]?.toLowerCase() ?? scopeId.toLowerCase();
}

// 根据 scopeId 解析其所属国家的归一化 scopeId；未命中返回 null。
// Resolve the normalized country scopeId for a given scopeId; returns null when not matched.
// 行为对齐 statsService.ts 中 normalizeInternationalCountry 的命中分支（未命中时后端保留原始 scopeId，
// 此处由于无法提供 fallback 语义，统一返回 null，调用方可自行选择回退策略）。
// Mirrors the match branch of statsService.ts#normalizeInternationalCountry; when unmatched the
// back-end currently keeps the raw scopeId, but here we return null so callers can choose a fallback.
export function resolveCountryScope(scopeId: string): string | null {
  const prefix = extractScopePrefix(scopeId);
  const entry = INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX[prefix];
  return entry ? entry.scopeId : null;
}

// 根据 scopeId 返回对应的国家映射条目；未命中返回 undefined。
// Return the country mapping entry for a given scopeId, or undefined when not matched.
export function getCountryByScopeId(scopeId: string): { scopeId: string; scopeName: string } | undefined {
  const prefix = extractScopePrefix(scopeId);
  return INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX[prefix];
}

// 列出所有去重后的国际国家条目（按 scopeId 去重，保持 Object.values 迭代顺序）。
// List all unique international country entries (de-duplicated by scopeId, preserving insertion order).
export function listInternationalCountries(): Array<{ scopeId: string; scopeName: string }> {
  const seen = new Set<string>();
  const results: Array<{ scopeId: string; scopeName: string }> = [];
  for (const entry of Object.values(INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX)) {
    if (seen.has(entry.scopeId)) {
      continue;
    }
    seen.add(entry.scopeId);
    results.push(entry);
  }
  return results;
}
