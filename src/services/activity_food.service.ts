import { ActivityFoodDao } from "../daos/Admin/activity_food.dao";
import { ActivityFood } from "../interfaces/ActivityFood";

export class ActivityFoodService {
  private activityFoodDao = new ActivityFoodDao();

  async getAllActivityFoods(): Promise<ActivityFood[]> {
    return this.activityFoodDao.getAllActivityFoods();
  }

  async getActivityFoodById(id: number): Promise<ActivityFood | null> {
    return this.activityFoodDao.getActivityFoodById(id);
  }
}
