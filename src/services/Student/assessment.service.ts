import { AssessmentDao } from "../../daos/Student/assessment.dao";
import { StudentsService } from "./student.service";
import { ErrorHandledService } from "../error.handdled.service";

export class AssessmentService extends ErrorHandledService {
  private assessmentDao = new AssessmentDao();
  private studentsService = new StudentsService();

  /**
   * ส่งคำตอบ assessment
   * @param assessment_id - ID ของ assessment
   * @param join_id - ID ของ join (student enrollment)
   * @param answers - คำตอบทั้งหมด
   */
  public async submitAssessment(
    assessment_id: number,
    join_id: number,
    answers: {
      satisfaction: { [questionId: number]: string };
      multiple_choice: { [questionId: number]: string[] };
      single_choice: { [questionId: number]: string };
      open_ended: { [questionId: number]: string };
    }
  ): Promise<any> {
    try {
      console.log("🔄 [AssessmentService] Submitting assessment:", {
        assessment_id,
        join_id,
        answersCount: {
          satisfaction: Object.keys(answers.satisfaction).length,
          multiple_choice: Object.keys(answers.multiple_choice).length,
          single_choice: Object.keys(answers.single_choice).length,
          open_ended: Object.keys(answers.open_ended).length,
        }
      });

      // ตรวจสอบว่า assessment มีอยู่จริงหรือไม่
      const assessment = await this.assessmentDao.getAssessmentById(assessment_id);
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // ตรวจสอบว่า student ได้ลงทะเบียนใน activity นี้หรือไม่
      const join = await this.assessmentDao.getJoinById(join_id);
      if (!join) {
        throw new Error("Student enrollment not found");
      }

      // ตรวจสอบว่าได้ส่งคำตอบไปแล้วหรือยัง
      const existingAnswers = await this.assessmentDao.getAnswersByJoinAndAssessment(join_id, assessment_id);
      if (existingAnswers.length > 0) {
        console.log(`🔄 Found ${existingAnswers.length} existing answers, deleting them first...`);
        await this.assessmentDao.deleteAnswersByJoinAndAssessment(join_id, assessment_id);
        console.log(`✅ Deleted existing answers, proceeding with new submission`);
      }

      // ส่งคำตอบไปยัง DAO
      const result = await this.assessmentDao.submitAssessment(assessment_id, join_id, answers);

      // อัพเดท join_status เป็น 'Completed' หลังจากส่งแบบประเมินสำเร็จ
      try {
        console.log("🔄 [AssessmentService] Updating join status to Completed");
        await this.assessmentDao.updateJoinStatusToCompleted(join_id);
        console.log("✅ [AssessmentService] Join status updated to Completed");
      } catch (statusError) {
        console.error("❌ [AssessmentService] Error updating join status:", statusError);
        // ไม่ให้ error นี้ทำให้การส่งแบบประเมินล้มเหลว
      }

      // อัพเดทชั่วโมงสหกิจหลังจากส่งแบบประเมินสำเร็จ
      try {
        console.log("🔄 [AssessmentService] Updating cooperative hours after assessment submission");
        console.log("🔍 [AssessmentService] Debug info:", {
          assessment_id,
          join_id,
          result: result
        });
        
        // ดึงข้อมูลกิจกรรมจาก join_id
        const activityInfo = await this.assessmentDao.getActivityInfoByJoinId(join_id);
        
        console.log("🔍 [AssessmentService] Activity info result:", activityInfo);
        
        if (activityInfo) {
          console.log("🔍 [AssessmentService] Activity info details:", {
            activity_type: activityInfo.activity_type,
            recieve_hours: activityInfo.recieve_hours,
            students_id: activityInfo.students_id,
            recieve_hours_type: typeof activityInfo.recieve_hours,
            recieve_hours_greater_than_zero: activityInfo.recieve_hours > 0
          });
          
          if (activityInfo.recieve_hours > 0) {
            console.log("🔄 [AssessmentService] Found activity info for hours update:", {
              students_id: activityInfo.students_id,
              activity_type: activityInfo.activity_type,
              recieve_hours: activityInfo.recieve_hours
            });
            
            // อัพเดทชั่วโมงสหกิจ
            const hoursUpdated = await this.studentsService.updateStudentCooperativeHours(
              activityInfo.students_id,
              activityInfo.activity_type,
              activityInfo.recieve_hours
            );
            
            if (hoursUpdated) {
              console.log("✅ [AssessmentService] Cooperative hours updated successfully");
            } else {
              console.log("⚠️ [AssessmentService] Failed to update cooperative hours");
            }
          } else {
            console.log("ℹ️ [AssessmentService] recieve_hours is 0 or null, skipping hours update");
          }
        } else {
          console.log("❌ [AssessmentService] No activity info found for join_id:", join_id);
        }
      } catch (hoursError) {
        // ไม่ให้ error ของการอัพเดทชั่วโมงทำให้การส่งแบบประเมินล้มเหลว
        console.error("❌ [AssessmentService] Error updating cooperative hours (non-critical):", hoursError);
      }

      this.logInfo("✅ Assessment submitted successfully", {
        assessment_id,
        join_id,
        answersSubmitted: result.answersCount
      });

      return result;
    } catch (error) {
      this.logError("❌ Error submitting assessment", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล assessment ตาม ID
   * @param assessment_id - ID ของ assessment
   */
  public async getAssessment(assessment_id: number): Promise<any> {
    try {
      console.log("🔄 [AssessmentService] Getting assessment:", assessment_id);

      const assessment = await this.assessmentDao.getAssessmentWithQuestions(assessment_id);
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      this.logInfo("✅ Assessment retrieved successfully", {
        assessment_id,
        questionsCount: assessment.questions?.length || 0
      });

      return assessment;
    } catch (error) {
      this.logError("❌ Error getting assessment", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล assessment ตาม activity ID
   * @param activity_id - ID ของ activity
   */
  public async getAssessmentByActivityId(activity_id: number): Promise<any> {
    try {
      console.log("🔄 [AssessmentService] Getting assessment by activity ID:", activity_id);

      const assessment = await this.assessmentDao.getAssessmentByActivityId(activity_id);
      
      if (!assessment) {
        throw new Error("Assessment not found for this activity");
      }

      this.logInfo("✅ Assessment retrieved by activity ID successfully", {
        activity_id,
        assessment_id: assessment.assessment_id,
        questionsCount: assessment.questions?.length || 0
      });

      return assessment;
    } catch (error) {
      this.logError("❌ Error getting assessment by activity ID", error);
      throw error;
    }
  }
}
