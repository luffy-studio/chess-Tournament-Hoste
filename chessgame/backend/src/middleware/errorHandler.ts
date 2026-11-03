import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Centralized Error Handling Middleware.
 * Catches all operational and unexpected errors, logs them with correlation requestId,
 * and returns consistent JSON responses without leaking internal paths or database internals in production.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).id || req.headers['x-request-id'] || 'unknown';
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_FAILED',
      message: 'One or more request parameters failed validation.',
      details: formattedErrors,
      requestId,
    });
    return;
  }

  // 2. Custom Application Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code || 'APP_ERROR',
      details: err.details,
      requestId,
    });
    return;
  }

  // 3. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      res.status(409).json({
        error: `A record with this ${target} already exists.`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        requestId,
      });
      return;
    }

    // Record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        requestId,
      });
      return;
    }

    // Foreign key violation
    if (err.code === 'P2003') {
      res.status(400).json({
        error: 'Invalid reference to a related resource.',
        code: 'FOREIGN_KEY_VIOLATION',
        requestId,
      });
      return;
    }
  }

  // 4. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Invalid token provided.',
      code: 'INVALID_TOKEN',
      requestId,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Authentication token has expired. Please log in again.',
      code: 'TOKEN_EXPIRED',
      requestId,
    });
    return;
  }

  // 5. Malformed JSON Body Error
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
    res.status(400).json({
      error: 'Malformed JSON payload in request body.',
      code: 'INVALID_JSON',
      requestId,
    });
    return;
  }

  // 6. Generic / Unhandled Internal Errors
  console.error(`[ERROR] [${requestId}] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode && typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = isProd
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
