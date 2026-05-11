// Re-export shared error code constants/types so 前端调用方 / front-end callers
// 可以直接从 api/types 引用统一的错误码常量 / can import the unified error code constants.
export { APP_API_ERROR_CODE, type AppApiErrorCode } from '../../../shared/errors/codes';
export * from './dto';
