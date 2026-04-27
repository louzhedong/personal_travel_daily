// visitMarkerRepository barrel：实际实现已拆分至 repositories/visitMarker/ 子目录。
// visitMarkerRepository barrel: the actual implementation has moved into repositories/visitMarker/.
// 为保持既有 `server/appApi/repositories/visitMarkerRepository` 的 import 路径不变，本文件仅做 re-export。
// Keeps the existing import path `server/appApi/repositories/visitMarkerRepository` unchanged by re-exporting.
export * from './visitMarker/index.js';
