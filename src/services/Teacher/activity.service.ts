import { Activity } from "../../entity/activity.entity";
import { Assessment } from "../../entity/assessment.entity";
import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
// import { AssessmentDao } from "../../daos/Admin/assessment.dao.newstructure";
import { sendMailCreateActivity } from "../../mailer/email";
import logger from "../../utils/logger";
import dayjs from "dayjs";
import { v2 as cloudinary } from "cloudinary";

export class ActivityService {
  private activityDao = new ActivityDao();
  // private assessmentDao = new AssessmentDao();

  // ✅ สร้างกิจกรรมใหม่
  // async createActivityService(
  //   activityData: Partial<Activity> & { assessment_id?: number }
  // ): Promise<Activity> {
  //   try {
  //     logger.info("📩 Received data in createActivityService", {
  //       activityData,
  //     });

  //     let selectedAssessment: Assessment | null = null;

  //     // ตรวจสอบ assessment_id และดึงข้อมูล Assessment
  //     if (activityData.assessment_id) {
  //       if (isNaN(Number(activityData.assessment_id))) {
  //         throw new Error("Invalid assessment_id format");
  //       }

  //       selectedAssessment =
  //         (await this.assessmentDao.getAssessmentByIdDao(
  //           activityData.assessment_id
  //         )) ?? null;
  //     }

  //     console.log(
  //       "🔍 ac_recieve_hours ก่อนคำนวณ:",
  //       activityData.ac_recieve_hours
  //     );

  //     // แปลงค่าเป็น Date ก่อนคำนวณ
  //     // กำหนดค่าให้ ac_recieve_hours เมื่อ ac_status เป็น Public และ ac_location_type คือ Onsite หรือ Online
  //     if (
  //       activityData.ac_status === "Public" &&
  //       (activityData.ac_location_type === "Onsite" ||
  //         activityData.ac_location_type === "Online") &&
  //       activityData.ac_start_time &&
  //       activityData.ac_end_time
  //     ) {
  //       const startTime = dayjs(activityData.ac_start_time);
  //       const endTime = dayjs(activityData.ac_end_time);

  //       activityData.ac_recieve_hours = endTime.hour() - startTime.hour();

  //       console.log(
  //         "✅ คำนวณ ac_recieve_hours:",
  //         activityData.ac_recieve_hours
  //       );
  //     }

  //     // กำหนด วันเปิดลงทะเบียนเมื่อ ac_status เป็น Public และส่ง Email แจ้งเตือนไปหานิสิต
  //     if (activityData.ac_status === "Public") {
  //       //บันทึกวันที่เริ่มลงทะเบียน
  //       activityData.ac_start_register = new Date();

  //       // ส่งเมลไปหานิสิตที่มีสถานะความเสี่ยงเป็น risk
  //       sendMailCreateActivity(
  //         "65160169@go.buu.ac.th",
  //         "createActivity",
  //         "ทดสอบส่งอีเมล"
  //       );

  //       console.log("send email success!");
  //     }

  //     // ✅ สร้างกิจกรรมใหม่
  //     const convertToDate = (value: any) =>
  //       typeof value === "string" ? new Date(value) : value;

  //     const newActivity = await this.activityDao.createActivityDao({
  //       ...activityData,
  //       assessment: selectedAssessment,
  //       ac_create_date: new Date(),
  //       ac_last_update: new Date(),
  //     });

  //     logger.info("✅ Activity created successfully", { newActivity });

  //     return newActivity;
  //   } catch (error) {
  //     logger.error("❌ Error in createActivityService(Admin)", error);
  //     throw error;
  //   }
  // }

  // ✅ อัปเดตกิจกรรม
  
}
