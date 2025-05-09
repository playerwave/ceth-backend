import { Repository, getRepository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Activity } from "../../entity/Activity";
import { UserActivity } from "../../entity/UserActivity";
import { ErrorHandledDao } from "../error.handled.dao";

export class ActivityDao extends ErrorHandledDao {
  private activityRepository: Repository<Activity> | null = null;

  constructor() {
    super();
    this.initializeRepository();
  }

  private async initializeRepository(): Promise<void> {
    try {
      const connection = await connectDatabase();
      this.activityRepository = connection.getRepository(Activity);
      console.log("✅ Activity Repository initialized");
    } catch (error) {
      this.logDbError("initializeRepository", error);
    }
  }

  private checkRepository(): void {
    if (!this.activityRepository) {
      throw new Error("Database connection is not established");
    }
  }

  public async createActivityDao(
    activityData: Partial<Activity>
  ): Promise<Activity> {
    this.checkRepository();
    try {
      activityData.ac_food = this.normalizeFoodInput(activityData.ac_food);

      const activity = this.activityRepository!.create(activityData);
      const saved = await this.activityRepository!.save(activity);

      saved.ac_food = this.normalizeFoodOutput(saved.ac_food);
      return saved;
    } catch (error) {
      this.logDbError("createActivityDao", error);
      throw new Error("Failed to create activity");
    }
  }

  public async updateActivityDao(
    activityId: number,
    activityData: Partial<Activity>
  ): Promise<Activity> {
    this.checkRepository();
    try {
      const existing = await this.activityRepository!.findOne({
        where: { ac_id: activityId },
        relations: ["assessment"],
      });

      if (!existing)
        throw new Error(`Activity with ID ${activityId} not found`);

      activityData.ac_food = this.normalizeFoodInput(activityData.ac_food);
      activityData.ac_id = activityId;

      Object.assign(existing, activityData);
      const updated = await this.activityRepository!.save(existing);
      updated.ac_food = this.normalizeFoodOutput(updated.ac_food);
      return updated;
    } catch (error) {
      this.logDbError("updateActivityDao", error);
      throw new Error("Failed to update activity");
    }
  }

  public async getActivityByIdDao(
    activityId: number
  ): Promise<Activity | null> {
    this.checkRepository();
    try {
      return await this.activityRepository!.createQueryBuilder("activity")
        .leftJoinAndSelect("activity.assessment", "assessment")
        .where("activity.ac_id = :id", { id: activityId })
        .getOne();
    } catch (error) {
      this.logDbError("getActivityByIdDao", error);
      throw new Error("Failed to get activity by id");
    }
  }

  public async deleteActivityDao(activityId: number): Promise<boolean> {
    this.checkRepository();
    try {
      const userActivityRepository = getRepository(UserActivity);
      await userActivityRepository.delete({ activity: { ac_id: activityId } });

      const deleteResult = await this.activityRepository!.delete(activityId);
      return deleteResult.affected !== 0;
    } catch (error) {
      this.logDbError("deleteActivityDao", error);
      throw new Error("Failed to delete activity");
    }
  }

  public async getAllActivitiesDao(): Promise<Activity[]> {
    this.checkRepository();
    try {
      return await this.activityRepository!.find();
    } catch (error) {
      this.logDbError("getAllActivitiesDao", error);
      throw new Error("Failed to get all activities");
    }
  }

  public async searchActivityDao(ac_name: string): Promise<Activity[]> {
    this.checkRepository();
    try {
      const query =
        "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1 || '%' ORDER BY ac_id ASC";
      this.logQuery(query, [ac_name]);
      return await this.activityRepository!.query(query, [ac_name]);
    } catch (error) {
      this.logDbError("searchActivityDao", error);
      throw new Error("Error fetching activities");
    }
  }

  public async adjustStatusActivityDao(
    ac_id: number,
    ac_status: string
  ): Promise<Activity | null> {
    this.checkRepository();
    try {
      const query = `UPDATE activity SET ac_status = $1, ac_last_update = NOW() WHERE ac_id = $2 RETURNING *`;
      this.logQuery(query, [ac_status, ac_id]);

      const result = await this.activityRepository!.query(query, [
        ac_status,
        ac_id,
      ]);
      return result.length ? result[0] : null;
    } catch (error) {
      this.logDbError("adjustStatusActivityDao", error);
      throw new Error("Error updating activity status");
    }
  }

  public async getEnrolledStudentsListDao(activityId: number): Promise<any[]> {
    this.checkRepository();
    try {
      const userActivityRepository = getRepository(UserActivity);

      const result = await userActivityRepository
        .createQueryBuilder("useractivity")
        .innerJoin("useractivity.user", "user")
        .innerJoin("useractivity.activity", "activity")
        .where("activity.ac_id = :activityId", { activityId })
        .select([
          `"user"."u_id" AS id`,
          `"user"."u_fullname" AS fullname`,
          `"user"."u_std_id" AS studentId`,
          `"user"."u_role" AS role`,
          `"user"."u_soft_hours" AS softHours`,
          `"user"."u_hard_hours" AS hardHours`,
          `"user"."u_risk_soft" AS riskSoft`,
          `"user"."u_risk_hard" AS riskHard`,
          `"user"."u_risk_status" AS riskStatus`,
          `"useractivity"."uac_selected_food" AS selectedFood`,
        ])
        .getRawMany();

      return result;
    } catch (error) {
      this.logDbError("getEnrolledStudentsListDao", error);
      throw new Error("Failed to fetch enrolled students");
    }
  }

  private normalizeFoodInput(input: any): string[] {
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return [input];
      }
    }
    if (!Array.isArray(input)) return [];
    return input;
  }

  private normalizeFoodOutput(output: any): string[] {
    if (typeof output === "string") {
      try {
        return JSON.parse(output);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(output)) return [];
    return output;
  }
}
