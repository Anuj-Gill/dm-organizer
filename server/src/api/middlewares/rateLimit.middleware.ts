import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../../utils/logger.utils';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: 'Too many requests, please try again after 1 minute',
  standardHeaders: true,
  legacyHeaders: false, 
  keyGenerator: (req: any) => req.body.username,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for user: ${req.body.username}`);
    res.status(429).json({ error: 'Too Many Requests. Please try again after a minute!' });
  },
});