import { ActivityDao } from "../../daos/Test/activity.dao";
import { Activity } from "../../entity/Activity";
export class ActivityService {
  private activityDao = new ActivityDao();

  async getAllActivitys(): Promise<Activity[]> {
    return await this.activityDao.getAllActivities();
  }

  async getActivitiesById(id: number): Promise<Activity | null> {
    return await this.activityDao.getActivityById(id);
  }

  async searchActivitiesByName(searchTerm: string): Promise<Activity[]> {
    return await this.activityDao.searchActivitiesByName(searchTerm); // เรียกใช้ searchActivitiesByName จาก ActivityDao
  }
}
