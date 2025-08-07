import redis from "../../config/redis";
import { QuestionDao } from "../../daos/Teacher/question.dao";
import { Question } from "../../entity/question.entity";

import { ErrorHandledService } from "../error.handdled.service";

export class QuestionService extends ErrorHandledService {
    constructor(private readonly questionDao = new QuestionDao) {
        super();
    }

    public async countQuestion(): Promise<number> {
        try {
            const count = await this.questionDao.countQuestion();
            this.logInfo("📊 Question count fetched", { count });
            return count;
        } catch (error) {
            this.logError("❌ Error in countQuestion", error);
            throw error;
        }
    }

    public async getQuestion(page: number, limit: number): Promise<Question[]> {
        const cacheKey = `question:all:${page}:${limit}`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) return parsed;
                if (Array.isArray(parsed.questionData)) return parsed.questionData; // fallback legacy
                return [];
            }

            const data = await this.questionDao.getQuestion(page, limit);
            await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
            this.logInfo("📤 Question data retrieved and cached", {
                count: data.length,
                page,
                limit,
            });

            return data;
        } catch (error) {
            this.logError("❌ Error in getQuestion", error);
            throw error;
        }
    }
}
