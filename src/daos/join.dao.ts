import { DataSource } from "typeorm";
import { Join } from "../entity/join.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class JoinDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ JoinDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async findJoinByStudentAndActivity(
    studentId: number,
    activityDetailId: number
  ): Promise<Join | null> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.getRepository(Join).findOne({
        where: {
          students_id: studentId,
          activity_detail_id: activityDetailId,
        },
      });
      return result;
    } catch (error) {
      this.logDbError("findJoinByStudentAndActivity", error);
      throw error;
    }
  }

  public async findJoinByStudentAndActivityId(
    studentId: number,
    activityId: number
  ): Promise<Join | null> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT j.*
         FROM "join" j
         INNER JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
         WHERE j.students_id = $1 AND ad.activity_id = $2`,
        [studentId, activityId]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("findJoinByStudentAndActivityId", error);
      throw error;
    }
  }

  public async createJoin(
    studentId: number,
    activityDetailId: number,
    foodChoices: string[]
  ): Promise<Join> {
    this.checkConnection();
    const result = await this.dataSource!.query(
      `INSERT INTO "join" (students_id, activity_detail_id, join_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [studentId, activityDetailId, new Date(), "Pending"]
    );
    return result[0];
  }

  public async updateActivityDetailWithFood(
    activityDetailId: number,
    foodChoices: string[]
  ): Promise<void> {
    this.checkConnection();
    await this.dataSource!.query(
      `UPDATE activity_detail SET food_choices = $1 WHERE activity_detail_id = $2`,
      [foodChoices.join(","), activityDetailId]
    );
  }

  public async deleteJoin(join_id: number): Promise<void> {
    this.checkConnection();
    try {
      const repo = this.dataSource!.getRepository(Join);
      await repo.delete({ join_id });
    } catch (error) {
      this.logDbError("deleteJoin", error);
      throw error;
    }
  }
}
