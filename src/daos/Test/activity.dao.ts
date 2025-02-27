import { loadActivityData } from "../../db/database"; // นำเข้าฟังก์ชัน loadActivityData ที่โหลดข้อมูลจาก JSON
import { Activity } from "../../entity/Activity"; // ถ้าไม่ใช้ Activity Entity ก็ไม่จำเป็นต้องนำเข้า

export class ActivityDao {
  // ไม่มีการใช้งาน repository เพราะเราไม่ได้ใช้ฐานข้อมูล
  constructor() {}

  // ฟังก์ชันเพื่อดึงข้อมูลทั้งหมดจาก activities.json
  getAllActivities(): Activity[] {
    try {
      const activities = loadActivityData(); // โหลดข้อมูลจากไฟล์ JSON
      return activities; // คืนข้อมูลทั้งหมดที่ได้จาก JSON
    } catch (error) {
      console.error("Error loading activity data:", error);
      throw error;
    }
  }

  getActivityById(id: number): Activity | null {
    try {
      const activities = loadActivityData(); // โหลดข้อมูลจาก JSON
      const activity = activities.find(
        (activity: Activity) => activity.id === id
      ); // ค้นหากิจกรรมที่ตรงกับ id
      return activity || null; // หากพบกิจกรรม, คืนข้อมูล; หากไม่พบ, คืน null
    } catch (error) {
      console.error("Error loading activity data:", error);
      throw error;
    }
  }

  searchActivitiesByName(searchName: string): Activity[] {
    try {
      const activities = loadActivityData();
      const filteredActivities = activities.filter(
        (activity: Activity) =>
          activity.activity_name
            .toLowerCase()
            .includes(searchName.toLowerCase()) // ใช้ searchName แทน searchTerm
      );
      return filteredActivities;
    } catch (error) {
      console.error("Error loading activity data:", error);
      throw error;
    }
  }
}
