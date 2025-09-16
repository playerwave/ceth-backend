import { Request, Response } from "express";
import { ActivityReportService } from "../../services/Teacher/activity-report.service";
import { ErrorHandledController } from "../error.handled.controller";

export class ActivityReportController extends ErrorHandledController {
  private activityReportService = new ActivityReportService();

  /**
   * ดึงข้อมูลจำนวนนิสิตที่ลงทะเบียนแยกตามสาขาและชั้นปี
   */
  public getEnrollmentByDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔍 [ActivityReportController] Getting enrollment by department for activity:", activityId);
      
      const result = await this.activityReportService.getEnrollmentByDepartmentService(activityId);
      
      console.log("✅ [ActivityReportController] Enrollment data retrieved:", {
        activityId,
        totalStudents: result.totalStudents,
        departments: result.departments.length
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [ActivityReportController] Error getting enrollment by department:", error);
      this.handleError("ActivityReportController.getEnrollmentByDepartment", error, res);
    }
  };

  /**
   * ดึงข้อมูลสถานะการเข้าร่วมกิจกรรมและสถานะนิสิต
   */
  public getParticipationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔍 [ActivityReportController] Getting participation status for activity:", activityId);
      
      const result = await this.activityReportService.getParticipationStatusService(activityId);
      
      console.log("✅ [ActivityReportController] Participation status retrieved:", {
        activityId,
        totalRegistered: result.totalRegistered,
        fullTimeAttendance: result.fullTimeAttendance,
        partTimeAttendance: result.partTimeAttendance,
        noParticipation: result.noParticipation
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [ActivityReportController] Error getting participation status:", error);
      this.handleError("ActivityReportController.getParticipationStatus", error, res);
    }
  };

  /**
   * ดึงข้อมูลแบบประเมินและผลการตอบ
   */
  public getAssessmentData = async (req: Request, res: Response): Promise<void> => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔍 [ActivityReportController] Getting assessment data for activity:", activityId);
      
      const result = await this.activityReportService.getAssessmentDataService(activityId);
      
      console.log("✅ [ActivityReportController] Assessment data retrieved:", {
        activityId,
        topics: result.length
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [ActivityReportController] Error getting assessment data:", error);
      this.handleError("ActivityReportController.getAssessmentData", error, res);
    }
  };

  /**
   * ดึงข้อมูลแบบประเมินความพึงพอใจ
   */
  public getSatisfactionSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔍 [ActivityReportController] Getting satisfaction survey for activity:", activityId);
      
      const result = await this.activityReportService.getSatisfactionSurveyService(activityId);
      
      console.log("✅ [ActivityReportController] Satisfaction survey retrieved:", {
        activityId,
        totalRespondents: result.totalRespondents,
        pieData: result.pieData.length
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [ActivityReportController] Error getting satisfaction survey:", error);
      this.handleError("ActivityReportController.getSatisfactionSurvey", error, res);
    }
  };

  /**
   * ดึงข้อมูลสถานะการทำแบบประเมินของนิสิต
   */
  public getStudentAssessmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔍 [ActivityReportController] Getting student assessment status for activity:", activityId);
      
      const result = await this.activityReportService.getStudentAssessmentStatusService(activityId);
      
      console.log("✅ [ActivityReportController] Student assessment status retrieved:", {
        activityId,
        totalStudents: result.totalStudents,
        completedAssessments: result.completedAssessments,
        pendingAssessments: result.pendingAssessments
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [ActivityReportController] Error getting student assessment status:", error);
      this.handleError("ActivityReportController.getStudentAssessmentStatus", error, res);
    }
  };
}
