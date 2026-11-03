import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'refreshtoken',
  'accesstoken',
  'newpassword',
  'oldpassword',
  'resettoken',
]);

function redactObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      clean[key] = redactObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Structured request logger middleware.
 * Assigns an X-Request-Id header, measures response latency,
 * and outputs structured JSON logs with sensitive fields redacted.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // Attach to request and response
  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Capture completion log
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs: duration,
      ip,
      userAgent: req.get('user-agent') || 'unknown',
    };

    // Warn on 4xx, Error on 5xx, Info on 2xx/3xx
    if (statusCode >= 500) {
      console.error(`[HTTP] ${JSON.stringify(logEntry)}`);
    } else if (statusCode >= 400) {
      console.warn(`[HTTP] ${JSON.stringify(logEntry)}`);
    } else {
      // In dev or normal operation
      if (process.env.NODE_ENV !== 'production' || statusCode !== 200 || !req.url.startsWith('/api/system')) {
        console.log(`[HTTP] ${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms [${requestId}]`);
      }
    }
  });

  next();
}
