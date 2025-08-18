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
  const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // เพิ่ม 7 ชั่วโมง
  console.log(`🔁 [Cron] Running auto-update activity states job at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
  console.log(`🕐 [Cron] UTC time: ${now.toISOString()}`);
  console.log(`🕐 [Cron] Thai time: ${thaiTime.toISOString()}`);
  try {
    // Call advanceStatesOnce directly from DAO
    const result = await activityDao.advanceStatesOnce(thaiTime);
    console.log(`✅ [Cron] advanceStatesOnce finished successfully at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    console.log(`📊 [Cron] Result:`, result);
  } catch (error) {
    console.error(`❌ [Cron] Error running advanceStatesOnce at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}:`, error);
  }
});