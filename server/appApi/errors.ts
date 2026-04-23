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
  return new AppApiError('INVALID_REQUEST', message, 400);
}

export function createNotFoundError(message: string) {
  return new AppApiError('NOT_FOUND', message, 404);
}

export function createConflictError(message: string) {
  return new AppApiError('CONFLICT', message, 409);
}

export function createUnauthorizedError(message: string) {
  return new AppApiError('UNAUTHORIZED', message, 401);
}

export function createForbiddenError(message: string) {
  return new AppApiError('FORBIDDEN', message, 403);
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
      'DATABASE_UNAVAILABLE',
      'database is unavailable, please start MySQL and retry',
      503,
    );
  }

  return new AppApiError('INTERNAL_SERVER_ERROR', 'app api request failed', 500);
}
