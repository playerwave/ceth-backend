import { ActivityDao } from "../../daos/Admin/activity.dao";
import { Activity } from "../../entity/Activity";

export class ActivityService {
  async getAllActivities(): Promise<Activity[]> {
    return await ActivityDao.getAllActivities();
  }

  async getActivityById(id: number): Promise<Activity | null> {
    return await ActivityDao.getActivityById(id);
  }

  async createActivity(activityData: Partial<Activity>): Promise<Activity> {
    return await ActivityDao.createActivity(activityData);
  }

  async updateActivity(id: number, updatedData: Partial<Activity>): Promise<Activity | null> {
    return await ActivityDao.updateActivity(id, updatedData);
  }

  async deleteActivity(id: number): Promise<boolean> {
    return await ActivityDao.deleteActivity(id);
  }
}
