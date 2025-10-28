import { ActivityDao } from "../../daos/Teacher/activity.dao";
import { AssessmentDao } from "../../daos/Teacher/assessment.dao";
import { Activity } from "../../entity/activity.entity";
import { Assessment } from "../../entity/assessment/assessment.entity";
import { CertificateBase } from "../../entity/certificate/certificate-base.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";
import { RoomService } from "./room.service";
import { connectDatabase } from "../../db/database";
import { parseThaiMoocData } from "../../utils/naturalTextParser";

export class ActivityService extends ErrorHandledService {
  private readonly activityDao = new ActivityDao();
  private readonly assessmentDao = new AssessmentDao();
  private readonly roomService = new RoomService();

  public async createActivity(
    input: Activity & { foodIds?: number[]; floor?: string }
  ): Promise<Activity> {
    try {
      console.log("🔍 [ActivityService] Creating activity with input:", input);

      const { foodIds, floor, ...activityData } = input;

      // ดึงข้อมูล Assessment ถ้ามี assessment_id
      let assessmentData: Assessment | null = null;
      if (input.assessment_id) {
        try {
          const assessments = await this.assessmentDao.getAssessmentByID(
            input.assessment_id
          );
          assessmentData = assessments.length > 0 ? assessments[0] : null;
          console.log("🔍 Assessment data found:", assessmentData);
        } catch (error) {
          console.error("❌ Error fetching assessment:", error);
        }
      }

      // ✅ Extract certificate data from input
      const certificate_template_url = (input as any).certificate_template_url;
      const certificate_ocr_data = (input as any).certificate_ocr_data;
      const certificate_image_analysis = (input as any).certificate_image_analysis;
      const upload_certificate_description = (input as any).upload_certificate_description || null;

      const sanitizedData: Partial<Activity> = {
        ...activityData,
        activity_name: input.activity_name || "ไม่ระบุ",
        presenter_company_name: input.presenter_company_name || "ไม่ระบุ",
        description: input.description || "ไม่ระบุ",
        seat: input.seat ?? 0,
        recieve_hours: input.recieve_hours ?? 0,
        special_start_register_date:
          input.special_start_register_date ?? new Date(),
        start_register_date: input.start_register_date ?? new Date(),
        end_register_date: input.end_register_date ?? new Date(),
        start_activity_date: input.start_activity_date ?? new Date(),
        end_activity_date: input.end_activity_date ?? new Date(),
        // Set assessment dates from input (prioritize input over assessment data)
        start_assessment: input.start_assessment ?? null,
        end_assessment: input.end_assessment ?? null,
        url: input.url || "ไม่ระบุ",
        room_id: input.room_id ?? undefined,
        create_activity_date: new Date(),
        last_update_activity_date: new Date(),
      };

      const created = await this.activityDao.createActivityDao(
        sanitizedData,
        foodIds ?? []
      );

      // ✅ Create CertificateBase if certificate_template_url exists
      if (certificate_template_url && created.activity_id) {
        console.log("📄 [ActivityService] Creating CertificateBase for activity:", created.activity_id);
        const connection = await connectDatabase();
        const certificateBaseRepo = connection.getRepository(CertificateBase);

        // ✅ Parse certificate data from OCR natural_text
        let parsedCertificateData: ReturnType<typeof parseThaiMoocData> | null = null;
        if (certificate_ocr_data?.natural_text) {
          parsedCertificateData = parseThaiMoocData(certificate_ocr_data.natural_text);
          const certType = parsedCertificateData.certificate_type;
          console.log(`🔍 [ActivityService] Parsed ${certType} data:`, parsedCertificateData);
        }

        // ✅ Prepare fields for certificate
        const certificateName = parsedCertificateData?.certificate_name || `Certificate for ${created.activity_name}`;
        const certificateType = parsedCertificateData?.certificate_type || "Other";
        const organizeName = parsedCertificateData?.organize_base_name || null;
        const getCertificateDate = parsedCertificateData?.get_certificate_date || null;
        const supervisorName1 = parsedCertificateData?.supervisor_name1 || null;

        // ✅ Log parsed fields (CREATE)
        const certType = certificateType || "Unknown";
        console.log(`📝 [ActivityService] Prepared fields from ${certType} parsing (CREATE):`, {
          certificate_name: certificateName,
          certificate_type: certificateType,
          organize_base_name: organizeName,
          get_certificate_date: getCertificateDate,
          supervisor_name1: supervisorName1
        });

        const certificateBase = certificateBaseRepo.create({
          activity_id: created.activity_id,
          certificate_name: certificateName,
          certificate_source: "Course Activity",
          certificate_type: certificateType as "THAI MOOC" | "BUU MOOC" | "Other",
          organize_base_name: organizeName,
          get_certificate_date: getCertificateDate,
          supervisor_name1: supervisorName1,
          template_image_url: certificate_template_url,
          ocr_data: certificate_ocr_data || null,
          image_analysis: certificate_image_analysis || null,
          description: upload_certificate_description,
          is_active: true,
        });

        const savedCertificateBase = await certificateBaseRepo.save(certificateBase);
        console.log("✅ [ActivityService] CertificateBase created:", savedCertificateBase.certificate_base_id);

        // ✅ Update local object for return (no need to update activity table since relationship is via certificate_base.activity_id)
        Object.assign(created, { certificate_base_id: savedCertificateBase.certificate_base_id });
      }

      await redis.del("activity:all");

      this.logInfo("🆕 Activity created", {
        activity_name: created.activity_name,
        activity_id: created.activity_id,
      });

      return created;
    } catch (error) {
      this.logError("❌ Error in createActivity", error);
      throw error;
    }
  }

  public async getActivityByHistory(): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getActivityByHistory();
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Activity data retrieved and cached", {
        count: activities.length,
      });

      return activities;
    } catch (error) {
      this.logError("❌ Error in getActivityByHistory", error);
      throw error;
    }
  }

  public async getSearch(text: string): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getSearch(text)
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Activity data retrieved and cached", {
        count: activities.length,
      });

      return activities;
    } catch (error) {
      this.logError("❌ Error in getSearch", error);
      throw error;
    }
  }

  public async getAllActivities(): Promise<Activity[]> {
    const cacheKey = "activity:all";
    let retries = 3;

    while (retries > 0) {
      try {
        // 🔧 ปิด cache ชั่วคราวเพื่อแก้ปัญหาทันที
        // TODO: เปิดใช้ cache ใหม่หลังจากแก้ไข smart cache system
        /*
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            this.logInfo("📦 Returning cached activity data");
            return JSON.parse(cached);
          }
        } catch (cacheError) {
          console.warn("⚠️ Cache read error, proceeding to database:", cacheError);
        }
        */

        // ✅ ดึงจาก database
        const activities = await this.activityDao.getAllActivitiesDao();
        
        // ✅ ตรวจสอบข้อมูลที่ได้
        if (!activities || !Array.isArray(activities)) {
          console.warn("⚠️ Invalid activities data from DAO");
          if (retries > 1) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000)); // รอ 1 วินาที
            continue;
          }
          return [];
        }

        // 🔧 ปิด cache ชั่วคราว
        // TODO: เปิดใช้ cache ใหม่หลังจากแก้ไข smart cache system
        /*
        try {
          await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);
        } catch (cacheError) {
          console.warn("⚠️ Cache write error, but data retrieved successfully:", cacheError);
        }
        */

        this.logInfo("📤 Activity data retrieved and cached", {
          count: activities.length,
        });

        return activities;
      } catch (error) {
        retries--;
        this.logError(`❌ Error in getAllActivities (retries left: ${retries})`, error);
        
        if (retries === 0) {
          // ✅ ลองดึงจาก cache เป็น fallback สุดท้าย
          try {
            const cached = await redis.get(cacheKey);
            if (cached) {
              console.log("🔄 Using cached data as fallback");
              return JSON.parse(cached);
            }
          } catch (fallbackError) {
            console.error("❌ Fallback cache read also failed:", fallbackError);
          }
          
          // ✅ return empty array แทน throw error
          console.warn("⚠️ All attempts failed, returning empty array");
          return [];
        }
        
        // ✅ รอสักครู่ก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return [];
  }

  public async getActivityById(activity_id: number): Promise<Activity | null> {
    try {
      const cacheKey = `activity:${activity_id}`;

      // ✅ ลองดึงจาก cache ก่อน
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity by ID", { activity_id });
        return JSON.parse(cached);
      }

      // ✅ ดึงจาก DAO
      const activity = await this.activityDao.findById(activity_id);
      if (!activity) {
        this.logInfo("Activity not found", { activity_id });
        return null;
      }

      // ✅ Fetch certificate base if it exists
      console.log("🚀 [ActivityService] Fetching certificate base for activity_id:", activity_id);
      const connection = await connectDatabase();
      const certificateBaseRepo = connection.getRepository(CertificateBase);
      const certificateBase = await certificateBaseRepo.findOne({
        where: { activity_id: activity_id }
      });

      if (certificateBase) {
        console.log("📄 [ActivityService] Certificate base found:", {
          certificate_base_id: certificateBase.certificate_base_id,
          template_image_url: certificateBase.template_image_url
        });

        // Map the certificate base data to the activity object
        Object.assign(activity, { certificateBase: certificateBase });
        // For backward compatibility with old frontend fields
        Object.assign(activity, { certificate_template_url: certificateBase.template_image_url });
        Object.assign(activity, { certificate_ocr_data: certificateBase.ocr_data });
        Object.assign(activity, { certificate_image_analysis: certificateBase.image_analysis });
        Object.assign(activity, { upload_certificate_description: certificateBase.description });
      } else {
        console.log("⚠️ [ActivityService] No certificate base found for activity:", activity_id);
      }

      // ✅ เก็บลง cache
      await redis.set(cacheKey, JSON.stringify(activity), "EX", 60);
      this.logInfo("📤 Activity by ID retrieved and cached", { activity_id });

      return activity;
    } catch (error) {
      this.logError("❌ Error in getActivityById", error);
      throw error;
    }
  }

  public async updateActivity(
    activity_id: number,
    input: Activity & { foodIds?: number[]; floor?: string }
  ): Promise<Activity | null> {
    const existing = await this.activityDao.findById(activity_id);
    if (!existing) {
      this.logError("⚠️ Activity not found", { activity_id });
      return null;
    }

    // ดึงข้อมูล Assessment ถ้ามี assessment_id
    let assessmentData: Assessment | null = null;
    if (input.assessment_id) {
      try {
        const assessments = await this.assessmentDao.getAssessmentByID(
          input.assessment_id
        );
        assessmentData = assessments.length > 0 ? assessments[0] : null;
        console.log("🔍 Assessment data found for update:", assessmentData);
      } catch (error) {
        console.error("❌ Error fetching assessment for update:", error);
      }
    }

    if (input.activity_status === "Public") {
      // ✅ Skip registration date validation สำหรับ Course activities
      if (
        input.event_format !== "Course" &&
        input.special_start_register_date &&
        input.special_start_register_date >= input.start_activity_date!
      ) {
        throw new Error(
          "special_start_register_date ต้องน้อยกว่า start_activity_date"
        );
      }
      if (
        input.event_format !== "Course" &&
        input.start_register_date &&
        input.start_register_date >= input.start_activity_date!
      ) {
        throw new Error("start_register_date ต้องน้อยกว่า start_activity_date");
      }
      // ✅ Skip registration date validation สำหรับ Course activities
      if (
        input.event_format !== "Course" &&
        input.end_register_date &&
        input.start_register_date &&
        input.end_register_date <= input.start_register_date
      ) {
        throw new Error("end_register_date ต้องมากกว่า start_register_date");
      }
      if (
        input.end_activity_date &&
        input.start_activity_date &&
        input.end_activity_date <= input.start_activity_date
      ) {
        throw new Error("end_activity_date ต้องมากกว่า start_activity_date");
      }
    }

    let hrs = input.recieve_hours;
    if (
      input.activity_status === "Public" &&
      input.event_format !== "Course" &&
      input.start_activity_date &&
      input.end_activity_date
    ) {
      const diffMs =
        new Date(input.end_activity_date).getTime() -
        new Date(input.start_activity_date).getTime();
      hrs = Math.floor(diffMs / (1000 * 60 * 60));
    }

    const foods = input.event_format === "Onsite" ? input.foodIds ?? [] : [];

    console.log("🍽️ Service: Food assignment", {
      event_format: input.event_format,
      foodIds: input.foodIds,
      foods: foods,
    });

    const updatedData: Partial<Activity> = {
      ...input,
      last_update_activity_date: new Date(),
      create_activity_date: input.create_activity_date ?? new Date(),
      recieve_hours: hrs ?? undefined,
      seat: input.seat ?? 0,
      assessment_id: input.assessment_id ?? null, 
      start_assessment: input.start_assessment ?? null,
      end_assessment: input.end_assessment ?? null,
      room_id: input.event_format === "Onsite" ? input.room_id ?? null : null,
      url: input.url ?? undefined,
    };

    this.logInfo("🔧 Prepared updatedData (local time applied)", updatedData);
    console.log("🔍 Service: Final values for DAO:", {
      assessment_id: updatedData.assessment_id,
      room_id: updatedData.room_id,
      assessment_id_type: typeof updatedData.assessment_id,
      room_id_type: typeof updatedData.room_id,
    });

    console.log("🍽️ Service: Calling updateActivityDao with foods:", foods);
    const updated = await this.activityDao.updateActivityDao(
      activity_id,
      updatedData,
      foods
    );

    this.logInfo("✅ Activity updated in DB", { activity_id, updated });
    this.logInfo("🍽️ Food assignment", { foods });

    // ✅ Update or Create CertificateBase if certificate_template_url exists
    const certificate_template_url = (input as any).certificate_template_url;
    const certificate_ocr_data = (input as any).certificate_ocr_data;
    const certificate_image_analysis = (input as any).certificate_image_analysis;
    const upload_certificate_description = (input as any).upload_certificate_description || null;
    
    console.log("🔍 [ActivityService] Certificate fields in update:", {
      certificate_template_url,
      certificate_ocr_data,
      certificate_image_analysis,
      upload_certificate_description
    });

    if (certificate_template_url) {
      console.log("📄 [ActivityService] Updating CertificateBase for activity:", activity_id);
      const connection = await connectDatabase();
      const certificateBaseRepo = connection.getRepository(CertificateBase);

      // Check if CertificateBase exists
      const existingCertificateBase = await certificateBaseRepo.findOne({
        where: { activity_id }
      });

      // ✅ Check if certificate template image has changed
      const imageChanged = existingCertificateBase && 
        existingCertificateBase.template_image_url !== certificate_template_url;

      if (imageChanged) {
        console.log("🔄 [ActivityService] Certificate template image changed, re-parsing...");
      }

      // ✅ Parse certificate data from OCR natural_text ONLY if:
      // 1. Creating new certificate base, OR
      // 2. Certificate template image has changed
      let parsedCertificateData: ReturnType<typeof parseThaiMoocData> | null = null;
      if (certificate_ocr_data?.natural_text && (!existingCertificateBase || imageChanged)) {
        parsedCertificateData = parseThaiMoocData(certificate_ocr_data.natural_text);
        const certType = parsedCertificateData.certificate_type;
        console.log(`🔍 [ActivityService] Parsed ${certType} data:`, parsedCertificateData);
      }

      // ✅ Prepare fields for certificate
      const certificateName = parsedCertificateData?.certificate_name || 
        (existingCertificateBase?.certificate_name) || 
        `Certificate for ${updated.activity_name}`;
      const certificateType = parsedCertificateData?.certificate_type || 
        (existingCertificateBase?.certificate_type) || 
        "Other";
      const organizationName = parsedCertificateData?.organize_base_name || 
        existingCertificateBase?.organize_base_name || 
        null;
      const getCertificateDate = parsedCertificateData?.get_certificate_date || 
        existingCertificateBase?.get_certificate_date || 
        null;
      const supervisorName1 = parsedCertificateData?.supervisor_name1 || 
        existingCertificateBase?.supervisor_name1 || 
        null;

      if (existingCertificateBase) {
        // ✅ Update existing
        existingCertificateBase.template_image_url = certificate_template_url;
        existingCertificateBase.ocr_data = certificate_ocr_data || existingCertificateBase.ocr_data;
        existingCertificateBase.image_analysis = certificate_image_analysis || existingCertificateBase.image_analysis;
        existingCertificateBase.description = upload_certificate_description || existingCertificateBase.description;
        
        // ✅ Only update parsed fields if image changed or new data available
        if (imageChanged || parsedCertificateData) {
          existingCertificateBase.certificate_name = certificateName;
          existingCertificateBase.certificate_type = certificateType as "THAI MOOC" | "BUU MOOC" | "Other";
          existingCertificateBase.organize_base_name = organizationName;
          existingCertificateBase.get_certificate_date = getCertificateDate;
          existingCertificateBase.supervisor_name1 = supervisorName1;

          // ✅ Log parsed fields (UPDATE)
          const certType = certificateType || "Unknown";
          console.log(`📝 [ActivityService] Prepared fields from ${certType} parsing (UPDATE):`, {
            certificate_name: certificateName,
            certificate_type: certificateType,
            organize_base_name: organizationName,
            get_certificate_date: getCertificateDate,
            supervisor_name1: supervisorName1,
            image_changed: imageChanged
          });
        } else {
          console.log("⏭️ [ActivityService] Skipping parse - no image change and no new OCR data");
        }

        existingCertificateBase.updated_at = new Date();
        await certificateBaseRepo.save(existingCertificateBase);
        console.log("✅ [ActivityService] CertificateBase updated");
      } else {
        // ✅ Create new with parsed data
        const certificateBase = certificateBaseRepo.create({
          activity_id,
          certificate_name: certificateName,
          certificate_source: "Course Activity",
          certificate_type: certificateType === "BUU MOOC" ? "BUU MOOC" : 
                            certificateType === "THAI MOOC" ? "THAI MOOC" : "Other",
          organize_base_name: organizationName,
          get_certificate_date: getCertificateDate,
          supervisor_name1: supervisorName1,
          template_image_url: certificate_template_url,
          ocr_data: certificate_ocr_data || null,
          image_analysis: certificate_image_analysis || null,
          description: upload_certificate_description,
          is_active: true,
        });

        // ✅ Log parsed fields (CREATE)
        const certTypeForLog = certificateType || "Unknown";
        console.log(`📝 [ActivityService] Prepared fields from ${certTypeForLog} parsing (CREATE):`, {
          certificate_name: certificateName,
          certificate_type: certificateType,
          organize_base_name: organizationName,
          get_certificate_date: getCertificateDate,
          supervisor_name1: supervisorName1
        });

        const savedCertificateBase = await certificateBaseRepo.save(certificateBase);
        
        // ✅ Type guard to ensure we have a single CertificateBase
        if (Array.isArray(savedCertificateBase)) {
          console.log("✅ [ActivityService] CertificateBase created:", savedCertificateBase[0].certificate_base_id);
          Object.assign(updated, { certificate_base_id: savedCertificateBase[0].certificate_base_id });
        } else {
          console.log("✅ [ActivityService] CertificateBase created:", savedCertificateBase.certificate_base_id);
          Object.assign(updated, { certificate_base_id: savedCertificateBase.certificate_base_id });
        }
      }
    }

    if (input.event_format === "Onsite" && input.room_id && input.floor) {
      await this.roomService.updateRoomFloor(input.room_id, input.floor.trim());
    }

    await redis.del("activity:all");
    this.logInfo("🧹 Redis cache cleared", { key: "activity:all" });

    return updated;
  }

  public async updateActivityByStatus(
    activity_id: number,
    activity_status: string
  ): Promise<boolean> {
    const find_activity = await this.activityDao.getActivityByID(activity_id);
    try {
      if (find_activity.length > 0) {
        const id = find_activity[0].activity_id;
        await this.activityDao.updateActyivityByStatus(id, activity_status);
        await redis.del("activity:all");
        return true;
      } else {
        console.log("ไม่พบ Activity นี้");
        return false;
      }
    } catch (error) {
      this.logError("❌ Error in updateActivityByStatus", error);
      throw error;
    }
  }

  public async softDeleteActivity(
    activity_id: number
  ): Promise<Activity | null> {
    try {
      const activity = await this.activityDao.findById(activity_id);
      if (!activity) return null;

      activity.status = "Inactive";
      const updated = await this.activityDao.save(activity);
      await redis.del("activity:all");

      this.logInfo("🗑️ Activity soft deleted", { activity_id });
      return updated;
    } catch (error) {
      this.logError("❌ Error in softDeleteActivity", error);
      throw error;
    }
  }

  public async hardDeleteActivity(activity_id: number): Promise<boolean> {
    try {
      const activity = await this.activityDao.findById(activity_id);
      if (!activity) return false;

      console.log("🗑️ [ActivityService] Deleting related records for activity:", activity_id);

      await this.activityDao.deleteActivityFoods(activity_id);
      console.log("✅ [ActivityService] Deleted activity_food records");

      await this.activityDao.deleteActivityDetails(activity_id);
      console.log("✅ [ActivityService] Deleted activity_detail records");

      await this.activityDao.deleteQrCodes(activity_id);
      console.log("✅ [ActivityService] Deleted qr_code records");
      
      await this.activityDao.deleteCertificateTemplate(activity_id);
      console.log("✅ [ActivityService] Deleted certificate template");

      await this.activityDao.deleteActivityFoods(activity_id);

      await this.activityDao.delete(activity_id);
      console.log("✅ [ActivityService] Deleted main activity");
      
      await redis.del("activity:all");

      this.logInfo("🗑️ Activity hard deleted", { activity_id });
      return true;
    } catch (error) {
      this.logError("❌ Error in hardDeleteActivity", error);
      throw error;
    }
  }

  public async searchActivities(searchTerm: string): Promise<Activity[]> {
    try {
      return await this.activityDao.searchActivities(searchTerm);
    } catch (error) {
      this.logError("❌ Error searching activities", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: ดึงข้อมูลนักเรียนที่ลงทะเบียน
  public async getEnrolledStudentsForActivity(activityId: number): Promise<any[]> {
    try {
      const students = await this.activityDao.getEnrolledStudentsForActivity(activityId);
      this.logInfo("📥 Retrieved enrolled students", {
        activityId,
        count: students.length
      });
      return students;
    } catch (error) {
      this.logError("❌ Error getting enrolled students", error);
      throw error;
    }
  }

  // ✅ ActivityDetail Service Methods
  public async getAllActivityDetails(): Promise<any[]> {
    try {
      const activityDetails = await this.activityDao.getAllActivityDetails();
      this.logInfo("📥 Retrieved all activity details", {
        count: activityDetails.length
      });
      return activityDetails;
    } catch (error) {
      this.logError("❌ Error getting all activity details", error);
      throw error;
    }
  }

  public async getActivityDetailById(id: number): Promise<any | null> {
    try {
      const activityDetail = await this.activityDao.getActivityDetailById(id);
      this.logInfo("📥 Retrieved activity detail by ID", { id });
      return activityDetail;
    } catch (error) {
      this.logError("❌ Error getting activity detail by ID", error);
      throw error;
    }
  }

  public async updateActivityDetail(id: number, data: any): Promise<any> {
    try {
      const result = await this.activityDao.updateActivityDetail(id, data);
      return result;
    } catch (error) {
      this.logError("❌ Error updating activity detail", error);
      throw error;
    }
  }

  public async resetActivityDetailsAndJoins(activityId: number): Promise<any> {
    try {
      const result = await this.activityDao.resetActivityDetailsAndJoins(activityId);
      this.logInfo("✅ DELETE ALL activity details and joins completed", { activityId, result });
      return result;
    } catch (error) {
      this.logError("❌ Error deleting activity details and joins", error);
      throw error;
    }
  }

  public async resetStudentTimes(activityId: number): Promise<any> {
    try {
      const result = await this.activityDao.resetStudentTimes(activityId);
      this.logInfo("✅ Reset student times completed", { activityId, result });
      return result;
    } catch (error) {
      this.logError("❌ Error resetting student times", error);
      throw error;
    }
  }

  public async getActivityDetailsByActivityId(activityId: number): Promise<any[]> {
    try {
      const activityDetails = await this.activityDao.getActivityDetailsByActivityId(activityId);
      this.logInfo("📥 Retrieved activity details by activity ID", {
        activityId,
        count: activityDetails.length
      });
      return activityDetails;
    } catch (error) {
      this.logError("❌ Error getting activity details by activity ID", error);
      throw error;
    }
  }

  // ✅ Function 1: ดูนิสิตที่ลงชื่อเข้าร่วมกิจกรรม (มี time_in)
  public async getStudentsCheckedIn(activityId: number): Promise<any[]> {
    try {
      const students = await this.activityDao.getStudentsCheckedIn(activityId);
      this.logInfo("📥 Retrieved students who checked in", {
        activityId,
        count: students.length
      });
      return students;
    } catch (error) {
      this.logError("❌ Error getting students who checked in", error);
      throw error;
    }
  }

  // ✅ Function 2: ดูนิสิตที่ลงชื่อออกกิจกรรม (มี time_out)
  public async getStudentsCheckedOut(activityId: number): Promise<any[]> {
    try {
      const students = await this.activityDao.getStudentsCheckedOut(activityId);
      this.logInfo("📥 Retrieved students who checked out", {
        activityId,
        count: students.length
      });
      return students;
    } catch (error) {
      this.logError("❌ Error getting students who checked out", error);
      throw error;
    }
  }

  /**
   * ดึงคำตอบของนักเรียนใน Activity พร้อม JOIN กับ activity_detail, join, answer
   */
  public async getStudentAnswersDetail(activityId: number): Promise<any[]> {
    try {
      const studentAnswers = await this.activityDao.getStudentAnswersDetail(activityId);
      this.logInfo("📥 Retrieved student answers detail", {
        activityId,
        count: studentAnswers.length
      });
      return studentAnswers;
    } catch (error) {
      this.logError("❌ Error getting student answers detail", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Assessment Structure และ Student Answers รวมกัน
   */
  public async getCompleteAssessmentData(activityId: number): Promise<any> {
    try {
      const result = await this.activityDao.getCompleteAssessmentData(activityId);
      this.logInfo("📥 Retrieved complete assessment data", {
        activityId,
        studentsCount: result.data?.students?.length || 0
      });
      return result;
    } catch (error) {
      this.logError("❌ Error getting complete assessment data", error);
      throw error;
    }
  }

  /**
   * ดึงปีทั้งหมดที่มีกิจกรรม Active
   */
  public async getActiveActivityYears(): Promise<number[]> {
    try {
      const years = await this.activityDao.getActiveActivityYears();
      this.logInfo("📅 Retrieved active activity years", { count: years.length, years });
      return years;
    } catch (error) {
      this.logError("❌ Error in getActiveActivityYears", error);
      throw error;
    }
  }

  /**
   * ดึงสรุปกิจกรรมตามช่วงเวลา (สำหรับ dashboard)
   */
  public async getActivitySummary(params: {
    year: number;
    month?: number;
    quarter?: number | "all";
  }): Promise<any[]> {
    try {
      console.log("📊 [ActivityService] Getting activity summary with params:", params);
      const summary = await this.activityDao.getActivitySummary(params);
      this.logInfo("📊 Retrieved activity summary", { count: summary.length });
      return summary;
    } catch (error) {
      this.logError("❌ Error in getActivitySummary", error);
      throw error;
    }
  }

  /**
   * Mock การลงทะเบียนกิจกรรมของนิสิตแบบสุ่ม (เต็มที่นั่งทุกกิจกรรม)
   */
  public async mockAllActivityRegistrations(): Promise<any> {
    try {
      console.log(`🎲 [ActivityService] Mock all activity registrations`);
      const result = await this.activityDao.mockAllActivityRegistrations();
      
      // Clear cache
      await redis.del("activity:all");
      
      this.logInfo("🎲 Mock all registrations completed", result.summary);
      return result;
    } catch (error) {
      this.logError("❌ Error in mockAllActivityRegistrations", error);
      throw error;
    }
  }

  /**
   * สร้างกิจกรรมจำนวนมากพร้อมกัน (Bulk Create from Excel)
   */
  public async bulkCreateActivities(
    activities: Partial<Activity>[],
    foodIdsArray?: number[][]
  ): Promise<{ created: Activity[]; errors: any[] }> {
    try {
      console.log(`🔄 [ActivityService] Starting bulk create for ${activities.length} activities`);

      // Sanitize and validate data
      const sanitizedActivities = activities.map((activity) => ({
        activity_name: activity.activity_name || "ไม่ระบุ",
        presenter_company_name: activity.presenter_company_name || "ไม่ระบุ",
        description: activity.description || "ไม่ระบุ",
        type: activity.type || "Soft",
        seat: activity.seat ?? 0,
        recieve_hours: activity.recieve_hours ?? 0,
        event_format: activity.event_format || "Online",
        special_start_register_date: activity.special_start_register_date ?? null,
        start_register_date: activity.start_register_date ?? null,
        end_register_date: activity.end_register_date ?? null,
        start_activity_date: activity.start_activity_date ?? null,
        end_activity_date: activity.end_activity_date ?? null,
        start_assessment: activity.start_assessment ?? null,
        end_assessment: activity.end_assessment ?? null,
        image_url: activity.image_url || "ไม่ระบุ",
        activity_status: activity.activity_status || "Private",
        activity_state: activity.activity_state || "Not Start",
        status: activity.status || "Active",
        url: activity.url || "ไม่ระบุ",
        room_id: activity.room_id ?? null,
        assessment_id: activity.assessment_id ?? null,
        create_activity_date: new Date(),
        last_update_activity_date: new Date(),
      }));

      const result = await this.activityDao.bulkCreateActivities(
        sanitizedActivities,
        foodIdsArray || []
      );

      // Clear cache
      await redis.del("activity:all");

      this.logInfo("🆕 Bulk activities created", {
        total: activities.length,
        created: result.created.length,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      this.logError("❌ Error in bulkCreateActivities", error);
      throw error;
    }
  }

  /**
   * ตรวจสอบและสร้างข้อมูล Assessment Structure ตัวอย่าง
   */
  public async checkAndCreateSampleAssessmentData(activityId: number): Promise<any> {
    try {
      const result = await this.activityDao.checkAndCreateSampleAssessmentData(activityId);
      this.logInfo("🔧 Checked and created sample assessment data", {
        activityId,
        result
      });
      return result;
    } catch (error) {
      this.logError("❌ Error checking and creating sample assessment data", error);
      throw error;
    }
  }

  /**
   * 🔄 Reset การทำแบบประเมินของนิสิตในกิจกรรม
   */
  public async resetAssessmentForActivity(activityId: number): Promise<{
    success: boolean;
    message: string;
    data: {
      studentsAffected: number;
      answersDeleted: number;
      joinsReset: number;
      hoursReset: number;
    };
  }> {
    try {
      console.log(`🔄 [ActivityService] Resetting assessment for activity ${activityId}`);
      
      // 1. ตรวจสอบว่ากิจกรรมมีอยู่จริง
      const activity = await this.activityDao.findById(activityId);
      if (!activity) {
        throw new Error(`Activity ${activityId} not found`);
      }
      
      console.log(`✅ [ActivityService] Activity found: ${activity.activity_name}`);
      
      // 2. เรียกใช้ DAO method
      const result = await this.activityDao.resetAssessmentForActivity(activityId);
      
      // 3. Clear cache
      await redis.del("activity:all");
      await redis.del(`activity:${activityId}`);
      console.log(`🧹 [ActivityService] Cache cleared for activity ${activityId}`);
      
      this.logInfo("✅ Reset assessment completed", {
        activityId,
        result
      });
      
      return {
        success: true,
        message: `Reset assessment completed for activity ${activityId}`,
        data: result
      };
    } catch (error) {
      this.logError("❌ Error resetting assessment", error);
      throw error;
    }
  }
}
