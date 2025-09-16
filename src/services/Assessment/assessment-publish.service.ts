import { ErrorHandledService } from "../error.handdled.service";
import { AssessmentVersionService } from "./assessment-version.service";
import { AssessmentVersion } from "../../entity/assessment/versioning assessment/assessment-version.entity";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export class AssessmentPublishService extends ErrorHandledService {
  private readonly assessmentVersionService = new AssessmentVersionService();

  /**
   * Publish assessment version
   */
  public async publishAssessmentVersion(assessmentId: number): Promise<AssessmentVersion> {
    try {
      // 1. ตรวจสอบว่า assessment มีข้อมูลครบหรือไม่
      const validation = await this.validateAssessmentForPublishing(assessmentId);
      if (!validation.isValid) {
        throw new Error(validation.error || "Assessment validation failed");
      }

      // 2. สร้างเวอร์ชันใหม่
      const newVersion = await this.assessmentVersionService.createNewVersion(assessmentId);

      // 3. Clone ข้อมูลจากเวอร์ชันล่าสุด (ถ้ามี)
      const latestVersion = await this.assessmentVersionService.getLatestPublishedVersion(assessmentId);
      if (latestVersion) {
        await this.cloneAssessmentData(latestVersion.assessment_version_id, newVersion.assessment_version_id);
      }

      // 4. Publish เวอร์ชันใหม่
      await this.assessmentVersionService.publishVersion(newVersion.assessment_version_id);

      console.log(`✅ Published assessment version: ${newVersion.assessment_version_id}`);
      return newVersion;
    } catch (error) {
      this.logError("❌ Error in publishAssessmentVersion", error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่า assessment พร้อม publish หรือไม่
   */
  public async validateAssessmentForPublishing(assessmentId: number): Promise<ValidationResult> {
    try {
      const warnings: string[] = [];

      // ตรวจสอบว่ามี SetNumbers หรือไม่
      const setNumbersCount = await this.countSetNumbers(assessmentId);
      if (setNumbersCount === 0) {
        return {
          isValid: false,
          error: "Assessment must have at least one section (SetNumber)"
        };
      }

      // ตรวจสอบว่ามี Questions หรือไม่
      const questionsCount = await this.countQuestions(assessmentId);
      if (questionsCount === 0) {
        return {
          isValid: false,
          error: "Assessment must have at least one question"
        };
      }

      // ตรวจสอบว่ามี Choices สำหรับ choice questions หรือไม่
      const choiceQuestionsWithoutChoices = await this.countChoiceQuestionsWithoutChoices(assessmentId);
      if (choiceQuestionsWithoutChoices > 0) {
        return {
          isValid: false,
          error: `Found ${choiceQuestionsWithoutChoices} choice questions without choices`
        };
      }

      // ตรวจสอบว่ามี Activities ที่ใช้ assessment นี้อยู่หรือไม่
      const activeActivitiesCount = await this.countActiveActivities(assessmentId);
      if (activeActivitiesCount > 0) {
        warnings.push(`${activeActivitiesCount} activities are currently using this assessment`);
      }

      return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      this.logError("❌ Error in validateAssessmentForPublishing", error);
      return {
        isValid: false,
        error: "Validation failed due to system error"
      };
    }
  }

  /**
   * Clone ข้อมูล assessment จากเวอร์ชันเก่าไปเวอร์ชันใหม่
   */
  public async cloneAssessmentData(fromVersionId: number, toVersionId: number): Promise<void> {
    try {
      // Clone SetNumbers
      const setNumbers = await this.assessmentVersionService['setNumberVersionDao'].cloneSetNumbersFromVersion(
        fromVersionId, 
        toVersionId
      );
      
      // Clone Questions และ Choices สำหรับแต่ละ SetNumber
      for (const setNumber of setNumbers) {
        // หา set_number_id เดิม
        const originalSetNumberId = await this.findOriginalSetNumberId(setNumber.name, fromVersionId);
        if (originalSetNumberId) {
          const questions = await this.assessmentVersionService['questionVersionDao'].cloneQuestionsFromSetNumber(
            originalSetNumberId,
            setNumber.set_number_version_id
          );
          
          // Clone Choices สำหรับแต่ละ Question
          for (const question of questions) {
            const originalQuestionId = await this.findOriginalQuestionId(question.question_text, originalSetNumberId);
            if (originalQuestionId) {
              await this.assessmentVersionService['choiceVersionDao'].cloneChoicesFromQuestion(
                originalQuestionId,
                question.question_version_id
              );
            }
          }
        }
      }
      
      console.log(`✅ Cloned assessment data from version ${fromVersionId} to ${toVersionId}`);
    } catch (error) {
      this.logError("❌ Error in cloneAssessmentData", error);
      throw error;
    }
  }

  /**
   * นับจำนวน SetNumbers ใน assessment
   */
  private async countSetNumbers(assessmentId: number): Promise<number> {
    try {
      const result = await this.assessmentVersionService['setNumberVersionDao']['dataSource']!.query(
        `SELECT COUNT(*) as count FROM set_number WHERE assessment_id = $1`,
        [assessmentId]
      );
      return parseInt(result[0].count);
    } catch (error) {
      console.error("Error counting set numbers:", error);
      return 0;
    }
  }

  /**
   * นับจำนวน Questions ใน assessment
   */
  private async countQuestions(assessmentId: number): Promise<number> {
    try {
      const result = await this.assessmentVersionService['questionVersionDao']['dataSource']!.query(
        `SELECT COUNT(*) as count 
         FROM question q 
         JOIN set_number sn ON q.set_number_id = sn.set_number_id 
         WHERE sn.assessment_id = $1`,
        [assessmentId]
      );
      return parseInt(result[0].count);
    } catch (error) {
      console.error("Error counting questions:", error);
      return 0;
    }
  }

  /**
   * นับจำนวน choice questions ที่ไม่มี choices
   */
  private async countChoiceQuestionsWithoutChoices(assessmentId: number): Promise<number> {
    try {
      const result = await this.assessmentVersionService['questionVersionDao']['dataSource']!.query(
        `SELECT COUNT(*) as count 
         FROM question q 
         JOIN set_number sn ON q.set_number_id = sn.set_number_id 
         WHERE sn.assessment_id = $1 
         AND q.question_type IN ('Fix Single answer', 'Single answer', 'Multiple answer')
         AND NOT EXISTS (
           SELECT 1 FROM choice c WHERE c.question_id = q.question_id
         )`,
        [assessmentId]
      );
      return parseInt(result[0].count);
    } catch (error) {
      console.error("Error counting choice questions without choices:", error);
      return 0;
    }
  }

  /**
   * นับจำนวน Activities ที่ใช้ assessment นี้
   */
  private async countActiveActivities(assessmentId: number): Promise<number> {
    try {
      const result = await this.assessmentVersionService['assessmentVersionDao']['dataSource']!.query(
        `SELECT COUNT(*) as count 
         FROM activity 
         WHERE assessment_id = $1 
         AND activity_state IN ('Start Assessment', 'End Assessment')`,
        [assessmentId]
      );
      return parseInt(result[0].count);
    } catch (error) {
      console.error("Error counting active activities:", error);
      return 0;
    }
  }

  /**
   * หา set_number_id เดิมจากชื่อและ assessment_version_id
   */
  private async findOriginalSetNumberId(name: string, assessmentVersionId: number): Promise<number | null> {
    try {
      const version = await this.assessmentVersionService['assessmentVersionDao'].getVersionById(assessmentVersionId);
      if (!version) return null;

      const result = await this.assessmentVersionService['setNumberVersionDao']['dataSource']!.query(
        `SELECT set_number_id FROM set_number WHERE name = $1 AND assessment_id = $2 LIMIT 1`,
        [name, version.assessment_id]
      );
      
      return result.length > 0 ? result[0].set_number_id : null;
    } catch (error) {
      console.error("Error finding original set number ID:", error);
      return null;
    }
  }

  /**
   * หา question_id เดิมจากข้อความและ set_number_id
   */
  private async findOriginalQuestionId(questionText: string, setNumberId: number): Promise<number | null> {
    try {
      const result = await this.assessmentVersionService['questionVersionDao']['dataSource']!.query(
        `SELECT question_id FROM question WHERE question_text = $1 AND set_number_id = $2 LIMIT 1`,
        [questionText, setNumberId]
      );
      
      return result.length > 0 ? result[0].question_id : null;
    } catch (error) {
      console.error("Error finding original question ID:", error);
      return null;
    }
  }
}
