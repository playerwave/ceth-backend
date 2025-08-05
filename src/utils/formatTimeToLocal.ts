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
  // ✅ ตรวจสอบว่าเป็น UTC string หรือไม่
  if (typeof date === "string" && date.includes("T") && date.includes("Z")) {
    // ✅ ถ้าเป็น UTC string ให้แปลงเป็น local time
    return dayjs.utc(date).tz(tz).format("YYYY-MM-DD HH:mm:ss");
  } else {
    // ✅ ถ้าเป็น local time อยู่แล้ว ให้แปลงเป็น ISO string
    return dayjs(date).tz(tz).format("YYYY-MM-DD HH:mm:ss");
  }
};

/**
 * แปลงเวลาเป็น ISO string สำหรับส่งไป frontend
 * @param date - ข้อมูลวันเวลาที่ต้องการแปลง
 * @returns เวลาในรูปแบบ ISO string
 */
export const formatTimeToISO = (date: Date | string): string => {
  if (typeof date === "string" && date.includes("T") && date.includes("Z")) {
    // ✅ ถ้าเป็น UTC string อยู่แล้ว ให้ส่งกลับไปเลย
    return date;
  } else {
    // ✅ ถ้าเป็น local time ให้แปลงเป็น UTC
    return dayjs(date).utc().format();
  }
};

/**
 * บวก 7 ชั่วโมงให้กับเวลาที่ส่งมาจาก frontend
 * @param localTime - เวลาในรูปแบบ local time string (YYYY-MM-DD HH:mm:ss)
 * @returns เวลาในรูปแบบ UTC ISO string
 */
export const add7Hours = (localTime: string): string => {
  if (!localTime) return "";

  try {
    // ✅ บวก 7 ชั่วโมงให้กับเวลาที่ส่งมาจาก frontend
    const date = dayjs(localTime);
    const utcTime = date.add(7, "hour");
    return utcTime.format();
  } catch (error) {
    console.error("❌ Error adding 7 hours:", error);
    return localTime;
  }
};

/**
 * แปลง UTC เป็น local time สำหรับแสดงผล
 * @param utcTime - เวลาในรูปแบบ UTC ISO string
 * @returns เวลาในรูปแบบ local time string
 */
export const convertUTCToLocal = (utcTime: string): string => {
  if (!utcTime) return "";

  try {
    // ✅ แปลง UTC เป็น local time โดยลบ 7 ชั่วโมง
    const localTime = dayjs.utc(utcTime).tz("Asia/Bangkok");
    return localTime.format("YYYY-MM-DD HH:mm:ss");
  } catch (error) {
    console.error("❌ Error converting UTC to local:", error);
    return utcTime;
  }
};
