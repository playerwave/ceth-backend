// Cache Invalidation System - ระบบลบ cache อัตโนมัติเมื่อข้อมูลเปลี่ยน
import { smartCache } from "./smart-cache";

export class CacheInvalidator {
  private static instance: CacheInvalidator;

  public static getInstance(): CacheInvalidator {
    if (!CacheInvalidator.instance) {
      CacheInvalidator.instance = new CacheInvalidator();
    }
    return CacheInvalidator.instance;
  }

  /**
   * ลบ cache ที่เกี่ยวข้องกับกิจกรรม
   */
  public async invalidateActivityCache(activityId?: number): Promise<void> {
    try {
      console.log(`🔄 [CacheInvalidator] Invalidating activity cache...`);
      
      // ลบ cache ทั้งหมดที่เกี่ยวข้องกับกิจกรรม
      await smartCache.invalidatePattern("activity:*");
      await smartCache.invalidatePattern("join:*");
      await smartCache.invalidatePattern("assessment:*");
      
      // ลบ cache เฉพาะกิจกรรม
      if (activityId) {
        await smartCache.invalidate(`activity:${activityId}`);
        await smartCache.invalidate(`activity:detail:${activityId}`);
      }
      
      console.log(`✅ [CacheInvalidator] Activity cache invalidated successfully`);
    } catch (error) {
      console.error(`❌ [CacheInvalidator] Error invalidating activity cache:`, error);
    }
  }

  /**
   * ลบ cache เมื่อมีการอัปเดตสถานะ join
   */
  public async invalidateJoinCache(studentId: number, activityId: number): Promise<void> {
    try {
      console.log(`🔄 [CacheInvalidator] Invalidating join cache for student ${studentId}, activity ${activityId}`);
      
      await smartCache.invalidate(`join:${studentId}`);
      await smartCache.invalidate(`activity:${activityId}`);
      await smartCache.invalidatePattern("activity:all");
      
      console.log(`✅ [CacheInvalidator] Join cache invalidated successfully`);
    } catch (error) {
      console.error(`❌ [CacheInvalidator] Error invalidating join cache:`, error);
    }
  }

  /**
   * ลบ cache เมื่อมีการอัปเดตแบบประเมิน
   */
  public async invalidateAssessmentCache(activityId: number, studentId: number): Promise<void> {
    try {
      console.log(`🔄 [CacheInvalidator] Invalidating assessment cache for activity ${activityId}, student ${studentId}`);
      
      await smartCache.invalidate(`assessment:${activityId}:${studentId}`);
      await smartCache.invalidate(`activity:${activityId}`);
      await smartCache.invalidatePattern("activity:all");
      
      console.log(`✅ [CacheInvalidator] Assessment cache invalidated successfully`);
    } catch (error) {
      console.error(`❌ [CacheInvalidator] Error invalidating assessment cache:`, error);
    }
  }

  /**
   * ลบ cache ทั้งหมด
   */
  public async invalidateAllCache(): Promise<void> {
    try {
      console.log(`🔄 [CacheInvalidator] Invalidating all cache...`);
      
      await smartCache.invalidatePattern("*");
      
      console.log(`✅ [CacheInvalidator] All cache invalidated successfully`);
    } catch (error) {
      console.error(`❌ [CacheInvalidator] Error invalidating all cache:`, error);
    }
  }
}

// Export singleton instance
export const cacheInvalidator = CacheInvalidator.getInstance();
