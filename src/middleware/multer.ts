import multer, { StorageEngine } from "multer";
import { Request } from "express";

// กำหนด Storage แบบ DiskStorage
const storage: StorageEngine = multer.diskStorage({
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, file.originalname);
  }
});

// สร้างตัวแปร upload สำหรับใช้งาน Middleware
const upload = multer({ storage });

export default upload;

