import { Repository } from 'typeorm';
import { connectDatabase } from '../../db/database';
import { Activity } from '../../entity/Activity';
import logger from '../../middleware/logger';
import { User } from '../../entity/User';
import { EventCoop } from '../../entity/EventCoop';

export class ActivityDao {
  private activityRepository: Repository<Activity> | null = null;

  constructor() {
    this.initializeRepository();
  }

  // ✅ ใช้ async function เพื่อรอการเชื่อมต่อฐานข้อมูล
  private async initializeRepository(): Promise<void> {
    try {
      const connection = await connectDatabase();
      this.activityRepository = connection.getRepository(Activity);
      console.log('✅ Activity Repository initialized');
    } catch (error) {
      console.error('❌ Error initializing ActivityDao(Admin):', error);
    }
  }

  private checkRepository(): void {
    if (!this.activityRepository) {
      throw new Error('Database connection is not established');
    }
  }

  async getAllActivitiesDao(userId: number): Promise<Activity[]> {
    this.checkRepository();

    try {
      logger.info(
        '📌 Fetching all public activities that user has not registered for',
      );

      // ใช้ `new Date()` เพื่อให้เป็นเวลาปัจจุบันในการเปรียบเทียบ
      const currentDate = new Date();

      return await this.activityRepository!.createQueryBuilder('activity')
        .leftJoin('activity.userActivities', 'user_activity')
        .where("activity.ac_status = 'Public'") // กรองกิจกรรมที่มีสถานะเป็น Public
        .andWhere(
          '(user_activity.u_id IS NULL OR user_activity.u_id != :userId)',
          { userId },
        ) // กรองกิจกรรมที่ userId ยังไม่ได้ลงทะเบียน
        .andWhere(
          '(activity.ac_registered_count < activity.ac_seat OR activity.ac_seat IS NULL OR activity.ac_seat = 0)',
        ) // กรองกิจกรรมที่มีการลงทะเบียนน้อยกว่า ac_seat หรือ ac_seat เป็น NULL หรือ 0
        .andWhere('activity.ac_end_register > :currentDate', { currentDate }) // กรองกิจกรรมที่ ac_end_register ยังไม่ผ่านวันที่ปัจจุบัน
        .andWhere(
          '(activity.ac_registered_count IS NULL OR activity.ac_registered_count < activity.ac_seat)',
        ) // กรองกิจกรรมที่ ac_registered_count น้อยกว่า ac_seat หรือ ac_seat เป็น NULL
        .getMany();
    } catch (error) {
      logger.error('❌ Error in getAllActivities(Admin):', error);
      throw new Error('Failed to get all activities');
    }
  }

  async adviceActivities(u_id: number): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error('Repository is not initialized');
    }
    try {
      const query =
        'SELECT a.ac_name, a.ac_type, a.ac_description, a.ac_start_time, a.ac_seat, EXTRACT(EPOCH FROM (a.ac_end_time - a.ac_start_time)) / 3600 AS hours_earned, u.u_soft_hours, u.u_hard_hours FROM users u JOIN activity a ON u.u_id = a.ac_id WHERE u_id = $1';
      const result = await this.activityRepository.query(query, [u_id]);
      return result;
    } catch (error) {
      console.log(`Error form adviceActivities Dao: ${error}`);
      throw new Error('Failed to adviceActivities');
    }
  }

  async getUsersById(u_id: number): Promise<User[]> {
    if (!this.activityRepository) {
      throw new Error('Repository is not initialized');
    }
    try {
      const query =
        'SELECT u.u_id, u.u_fullname, u.u_soft_hours, u.u_hard_hours FROM users u JOIN activity a ON u.u_id = a.ac_id WHERE u_id = $1';
      const result = await this.activityRepository.query(query, [u_id]);
      return result;
    } catch (error) {
      console.log(`Error form getUsersById Dao: ${error}`);
      throw new Error('Failed to getUsersById');
    }
  }

  async getStatusActivities(): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error('Repository is not initialized');
    }
    try {
      const query =
        "SELECT * FROM activity WHERE ac_status = 'public' AND ac_end_register <= (SELECT e_date FROM event_coop LIMIT 1)";
      const result = await this.activityRepository.query(query);
      return result;
    } catch (error) {
      console.log(`Error form getStatusActivities Dao: ${error}`);
      throw new Error('Failed to getStatusActivities');
    }
  }

  async getEventCoopActivities(): Promise<EventCoop[]> {
    if (!this.activityRepository) {
      throw new Error('Repository is not initialized');
    }
    try {
      const query = 'SELECT e_date FROM event_coop LIMIT 1';
      const result = await this.activityRepository.query(query);
      return result;
    } catch (error) {
      console.log(`Error form getEventCoopActivities Dao: ${error}`);
      throw new Error('Failed to getEventCoopActivities');
    }
  }

  async updateUserRiskSoft(u_id: number, u_risk_soft: number): Promise<User[]> {
    if (!this.activityRepository) {
      throw new Error('Repository is not initialized');
    }
    try {
      const query = "UPDATE public.users SET u_risk_soft = $1 WHERE u_id = $2;"
      const result = await this.activityRepository.query(query, [u_risk_soft, u_id])
      return result
    } catch (error) {
      console.log(`Error form updateUserRiskSoft Dao: ${error}`);
      throw new Error('Failed to updateUserRiskSoft');
    }
  }

  async updateUserRiskHard(u_id: number, u_risk_hard: number): Promise<User[]> {
    if (!this.activityRepository) {
      throw new Error('Repository is not initialized');
    }
    try {
      const query = "UPDATE public.users SET u_risk_hard = $1 WHERE u_id = $2;"
      const result = await this.activityRepository.query(query, [u_risk_hard, u_id])
      return result
    } catch (error) {
      console.log(`Error form updateUserRiskHard Dao: ${error}`);
      throw new Error('Failed to updateUserRiskHard');
    }
  }
}
