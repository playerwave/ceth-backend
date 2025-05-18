// src/services/activity.service.ts

import { ActivityDao } from "../daos/Admin/activity.dao";  // เรียกใช้งาน ActivityDao
import { Activity } from "../interfaces/Activity";  // เรียกใช้งาน Interface Activity
import { ActivityDetailDao } from "../daos/Admin/activity_detail.dao"; // ใช้งาน DAO ของ ActivityDetail

export class ActivityService {
  private activityDao = new ActivityDao();  // สร้างตัวแปรเพื่อใช้เรียก DAO
  private activityDetailDao = new ActivityDetailDao();  // สร้างตัวแปร DAO สำหรับ ActivityDetail

  /**
   * สร้างกิจกรรมใหม่
   * @param activityData ข้อมูลกิจกรรมที่รับมา
   * @returns กิจกรรมที่ถูกสร้างแล้ว
   */
  async createActivity(activityData: Activity): Promise<Activity> {
    // ตรวจสอบข้อมูลที่จำเป็น เช่น ชื่อกิจกรรม
    if (!activityData.activity_name || activityData.activity_name.trim() === "") {
      throw new Error("Activity name is required.");
    }

    // เรียกใช้ DAO เพื่อสร้างกิจกรรม
    return this.activityDao.createActivity(activityData);
  }

  /**
   * ดึงกิจกรรมตาม ID
   * @param id รหัสกิจกรรม
   * @returns กิจกรรม หรือ null ถ้าไม่พบ
   */
  async getActivityById(id: number): Promise<Activity | null> {
    // ตรวจสอบว่า ID เป็นเลขที่ถูกต้อง
    if (isNaN(id)) {
      throw new Error("Invalid activity ID");
    }

    // เรียกใช้ DAO เพื่อดึงข้อมูลกิจกรรมจากฐานข้อมูล
    return this.activityDao.getActivityById(id);
  }

  /**
   * อัปเดตกิจกรรม
   * @param id รหัสกิจกรรม
   * @param data ข้อมูลที่ต้องการอัปเดต (partial)
   * @returns กิจกรรมที่อัปเดตแล้ว หรือ null ถ้าไม่พบ
   */
  async updateActivity(id: number, data: Partial<Activity>): Promise<Activity | null> {
    // ตรวจสอบว่า ID เป็นเลขที่ถูกต้อง
    if (isNaN(id)) {
      throw new Error("Invalid activity ID");
    }

    // อัปเดตข้อมูลกิจกรรมในฐานข้อมูล
    return this.activityDao.updateActivity(id, data);
  }

  /**
   * ลบกิจกรรม
   * @param id รหัสกิจกรรม
   * @returns true ถ้าลบสำเร็จ, false ถ้าไม่พบกิจกรรม
   */
  async deleteActivity(id: number): Promise<boolean> {
    // ตรวจสอบว่า ID เป็นเลขที่ถูกต้อง
    if (isNaN(id)) {
      throw new Error("Invalid activity ID");
    }

    // เรียก DAO เพื่อลบกิจกรรม
    return this.activityDao.deleteActivity(id);
  }

  /**
   * ดึงกิจกรรมทั้งหมด (รองรับ Pagination)
   * @param limit จำนวนสูงสุดที่ดึง
   * @param offset ข้ามข้อมูลกี่แถว (สำหรับ pagination)
   * @returns อาเรย์กิจกรรม
   */
  async getAllActivities(limit?: number, offset?: number): Promise<Activity[]> {
    return this.activityDao.getAllActivities(limit, offset);
  }

  /**
   * ค้นหากิจกรรมตามชื่อ
   * @param ac_name ชื่อกิจกรรม
   * @returns กิจกรรมที่ค้นพบ
   */
  async searchActivityService(ac_name: string): Promise<Activity[]> {
    if (!ac_name.trim()) {
      throw new Error("Activity name is required for search.");
    }

    // เรียกใช้ DAO เพื่อค้นหากิจกรรม
    return this.activityDao.searchActivity(ac_name);
  }

  /**
   * ดึงรายชื่อนิสิตที่ลงทะเบียนในกิจกรรม
   * @param activityId รหัสกิจกรรม
   * @returns รายชื่อนิสิต
   */
  async getEnrolledStudentsListService(activityId: number): Promise<any[]> {
    if (isNaN(activityId)) {
      throw new Error("Invalid activity ID");
    }

    // เรียกใช้ DAO เพื่อดึงรายชื่อนิสิตที่ลงทะเบียนในกิจกรรม
    return this.activityDao.getEnrolledStudentsList(activityId);
  }
}
