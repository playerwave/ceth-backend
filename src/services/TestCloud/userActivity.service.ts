import { UserActivityDao } from "../../daos/TestCloud/userActivity.dao";
import { UserActivity } from "../../entity/UserActivity";
export class UserActivityService {
  private userActivityDao = new UserActivityDao();

  async getUserActivity(): Promise<UserActivity[]> {
    return await this.userActivityDao.getUserActivity();
  }
}
