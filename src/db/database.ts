import { createConnection } from 'typeorm';
import { Users } from '../entity/Users';
import dotenv from 'dotenv';
import { EventCoop } from '../entity/EventCoop';
import { Certificate } from '../entity/Certificate';
import { Question } from '../entity/Question';
import { Assessment } from '../entity/Assessment';
import { Activity } from '../entity/Activity';
import { ActivityAssessment } from '../entity/ActivityAssessment';
import { UserActivity } from '../entity/UserActivity';
import { EventCoop } from '../entity/EventCoop';
import { Certificate } from '../entity/Certificate';
import { Question } from '../entity/Question';
import { Choice } from '../entity/Choice';
import { UserChoice } from '../entity/UserChoice';

dotenv.config();

export const connectDatabase = async () => {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        User,
        Activity,
        Assessment,
        UserActivity,
        EventCoop,
        Certificate,
        Choice,
        UserChoice,
        Question,
      ],
      // synchronize: true,
      logging: false, // เปิด log การเชื่อมต่อเพื่อดูข้อความ error
      ssl: {
        rejectUnauthorized: false, // หากไม่ต้องการให้เกิดข้อผิดพลาดจาก certificate
      },
    });
    console.log('Database connected successfully');
    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ', error);
    throw new Error('การเชื่อมต่อฐานข้อมูลล้มเหลว');
  }
};
