// Cache Management API - API สำหรับจัดการ cache
import { Router } from "express";
import { cacheInvalidator } from "../utils/cache-invalidator";
import { smartCache } from "../utils/smart-cache";

const router = Router();

/**
 * ลบ cache ทั้งหมด
 */
router.delete("/all", async (req, res) => {
  try {
    await cacheInvalidator.invalidateAllCache();
    res.json({
      success: true,
      message: "All cache cleared successfully"
    });
  } catch (error) {
    console.error("❌ Error clearing all cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message
    });
  }
});

/**
 * ลบ cache ของกิจกรรม
 */
router.delete("/activity/:activityId?", async (req, res) => {
  try {
    const { activityId } = req.params;
    await cacheInvalidator.invalidateActivityCache(activityId ? parseInt(activityId) : undefined);
    res.json({
      success: true,
      message: `Activity cache cleared${activityId ? ` for activity ${activityId}` : ''}`
    });
  } catch (error) {
    console.error("❌ Error clearing activity cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear activity cache",
      error: error.message
    });
  }
});

/**
 * ลบ cache ของ join
 */
router.delete("/join/:studentId/:activityId", async (req, res) => {
  try {
    const { studentId, activityId } = req.params;
    await cacheInvalidator.invalidateJoinCache(parseInt(studentId), parseInt(activityId));
    res.json({
      success: true,
      message: `Join cache cleared for student ${studentId}, activity ${activityId}`
    });
  } catch (error) {
    console.error("❌ Error clearing join cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear join cache",
      error: error.message
    });
  }
});

/**
 * ลบ cache ของแบบประเมิน
 */
router.delete("/assessment/:activityId/:studentId", async (req, res) => {
  try {
    const { activityId, studentId } = req.params;
    await cacheInvalidator.invalidateAssessmentCache(parseInt(activityId), parseInt(studentId));
    res.json({
      success: true,
      message: `Assessment cache cleared for activity ${activityId}, student ${studentId}`
    });
  } catch (error) {
    console.error("❌ Error clearing assessment cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear assessment cache",
      error: error.message
    });
  }
});

/**
 * ดูสถานะ cache
 */
router.get("/status", async (req, res) => {
  try {
    // TODO: เพิ่มการตรวจสอบสถานะ cache
    res.json({
      success: true,
      message: "Cache status endpoint - to be implemented"
    });
  } catch (error) {
    console.error("❌ Error getting cache status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cache status",
      error: error.message
    });
  }
});

export default router;
