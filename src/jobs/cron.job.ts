console.log("✅ cron.job.ts loaded");
import cron from "node-cron";
import { ActivityService } from "../services/Teacher/activity.service";
const activityService = new ActivityService();

// 🕛 ตั้งให้รันทุกวันเวลา 00:00
// cron.schedule("*/10 * * * * *", async () => { สำหรับทำสอบรันทุกๆ 10 วิ
cron.schedule("0 0 * * *", async () => {
  console.log("🔁 [Cron] Running auto-close activity job...");
  try {
    await activityService.autoCloseRegisterActivities();
    console.log("✅ [Cron] autoCloseRegisterActivities finished");
  } catch (error) {
    console.error("❌ [Cron] Error running autoCloseRegisterActivities:", error);
  }
});
