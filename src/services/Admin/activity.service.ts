import { Activity } from "../../entity/Activity";
import { Assessment } from "../../entity/Assesment";
import { ActivityDao } from "../../daos/Admin/activity.dao";
import { AssessmentDao } from "../../daos/Admin/assesment.dao";
import { sendMailCreateActivity } from "../../mailer/email";

export class ActivityService {
  private activityDao = new ActivityDao();
  private assessmentDao = new AssessmentDao(); // ✅ ดึง AssessmentDao มาใช้

  async createActivityService(
    activityData: Partial<Activity> & { assessment_id?: number }
  ): Promise<Activity> {
    console.log(
      "Received activityData in createActivityService:",
      activityData
    );

    let selectedAssessment: Assessment | null = null; // ✅ กำหนดค่าเริ่มต้นเป็น `null`
    if (activityData.assessment_id) {
      console.log("Fetching assessment with ID:", activityData.assessment_id);
      selectedAssessment =
        (await this.assessmentDao.getAssessmentById(
          activityData.assessment_id
        )) ?? null; // ✅ ใช้ `?? null` เพื่อกัน `undefined`
    }

    return await this.activityDao.createActivityDao({
      ...activityData,
      assessment: selectedAssessment, // ✅ กำหนดค่า `null` ถ้าไม่มี assessment
      ac_create_date: new Date(),
      ac_last_update: new Date(),
    });
  }

  async updateActivityService(
    activityId: number,
    activityData: Partial<Activity>
  ): Promise<Activity | null> {
    console.log(
      "Received activityData in updateActivityService:",
      activityData
    );

    try {
      const existingActivity = await this.activityDao.getActivityByIdDao(
        activityId
      );
      if (!existingActivity) {
        console.log("❌ Activity not found with ID:", activityId);
        return null;
      }

      if (activityData.ac_image_data) {
        console.log("📸 New image detected, updating image...");
      }

      // ✅ อัปเดต Activity
      const updatedActivity = await this.activityDao.updateActivityDao(
        activityId,
        {
          ...activityData,
          ac_last_update: new Date(),
        }
      );

      console.log(`✅ Activity with ID ${activityId} updated successfully.`);
      return updatedActivity;
    } catch (error) {
      console.error("❌ Error in updateActivityService:", error);
      throw new Error("Error in updateActivityService: " + error);
    }
  }

  async deleteActivityService(activityId: number): Promise<void> {
    console.log("Received request to delete activity with ID:", activityId);

    const existingActivity = await this.activityDao.getActivityByIdDao(
      activityId
    );
    if (!existingActivity) {
      console.error(`❌ Activity with ID ${activityId} not found.`);
      throw new Error(`Activity with ID ${activityId} not found`);
    }

    console.log("✅ Activity found, proceeding to delete.");
    await this.activityDao.deleteActivityDao(activityId);
  }

  async getAllActivitiesService(): Promise<Activity[]> {
    return await this.activityDao.getAllActivities();
  }

  async getActivityByIdService(id: number): Promise<Activity | null> {
    return await this.activityDao.getActivityById(id);
  }

  async searchActivity(ac_name: string): Promise<Activity[]> {
    return await this.activityDao.searchActivity(ac_name);
  }

  async adjustStatusActivity(
    ac_id: number,
    ac_status: string
  ): Promise<Activity | null> {
    return await this.activityDao.adjustStatusActivity(ac_id, ac_status);
  }
}
