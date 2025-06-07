import { DataSource } from "typeorm";
import { Activity } from "../../entity/activity.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class ActivityDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ ActivityDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async createActivityDao(data: Partial<Activity>, foodIds: number[] = []): Promise<Activity>
 {
    this.checkConnection();

    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Insert Activity
      const result = await queryRunner.query(
        `
        INSERT INTO Activity (
          activity_name, presenter_company_name, type, description,
          seat, recieve_hours, event_format, create_activity_date,
          special_start_register_date, start_register_date, end_register_date,
          start_activity_date, end_activity_date, image_url,
          activity_status, activity_state, status, last_update_activity_date,
          url, assessment_id, room_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *
        `,
        [
          data.activity_name,
          data.presenter_company_name || null,
          data.type || "Soft",
          data.description || null,
          data.seat ?? null,
          data.recieve_hours ?? null,
          data.event_format || "Online",
          new Date(),
          data.special_start_register_date || null,
          data.start_register_date || null,
          data.end_register_date || null,
          data.start_activity_date || null,
          data.end_activity_date || null,
          data.image_url || null,
          data.activity_status || "Private",
          data.activity_state || "Not Start",
          data.status || "Active",
          new Date(),
          data.url || null,
          data.assessment_id ?? null,
          data.room_id ?? null,
        ]
      );

      const newActivity: Activity = result[0];

      // Insert ActivityFood
      if (foodIds.length > 0) {
  const values = foodIds.map(
    (foodId) => `(${newActivity.activity_id}, ${foodId})`
  );
  const insertFoodSQL = `
    INSERT INTO activity_food (activity_id, food_id)
    VALUES ${values.join(", ")}
  `;
  await queryRunner.query(insertFoodSQL);
}



      await queryRunner.commitTransaction();
      return newActivity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logDbError("createActivityDao", error);
      throw new Error("❌ Failed to create activity with food");
    } finally {
      await queryRunner.release();
    }
  }
}
