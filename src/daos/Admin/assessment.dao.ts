import { Repository } from 'typeorm';
import { connectDatabase } from '../../db/database';
import { Assessment } from '../../entity/Assessment';
import logger from '../../middleware/logger';

export class AssessmentDao {
  private assessmentRepository: Repository<Assessment> | null = null;

  constructor() {
    this.initializeRepository();
  }

  // ✅ ใช้ async function เพื่อรอการเชื่อมต่อฐานข้อมูล
  private async initializeRepository(): Promise<void> {
    try {
      const connection = await connectDatabase();
      this.assessmentRepository = connection.getRepository(Assessment);
      console.log('✅ Assesment Repository initialized');
    } catch (error) {
      console.error('❌ Error initializing AssesmentDao(Admin):', error);
    }
  }

  private checkRepository(): void {
    if (!this.assessmentRepository) {
      throw new Error('Database connection is not established');
    }
  }

  async getAllAssessmentsDao(): Promise<[Assessment[], number]> {
    this.checkRepository();

    try {
      console.log('📌 Fetching all assessments (No Pagination)');
      return await this.assessmentRepository!.findAndCount();
    } catch (error) {
      console.log('❌ Error in getAllAssessmentsDao(Admin):', error);
      throw new Error('Failed to get all assessments');
    }
  }

  async getAssessmentByIdDao(assessmentId: number): Promise<Assessment | null> {
    this.checkRepository();

    try {
      return await this.assessmentRepository!.findOneOrFail({
        where: { as_id: assessmentId },
        relations: ['activities'], // ✅ ใช้ "activities" แทน "assessment"
      });
    } catch (error) {
      logger.error(
        `❌ Error in getAssessmentByIdDao(Admin) ${assessmentId}:`,
        error,
      );
      throw new Error('Failed to get assessment by id');
    }
  }
}
