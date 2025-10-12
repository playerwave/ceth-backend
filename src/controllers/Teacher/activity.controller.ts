// src/controllers/Admin/activity.controller.ts
import { Request, Response } from "express";
import { ActivityService } from "../../services/Teacher/activity.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";
import { subtract7Hours } from "../../utils/timeUtils";

export class ActivityController extends ErrorHandledController {
  constructor(private readonly activityService: ActivityService) {
    super();
  }

  private sanitize(input: any): string {
    return xss(input);
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseActivityPayload(req.body);

      // ✅ รองรับ selectedFoods หรือ foodIds
      const foodIds: number[] =
        req.body.selectedFoods || req.body.foodIds || [];

      const result = await this.activityService.createActivity({
        ...data,
        foodIds, // ✅ ส่งต่อชื่อเดียวกันไป service
      });

      res.status(201).json(result);
    } catch (error) {
      this.handleError("ActivityController.create", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activityService.getAllActivities();
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getAll", error, res);
    }
  }

  public async getSearch(req: Request, res: Response): Promise<void> {
    const text = (req.query.text as string);
    try {
      const activities = await this.activityService.getSearch(text)
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getSearch", error, res);
    }
  }

  public async getActivityByHistory(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activityService.getActivityByHistory();
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getActivityByHistory", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const data = this.parseUpdatePayload(req.body);

      // ✅ เพิ่ม foodIds เข้าไปใน data
      const foodIds: number[] =
        req.body.selectedFoods || req.body.foodIds || [];
      const dataWithFoods = {
        ...data,
        foodIds,
      };

      console.log("Data in controller: ", data);
      console.log("🍽️ Food IDs from request:", foodIds);
      console.log("🍽️ Data with foods:", dataWithFoods);

      const result = await this.activityService.updateActivity(
        id,
        dataWithFoods
      );

      if (!result) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }

      res.status(200).json({
        message: "Activity updated successfully",
        data: result,
      });
    } catch (error) {
      this.handleError("ActivityController.update", error, res);
    }
  }

  public async updateActivityByStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    const { activity_id } = req.params;
    const { activity_status } = req.body;
    console.log(activity_id);
    const activityIDSanitize = parseInt(this.sanitize(activity_id));
    const activityStatusSanitize = this.sanitize(activity_status);
    try {
      const updated = await this.activityService.updateActivityByStatus(
        activityIDSanitize,
        activityStatusSanitize
      );
      if (updated) {
        res.status(200).json({ message: "เปลี่ยนสถานะสำเร็จ" });
      } else {
        res.status(404).json({ message: "เกิดข้อผิดพลาดในการแก้ไข" });
      }
    } catch (error) {
      this.handleError("ActivityController.updateActivityByStatus", error, res);
    }
  }

  public async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const activity = await this.activityService.getActivityById(id);

      if (!activity) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      this.handleError("ActivityController.getActivity", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const forceDelete = req.query.force === "true"; // ตรวจสอบว่าต้อง hard delete หรือไม่

      let result;
      if (forceDelete) {
        result = await this.activityService.hardDeleteActivity(id);
      } else {
        result = await this.activityService.softDeleteActivity(id);
      }

      if (!result) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }

      res.status(200).json({
        message: forceDelete
          ? "Activity hard deleted successfully"
          : "Activity soft deleted successfully",
      });
    } catch (error) {
      this.handleError("ActivityController.delete", error, res);
    }
  }

  // ✅ เพิ่ม search method
  public async search(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.query;
      if (!name || typeof name !== "string") {
        res.status(400).json({ message: "Search term 'name' is required" });
        return;
      }

      const activities = await this.activityService.searchActivities(name);
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.search", error, res);
    }
  }

  private parseId(value: string): number {
    // ✅ เพิ่ม debug log
    console.log(`🔍 parseId: Received value: "${value}", type: ${typeof value}`);
    
    // ✅ ตรวจสอบว่าเป็น string ที่มีตัวอักษรที่ไม่ใช่ตัวเลขหรือไม่
    if (typeof value !== 'string' || value.trim() === '') {
      console.error(`❌ parseId: Invalid value type or empty: ${value}`);
      throw new Error("Invalid ID format: Value must be a non-empty string");
    }
    
    // ✅ ลบ whitespace และตรวจสอบว่าเป็นตัวเลขทั้งหมด
    const cleanValue = value.trim();
    if (!/^\d+$/.test(cleanValue)) {
      console.error(`❌ parseId: Value contains non-numeric characters: "${cleanValue}"`);
      throw new Error(`Invalid ID format: "${cleanValue}" is not a valid number`);
    }
    
    const id = parseInt(cleanValue, 10);
    if (isNaN(id)) {
      console.error(`❌ parseId: parseInt failed for value: "${cleanValue}"`);
      throw new Error("Invalid ID format: Failed to parse number");
    }
    
    console.log(`✅ parseId: Successfully parsed ID: ${id}`);
    return id;
  }

  private parseActivityPayload(body: any): any {
    return {
      activity_name: body.activity_name || "ไม่ระบุ",
      presenter_company_name: body.presenter_company_name || "ไม่ระบุ",
      type: body.type || "Soft", // ENUM('Soft', 'Hard')
      description: body.description || "ไม่ระบุ",
      seat: this.parseOptionalInt(body.seat) ?? 0, // ✅ ใช้ 0 แทน null
      recieve_hours: this.parseOptionalInt(body.recieve_hours) ?? 0, // ✅ ใช้ 0 แทน null
      event_format: body.event_format || "Online", // ENUM
      create_activity_date: body.create_activity_date || new Date(),
      // ✅ แปลง Local Time เป็น UTC ก่อนเก็บใน database
      special_start_register_date: this.parseDate(body.special_start_register_date),
      start_register_date: this.parseDate(body.start_register_date),
      end_register_date: this.parseDate(body.end_register_date),
      start_activity_date: this.parseDate(body.start_activity_date),
      end_activity_date: this.parseDate(body.end_activity_date),
      start_assessment: this.parseDate(body.start_assessment),
      end_assessment: this.parseDate(body.end_assessment),
      image_url: body.image_url || "ไม่ระบุ",
      activity_status: body.activity_status || "Private", // ENUM
      activity_state: body.activity_state || "Not Start", // ENUM
      status: body.status || "Active", // ENUM default
      last_update_activity_date: new Date(),
      url: body.url || "ไม่ระบุ",
      assessment_id: this.parseOptionalInt(body.assessment_id, null),
      room_id: this.parseOptionalInt(body.room_id, null),
    };
  }

  // ✅ เพิ่ม method สำหรับ update activity ที่ไม่มีการเรียก subtract7Hours
  private parseUpdatePayload(body: any): any {
    return {
      activity_name: body.activity_name || "ไม่ระบุ",
      presenter_company_name: body.presenter_company_name || "ไม่ระบุ",
      type: body.type || "Soft", // ENUM('Soft', 'Hard')
      description: body.description || "ไม่ระบุ",
      seat: this.parseOptionalInt(body.seat) ?? 0, // ✅ ใช้ 0 แทน null
      recieve_hours: this.parseOptionalInt(body.recieve_hours) ?? 0, // ✅ ใช้ 0 แทน null
      event_format: body.event_format || "Online", // ENUM
      create_activity_date: body.create_activity_date || new Date(),
      // ✅ แปลง Local Time เป็น UTC ก่อนเก็บใน database
      special_start_register_date: this.parseDate(body.special_start_register_date),
      start_register_date: this.parseDate(body.start_register_date),
      end_register_date: this.parseDate(body.end_register_date),
      start_activity_date: this.parseDate(body.start_activity_date),
      end_activity_date: this.parseDate(body.end_activity_date),
      start_assessment: this.parseDate(body.start_assessment),
      end_assessment: this.parseDate(body.end_assessment),
      image_url: body.image_url || "ไม่ระบุ",
      activity_status: body.activity_status || "Private", // ENUM
      activity_state: body.activity_state || "Not Start", // ENUM
      status: body.status || "Active", // ENUM default
      last_update_activity_date: new Date(),
      url: body.url || "ไม่ระบุ",
      assessment_id: this.parseOptionalInt(body.assessment_id, null),
      room_id: this.parseOptionalInt(body.room_id, null),
    };
  }

  private parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    try {
      console.log(`🔍 Parsing date: ${dateString}`);

      // ✅ แปลง Local Time จาก Frontend เป็น UTC เพื่อเก็บใน Database
      if (dateString.includes("Z") || dateString.includes("+")) {
        // เป็น UTC format อยู่แล้ว ใช้ตรงๆ
        const date = new Date(dateString);
        console.log(`📅 UTC format detected, using as is: ${date.toISOString()}`);
        return date;
      } else {
        // เป็น Local Time format ต้องแปลงเป็น UTC
        const cleanDateString = dateString.replace('T', ' ').split('.')[0];
        const parts = cleanDateString.split(" ");
        
        if (parts.length !== 2) {
          console.error("❌ Invalid date format:", dateString);
          return null;
        }

        const [datePart, timePart] = parts;
        const [year, month, day] = datePart.split("-");
        const [hours, minutes, seconds] = timePart.split(":");

        // สร้าง Date object ใน Local Time แล้วลบ 7 ชั่วโมงเพื่อแปลงเป็น UTC
        const localDate = new Date();
        localDate.setFullYear(parseInt(year));
        localDate.setMonth(parseInt(month) - 1);
        localDate.setDate(parseInt(day));
        localDate.setHours(parseInt(hours));
        localDate.setMinutes(parseInt(minutes));
        localDate.setSeconds(parseInt(seconds || "0"));
        localDate.setMilliseconds(0);

        // แปลงเป็น UTC (-7 ชั่วโมง)
        const utcDate = new Date(localDate.getTime() - (7 * 60 * 60 * 1000));
        
        console.log(`📅 Local format detected: ${dateString}`);
        console.log(`📅 Local time: ${localDate.toISOString()}`);
        console.log(`📅 Converted to UTC: ${utcDate.toISOString()}`);
        
        return utcDate;
      }
    } catch (error) {
      console.error("❌ Error parsing date:", dateString, error);
      return null;
    }
  }

  private parseOptionalInt(
    value: any,
    fallback: number | null = null
  ): number | null {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : fallback;
  }

  // ✅ เมธอดใหม่: ดึงข้อมูลนักเรียนที่ลงทะเบียน
  public async getEnrolledStudentsForActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const students = await this.activityService.getEnrolledStudentsForActivity(activityId);
      res.status(200).json(students);
    } catch (error) {
      this.handleError("ActivityController.getEnrolledStudentsForActivity", error, res);
    }
  }

  // ✅ ActivityDetail Controller Methods
  public async getAllActivityDetails(req: Request, res: Response): Promise<void> {
    try {
      const activityDetails = await this.activityService.getAllActivityDetails();
      res.status(200).json(activityDetails);
    } catch (error) {
      this.handleError("ActivityController.getAllActivityDetails", error, res);
    }
  }

  public async getActivityDetailById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const activityDetail = await this.activityService.getActivityDetailById(id);
      
      if (!activityDetail) {
        res.status(404).json({ message: "Activity detail not found" });
        return;
      }
      
      res.status(200).json(activityDetail);
    } catch (error) {
      this.handleError("ActivityController.getActivityDetailById", error, res);
    }
  }

  public async updateActivityDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const data = req.body;
      const result = await this.activityService.updateActivityDetail(id, data);
      res.status(200).json(result);
    } catch (error) {
      this.handleError("ActivityController.updateActivityDetail", error, res);
    }
  }

  public async resetActivityDetailsAndJoins(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.activityService.resetActivityDetailsAndJoins(activityId);
      res.status(200).json({
        success: true,
        message: `DELETE ALL completed for activity ${activityId}`,
        data: result
      });
    } catch (error) {
      this.handleError("ActivityController.resetActivityDetailsAndJoins", error, res);
    }
  }

  public async resetStudentTimes(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.activityService.resetStudentTimes(activityId);
      res.status(200).json({
        success: true,
        message: `Reset student times completed for activity ${activityId}`,
        data: result
      });
    } catch (error) {
      this.handleError("ActivityController.resetStudentTimes", error, res);
    }
  }

  public async getActivityDetailsByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const activityDetails = await this.activityService.getActivityDetailsByActivityId(activityId);
      
      res.status(200).json(activityDetails);
    } catch (error) {
      this.handleError("ActivityController.getActivityDetailsByActivityId", error, res);
    }
  }

  // ✅ Function 1: ดูนิสิตที่ลงชื่อเข้าร่วมกิจกรรม (มี time_in)
  public async getStudentsCheckedIn(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const students = await this.activityService.getStudentsCheckedIn(activityId);
      
      res.status(200).json({
        success: true,
        message: `Found ${students.length} students who checked in`,
        data: students,
        count: students.length
      });
    } catch (error) {
      this.handleError("ActivityController.getStudentsCheckedIn", error, res);
    }
  }

  // ✅ Function 2: ดูนิสิตที่ลงชื่อออกกิจกรรม (มี time_out)
  public async getStudentsCheckedOut(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const students = await this.activityService.getStudentsCheckedOut(activityId);
      
      res.status(200).json({
        success: true,
        message: `Found ${students.length} students who checked out`,
        data: students,
        count: students.length
      });
    } catch (error) {
      this.handleError("ActivityController.getStudentsCheckedOut", error, res);
    }
  }

  /**
   * ดึงคำตอบของนักเรียนใน Activity พร้อม JOIN กับ activity_detail, join, answer
   */
  public async getStudentAnswersDetail(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const studentAnswers = await this.activityService.getStudentAnswersDetail(activityId);
      
      // จัดกลุ่มคำตอบตาม username
      const groupedAnswers = this.groupAnswersByUsername(studentAnswers);
      
      res.status(200).json({
        success: true,
        message: `Found answers for ${Object.keys(groupedAnswers).length} students in activity ${activityId}`,
        data: groupedAnswers,
        totalStudents: Object.keys(groupedAnswers).length,
        totalAnswers: studentAnswers.length
      });
    } catch (error) {
      this.handleError("ActivityController.getStudentAnswersDetail", error, res);
    }
  }

  /**
   * จัดกลุ่มคำตอบตาม username
   */
  private groupAnswersByUsername(answers: any[]): any {
    const grouped: any = {};
    
    answers.forEach(answer => {
      const username = answer.username;
      
      if (!grouped[username]) {
        grouped[username] = {
          student_info: {
            students_id: answer.students_id,
            first_name_tha: answer.first_name_tha,
            last_name_tha: answer.last_name_tha,
            username: answer.username,
            department_short_name: answer.department_short_name,
            join_id: answer.join_id,
            join_date: answer.join_date,
            join_status: answer.join_status,
            time_in: answer.time_in,
            time_out: answer.time_out
          },
          answers: []
        };
      }
      
      // เพิ่มคำตอบ
      grouped[username].answers.push({
        answer_id: answer.answer_id,
        answer_text: answer.answer_text,
        question_text: answer.question_text,
        question_type: answer.question_type,
        question_order: answer.question_order,
        set_number_name: answer.set_number_name,
        set_number_order: answer.set_number_order,
        choice_text: answer.choice_text,
        choice_id: answer.choice_id,
        assessment_id: answer.assessment_id,
        assessment_version_id: answer.assessment_version_id,
        assessment_version_no: answer.assessment_version_no
      });
    });
    
    // เรียงลำดับคำตอบตาม question_order และ set_number_order
    Object.keys(grouped).forEach(username => {
      grouped[username].answers.sort((a: any, b: any) => {
        if (a.set_number_order !== b.set_number_order) {
          return a.set_number_order - b.set_number_order;
        }
        return a.question_order - b.question_order;
      });
    });
    
    return grouped;
  }

  /**
   * ดึงข้อมูล Assessment Structure และ Student Answers รวมกัน
   */
  public async getCompleteAssessmentData(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.activityService.getCompleteAssessmentData(activityId);
      
      res.status(200).json(result);
    } catch (error) {
      this.handleError("ActivityController.getCompleteAssessmentData", error, res);
    }
  }

  /**
   * ดึงปีทั้งหมดที่มีกิจกรรม Active
   */
  public async getActiveActivityYears(req: Request, res: Response): Promise<void> {
    try {
      console.log("📅 [ActivityController] Getting active activity years");
      const years = await this.activityService.getActiveActivityYears();
      
      res.status(200).json({
        success: true,
        data: years,
        count: years.length
      });
    } catch (error) {
      this.handleError("ActivityController.getActiveActivityYears", error, res);
    }
  }

  /**
   * ดึงสรุปกิจกรรมตามช่วงเวลา (สำหรับ dashboard)
   */
  public async getActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      console.log("📊 [ActivityController] Getting activity summary");
      
      const year = parseInt(req.query.year as string);
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const quarter = req.query.quarter === "all" ? "all" : req.query.quarter ? parseInt(req.query.quarter as string) : undefined;
      
      if (!year || isNaN(year)) {
        res.status(400).json({
          success: false,
          message: "Invalid year parameter"
        });
        return;
      }
      
      console.log("📊 [ActivityController] Query params:", { year, month, quarter });
      
      const summary = await this.activityService.getActivitySummary({ year, month, quarter });
      
      res.status(200).json({
        success: true,
        data: summary,
        count: summary.length
      });
    } catch (error) {
      this.handleError("ActivityController.getActivitySummary", error, res);
    }
  }

  /**
   * Mock การลงทะเบียนกิจกรรมของนิสิตแบบสุ่ม (เต็มที่นั่งทุกกิจกรรม)
   */
  public async mockAllActivityRegistrations(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🎲 [ActivityController] Mock all activity registrations`);
      
      const result = await this.activityService.mockAllActivityRegistrations();
      
      res.status(200).json({
        success: true,
        message: `Successfully mocked registrations for ${result.summary.success} activities`,
        data: result
      });
    } catch (error) {
      this.handleError("ActivityController.mockAllActivityRegistrations", error, res);
    }
  }

  /**
   * สร้างกิจกรรมจำนวนมากพร้อมกัน (Bulk Create from Excel or JSON)
   */
  public async bulkCreateActivities(req: Request, res: Response): Promise<void> {
    try {
      console.log("📦 [ActivityController] Bulk create activities request received");
      console.log("🔍 [ActivityController] req.body:", JSON.stringify(req.body, null, 2));
      console.log("🔍 [ActivityController] req.file:", req.file ? "EXISTS" : "NONE");
      console.log("🔍 [ActivityController] Content-Type:", req.headers['content-type']);

      let activities: any[] = [];

      // ✅ ตรวจสอบว่ามีไฟล์ Excel/CSV หรือไม่
      if (req.file) {
        console.log("📄 [ActivityController] File detected, parsing Excel/CSV...");
        activities = await this.parseExcelFile(req.file);
        console.log(`📊 [ActivityController] Parsed ${activities.length} activities from file`);
      } else if (req.body.activities) {
        // ✅ ถ้าไม่มีไฟล์ ให้ใช้ JSON จาก body
        console.log("📝 [ActivityController] Using JSON data from body");
        activities = req.body.activities;
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid request: Please provide either a file (Excel/CSV) or activities array in JSON",
        });
        return;
      }

      if (!Array.isArray(activities) || activities.length === 0) {
        res.status(400).json({
          success: false,
          message: "Invalid request: activities array is empty or invalid",
        });
        return;
      }

      console.log(`📦 [ActivityController] Processing ${activities.length} activities`);

      // Parse activities data
      const parsedActivities = activities.map((activity: any) => {
        return {
          activity_name: activity.activity_name || "ไม่ระบุ",
          presenter_company_name: activity.presenter_company_name || "ไม่ระบุ",
          type: activity.type || "Soft",
          description: activity.description || "ไม่ระบุ",
          seat: this.parseOptionalInt(activity.seat) ?? 0,
          recieve_hours: this.parseOptionalInt(activity.recieve_hours) ?? 0,
          event_format: activity.event_format || "Online",
          special_start_register_date: this.parseDate(activity.special_start_register_date),
          start_register_date: this.parseDate(activity.start_register_date),
          end_register_date: this.parseDate(activity.end_register_date),
          start_activity_date: this.parseDate(activity.start_activity_date),
          end_activity_date: this.parseDate(activity.end_activity_date),
          start_assessment: this.parseDate(activity.start_assessment),
          end_assessment: this.parseDate(activity.end_assessment),
          image_url: activity.image_url || "ไม่ระบุ",
          activity_status: activity.activity_status || "Private",
          activity_state: activity.activity_state || "Not Start",
          status: activity.status || "Active",
          url: activity.url || "ไม่ระบุ",
          assessment_id: this.parseOptionalInt(activity.assessment_id, null),
          room_id: this.parseOptionalInt(activity.room_id, null),
        };
      });

      const result = await this.activityService.bulkCreateActivities(parsedActivities);

      res.status(201).json({
        success: true,
        message: `Bulk create completed: ${result.created.length} activities created`,
        data: {
          created: result.created,
          errors: result.errors,
          summary: {
            total: activities.length,
            created: result.created.length,
            failed: result.errors.length,
          },
        },
      });
    } catch (error) {
      this.handleError("ActivityController.bulkCreateActivities", error, res);
    }
  }

  /**
   * แปลงไฟล์ Excel/CSV เป็น activities array
   */
  private async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const XLSX = require('xlsx');
      
      console.log(`📄 [parseExcelFile] Parsing file: ${file.originalname} (${file.size} bytes)`);
      
      // อ่านไฟล์จาก buffer
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // ใช้ sheet แรก
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      console.log(`📊 [parseExcelFile] Reading sheet: ${sheetName}`);
      
      // แปลง sheet เป็น JSON (header row เป็น keys)
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`✅ [parseExcelFile] Parsed ${jsonData.length} rows from Excel`);
      
      // แปลง column names เป็น snake_case ถ้าจำเป็น
      const activities = jsonData.map((row: any) => {
        // รองรับทั้ง snake_case และ camelCase column names
        return {
          activity_name: row.activity_name || row['activity_name'] || row['Activity Name'],
          presenter_company_name: row.presenter_company_name || row['presenter_company_name'] || row['Presenter Company Name'],
          description: row.description || row['Description'],
          type: row.type || row['Type'],
          seat: row.seat || row['Seat'],
          recieve_hours: row.recieve_hours || row['recieve_hours'] || row['Recieve Hours'],
          event_format: row.event_format || row['event_format'] || row['Event Format'],
          activity_status: row.activity_status || row['activity_status'] || row['Activity Status'],
          activity_state: row.activity_state || row['activity_state'] || row['Activity State'],
          status: row.status || row['Status'],
          special_start_register_date: row.special_start_register_date || row['special_start_register_date'],
          start_register_date: row.start_register_date || row['start_register_date'],
          end_register_date: row.end_register_date || row['end_register_date'],
          start_activity_date: row.start_activity_date || row['start_activity_date'],
          end_activity_date: row.end_activity_date || row['end_activity_date'],
          start_assessment: row.start_assessment || row['start_assessment'],
          end_assessment: row.end_assessment || row['end_assessment'],
          image_url: row.image_url || row['image_url'] || row['Image URL'],
          url: row.url || row['URL'],
          assessment_id: row.assessment_id || row['assessment_id'] || row['Assessment ID'],
          room_id: row.room_id || row['room_id'] || row['Room ID'],
        };
      });
      
      return activities;
    } catch (error) {
      console.error("❌ [parseExcelFile] Error parsing Excel file:", error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ตรวจสอบและสร้างข้อมูล Assessment Structure ตัวอย่าง
   */
  public async checkAndCreateSampleAssessmentData(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.activityService.checkAndCreateSampleAssessmentData(activityId);
      
      res.status(200).json(result);
    } catch (error) {
      this.handleError("ActivityController.checkAndCreateSampleAssessmentData", error, res);
    }
  }

  private parseActivityDetailPayload(body: any): any {
    return {
      activity_id: this.parseOptionalInt(body.activity_id),
      activity_food_id: this.parseOptionalInt(body.activity_food_id, null),
      register_date: body.register_date ? new Date(body.register_date) : new Date(),
      time_in: body.time_in ? new Date(body.time_in) : null,
      time_out: body.time_out ? new Date(body.time_out) : null,
      status: body.status || "Registered",
    };
  }
}

const activityService = new ActivityService();
const controller = new ActivityController(activityService);

export const activityController = {
  create: controller.create.bind(controller),
  bulkCreateActivities: controller.bulkCreateActivities.bind(controller), // ✅ เพิ่ม bulk create method
  update: controller.update.bind(controller),
  updateByStatus: controller.updateActivityByStatus.bind(controller),
  delete: controller.delete.bind(controller),
  getAll: controller.getAll.bind(controller),
  getActivity: controller.getActivity.bind(controller),
  getActivityByHistory: controller.getActivityByHistory.bind(controller),
  getSearch: controller.getSearch.bind(controller),
  // getById: controller.getById.bind(controller),
  search: controller.search.bind(controller), // ✅ เพิ่ม search method
  getEnrolledStudentsForActivity: controller.getEnrolledStudentsForActivity.bind(controller),
  // ActivityDetail methods
  getAllActivityDetails: controller.getAllActivityDetails.bind(controller),
  getActivityDetailById: controller.getActivityDetailById.bind(controller),
  getActivityDetailsByActivityId: controller.getActivityDetailsByActivityId.bind(controller),
  updateActivityDetail: controller.updateActivityDetail.bind(controller),
  resetActivityDetailsAndJoins: controller.resetActivityDetailsAndJoins.bind(controller),
  resetStudentTimes: controller.resetStudentTimes.bind(controller),
  // ✅ Check-in/Check-out methods
  getStudentsCheckedIn: controller.getStudentsCheckedIn.bind(controller),
  getStudentsCheckedOut: controller.getStudentsCheckedOut.bind(controller),
  // ✅ Student answers methods
  getStudentAnswersDetail: controller.getStudentAnswersDetail.bind(controller),
  getCompleteAssessmentData: controller.getCompleteAssessmentData.bind(controller),
  checkAndCreateSampleAssessmentData: controller.checkAndCreateSampleAssessmentData.bind(controller),
  // ✅ Dashboard summary methods
  getActiveActivityYears: controller.getActiveActivityYears.bind(controller),
  getActivitySummary: controller.getActivitySummary.bind(controller),
  // ✅ Mock data methods
  mockAllActivityRegistrations: controller.mockAllActivityRegistrations.bind(controller),
  // getEnrolledStudents: controller.getEnrolledStudents.bind(controller),
};
