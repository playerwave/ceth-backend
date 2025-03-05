import { AppDataSource } from "../../db/database";
import { Activity } from "../../entity/Activity"; 
import { Repository } from "typeorm";

export class ActivityDao {
  private static activityRepo: Repository<Activity> = AppDataSource.getRepository(Activity);

  static async getAllActivities(): Promise<Activity[]> {
    return await this.activityRepo.find();
  }

  static async getActivityById(id: number): Promise<Activity | null> {
    return await this.activityRepo.findOne({ where: { ac_id: id } });
  }

  static async createActivity(newActivity: Partial<Activity>): Promise<Activity> {
    const activity = this.activityRepo.create(newActivity);
    return await this.activityRepo.save(activity);
  }

  static async updateActivity(id: number, updatedData: Partial<Activity>): Promise<Activity | null> {
    const activity = await this.activityRepo.findOne({ where: { ac_id: id } });
    if (!activity) return null;

    Object.assign(activity, updatedData);
    return await this.activityRepo.save(activity);
  }

  static async deleteActivity(id: number): Promise<boolean> {
    const result = await this.activityRepo.delete(id);
    return result.affected !== 0;
  }
}
