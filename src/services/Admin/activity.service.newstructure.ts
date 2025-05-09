import { Activity } from "../../entity/Activity";
import { Assessment } from "../../entity/Assessment";
import { ActivityDao } from "../../daos/Admin/activity.dao.newstructure";
import { AssessmentDao } from "../../daos/Admin/assessment.dao";
import { sendMailCreateActivity } from "../../mailer/email";
import { ErrorHandledService } from "../../services/error.handled.service";
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
  private readonly activityDao = new ActivityDao();
  private readonly assessmentDao = new AssessmentDao();

  constructor(
    private readonly timeCalculator: TimeCalculator = new DefaultTimeCalculator(),
    private readonly notifier: Notifier = new EmailNotifier()
  ) {
    super();
  }

  public async createActivityService(
    data: Partial<Activity> & { assessment_id?: number }
  ): Promise<Activity> {
    try {
      this.logInfo("📩 Received data in createActivityService", { data });

      const assessment = await this.resolveAssessment(data.assessment_id);

      if (this.isHourCalculable(data)) {
        data.ac_recieve_hours = this.timeCalculator.calculate(
          data.ac_start_time!,
          data.ac_end_time!
        );
      }

      if (data.ac_status === "Public") {
        data.ac_start_register = new Date();
        await this.notifier.notify();
      }

      const newActivity = await this.activityDao.createActivityDao({
        ...data,
        assessment,
        ac_create_date: new Date(),
        ac_last_update: new Date(),
      });

      this.logInfo("✅ Activity created successfully", { newActivity });
      return newActivity;
    } catch (error) {
      this.logError("❌ Error in createActivityService(Admin)", error);
      throw error;
    }
  }

  public async updateActivityService(
    id: number,
    data: Partial<Activity>
  ): Promise<Activity | null> {
    try {
      if (isNaN(id)) throw new Error("Invalid activity ID format");

      const existing = await this.activityDao.getActivityByIdDao(id);
      if (!existing) return null;

      if (data.ac_image_url) {
        this.logInfo("📸 New image detected, updating image...");
      }

      const updated = await this.activityDao.updateActivityDao(id, {
        ...data,
        ac_last_update: new Date(),
      });

      this.logInfo("✅ Activity updated successfully", { updated });
      return updated;
    } catch (error) {
      this.logError("❌ Error in updateActivityService(Admin)", error);
      throw error;
    }
  }

  public async deleteActivityService(id: number): Promise<boolean> {
    try {
      if (isNaN(id)) throw new Error("Invalid activity ID format");

      const existing = await this.activityDao.getActivityByIdDao(id);
      if (!existing) return false;

      await this.activityDao.deleteActivityDao(id);
      this.logInfo("✅ Activity deleted successfully", { activityId: id });
      return true;
    } catch (error) {
      this.logError("❌ Error in deleteActivityService(Admin)", error);
      throw error;
    }
  }

  public async getAllActivitiesService(): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.getAllActivitiesDao();
      this.logInfo("✅ Fetched all activities", { total: activities.length });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getAllActivitiesService(Admin)", error);
      throw error;
    }
  }

  public async getActivityByIdService(id: number): Promise<Activity | null> {
    try {
      if (isNaN(id)) throw new Error("Invalid activity ID format");
      return await this.activityDao.getActivityByIdDao(id);
    } catch (error) {
      this.logError("❌ Error in getActivityByIdService(Admin)", error);
      throw error;
    }
  }

  public async searchActivityService(ac_name: string): Promise<Activity[]> {
    try {
      const results = await this.activityDao.searchActivityDao(ac_name);
      this.logInfo("✅ Fetched activities by search", {
        ac_name,
        count: results.length,
      });
      return results;
    } catch (error) {
      this.logError("❌ Error in searchActivity(Admin)", error);
      throw error;
    }
  }

  public async adjustStatusActivityService(
    ac_id: number,
    ac_status: string
  ): Promise<Activity | null> {
    try {
      if (isNaN(ac_id)) throw new Error("Invalid activity ID format");
      const updated = await this.activityDao.adjustStatusActivityDao(
        ac_id,
        ac_status
      );
      this.logInfo("✅ Activity status updated", { ac_id, ac_status });
      return updated;
    } catch (error) {
      this.logError("❌ Error in adjustStatusActivity(Admin)", error);
      throw error;
    }
  }

  public async getEnrolledStudentsListService(id: number): Promise<any[]> {
    try {
      this.logInfo("📡 Fetching enrolled students", { id });
      return await this.activityDao.getEnrolledStudentsListDao(id);
    } catch (error) {
      this.logError("❌ Error in getEnrolledStudentsListService", error);
      throw error;
    }
  }

  private async resolveAssessment(id?: number): Promise<Assessment | null> {
    if (!id) return null;
    if (isNaN(id)) throw new Error("Invalid assessment_id format");
    return await this.assessmentDao.getAssessmentByIdDao(id);
  }

  private isHourCalculable(data: Partial<Activity>): boolean {
    return (
      data.ac_status === "Public" &&
      ["Onsite", "Online"].includes(data.ac_location_type || "") &&
      !!data.ac_start_time &&
      !!data.ac_end_time
    );
  }
}
