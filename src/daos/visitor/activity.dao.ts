import { DataSource, Repository } from "typeorm";
import { Activity } from "../../entity/activity.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class ActivityDao extends ErrorHandledDao {
    private activityDao: DataSource | null = null;

    constructor() {
        super();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            this.activityDao = await connectDatabase();
            console.log("✅ Actitivity Dao By Visitor initialized");
        } catch (error) {
            this.logDbError("initialize", error);
        }
    }

    private checkConnection(): void {
        if (!this.activityDao) {
            throw new Error("❌ Database connection is not established");
        }
    }

    public async countActivity(): Promise<number> {
        this.checkConnection();
        try {
            const sql = `SELECT COUNT(*) FROM activity WHERE activity.status = 'Active' AND activity.activity_status = 'Public' AND activity.activity_state = 'Open Register'`;
            const result = await this.activityDao!.query(sql);
            return result[0].count;
        } catch (error) {
            this.logDbError("countActivity", error);
            throw error;
        }
    }

    async getAllActivityByVisitor(page: number, limit: number): Promise<Activity[]> {
        this.checkConnection();
        try {
            const offset = (page - 1) * limit;
            const sql = `SELECT (activity_name, presenter_company_name, type, description, seat, recieve_hours, event_format, special_start_register_date, end_register_date, start_activity_date, end_activity_date, image_url, activity_state, room.room_name ) FROM activity INNER JOIN room ON activity.room_id = room.room_id WHERE activity.status = 'Active' AND activity.activity_status = 'Public' AND activity.activity_state = 'Open Register' ORDER BY activity_id ASC LIMIT $1 OFFSET $2`
            const result = await this.activityDao?.query(sql, [limit, offset])
            return result
        } catch (error) {
            this.logDbError("countDepartment", error);
            throw error;
        }
    }
}