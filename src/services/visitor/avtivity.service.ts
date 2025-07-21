import redis from "../../config/redis";
import { ActivityDao } from "../../daos/visitor/activity.dao";
import { Activity } from "../../entity/activity.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class ActivityService extends ErrorHandledService {
    constructor(private readonly activityDao = new ActivityDao()) {
        super();
    }

    public async countActivity(): Promise<number> {
        try {
            const count = await this.activityDao.countActivity();
            this.logInfo("📊 Activity count fetched", { count });
            return count;
        } catch (error) {
            this.logError("❌ Error in countActivity", error);
            throw error;
        }
    }

    public async getAllActivityByVisitor(page: number, limit: number): Promise<Activity[]> {
        const cacheKey = `activityByVisitor:all:${page}:${limit}`;
        try {
            const cached = await redis.get(cacheKey)
            if (cached) {
                this.logInfo("📦 Returning cached Activity Visitor data");
                return JSON.parse(cached)
            }
            const data = await this.activityDao.getAllActivityByVisitor(page, limit)
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 60);
            this.logInfo("📤 Activity data retrieved and cached", {
                page,
                limit,
                count: data.length,
            });
            return data;
        } catch (error) {
            this.logError("❌ Error in getAllActivityByVisitor", error);
            throw error;
        }
    }
}