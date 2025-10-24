// src/controllers/Student/activity.controller.ts
import { Request, Response } from "express";
import { ActivityService } from "../../services/Student/activity.service";
import { ErrorHandledController } from "../error.handled.controller";

export class ActivityController extends ErrorHandledController {
  constructor(private readonly activityService: ActivityService) {
    super();
  }

  public async getStudentActivities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = this.parseId(req.params.id);
      const result = await this.activityService.getStudentActivitiesService(
        userId
      );

      console.log(
        `📊 Returning ${result.length} activities for student ${userId}`
      );
      res.status(200).json(result);
    } catch (error) {
      this.handleError(
        "StudentActivityController.getStudentActivities",
        error,
        res
      );
    }
  }

  public async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.parseOptionalInt(req.query.userId);
      const id = this.parseId(req.params.id);

      const activity = await this.activityService.getActivityByIdService(
        id,
        userId
      );
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      this.handleError("StudentActivityController.getActivityById", error, res);
    }
  }

  public async getAssessmentByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      
      console.log(`🔍 [StudentController] Getting assessment for activity: ${activityId}`);
      
      const assessment = await this.activityService.getAssessmentByActivityId(activityId);
      
      if (!assessment) {
        res.status(404).json({ error: "Assessment not found for this activity" });
        return;
      }

      console.log(`✅ [StudentController] Found assessment: ${assessment.assessment_name}`);
      res.status(200).json(assessment);
    } catch (error) {
      this.handleError("StudentActivityController.getAssessmentByActivityId", error, res);
    }
  }

  public async getJoinIdByStudentAndActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const studentId = this.parseId(req.params.studentId);
      
      console.log(`🔍 [StudentController] Getting join_id for activity: ${activityId}, student: ${studentId}`);
      
      const joinId = await this.activityService.getJoinIdByStudentAndActivityService(activityId, studentId);
      
      if (!joinId) {
        res.status(404).json({ error: "Student not enrolled in this activity" });
        return;
      }
      
      console.log(`✅ [StudentController] Join ID found: ${joinId}`);
      res.status(200).json({ join_id: joinId });
    } catch (error) {
      this.handleError("StudentActivityController.getJoinIdByStudentAndActivity", error, res);
    }
  }

  public async getActivityHistoryByStudentsID(req: Request, res: Response): Promise<void> {
    try {
      const studentId = this.parseId(req.params.studentId);
      const activities = await this.activityService.getActivityHistoryByStudentsID(studentId);
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getActivityHistoryByStudentsID", error, res);
    }
  }

  public async debugActivityData(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      
      console.log(`🔍 [StudentController] Debug activity data for: ${activityId}`);
      
      const debugData = await this.activityService.debugActivityData(activityId);
      
      res.status(200).json(debugData);
    } catch (error) {
      this.handleError("StudentActivityController.debugActivityData", error, res);
    }
  }

  // ✅ เมธอดใหม่: เช็คสถานะการทำแบบประเมิน
  public async checkAssessmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const studentId = this.parseId(req.params.studentId);
      
      console.log(`🔍 [StudentController] Checking assessment status for activity: ${activityId}, student: ${studentId}`);
      
      const status = await this.activityService.checkAssessmentStatusService(activityId, studentId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      this.handleError("StudentActivityController.checkAssessmentStatus", error, res);
    }
  }

  public async getSearch(req: Request, res: Response): Promise<void> {
    const studentId = this.parseId(req.params.studentId);
    const text = (req.query.text as string);
    try {
      const activities = await this.activityService.getSearch(studentId, text)
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getSearch", error, res);
    }
  }

  public async enrollActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const studentId = this.parseId(req.params.studentId);
      const food = this.parseFoodInput(req.body.food);

      const result = await this.activityService.studentEnrollActivityService(
        studentId,
        activityId,
        food
      );

      res
        .status(200)
        .json({ message: "Registration successful", activity: result });
    } catch (error) {
      this.handleError("StudentActivityController.enrollActivity", error, res);
    }
  }

  public async getEnrolledActivities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const studentId = this.parseId(req.params.id);
      const result = await this.activityService.getEnrolledActivitiesService(
        studentId
      );
      res.status(200).header("Cache-Control", "no-store").json(result);
    } catch (error) {
      this.handleError(
        "StudentActivityController.getEnrolledActivities",
        error,
        res
      );
    }
  }

  public async getOngoingActivities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const studentId = this.parseId(req.params.id);
      const result = await this.activityService.getOngoingActivitiesService(
        studentId
      );
      res.status(200).header("Cache-Control", "no-store").json(result);
    } catch (error) {
      this.handleError(
        "StudentActivityController.getOngoingActivities",
        error,
        res
      );
    }
  }

  public async searchActivity(req: Request, res: Response): Promise<void> {
    try {
      const { ac_name } = req.query;
      if (!ac_name || typeof ac_name !== "string") {
        res
          .status(400)
          .json({ error: "Missing or invalid 'ac_name' parameter" });
        return;
      }

      const result = await this.activityService.searchActivityService(ac_name);
      if (result.length === 0) {
        res.status(404).json({ message: "No activities found" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentActivityController.searchActivity", error, res);
    }
  }

  public async unEnrollActivity(req: Request, res: Response): Promise<void> {
    try {
      const studentId = this.parseId(req.params.id);
      const activityId = this.parseId(req.query.activityId as string);

      const success = await this.activityService.unEnrollActivityService(
        studentId,
        activityId
      );
      if (success) {
        res
          .status(200)
          .json({ message: "Successfully unenrolled from activity" });
      } else {
        res.status(404).json({ error: "Activity registration not found" });
      }
    } catch (error) {
      this.handleError(
        "StudentActivityController.unEnrollActivity",
        error,
        res
      );
    }
  }

  // เพิ่มเมธอดสำหรับรีเซ็ต registered_count ทั้งหมด
  public async resetRegisteredCounts(req: Request, res: Response): Promise<void> {
    try {
      await this.activityService.resetAllRegisteredCountsService();
      res.status(200).json({
        message: "Successfully reset all registered counts",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(
        "StudentActivityController.resetRegisteredCounts",
        error,
        res
      );
    }
  }

  // ✅ เมธอดใหม่: Check-in/Check-out Activity
  public async checkInOutActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: "กรุณากรอกรหัสนิสิตและรหัสผ่าน"
        });
        return;
      }

      const result = await this.activityService.checkInOutActivityService(
        activityId,
        username,
        password
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentActivityController.checkInOutActivity", error, res);
    }
  }

  // ✅ เมธอดใหม่: ดึงกิจกรรม Course ที่พร้อมส่ง Certificate
  public async getAvailableCourseActivities(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔍 [StudentController] Getting available course activities for certificate submission");
      
      const activities = await this.activityService.getAvailableCourseActivitiesService();
      
      console.log(`✅ [StudentController] Found ${activities.length} available course activities`);
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("StudentActivityController.getAvailableCourseActivities", error, res);
    }
  }

  // 🔧 Utility Parsing Methods
  private parseId(value: any): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseOptionalInt(value: any): number | null {
    return !isNaN(Number(value)) ? parseInt(value, 10) : null;
  }

  private parseFoodInput(input: any): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return [input];
      }
    }
    return [];
  }
}

const activityService = new ActivityService();
const controller = new ActivityController(activityService);

export const activityController = {
  getStudentActivities: controller.getStudentActivities.bind(controller),
  getActivityById: controller.getActivityById.bind(controller),
  getAssessmentByActivityId: controller.getAssessmentByActivityId.bind(controller),
  getJoinIdByStudentAndActivity: controller.getJoinIdByStudentAndActivity.bind(controller),
  getActivityHistoryByStudentsID: controller.getActivityHistoryByStudentsID.bind(controller),
  getSearch: controller.getSearch.bind(controller),
  enrollActivity: controller.enrollActivity.bind(controller),
  getEnrolledActivities: controller.getEnrolledActivities.bind(controller),
  getOngoingActivities: controller.getOngoingActivities.bind(controller),
  searchActivity: controller.searchActivity.bind(controller),
  unEnrollActivity: controller.unEnrollActivity.bind(controller),
  resetRegisteredCounts: controller.resetRegisteredCounts.bind(controller),
  checkInOutActivity: controller.checkInOutActivity.bind(controller),
  debugActivityData: controller.debugActivityData.bind(controller),
  checkAssessmentStatus: controller.checkAssessmentStatus.bind(controller),
  getAvailableCourseActivities: controller.getAvailableCourseActivities.bind(controller),
};
