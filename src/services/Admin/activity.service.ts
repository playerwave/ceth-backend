import { Activity } from "../../entity/Activity";
import { ActivityDao } from "../../daos/Admin/activity.dao";

export class ActivityService {
  private activityDao = new ActivityDao();

  async createActivityService(activityData: Partial<Activity>): Promise<Activity> {
    if (!activityData.ac_end_register) {
      const newEndRegister = new Date(activityData.ac_start_register!);
      newEndRegister.setDate(newEndRegister.getDate() + 7);
      activityData.ac_end_register = newEndRegister;
    }

    return await this.activityDao.createActivityDao({
      ...activityData,
      ac_create_date: new Date(),
      ac_last_update: new Date(),
    });
  }
}
