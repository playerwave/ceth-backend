import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";
import { QuestionVersion } from "../../entity/Assessment/versioning assessment/question-version.entity";

export interface CreateQuestionVersionDto {
  set_number_version_id: number;
  order_index: number;
  question_text: string;
  question_type: "single_choice" | "multi_choice" | "text" | "rating";
}

export class QuestionVersionDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ QuestionVersionDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource) {
      this.dataSource = await connectDatabase();
    }
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  /**
   * สร้าง question version ใหม่
   */
  public async createQuestionVersion(data: CreateQuestionVersionDto): Promise<QuestionVersion> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `INSERT INTO question_version (set_number_version_id, order_index, question_text, question_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.set_number_version_id, data.order_index, data.question_text, data.question_type]
      );
      
      return result[0];
    } catch (error) {
      this.logDbError("createQuestionVersion", error);
      throw error;
    }
  }

  /**
   * ดึง questions ของ set number version
   */
  public async getQuestionsBySetNumberVersion(setNumberVersionId: number): Promise<QuestionVersion[]> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM question_version 
         WHERE set_number_version_id = $1 
         ORDER BY order_index ASC`,
        [setNumberVersionId]
      );
      
      return result;
    } catch (error) {
      this.logDbError("getQuestionsBySetNumberVersion", error);
      throw error;
    }
  }

  /**
   * Clone questions จาก set number เก่าไป set number version ใหม่
   */
  public async cloneQuestionsFromSetNumber(fromSetNumberId: number, toSetNumberVersionId: number): Promise<QuestionVersion[]> {
    await this.checkConnection();
    
    try {
      // ดึง questions จาก set number เก่า
      const fromQuestions = await this.dataSource!.query(
        `SELECT * FROM question WHERE set_number_id = $1 ORDER BY question_number ASC`,
        [fromSetNumberId]
      );
      
      // Clone ไปยัง set number version ใหม่
      const clonedQuestions: QuestionVersion[] = [];
      
      for (const question of fromQuestions) {
        // แปลง question_type ให้ตรงกับ enum ใหม่
        const newQuestionType = this.mapQuestionType(question.question_type);
        
        const cloned = await this.createQuestionVersion({
          set_number_version_id: toSetNumberVersionId,
          order_index: question.question_number || 1,
          question_text: question.question_text,
          question_type: newQuestionType
        });
        clonedQuestions.push(cloned);
      }
      
      return clonedQuestions;
    } catch (error) {
      this.logDbError("cloneQuestionsFromSetNumber", error);
      throw error;
    }
  }

  /**
   * แปลง question_type จาก enum เก่าเป็น enum ใหม่
   */
  private mapQuestionType(oldType: string): "single_choice" | "multi_choice" | "text" | "rating" {
    switch (oldType) {
      case "Fix Single answer":
        return "rating";
      case "Single answer":
        return "single_choice";
      case "Multiple answer":
        return "multi_choice";
      case "Text answer":
        return "text";
      default:
        return "text";
    }
  }

  /**
   * ลบ question version
   */
  public async deleteQuestionVersion(versionId: number): Promise<void> {
    await this.checkConnection();
    
    try {
      await this.dataSource!.query(
        `DELETE FROM question_version WHERE question_version_id = $1`,
        [versionId]
      );
    } catch (error) {
      this.logDbError("deleteQuestionVersion", error);
      throw error;
    }
  }

  /**
   * ดึง question version ตาม ID
   */
  public async getQuestionVersionById(versionId: number): Promise<QuestionVersion | null> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM question_version WHERE question_version_id = $1`,
        [versionId]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getQuestionVersionById", error);
      throw error;
    }
  }
}
