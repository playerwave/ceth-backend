import { ActivityDao } from "../../daos/Admin/activity.dao";
import { Activity } from "../../entity/Activity";

export class ActivityService {
  private activityDao = new ActivityDao();

  async getAllActivities(): Promise<Activity[]> {
    return await this.activityDao.getAllActivities();
  }

  async getActivityById(id: number): Promise<Activity | null> {
    return await this.activityDao.getActivityById(id);
  }
}
