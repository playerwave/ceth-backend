console.log("✅ cron.job.ts loaded");
import cron from "node-cron";
import { ActivityDao } from "../daos/Teacher/activity.dao";
import dotenv from "dotenv";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// ✨ ติดตั้ง dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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
  
  // ✅ ใช้เวลาท้องถิ่น (Asia/Bangkok) แทน UTC
  const now = dayjs().tz("Asia/Bangkok");
  const utcNow = now.utc(); // แปลงเป็น UTC สำหรับ database
  
  console.log(`🕐 [Cron] Local time: ${now.format('DD/MM/YYYY HH:mm:ss')} (Asia/Bangkok)`);
  console.log(`🕐 [Cron] UTC time: ${utcNow.format('DD/MM/YYYY HH:mm:ss')} (UTC)`);
  
  try {
    // Call advanceStatesOnce directly from DAO
    const result = await activityDao.advanceStatesOnce(utcNow.toDate()); // ส่ง utcNow.toDate() ไปยัง DAO
    console.log(`✅ [Cron] advanceStatesOnce finished successfully at ${now.format('DD/MM/YYYY HH:mm:ss')}`);
    console.log(`📊 [Cron] Result:`, {
      notStartToSpecial: result.notStartToSpecial,
      notStartToOpen: result.notStartToOpen,
      notStartToStartActivity: result.notStartToStartActivity,
      specialToOpen: result.specialToOpen,
      openToClose: result.openToClose,
      closeToStart: result.closeToStart,
      startToEnd: result.startToEnd,
      endToStartAssess: result.endToStartAssess,
      startAssessToEnd: result.startAssessToEnd
    });
    
    // ทดสอบส่งอีเมลโดยตรงถ้ามี Course เริ่มต้น
    if (result.notStartToStartActivity > 0) {
      console.log(`🧪 [Cron] Testing direct email send for ${result.notStartToStartActivity} Course activities`);
    }
  } catch (error) {
    console.error(`❌ [Cron] Error in advanceStatesOnce:`, error);
  } finally {
    isRunning = false;
  }
}, {
  timezone: "Asia/Bangkok" // ✅ ตั้ง timezone ให้ cron job ใช้เวลาท้องถิ่น
});