import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || "",
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Add error handling
redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

export default redis;
