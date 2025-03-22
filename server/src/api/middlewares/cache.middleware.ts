import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';
import { miscConfig } from '../../config';
import logger from '../../utils/logger.utils';

const redis = new Redis({
  url: miscConfig.redisUrl,
  token: miscConfig.redisToken,
});

// Helper function to stringify apiConfig for comparison
function stringifyApiConfig(apiConfig: any): string {
  return JSON.stringify({
    model: apiConfig.model,
    provider: apiConfig.provider,
  });
}

export async function checkCache(req: Request, res: Response, next: NextFunction) {
  const { username, priority, apiConfig } = req.body;

  try {
    if (priority !== "") {
      logger.info(`Priority is set for user: ${username}`);
      next();
      return;
    }

    logger.info(`Checking cache for user: ${username}`);

    const configCacheKey = `user:${username}:config`;
    const cachedConfigString: string | null = await redis.get(configCacheKey);

    const currentConfigString = stringifyApiConfig(apiConfig);

    if (cachedConfigString && cachedConfigString === currentConfigString) {
      // Config is the same, check message cache
      const messageCacheKey = `user:${username}:messages`;
      const cachedMessages: any = await redis.get(messageCacheKey);

      if (cachedMessages?.tags?.length > 0) {
        logger.info(`Cache hit for user: ${username} with config: ${currentConfigString}`);
        res.json(cachedMessages);
        return;
      }
    } else {
      // Config has changed or no config in cache
      logger.info(`Config change detected or no previous config. Updating config cache for user: ${username}`);
      await redis.set(configCacheKey, currentConfigString, { ex: 3600 }); // Cache config for 1 hour
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function updateCache(username: string, apiConfig: any, data: any) {
  const messageCacheKey = `user:${username}:messages`;
  await redis.set(messageCacheKey, data, { ex: 600 }); // Cache messages for 10 minutes
  logger.info(`Updated message cache for user: ${username} with config: ${stringifyApiConfig(apiConfig)}`);
}