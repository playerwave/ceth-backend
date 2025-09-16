import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";
import { SetNumberVersion } from "../../entity/assessment/versioning assessment/setNumber-version.entity";

export interface CreateSetNumberVersionDto {
  assessment_version_id: number;
  order_index: number;
  name: string;
  description?: string;
}

export class SetNumberVersionDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ SetNumberVersionDao initialized");
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
   * สร้าง set number version ใหม่
   */
  public async createSetNumberVersion(data: CreateSetNumberVersionDto): Promise<SetNumberVersion> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `INSERT INTO set_number_version (assessment_version_id, order_index, name, description, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [data.assessment_version_id, data.order_index, data.name, data.description]
      );
      
      return result[0];
    } catch (error) {
      this.logDbError("createSetNumberVersion", error);
      throw error;
    }
  }

  /**
   * ดึง set numbers ของ assessment version
   */
  public async getSetNumbersByAssessmentVersion(assessmentVersionId: number): Promise<SetNumberVersion[]> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM set_number_version 
         WHERE assessment_version_id = $1 
         ORDER BY order_index ASC`,
        [assessmentVersionId]
      );
      
      return result;
    } catch (error) {
      this.logDbError("getSetNumbersByAssessmentVersion", error);
      throw error;
    }
  }

  /**
   * Clone set numbers จากเวอร์ชันเก่าไปเวอร์ชันใหม่
   */
  public async cloneSetNumbersFromVersion(fromVersionId: number, toVersionId: number): Promise<SetNumberVersion[]> {
    await this.checkConnection();
    
    try {
      // ดึง set numbers จากเวอร์ชันเก่า
      const fromSetNumbers = await this.getSetNumbersByAssessmentVersion(fromVersionId);
      
      // Clone ไปยังเวอร์ชันใหม่
      const clonedSetNumbers: SetNumberVersion[] = [];
      
      for (const setNumber of fromSetNumbers) {
        const cloned = await this.createSetNumberVersion({
          assessment_version_id: toVersionId,
          order_index: setNumber.order_index,
          name: setNumber.name,
          description: setNumber.description
        });
        clonedSetNumbers.push(cloned);
      }
      
      return clonedSetNumbers;
    } catch (error) {
      this.logDbError("cloneSetNumbersFromVersion", error);
      throw error;
    }
  }

  /**
   * ลบ set number version
   */
  public async deleteSetNumberVersion(versionId: number): Promise<void> {
    await this.checkConnection();
    
    try {
      await this.dataSource!.query(
        `DELETE FROM set_number_version WHERE set_number_version_id = $1`,
        [versionId]
      );
    } catch (error) {
      this.logDbError("deleteSetNumberVersion", error);
      throw error;
    }
  }

  /**
   * ดึง set number version ตาม ID
   */
  public async getSetNumberVersionById(versionId: number): Promise<SetNumberVersion | null> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM set_number_version WHERE set_number_version_id = $1`,
        [versionId]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getSetNumberVersionById", error);
      throw error;
    }
  }
}
