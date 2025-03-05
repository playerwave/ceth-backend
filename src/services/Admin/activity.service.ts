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
    ); // ✅ Log ข้อมูลที่เข้ามา

    try {
      let selectedAssessment: Assessment | null = null;
      if (activityData.assessment_id) {
        // ✅ ตรวจสอบว่ามี assessment_id ไหม
        console.log("Fetching assessment with ID:", activityData.assessment_id);
        selectedAssessment = await this.assessmentDao.getAssessmentById(
          activityData.assessment_id
        );
        console.log("Fetched assessment:", selectedAssessment);
      } else {
        console.log("No assessment_id provided.");
      }

      sendMailCreateActivity(
        "65160169@go.buu.ac.th",
        "Test send Mail",
        "สวัสดีครับ"
      );

      return await this.activityDao.createActivityDao({
        ...activityData,
        assessments: selectedAssessment ? [selectedAssessment] : [], // ✅ บันทึก Assessment ถ้ามี
        ac_create_date: new Date(),
        ac_last_update: new Date(),
      });
    } catch (error) {
      throw Error("Error in createActivityService: " + error);
    }
  }

  async updateActivityService(
    activityId: number,
    activityData: Partial<Activity> & { assessment_id?: number }
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

      let selectedAssessment: Assessment | null = null;
      if (activityData.assessment_id) {
        console.log("Fetching assessment with ID:", activityData.assessment_id);
        selectedAssessment = await this.assessmentDao.getAssessmentById(
          activityData.assessment_id
        );
        if (!selectedAssessment) {
          console.error(
            `❌ Assessment with ID ${activityData.assessment_id} not found.`
          );
          throw new Error("Assessment not found.");
        }
      }

      return await this.activityDao.updateActivityDao(activityId, {
        ...activityData,
        assessments: selectedAssessment
          ? [selectedAssessment]
          : existingActivity.assessments,
        ac_last_update: new Date(),
      });
    } catch (error) {
      throw new Error("Error in updateActivityService: " + error);
    }
  }
}
