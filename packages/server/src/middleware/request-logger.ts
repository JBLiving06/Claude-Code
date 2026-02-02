/**
 * Request Logger Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.id = nanoid(10);

  const start = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.path} ${res.statusCode} ${duration}ms [${req.id}]`;

    if (res.statusCode >= 400) {
      console.error(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
}
