import { Request, Response } from "express";
import { AssessmentService } from "../../services/Student/assessment.service";
import { AssessmentDao } from "../../daos/Student/assessment.dao";
import { ErrorHandledController } from "../error.handled.controller";

export class AssessmentController extends ErrorHandledController {
  private assessmentService = new AssessmentService();
  private assessmentDao = new AssessmentDao();

  /**
   * ส่งคำตอบ assessment
   * POST /api/student/assessment/submit
   */
  public submitAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assessment_id, answers } = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!assessment_id || !answers) {
        res.status(400).json({
          error: "Missing required fields: assessment_id and answers"
        });
        return;
      }

      // ตรวจสอบ join_id จาก session หรือ token
      const join_id = req.body.join_id;
      if (!join_id) {
        res.status(401).json({
          error: "User not authenticated or join_id not found"
        });
        return;
      }

      console.log("📤 [AssessmentController] Submit assessment request:", {
        assessment_id,
        join_id,
        answers: Object.keys(answers)
      });

      const result = await this.assessmentService.submitAssessment(
        assessment_id,
        join_id,
        answers
      );

      // ✅ Clear activity cache หลังจาก submit assessment
      try {
        const studentId = await this.assessmentService.getStudentIdFromUserId((req.user as any)?.id);
        if (studentId) {
          await this.assessmentService.clearActivityCache(studentId);
          console.log("🗑️ [AssessmentController] Activity cache cleared for student:", studentId);
        }
      } catch (cacheError) {
        console.error("❌ [AssessmentController] Error clearing cache:", cacheError);
        // ✅ ไม่ return error เพราะ assessment ยังถูก submit แล้ว
      }

      res.status(200).json({
        success: true,
        message: "Assessment submitted successfully",
        data: result
      });
    } catch (error) {
      console.error("❌ [AssessmentController] Error submitting assessment:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * ดึงข้อมูล assessment ตาม ID
   * GET /api/student/assessment/:assessmentId
   */
  public getAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId) {
        res.status(400).json({
          error: "Assessment ID is required"
        });
        return;
      }

      const assessment = await this.assessmentService.getAssessment(parseInt(assessmentId));
      
      if (!assessment) {
        res.status(404).json({
          error: "Assessment not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Assessment retrieved successfully",
        data: assessment
      });
    } catch (error) {
      console.error("❌ [AssessmentController] Error getting assessment:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * ดึงข้อมูล assessment ตาม activity ID
   * GET /api/student/activity/:activityId/assessment
   */
  public getAssessmentByActivityId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { activityId } = req.params;
      
      if (!activityId) {
        res.status(400).json({
          error: "Activity ID is required"
        });
        return;
      }

      const assessment = await this.assessmentService.getAssessmentByActivityId(parseInt(activityId));
      
      if (!assessment) {
        res.status(404).json({
          error: "Assessment not found for this activity"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Assessment retrieved successfully",
        data: assessment
      });
    } catch (error) {
      console.error("❌ [AssessmentController] Error getting assessment by activity ID:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * Debug: ตรวจสอบข้อมูลกิจกรรมจาก join_id
   * GET /api/student/assessment/debug-activity/:join_id
   */
  public debugActivityInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { join_id } = req.params;
      
      if (!join_id) {
        res.status(400).json({
          error: "Missing join_id parameter"
        });
        return;
      }

      const activityInfo = await this.assessmentDao.getActivityInfoByJoinId(parseInt(join_id));
      
      res.status(200).json({
        success: true,
        data: {
          join_id: parseInt(join_id),
          activity_info: activityInfo
        }
      });
    } catch (error) {
      console.error("❌ [AssessmentController] Error in debugActivityInfo:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}
