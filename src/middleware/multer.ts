import multer from "multer";

// 📌 ใช้ memoryStorage() แทน diskStorage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

export default upload;
