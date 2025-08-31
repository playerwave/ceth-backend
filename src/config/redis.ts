import Redis from "ioredis";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const host = (process.env.REDIS_HOST || "").trim();
const port = parseInt((process.env.REDIS_PORT || "6379").trim(), 10);
const username = (process.env.REDIS_USERNAME || "").trim();
const password = (process.env.REDIS_PASSWORD || "").trim();

console.log("[Redis Config]", { host, port, username, pwLen: password.length });

const redis = new Redis({
  host,
  port,
  username,            // สำคัญ: บังคับใช้ AUTH <user> <pass>
  password,
  ...(process.env.REDIS_USE_TLS === "true" ? { tls: { servername: host } } : {}),
  maxRetriesPerRequest: 1,
  retryStrategy: t => Math.min(t * 200, 2000),
});

redis.on("connect", () => console.log("✅ Redis TCP connected"));
redis.on("ready", () => console.log("✅ Redis ready (AUTH ok)"));
redis.on("error", (e) => console.error("❌ Redis error:", e?.message || e));

export default redis;
