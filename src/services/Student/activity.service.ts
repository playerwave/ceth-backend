import { ActivityDao } from "../../daos/Student/activity.dao";
import { AssessmentDao } from "../../daos/Student/assessment.dao";
import { Activity } from "../../entity/activity.entity";
import { Assessment } from "../../entity/assessment/assessment.entity";
import { Join } from "../../entity/join.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";

export class ActivityService extends ErrorHandledService {
  private readonly activityDao = new ActivityDao();
  private readonly assessmentDao = new AssessmentDao();

  public async getStudentActivitiesService(
    studentId: number
  ): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.getAvailableActivities(
        studentId
      );
      this.logInfo("📄 Retrieved student-available activities", {
        studentId,
        count: activities.length,
      });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getStudentActivitiesService", error);
      throw error;
    }
  }

  public async getActivityByIdService(
    activityId: number,
    studentId: number | null
  ): Promise<Activity | null> {
    try {
      const activity = await this.activityDao.findActivityWithJoinStatus(
        activityId,
        studentId
      );
      if (!activity) return null;

      this.logInfo("🔍 Retrieved activity by ID", { activityId, studentId });
      return activity;
    } catch (error) {
      this.logError("❌ Error in getActivityByIdService", error);
      throw error;
    }
  }

  public async getAssessmentByActivityId(activityId: number): Promise<Assessment | null> {
    try {
      console.log(`🔍 [ActivityService] Getting assessment for activity: ${activityId}`);
      
      // ดึงข้อมูล activity เพื่อหา assessment_id
      const activities = await this.activityDao.getActivityByID(activityId);
      
      if (!activities || activities.length === 0) {
        console.log(`❌ [ActivityService] Activity not found: ${activityId}`);
        return null;
      }

      const activity = activities[0];

      if (!activity.assessment_id) {
        console.log(`❌ [ActivityService] No assessment_id for activity: ${activityId}`);
        return null;
      }

      console.log(`🔍 [ActivityService] Found assessment_id: ${activity.assessment_id}`);
      
      // ดึงข้อมูล assessment พร้อม questions
      const assessmentData = await this.assessmentDao.getAssessmentWithQuestions(activity.assessment_id);
      
      if (!assessmentData) {
        console.log(`❌ [ActivityService] Assessment not found: ${activity.assessment_id}`);
        return null;
      }

      console.log(`✅ [ActivityService] Found assessment: ${assessmentData.assessment_name}`);
      
      // แปลงข้อมูล sections และเก็บโครงสร้างไว้
      const sections: any[] = [];
      const allQuestions: any[] = [];
      
      if (assessmentData.sections) {
        // sections ถูกเรียงแล้วจาก database query (ORDER BY number in name, then set_number_id)
        console.log("🔍 [ActivityService] Sections order from database:", assessmentData.sections.map(s => ({ id: s.set_number_id, name: s.name })));
        
        assessmentData.sections.forEach((section: any, sectionIndex: number) => {
          const sectionQuestions: any[] = [];
          
          if (section.questions) {
            // เรียงคำถามตาม question_number หรือ question_id
            const sortedQuestions = section.questions.sort((a: any, b: any) => {
              if (a.question_number && b.question_number) {
                return a.question_number - b.question_number;
              }
              return a.question_id - b.question_id;
            });
            
            sortedQuestions.forEach((question: any) => {
              // แปลง question_type ให้ตรงกับ frontend
              let questionType = question.question_type;
              if (questionType === "Single answer") {
                questionType = "single_choice";
              } else if (questionType === "Multiple answer") {
                questionType = "multiple_choice";
              } else if (questionType === "Text answer") {
                questionType = "open_ended";
              } else if (questionType === "Fix Single answer") {
                questionType = "satisfaction";
              }
              
              const questionData = {
                question_id: question.question_id,
                question_text: question.question_text,
                question_type: questionType,
                options: question.choices?.map((choice: any) => choice.choice_text) || [],
                required: true,
                section_id: section.set_number_id,
                section_name: section.name,
                question_number: question.question_number
              };
              
              sectionQuestions.push(questionData);
              allQuestions.push(questionData);
            });
          }
          
          sections.push({
            section_id: section.set_number_id,
            section_name: section.name,
            section_order: sectionIndex + 1,
            questions: sectionQuestions
          });
        });
      }
      
      console.log(`🔍 [ActivityService] Converted ${allQuestions.length} questions in ${sections.length} sections`);
      sections.forEach(section => {
        console.log(`📋 Section "${section.section_name}": ${section.questions.length} questions`);
      });
      
      // สร้าง response ที่ frontend คาดหวัง
      const response = {
        assessment_id: assessmentData.assessment_id,
        assessment_name: assessmentData.assessment_name,
        assessment_description: assessmentData.description || "กรุณาตอบแบบประเมินตามความจริง",
        activity_name: activity.activity_name, // เพิ่มชื่อกิจกรรม
        questions: allQuestions,
        sections: sections
      };
      
      this.logInfo("🔍 Retrieved assessment by activity ID", { 
        activityId, 
        assessmentId: assessmentData.assessment_id,
        assessmentName: assessmentData.assessment_name,
        questionsCount: allQuestions.length
      });
      
      return response;
    } catch (error) {
      this.logError("❌ Error in getAssessmentByActivityId", error);
      throw error;
    }
  }

  // public async studentEnrollActivityService(
  //   studentId: number,
  //   activityId: number,
  //   foodChoices: string[]
  // ): Promise<Join> {
  //   try {
  //     // 1. หา activity_detail_id จาก activityId
  //     const activityDetailResult =
  //       await this.activityDao.getActivityDetailIdByActivityId(activityId);
  //     const activityDetailId = activityDetailResult?.activity_detail_id;
  //     if (!activityDetailId) throw new Error("Activity detail not found");

  //     // 2. ตรวจสอบว่าสมัครซ้ำหรือยัง
  //     const existing = await this.joinDao.findJoinByStudentAndActivity(
  //       studentId,
  //       activityDetailId
  //     );
  //     if (existing) throw new Error("Already enrolled in this activity");

  //     // 3. สร้าง join ใหม่
  //     const join = await this.joinDao.createJoin(
  //       studentId,
  //       activityDetailId,
  //       foodChoices
  //     );

  //     await redis.del(`join:${studentId}`);
  //     this.logInfo("✅ Student enrolled in activity", {
  //       studentId,
  //       activityId,
  //     });
  //     return join;
  //   } catch (error) {
  //     this.logError("❌ Error in studentEnrollActivityService", error);
  //     throw error;
  //   }
  // }

  // public async studentEnrollActivityService(
  //   studentId: number,
  //   activityId: number,
  //   foodChoices: string[]
  // ): Promise<Join> {
  //   try {
  //     // ใช้ฟังก์ชันใหม่
  //     const activityDetailResult =
  //       await this.activityDao.getAvailableActivityDetailId(activityId, studentId);
  //     const activityDetailId = activityDetailResult?.activity_detail_id;
  //     if (!activityDetailId) throw new Error("Activity detail not found");

  //     // ตรวจสอบว่าสมัครซ้ำหรือยัง
  //     const existing = await this.joinDao.findJoinByStudentAndActivity(
  //       studentId,
  //       activityDetailId
  //     );
  //     if (existing) throw new Error("Already enrolled in this activity");

  //     // สร้าง join ใหม่ (ต้องแก้ createJoin ให้รับ activityDetailId)
  //     const join = await this.joinDao.createJoin(
  //       studentId,
  //       activityDetailId,
  //       foodChoices // หรือ teacherId ถ้าต้องการ
  //     );

  //     await redis.del(`join:${studentId}`);
  //     this.logInfo("✅ Student enrolled in activity", {
  //       studentId,
  //       activityId,
  //     });
  //     return join;
  //   } catch (error) {
  //     this.logError("❌ Error in studentEnrollActivityService", error);
  //     throw error;
  //   }
  // }

  public async studentEnrollActivityService(
    studentId: number,
    activityId: number,
    foodChoices: string[]
  ): Promise<Join> {
    try {
      // 1. ตรวจสอบว่าสมัครซ้ำหรือยัง
      const existingJoin = await this.activityDao.findJoinByStudentAndActivityId(
        studentId,
        activityId
      );
      
      if (existingJoin) {
        // ถ้ามี join อยู่แล้ว ให้ตรวจสอบ status
        if (existingJoin.status === 'Pending') {
          throw new Error("Already enrolled in this activity");
        } else if (existingJoin.status === 'Cancelled') {
          // อัพเดท join status เป็น Pending
          await this.activityDao.updateJoinStatus(existingJoin.join_id, 'Pending');
          console.log(`🔄 Updated cancelled join to Pending: ${existingJoin.join_id}`);
          
          // อัพเดท registered_count
          await this.activityDao.updateRegisteredCount(activityId);
          
          // ลบ cache
          await redis.del(`join:${studentId}`);
          
          return existingJoin;
        }
      }

      // 2. สร้าง activity_detail และ join ใหม่ (หรืออัพเดทจาก Cancelled)
      const activityDetail = await this.activityDao.createActivityDetail(
        activityId,
        studentId, // ส่ง studentId แทน joinId
        foodChoices
      );

      // 3. หา join ที่เพิ่งสร้าง
      const join = await this.activityDao.getJoinByActivityDetailAndStudent(
        activityDetail.activity_detail_id,
        studentId
      );

      if (!join) {
        throw new Error("Failed to create join record");
      }

      // 4. ลบ cache
      await redis.del(`join:${studentId}`);

      // 5. ตรวจสอบ registered_count หลังจากลงทะเบียน
      const finalCount = await this.activityDao.getActivityInfo(activityId);

      this.logInfo("✅ Student enrolled in activity", {
        studentId,
        activityId,
        joinId: join.join_id,
        activityDetailId: activityDetail.activity_detail_id,
        registeredCount: finalCount?.registered_count || 0,
        totalSeats: finalCount?.seat || 0,
        remainingSeats: (finalCount?.seat || 0) - (finalCount?.registered_count || 0)
      });
      return join;
    } catch (error) {
      this.logError("❌ Error in studentEnrollActivityService", error);
      throw error;
    }
  }

  public async getActivityHistoryByStudentsID(students_id: number): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getActivityHistoryByStudentsID(students_id);
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Activity data retrieved and cached", {
        count: activities.length,
      });

      return activities;
    } catch (error) {
      this.logError("❌ Error in getActivityHistoryByStudentsID", error);
      throw error;
    }
  }

  public async getSearch(students_id: number, text: string): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getSearch(students_id, text)
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

  public async getEnrolledActivitiesService(
    studentId: number
  ): Promise<Activity[]> {
    try {
      const cacheKey = `join:${studentId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached enrolled activities", { studentId });
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getEnrolledActivities(
        studentId
      );
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Retrieved and cached enrolled activities", {
        studentId,
        count: activities.length,
      });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getEnrolledActivitiesService", error);
      throw error;
    }
  }

  public async getOngoingActivitiesService(
    studentId: number
  ): Promise<Activity[]> {
    try {
      const cacheKey = `ongoing:${studentId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached ongoing activities", { studentId });
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getOngoingActivities(
        studentId
      );
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Retrieved and cached ongoing activities", {
        studentId,
        count: activities.length,
      });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getOngoingActivitiesService", error);
      throw error;
    }
  }

  public async searchActivityService(ac_name: string): Promise<Activity[]> {
    try {
      const results = await this.activityDao.searchActivitiesByName(ac_name);
      this.logInfo("🔍 Searched activities by name", {
        ac_name,
        count: results.length,
      });
      return results;
    } catch (error) {
      this.logError("❌ Error in searchActivityService", error);
      throw error;
    }
  }

  public async unEnrollActivityService(
    studentId: number,
    activityId: number
  ): Promise<boolean> {
    try {
      // ใช้ cancelEnrollment เพื่อเปลี่ยน status เป็น Cancelled แทนการลบ
      const success = await this.activityDao.cancelEnrollment(studentId, activityId);

      if (success) {
        // ลบ cache ของรายการ join ของนิสิต
        await redis.del(`join:${studentId}`);

        this.logInfo("🚫 Student unenrolled from activity (status changed to Cancelled)", {
          studentId,
          activityId,
        });
      }

      return success;
    } catch (error) {
      this.logError("❌ Error in unEnrollActivityService", error);
      throw error;
    }
  }

  // public async unEnrollActivityService(
  //   studentId: number,
  //   activityId: number
  // ): Promise<boolean> {
  //   try {
  //     const ok = await this.activityDao.cancelEnrollment(studentId, activityId);

  //     // ลบ cache ของรายการ join ของนิสิต (ถ้ามี)
  //     await redis.del(`join:${studentId}`);

  //     this.logInfo("🚪 Student unenrolled from activity", {
  //       studentId,
  //       activityId,
  //       success: ok,
  //     });

  //     return ok;
  //   } catch (error) {
  //     this.logError("❌ Error in unEnrollActivityService", error);
  //     throw error;
  //   }
  // }

  // เพิ่มเมธอดสำหรับรีเซ็ต registered_count ทั้งหมด
  public async resetAllRegisteredCountsService(): Promise<void> {
    try {
      await this.activityDao.resetAllRegisteredCounts();
      this.logInfo("🔄 Reset all registered counts completed");
    } catch (error) {
      this.logError("❌ Error in resetAllRegisteredCountsService", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: Check-in/Check-out Activity
  public async checkInOutActivityService(
    activityId: number,
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string; studentId?: number; studentInfo?: any }> {
    try {
      // 1. ตรวจสอบ username และ password
      const student = await this.activityDao.validateStudentCredentials(username, password);
      if (!student) {
        return {
          success: false,
          message: "รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง"
        };
      }

      // 2. ตรวจสอบว่ากิจกรรมมีอยู่จริงและดึงข้อมูล activity_state
      const activity = await this.activityDao.getActivityByID(activityId);
      if (!activity || activity.length === 0) {
        return { success: false, message: "ไม่พบกิจกรรมนี้" };
      }

      const activityData = activity[0];
      console.log("🔍 Activity state:", activityData.activity_state);

      // 3. ตรวจสอบว่านิสิตลงทะเบียนกิจกรรมนี้แล้วหรือยัง
      const enrollment = await this.activityDao.findEnrollmentByStudentAndActivity(
        student.students_id,
        activityId
      );

      if (!enrollment) {
        return {
          success: false,
          message: "คุณยังไม่ได้ลงทะเบียนกิจกรรมนี้"
        };
      }

      // 4. ตรวจสอบ activity_state และดำเนินการตามนั้น
      if (activityData.activity_state === "Start Activity") {
        // ลงชื่อเข้าร่วม
        if (enrollment.time_in) {
          return { success: false, message: "คุณได้ลงชื่อเข้าร่วมกิจกรรมนี้แล้ว" };
        }
        
        await this.activityDao.updateTimeIn(student.students_id, activityId);
        
        this.logInfo("✅ Student checked in to activity", {
          studentId: student.students_id,
          activityId,
          activityDetailId: enrollment.activity_detail_id
        });

        return {
          success: true,
          message: "ลงชื่อเข้าร่วมกิจกรรมสำเร็จ!",
          studentId: student.students_id,
          studentInfo: {
            first_name: student.first_name,
            last_name: student.last_name,
            department: student.department,
            username: student.username
          }
        };
      } else if (activityData.activity_state === "End Activity") {
        // ลงชื่อออก
        if (!enrollment.time_in) {
          return { success: false, message: "คุณยังไม่ได้ลงชื่อเข้าร่วมกิจกรรมนี้" };
        }
        
        if (enrollment.time_out) {
          return { success: false, message: "คุณได้ลงชื่อออกจากกิจกรรมนี้แล้ว" };
        }
        
        await this.activityDao.updateTimeOut(student.students_id, activityId);
        
        this.logInfo("✅ Student checked out from activity", {
          studentId: student.students_id,
          activityId,
          activityDetailId: enrollment.activity_detail_id
        });

        return {
          success: true,
          message: "ลงชื่อออกจากกิจกรรมสำเร็จ!",
          studentId: student.students_id,
          studentInfo: {
            first_name: student.first_name,
            last_name: student.last_name,
            department: student.department,
            username: student.username
          }
        };
      } else {
        return { success: false, message: "กิจกรรมนี้ยังไม่เปิดให้ลงชื่อ" };
      }
    } catch (error) {
      this.logError("❌ Error in checkInOutActivityService", error);
      throw error;
    }
  }

  public async getAssessmentByActivityIdService(activityId: number): Promise<any> {
    try {
      console.log("🔍 [ActivityService] Getting assessment for activity:", activityId);
      
      // ดึงข้อมูล activity เพื่อหา assessment_id และ assessment_version_id
      const activity = await this.activityDao.getActivityById(activityId);
      if (!activity) {
        throw new Error("Activity not found");
      }

      const assessmentId = activity.assessment_id;
      const assessmentVersionId = activity.assessment_version_id;
      
      if (!assessmentId) {
        throw new Error("No assessment found for this activity");
      }

      console.log("🔍 [ActivityService] Found assessment_id:", assessmentId);
      console.log("🔍 [ActivityService] Found assessment_version_id:", assessmentVersionId);

      // ดึงข้อมูล assessment พร้อมคำถาม (รองรับ versioning)
      const assessment = await this.assessmentDao.getAssessmentWithQuestionsVersioned(assessmentId, assessmentVersionId);
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      console.log("✅ [ActivityService] Found assessment:", assessment.assessment_name);
      console.log("🔍 [ActivityService] Assessment sections:", assessment.sections?.length || 0);
      console.log("🔍 [ActivityService] Assessment questions:", assessment.questions?.length || 0);

      const result = {
        ...assessment,
        activity_name: activity.activity_name
      };

      // Debug: ตรวจสอบข้อมูลที่ส่งไปยัง frontend
      console.log("🔍 [ActivityService] Final result sections:", result.sections?.map((s: any) => ({
        section_name: s.section_name,
        questions_count: s.questions?.length || 0,
        questions: s.questions?.map((q: any) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options
        }))
      })));

      this.logInfo("🔍 Retrieved assessment by activity ID", {
        activityId,
        assessmentId,
        assessmentVersionId,
        assessmentName: assessment.assessment_name,
        sectionsCount: assessment.sections?.length || 0,
        questionsCount: assessment.questions?.length || 0
      });

      return result;
    } catch (error) {
      this.logError("❌ Error in getAssessmentByActivityIdService", error);
      throw error;
    }
  }

  public async getJoinIdByStudentAndActivityService(activityId: number, studentId: number): Promise<number | null> {
    try {
      console.log("🔍 [ActivityService] Getting join_id for activity:", activityId, "student:", studentId);

      const joinId = await this.activityDao.getJoinIdByStudentAndActivity(activityId, studentId);
      
      if (!joinId) {
        console.log("❌ [ActivityService] No join found for activity:", activityId, "student:", studentId);
        return null;
      }

      console.log("✅ [ActivityService] Join ID found:", joinId);
      return joinId;
    } catch (error) {
      this.logError("❌ Error in getJoinIdByStudentAndActivityService", error);
      throw error;
    }
  }

  public async debugActivityData(activityId: number): Promise<any> {
    try {
      console.log("🔍 [ActivityService] Debug activity data for:", activityId);
      
      // ดึงข้อมูล activity
      const activity = await this.activityDao.getActivityById(activityId);
      if (!activity) {
        throw new Error("Activity not found");
      }

      const assessmentId = activity.assessment_id;
      const assessmentVersionId = activity.assessment_version_id;
      
      console.log("🔍 [ActivityService] Activity info:", {
        activityId,
        assessmentId,
        assessmentVersionId,
        activityState: activity.activity_state
      });

      // ตรวจสอบข้อมูลจากตารางฐานหลัก
      const baseData = await this.assessmentDao.getAssessmentWithQuestions(assessmentId);
      
      // ตรวจสอบข้อมูลจากตารางเวอร์ชัน (ถ้ามี)
      let versionedData = null;
      if (assessmentVersionId) {
        versionedData = await this.assessmentDao.getAssessmentWithQuestionsVersioned(assessmentId, assessmentVersionId);
      }

      return {
        activity: {
          activity_id: activityId,
          activity_name: activity.activity_name,
          assessment_id: assessmentId,
          assessment_version_id: assessmentVersionId,
          activity_state: activity.activity_state
        },
        baseData: baseData ? {
          sections: baseData.sections?.length || 0,
          questions: baseData.questions?.length || 0,
          sections_detail: baseData.sections?.map((s: any) => ({
            section_name: s.section_name,
            questions_count: s.questions?.length || 0,
            questions: s.questions?.map((q: any) => ({
              question_text: q.question_text,
              question_type: q.question_type,
              options_count: q.options?.length || 0,
              options: q.options
            }))
          }))
        } : null,
        versionedData: versionedData ? {
          sections: versionedData.sections?.length || 0,
          questions: versionedData.questions?.length || 0,
          sections_detail: versionedData.sections?.map((s: any) => ({
            section_name: s.section_name,
            questions_count: s.questions?.length || 0,
            questions: s.questions?.map((q: any) => ({
              question_text: q.question_text,
              question_type: q.question_type,
              options_count: q.options?.length || 0,
              options: q.options
            }))
          }))
        } : null
      };
    } catch (error) {
      this.logError("❌ Error in debugActivityData", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: เช็คสถานะการทำแบบประเมิน
  public async checkAssessmentStatusService(activityId: number, studentId: number): Promise<{ hasSubmitted: boolean; assessmentName?: string; submittedDate?: Date }> {
    try {
      console.log("🔍 [ActivityService] Checking assessment status for activity:", activityId, "student:", studentId);
      
      const status = await this.activityDao.checkAssessmentStatus(activityId, studentId);
      
      console.log("✅ [ActivityService] Assessment status:", status);
      return status;
    } catch (error) {
      this.logError("❌ Error in checkAssessmentStatusService", error);
      throw error;
    }
  }
}
