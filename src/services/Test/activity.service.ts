import { ActivityDao } from "../../daos/Test/activity.dao";
import { Activity } from "../../entity/Activity";

export class ActivityService {
    private activityDao = new ActivityDao();

    async getActivities(): Promise<Activity[]> {
        return await this.activityDao.getActivities();
    }

    async searchActivity(ac_name: string): Promise<Activity[]> {
        return await this.activityDao.searchActivity(ac_name);
    }
}