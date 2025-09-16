import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";
import { Choice } from "../../entity/assessment/choice.entity";

type ChoiceRow = {
    choice_id: number;
    choice_text: string | null;
    question_id: number;
    choice_number: number;
};

export type ChoiceJoinAssessment = {
    choice_id: number;
    choice_text: string;
    question_id: number;
    choice_number: number;
    question_text: string;
    question_number: number;
    set_number_id: number;
    question_type: string;
    name: string;
    status: string
    assessment_id: number
}

export type ChoiceJoinSetNumber = {
    choice_id: number;
    choice_text: string;
    question_id: number;
    choice_number: number;
    question_text: string;
    question_number: number;
    set_number_id: number;
    question_type: string;
    name: string;
    status: string
}

export class ChoiceDao extends ErrorHandledDao {
    private choiceDao: DataSource | null = null;

    constructor() {
        super();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            this.choiceDao = await connectDatabase();
            console.log("✅ ChoiceDao initialized");
        } catch (error) {
            this.logDbError("initialize", error);
        }
    }

    private checkConnection(): void {
        if (!this.choiceDao?.isInitialized) {
            throw new Error("❌ Database connection is not established");
        }
    }

    public async countChoice(): Promise<number> {
        this.checkConnection();
        try {
            const result = await this.choiceDao!.query(
                `SELECT COUNT(*) FROM choice`
            );
            return parseInt(result[0].count);
        } catch (error) {
            this.logDbError("countChoice", error);
            throw error;
        }
    }

    // public async countChoiceBySetNumberID(set_number_id: number): Promise<number> {
    //     this.checkConnection();
    //     try {
    //         const result = await this.choiceDao!.query(
    //             `SELECT COUNT(*) FROM choice WHERE set_number_id = $1`
    //             , [set_number_id]);
    //         return parseInt(result[0].count);
    //     } catch (error) {
    //         this.logDbError("countChoice", error);
    //         throw error;
    //     }
    // }

    public async getChoice(): Promise<Choice[]> {
        this.checkConnection();

        try {
            return await this.choiceDao!.query(
                `SELECT  c.choice_id, sn.name, q.question_number, q.question_text, c.choice_number, c.choice_text FROM choice as c INNER JOIN question as q ON c.question_id = q.question_id INNER JOIN set_number as sn ON q.set_number_id = sn.set_number_id ORDER BY sn.set_number_id ASC, q.question_number ASC , c.choice_number ASC`
            );
        } catch (error) {
            this.logDbError("getChoice", error);
            throw error;
        }
    }

    public async getChoiceByQuestionID(question_id: number): Promise<Choice[]> {
        this.checkConnection();

        try {
            return await this.choiceDao!.query(
                `SELECT c.choice_id, q.question_number, q.question_text, c.choice_number, c.choice_text FROM choice as c INNER JOIN question as q ON c.question_id = q.question_id WHERE q.question_id = $1 ORDER BY q.question_number ASC , c.choice_number ASC`, [question_id]
            );
        } catch (error) {
            this.logDbError("getChoiceByQuestionID", error);
            throw error;
        }
    }

    public async getChoiceByID(choice_id: number): Promise<Choice[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `SELECT * FROM choice WHERE choice_id = $1`,
                [choice_id]
            );
        } catch (error) {
            this.logDbError("getChoiceByID", error);
            throw error;
        }
    }

    public async getChoiceByAssessmentID(assessment_id: number): Promise<ChoiceJoinAssessment[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `SELECT c.choice_id, c.choice_text, c.question_id, c.choice_number, q.question_text, q.question_number, q.set_number_id, q.question_type, sn.name, sn.status, sn.assessment_id FROM choice as c INNER JOIN question as q ON c.question_id = q.question_id INNER JOIN set_number as sn ON q.set_number_id = sn.set_number_id WHERE sn.assessment_id = $1`,
                [assessment_id]
            );
        } catch (error) {
            this.logDbError("getChoiceByAssessmentID", error);
            throw error;
        }
    }

    public async getChoiceBySetNumberID(set_number_id: number): Promise<ChoiceJoinSetNumber[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `SELECT c.choice_id, c.choice_text, c.question_id, c.choice_number, q.question_text, q.question_number, q.set_number_id, q.question_type, sn.name, sn.status FROM choice as c INNER JOIN question as q ON q.question_id = c.question_id INNER JOIN set_number as sn ON q.set_number_id = sn.set_number_id WHERE sn.set_number_id = $1`,
                [set_number_id]
            );
        } catch (error) {
            this.logDbError("getChoiceBySetNumberID", error);
            throw error;
        }
    }

    public async getChoiceNumberByQuestionID(question_id: number): Promise<number> {
        this.checkConnection();
        try {
            const rows = await this.choiceDao!.query(
                `SELECT COALESCE(MAX(choice_number), 0) AS max FROM choice WHERE question_id = $1`,
                [question_id]
            );
            return Number(rows?.[0]?.max ?? 0); // แปลงเป็น number ชัดเจน
        } catch (error) {
            this.logDbError("getChoiceNumberByQuestionID", error);
            throw error;
        }
    }

    // choice.dao.ts
    async addChoice(choice_text: string, question_id: number): Promise<ChoiceRow> {
        this.checkConnection();
        try {
            const sql = `WITH lock AS (SELECT pg_advisory_xact_lock($2::bigint)), next AS (SELECT COALESCE(MAX(choice_number), 0) + 1 AS n FROM choice WHERE question_id = $2) INSERT INTO choice (choice_text, question_id, choice_number) SELECT $1, $2, n FROM next RETURNING choice_id, choice_text, question_id, choice_number`;
            const rows = await this.choiceDao!.query(sql, [choice_text, question_id]);
            return rows[0] as ChoiceRow;
        } catch (error) {
            this.logDbError("addChoice", error);
            throw error;
        }
    }

    public async updateChoice(choice_id: number, choice_text: string): Promise<Choice[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `UPDATE choice SET choice_text = $1 WHERE choice_id = $2 RETURNING *`,
                [choice_text, choice_id]
            );
        } catch (error) {
            this.logDbError("updateChoice", error);
            throw error;
        }
    }

    public async deleteChoice(choice_id: number): Promise<Choice[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `DELETE FROM choice WHERE choice_id = $1`,
                [choice_id]
            );
        } catch (error) {
            this.logDbError("deleteChoice", error);
            throw error;
        }
    }

    public async deleteChoiceByQuestionID(question_id: number): Promise<Choice[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `DELETE FROM choice WHERE question_id = $1`,
                [question_id]
            );
        } catch (error) {
            this.logDbError("deleteChoice", error);
            throw error;
        }
    }

    public async deleteChoiceByAssesmentID(assessment_id: number): Promise<ChoiceJoinAssessment[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `DELETE FROM choice c USING question q JOIN set_number sn ON q.set_number_id = sn.set_number_id WHERE c.question_id = q.question_id AND sn.assessment_id = $1`,
                [assessment_id]
            );
        } catch (error) {
            this.logDbError("deleteChoiceByAssesmentID", error);
            throw error;
        }
    }

    public async deleteChoiceBySetnumberID(set_number_id: number): Promise<ChoiceJoinSetNumber[]> {
        this.checkConnection();
        try {
            return await this.choiceDao!.query(
                `DELETE FROM choice c USING question q JOIN set_number sn ON sn.set_number_id = q.set_number_id WHERE c.question_id = q.question_id AND sn.set_number_id = $1`,
                [set_number_id]
            );
        } catch (error) {
            this.logDbError("deleteChoiceBySetnumberID", error);
            throw error;
        }
    }
}