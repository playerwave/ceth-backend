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
  softCurrent: number;
  hardCurrent: number;
  softRisk: number;
  hardRisk: number;
  recommendedActivities: {  // เพิ่มฟิลด์ recommendedActivities
    name: string | undefined;
    type: string | undefined;
    start_time: Date | undefined;
    end_register: Date | undefined;
  }[];
  timeLeftForEvent?: number;  // เพิ่ม timeLeftForEvent ที่สามารถเป็น optional
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

  // ฟังก์ชันใหม่ที่ใช้ค้นหากิจกรรมที่ผู้ใช้ขาดและแนะนำ
  async recommendActivities(u_id: number): Promise<any[]> {
    try {
      const users = await this.activityDao.getUsersById(u_id);
      if (users.length === 0) {
        throw new Error(`User with id=${u_id} not found.`);
      }

      const statusActivities = await this.activityDao.getStatusActivities();

      const user = users[0];
      const softRequired = 30;
      const hardRequired = 10;

      const softCurrent = user.u_soft_hours ?? 0;
      const hardCurrent = user.u_hard_hours ?? 0;

      let needSoft = softRequired - softCurrent;
      let needHard = hardRequired - hardCurrent;

      const recommendedActivities = [];
      const recommendedActivityIds = new Set();  // เก็บ ID ของกิจกรรมที่แนะนำแล้ว

      if (needSoft > 0) {
        // ค้นหากิจกรรมที่ประเภท soft ที่เปิดให้ลงทะเบียน
        const softActivities = statusActivities.filter((activity) => {
          return (
            activity.ac_type === 'soft' &&
            activity.ac_end_register &&
            activity.ac_end_register > new Date()
          );
        });

        // เรียงลำดับกิจกรรมตาม ac_end_register ที่ใกล้ที่สุด
        softActivities.sort((a, b) => {
          if (!a.ac_end_register || !b.ac_end_register) return 0;
          return a.ac_end_register.getTime() - b.ac_end_register.getTime();
        });

        // แนะนำกิจกรรมที่ต้องการจนกว่าจะครบ
        for (let activity of softActivities) {
          if (needSoft <= 0) break;

          // ตรวจสอบว่ากิจกรรมนี้ได้ถูกแนะนำแล้วหรือยัง
          if (recommendedActivityIds.has(activity.ac_id)) continue;

          const availableTime = activity.ac_scope_time ?? 0;
          if (availableTime > needSoft) {
            recommendedActivities.push({
              name: activity.ac_name,
              type: activity.ac_type,
              seat: activity.ac_seat,
              registerCount: activity.ac_registered_count,
              start_time: activity.ac_start_time,
              end_register: activity.ac_end_register,
            });
            recommendedActivityIds.add(activity.ac_id); // บันทึก ID ของกิจกรรมที่แนะนำแล้ว
            needSoft = 0;
          } else {
            recommendedActivities.push({
              name: activity.ac_name,
              type: activity.ac_type,
              seat: activity.ac_seat,
              registerCount: activity.ac_registered_count,
              start_time: activity.ac_start_time,
              end_register: activity.ac_end_register,
            });
            recommendedActivityIds.add(activity.ac_id); // บันทึก ID ของกิจกรรมที่แนะนำแล้ว
            needSoft -= availableTime;
          }
        }
      }

      if (needHard > 0) {
        // ค้นหากิจกรรมที่ประเภท hard ที่เปิดให้ลงทะเบียน
        const hardActivities = statusActivities.filter((activity) => {
          return (
            activity.ac_type === 'hard' &&
            activity.ac_end_register &&
            activity.ac_end_register > new Date()
          );
        });

        // เรียงลำดับกิจกรรมตาม ac_end_register ที่ใกล้ที่สุด
        hardActivities.sort((a, b) => {
          if (!a.ac_end_register || !b.ac_end_register) return 0;
          return a.ac_end_register.getTime() - b.ac_end_register.getTime();
        });

        // แนะนำกิจกรรมที่ต้องการจนกว่าจะครบ
        for (let activity of hardActivities) {
          if (needHard <= 0) break;

          // ตรวจสอบว่ากิจกรรมนี้ได้ถูกแนะนำแล้วหรือยัง
          if (recommendedActivityIds.has(activity.ac_id)) continue;

          const availableTime = activity.ac_scope_time ?? 0;
          if (availableTime > needHard) {
            recommendedActivities.push({
              name: activity.ac_name,
              type: activity.ac_type,
              seat: activity.ac_seat,
              registerCount: activity.ac_registered_count,
              start_time: activity.ac_start_time,
              end_register: activity.ac_end_register,
            });
            recommendedActivityIds.add(activity.ac_id); // บันทึก ID ของกิจกรรมที่แนะนำแล้ว
            needHard = 0;
          } else {
            recommendedActivities.push({
              name: activity.ac_name,
              type: activity.ac_type,
              seat: activity.ac_seat,
              registerCount: activity.ac_registered_count,
              start_time: activity.ac_start_time,
              end_register: activity.ac_end_register,
            });
            recommendedActivityIds.add(activity.ac_id); // บันทึก ID ของกิจกรรมที่แนะนำแล้ว
            needHard -= availableTime;
          }
        }
      }

      return recommendedActivities;
    } catch (error) {
      logger.error('❌ Error in recommendActivities', { error });
      throw error;
    }
  }


  async calculateRiskActivities(u_id: number): Promise<CustomRiskActivity[]> {
    try {
      const users = await this.activityDao.getUsersById(u_id);
      if (users.length === 0) {
        throw new Error(`User with id=${u_id} not found.`);
      }

      const statusActivities = await this.activityDao.getStatusActivities();
      const eventCoopActivities = await this.activityDao.getEventCoopActivities();
      const recommendedActivities = await this.recommendActivities(u_id); // ใช้ recommendedActivities ที่คุณมี
      const result: CustomRiskActivity[] = [];

      for (let user of users) {
        if (!user.u_fullname) {
          throw new Error('User fullname is missing');
        }

        const softRequired = 30; // ค่า soft ที่ต้องการ
        const hardRequired = 10; // ค่า hard ที่ต้องการ

        const softCurrent = user.u_soft_hours ?? 0;
        const hardCurrent = user.u_hard_hours ?? 0;

        const needSoft = softRequired - softCurrent;
        const needHard = hardRequired - hardCurrent;

        // คำนวณ softRisk และ hardRisk
        let softRisk = needSoft > 0 ? (needSoft / softRequired) * 100 : 0;
        let hardRisk = needHard > 0 ? (needHard / hardRequired) * 100 : 0;

        softRisk = Math.round(softRisk);
        hardRisk = Math.round(hardRisk);

        // ตรวจสอบเงื่อนไขที่ให้ softRisk เป็น 0% เมื่อ softCurrent = 30
        if (softCurrent === 30) {
          softRisk = 0;
        }

        // ตรวจสอบเงื่อนไขที่ให้ hardRisk เป็น 0% เมื่อ hardCurrent = 10
        if (hardCurrent === 10) {
          hardRisk = 0;
        }

        // ตรวจสอบว่า softRisk และ hardRisk ไม่เกิน 100
        if (softRisk >= 100) {
          softRisk = 100;
        }
        if (hardRisk >= 100) {
          hardRisk = 100;
        }
        // อัพเดทข้อมูลความเสี่ยงในฐานข้อมูล
        await this.activityDao.updateUserRiskSoft(u_id, softRisk);
        await this.activityDao.updateUserRiskHard(u_id, hardRisk);

        // คำนวณ timeFactor ขึ้นอยู่กับเวลาที่เหลือจนถึง e_date
        const eventCoopDate = moment(eventCoopActivities[0]?.e_date); // วันที่สิ้นสุดกิจกรรม
        const timeLeftForEvent = eventCoopDate.diff(moment(), 'days'); // คำนวณระยะเวลาเหลือจนถึงวันที่ e_date

        let timeFactor = 1;
        if (timeLeftForEvent > 90) {
          timeFactor = 1;
        } else if (timeLeftForEvent <= 90 && timeLeftForEvent > 60) {
          timeFactor = 1.1;
        } else if (timeLeftForEvent <= 60 && timeLeftForEvent > 30) {
          timeFactor = 1.2;
        } else if (timeLeftForEvent <= 30 && timeLeftForEvent > 10) {
          timeFactor = 1.5;
        } else if (timeLeftForEvent <= 10) {
          timeFactor = 2;
        }

        // ปรับค่าความเสี่ยงให้สัมพันธ์กับ timeFactor และเวลาที่เหลือ
        softRisk *= timeFactor;
        hardRisk *= timeFactor;

        result.push({
          user: user.u_fullname,
          needSoft,
          needHard,
          softCurrent,
          hardCurrent,
          softRisk,
          hardRisk,
          recommendedActivities,  // ส่งออกกิจกรรมที่แนะนำ
          timeLeftForEvent, // เวลาที่เหลือจนถึงวันที่ e_date
        });
      }

      return result;
    } catch (error) {
      logger.error('❌ Error in calculateRiskActivities(Student)', { error });
      throw error;
    }
  }



}
