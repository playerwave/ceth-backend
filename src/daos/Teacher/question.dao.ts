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
                , [set_number_id]);
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

    public async getQuestionByID(question_id: number): Promise<Question[]> {
        this.checkConnection();
        try {
            return await this.questionDao!.query(
                `SELECT * FROM question WHERE question_id = $1`,
                [question_id]
            );
        } catch (error) {
            this.logDbError("getQuestionByID", error);
            throw error;
        }
    }

    async addQuestion(
        question_text: string,
        set_number_id: number,
        question_type: string
    ): Promise<Question> {
        this.checkConnection();

        const q = question_text.trim();
        const t = question_type.trim();

        try {
            await this.questionDao!.query("BEGIN");
            // 🔒 ล็อกกันแข่งในชุดนี้
            await this.questionDao!.query("SELECT pg_advisory_xact_lock($1)", [set_number_id]);

            // หาหมายเลขข้อถัดไป
            const nextRows = await this.questionDao!.query(
                `SELECT COALESCE(MAX(question_number), 0) + 1 AS n FROM question WHERE set_number_id = $1`,
                [set_number_id]
            );
            const nextNumber = Number(nextRows?.[0]?.n ?? 1);

            // แทรกคำถามใหม่
            const rows = await this.questionDao!.query(
                `INSERT INTO question (question_text, question_number, set_number_id, question_type) VALUES ($1, $2, $3, $4)RETURNING *`,
                [q, nextNumber, set_number_id, t]
            );

            await this.questionDao!.query("COMMIT");
            return rows[0];
        } catch (err) {
            await this.questionDao!.query("ROLLBACK");
            this.logDbError("addQuestion", err);
            throw err;
        }
    }

    public async updateQuestionByText(question_id: number, question_text: string): Promise<Question[]> {
        this.checkConnection();
        try {
            return await this.questionDao!.query(
                `UPDATE question SET question_text = $1 WHERE question_id = $2 RETURNING *`,
                [question_text, question_id]
            );
        } catch (error) {
            this.logDbError("getQuestion", error);
            throw error;
        }
    }

    public async updateQuestionByType(question_id: number, question_type: string): Promise<Question[]> {
        this.checkConnection();
        try {
            return await this.questionDao!.query(
                `UPDATE question SET question_type = $1 WHERE question_id = $2 RETURNING *`,
                [question_type, question_id]
            );
        } catch (error) {
            this.logDbError("getQuestion", error);
            throw error;
        }
    }

    public async updateQuestionByTextType(question_id: number, question_text: string, question_type: string): Promise<Question[]> {
        this.checkConnection();
        try {
            return await this.questionDao!.query(
                `UPDATE question SET question_text = $1, question_type = $2 WHERE question_id = $3 RETURNING *`,
                [question_text, question_type, question_id]
            );
        } catch (error) {
            this.logDbError("getQuestion", error);
            throw error;
        }
    }

    public async deleteQuestion(question_id: number): Promise<Question[]> {
        this.checkConnection();
        try {
            return await this.questionDao!.query(
                `DELETE FROM question WHERE question_id = $1`,
                [question_id]
            );
        } catch (error) {
            this.logDbError("deleteQuestion", error);
            throw error;
        }
    }

}