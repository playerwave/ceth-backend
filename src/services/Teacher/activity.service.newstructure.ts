import { Activity } from "../../entity/activity.entity";
import { Assessment } from "../../entity/assessment.entity";
import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
// import { AssessmentDao } from "../../daos/Admin/assessment.dao";
import { sendMailCreateActivity } from "../../mailer/email";
import { ErrorHandledService } from "../error.handled.service";
import dayjs from "dayjs";

// Strategy interface
interface TimeCalculator {
  calculate(start: Date | string, end: Date | string): number;
}

class DefaultTimeCalculator implements TimeCalculator {
  calculate(start: Date | string, end: Date | string): number {
    const s = dayjs(start);
    const e = dayjs(end);
    return e.hour() - s.hour();
  }
}

interface Notifier {
  notify(): Promise<void>;
}

class EmailNotifier implements Notifier {
  async notify(): Promise<void> {
    await sendMailCreateActivity(
      "65160169@go.buu.ac.th",
      "createActivity",
      "ทดสอบส่งอีเมล"
    );
  }
}

export class ActivityService extends ErrorHandledService {
  constructor(
    private readonly activityDao = new ActivityDao(),
    private readonly timeCalculator: TimeCalculator = new DefaultTimeCalculator(),
    private readonly notifier: Notifier = new EmailNotifier()
  ) {
    super();
  }

  public async createActivityService(
    data: Partial<Activity> & { food_ids?: (string | number)[] }
  ): Promise<Activity> {
    try {
      this.logInfo("📩 Received data in createActivityService", { data });

      // คำนวณ receive_hours ถ้าเวลาครบ
      if (this.isHourCalculable(data)) {
        data.recieve_hours = this.timeCalculator.calculate(
          data.start_activity_date!,
          data.end_activity_date!
        );
      }

      // ถ้า activity เป็น public ให้เริ่มลงทะเบียนทันทีและส่งเมล
      if (data.activity_status === "Public") {
        data.start_register_date = new Date();
        await this.notifier.notify();
      }

      const foodIds = (data.food_ids ?? [])
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));
      delete (data as any).food_ids;

      const newActivity = await this.activityDao.createActivityDao(
        {
          ...data,
          create_activity_date: new Date(),
          last_update_activity_date: new Date(),
        },
        foodIds
      );

      this.logInfo("✅ Activity created successfully", { newActivity });
      return newActivity;
    } catch (error) {
      this.logError("❌ Error in createActivityService(Admin)", error);
      throw error;
    }
  }

  public async getAllActivitiesService(): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.getAllActivitiesDao();
      this.logInfo("📤 Retrieved all activities", { count: activities.length });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getAllActivitiesService", error);
      throw error;
    }
  }

  public async softDeleteActivityService(id: number): Promise<boolean> {
    const activity = await this.activityDao.findById(id);
    if (!activity) return false;

    activity.status = "Inactive";
    activity.last_update_activity_date = new Date();
    await this.activityDao.save(activity);
    return true;
  }

  public async hardDeleteActivityService(id: number): Promise<boolean> {
    const activity = await this.activityDao.findById(id);
    if (!activity) return false;

    await this.activityDao.delete(id);
    return true;
  }

  private isHourCalculable(data: Partial<Activity>): boolean {
    return !!data.start_activity_date && !!data.end_activity_date;
  }
}
