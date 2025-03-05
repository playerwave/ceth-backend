import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { Activity } from "../../entity/Activity";

export class ActivityDao {
    private activityRepository: Repository<Activity> | null = null;

    constructor() {
        connectDatabase()
            .then((connection) => {
                this.activityRepository = connection.getRepository(Activity);
            })
            .catch((error) => {
                console.error("Database connection failed:", error);
            })
    }


    async getActivities(): Promise<Activity[]> {
        if (!this.activityRepository) {
            throw new Error("Repository is not initialized")
        }
        try {
            const query = "SELECT * FROM activity"
            const result = await this.activityRepository.query(query)
            return result
        } catch (error) {
            console.log(`Error form Activity Dao: ${error}`)
            throw new Error("Failed to get activities")
        }
    }

    async searchActivity(ac_name: string): Promise<Activity[]> {
        if (!this.activityRepository) {
            throw new Error("Repository is not initialized")
        }
        try {
            const query = "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1  ||'%' ORDER BY ac_id ASC"
            const result = await this.activityRepository.query(query, [ac_name])
            return result;
        } catch (error) {
            console.log(`Error form Activity Dao: ${error}`)
            throw new Error("Failed to get activities")
        }
    }
}
