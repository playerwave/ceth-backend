import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";
import { Question } from "../../entity/question.entity";

export class QuestionDao extends ErrorHandledDao {
    private questionDao: DataSource | null = null;

    constructor() {
        super();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            this.questionDao = await connectDatabase();
            console.log("✅ QuestionDao initialized");
        } catch (error) {
            this.logDbError("initialize", error);
        }
    }

    private checkConnection(): void {
        if (!this.questionDao?.isInitialized) {
            throw new Error("❌ Database connection is not established");
        }
    }

    public async countQuestion(): Promise<number> {
        this.checkConnection();
        try {
            const result = await this.questionDao!.query(
                `SELECT COUNT(*) FROM question`
            );
            return parseInt(result[0].count);
        } catch (error) {
            this.logDbError("countQuestion", error);
            throw error;
        }
    }

    public async countQuestionBySetNumberID(set_number_id: number): Promise<number> {
        this.checkConnection();
        try {
            const result = await this.questionDao!.query(
                `SELECT COUNT(*) FROM question WHERE set_number_id = $1`
            );
            return parseInt(result[0].count);
        } catch (error) {
            this.logDbError("countQuestion", error);
            throw error;
        }
    }

    public async getQuestion(page: number, limit: number): Promise<Question[]> {
        this.checkConnection();
        const offset = (page - 1) * limit;
        try {
            return await this.questionDao!.query(
                `SELECT * FROM question ORDER BY question_id ASC LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
        } catch (error) {
            this.logDbError("getQuestion", error);
            throw error;
        }
    }

    public async addQuestion(
        question_text: string,
        question_number: number,
        set_number_id: number,
        question_type: string
    ): Promise<Question> {
        this.checkConnection();
        try {
            const Question = question_text.trim();
            const Type = question_type.trim();
            const result = await this.questionDao!.query(
                `INSERT INTO question (question_text, question_number, set_number_id, question_type) VALUES ($1, $2, $3, $4) RETURNING *`,
                [Question, question_number, set_number_id, Type]
            );
            return result[0];
        } catch (error) {
            this.logDbError("addQuestion", error);
            throw error;
        }
    }
}