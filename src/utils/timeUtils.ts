import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// ✨ ติดตั้ง dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * แปลงเวลาเป็น UTC สำหรับการเปรียบเทียบในฐานข้อมูล
 * @param date - วันที่ที่ต้องการแปลง
 * @returns เวลาในรูปแบบ UTC string
 */
export const toUTCString = (date: Date | string): string => {
  return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ss');
};

/**
 * แปลงเวลาเป็น local time สำหรับแสดงผล
 * @param date - วันที่ที่ต้องการแปลง
 * @returns เวลาในรูปแบบ local string
 */
export const toLocalString = (date: Date | string): string => {
  return dayjs(date).tz("Asia/Bangkok").format('YYYY-MM-DD HH:mm:ss');
};

/**
 * แปลงเวลาเป็น local time สำหรับแสดงผลแบบไทย
 * @param date - วันที่ที่ต้องการแปลง
 * @returns เวลาในรูปแบบไทย
 */
export const toThaiString = (date: Date | string): string => {
  return dayjs(date).tz("Asia/Bangkok").format('DD/MM/YYYY HH:mm:ss');
};

/**
 * ตรวจสอบว่าเวลาปัจจุบันถึงเวลาที่กำหนดหรือไม่
 * @param targetDate - เวลาที่ต้องการตรวจสอบ
 * @returns true ถ้าถึงเวลาแล้ว
 */
export const isTimeReached = (targetDate: Date | string): boolean => {
  const now = dayjs().utc();
  const target = dayjs(targetDate).utc();
  return now.isAfter(target) || now.isSame(target);
};

/**
 * ตรวจสอบว่าเวลาปัจจุบันอยู่ในช่วงเวลาที่กำหนดหรือไม่
 * @param startDate - เวลาเริ่มต้น
 * @param endDate - เวลาสิ้นสุด
 * @returns true ถ้าอยู่ในช่วงเวลา
 */
export const isInTimeRange = (startDate: Date | string, endDate: Date | string): boolean => {
  const now = dayjs().utc();
  const start = dayjs(startDate).utc();
  const end = dayjs(endDate).utc();
  return now.isAfter(start) && now.isBefore(end);
};

/**
 * เพิ่ม 7 ชั่วโมงให้กับวันที่ (สำหรับแปลงจาก UTC เป็นเวลาไทย)
 * @param date - วันที่ที่ต้องการเพิ่ม 7 ชั่วโมง
 * @returns วันที่ที่เพิ่ม 7 ชั่วโมงแล้ว
 */
export const add7Hours = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = dayjs(date);
    if (!dateObj.isValid()) {
      console.error("❌ Invalid date:", date);
      return null;
    }
    
    const newDate = dateObj.add(7, 'hour').toDate();
    console.log(`🕐 [add7Hours] Original (UTC): ${dateObj.format('YYYY-MM-DD HH:mm:ss')} → Added 7h (Thai time): ${dayjs(newDate).format('YYYY-MM-DD HH:mm:ss')}`);
    
    return newDate;
  } catch (error) {
    console.error("❌ Error adding 7 hours to date:", date, error);
    return null;
  }
};

/**
 * แปลงเวลาตาม format ที่ส่งมา (เก็บเวลาเดิมไว้ ไม่มีการ shift timezone)
 * @param date - วันที่ที่ต้องการแปลง
 * @returns วันที่ที่แปลงแล้ว
 */
export const subtract7Hours = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    let dateObj: dayjs.Dayjs;
    
    // ✅ ตรวจสอบว่าเป็น UTC format หรือไม่
    if (typeof date === "string" && date.includes("T") && (date.includes("Z") || date.includes("+"))) {
      // เป็น UTC format ให้แปลงเป็นเวลากรุงเทพก่อน แล้วค่อยลบ 7 ชั่วโมง
      dateObj = dayjs.utc(date).tz("Asia/Bangkok");
      console.log(`🕐 [subtract7Hours] UTC format detected: ${date} → Converted to Bangkok time: ${dateObj.format('YYYY-MM-DD HH:mm:ss')}`);
      
      if (!dateObj.isValid()) {
        console.error("❌ Invalid date:", date);
        return null;
      }
      
      const newDate = dateObj.subtract(7, 'hour').toDate();
      console.log(`🕐 [subtract7Hours] Original (Thai time): ${dateObj.format('YYYY-MM-DD HH:mm:ss')} → Subtracted 7h (UTC): ${dayjs(newDate).format('YYYY-MM-DD HH:mm:ss')}`);
      
      return newDate;
    } else {
      // ✅ เป็น local format หรือ Date object ให้ใช้ตามเดิม (ไม่ลบ 7 ชั่วโมง)
      dateObj = dayjs(date);
      console.log(`🕐 [subtract7Hours] Local format detected: ${date} → Using as is (no timezone conversion)`);
      
      if (!dateObj.isValid()) {
        console.error("❌ Invalid date:", date);
        return null;
      }
      
      // ✅ คืนค่าโดยไม่ลบ 7 ชั่วโมง - เก็บเวลาเดิมไว้
      const result = dateObj.toDate();
      console.log(`🕐 [subtract7Hours] Final result: ${dayjs(result).format('YYYY-MM-DD HH:mm:ss')} (no timezone shift)`);
      
      return result;
    }
  } catch (error) {
    console.error("❌ Error processing date:", date, error);
    return null;
  }
};
