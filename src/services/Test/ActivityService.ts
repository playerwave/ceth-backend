import { ActivityDao } from "../../daos/Test/ActivityDao";

export class ActivityService {
  static getAllActivities() {
    return ActivityDao.getAllActivities();
  }

  static getActivityById(id: number) {
    return ActivityDao.getActivityById(id);
  }

  static createActivity(activityData: any) {
    return ActivityDao.createActivity(activityData);
  }

  static updateActivity(id: number, updatedData: any) {
    return ActivityDao.updateActivity(id, updatedData);
  }

  static deleteActivity(id: number) {
    return ActivityDao.deleteActivity(id);
  }
}
