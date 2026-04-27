// 错误处理工具：统一 AppApiError 及工厂函数。
// Error utilities: unified AppApiError class and factory helpers.
// 错误码字面量的事实源位于 shared/errors/codes.ts，本文件只做 re-export 与消费。
// The source of truth for error code literals lives in shared/errors/codes.ts; this file only
// re-exports and consumes them.
import { APP_API_ERROR_CODE, type AppApiErrorCode } from '../../shared/errors/codes.js';

export { APP_API_ERROR_CODE, type AppApiErrorCode };

export class AppApiError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode = 500) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createValidationError(message: string) {
  return new AppApiError(APP_API_ERROR_CODE.INVALID_REQUEST, message, 400);
}

export function createNotFoundError(message: string) {
  return new AppApiError(APP_API_ERROR_CODE.NOT_FOUND, message, 404);
}

export function createConflictError(message: string) {
  return new AppApiError(APP_API_ERROR_CODE.CONFLICT, message, 409);
}

export function createUnauthorizedError(message: string) {
  return new AppApiError(APP_API_ERROR_CODE.UNAUTHORIZED, message, 401);
}

export function createForbiddenError(message: string) {
  return new AppApiError(APP_API_ERROR_CODE.FORBIDDEN, message, 403);
}

export function normalizeAppApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    return createConflictError('resource already exists');
  }

  if (
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'PrismaClientInitializationError') ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P1001')
  ) {
    return new AppApiError(
      APP_API_ERROR_CODE.DATABASE_UNAVAILABLE,
      'database is unavailable, please start MySQL and retry',
      503,
    );
  }

  return new AppApiError(APP_API_ERROR_CODE.INTERNAL_SERVER_ERROR, 'app api request failed', 500);
}
