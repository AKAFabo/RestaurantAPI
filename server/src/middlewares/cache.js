import redisClient from "../config/redis.js";

export const cache = (prefix, ttl = 60) => {
  return async (req, res, next) => {
    try {
      const userId = req.kauth?.grant?.access_token?.content?.sub || "guest";
      const key = `${prefix}:${userId}:${req.originalUrl}`;

      console.log(`[CACHE] Checking key: ${key}`);

      const cached = await redisClient.get(key);

      if (cached) {
        console.log(`[CACHE HIT] ${key}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`[CACHE MISS] ${key}`);

      const originalJson = res.json.bind(res);

      res.json = (data) => {
        console.log(`[CACHE SAVE] ${key} (TTL: ${ttl}s)`);
        redisClient
          .setEx(key, ttl, JSON.stringify(data))
          .catch(err => console.error(`[CACHE ERROR - SAVE] ${key}`, err));

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("[CACHE ERROR]", error);
      next();
    }
  };
};