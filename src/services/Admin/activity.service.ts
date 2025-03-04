// import entity
import { Activity } from "../../entity/Activity";

// import dao
import { ActivityDao } from "../../daos/Admin/activity.dao";

// import mailer
import { sendMail } from "../../mailer/email";


export class ActivityService {
  private activityDao = new ActivityDao();

  async createActivityService(activityData: Partial<Activity>): Promise<Activity> {
    if (!activityData.ac_end_register) {
      const newEndRegister = new Date(activityData.ac_start_register!);
      newEndRegister.setDate(newEndRegister.getDate() + 7);
      activityData.ac_end_register = newEndRegister;
    }

    //send email to student
    sendMail("65160169@go.buu.ac.th", "Test Email", "whatsup bro");

    return await this.activityDao.createActivityDao({
      ...activityData,
      ac_create_date: new Date(),
      ac_last_update: new Date(),
    });
  }
}
