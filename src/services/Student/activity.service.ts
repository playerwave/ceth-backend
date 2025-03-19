import { Activity } from '../../entity/Activity';
import { ActivityDao } from '../../daos/Student/activity.dao';
import logger from '../../middleware/logger';
import dayjs from 'dayjs';
import { User } from '../../entity/User';
import moment from 'moment';

interface CustomRiskActivity {
  user: string | undefined;
  needSoft: number;
  needHard: number;
  softRisk: number;
  hardRisk: number;
  availableActivities: {
    name: string | undefined;
    type: string | undefined;
    amount: number | undefined;
    start_time: Date | undefined;
  }[];
  timeLeft: number;
}

export class ActivityService {
  private activityDao = new ActivityDao();

  async getAllActivitiesService(userId: number): Promise<Activity[]> {
    try {
      // ดึงข้อมูลกิจกรรมจาก DAO โดยกรองแค่กิจกรรมที่ผู้ใช้ยังไม่ได้ลงทะเบียน
      const activities = await this.activityDao.getAllActivitiesDao(userId);

      logger.info(
        '✅ Fetched all public activities that user has not registered for',
        {
          total: activities.length,
        },
      );

      return activities;
    } catch (error) {
      logger.error('❌ Error in getAllActivitiesService(Admin)', { error });
      throw error;
    }
  }

  async adviceActivities(u_id: number): Promise<Activity[]> {
    return await this.activityDao.adviceActivities(u_id);
  }

  async calculateRiskActivities(u_id: number): Promise<CustomRiskActivity[]> {
    try {
      const users = await this.activityDao.getUsersById(u_id);
      if (users.length === 0) {
        throw new Error(`User with id=${u_id} not found.`);
      }

      const statusActivities = await this.activityDao.getStatusActivities();
      const eventCoopActivities = await this.activityDao.getEventCoopActivities();

      const result: CustomRiskActivity[] = [];

      for (let user of users) {
        if (!user.u_fullname) {
          throw new Error('User fullname is missing');
        }

        const softRequired = 30;
        const hardRequired = 10;

        const softCurrent = user.u_soft_hours ?? 0;
        const hardCurrent = user.u_hard_hours ?? 0;

        const needSoft = softRequired - softCurrent;
        const needHard = hardRequired - hardCurrent;

        let totalSoftAvailable = 0;
        let totalHardAvailable = 0;

        for (let activity of statusActivities) {
          if (activity.ac_type === 'soft') {
            if (activity.ac_scope_time) {
              totalSoftAvailable += activity.ac_scope_time;
            }
          } else if (activity.ac_type === 'hard') {
            if (activity.ac_scope_time) {
              totalHardAvailable += activity.ac_scope_time;
            }
          }

          let softRisk = needSoft > 0 ? (needSoft / softRequired) * 100 : 0;
          let hardRisk = needHard > 0 ? (needHard / hardRequired) * 100 : 0;

          const timeLeft = moment(eventCoopActivities[0].e_date).diff(moment(), 'days');

          let timeFactor = 1;
          if (timeLeft > 90) {
            timeFactor = 1;
          } else if (timeLeft <= 90 && timeLeft > 60) {
            timeFactor = 1.1;
          } else if (timeLeft <= 60 && timeLeft > 30) {
            timeFactor = 1.2;
          } else if (timeLeft <= 30 && timeLeft > 10) {
            timeFactor = 1.5;
          } else if (timeLeft <= 10) {
            timeFactor = 2;
          }

          softRisk *= timeFactor;
          hardRisk *= timeFactor;

          result.push({
            user: user.u_fullname,  // ถ้า `u_fullname` มีค่า จะถูกแสดงที่นี่
            needSoft,
            needHard,
            softRisk,
            hardRisk,
            availableActivities: statusActivities.map((activity) => ({
              name: activity.ac_name,
              type: activity.ac_type,
              amount: activity.ac_scope_time,
              start_time: activity.ac_start_time,
            })),
            timeLeft,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error('❌ Error in calculateRiskActivities(Student)', { error });
      throw error;
    }
  }
}
