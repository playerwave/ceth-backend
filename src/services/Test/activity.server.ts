import { ActivityDao } from "../../daos/Test/activity.dao";
import { Activity } from "../../entity/Activity";
export class ActivityService {
  private activityDao = new ActivityDao();

  async getAcitvities(): Promise<Activity[]> {
    return await this.activityDao.getAcitvities();
  }

  async searchActivity(ac_name: string): Promise<Activity[]> {
    return await this.activityDao.searchActivity(ac_name);
  }

  async adjustStatusActivity(ac_id: number, ac_status:string): Promise<Activity | null>{
    return await this.activityDao.adjustStatusActivity(ac_id, ac_status)
  }
  // async getTests(): Promise<Activity[]> {
  //   return await this.activityDao.getTest();
  // }
}
