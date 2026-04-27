// bootstrapSerializer barrel：实际实现已按业务域拆分到 serializers/bootstrap/ 子目录。
// bootstrapSerializer barrel: the actual implementation has been split by business domain into
// serializers/bootstrap/.
// 为保留既有 `server/appApi/serializers/bootstrapSerializer` 的 import 路径，此文件仅做 re-export。
// Keeps the import path `server/appApi/serializers/bootstrapSerializer` stable via barrel re-exports.
export * from './bootstrap/index.js';
