import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// โหลดตัวแปรจากไฟล์ .env
dotenv.config();

// กำหนดค่าการตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_SECRET_KEY as string,
});

// ส่งออก Cloudinary Instance
export default cloudinary;
