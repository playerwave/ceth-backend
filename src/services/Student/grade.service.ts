import { ErrorHandledService } from "../error.handdled.service";
import { GradeDao } from "../../daos/Student/grade.dao";
import { Grade } from "../../entity/grade.entity";
import { CreateGradeDto, UpdateGradeDto } from "../../dtos/Student/grade.dto";
import redis from "../../config/redis";

export class GradeService extends ErrorHandledService {
  constructor(private readonly gradeDao = new GradeDao()) {
    super();
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

  public async createGrade(data: CreateGradeDto): Promise<Grade | null> {
    try {
      // ตรวจสอบว่า level ซ้ำหรือไม่
      const existingGrade = await this.gradeDao.getGradeByLevel(data.level);
      if (existingGrade) {
        this.logInfo("🚫 Duplicate grade level", { level: data.level });
        return null;
      }

      const grade = await this.gradeDao.createGrade(data.level, data.description, data.th_year);
      
      // ลบ cache
      await redis.del("grades:all");
      this.logInfo("🆕 Grade created", { level: data.level });

      return grade;
    } catch (error) {
      this.logError("❌ Error in createGrade", error);
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
      console.log(`🔍 [SERVICE] Updating grade_id: ${grade_id} with data:`, data);
      
      const found = await this.gradeDao.getGradeById(grade_id);
      console.log(`🔍 [SERVICE] Found grade:`, found);
      
      if (!found) {
        console.log(`❌ [SERVICE] Grade not found for grade_id: ${grade_id}`);
        this.logInfo("❌ Grade not found", { grade_id });
        return null;
      }

      // ตรวจสอบว่า level ซ้ำหรือไม่ (ถ้ามีการเปลี่ยน level)
      if (data.level && parseInt(data.level) !== found.level) {
        console.log(`🔍 [SERVICE] Checking for duplicate level: ${data.level} (different from current: ${found.level})`);
        const existingGrade = await this.gradeDao.getGradeByLevel(data.level);
        if (existingGrade && existingGrade.grade_id !== grade_id) {
          console.log(`🚫 [SERVICE] Duplicate grade level found:`, existingGrade);
          this.logInfo("🚫 Duplicate grade level", { level: data.level });
          return null;
        }
      } else if (data.level && parseInt(data.level) === found.level) {
        console.log(`✅ [SERVICE] Level unchanged: ${data.level} = ${found.level}, proceeding with update`);
      }

      console.log(`🔄 [SERVICE] Calling DAO updateGrade with:`, {
        grade_id,
        level: data.level,
        description: data.description,
        th_year: data.th_year
      });

      const grade = await this.gradeDao.updateGrade(grade_id, data.level, data.description, data.th_year);
      console.log(`✅ [SERVICE] DAO updateGrade result:`, grade);
      
      // ลบ cache
      await redis.del("grades:all");
      this.logInfo("✏️ Grade updated", { grade_id });

      return grade;
    } catch (error) {
      console.error(`❌ [SERVICE] Error in updateGrade:`, error);
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
