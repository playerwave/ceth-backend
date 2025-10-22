import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ สำหรับ bulk-create-activities: ใช้ memoryStorage เพื่ออ่านไฟล์จาก buffer
const memoryStorage = multer.memoryStorage();

// ✅ สำหรับ create-activity ปกติ: ใช้ diskStorage เพื่อเก็บไฟล์ภาพ
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// ✅ Default upload (สำหรับภาพ)
const upload = multer({ 
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    // รองรับไฟล์ Excel และ CSV
    const allowedMimes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv', // .csv
      'application/csv' // .csv (alternative)
    ];
    
    const allowedExtensions = ['.xls', '.xlsx', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      const error = new Error('รองรับเฉพาะไฟล์ .xls, .xlsx, และ .csv เท่านั้น');
      cb(error as any, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ✅ Upload สำหรับ bulk activities (อ่านจาก memory)
export const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    const allowedExtensions = ['.xls', '.xlsx', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      const error = new Error('รองรับเฉพาะไฟล์ .xls, .xlsx, และ .csv เท่านั้น');
      cb(error as any, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ✅ Upload สำหรับรูปภาพ (Certificate Template, Activity Images)
export const uploadImage = multer({
  storage: memoryStorage, // ✅ เปลี่ยนเป็น memoryStorage เพื่อให้มี buffer
  fileFilter: (req, file, cb) => {
    console.log("🔍 [Multer] File filter - File info:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding
    });
    // รองรับไฟล์รูปภาพ
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log("✅ [Multer] File accepted:", file.originalname);
      cb(null, true);
    } else {
      console.log("❌ [Multer] File rejected:", file.originalname, "MIME:", file.mimetype);
      const error = new Error('รองรับเฉพาะไฟล์รูปภาพ (.jpg, .jpeg, .png, .gif, .webp) เท่านั้น');
      cb(error as any, false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

export default upload;
