import { GradeDao } from "../../daos/Student/grade.dao.newstructure";
import { Grade } from "../../entity/grade.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";
import { CreateGradeDto, UpdateGradeDto } from "../../dtos/Student/grade.dto";

export class GradeService extends ErrorHandledService {
  private readonly gradeDao = new GradeDao();

  public async createGrade(data: CreateGradeDto): Promise<Grade | null> {
    try {
      // ตรวจสอบว่า level ซ้ำหรือไม่
      const existingGrade = await this.gradeDao.getGradeByLevel(data.level);
      if (existingGrade) {
        this.logInfo("🚫 Duplicate grade level", { level: data.level });
        return null;
      }

      const grade = await this.gradeDao.createGrade(data.level, data.description);
      
      // ลบ cache
      await redis.del("grades:all");
      this.logInfo("🆕 Grade created", { level: data.level });

      return grade;
    } catch (error) {
      this.logError("❌ Error in createGrade", error);
      throw error;
    }
  }

  public async getGrades(): Promise<Grade[]> {
    const cacheKey = "grades:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached grades data");
        return JSON.parse(cached);
      }

      const data = await this.gradeDao.getGrades();
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Grades data retrieved and cached", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getGrades", error);
      throw error;
    }
  }

  public async countGrades(): Promise<number> {
    try {
      const count = await this.gradeDao.countGrades();
      this.logInfo("📊 Grades count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countGrades", error);
      throw error;
    }
  }

  public async getGradeById(grade_id: number): Promise<Grade | null> {
    try {
      const grade = await this.gradeDao.getGradeById(grade_id);
      if (!grade) {
        this.logInfo("❌ Grade not found", { grade_id });
        return null;
      }
      return grade;
    } catch (error) {
      this.logError("❌ Error in getGradeById", error);
      throw error;
    }
  }

  public async updateGrade(grade_id: number, data: UpdateGradeDto): Promise<Grade | null> {
    try {
      const found = await this.gradeDao.getGradeById(grade_id);
      if (!found) {
        this.logInfo("❌ Grade not found", { grade_id });
        return null;
      }

      // ตรวจสอบว่า level ซ้ำหรือไม่ (ถ้ามีการเปลี่ยน level)
      if (data.level && parseInt(data.level) !== found.level) {
        const existingGrade = await this.gradeDao.getGradeByLevel(data.level);
        if (existingGrade) {
          this.logInfo("🚫 Duplicate grade level", { level: data.level });
          return null;
        }
      }

      const grade = await this.gradeDao.updateGrade(grade_id, data.level, data.description);
      
      // ลบ cache
      await redis.del("grades:all");
      this.logInfo("✏️ Grade updated", { grade_id });

      return grade;
    } catch (error) {
      this.logError("❌ Error in updateGrade", error);
      throw error;
    }
  }

  public async deleteGrade(grade_id: number): Promise<boolean> {
    try {
      const found = await this.gradeDao.getGradeById(grade_id);
      if (!found) {
        this.logInfo("❌ Grade not found", { grade_id });
        return false;
      }

      const deleted = await this.gradeDao.deleteGrade(grade_id);
      
      if (deleted) {
        // ลบ cache
        await redis.del("grades:all");
        this.logInfo("🗑️ Grade deleted", { grade_id });
      }

      return deleted;
    } catch (error) {
      this.logError("❌ Error in deleteGrade", error);
      throw error;
    }
  }
}
