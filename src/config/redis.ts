import Redis, { RedisOptions } from "ioredis";
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const host = process.env.REDIS_HOST ?? "redis";
const port = Number(process.env.REDIS_PORT ?? 6379);
const username = (process.env.REDIS_USERNAME ?? "default").trim();
const password = process.env.REDIS_PASSWORD?.trim();
const useTLS = (process.env.REDIS_TLS ?? "false").toLowerCase() === "true";

const config: RedisOptions = {
  host,
  port,
  username,                 
  password,                 
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  ...(useTLS ? { tls: { servername: host } } : {}), // เปิด TLS พร้อม SNI
};

const redis = new Redis(config);

const mask = (s?: string) => (s ? s.replace(/.(?=.{4})/g, "•") : "none");
console.log(
  "[Redis] init",
  JSON.stringify(
    {
      host,
      port,
      username,
      password: password ? mask(password) : "none",
      tls: useTLS,
      envFile,
      nodeEnv: process.env.NODE_ENV ?? "development",
    },
    null,
    2
  )
);

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

void redis.connect();

export default redis;