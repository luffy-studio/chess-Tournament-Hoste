import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Strips script tags and basic XSS vectors from strings.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:[^"']*/gi, '')
    .replace(/on\w+=["'][^"']*["']/gi, '')
    .trim();
}

/**
 * Recursively sanitizes string properties on objects.
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

/**
 * Middleware to sanitize all string fields in req.body, req.query, and req.params.
 */
export function sanitizeMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Reusable Zod validation middleware for request body.
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Reusable Zod validation middleware for query parameters.
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Reusable Zod validation middleware for URL parameters.
 */
export function validateParams(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}
