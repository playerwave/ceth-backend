console.log("✅ cron.job.ts loaded");
import cron from "node-cron";
import { ActivityDao } from "../daos/Teacher/activity.dao.newstructure";

const activityDao = new ActivityDao();

// 🕛 ตั้งให้รันทุก 5 นาที เพื่ออัปเดตสถานะกิจกรรมทั้งหมด
// cron.schedule("*/10 * * * * *", async () => { สำหรับทำสอบรันทุกๆ 10 วิ
// cron.schedule("0 0 * * *", async () => { ทุกวันเวลา 00:00
// cron.schedule("*/1 * * * *", async () => { 1 นาที
cron.schedule("*/5 * * * *", async () => {
  const now = new Date();
  console.log(`🔁 [Cron] Running auto-update activity states job at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
  console.log(`🕐 [Cron] Current time: ${now.toISOString()}`);
  try {
    // Call advanceStatesOnce directly from DAO
    const result = await activityDao.advanceStatesOnce(now);
    console.log(`✅ [Cron] advanceStatesOnce finished successfully at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    console.log(`📊 [Cron] Result:`, result);
  } catch (error) {
    console.error(`❌ [Cron] Error running advanceStatesOnce at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}:`, error);
  }
});