import redisClient from "../config/redis.js";

export async function invalidateUsersCache() {
    try {
        const keys = await redisClient.keys("users:*");
        if (keys.length > 0) {
            await Promise.all(keys.map(k => redisClient.del(k)));
            console.log("[CACHE INVALIDATED] users:*");
        }
    } catch (error) {
        console.error("[CACHE ERROR - USERS INVALIDATION]", error);
    }
}

export async function invalidateUserCache(userId) {
    try {
        const keys = await redisClient.keys(`me:${userId}:*`);
        if (keys.length > 0) {
            await Promise.all(keys.map(k => redisClient.del(k)));
            console.log(`[CACHE INVALIDATED] me:${userId}:*`);
        }
    } catch (error) {
        console.error("[CACHE ERROR - USER INVALIDATION]", error);
    }
}

export async function invalidateRestaurantsCache() {
    const keys = await redisClient.keys("restaurants:*");
    await Promise.all(keys.map(k => redisClient.del(k)));
}

export async function invalidateOrdersCache() {
    try {
        const keys = await redisClient.keys("orders:*");
        if (keys.length > 0) {
            await Promise.all(keys.map(k => redisClient.del(k)));
            console.log("[CACHE INVALIDATED] orders:*");
        }
    } catch (error) {
        console.error("[CACHE ERROR - ORDERS INVALIDATION]", error);
    }
}

export async function invalidateMenusCache() {
    const keys = await redisClient.keys("menu:*");
    await Promise.all(keys.map(k => redisClient.del(k)));

    const productKeys = await redisClient.keys("products:*");
    await Promise.all(productKeys.map(k => redisClient.del(k)));
}