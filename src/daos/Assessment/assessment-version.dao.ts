import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";
import { AssessmentVersion } from "../../entity/Assessment/versioning assessment/assessment-version.entity";

export interface CreateAssessmentVersionDto {
  assessment_id: number;
  version_no: number;
  is_published?: boolean;
  published_at?: Date | null;
}

export class AssessmentVersionDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ AssessmentVersionDao initialized");
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
   * สร้าง assessment version ใหม่
   */
  public async createAssessmentVersion(data: CreateAssessmentVersionDto): Promise<AssessmentVersion> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `INSERT INTO assessment_version (assessment_id, version_no, is_published, published_at, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [data.assessment_id, data.version_no, data.is_published || false, data.published_at]
      );
      
      return result[0];
    } catch (error) {
      this.logDbError("createAssessmentVersion", error);
      throw error;
    }
  }

  /**
   * ดึง assessment versions ทั้งหมดของ assessment
   */
  public async getAssessmentVersions(assessmentId: number): Promise<AssessmentVersion[]> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM assessment_version 
         WHERE assessment_id = $1 
         ORDER BY version_no DESC`,
        [assessmentId]
      );
      
      return result;
    } catch (error) {
      this.logDbError("getAssessmentVersions", error);
      throw error;
    }
  }

  /**
   * ดึงเวอร์ชันล่าสุดที่ published
   */
  public async getLatestPublishedVersion(assessmentId: number): Promise<AssessmentVersion | null> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM assessment_version 
         WHERE assessment_id = $1 AND is_published = true 
         ORDER BY version_no DESC 
         LIMIT 1`,
        [assessmentId]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getLatestPublishedVersion", error);
      throw error;
    }
  }

  /**
   * ดึงเวอร์ชันตาม ID
   */
  public async getVersionById(versionId: number): Promise<AssessmentVersion | null> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM assessment_version WHERE assessment_version_id = $1`,
        [versionId]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getVersionById", error);
      throw error;
    }
  }

  /**
   * Publish เวอร์ชัน
   */
  public async publishVersion(versionId: number): Promise<void> {
    await this.checkConnection();
    
    try {
      await this.dataSource!.query(
        `UPDATE assessment_version 
         SET is_published = true, published_at = NOW() 
         WHERE assessment_version_id = $1`,
        [versionId]
      );
    } catch (error) {
      this.logDbError("publishVersion", error);
      throw error;
    }
  }

  /**
   * ดึง version number ถัดไป
   */
  public async getNextVersionNumber(assessmentId: number): Promise<number> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        `SELECT COALESCE(MAX(version_no), 0) + 1 as next_version 
         FROM assessment_version 
         WHERE assessment_id = $1`,
        [assessmentId]
      );
      
      return result[0].next_version;
    } catch (error) {
      this.logDbError("getNextVersionNumber", error);
      throw error;
    }
  }

  /**
   * Clone เวอร์ชันจากเวอร์ชันอื่น
   */
  public async cloneVersion(fromVersionId: number, toAssessmentId: number): Promise<AssessmentVersion> {
    await this.checkConnection();
    
    try {
      // ดึงข้อมูลเวอร์ชันต้นทาง
      const fromVersion = await this.getVersionById(fromVersionId);
      if (!fromVersion) {
        throw new Error("Source version not found");
      }

      // สร้างเวอร์ชันใหม่
      const nextVersionNo = await this.getNextVersionNumber(toAssessmentId);
      const newVersion = await this.createAssessmentVersion({
        assessment_id: toAssessmentId,
        version_no: nextVersionNo,
        is_published: false
      });

      return newVersion;
    } catch (error) {
      this.logDbError("cloneVersion", error);
      throw error;
    }
  }
}
