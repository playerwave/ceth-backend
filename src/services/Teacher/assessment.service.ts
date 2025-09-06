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

export class AssessmentService extends ErrorHandledService {
  constructor(private readonly assessmentDao = new AssessmentDao()) {
    super();
  }

  public async countAssessments(): Promise<number> {
    try {
      const count = await this.assessmentDao.countAssessments();
      this.logInfo("📊 Assessment count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countAssessments", error);
      throw error;
    }
  }

  public async getAssessments(
    page: number,
    limit: number
  ): Promise<Assessment[]> {
    const cacheKey = `assessment:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.assessmentData)) return parsed.assessmentData;
        return [];
      }

      const data = await this.assessmentDao.getAssessments(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Assessment data retrieved and cached", {
        page,
        limit,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getAssessments", error);
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
    const cacheKey = "assessment:all";

    try {
      const exists = await this.assessmentDao.getAssessmentByTitle(
        assessment_name
      );
      if (exists.length > 0) {
        this.logInfo("🚫 Duplicate assessment name", { assessment_name });
        return null;
      }

      const created = await this.assessmentDao.addAssessment(
        assessment_name,
        description,
        status,
        assessment_status,
       
        create_date,
        last_update
      );

      await redis.del(cacheKey);
      this.logInfo("🆕 Assessment created", {
        assessment_id: created.assessment_id,
      });

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
    const cacheKey = "assessment:all";

    try {
      const found = await this.assessmentDao.getAssessmentByID(assessment_id);
      if (!found.length) {
        this.logInfo("❌ Assessment not found", { assessment_id });
        return null;
      }

      const currentName = found[0].assessment_name;
      let updated: Assessment | null = null;

      if (assessment_name === currentName) {
        await this.assessmentDao.updateAssessmentWithoutName(
          assessment_id,
          description,
          status,
          assessment_status,
          
          last_update
        );
      } else {
        const dup = await this.assessmentDao.getAssessmentByTitle(
          assessment_name
        );
        if (dup.length > 0) {
          this.logInfo("🚫 Duplicate new assessment name", { assessment_name });
          return null;
        }

        await this.assessmentDao.updateAssessmentWithName(
          assessment_id,
          assessment_name,
          description,
          status,
          assessment_status,
          
          last_update
        );
      }

      await redis.del(cacheKey);
      const [result] = await this.assessmentDao.getAssessmentByID(
        assessment_id
      );
      this.logInfo("✏️ Assessment updated", { assessment_id });
      return result || null;
    } catch (error) {
      this.logError("❌ Error in updateAssessment", error);
      throw error;
    }
  }

  public async getAssessmentById(assessment_id: number): Promise<Assessment | null> {
  const cacheKey = `assessment:${assessment_id}`;

  try {
    // 1. ลองดึงจาก cache ก่อน
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Assessment;
    }

    // 2. ดึงจาก DB ผ่าน DAO
    const result = await this.assessmentDao.getAssessmentByID(assessment_id);

    if (!result || result.length === 0) {
      this.logInfo("❌ Assessment not found", { assessment_id });
      return null;
    }

    const assessment = result[0];

    // 3. เก็บลง cache
    await redis.set(cacheKey, JSON.stringify(assessment), "EX", 60);

    this.logInfo("📤 Assessment fetched by id", { assessment_id });
    return assessment;
  } catch (error) {
    this.logError("❌ Error in getAssessmentById", error);
    throw error;
  }
}


  public async deleteAssessment(
    assessment_id: number
  ): Promise<Assessment | null> {
    const cacheKey = "assessment:all";

    try {
      const deleted = await this.assessmentDao.deleteAssessment(assessment_id);
      await redis.del(cacheKey);

      if (!deleted) {
        this.logInfo("❌ No assessment deleted", { assessment_id });
        return null;
      }

      this.logInfo("🗑️ Assessment deleted", { assessment_id });
      return deleted;
    } catch (error) {
      this.logError("❌ Error in deleteAssessment", error);
      throw error;
    }
  }
}
