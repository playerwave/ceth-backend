console.log("✅ cron.job.ts loaded");
import cron from "node-cron";
import { ActivityService } from "../services/Teacher/activity.service";

const activityService = new ActivityService();

// 🕛 ตั้งให้รันทุกวันเวลา 00:00 เพื่ออัปเดตสถานะกิจกรรมทั้งหมด
// cron.schedule("*/10 * * * * *", async () => { สำหรับทำสอบรันทุกๆ 10 วิ
// cron.schedule("0 0 * * *", async () => { 1 ชม
// cron.schedule("*/1 * * * *", async () => { 1 นาที
cron.schedule("0 0 * * *", async () => {
  console.log("🔁 [Cron] Running auto-update activity states job...");
  try {
    // Call the main function that orchestrates all state transitions
    await activityService.autoUpdateActivityStates();
    console.log("✅ [Cron] autoUpdateActivityStates finished successfully.");
  } catch (error) {
    console.error("❌ [Cron] Error running autoUpdateActivityStates:", error);
  }
});