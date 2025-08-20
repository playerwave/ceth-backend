console.log("✅ cron.job.ts loaded");
import cron from "node-cron";
import { ActivityDao } from "../daos/Teacher/activity.dao.newstructure";
import dotenv from "dotenv";

// โหลด environment variables
dotenv.config();
console.log("🔍 [Cron] Environment check:");
console.log("🔍 [Cron] EMAIL_SENDER:", process.env.EMAIL_SENDER ? "SET" : "MISSING");
console.log("🔍 [Cron] EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD ? "SET" : "MISSING");

const activityDao = new ActivityDao();

// 🔒 ป้องกันการรันซ้ำ
let isRunning = false;

// 🕛 ตั้งให้รันทุก 5 นาที เพื่ออัปเดตสถานะกิจกรรมทั้งหมด
// cron.schedule("*/10 * * * * *", async () => { สำหรับทำสอบรันทุกๆ 10 วิ
// cron.schedule("0 0 * * *", async () => { ทุกวันเวลา 00:00
// cron.schedule("*/1 * * * *", async () => { 1 นาที
cron.schedule("*/5 * * * *", async () => {
  // 🔒 ป้องกันการรันซ้ำ
  if (isRunning) {
    console.log(`⚠️ [Cron] Previous job still running, skipping this execution`);
    return;
  }

  isRunning = true;
  const now = new Date();
  console.log(`🔁 [Cron] Running auto-update activity states job at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
  console.log(`🕐 [Cron] Current time: ${now.toISOString()}`);
  
  try {
    // Call advanceStatesOnce directly from DAO
    const result = await activityDao.advanceStatesOnce(now);
    console.log(`✅ [Cron] advanceStatesOnce finished successfully at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    console.log(`📊 [Cron] Result:`, {
      notStartToSpecial: result.notStartToSpecial,
      notStartToOpen: result.notStartToOpen,
      notStartToStartActivity: result.notStartToStartActivity, // เพิ่ม transition ใหม่
      specialToOpen: result.specialToOpen,
      openToClose: result.openToClose,
      closeToStart: result.closeToStart,
      startToEnd: result.startToEnd,
      endToStartAssess: result.endToStartAssess,
      startAssessToEnd: result.startAssessToEnd,
    });
    
    // ทดสอบส่งอีเมลโดยตรงถ้ามี Course เริ่มต้น
    if (result.notStartToStartActivity > 0) {
      console.log(`🧪 [Cron] Testing direct email send for ${result.notStartToStartActivity} Course activities`);
    }
  } catch (error) {
    console.error(`❌ [Cron] Error running advanceStatesOnce at ${now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}:`, error);
  } finally {
    // 🔒 ปลดล็อคการรัน
    isRunning = false;
  }
});