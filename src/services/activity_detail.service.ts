import { ActivityDetailDao } from "../daos/Admin/activity_detail.dao";
import { ActivityDetail } from "../interfaces/ActivityDetail";

export class ActivityDetailService {
  private activityDetailDao = new ActivityDetailDao();

  async getAllActivityDetails(): Promise<ActivityDetail[]> {
    return this.activityDetailDao.getAllActivityDetails();
  }

  async getActivityDetailById(id: number): Promise<ActivityDetail | null> {
    return this.activityDetailDao.getActivityDetailById(id);
  }
}
