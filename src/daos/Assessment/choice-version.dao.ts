import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";
import { ChoiceVersion } from "../../entity/assessment/versioning assessment/choice-version.entity";

export interface CreateChoiceVersionDto {
  question_version_id: number;
  order_index: number;
  choice_text: string;
}

export class ChoiceVersionDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ ChoiceVersionDao initialized");
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
   * สร้าง choice version ใหม่
   */
  public async createChoiceVersion(data: CreateChoiceVersionDto): Promise<ChoiceVersion> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `INSERT INTO choice_version (question_version_id, order_index, choice_text)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.question_version_id, data.order_index, data.choice_text]
      );
      
      return result[0];
    } catch (error) {
      this.logDbError("createChoiceVersion", error);
      throw error;
    }
  }

  /**
   * ดึง choices ของ question version
   */
  public async getChoicesByQuestionVersion(questionVersionId: number): Promise<ChoiceVersion[]> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM choice_version 
         WHERE question_version_id = $1 
         ORDER BY order_index ASC`,
        [questionVersionId]
      );
      
      return result;
    } catch (error) {
      this.logDbError("getChoicesByQuestionVersion", error);
      throw error;
    }
  }

  /**
   * Clone choices จาก question เก่าไป question version ใหม่
   */
  public async cloneChoicesFromQuestion(fromQuestionId: number, toQuestionVersionId: number): Promise<ChoiceVersion[]> {
    await this.checkConnection();
    
    try {
      // ดึง choices จาก question เก่า
      const fromChoices = await this.dataSource!.query(
        `SELECT * FROM choice WHERE question_id = $1 ORDER BY choice_number ASC`,
        [fromQuestionId]
      );
      
      // Clone ไปยัง question version ใหม่
      const clonedChoices: ChoiceVersion[] = [];
      
      for (const choice of fromChoices) {
        const cloned = await this.createChoiceVersion({
          question_version_id: toQuestionVersionId,
          order_index: choice.choice_number || 1,
          choice_text: choice.choice_text || ""
        });
        clonedChoices.push(cloned);
      }
      
      return clonedChoices;
    } catch (error) {
      this.logDbError("cloneChoicesFromQuestion", error);
      throw error;
    }
  }

  /**
   * ลบ choice version
   */
  public async deleteChoiceVersion(versionId: number): Promise<void> {
    await this.checkConnection();
    
    try {
      await this.dataSource!.query(
        `DELETE FROM choice_version WHERE choice_version_id = $1`,
        [versionId]
      );
    } catch (error) {
      this.logDbError("deleteChoiceVersion", error);
      throw error;
    }
  }

  /**
   * ดึง choice version ตาม ID
   */
  public async getChoiceVersionById(versionId: number): Promise<ChoiceVersion | null> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM choice_version WHERE choice_version_id = $1`,
        [versionId]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getChoiceVersionById", error);
      throw error;
    }
  }
}
