import redis from "../../config/redis";
import { ChoiceDao } from "../../daos/Teacher/choice.dao";
import { QuestionDao } from "../../daos/Teacher/question.dao";
import { Choice } from "../../entity/choice.entity";

import { ErrorHandledService } from "../error.handdled.service";

export class ChoiceService extends ErrorHandledService {
    constructor(private readonly choiceDao = new ChoiceDao, private readonly questionDao = new QuestionDao) {
        super();
    }


    public async countChoice(): Promise<number> {
        try {
            const count = await this.choiceDao.countChoice();
            this.logInfo("📊 Choice count fetched", { count });
            return count;
        } catch (error) {
            this.logError("❌ Error in countChoice", error);
            throw error;
        }
    }

    public async getChoice(): Promise<Choice[]> {
        const cacheKey = `choice:all`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) return parsed;
                if (Array.isArray(parsed.choiceData)) return parsed.choiceData; // fallback legacy
                return [];
            }

            const data = await this.choiceDao.getChoice();
            await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
            this.logInfo("📤 Choice data retrieved and cached", {
                count: data.length,
            });

            return data;
        } catch (error) {
            this.logError("❌ Error in getChoice", error);
            throw error;
        }
    }

    public async getChoiceByQuestionID(question_id: number): Promise<Choice[]> {
        try {
            const Choice = await this.choiceDao.getChoiceByQuestionID(question_id)
            if (Choice.length > 0) {
                return Choice
            } else {
                console.log(`ไม่พบคำถาม เลขที่ ID : ${Choice} อยูในระบบ`)
                return [];
            }
        } catch (error) {
            this.logError("❌ Error in getChoiceByQuestionID", error);
            throw error;
        }
    }

    public async addChoice(
        choice_text: string,
        question_id: number,
    ): Promise<Choice | null> {
        const text = (choice_text ?? "").trim();
        if (!text) {
            throw new Error("choice_text is required");
        }

        const found = await this.questionDao.getQuestionByID(question_id);

        try {
            if (found.length > 0) {
                // ✅ ใช้คำสั่งเดียวที่อะตอมมิก
                const created = await this.choiceDao.addChoice(text, question_id);
                return created as unknown as Choice;
            } else {
                console.log(`ไม่พบ Question ID : ${question_id} ในระบบ`);
                return null;
            }
        } catch (error) {
            this.logError("❌ Error in addChoice", error);
            throw error;
        }
    }


    public async updateChoice(choice_id: number, choice_text: string): Promise<Choice[]> {
        const Find_Choice = await this.choiceDao.getChoiceByID(choice_id);
        try {
            if (Find_Choice.length > 0) {
                const Text = choice_text.trim() || "";
                const ChoiceID = Find_Choice[0].choice_id
                const result = await this.choiceDao.updateChoice(ChoiceID, Text)
                return result
            } else {
                console.log(`ไม่พบคำตอบ ID : ${choice_id} อยู่ในระบบ`)
                return [];
            }
        } catch (error) {
            this.logError("❌ Error in updateChoice", error);
            throw error;
        }
    }

    public async deleteChoice(choice_id: number): Promise<Choice[]> {
        const Find_Choice = await this.choiceDao.getChoiceByID(choice_id);
        try {
            if (Find_Choice.length > 0) {
                const ID = Find_Choice[0].choice_id
                const result = await this.choiceDao.deleteChoice(ID)
                return result;
            } else {
                console.log(`ไม่พบคำถาม ID ${choice_id} อยู่ในระบบ`)
                return [];
            }
        } catch (error) {
            this.logError("❌ Error in updateChoice", error);
            throw error;
        }
    }

}
