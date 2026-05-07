import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://redis:6379" // nombre del contenedor
});

redisClient.on("error", (err) => console.error("Redis error:", err));

await redisClient.connect();

export default redisClient;