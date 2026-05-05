// bootstrap serializer barrel / Bootstrap serializer barrel re-exports.
// 统一 re-export 各业务域子模块（companions / trips / markers / guides / store），
// 保留原 bootstrapSerializer 对外 API surface 不变。
// Re-exports sub-module serializers (companions / trips / markers / guides / store) so the
// bootstrapSerializer public API surface remains stable.
export * from './companions.js';
export * from './trips.js';
export * from './markers.js';
export * from './guides.js';
export * from './wishlist.js';
export * from './store.js';
