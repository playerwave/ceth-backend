import { Activity } from "../../entity/Activity";
import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
export class ActivityDao {
  private activityRepository: Repository<Activity> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.activityRepository = connection.getRepository(Activity);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getAcitvities(): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const activity = await this.activityRepository.find();
      return activity;
    } catch (error) {
      console.log(`Error From activity dao: ${error}`)
      throw new Error(`Error fetching all activities: ${error}`);
    }
  }

  async searchActivity(ac_name: string): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized")
    }
    try {
      const query = "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1 || '%' ORDER BY ac_id ASC"
      const result = await this.activityRepository.query(query, [ac_name]);
      return result
    } catch (error) {
      console.log(`Error From activity dao: ${error}`)
      throw new Error(`Error fetching all activities: ${error}`)
    }
  }

  async adjustStatusActivity(ac_id: number, ac_status: string): Promise<Activity | null> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized")
    }

    const status = ac_status.trim().toLowerCase();
    if (status !== "public" && status !== "private") {
      throw new Error("ค่าที่ส่งเข้ามาที่ ac_status ไม่ใช่ 'Public' หรือ 'Private'");
    }

    try {
      const query = `UPDATE activity SET ac_status = $1, ac_last_update = NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' WHERE ac_id = $2`;
      await this.activityRepository.query(query, [ac_status, ac_id])
      const querySelect = "SELECT * FROM activity WHERE ac_id = $1"
      const result = await this.activityRepository.query(querySelect, [ac_id]);
      return result
    } catch (error) {
      console.log(`Error From activity dao: ${error}`)
      throw new Error(`Error fetching all activities: ${error}`)
    }
  }


  // async getTest(): Promise<Activity[]> {
  //   if (!this.activityRepository) {
  //     throw new Error("Repository is not initialized")
  //   }
  //   try {
  //     const getTests = await this.activityRepository.query("SELECT * FROM activity");
  //     return getTests;
  //   } catch (error) {
  //     throw new Error(`Error fetching all activities: ${error}`)
  //   }
  // }
}
