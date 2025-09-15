import { AssessmentDao } from "../../daos/Student/assessment.dao";
import { ErrorHandledService } from "../error.handdled.service";

export class AssessmentService extends ErrorHandledService {
  private assessmentDao = new AssessmentDao();

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
