import redis from "../../config/redis";
import { GradeDao } from "../../daos/Student/grade.dao";
import { Grade } from "../../entity/grade.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class GradeService extends ErrorHandledService {
  constructor(private readonly gradeDao = new GradeDao()) {
    super();
  }

  public async countGrade(): Promise<number> {
    try {
      const count = await this.gradeDao.countGrade();
      this.logInfo("📊 Grade count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countGrade", error);
      throw error;
    }
  }

  public async getGrade(): Promise<Grade[]> {
    const cacheKey = `grade:all`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached grade data");
        return JSON.parse(cached);
      }

      const data = await this.gradeDao.getGrade();
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Grade data retrieved and cached", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getGrade", error);
      throw error;
    }
  }
}
