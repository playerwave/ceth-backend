import { ErrorHandledService } from "../error.handdled.service";
import { AssessmentVersionDao } from "../../daos/Assessment/assessment-version.dao";
import { SetNumberVersionDao } from "../../daos/Assessment/set-number-version.dao";
import { QuestionVersionDao } from "../../daos/Assessment/question-version.dao";
import { ChoiceVersionDao } from "../../daos/Assessment/choice-version.dao";
import { AssessmentVersion } from "../../entity/Assessment/versioning assessment/assessment-version.entity";

export interface AssessmentVersionWithData extends AssessmentVersion {
  setNumbers?: any[];
  questions?: any[];
  choices?: any[];
}

export class AssessmentVersionService extends ErrorHandledService {
  private readonly assessmentVersionDao = new AssessmentVersionDao();
  private readonly setNumberVersionDao = new SetNumberVersionDao();
  private readonly questionVersionDao = new QuestionVersionDao();
  private readonly choiceVersionDao = new ChoiceVersionDao();

  /**
   * สร้างเวอร์ชันใหม่
   */
  public async createNewVersion(assessmentId: number): Promise<AssessmentVersion> {
    try {
      const nextVersionNo = await this.assessmentVersionDao.getNextVersionNumber(assessmentId);
      
      const newVersion = await this.assessmentVersionDao.createAssessmentVersion({
        assessment_id: assessmentId,
        version_no: nextVersionNo,
        is_published: false
      });

      console.log(`✅ Created new assessment version: ${newVersion.assessment_version_id}`);
      return newVersion;
    } catch (error) {
      this.logError("❌ Error in createNewVersion", error);
      throw error;
    }
  }

  /**
   * Publish เวอร์ชัน
   */
  public async publishVersion(versionId: number): Promise<void> {
    try {
      await this.assessmentVersionDao.publishVersion(versionId);
      console.log(`✅ Published assessment version: ${versionId}`);
    } catch (error) {
      this.logError("❌ Error in publishVersion", error);
      throw error;
    }
  }

  /**
   * ดึงประวัติเวอร์ชัน
   */
  public async getVersionHistory(assessmentId: number): Promise<AssessmentVersion[]> {
    try {
      const versions = await this.assessmentVersionDao.getAssessmentVersions(assessmentId);
      console.log(`✅ Retrieved ${versions.length} versions for assessment: ${assessmentId}`);
      return versions;
    } catch (error) {
      this.logError("❌ Error in getVersionHistory", error);
      throw error;
    }
  }

  /**
   * ดึงเวอร์ชันล่าสุดที่ published
   */
  public async getLatestPublishedVersion(assessmentId: number): Promise<AssessmentVersion | null> {
    try {
      const version = await this.assessmentVersionDao.getLatestPublishedVersion(assessmentId);
      if (version) {
        console.log(`✅ Retrieved latest published version: ${version.assessment_version_id}`);
      } else {
        console.log(`⚠️ No published version found for assessment: ${assessmentId}`);
      }
      return version;
    } catch (error) {
      this.logError("❌ Error in getLatestPublishedVersion", error);
      throw error;
    }
  }

  /**
   * Clone เวอร์ชัน
   */
  public async cloneVersion(fromVersionId: number, toAssessmentId: number): Promise<AssessmentVersion> {
    try {
      const newVersion = await this.assessmentVersionDao.cloneVersion(fromVersionId, toAssessmentId);
      
      // Clone SetNumbers
      const setNumbers = await this.setNumberVersionDao.cloneSetNumbersFromVersion(
        fromVersionId, 
        newVersion.assessment_version_id
      );
      
      // Clone Questions และ Choices สำหรับแต่ละ SetNumber
      for (const setNumber of setNumbers) {
        // หา set_number_id เดิมจากข้อมูลที่ clone มา
        const originalSetNumber = await this.findOriginalSetNumberId(setNumber.name, fromVersionId);
        if (originalSetNumber) {
          const questions = await this.questionVersionDao.cloneQuestionsFromSetNumber(
            originalSetNumber,
            setNumber.set_number_version_id
          );
          
          // Clone Choices สำหรับแต่ละ Question
          for (const question of questions) {
            const originalQuestion = await this.findOriginalQuestionId(question.question_text, originalSetNumber);
            if (originalQuestion) {
              await this.choiceVersionDao.cloneChoicesFromQuestion(
                originalQuestion,
                question.question_version_id
              );
            }
          }
        }
      }
      
      console.log(`✅ Cloned version ${fromVersionId} to assessment ${toAssessmentId}`);
      return newVersion;
    } catch (error) {
      this.logError("❌ Error in cloneVersion", error);
      throw error;
    }
  }

  /**
   * ดึงเวอร์ชันพร้อมข้อมูลครบถ้วน
   */
  public async getVersionWithFullData(versionId: number): Promise<AssessmentVersionWithData | null> {
    try {
      const version = await this.assessmentVersionDao.getVersionById(versionId);
      if (!version) {
        return null;
      }

      // ดึง SetNumbers
      const setNumbers = await this.setNumberVersionDao.getSetNumbersByAssessmentVersion(versionId);
      
      // ดึง Questions และ Choices สำหรับแต่ละ SetNumber
      const setNumbersWithData = await Promise.all(
        setNumbers.map(async (setNumber) => {
          const questions = await this.questionVersionDao.getQuestionsBySetNumberVersion(
            setNumber.set_number_version_id
          );
          
          const questionsWithChoices = await Promise.all(
            questions.map(async (question) => {
              const choices = await this.choiceVersionDao.getChoicesByQuestionVersion(
                question.question_version_id
              );
              return { ...question, choices };
            })
          );
          
          return { ...setNumber, questions: questionsWithChoices };
        })
      );

      return {
        ...version,
        setNumbers: setNumbersWithData
      };
    } catch (error) {
      this.logError("❌ Error in getVersionWithFullData", error);
      throw error;
    }
  }

  /**
   * หา set_number_id เดิมจากชื่อและ assessment_version_id
   */
  private async findOriginalSetNumberId(name: string, assessmentVersionId: number): Promise<number | null> {
    try {
      // ดึง assessment_id จาก version
      const version = await this.assessmentVersionDao.getVersionById(assessmentVersionId);
      if (!version) return null;

      // หา set_number_id จากชื่อในตาราง set_number เดิม
      const result = await this.setNumberVersionDao['dataSource']!.query(
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
      const result = await this.questionVersionDao['dataSource']!.query(
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
