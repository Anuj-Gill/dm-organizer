import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';
import { miscConfig } from '../../config';
import logger from '../../utils/logger.utils';

const redis = new Redis({
  url: miscConfig.redisUrl,
  token: miscConfig.redisToken,
});

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
    const cachedConfig: any = await redis.get(configCacheKey);

    const modelMatch = cachedConfig && cachedConfig.model === apiConfig.model;
    const providerMatch = cachedConfig && cachedConfig.provider === apiConfig.provider;
    console.log(cachedConfig, apiConfig, modelMatch, providerMatch);

    if (modelMatch && providerMatch) {
      // Config is the same, check message cache
      const messageCacheKey = `user:${username}:messages`;
      const cachedMessages: any = await redis.get(username);

      if (cachedMessages?.tags?.length > 0) {
        logger.info(`Cache hit for user: ${username} with config: ${JSON.stringify(apiConfig)}`);
        res.json(cachedMessages);
        return;
      }
    } else {
      // Config has changed or no config in cache
      logger.info(
        `Config change detected or no previous config. Updating config cache for user: ${username}`
      );
      await redis.set(configCacheKey, { model: apiConfig.model, provider: apiConfig.provider }, { ex: 3600 }); // Cache config for 1 hour
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function updateCache(username: string, apiConfig: any, data: any) {
  const messageCacheKey = `user:${username}:messages`;
  await redis.set(messageCacheKey, data, { ex: 600 }); // Cache messages for 10 minutes
  logger.info(`Updated message cache for user: ${username} with config: ${JSON.stringify(apiConfig)}`);
}