// 来源 / Source: 收敛自 server/appApi/errors.ts 中真实出现过的错误码字面量。
// Consolidates literal error codes that currently appear in server/appApi/errors.ts.
// 纯常量模块 / Pure constants module:
// - 禁止引入任何 runtime 依赖（React / Fastify / Prisma / @prisma/client 等）。
// - Must not import any runtime dependency so it can be shared across front-end and back-end.

export const APP_API_ERROR_CODE = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

// 错误码联合类型 / Union type of all app-api error codes.
export type AppApiErrorCode = typeof APP_API_ERROR_CODE[keyof typeof APP_API_ERROR_CODE];
