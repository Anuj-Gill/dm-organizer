import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';
import { miscConfig } from '../../config';
import logger from '../../utils/logger.utils';

const redis = new Redis({
  url: miscConfig.redisUrl,
  token: miscConfig.redisToken,
});

export async function checkCache(req: Request, res: Response, next: NextFunction) {
    const { username, priority } = req.body;
    if(priority !== "") {
        logger.info(`Priority is set for user: ${username}`);
        next();
    } else {
        logger.info(`Checking cache for user: ${username}`);
        const user = await redis.get(username);
        if (user) {
            logger.info(`Cache hit for user: ${username}`);
            res.json(user);
        } 
    }
     
}