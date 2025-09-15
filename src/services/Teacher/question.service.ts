import redis from "../../config/redis";
import { ChoiceDao } from "../../daos/Teacher/choice.dao";
import { QuestionDao } from "../../daos/Teacher/question.dao";
import { SetNumberDao } from "../../daos/Teacher/setNumber.dao";
import { Question } from "../../entity/Assessment/question.entity";

import { ErrorHandledService } from "../error.handdled.service";

export class QuestionService extends ErrorHandledService {
    constructor(private readonly questionDao = new QuestionDao, private readonly choiceDao = new ChoiceDao, private readonly setNumberDao = new SetNumberDao()) {
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

    public async getQuestionBySetNumberID(set_number_id: number): Promise<Question[]> {
        try {
            const result = await this.questionDao.getQuestionBySetNumberID(set_number_id)
            return result
        } catch (error) {
            this.logError("❌ Error in countQuestion", error);
            throw error;
        }
    }

    public async addChoice(question_id: number, choice_text: string) {
        return await this.choiceDao.addChoice(choice_text, question_id);
    }


    private normalizeQuestionType(raw: string): Question["question_type"] {
        const s = (raw ?? "").trim().toLowerCase();
        if (s === "single answer" || s === "single") return "Single answer";
        if (s === "fix single answer" || s === "fix single") return "Fix Single answer";
        if (s === "multiple answer" || s === "multi answer" || s === "multiple")
            return "Multiple answer";
        if (s === "text answer" || s === "text") return "Text answer";
        throw new Error("question_type ไม่ถูกต้อง");
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

    // public async addQuestion(
    //     question_text: string,
    //     set_number_id: number,
    //     question_type: string
    // ): Promise<Question> {
    //     const text = (question_text ?? "").trim();
    //     const type = this.normalizeQuestionType(question_type); // <-- ใช้ตัว normalize ที่ตรง enum

    //     if (!Number.isInteger(set_number_id) || set_number_id <= 0) {
    //         throw new Error("set_number_id ไม่ถูกต้อง");
    //     }
    //     if (!text) {
    //         throw new Error("question_text ห้ามว่าง");
    //     }

    //     const created = await this.questionDao.addQuestion(text, set_number_id, type);
    //     await redis.del(`question:list:set:${set_number_id}`);
    //     return created;
    // }

    public async addQuestion(
        question_text: string,
        set_number_id: number,
        question_type: string
    ): Promise<Question | null> {
        const text = (question_text ?? "").trim();
        const type = this.normalizeQuestionType(question_type);

        if (!Number.isInteger(set_number_id) || set_number_id <= 0) {
            throw new Error("set_number_id ไม่ถูกต้อง");
        }
        if (!text) {
            throw new Error("question_text ห้ามว่าง");
        }

        // ✅ ตรวจสอบก่อนว่า set_number มีจริง
        const Find_SetNumber = await this.setNumberDao.getSetNumberByID(set_number_id);
        if (Find_SetNumber.length === 0) {
            console.log(`ไม่พบ SetNumber ID: ${set_number_id} ในระบบ`);
            return null;
        }

        const created = await this.questionDao.addQuestion(text, set_number_id, type);
        await redis.del(`question:list:set:${set_number_id}`);
        return created;
    }

    public async updateQuestion(question_id: number, question_text: string, question_type: string): Promise<Question[]> {
        const Find_Question = await this.questionDao.getQuestionByID(question_id);
        try {
            if (Find_Question.length > 0) {
                const QuestionID = Find_Question[0].question_id
                const TextStore = Find_Question[0].question_text
                const TypeStore = Find_Question[0].question_type
                const Text = question_text.trim();
                const Types = question_type.trim();
                if (question_text !== TextStore && question_type === TypeStore) {
                    const result = await this.questionDao.updateQuestionByText(QuestionID, Text)
                    return result;
                }

                if (question_text === TextStore && question_type !== TypeStore) {
                    const result = await this.questionDao.updateQuestionByType(QuestionID, Types)
                    return result;
                } else {
                    const result = await this.questionDao.updateQuestionByTextType(QuestionID, Text, Types)
                    return result
                }
            } else {
                console.log(`ไม่พบคำถาม ID ${question_id} อยู่ในระบบ`)
                return [];
            }
        } catch (error) {
            this.logError("❌ Error in updateQuestion", error);
            throw error;
        }
    }

    public async deleteQuestion(question_id: number): Promise<Question[]> {
        const Find_Question = await this.questionDao.getQuestionByID(question_id);
        const Choice_IN_Question = await this.choiceDao.getChoiceByQuestionID(question_id)
        try {
            if (Find_Question.length > 0) {
                const ID = Find_Question[0].question_id
                if (Choice_IN_Question.length > 0) {
                    await this.choiceDao.deleteChoiceByQuestionID(ID)
                    const result = await this.questionDao.deleteQuestion(ID)
                    return result;
                } else {
                    const result = await this.questionDao.deleteQuestion(ID)
                    return result;
                }
            } else {
                console.log(`ไม่พบคำถาม ID ${question_id} อยู่ในระบบ`)
                return [];
            }
        } catch (error) {
            this.logError("❌ Error in updateQuestion", error);
            throw error;
        }
    }

}
