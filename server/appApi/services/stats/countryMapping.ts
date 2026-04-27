// stats 域国家映射 re-export / Re-export of the shared country mapping for stats aggregator.
// 事实源位于 shared/geo/countryMapping.ts；此文件仅作为后端历史 import 点的兼容薄壳。
// The source of truth lives in shared/geo/countryMapping.ts; this file is a thin shim to keep the
// historical back-end import site stable.
export {
  INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX,
  resolveCountryScope,
} from '../../../../shared/geo/countryMapping.js';
