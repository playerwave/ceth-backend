// Smart Cache System - ระบบ cache ที่อัปเดตอัตโนมัติ
import redis from "../config/redis";

export interface CacheConfig {
  key: string;
  ttl: number; // Time to live in seconds
  refreshThreshold: number; // Refresh when remaining time < this value
  forceRefresh?: boolean;
}

export class SmartCache {
  private static instance: SmartCache;
  private refreshPromises: Map<string, Promise<any>> = new Map();

  public static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache();
    }
    return SmartCache.instance;
  }

  /**
   * ดึงข้อมูลจาก cache หรือ database พร้อม auto-refresh
   */
  public async get<T>(
    config: CacheConfig,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    const { key, ttl, refreshThreshold, forceRefresh = false } = config;

    try {
      // ตรวจสอบว่ามีการ refresh อยู่หรือไม่
      if (this.refreshPromises.has(key)) {
        console.log(`🔄 [SmartCache] Waiting for ongoing refresh for key: ${key}`);
        return await this.refreshPromises.get(key)!;
      }

      // ดึงข้อมูลจาก cache
      if (!forceRefresh) {
        const cached = await redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          const ttlRemaining = await redis.ttl(key);
          
          // Auto-refresh ถ้าใกล้หมดอายุ
          if (ttlRemaining <= refreshThreshold && ttlRemaining > 0) {
            console.log(`🔄 [SmartCache] Auto-refreshing cache for key: ${key} (TTL: ${ttlRemaining}s)`);
            this.backgroundRefresh(key, fetchFunction, ttl);
          }
          
          console.log(`📦 [SmartCache] Returning cached data for key: ${key}`);
          return data;
        }
      }

      // ดึงข้อมูลใหม่
      console.log(`🔄 [SmartCache] Fetching fresh data for key: ${key}`);
      return await this.refreshData(key, fetchFunction, ttl);

    } catch (error) {
      console.error(`❌ [SmartCache] Error for key ${key}:`, error);
      // Fallback: ดึงข้อมูลโดยตรงจาก database
      return await fetchFunction();
    }
  }

  /**
   * อัปเดตข้อมูลใน cache
   */
  public async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(data), "EX", ttl);
      console.log(`✅ [SmartCache] Data cached for key: ${key}`);
    } catch (error) {
      console.error(`❌ [SmartCache] Error caching data for key ${key}:`, error);
    }
  }

  /**
   * ลบ cache
   */
  public async invalidate(key: string): Promise<void> {
    try {
      await redis.del(key);
      console.log(`🗑️ [SmartCache] Cache invalidated for key: ${key}`);
    } catch (error) {
      console.error(`❌ [SmartCache] Error invalidating cache for key ${key}:`, error);
    }
  }

  /**
   * ลบ cache หลายตัวพร้อมกัน
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ [SmartCache] Pattern cache invalidated: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error(`❌ [SmartCache] Error invalidating pattern ${pattern}:`, error);
    }
  }

  /**
   * Refresh ข้อมูลใน background
   */
  private async backgroundRefresh<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    const refreshPromise = this.refreshData(key, fetchFunction, ttl);
    this.refreshPromises.set(key, refreshPromise);
    
    try {
      await refreshPromise;
    } finally {
      this.refreshPromises.delete(key);
    }
  }

  /**
   * ดึงข้อมูลใหม่และเก็บใน cache
   */
  private async refreshData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const data = await fetchFunction();
    await this.set(key, data, ttl);
    return data;
  }
}

// Export singleton instance
export const smartCache = SmartCache.getInstance();
