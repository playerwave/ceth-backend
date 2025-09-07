// import redis from "../../config/redis";
// import { AssessmentDao } from "../../daos/Teacher/assessment.dao";
// import { Assessment } from "../../entity/assessment.entity";
// import { ErrorHandledService } from "../error.handdled.service";

// export class AssessmentService extends ErrorHandledService {
//   constructor(private readonly assessmentDao = new AssessmentDao()) {
//     super();
//   }

//   public async countAssessments(): Promise<number> {
//     try {
//       const count = await this.assessmentDao.countAssessments();
//       this.logInfo("📊 Assessment count fetched", { count });
//       return count;
//     } catch (error) {
//       this.logError("❌ Error in countAssessments", error);
//       throw error;
//     }
//   }

//   public async getAssessments(
//     page: number,
//     limit: number
//   ): Promise<Assessment[]> {
//     const cacheKey = `assessment:all:${page}:${limit}`;

//     try {
//       const cached = await redis.get(cacheKey);
//       if (cached) {
//         const parsed = JSON.parse(cached);
//         if (Array.isArray(parsed)) return parsed;
//         if (Array.isArray(parsed.assessmentData)) return parsed.assessmentData;
//         return [];
//       }

//       const data = await this.assessmentDao.getAssessments(page, limit);
//       await redis.set(cacheKey, JSON.stringify(data), "EX", 60); // Cache 1 นาที
//       this.logInfo("📤 Assessment data retrieved and cached", {
//         page,
//         limit,
//         count: data.length,
//       });

//       return data;
//     } catch (error) {
//       this.logError("❌ Error in getAssessments", error);
//       throw error;
//     }
//   }

//   public async addAssessment(
//     title: string,
//     description: string,
//     status: string
//   ): Promise<Assessment | null> {
//     const cacheKey = "assessment:all";

//     try {
//       const exists = await this.assessmentDao.getAssessmentByTitle(title);
//       if (exists.length > 0) {
//         this.logInfo("🚫 Duplicate assessment title", { title });
//         return null;
//       }

//       const created = await this.assessmentDao.addAssessment(
//         title,
//         description,
//         status
//       );
//       await redis.del(cacheKey);
//       this.logInfo("🆕 Assessment created", {
//         assessment_id: created.assessment_id,
//       });

//       return created;
//     } catch (error) {
//       this.logError("❌ Error in addAssessment", error);
//       throw error;
//     }
//   }

//   public async updateAssessment(
//     assessment_id: number,
//     title: string,
//     description: string,
//     status: string
//   ): Promise<Assessment | null> {
//     const cacheKey = "assessment:all";

//     try {
//       const found = await this.assessmentDao.getAssessmentByID(assessment_id);
//       if (!found.length) {
//         this.logInfo("❌ Assessment not found", { assessment_id });
//         return null;
//       }

//       const currentTitle = found[0].assessment_name;
//       let updated: Assessment | null = null;

//       if (title === currentTitle) {
//         await this.assessmentDao.updateAssessmentWithoutTitle(
//           assessment_id,
//           description,
//           status
//         );
//       } else {
//         const dup = await this.assessmentDao.getAssessmentByTitle(title);
//         if (dup.length > 0) {
//           this.logInfo("🚫 Duplicate new assessment title", { title });
//           return null;
//         }
//         await this.assessmentDao.updateAssessmentWithTitle(
//           assessment_id,
//           title,
//           description,
//           status
//         );
//       }

//       await redis.del(cacheKey);
//       const [result] = await this.assessmentDao.getAssessmentByID(
//         assessment_id
//       );
//       this.logInfo("✏️ Assessment updated", { assessment_id });
//       return result || null;
//     } catch (error) {
//       this.logError("❌ Error in updateAssessment", error);
//       throw error;
//     }
//   }

//   public async deleteAssessment(
//     assessment_id: number
//   ): Promise<Assessment | null> {
//     const cacheKey = "assessment:all";

//     try {
//       const deleted = await this.assessmentDao.deleteAssessment(assessment_id);
//       await redis.del(cacheKey);

//       if (!deleted) {
//         this.logInfo("❌ No assessment deleted", { assessment_id });
//         return null;
//       }

//       this.logInfo("🗑️ Assessment deleted", { assessment_id });
//       return deleted;
//     } catch (error) {
//       this.logError("❌ Error in deleteAssessment", error);
//       throw error;
//     }
//   }
// }

import redis from "../../config/redis";
import { AssessmentDao } from "../../daos/Teacher/assessment.dao";
import { Assessment } from "../../entity/assessment.entity";
import { ErrorHandledService } from "../error.handdled.service";

// import entities ที่เกี่ยวข้อง
import { SetNumber } from "../../entity/setNumbers.entity";
import { Question } from "../../entity/question.entity";
import { Choice } from "../../entity/choice.entity";
import { connectDatabase } from "../../db/database";
import { SetNumberDao } from "../../daos/Teacher/setNumber.dao";
import { QRCodeDao } from "../../daos/Teacher/qr-code.dao";
import { QuestionDao } from "../../daos/Teacher/question.dao";
import { ChoiceDao } from "../../daos/Teacher/choice.dao";

export class AssessmentService extends ErrorHandledService {
  constructor(private readonly assessmentDao = new AssessmentDao(), private readonly setNumberDao = new SetNumberDao(), private readonly questionDao = new QuestionDao(), private readonly choiceDao = new ChoiceDao()) {
    super();
  }

  // ------------------- ของเดิม -------------------
  public async countAssessments(): Promise<number> {
    try {
      return await this.assessmentDao.countAssessments();
    } catch (error) {
      this.logError("❌ Error in countAssessments", error);
      throw error;
    }
  }

  public async getAssessments(page: number, limit: number): Promise<Assessment[]> {
    const cacheKey = `assessment:all:${page}:${limit}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const data = await this.assessmentDao.getAssessments(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      return data;
    } catch (error) {
      this.logError("❌ Error in getAssessments", error);
      throw error;
    }
  }

  public async getAssessmentById(assessment_id: number): Promise<Assessment | null> {
    const cacheKey = `assessment:${assessment_id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const result = await this.assessmentDao.getAssessmentByID(assessment_id);
      if (!result?.length) return null;

      const assessment = result[0];
      await redis.set(cacheKey, JSON.stringify(assessment), "EX", 60);
      return assessment;
    } catch (error) {
      this.logError("❌ Error in getAssessmentById", error);
      throw error;
    }
  }

  public async addAssessment(
    assessment_name: string,
    description: string,
    status: "Active" | "Inactive",
    assessment_status: "Not finished" | "Finished" | "Unsuccessful",
    create_date: Date,
    last_update: Date
  ): Promise<Assessment | null> {
    try {
      const exists = await this.assessmentDao.getAssessmentByTitle(assessment_name);
      if (exists.length > 0) return null;

      const created = await this.assessmentDao.addAssessment(
        assessment_name,
        description,
        status,
        assessment_status,
        create_date,
        last_update
      );

      await redis.del("assessment:all");
      return created;
    } catch (error) {
      this.logError("❌ Error in addAssessment", error);
      throw error;
    }
  }

  public async updateAssessment(
    assessment_id: number,
    assessment_name: string,
    description: string,
    status: "Active" | "Inactive",
    assessment_status: "Not finished" | "Finished" | "Unsuccessful",
    last_update: Date
  ): Promise<Assessment | null> {
    try {
      const found = await this.assessmentDao.getAssessmentByID(assessment_id);
      if (!found.length) return null;

      const currentName = found[0].assessment_name;
      if (assessment_name === currentName) {
        await this.assessmentDao.updateAssessmentWithoutName(
          assessment_id,
          description,
          status,
          assessment_status,
          last_update
        );
      } else {
        const dup = await this.assessmentDao.getAssessmentByTitle(assessment_name);
        if (dup.length > 0) return null;

        await this.assessmentDao.updateAssessmentWithName(
          assessment_id,
          assessment_name,
          description,
          status,
          assessment_status,
          last_update
        );
      }

      await redis.del("assessment:all");
      const [result] = await this.assessmentDao.getAssessmentByID(assessment_id);
      return result || null;
    } catch (error) {
      this.logError("❌ Error in updateAssessment", error);
      throw error;
    }
  }
  // ------------------- ใหม่: create ทั้งก้อน -------------------


  public async addAssessmentFull(data: any) {
    try {
      return await this.assessmentDao.addAssessmentFull(data);
    } catch (error) {
      this.logError("❌ Error in addAssessmentFull", error);
      throw error;
    }
  }

  public async getAssessmentFullById(id: number) {
    try {
      return await this.assessmentDao.getAssessmentFullById(id);
    } catch (error) {
      this.logError("❌ Error in getAssessmentFullById", error);
      throw error;
    }
  }


  public async createAssessmentFull(payload: any) {
    const dataSource = await connectDatabase();

    return await dataSource.transaction(async (manager) => {
      // 1) Assessment
      const assessmentResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Assessment)
        .values({
          assessment_name: payload.assessment_name,
          description: payload.description,
          status: payload.status,
          assessment_status: payload.assessment_status,
          create_date: new Date(payload.create_date),
          last_update: new Date(payload.last_update),
        })
        .returning("*")
        .execute();

      const assessment = assessmentResult.raw[0];
      const assessment_id = assessment.assessment_id;

      // 2) Sections
      for (const s of payload.sections || []) {
        const sectionResult = await manager
          .createQueryBuilder()
          .insert()
          .into(SetNumber)
          .values({
            name: s.name,              // ✅ ใช้ name
            status: s.status || "Active",
            assessment_id,
          })
          .returning("*")
          .execute();

        const set_number_id = sectionResult.raw[0].set_number_id;

        // 3) Questions
        for (const q of s.questions || []) {
          const questionResult = await manager
            .createQueryBuilder()
            .insert()
            .into(Question)
            .values({
              question_text: q.question_text,   // ✅ ใช้ question_text
              question_type: q.question_type,   // ✅ ใช้ question_type
              question_number: q.question_number,
              set_number_id,
            })
            .returning("*")
            .execute();

          const question_id = questionResult.raw[0].question_id;

          // 4) Choices
          for (const opt of q.choices || []) {
            await manager
              .createQueryBuilder()
              .insert()
              .into(Choice)
              .values({
                choice_text: opt.choice_text,   // ✅ ใช้ choice_text
                choice_number: opt.choice_number,
                question: { question_id },                   // ✅ ใช้ foreign key ตรง ๆ
              })
              .execute();
          }
        }
      }

      await redis.del("assessment:all");
      return { assessment_id, message: "✅ Assessment created successfully" };
    });
  }

  public async deleteAssessment(assessment_id: number): Promise<boolean> {
    const Find_Assessment = await this.assessmentDao.getAssessmentByID(assessment_id)
    const AssessmentID = Find_Assessment[0].assessment_id
    const Find_SetNumber = await this.setNumberDao.getSetNumbersByAssessmentID(AssessmentID)
    const Find_Question = await this.questionDao.getQuestionByAssessmentID(AssessmentID)
    const Find_Choice = await this.choiceDao.getChoiceByAssessmentID(AssessmentID)
    try {
      if (Find_Assessment.length > 0) {
        if (Find_SetNumber.length > 0) {
          if (Find_Question.length > 0) {
            if (Find_Choice.length > 0) {
              await this.choiceDao.deleteChoiceByAssesmentID(AssessmentID)
              await this.questionDao.deleteChoiceByAssesmentID(AssessmentID)
              await this.setNumberDao.deleteSetNumberByAssessmentID(AssessmentID)
              await this.assessmentDao.deleteAssessment(AssessmentID)
              return true;
            } else {
              await this.questionDao.deleteChoiceByAssesmentID(AssessmentID)
              await this.setNumberDao.deleteSetNumberByAssessmentID(AssessmentID)
              await this.assessmentDao.deleteAssessment(AssessmentID)
              return true;
            }
          } else {
            await this.setNumberDao.deleteSetNumberByAssessmentID(AssessmentID)
            await this.assessmentDao.deleteAssessment(AssessmentID)
            return true;
          }
        } else {
          await this.assessmentDao.deleteAssessment(AssessmentID);
          return true;
        }
      } else {
        console.log(`ไม่พบ Assessment ID ${assessment_id} อยู่ในระบบ`)
        return false;
      }
    } catch (error) {
      this.logError("❌ Error in getAssessmentFullById", error);
      throw error;
    }
  }
}
