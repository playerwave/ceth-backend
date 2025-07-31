import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// ✨ ติดตั้ง plugin
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * แปลงเวลาจาก UTC หรือ Date ให้เป็นเวลาใน timezone ที่ต้องการ
 * @param date - ข้อมูลวันเวลาที่ต้องการแปลง (Date หรือ string)
 * @param tz - Timezone เป้าหมาย (default คือ 'Asia/Bangkok')
 * @returns เวลาในรูปแบบ 'YYYY-MM-DD HH:mm:ss'
 */
export const formatTimeToLocal = (
  date: Date | string,
  tz = "Asia/Bangkok"
): string => {
  return dayjs.utc(date).tz(tz).format("YYYY-MM-DD HH:mm:ss");
};
